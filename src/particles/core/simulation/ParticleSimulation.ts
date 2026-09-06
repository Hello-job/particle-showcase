import {
  Color,
  Float32BufferAttribute,
  HalfFloatType,
  NearestFilter,
  NoBlending,
  Points,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import type { BufferGeometry, Camera, Object3D, Texture, WebGLRenderer } from "three";
import type { ParticleMotionState } from "../animation";
import type { ParticleField } from "../field";
import { particleMotionMass, PARTICLE_MOTION_SETTLE_SECONDS } from "../motion";

type ParticlePoints = Points<BufferGeometry, ShaderMaterial>;

/** Stores each particle's pointer displacement in a ping-pong GPU texture. */
export class ParticleSimulation {
  readonly texture = new Uniform<Texture | null>(null);
  readonly sourceUvs = new Map<Object3D, Vector3>();
  readonly age = new Uniform(PARTICLE_MOTION_SETTLE_SECONDS);
  private readonly scene = new Scene();
  private readonly particles: { source: ParticlePoints; simulation: ParticlePoints }[] = [];
  private readonly materials: ShaderMaterial[] = [];
  private readonly pointer = new Uniform(new Vector2());
  private readonly previous = new Uniform(new Vector2());
  private readonly impulse = new Uniform(new Vector2());
  private readonly enabled = new Uniform(1);
  private readonly clearColor = new Color();
  private front: WebGLRenderTarget;
  private back: WebGLRenderTarget;
  private epoch = -1;
  private initialized = false;
  private frame = -1;
  private programs: WebGLProgram[] | null = null;
  private prepared = false;

  constructor(field: ParticleField) {
    const sourcePoints: ParticlePoints[] = [];
    field.group.traverse((object) => {
      if (object instanceof Points && object.material instanceof ShaderMaterial) {
        sourcePoints.push(object as ParticlePoints);
      }
    });
    const textureWidth = 128;
    const textureHeight = Math.max(
      1,
      Math.ceil(
        sourcePoints.reduce(
          (count, points) => count + points.geometry.getAttribute("position").count,
          0,
        ) / textureWidth,
      ),
    );
    this.front = new WebGLRenderTarget(textureWidth, textureHeight, {
      type: HalfFloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.back = this.front.clone();
    this.texture.value = this.front.texture;

    let particleOffset = 0;
    for (const points of sourcePoints) {
      const material = points.material;
      const count = points.geometry.getAttribute("position").count;
      const motionUvs = new Float32Array(3 * count);
      const starScale = points.geometry.getAttribute("starScale");
      const particleScale = points.geometry.getAttribute("particleScale");
      for (let index = 0; index < count; index++) {
        motionUvs[3 * index] = (((particleOffset + index) % textureWidth) + 0.5) / textureWidth;
        motionUvs[3 * index + 1] =
          (Math.floor((particleOffset + index) / textureWidth) + 0.5) / textureHeight;
        motionUvs[3 * index + 2] = particleMotionMass(
          starScale ? 0.35 + 3.8 * starScale.getX(index) : 1 + 1.35 * particleScale.getX(index),
        );
      }
      particleOffset += count;
      points.geometry.setAttribute("particleMotionUv", new Float32BufferAttribute(motionUvs, 3));
      Object.assign(material.uniforms, {
        uParticleMotionEnabled: this.enabled,
        uParticleMotionTexture: this.texture,
        uParticleMotionAge: this.age,
        uParticleMotionPointer: this.pointer,
        uParticleMotionPrevious: this.previous,
        uParticleMotionImpulse: this.impulse,
      });
      material.needsUpdate = true;
      const simulationMaterial = new ShaderMaterial({
        uniforms: material.uniforms,
        defines: { ...material.defines, ASTRA_PARTICLE_SIMULATION: 1 },
        vertexShader: material.vertexShader,
        fragmentShader:
          "varying vec4 vParticleMotionState; void main() { gl_FragColor = vParticleMotionState; }",
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      this.materials.push(simulationMaterial);
      const simulation = new Points(points.geometry, simulationMaterial);
      simulation.matrixAutoUpdate = false;
      simulation.frustumCulled = false;
      this.scene.add(simulation);
      this.particles.push({ source: points, simulation });

      const pathLayer = field.pathLayers.find((layer) => layer.starMaterial === material);
      const heroParticles = points.geometry.getAttribute("starHero");
      if (pathLayer?.flareSource && heroParticles) {
        for (let index = 0; index < heroParticles.count; index++) {
          if (heroParticles.getX(index) > 0.5) {
            this.sourceUvs.set(
              pathLayer.flareSource,
              new Vector3(motionUvs[3 * index], motionUvs[3 * index + 1], motionUvs[3 * index + 2]),
            );
            break;
          }
        }
      }
    }
  }

  /** Start compilation once, then poll the GPU extension without blocking a frame. */
  prepare(renderer: WebGLRenderer, camera: Camera): boolean {
    if (this.prepared) return true;
    if (this.programs === null) {
      const previousTarget = renderer.getRenderTarget();
      const compilationTarget = new WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      });
      try {
        renderer.setRenderTarget(compilationTarget);
        renderer.compile(this.scene, camera);
      } finally {
        renderer.setRenderTarget(previousTarget);
        compilationTarget.dispose();
      }
      this.programs = (renderer.info.programs ?? []).map(
        (program) => program.program as WebGLProgram,
      );
      return false;
    }
    const context = renderer.getContext();
    const parallelCompile = context.getExtension("KHR_parallel_shader_compile");
    if (
      parallelCompile &&
      this.programs.every((program) =>
        context.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR),
      )
    ) {
      this.prepared = true;
      this.programs = [];
    }
    return this.prepared;
  }

  reset(): void {
    this.initialized = false;
    this.age.value = PARTICLE_MOTION_SETTLE_SECONDS;
  }

  update(renderer: WebGLRenderer, camera: Camera, motion: ParticleMotionState): void {
    if (motion.frame === this.frame) return;
    this.frame = motion.frame;
    if (motion.epoch !== this.epoch || motion.remaining <= 0) this.reset();
    this.epoch = motion.epoch;
    this.age.value = Math.min(
      PARTICLE_MOTION_SETTLE_SECONDS,
      this.age.value + Math.max(motion.delta, 0),
    );
    if (
      motion.scrollCooldown > 0 ||
      ((motion.active || motion.remaining > 0) && !this.prepare(renderer, camera)) ||
      motion.impulse.lengthSq() <= 1e-8
    )
      return;

    const previousTarget = renderer.getRenderTarget();
    const previousAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clearColor);
    renderer.setClearColor(0, 0);
    try {
      if (!this.initialized) {
        renderer.setRenderTarget(this.front);
        renderer.clear();
        this.age.value = 0;
        this.initialized = true;
      }
      this.pointer.value.copy(motion.pointer);
      this.previous.value.copy(motion.previous);
      this.impulse.value.copy(motion.impulse);
      for (const { source, simulation } of this.particles) {
        source.updateWorldMatrix(true, false);
        simulation.matrix.copy(source.matrixWorld);
      }
      renderer.setRenderTarget(this.back);
      renderer.render(this.scene, camera);
      [this.front, this.back] = [this.back, this.front];
      this.texture.value = this.front.texture;
      this.age.value = 0;
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(this.clearColor, previousAlpha);
    }
  }

  dispose(): void {
    this.programs = [];
    this.front.dispose();
    this.back.dispose();
    for (const material of this.materials) material.dispose();
    this.scene.clear();
    this.sourceUvs.clear();
  }
}
