import {
  BlendFunction,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import type { Effect, Pass } from "postprocessing";
import {
  ACESFilmicToneMapping,
  Color,
  Group,
  HalfFloatType,
  MathUtils,
  NoToneMapping,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import type { Texture } from "three";
import type { AstraRendererProfile } from "../engine/types";
import type { AnimationState, ParticleMotionState } from "./animation";
import type { RuntimeConfig } from "./config";
import { generateAstraField } from "./field";
import type { ParticleField } from "./field";
import { AstraBloomEffect } from "./postprocessing/Bloom";
import { AstraLensFlareEffect } from "./postprocessing/LensFlare";
import type { OpticsQuality } from "./postprocessing/LensFlare";
import { createDirtTexture } from "./postprocessing/lens-dirt";
import { ParticleSimulation } from "./simulation/ParticleSimulation";

interface Disposable {
  dispose(): void;
}
interface RendererOptions {
  invalidate?(): void;
}
export interface RendererQuality {
  available: boolean;
  tier: number;
  pixelRatio: number;
  antialias: boolean;
  maxParticleCount: number;
  continuousMotion: boolean;
  postprocessing: ReturnType<AstraRendererProfile["getPostprocessing"]>;
  multisampling: number;
  bloomLevels: number;
  bloomResolutionScale: number;
  optics: OpticsQuality | null;
}
export interface ParticleRenderer {
  field: ParticleField;
  camera: OrthographicCamera;
  animationRoot: Group;
  spinRoot: Group;
  quality: RendererQuality;
  ready: Promise<void>;
  resize(width: number, height: number, pixelRatio?: number): void;
  render(
    delta: number,
    state: AnimationState,
    config?: RuntimeConfig,
    reducedMotion?: boolean,
  ): void;
  dispose(): void;
}

/** Caps physical pixels as well as DPR, to keep large displays within the original GPU budget. */
export function resolvePixelRatio(
  profile: AstraRendererProfile,
  devicePixelRatio: number,
  width?: number,
  height?: number,
): number {
  const [minimum, maximum] = profile.getDpr();
  let ceiling = Number.isFinite(maximum) ? Math.min(1.5, Math.max(0.1, maximum)) : 1;
  if (
    width !== undefined &&
    height !== undefined &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    ceiling = Math.min(ceiling, Math.max(0.5, Math.sqrt(24e5 / (width * height))));
  }
  const floor = Number.isFinite(minimum)
    ? Math.min(ceiling, Math.max(0.1, minimum))
    : Math.min(ceiling, 1);
  const ratio = Math.min(
    ceiling,
    Math.max(floor, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1),
  );
  return Math.min(ceiling, Math.max(0.1, Math.floor(100 * ratio) / 100));
}

export function resolveRendererQuality(
  profile: AstraRendererProfile,
  devicePixelRatio = 1,
  width?: number,
  height?: number,
): RendererQuality {
  const available = profile.canUseWebGL();
  const postprocessing = available ? profile.getPostprocessing() : "none";
  const antialias = available && profile.getAntialias();
  const maximumParticles = profile.getMaxParticleCount();
  const maximumShaderSamples = profile.getMaxShaderSamples();
  const fullPostprocessing = postprocessing === "full";
  return {
    available,
    tier: available ? profile.tier : 0,
    pixelRatio: resolvePixelRatio(profile, devicePixelRatio, width, height),
    antialias,
    maxParticleCount:
      available && Number.isFinite(maximumParticles)
        ? Math.max(0, Math.floor(maximumParticles))
        : 0,
    continuousMotion: available && profile.shouldUseContinuousMotion(),
    postprocessing,
    multisampling: postprocessing !== "none" && antialias ? 2 : 0,
    bloomLevels: fullPostprocessing ? 5 : 3 * Number(postprocessing === "selective"),
    bloomResolutionScale: fullPostprocessing || postprocessing === "selective" ? 0.5 : 0,
    optics: fullPostprocessing
      ? {
          secondarySourceCount: maximumShaderSamples >= 16 ? 5 : maximumShaderSamples >= 8 ? 3 : 1,
          distortion: maximumShaderSamples >= 16,
        }
      : null,
  };
}

function disposeSafely(resource: Disposable | undefined): void {
  try {
    resource?.dispose();
  } catch {
    /* Continue releasing the remaining GPU resources. */
  }
}
function pixelDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}
function sameFlareConfig(
  previous: RuntimeConfig["lensFlare"] | undefined,
  next: RuntimeConfig["lensFlare"],
): boolean {
  return (
    previous?.animated === next.animated &&
    previous.enabled === next.enabled &&
    previous.ghosts === next.ghosts &&
    previous.halo === next.halo &&
    previous.intensity === next.intensity &&
    previous.secondary === next.secondary &&
    previous.streakLength === next.streakLength &&
    previous.streaks === next.streaks &&
    previous.verticalStreaks === next.verticalStreaks
  );
}
function sameDirtyGlassConfig(
  previous: RuntimeConfig["dirtyGlass"] | undefined,
  next: RuntimeConfig["dirtyGlass"],
): boolean {
  return (
    previous?.distortion === next.distortion &&
    previous.drift === next.drift &&
    previous.driftStrength === next.driftStrength &&
    previous.enabled === next.enabled &&
    previous.grain === next.grain &&
    previous.procedural === next.procedural &&
    previous.texture === next.texture
  );
}

/** Builds the scene and optional optics; animation.ts owns the particle transforms. */
export function createAstraRenderer(
  canvas: HTMLCanvasElement,
  config: RuntimeConfig,
  profile: AstraRendererProfile,
  options: RendererOptions = {},
): ParticleRenderer {
  let renderer: WebGLRenderer | undefined;
  let composer: EffectComposer | undefined;
  let field: ParticleField | undefined;
  let lensFlare: AstraLensFlareEffect | undefined;
  let bloom: AstraBloomEffect | undefined;
  let previousBloomIntensity: number | undefined;
  let previousBloomThreshold: number | undefined;
  let previousFlareConfig: RuntimeConfig["lensFlare"] | undefined;
  let previousDirtyGlassConfig: RuntimeConfig["dirtyGlass"] | undefined;
  const getDevicePixelRatio = (): number => canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  const quality = resolveRendererQuality(
    profile,
    getDevicePixelRatio(),
    canvas.clientWidth || undefined,
    canvas.clientHeight || undefined,
  );
  if (!quality.available) throw new Error("Astra requires a supported WebGL renderer profile.");

  let disposed = false;
  const ownedResources = new Set<Disposable>();
  const ownedTextures = new Set<Texture>();
  const disposedTextures = new WeakSet<Texture>();
  const scene = new Scene();
  const animationRoot = new Group();
  const spinRoot = new Group();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  camera.position.set(0, 1.2, 12);
  scene.background = new Color(0);
  scene.add(animationRoot);
  animationRoot.add(spinRoot);
  let resolveReady = (): void => {};
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  function signalReady(invalidate = true): void {
    resolveReady();
    if (invalidate && !disposed) options.invalidate?.();
  }
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    signalReady(false);
    for (const resource of ownedResources) disposeSafely(resource);
    ownedResources.clear();
    disposeSafely(composer);
    composer = undefined;
    disposeSafely(field);
    for (const texture of [...ownedTextures]) {
      ownedTextures.delete(texture);
      if (!disposedTextures.has(texture)) {
        disposedTextures.add(texture);
        disposeSafely(texture);
      }
      texture.image = null;
    }
    lensFlare = undefined;
    bloom = undefined;
    previousBloomIntensity = undefined;
    previousBloomThreshold = undefined;
    previousFlareConfig = undefined;
    previousDirtyGlassConfig = undefined;
    spinRoot.clear();
    animationRoot.clear();
    scene.clear();
    disposeSafely(renderer);
  }
  function own<Resource extends Disposable>(resource: Resource): Resource {
    ownedResources.add(resource);
    return resource;
  }
  function addComposerPass(pass: Pass): void {
    if (!composer) return;
    try {
      composer.addPass(pass);
    } finally {
      if (composer.passes.includes(pass)) ownedResources.delete(pass);
    }
  }

  try {
    let latestParticleMotion: ParticleMotionState | undefined;
    const webglRenderer = (renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: quality.antialias,
      depth: false,
      powerPreference: "high-performance",
    }));
    webglRenderer.debug.checkShaderErrors = true;
    webglRenderer.debug.onShaderError = (context, program, vertexShader, fragmentShader) => {
      const errors = [
        context.getProgramInfoLog(program),
        context.getShaderInfoLog(vertexShader),
        context.getShaderInfoLog(fragmentShader),
      ]
        .filter(Boolean)
        .join("\n");
      throw new Error(`Astra shader compilation failed. ${errors}`);
    };
    webglRenderer.outputColorSpace = SRGBColorSpace;
    webglRenderer.toneMapping =
      quality.postprocessing === "none" ? ACESFilmicToneMapping : NoToneMapping;
    webglRenderer.toneMappingExposure = 1;
    webglRenderer.setClearColor(0, 1);
    webglRenderer.setPixelRatio(quality.pixelRatio);
    const particleField = (field = generateAstraField(config, {
      tier: quality.tier,
      maxParticleCount: quality.maxParticleCount,
      pixelRatio: quality.pixelRatio,
      trackOpticalSources: quality.optics !== null,
    }));
    spinRoot.add(particleField.group);
    for (const layer of particleField.pathLayers)
      layer.starMaterial.uniforms.uBackgroundModelMatrix.value = animationRoot.matrixWorld;
    const simulation =
      webglRenderer.extensions.has("EXT_color_buffer_float") &&
      webglRenderer.extensions.has("KHR_parallel_shader_compile")
        ? own(new ParticleSimulation(particleField))
        : undefined;
    const primaryMotionUv = simulation?.sourceUvs.get(particleField.coreSource);
    const secondaryMotionUvs = particleField.secondarySources.map((source) =>
      simulation?.sourceUvs.get(source),
    );
    particleField.particleMotionEnabled = !!simulation;
    let simulationWarmupScheduled = false;

    if (quality.postprocessing === "none") {
      const materials = new Set(
        particleField.pathLayers.flatMap((layer) =>
          layer.dustMaterial ? [layer.starMaterial, layer.dustMaterial] : [layer.starMaterial],
        ),
      );
      for (const material of materials) {
        material.toneMapped = true;
        material.fragmentShader = `${material.fragmentShader.replace("void main()", "void astraLinearMain()")}
          void main() {
            astraLinearMain();
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `;
      }
    } else {
      composer = new EffectComposer(webglRenderer, {
        depthBuffer: false,
        frameBufferType: HalfFloatType,
        multisampling: quality.multisampling,
      });
      addComposerPass(own(new RenderPass(scene, camera)));
      bloom = own(
        new AstraBloomEffect({
          blendFunction: BlendFunction.ADD,
          intensity: config.bloomIntensity,
          levels: quality.bloomLevels,
          luminanceSmoothing: 0.18,
          luminanceThreshold: config.bloomThreshold,
          mipmapBlur: true,
          radius: 0.72,
        }),
      );
      const effects: Effect[] = [bloom];
      if (quality.optics) {
        const dirtTexture = createDirtTexture();
        ownedTextures.add(dirtTexture);
        lensFlare = own(
          new AstraLensFlareEffect(
            config.lensFlare,
            dirtTexture,
            config.dirtyGlass,
            quality.optics,
          ),
        );
        effects.push(lensFlare);
      }
      effects.push(own(new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })));
      const effectPass = own(new EffectPass(camera, ...effects));
      for (const effect of effects) ownedResources.delete(effect);
      addComposerPass(effectPass);
    }

    function resize(width: number, height: number, devicePixelRatio = getDevicePixelRatio()): void {
      if (disposed) return;
      const pixelWidth = pixelDimension(width);
      const pixelHeight = pixelDimension(height);
      const pixelRatio = resolvePixelRatio(profile, devicePixelRatio, pixelWidth, pixelHeight);
      webglRenderer.setDrawingBufferSize(pixelWidth, pixelHeight, pixelRatio);
      simulation?.reset();
      camera.left = -pixelWidth / 2;
      camera.right = pixelWidth / 2;
      camera.top = pixelHeight / 2;
      camera.bottom = -pixelHeight / 2;
      camera.updateProjectionMatrix();
      composer?.setSize(pixelWidth, pixelHeight, false);
      if (bloom && quality.bloomResolutionScale < 1) {
        bloom.setSize(
          pixelDimension(pixelWidth * pixelRatio * quality.bloomResolutionScale),
          pixelDimension(pixelHeight * pixelRatio * quality.bloomResolutionScale),
        );
      }
      lensFlare?.setViewport(pixelWidth, pixelHeight);
      for (const layer of particleField.pathLayers) {
        layer.starMaterial.uniforms.uPixelRatio.value = pixelRatio;
        if (layer.dustMaterial) layer.dustMaterial.uniforms.uPixelRatio.value = pixelRatio;
      }
    }

    function render(
      delta: number,
      state: AnimationState,
      currentConfig = config,
      reducedMotion = !quality.continuousMotion,
    ): void {
      if (disposed) return;
      const safeDelta = Number.isFinite(delta) ? MathUtils.clamp(delta, 0, 0.05) : 0;
      if (simulation && state.particleMotion) {
        latestParticleMotion = state.particleMotion;
        const view = canvas.ownerDocument.defaultView;
        if (
          !simulationWarmupScheduled &&
          !reducedMotion &&
          currentConfig.interaction.particleRepel &&
          currentConfig.interactionMode !== "none" &&
          view?.requestIdleCallback &&
          view.matchMedia?.("(any-hover: hover)")?.matches
        ) {
          simulationWarmupScheduled = true;
          const callbackId = view.requestIdleCallback(() => {
            if (
              !disposed &&
              canvas.ownerDocument.visibilityState === "visible" &&
              latestParticleMotion?.scrollCooldown === 0
            ) {
              simulation.prepare(webglRenderer, camera);
            }
          });
          own({ dispose: () => view.cancelIdleCallback(callbackId) });
        }
        simulation.update(webglRenderer, camera, state.particleMotion);
        lensFlare?.setParticleMotion(
          simulation.texture.value,
          simulation.age.value,
          primaryMotionUv,
          secondaryMotionUvs,
        );
      }
      if (
        bloom &&
        (previousBloomIntensity !== currentConfig.bloomIntensity ||
          previousBloomThreshold !== currentConfig.bloomThreshold)
      ) {
        previousBloomIntensity = currentConfig.bloomIntensity;
        previousBloomThreshold = currentConfig.bloomThreshold;
        bloom.intensity = currentConfig.bloomIntensity;
        bloom.luminanceMaterial.threshold = currentConfig.bloomThreshold;
      }
      if (lensFlare && !sameFlareConfig(previousFlareConfig, currentConfig.lensFlare)) {
        lensFlare.setConfig(currentConfig.lensFlare);
        previousFlareConfig = { ...currentConfig.lensFlare };
      }
      if (lensFlare && !sameDirtyGlassConfig(previousDirtyGlassConfig, currentConfig.dirtyGlass)) {
        lensFlare.setDirtyGlass(currentConfig.dirtyGlass);
        previousDirtyGlassConfig = { ...currentConfig.dirtyGlass };
      }
      if (lensFlare) {
        const scrollProgress = MathUtils.clamp(state.scrollProgress, 0, 1);
        const centerFade = currentConfig.scrollEffects
          ? MathUtils.smootherstep(scrollProgress, 0.5, 1)
          : 0;
        lensFlare.updateSources(
          particleField.coreSource,
          particleField.secondarySources,
          camera,
          reducedMotion ? 0 : state.elapsed,
          reducedMotion,
          currentConfig.showCenterCluster ? 1 - centerFade : 0,
          {
            config: currentConfig.interaction,
            lensPointer: state.lensPointer,
            lensStrength: currentConfig.interactionMode === "depth-lens" ? state.lensStrength : 0,
          },
        );
        lensFlare.updateDirtDrift(
          spinRoot.rotation.x,
          spinRoot.rotation.y,
          spinRoot.rotation.z,
          currentConfig.dirtyGlass,
          reducedMotion,
        );
      }
      if (composer) composer.render(safeDelta);
      else webglRenderer.render(scene, camera);
    }
    resize(canvas.clientWidth, canvas.clientHeight);
    signalReady();
    return {
      field: particleField,
      camera,
      animationRoot,
      spinRoot,
      quality,
      ready,
      resize,
      render,
      dispose,
    };
  } catch (error) {
    dispose();
    try {
      renderer?.forceContextLoss();
    } catch {
      /* A failed renderer can already have lost its context. */
    }
    throw error;
  }
}
