import { BlendFunction, Effect } from "postprocessing";
import { MathUtils, Uniform, Vector2, Vector3 } from "three";
import type { Camera, DataTexture, Object3D, Texture } from "three";
import type { RuntimeConfig } from "../config";
import { PARTICLE_MOTION_SETTLE_SECONDS } from "../motion";
import { LENS_FLARE_FRAGMENT, LENS_FLARE_VERTEX } from "./shaders";

type FlareConfig = RuntimeConfig["lensFlare"];
type DirtyGlassConfig = RuntimeConfig["dirtyGlass"];
export interface OpticsQuality {
  secondarySourceCount?: number;
  distortion?: boolean;
}
interface LensInteraction {
  config: RuntimeConfig["interaction"];
  lensPointer: Vector2;
  lensStrength: number;
}

const DEFAULT_DIRTY_GLASS: DirtyGlassConfig = Object.freeze({
  distortion: 0.68,
  drift: true,
  driftStrength: 0.28,
  enabled: true,
  grain: 0.031,
  procedural: 0,
  texture: 0,
});

function createFlareUniforms(flare: FlareConfig, dirtTexture: DataTexture, dirt: DirtyGlassConfig) {
  const image = dirtTexture.image;
  return {
    uParticleMotionTexture: new Uniform<Texture | null>(null),
    uParticleMotionAge: new Uniform(PARTICLE_MOTION_SETTLE_SECONDS),
    uPrimaryMotionUv: new Uniform(new Vector3(-1, -1, 1)),
    uSecondaryMotionUvs: new Uniform(Array.from({ length: 5 }, () => new Vector3(-1, -1, 1))),
    uAnimated: new Uniform(Number(flare.animated)),
    uAspect: new Uniform(1),
    uCenter: new Uniform(new Vector2(0.5, 0.5)),
    uDirtTexture: new Uniform(dirtTexture),
    uDirtTextureAspect: new Uniform(
      image?.width && image.height ? image.width / image.height : 2 / 3,
    ),
    uDirtTextureOffset: new Uniform(new Vector2()),
    uDirtTextureRotation: new Uniform(0),
    uDirtyGlassEnabled: new Uniform(Number(dirt.enabled)),
    uDistortion: new Uniform(dirt.distortion),
    uFlareEnabled: new Uniform(Number(flare.enabled)),
    uGhosts: new Uniform(flare.ghosts),
    uGrain: new Uniform(dirt.grain),
    uHalo: new Uniform(flare.halo),
    uIntensity: new Uniform(flare.intensity),
    uProceduralDirt: new Uniform(dirt.procedural),
    uSecondaryCenters: new Uniform(Array.from({ length: 5 }, () => new Vector2(-2, -2))),
    uSecondaryIntensity: new Uniform(flare.secondary),
    uSecondaryVisibility: new Uniform(Array.from({ length: 5 }, () => 0)),
    uStreakLength: new Uniform(flare.streakLength),
    uStreaks: new Uniform(flare.streaks),
    uTime: new Uniform(0),
    uTextureDirt: new Uniform(dirt.texture),
    uVerticalStreaks: new Uniform(flare.verticalStreaks),
    uVisibility: new Uniform(1),
  };
}

function projectedVisibility(position: Vector3): number {
  if (
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    position.z < -1 ||
    position.z > 1
  )
    return 0;
  const distanceFromCenter = Math.max(Math.abs(position.x), Math.abs(position.y));
  return 1 - MathUtils.smoothstep(distanceFromCenter, 0.88, 1.08);
}
function applyLensMagnification(
  position: Vector3,
  interaction: LensInteraction | undefined,
  viewportHeight: number,
): void {
  if (!interaction) return;
  const { x, y } = position;
  const radius =
    (2 * MathUtils.clamp(interaction.config.radius, 32, 360)) / Math.max(viewportHeight, 1);
  const distance = Math.hypot(x - interaction.lensPointer.x, y - interaction.lensPointer.y);
  const magnification =
    1 +
    (1 - MathUtils.smoothstep(distance, 0, radius)) *
      Math.max(interaction.lensStrength, 0) *
      MathUtils.clamp(interaction.config.magnification, -0.3, 0.8);
  position.x = interaction.lensPointer.x + (x - interaction.lensPointer.x) * magnification;
  position.y = interaction.lensPointer.y + (y - interaction.lensPointer.y) * magnification;
}

/** Adds optical halos, streaks and dirt around the tracked bright particles. */
export class AstraLensFlareEffect extends Effect {
  private readonly parameters: ReturnType<typeof createFlareUniforms>;
  private readonly dirtDriftOffset = new Vector2();
  private dirtDriftRotation = 0;
  private readonly projectedPosition = new Vector3();
  private readonly secondaryProjectedPositions = Array.from({ length: 5 }, () => new Vector3());
  private animated: boolean;
  private viewportAspect = 1;
  private viewportHeight = 1;

  constructor(
    flare: FlareConfig,
    dirtTexture: DataTexture,
    dirt: DirtyGlassConfig = DEFAULT_DIRTY_GLASS,
    quality: OpticsQuality = {},
  ) {
    const parameters = createFlareUniforms(flare, dirtTexture, dirt);
    const sourceCount = quality.secondarySourceCount;
    super("AstraLensFlare", LENS_FLARE_FRAGMENT, {
      blendFunction: BlendFunction.NORMAL,
      vertexShader: LENS_FLARE_VERTEX,
      defines: new Map([
        [
          "ASTRA_SECONDARY_SOURCES",
          String(
            sourceCount !== undefined && Number.isFinite(sourceCount)
              ? MathUtils.clamp(Math.floor(sourceCount), 0, 5)
              : 5,
          ),
        ],
        ["ASTRA_DISTORTION", quality.distortion === false ? "0" : "1"],
      ]),
      uniforms: new Map(Object.entries(parameters)),
    });
    this.parameters = parameters;
    this.animated = flare.animated;
  }

  setConfig(config: FlareConfig): void {
    this.animated = config.animated;
    this.parameters.uAnimated.value = Number(this.animated);
    this.parameters.uFlareEnabled.value = Number(config.enabled);
    this.parameters.uGhosts.value = config.ghosts;
    this.parameters.uHalo.value = config.halo;
    this.parameters.uIntensity.value = config.intensity;
    this.parameters.uSecondaryIntensity.value = config.secondary;
    this.parameters.uStreakLength.value = config.streakLength;
    this.parameters.uStreaks.value = config.streaks;
    this.parameters.uVerticalStreaks.value = config.verticalStreaks;
  }
  setDirtyGlass(config: DirtyGlassConfig): void {
    this.parameters.uDirtyGlassEnabled.value = Number(config.enabled);
    this.parameters.uDistortion.value = config.distortion;
    this.parameters.uGrain.value = config.grain;
    this.parameters.uProceduralDirt.value = config.procedural;
    this.parameters.uTextureDirt.value = config.texture;
  }
  updateDirtDrift(
    rotationX: number,
    rotationY: number,
    rotationZ: number,
    config: DirtyGlassConfig,
    reducedMotion: boolean,
  ): void {
    const strength =
      config.drift && !reducedMotion ? MathUtils.clamp(config.driftStrength, 0, 1) : 0;
    this.dirtDriftOffset.set(
      -(0.032 * Math.sin(rotationY + 0.35 * rotationZ)) * strength,
      0.032 * Math.sin(rotationX - 0.2 * rotationZ) * strength,
    );
    this.dirtDriftRotation = -(0.055 * Math.sin(rotationZ + 0.5 * rotationY)) * strength;
    this.parameters.uDirtTextureOffset.value.copy(this.dirtDriftOffset);
    this.parameters.uDirtTextureRotation.value = this.dirtDriftRotation;
  }
  setViewport(width: number, height: number): void {
    this.viewportAspect = Math.max(width, 1) / Math.max(height, 1);
    this.viewportHeight = Math.max(height, 1);
    this.parameters.uAspect.value = this.viewportAspect;
  }
  setParticleMotion(
    texture: Texture | null,
    age: number,
    primary: Vector3 | undefined,
    secondary: (Vector3 | undefined)[],
  ): void {
    this.parameters.uParticleMotionTexture.value = texture;
    this.parameters.uParticleMotionAge.value = age;
    const primaryUniform = this.parameters.uPrimaryMotionUv.value;
    if (primary) primaryUniform.copy(primary);
    else primaryUniform.set(-1, -1, 1);
    for (let index = 0; index < 5; index++) {
      const source = secondary[index];
      const uniform = this.parameters.uSecondaryMotionUvs.value[index];
      if (source) uniform.copy(source);
      else uniform.set(-1, -1, 1);
    }
  }
  updateSources(
    primary: Object3D,
    secondary: Object3D[],
    camera: Camera,
    elapsed: number,
    reducedMotion: boolean,
    visibility = 1,
    interaction?: LensInteraction,
  ): void {
    camera.updateMatrixWorld();
    primary.getWorldPosition(this.projectedPosition).project(camera);
    applyLensMagnification(this.projectedPosition, interaction, this.viewportHeight);
    this.parameters.uCenter.value.set(
      0.5 * this.projectedPosition.x + 0.5,
      0.5 * this.projectedPosition.y + 0.5,
    );
    this.parameters.uTime.value = reducedMotion ? 0 : elapsed;
    this.parameters.uAnimated.value = Number(!reducedMotion && this.animated);
    this.parameters.uVisibility.value =
      projectedVisibility(this.projectedPosition) *
      MathUtils.clamp(visibility, 0, 1) *
      MathUtils.clamp(primary.scale.x, 0, 1);
    const centers = this.parameters.uSecondaryCenters.value;
    const visibilities = this.parameters.uSecondaryVisibility.value;
    for (let index = 0; index < 5; index++) {
      const source = secondary[index];
      const projected = this.secondaryProjectedPositions[index];
      const center = centers[index];
      if (!source) {
        center.set(-2, -2);
        visibilities[index] = 0;
        continue;
      }
      source.getWorldPosition(projected).project(camera);
      applyLensMagnification(projected, interaction, this.viewportHeight);
      center.set(0.5 * projected.x + 0.5, 0.5 * projected.y + 0.5);
      visibilities[index] = MathUtils.clamp(source.scale.x, 0, 1) * projectedVisibility(projected);
    }
  }
}
