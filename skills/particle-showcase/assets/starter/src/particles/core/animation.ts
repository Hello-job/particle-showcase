import * as THREE from "three";
import type { Group, OrthographicCamera, Euler, Vector2, Vector3 } from "three";
import type { RuntimeConfig } from "./config";
import type { AstraInput } from "../engine/types";
import type { ParticleField, StarMaterial, DustMaterial } from "./field";
import * as particleMotion from "./motion";
import * as ambientMotion from "./motion";
import * as introMotion from "./motion";
import * as pathMath from "./field";
import * as revealMath from "./geometry";
/** CPU pointer state consumed by the GPU spring/coasting simulation. */
export interface ParticleMotionState {
  pointer: Vector2;
  previous: Vector2;
  impulse: Vector2;
  active: boolean;
  pressed: boolean;
  remaining: number;
  scrollCooldown: number;
  epoch: number;
  frame: number;
  delta: number;
}

/** Persistent animation state; scratch vectors avoid allocations during frame updates. */
export interface AnimationState {
  elapsed: number;
  introElapsed: number;
  growthElapsed: number;
  coreTargetRotation: number;
  coreRotation: number;
  scrollProgress: number;
  tiltProgress: number;
  scatterScrollProgress: number;
  scatterPositionProgress: number;
  shapePositionProgress: number;
  starsOpacity: number;
  hasResolvedInitialPose: boolean;
  lastShapeId: string | null;
  lastShapeSamples: Float32Array | null;
  shapeProgress: number;
  shapeAutoRotation: number;
  introProgress: number;
  scatter: number;
  railPresence: number;
  railContentBounds: Vector2;
  spinRotation: Vector2;
  shapePointerRotation: Vector2;
  shapeRotation: Vector2;
  lensPointer: Vector2;
  lensStrength: number;
  particleMotion: ParticleMotionState;
  pathShapeTexture: ReturnType<typeof pathMath.createPathShapeTexture>;
  scratch: {
    normal: Vector3;
    tangent: Vector3;
    next: Vector3;
    previous: Vector3;
    euler: Euler;
    formed: Vector3;
    relative: Vector3;
    position: Vector3;
    scattered: Vector3;
    dispersedOffset: Vector2;
    range: Vector2;
    center: Vector2;
    size: Vector2;
  };
  dispose(): void;
}

export interface AnimationFrame {
  state: AnimationState;
  config: RuntimeConfig;
  input: AstraInput;
  camera: OrthographicCamera;
  animationRoot: Group;
  spinRoot: Group;
  field: ParticleField;
  viewport: { width: number; height: number };
}

const SCROLL_TILT_RADIANS = THREE.MathUtils.degToRad(-52);
function dampToTarget(current: number, target: number, delta: number, damping = 6): number {
  const next = THREE.MathUtils.damp(current, target, damping, delta);
  return 1e-4 >= Math.abs(target - next) ? target : next;
}
function hasPendingMotion(current: number, target: number): boolean {
  return Math.abs(current - target) > 0.001;
}
function updateParticleUniforms(
  material: StarMaterial | DustMaterial,
  formationEnabled: boolean,
  formationProgress: number,
  introProgress: number,
  growthEnabled: boolean,
  growthProgress: number,
  growthSoftness: number,
  ambientPulse: number,
  settleRatio: number,
  accretion: RuntimeConfig["accretionExhale"],
  lensStrength: number,
  lensPointer: Vector2,
  lensRadius: number,
  viewportAspect: number,
  viewportHeight: number,
  interaction: RuntimeConfig["interaction"],
): void {
  const uniforms = material.uniforms;
  uniforms.uAccretionRatio.value = THREE.MathUtils.clamp(accretion.accretionRatio, 0.12, 0.72);
  uniforms.uAmbientPulse.value = ambientPulse;
  uniforms.uCoreIntensity.value = THREE.MathUtils.clamp(accretion.coreIntensity, 0.5, 3);
  uniforms.uExhaleStrength.value = THREE.MathUtils.clamp(accretion.exhaleStrength, 0, 1.5);
  uniforms.uFormationEnabled.value = Number(formationEnabled);
  uniforms.uFormationProgress.value = formationProgress;
  uniforms.uIntroProgress.value = introProgress;
  uniforms.uGrowthEnabled.value = Number(growthEnabled);
  uniforms.uGrowthProgress.value = growthProgress;
  uniforms.uGrowthSoftness.value = THREE.MathUtils.clamp(growthSoftness, 0.005, 0.3);
  uniforms.uInwardStrength.value = THREE.MathUtils.clamp(accretion.inwardStrength, 0, 3);
  uniforms.uPropagationSoftness.value = THREE.MathUtils.clamp(
    accretion.propagationSoftness,
    0,
    0.6,
  );
  uniforms.uSettleRatio.value = settleRatio;
  uniforms.uLensActive.value = lensStrength;
  uniforms.uLensDepth.value = THREE.MathUtils.clamp(interaction.depthDisplacement, -1.5, 1.5);
  uniforms.uLensIllumination.value = THREE.MathUtils.clamp(interaction.illumination, 0, 2);
  uniforms.uLensMagnification.value = THREE.MathUtils.clamp(interaction.magnification, -0.3, 0.8);
  uniforms.uLensPointer.value.copy(lensPointer);
  uniforms.uLensRadius.value = lensRadius;
  uniforms.uPointerRepelRadius.value =
    (2 * THREE.MathUtils.clamp(interaction.repelRadius, 16, 360)) / Math.max(viewportHeight, 1);
  uniforms.uViewportAspect.value = viewportAspect;
}
export function createAstraAnimationState(
  config: RuntimeConfig,
  initialProgress = 0,
): AnimationState {
  const duration =
    "accretion-exhale" === config.animationPreset
      ? config.accretionExhale.duration
      : "grow" === config.animationPreset
        ? config.grow.duration
        : "converge-tilt" === config.animationPreset
          ? THREE.MathUtils.clamp(config.convergeDuration, 1, 10)
          : 10;
  const shouldPlayIntro = config.animationPlaying && 0 === initialProgress;
  const pathShapeTexture = pathMath.createPathShapeTexture();
  return {
    elapsed: 0,
    introElapsed: shouldPlayIntro ? 0 : duration,
    growthElapsed: shouldPlayIntro ? 0 : duration / config.grow.growthSpeed,
    coreTargetRotation: 0,
    coreRotation: 0,
    scrollProgress: THREE.MathUtils.clamp(initialProgress, 0, 1),
    tiltProgress: THREE.MathUtils.clamp(initialProgress, 0, 1),
    scatterScrollProgress: THREE.MathUtils.clamp(initialProgress, 0, 1.1875),
    scatterPositionProgress: 0,
    shapePositionProgress: 0,
    starsOpacity: 1,
    hasResolvedInitialPose: false,
    lastShapeId: null,
    lastShapeSamples: null,
    shapeProgress: 0,
    shapeAutoRotation: 0,
    introProgress: "converge-tilt" === config.animationPreset && shouldPlayIntro ? 0 : 1,
    scatter: 0,
    railPresence: 0,
    railContentBounds: new THREE.Vector2(0, 1),
    spinRotation: new THREE.Vector2(),
    shapePointerRotation: new THREE.Vector2(),
    shapeRotation: new THREE.Vector2(),
    lensPointer: new THREE.Vector2(),
    lensStrength: 0,
    particleMotion: {
      pointer: new THREE.Vector2(),
      previous: new THREE.Vector2(),
      impulse: new THREE.Vector2(),
      active: false,
      pressed: false,
      remaining: 0,
      scrollCooldown: 0,
      epoch: 0,
      frame: 0,
      delta: 0,
    },
    pathShapeTexture,
    scratch: {
      normal: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      next: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      euler: new THREE.Euler(),
      formed: new THREE.Vector3(),
      relative: new THREE.Vector3(),
      position: new THREE.Vector3(),
      scattered: new THREE.Vector3(),
      dispersedOffset: new THREE.Vector2(),
      range: new THREE.Vector2(),
      center: new THREE.Vector2(),
      size: new THREE.Vector2(),
    },
    dispose: () => pathShapeTexture.dispose(),
  };
}
/** Advance the reference animation, then upload its pose and motion to each layer.
 * animationDelta pauses with autoplay; inputDelta still settles pointer/scroll damping.
 */
export function updateAstraAnimation(
  { state, config, input, camera, animationRoot, spinRoot, field, viewport }: AnimationFrame,
  animationDelta: number,
  inputDelta = animationDelta,
): boolean {
  if (!animationRoot || !spinRoot) {
    return false;
  }
  const safeViewport = {
    width: Number.isFinite(viewport.width) ? Math.max(viewport.width, 1) : 1,
    height: Number.isFinite(viewport.height) ? Math.max(viewport.height, 1) : 1,
  };
  const motionDelta = Number.isFinite(animationDelta)
    ? THREE.MathUtils.clamp(animationDelta, 0, 0.05)
    : 0;
  const frameDelta = Number.isFinite(inputDelta) ? THREE.MathUtils.clamp(inputDelta, 0, 0.05) : 0;
  const scrollProgress = config.scrollEffects ? Math.max(input.progress, 0) : 0;
  const hasScrolled = scrollProgress > 0;
  let hasPendingAnimation = false;
  if (!input.reducedMotion) {
    state.elapsed += motionDelta;
  }
  const introDuration =
    "accretion-exhale" === config.animationPreset
      ? THREE.MathUtils.clamp(config.accretionExhale.duration, 1, 30)
      : "grow" === config.animationPreset
        ? THREE.MathUtils.clamp(config.grow.duration, 1, 30)
        : "converge-tilt" === config.animationPreset
          ? THREE.MathUtils.clamp(config.convergeDuration, 1, 10)
          : 10;
  const growthDuration = introDuration / THREE.MathUtils.clamp(config.grow.growthSpeed, 0.2, 2);
  if (
    hasScrolled &&
    (!state.hasResolvedInitialPose || "converge-tilt" !== config.animationPreset)
  ) {
    state.introElapsed = introDuration;
    state.growthElapsed = growthDuration;
  } else if (!input.reducedMotion && config.animationPlaying && "none" !== config.animationPreset) {
    const nextIntroElapsed = Math.min(state.introElapsed + motionDelta, introDuration);
    state.introElapsed =
      introDuration - nextIntroElapsed <= 1e-4 ? introDuration : nextIntroElapsed;
  }
  if (!(
    hasScrolled ||
    input.reducedMotion ||
    !config.animationPlaying ||
    "grow" !== config.animationPreset
  )) {
    state.growthElapsed = Math.min(state.growthElapsed + motionDelta, growthDuration);
  }
  const introTimeProgress =
    input.reducedMotion || !config.animationPlaying || "none" === config.animationPreset
      ? 1
      : THREE.MathUtils.clamp(state.introElapsed / introDuration, 0, 1);
  const introProgress = "converge-tilt" === config.animationPreset ? introTimeProgress : 1;
  state.introProgress = introProgress;
  const legacyZoomProgress =
    "legacy-zoom" === config.animationPreset ? pathMath.easeOutExpo(introTimeProgress) : 1;
  const formationProgress =
    "accretion-exhale" === config.animationPreset
      ? THREE.MathUtils.smootherstep(introTimeProgress, 0, 1)
      : 1;
  const growthIntroProgress =
    "grow" === config.animationPreset ? THREE.MathUtils.smootherstep(introTimeProgress, 0, 1) : 1;
  const growthProgress =
    "grow" === config.animationPreset
      ? input.reducedMotion || !config.animationPlaying
        ? 1
        : THREE.MathUtils.smootherstep(
            THREE.MathUtils.clamp(state.growthElapsed / growthDuration, 0, 1),
            0,
            1,
          )
      : 1;
  const growthFlowProgress =
    "grow" === config.animationPreset ? THREE.MathUtils.smootherstep(growthProgress, 0.72, 1) : 1;
  // Resolve scroll and input targets before deriving the formation envelopes.
  const targetScrollProgress = THREE.MathUtils.clamp(scrollProgress, 0, 1);
  const snapToInput = input.reducedMotion || !state.hasResolvedInitialPose;
  const targetStarsOpacity = THREE.MathUtils.clamp(input.starsOpacity, 0, 1);
  const starsOpacity = snapToInput
    ? targetStarsOpacity
    : dampToTarget(state.starsOpacity, targetStarsOpacity, frameDelta);
  state.starsOpacity = starsOpacity;
  if (starsOpacity !== targetStarsOpacity) {
    hasPendingAnimation = true;
  }
  const smoothedScrollProgress = snapToInput
    ? targetScrollProgress
    : dampToTarget(state.scrollProgress, targetScrollProgress, frameDelta);
  state.scrollProgress = smoothedScrollProgress;
  if (smoothedScrollProgress !== targetScrollProgress) {
    hasPendingAnimation = true;
  }
  const targetTiltProgress =
    config.scrollEffects && !input.reducedMotion && null !== input.tiltProgress
      ? THREE.MathUtils.clamp(input.tiltProgress, 0, 1)
      : targetScrollProgress;
  const tiltProgress = snapToInput
    ? targetTiltProgress
    : dampToTarget(state.tiltProgress, targetTiltProgress, frameDelta);
  state.tiltProgress = tiltProgress;
  if (tiltProgress !== targetTiltProgress) {
    hasPendingAnimation = true;
  }
  const scatterStart = input.reducedMotion ? 0.5 : 0.375;
  const scatterEnd = input.reducedMotion ? 1 : 1.1875;
  const targetScatterProgress =
    config.scrollEffects && !input.reducedMotion && null !== input.scatterProgress
      ? THREE.MathUtils.lerp(
          scatterStart,
          scatterEnd,
          THREE.MathUtils.clamp(input.scatterProgress, 0, 1),
        )
      : THREE.MathUtils.clamp(scrollProgress, 0, scatterEnd);
  const scatterProgress = snapToInput
    ? targetScatterProgress
    : dampToTarget(state.scatterScrollProgress, targetScatterProgress, frameDelta);
  state.scatterScrollProgress = scatterProgress;
  if (scatterProgress !== targetScatterProgress) {
    hasPendingAnimation = true;
  }
  const scrollFlattenProgress = THREE.MathUtils.smootherstep(smoothedScrollProgress, 0, 0.5);
  const tiltRise = Math.sin(THREE.MathUtils.clamp(tiltProgress / 0.75, 0, 1) * Math.PI * 0.5);
  const tiltFall = 1 - THREE.MathUtils.smootherstep(tiltProgress, 0.75, 1);
  const scatterAmount = THREE.MathUtils.smootherstep(scatterProgress, scatterStart, scatterEnd);
  const targetScatterPosition = THREE.MathUtils.smoothstep(
    THREE.MathUtils.smootherstep(targetScatterProgress, scatterStart, scatterEnd),
    0,
    1,
  );
  const scatterPosition = snapToInput
    ? targetScatterPosition
    : dampToTarget(state.scatterPositionProgress, targetScatterPosition, frameDelta, 4);
  state.scatterPositionProgress = scatterPosition;
  if (scatterPosition !== targetScatterPosition) {
    hasPendingAnimation = true;
  }
  const pathVisibility = (1 - scatterAmount) * THREE.MathUtils.smoothstep(introProgress, 0.55, 1);
  state.scatter = scatterAmount;
  const scrollSizeScale = config.scrollEffects
    ? THREE.MathUtils.lerp(1, 0.45, scrollFlattenProgress)
    : 1;
  if ("legacy-zoom" === config.animationPreset) {
    animationRoot.scale.setScalar(THREE.MathUtils.lerp(2.35, 1, legacyZoomProgress));
    animationRoot.rotation.set(
      THREE.MathUtils.lerp(THREE.MathUtils.degToRad(-42), 0, legacyZoomProgress),
      THREE.MathUtils.lerp(Math.PI, 0, legacyZoomProgress),
      THREE.MathUtils.lerp(THREE.MathUtils.degToRad(5), 0, legacyZoomProgress),
    );
  } else if ("accretion-exhale" === config.animationPreset) {
    const formationScaleProgress = THREE.MathUtils.smootherstep(
      formationProgress,
      THREE.MathUtils.clamp(config.accretionExhale.accretionRatio, 0.12, 0.72),
      1,
    );
    animationRoot.scale.setScalar(
      THREE.MathUtils.lerp(
        THREE.MathUtils.clamp(config.accretionExhale.startScale, 0.3, 1.25),
        1,
        formationScaleProgress,
      ),
    );
    animationRoot.rotation.set(0, 0, 0);
  } else {
    animationRoot.scale.setScalar(1);
    animationRoot.rotation.set(0, 0, 0);
  }
  animationRoot.scale.setScalar(THREE.MathUtils.lerp(animationRoot.scale.x, 1, scatterAmount));
  animationRoot.rotation.x =
    THREE.MathUtils.lerp(animationRoot.rotation.x, 0, scrollFlattenProgress) +
    SCROLL_TILT_RADIANS * tiltRise * tiltFall;
  animationRoot.rotation.y = THREE.MathUtils.lerp(
    animationRoot.rotation.y,
    0,
    scrollFlattenProgress,
  );
  animationRoot.rotation.z = THREE.MathUtils.lerp(
    animationRoot.rotation.z,
    0,
    scrollFlattenProgress,
  );
  const rotationEnabled = +("rotate" === config.interactionMode);
  if (input.reducedMotion) {
    state.spinRotation.set(0, 0);
    spinRoot.rotation.set(0, 0, 0);
  } else {
    const damping = 1 - Math.exp(-(input.returning ? 5.5 : 14) * frameDelta);
    const targetX = rotationEnabled * input.rotation.x;
    const targetY = rotationEnabled * input.rotation.y;
    state.spinRotation.x = THREE.MathUtils.lerp(state.spinRotation.x, targetX, damping);
    state.spinRotation.y = THREE.MathUtils.lerp(state.spinRotation.y, targetY, damping);
    spinRoot.rotation.set(
      state.spinRotation.x * pathVisibility,
      state.spinRotation.y * pathVisibility,
      0,
    );
    if (
      hasPendingMotion(state.spinRotation.x, targetX) ||
      hasPendingMotion(state.spinRotation.y, targetY)
    ) {
      hasPendingAnimation = true;
    }
  }
  const pointer = input.pointer;
  const particleMotionActive = updateParticleMotion(
    state.particleMotion,
    pointer,
    true === field.particleMotionEnabled &&
      !input.reducedMotion &&
      config.interaction.particleRepel &&
      "none" !== config.interactionMode,
    frameDelta,
    input.scrolling,
  );
  if (pointer.reset) {
    state.lensPointer.set(0, 0);
    state.lensStrength = 0;
    pointer.reset = false;
  }
  const depthLensEnabled = !input.reducedMotion && "depth-lens" === config.interactionMode;
  const pointerDamping =
    1 - Math.exp(-THREE.MathUtils.clamp(config.interaction.followDamping, 1, 30) * frameDelta);
  if (input.reducedMotion) {
    state.lensPointer.set(0, 0);
    state.lensStrength = 0;
  } else {
    const targetStrength = depthLensEnabled && pointer.active ? 1 : 0;
    state.lensPointer.x = THREE.MathUtils.lerp(state.lensPointer.x, pointer.x, pointerDamping);
    state.lensPointer.y = THREE.MathUtils.lerp(state.lensPointer.y, pointer.y, pointerDamping);
    state.lensStrength = THREE.MathUtils.lerp(state.lensStrength, targetStrength, pointerDamping);
    if (
      hasPendingMotion(state.lensStrength, targetStrength) ||
      (targetStrength > 0 &&
        (hasPendingMotion(state.lensPointer.x, pointer.x) ||
          hasPendingMotion(state.lensPointer.y, pointer.y)))
    ) {
      hasPendingAnimation = true;
    }
  }
  const targetLensStrength = +!!pointer.active;
  const lensMotionActive =
    !input.reducedMotion &&
    "depth-lens" === config.interactionMode &&
    (Math.abs(state.lensStrength - targetLensStrength) > 1e-4 ||
      (pointer.active &&
        (Math.abs(state.lensPointer.x - pointer.x) > 1e-4 ||
          Math.abs(state.lensPointer.y - pointer.y) > 1e-4)));
  if (!lensMotionActive && "depth-lens" === config.interactionMode) {
    state.lensStrength = targetLensStrength;
    if (pointer.active) {
      state.lensPointer.set(pointer.x, pointer.y);
    }
  }
  const lensStrength = "depth-lens" === config.interactionMode ? state.lensStrength : 0;
  const viewportAspect = safeViewport.width / Math.max(safeViewport.height, 1);
  // Convert DOM normalized device coordinates into the orthographic scene space.
  const worldHeight = safeViewport.width / Math.max(safeViewport.height, 1) < 0.72 ? 12.7 : 10.9;
  const worldWidth = worldHeight * viewportAspect;
  const shape = input.shape;
  const heroShape = shape.hero === true;
  const customHero = input.heroShapeEnabled === true;
  if (
    shape.id &&
    shape.samples &&
    (shape.id !== state.lastShapeId || shape.samples !== state.lastShapeSamples)
  ) {
    state.pathShapeTexture.image.data.set(shape.samples);
    state.pathShapeTexture.needsUpdate = true;
    state.lastShapeId = shape.id;
    state.lastShapeSamples = shape.samples;
  }
  // A custom opening shape is the initial destination. Reuse the
  // original scatter envelopes to release it without revealing six.
  const shapeProgress = heroShape
    ? 1 - scatterAmount
    : snapToInput
      ? shape.strength
      : dampToTarget(state.shapeProgress, shape.strength, frameDelta);
  state.shapeProgress = shapeProgress;
  // Lettering needs proportionate point sizes on narrow screens.
  // These factors are neutral for the whale and original Astra shapes.
  const wordmarkWeight =
    customHero && (shape.filled || shape.id?.startsWith("deepseek-wordmark:")) ? shapeProgress : 0;
  const wordmarkPointScale = THREE.MathUtils.lerp(
    1,
    THREE.MathUtils.clamp(safeViewport.width / 1440, 0.2, 1),
    wordmarkWeight,
  );
  const shapeScatter = THREE.MathUtils.clamp(config.pathShapeScatter, 0, 3) * wordmarkPointScale;
  const targetShapePosition = THREE.MathUtils.smoothstep(shape.strength, 0, 1);
  const shapePosition = heroShape
    ? 1 - scatterPosition
    : snapToInput
      ? targetShapePosition
      : dampToTarget(state.shapePositionProgress, targetShapePosition, frameDelta, 4);
  state.shapePositionProgress = shapePosition;
  if (shapePosition !== targetShapePosition) {
    hasPendingAnimation = true;
  }
  const railPresence = config.scrollEffects
    ? THREE.MathUtils.clamp(heroShape ? scatterAmount : scatterAmount * (1 - shapeProgress), 0, 1)
    : 0;
  const dispersedMotion = input.reducedMotion ? 0 : railPresence;
  state.railPresence = railPresence;
  const scrollDrift = input.reducedMotion
    ? 0
    : scrollProgress * THREE.MathUtils.clamp(config.scrollStarDriftSpeed, 0, 3);
  const starRailIntensity = THREE.MathUtils.lerp(1, 0.18, railPresence);
  const dustRailIntensity = THREE.MathUtils.lerp(1, 0.1, railPresence);
  const flareRailIntensity = THREE.MathUtils.lerp(1, 0.1, railPresence);
  {
    state.hasResolvedInitialPose = true;
    if (shapeProgress !== shape.strength) {
      hasPendingAnimation = true;
    }
    if (input.reducedMotion) {
      state.shapeAutoRotation = 0;
      state.shapePointerRotation.set(0, 0);
      state.shapeRotation.set(0, 0);
    } else {
      const rotationPresence = THREE.MathUtils.smootherstep(shapeProgress, 0.05, 0.4);
      const damping = 1 - Math.exp(-(input.returning ? 5.5 : 14) * frameDelta);
      const targetX = heroShape ? 0 : rotationEnabled * input.rotation.x;
      const targetY = heroShape ? 0 : rotationEnabled * input.rotation.y;
      state.shapePointerRotation.x = THREE.MathUtils.lerp(
        state.shapePointerRotation.x,
        targetX,
        damping,
      );
      state.shapePointerRotation.y = THREE.MathUtils.lerp(
        state.shapePointerRotation.y,
        targetY,
        damping,
      );
      const rotationAmount = THREE.MathUtils.clamp(config.pathShapeAutoRotateAmount, 0, 1.2);
      state.shapeAutoRotation = 0;
      const rotationReveal = THREE.MathUtils.smootherstep(shapeProgress, 0.001, 0.12);
      const turnProgress = THREE.MathUtils.smootherstep(shapeProgress, 0.04, 0.82);
      const autoRotateEnabled = Number(
        !heroShape && config.pathShapeAutoRotate && config.animationPlaying,
      );
      const autoRotationY =
        THREE.MathUtils.lerp(-rotationAmount, 0, turnProgress) * rotationReveal * autoRotateEnabled;
      const pitchEnvelope =
        turnProgress > 0 && turnProgress < 1 ? Math.sin(turnProgress * Math.PI) : 0;
      state.shapeRotation.set(
        state.shapePointerRotation.x * rotationPresence +
          -pitchEnvelope * rotationAmount * 0.34 * rotationReveal * autoRotateEnabled,
        state.shapePointerRotation.y * rotationPresence + autoRotationY,
      );
      if (
        hasPendingMotion(state.shapePointerRotation.x, targetX) ||
        hasPendingMotion(state.shapePointerRotation.y, targetY)
      ) {
        hasPendingAnimation = true;
      }
    }
  }
  state.scratch.center.set(
    shape.centerNdc.x * worldWidth * 0.5,
    shape.centerNdc.y * worldHeight * 0.5,
  );
  state.scratch.size.set(shape.sizeNdc.x * worldWidth * 0.5, shape.sizeNdc.y * worldHeight * 0.5);
  const contentHalfWidth =
    (Math.min(
      0.5 * Math.min(676, Math.max(safeViewport.width - 48, 0)) + 48,
      0.36 * safeViewport.width,
    ) /
      Math.max(safeViewport.width, 1)) *
    worldWidth;
  state.railContentBounds.set(
    input.contentBounds?.left ?? 0.5 - contentHalfWidth / worldWidth,
    input.contentBounds?.right ?? 0.5 + contentHalfWidth / worldWidth,
  );
  const contentLeft = (state.railContentBounds.x - 0.5) * worldWidth;
  const contentRight = (state.railContentBounds.y - 0.5) * worldWidth;
  const cameraGrowthProgress =
    "grow" === config.animationPreset ? THREE.MathUtils.smootherstep(growthIntroProgress, 0, 1) : 1;
  const cameraIntroHeight =
    "grow" === config.animationPreset ? THREE.MathUtils.lerp(0, 1.2, cameraGrowthProgress) : 1.2;
  const cameraHeight = customHero
    ? 0
    : THREE.MathUtils.lerp(cameraIntroHeight, 0, scrollFlattenProgress);
  camera.position.set(0, cameraHeight, 12);
  camera.lookAt(0, cameraHeight, 0);
  const cameraIntroZoom =
    "grow" === config.animationPreset
      ? THREE.MathUtils.lerp(
          THREE.MathUtils.clamp(config.grow.startZoom, 1, 8),
          1,
          cameraGrowthProgress,
        )
      : 1;
  camera.zoom =
    (safeViewport.height / worldHeight) * THREE.MathUtils.lerp(cameraIntroZoom, 1, scatterAmount);
  camera.updateProjectionMatrix();
  const heroViewportHeight = THREE.MathUtils.clamp(
    input.heroViewportHeight ?? safeViewport.height,
    1,
    safeViewport.height,
  );
  animationRoot.position.y =
    ((safeViewport.height - heroViewportHeight) / (2 * camera.zoom)) *
    (1 - scatterAmount) *
    (1 - shapeProgress);
  const scatterWidth = worldHeight * viewportAspect * 1.12;
  const scatterHeight = 1.12 * worldHeight;
  const travelSpeedScale =
    "legacy-zoom" === config.animationPreset
      ? THREE.MathUtils.lerp(8, 1, legacyZoomProgress)
      : "accretion-exhale" === config.animationPreset
        ? THREE.MathUtils.lerp(
            Math.max(1, 4 * config.accretionExhale.inwardStrength),
            1,
            formationProgress,
          )
        : 1;
  const settleRatio = THREE.MathUtils.clamp(
    config.accretionExhale.settleDuration / introDuration,
    0.03,
    0.4,
  );
  const ambientPulse =
    "accretion-exhale" === config.animationPreset &&
    formationProgress >= 0.999 &&
    !input.reducedMotion
      ? 1 +
        Math.sin(
          state.elapsed *
            THREE.MathUtils.clamp(config.accretionExhale.ambientSpeed, 0, 3) *
            Math.PI *
            2,
        ) *
          THREE.MathUtils.clamp(config.accretionExhale.ambientAmount, 0, 0.16)
      : 1;
  const lensRadius =
    (2 * THREE.MathUtils.clamp(config.interaction.radius, 32, 360)) /
    Math.max(safeViewport.height, 1);
  if (field.coreCluster) {
    const coreSpeed = 0.36 * THREE.MathUtils.clamp(config.stars.flowSpeed, 0, 3);
    const coreDirection = "grow" !== config.animationPreset && config.stars.flowInward ? 1 : -1;
    if (input.reducedMotion) {
      state.coreTargetRotation = 0;
      state.coreRotation = 0;
    } else {
      state.coreTargetRotation =
        pathMath.positiveModulo(
          state.coreTargetRotation + motionDelta * coreSpeed * coreDirection + Math.PI,
          2 * Math.PI,
        ) - Math.PI;
      const damping = 1 - Math.exp(-14 * frameDelta);
      const angularDistance = Math.atan2(
        Math.sin(state.coreTargetRotation - state.coreRotation),
        Math.cos(state.coreTargetRotation - state.coreRotation),
      );
      state.coreRotation =
        pathMath.positiveModulo(
          state.coreRotation + angularDistance * damping + Math.PI,
          2 * Math.PI,
        ) - Math.PI;
      if (
        !config.animationPlaying &&
        0 === motionDelta &&
        Math.abs(
          Math.atan2(
            Math.sin(state.coreTargetRotation - state.coreRotation),
            Math.cos(state.coreTargetRotation - state.coreRotation),
          ),
        ) > 0.001
      ) {
        hasPendingAnimation = true;
      }
    }
    field.coreCluster.rotation.set(
      input.reducedMotion || customHero
        ? 0
        : 0.08 * Math.sin(0.22 * state.elapsed) * pathVisibility,
      input.reducedMotion || customHero
        ? 0
        : 0.14 * Math.cos(0.28 * state.elapsed) * pathVisibility,
      customHero ? 0 : state.coreRotation * pathVisibility,
    );
  }
  const rotationLag = THREE.MathUtils.clamp(config.interaction.rotationLag, 0, 1);
  const rotationDamping = input.returning ? 5.5 : 14;
  // Give individual orbit ribbons their original delayed drag response.
  for (const orbit of field.orbits) {
    if (input.reducedMotion) {
      orbit.spin.set(0, 0);
    } else {
      const damping =
        1 - Math.exp(-(rotationDamping / (1 + orbit.lag * rotationLag * 2.5)) * frameDelta);
      const targetX = rotationEnabled * input.rotation.x;
      const targetY = rotationEnabled * input.rotation.y;
      orbit.spin.x = THREE.MathUtils.lerp(orbit.spin.x, targetX, damping);
      orbit.spin.y = THREE.MathUtils.lerp(orbit.spin.y, targetY, damping);
      if (hasPendingMotion(orbit.spin.x, targetX) || hasPendingMotion(orbit.spin.y, targetY)) {
        hasPendingAnimation = true;
      }
    }
    let introPitch = 0;
    let introYaw = 0;
    if ("legacy-zoom" === config.animationPreset) {
      const lagProgress = legacyZoomProgress - legacyZoomProgress ** (1 + 0.9 * orbit.lag);
      introPitch = THREE.MathUtils.degToRad(-42 * lagProgress);
      introYaw = Math.PI * lagProgress;
    }
    orbit.group.rotation.set(
      introPitch + orbit.spin.x * pathVisibility * rotationEnabled - spinRoot.rotation.x,
      introYaw + orbit.spin.y * pathVisibility * rotationEnabled - spinRoot.rotation.y,
      0,
    );
  }
  // Advance path travel, upload shader controls, and match the CPU optical sources.
  for (const layer of field.pathLayers) {
    const flowSpeed = "grow" === config.animationPreset ? layer.outwardSpeed : layer.speed;
    const shapeFlowSpeed = layer.isCore ? 0.022 : Math.abs(flowSpeed);
    const shapeFlowPresence = THREE.MathUtils.smootherstep(shapeProgress, 0.08, 0.5);
    if (!input.reducedMotion) {
      layer.pathShapeTravel = pathMath.positiveModulo(
        layer.pathShapeTravel +
          motionDelta *
            shapeFlowSpeed *
            (config.stars.flowInward ? 1 : -1) *
            THREE.MathUtils.clamp(config.stars.flowSpeed, 0, 3) *
            (shape.flowScale ?? 1) *
            shapeFlowPresence,
        1,
      );
      if ("grow" === config.animationPreset && 0 !== flowSpeed) {
        const growthSpeed =
          Math.abs(flowSpeed) *
          THREE.MathUtils.clamp(config.stars.flowSpeed, 0, 3) *
          growthFlowProgress;
        layer.motionOffset = pathMath.positiveModulo(
          layer.motionOffset + motionDelta * growthSpeed * Math.sign(flowSpeed) * pathVisibility,
          1,
        );
        layer.travel = pathMath.positiveModulo(layer.phase + layer.motionOffset, 1);
      } else {
        layer.motionOffset = pathMath.positiveModulo(
          layer.motionOffset +
            motionDelta *
              flowSpeed *
              THREE.MathUtils.clamp(config.stars.flowSpeed, 0, 3) *
              pathVisibility,
          1,
        );
        layer.travel = pathMath.positiveModulo(
          layer.travel + motionDelta * travelSpeedScale * Math.abs(flowSpeed) * pathVisibility,
          1,
        );
      }
    }
    const travelProgress = input.reducedMotion ? layer.phase : layer.travel;
    const headProgress = flowSpeed < 0 ? 1 - travelProgress : travelProgress;
    const shaderTime = input.reducedMotion
      ? 0
      : "grow" === config.animationPreset
        ? layer.motionOffset
        : state.elapsed;
    {
      layer.starMaterial.uniforms.uTime.value = shaderTime;
      layer.starMaterial.uniforms.uBackgroundStarsEnabled.value = Number(
        "converge-tilt" === config.animationPreset,
      );
      layer.starMaterial.uniforms.uPathSpeed.value =
        "grow" === config.animationPreset && 0 !== flowSpeed ? 1 : flowSpeed;
      layer.starMaterial.uniforms.uPathOffset.value = input.reducedMotion ? 0 : layer.motionOffset;
      layer.starMaterial.uniforms.uPathShapeCenter.value.copy(state.scratch.center);
      layer.starMaterial.uniforms.uPathShapeProgress.value = shapeProgress;
      layer.starMaterial.uniforms.uPathShapePositionProgress.value = shapePosition;
      layer.starMaterial.uniforms.uPathShapeMotion.value = layer.pathShapeTravel;
      layer.starMaterial.uniforms.uPathShapeRotation.value.copy(state.shapeRotation);
      layer.starMaterial.uniforms.uPathShapeScatter.value = shapeScatter;
      layer.starMaterial.uniforms.uPathShapePointScale.value = wordmarkPointScale;
      layer.starMaterial.uniforms.uPathShapeFilled.value = Number(shape.filled === true);
      layer.starMaterial.uniforms.uPathShapeRowSpacing.value = shape.rowSpacing ?? 0;
      layer.starMaterial.uniforms.uPathShapeAccentRange.value.fromArray(
        shape.accentRange ?? [0, 0],
      );
      layer.starMaterial.uniforms.uPathShapeSize.value.copy(state.scratch.size);
      layer.starMaterial.uniforms.uPathShapeTexture.value = state.pathShapeTexture;
      layer.starMaterial.uniforms.uGrowthDirection.value = flowSpeed < 0 ? -1 : 1;
      layer.starMaterial.uniforms.uFlowSpeed.value =
        "grow" === config.animationPreset && 0 !== flowSpeed
          ? pathVisibility
          : THREE.MathUtils.clamp(config.stars.flowSpeed, 0, 3) * pathVisibility;
      layer.starMaterial.uniforms.uTwinkleSpeed.value = input.reducedMotion
        ? 0
        : THREE.MathUtils.clamp(config.stars.twinkleSpeed, 0, 2) * pathVisibility;
      layer.starMaterial.uniforms.uIntensity.value =
        THREE.MathUtils.clamp(
          config.stars.intensity * (layer.isCore ? 1.22 : 1) * starRailIntensity,
          0.1,
          3,
        ) * starsOpacity;
      layer.starMaterial.uniforms.uDispersedMotion.value = dispersedMotion;
      layer.starMaterial.uniforms.uScrollScatter.value = scatterAmount;
      layer.starMaterial.uniforms.uScrollPositionProgress.value = customHero ? 1 : scatterPosition;
      layer.starMaterial.uniforms.uScrollDrift.value = scrollDrift;
      layer.starMaterial.uniforms.uScrollSizeScale.value = THREE.MathUtils.lerp(
        scrollSizeScale,
        0.8,
        wordmarkWeight,
      );
      layer.starMaterial.uniforms.uTextBounds.value.set(contentLeft, contentRight);
      layer.starMaterial.uniforms.uScatterSize.value.set(scatterWidth, scatterHeight);
      updateParticleUniforms(
        layer.starMaterial,
        "accretion-exhale" === config.animationPreset,
        formationProgress,
        introProgress,
        "grow" === config.animationPreset && !layer.isCore,
        growthProgress,
        config.grow.softness,
        ambientPulse,
        settleRatio,
        config.accretionExhale,
        lensStrength,
        state.lensPointer,
        lensRadius,
        viewportAspect,
        safeViewport.height,
        config.interaction,
      );
      if (layer.flareSource) {
        const flareSamples = layer.flarePathSamples;
        const hasFlarePath = null !== flareSamples;
        const flareTravelProgress = pathMath.positiveModulo(
          layer.flareProgress + (input.reducedMotion ? 0 : layer.motionOffset),
          1,
        );
        const flareDensityProgress = hasFlarePath
          ? pathMath.densityProgress(flareTravelProgress, config.stars.densityFalloff)
          : 0;
        let flareProgress = flareDensityProgress;
        let growthVisibility = 1;
        let growthFormation = 1;
        if (hasFlarePath && "grow" === config.animationPreset) {
          const growthDirection = flowSpeed < 0 ? -1 : 1;
          const growthDelay =
            0.24 * (growthDirection > 0 ? flareDensityProgress : 1 - flareDensityProgress);
          const localGrowth = THREE.MathUtils.clamp(
            (growthProgress - growthDelay) / Math.max(1 - growthDelay, 1e-4),
            0,
            1,
          );
          growthFormation = THREE.MathUtils.smoothstep(localGrowth, 0, 1);
          flareProgress = THREE.MathUtils.lerp(
            growthDirection > 0 ? 0 : 1,
            flareDensityProgress,
            growthFormation,
          );
          growthVisibility = THREE.MathUtils.smoothstep(
            growthProgress,
            growthDelay,
            growthDelay + 0.025,
          );
        }
        if (flareSamples) {
          const sampleStep = 1 / Math.max(Math.floor(flareSamples.length / 4) - 1, 1);
          pathMath.samplePath(flareSamples, flareProgress, state.scratch.position);
          pathMath.samplePath(
            flareSamples,
            Math.max(flareProgress - sampleStep, 0),
            state.scratch.previous,
          );
          pathMath.samplePath(
            flareSamples,
            Math.min(flareProgress + sampleStep, 1),
            state.scratch.next,
          );
          state.scratch.tangent.subVectors(state.scratch.next, state.scratch.previous).normalize();
          state.scratch.normal
            .set(-state.scratch.tangent.y, state.scratch.tangent.x, 0)
            .normalize();
          state.scratch.position.addScaledVector(
            state.scratch.normal,
            layer.flareAcrossOffset * growthFormation,
          );
          state.scratch.position.z += layer.flareDepthOffset * growthFormation;
        } else {
          state.scratch.position.copy(layer.flareBasePosition);
        }
        let formationScale = 1;
        if ("accretion-exhale" === config.animationPreset) {
          const radius = Math.hypot(state.scratch.position.x, state.scratch.position.y);
          const localFormation = THREE.MathUtils.clamp(
            formationProgress - radius * config.accretionExhale.propagationSoftness * 0.018,
            0,
            1,
          );
          const accretionRatio = THREE.MathUtils.clamp(
            config.accretionExhale.accretionRatio,
            0.12,
            0.72,
          );
          const exhaleEnd = Math.max(accretionRatio + 0.08, 1 - settleRatio);
          const accretionProgress = THREE.MathUtils.smoothstep(localFormation, 0, accretionRatio);
          const exhaleProgress = THREE.MathUtils.smoothstep(
            localFormation,
            accretionRatio,
            exhaleEnd,
          );
          const radialX = radius > 1e-4 ? state.scratch.position.x / radius : 0;
          const radialY = radius > 1e-4 ? state.scratch.position.y / radius : 0;
          state.scratch.formed.copy(state.scratch.position);
          state.scratch.formed.x +=
            radialX * config.accretionExhale.inwardStrength * (2 + 0.28 * radius);
          state.scratch.formed.y +=
            radialY * config.accretionExhale.inwardStrength * (2 + 0.28 * radius);
          state.scratch.formed.z += 0.8 * config.accretionExhale.inwardStrength;
          state.scratch.previous.set(
            0.045 * state.scratch.position.x,
            0.045 * state.scratch.position.y,
            0.12 * state.scratch.position.z,
          );
          state.scratch.formed.lerp(state.scratch.previous, accretionProgress);
          state.scratch.formed.lerp(state.scratch.position, exhaleProgress);
          const exhaleDistance =
            Math.sin(exhaleProgress * Math.PI) *
            (1 - exhaleProgress) *
            config.accretionExhale.exhaleStrength;
          state.scratch.formed.x += radialX * exhaleDistance;
          state.scratch.formed.y += radialY * exhaleDistance;
          state.scratch.position.copy(state.scratch.formed);
          formationScale = THREE.MathUtils.lerp(0.06, 0.58, accretionProgress);
          formationScale = THREE.MathUtils.lerp(formationScale, 1, exhaleProgress);
        }
        const scatterXSeed = Math.fround(layer.flareScatter.x);
        const scatterYSeed = Math.fround(layer.flareScatter.y);
        const scatterDepthSeed = Math.fround(layer.flareScatter.z);
        const ignoresTextClearance = Number(Math.fround(layer.flareClearanceSeed) >= 0.72);
        const scatterSide = scatterXSeed < 0.5 ? -1 : 1;
        const clearanceProgress = Math.sqrt(pathMath.positiveModulo(2 * scatterXSeed, 1));
        const clearedScatterX =
          scatterSide *
          THREE.MathUtils.lerp(
            scatterSide < 0 ? -contentLeft : contentRight,
            0.5 * scatterWidth,
            clearanceProgress,
          );
        ambientMotion.getAstraDispersedMotionOffset(
          state.scratch.dispersedOffset,
          Math.fround(shaderTime),
          scatterXSeed,
          scatterYSeed,
          scatterDepthSeed,
          scrollDrift,
          dispersedMotion,
        );
        state.scratch.scattered.set(
          THREE.MathUtils.lerp(
            clearedScatterX,
            (scatterXSeed - 0.5) * scatterWidth,
            ignoresTextClearance,
          ) + state.scratch.dispersedOffset.x,
          pathMath.positiveModulo(
            (scatterYSeed - 0.5) * scatterHeight +
              state.scratch.dispersedOffset.y +
              0.5 * scatterHeight,
            scatterHeight,
          ) -
            0.5 * scatterHeight -
            Math.sin((customHero ? 1 : scatterPosition) * Math.PI) *
              (0.15 + 0.25 * scatterDepthSeed),
          (scatterDepthSeed - 0.5) * 0.5,
        );
        state.scratch.position.lerp(state.scratch.scattered, customHero ? 1 : scatterPosition);
        let tipVisibility = hasFlarePath ? pathMath.tipFade(flareProgress) : 1;
        let sizeAttenuation = hasFlarePath
          ? pathMath.sizeFalloff(flareProgress, config.stars.sizeFalloff)
          : 1;
        tipVisibility = THREE.MathUtils.lerp(tipVisibility, 1, scatterAmount);
        sizeAttenuation = THREE.MathUtils.lerp(sizeAttenuation, 1, scatterAmount);
        let shapeDepthScale = 1;
        let shapeDepthBrightness = 1;
        if (shape.samples && (shapeProgress > 0 || shapePosition > 0)) {
          pathMath.samplePathRange(shape.samples, layer.flareShapeSeed, state.scratch.range);
          const rangeStart = state.scratch.range.x;
          const rangeEnd = state.scratch.range.y;
          const rangeLength = Math.max(rangeEnd - rangeStart, 9775171065493646e-19);
          const localProgress = pathMath.densityProgress(
            THREE.MathUtils.clamp((layer.flareShapeSeed - rangeStart) / rangeLength, 0, 1) +
              layer.pathShapeTravel / rangeLength,
            config.stars.densityFalloff,
          );
          const sampleProgress = THREE.MathUtils.lerp(rangeStart, rangeEnd, localProgress);
          pathMath.samplePath(shape.samples, sampleProgress, state.scratch.formed);
          pathMath.samplePath(
            shape.samples,
            Math.max(sampleProgress - 9775171065493646e-19, rangeStart),
            state.scratch.previous,
          );
          pathMath.samplePath(
            shape.samples,
            Math.min(sampleProgress + 9775171065493646e-19, rangeEnd),
            state.scratch.next,
          );
          state.scratch.tangent
            .set(
              (state.scratch.next.x - state.scratch.previous.x) * state.scratch.size.x + 1e-4,
              (state.scratch.next.y - state.scratch.previous.y) * state.scratch.size.y,
              0,
            )
            .normalize();
          state.scratch.normal
            .set(-state.scratch.tangent.y, state.scratch.tangent.x, 0)
            .normalize();
          if (shape.filled) {
            state.scratch.normal.set(0, 1, 0);
          }
          const depthEnvelope = Math.sin(localProgress * Math.PI);
          const shapeDepth =
            Math.sin(localProgress * Math.PI * 1.35 + layer.pathShapeDepthPhase) *
            layer.pathShapeDepth *
            depthEnvelope;
          const scatterScale = shapeScatter;
          state.scratch.relative
            .set(
              state.scratch.formed.x * state.scratch.size.x,
              state.scratch.formed.y * state.scratch.size.y,
              (shapeDepth + 0.75 * layer.flareDepthOffset + layer.flareShapeDepthScatter) *
                scatterScale,
            )
            .addScaledVector(
              state.scratch.normal,
              shape.filled
                ? (layer.flareScatter.y - 0.5) * state.scratch.size.y * (shape.rowSpacing ?? 0)
                : (1.1 * layer.flareAcrossOffset + layer.flareShapeAcrossScatter) * scatterScale,
            );
          state.scratch.euler.set(state.shapeRotation.x, state.shapeRotation.y, 0, "YXZ");
          state.scratch.relative.applyEuler(state.scratch.euler);
          state.scratch.formed.set(
            state.scratch.center.x + state.scratch.relative.x,
            state.scratch.center.y + state.scratch.relative.y,
            state.scratch.relative.z,
          );
          state.scratch.position.lerp(state.scratch.formed, shapePosition);
          const depthBrightness = THREE.MathUtils.smoothstep(state.scratch.relative.z, -1.15, 1.15);
          tipVisibility = THREE.MathUtils.lerp(
            tipVisibility,
            shape.filled ? 1 : pathMath.tipFade(localProgress),
            shapeProgress,
          );
          sizeAttenuation = THREE.MathUtils.lerp(
            sizeAttenuation,
            shape.filled ? 1 : pathMath.sizeFalloff(localProgress, config.stars.sizeFalloff),
            shapeProgress,
          );
          shapeDepthScale = THREE.MathUtils.lerp(
            1,
            THREE.MathUtils.lerp(0.78, 1.18, depthBrightness),
            shapeProgress,
          );
          shapeDepthBrightness = THREE.MathUtils.lerp(
            1,
            THREE.MathUtils.lerp(0.72, 1, depthBrightness),
            shapeProgress,
          );
        }
        state.scratch.formed.set(
          (scatterXSeed - 0.5) * scatterWidth,
          (pathMath.positiveModulo(scatterYSeed, 1) - 0.5) * scatterHeight,
          (scatterDepthSeed - 0.5) * 0.5,
        );
        introMotion.applyAstraIntroMotion(
          state.scratch.position,
          state.scratch.formed,
          introProgress,
          scatterDepthSeed,
          scatterYSeed,
        );
        const revealProgress = revealMath.getAstraParticleRevealProgress(
          introProgress,
          scatterDepthSeed,
        );
        const revealSize = Math.sqrt(revealProgress);
        const revealOpacity = THREE.MathUtils.smoothstep(
          revealProgress,
          0,
          revealMath.ASTRA_PARTICLE_OPACITY_REVEAL_END,
        );
        const growthSize =
          "grow" !== config.animationPreset || layer.isCore ? 1 : 0.3 + 0.7 * growthVisibility;
        const flareScale =
          tipVisibility *
          sizeAttenuation *
          shapeDepthScale *
          shapeDepthBrightness *
          formationScale *
          growthVisibility *
          growthSize *
          THREE.MathUtils.lerp(scrollSizeScale, 1, shapeProgress) *
          revealSize *
          revealOpacity *
          flareRailIntensity;
        layer.flareSource.position.copy(state.scratch.position);
        layer.flareSource.scale.setScalar(
          THREE.MathUtils.clamp(flareScale, 0, 1) *
            starsOpacity *
            wordmarkPointScale *
            THREE.MathUtils.lerp(1, 0.65, shape.filled ? shapeProgress : 0),
        );
      }
    }
    if (layer.dustMaterial) {
      layer.dustMaterial.uniforms.uDispersedMotion.value = dispersedMotion;
      layer.dustMaterial.uniforms.uDriftSpeed.value = input.reducedMotion
        ? 0
        : THREE.MathUtils.clamp(config.orbitalDust.driftSpeed, 0, 1.5) * pathVisibility;
      layer.dustMaterial.uniforms.uScrollScatter.value = scatterAmount;
      layer.dustMaterial.uniforms.uScrollPositionProgress.value = scatterPosition;
      layer.dustMaterial.uniforms.uScrollDrift.value = scrollDrift;
      layer.dustMaterial.uniforms.uStarVisibility.value = pathVisibility;
      layer.dustMaterial.uniforms.uTrailEnabled.value = pathVisibility;
      layer.dustMaterial.uniforms.uScatterSize.value.set(scatterWidth, scatterHeight);
      layer.dustMaterial.uniforms.uHeadProgress.value = headProgress;
      layer.dustMaterial.uniforms.uDirection.value = flowSpeed < 0 ? -1 : 1;
      layer.dustMaterial.uniforms.uIntensity.value = THREE.MathUtils.clamp(
        config.orbitalDust.intensity * dustRailIntensity,
        0,
        3,
      );
      layer.dustMaterial.uniforms.uLightReach.value =
        THREE.MathUtils.clamp(config.orbitalDust.reach, 0.02, 0.4) * (layer.strong ? 1.15 : 1);
      layer.dustMaterial.uniforms.uTime.value = input.reducedMotion ? 0 : state.elapsed;
      updateParticleUniforms(
        layer.dustMaterial,
        "accretion-exhale" === config.animationPreset,
        formationProgress,
        introProgress,
        "grow" === config.animationPreset,
        growthProgress,
        config.grow.softness,
        ambientPulse,
        settleRatio,
        config.accretionExhale,
        lensStrength,
        state.lensPointer,
        lensRadius,
        viewportAspect,
        safeViewport.height,
        config.interaction,
      );
    }
  }
  return hasPendingAnimation || lensMotionActive || particleMotionActive;
}
function updateParticleMotion(
  motion: ParticleMotionState,
  pointer: AstraInput["pointer"],
  enabled: boolean,
  delta: number,
  scrolling = false,
): boolean {
  motion.frame += 1;
  motion.delta = delta;
  motion.impulse.set(0, 0);
  motion.scrollCooldown = scrolling ? 0.12 : Math.max(0, motion.scrollCooldown - delta);
  if (pointer.reset || (!enabled && (motion.active || motion.remaining > 0))) {
    motion.epoch += 1;
    motion.remaining = 0;
    motion.active = false;
  }
  const isActive = enabled && pointer.active && !pointer.pressed && 0 === motion.scrollCooldown;
  if (isActive) {
    motion.previous.copy(motion.pointer);
    motion.pointer.set(pointer.x, pointer.y);
    if (motion.active) {
      motion.impulse.subVectors(motion.pointer, motion.previous);
      if (motion.impulse.lengthSq() > 1e-8) {
        motion.remaining = particleMotion.PARTICLE_MOTION_SETTLE_SECONDS;
      }
    } else {
      motion.previous.copy(motion.pointer);
    }
  }
  motion.active = isActive;
  motion.pressed = pointer.pressed;
  motion.remaining = Math.max(0, motion.remaining - delta);
  return motion.remaining > 0;
}
