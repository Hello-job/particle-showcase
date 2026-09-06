// Readable TypeScript port of the extracted Astra particle implementation.
// Provenance and retained third-party terms are documented in THIRD_PARTY_NOTICES.md.
import {
  AddEquation,
  Color,
  CustomBlending,
  Matrix4,
  MathUtils,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
  Vector3,
} from "three";
import type { DataTexture, IUniform, ShaderMaterialParameters } from "three";
import type { RuntimeConfig } from "./config";
import {
  DUST_FRAGMENT_SHADER,
  DUST_VERTEX_SHADER,
  STAR_FRAGMENT_SHADER,
  STAR_VERTEX_SHADER,
} from "./shaders/field";

/** Exact additive color / accumulated alpha blend used by the source renderer. */
const PARTICLE_BLENDING = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: SrcAlphaFactor,
  blendDst: OneFactor,
  blendEquationAlpha: AddEquation,
  blendSrcAlpha: OneFactor,
  blendDstAlpha: OneMinusSrcAlphaFactor,
} satisfies ShaderMaterialParameters;

/** Keep named uniform values typed rather than inheriting Three's untyped dictionary. */
export class ParticleShaderMaterial<
  Uniforms extends Record<string, IUniform<unknown>>,
> extends ShaderMaterial {
  declare uniforms: Uniforms;

  constructor(parameters: Omit<ShaderMaterialParameters, "uniforms"> & { uniforms: Uniforms }) {
    super(parameters);
  }
}

export interface TrackedStar {
  acrossScatter: number;
  clearanceSeed: number;
  depthScatter: number;
  scatter: Vector3;
  seed: number;
}

export function createStarMaterial(
  config: RuntimeConfig,
  pixelRatio: number,
  pathTexture: DataTexture | null = null,
  pathSpeed = 0,
  shapeDepth = 0.18,
  depthPhase = 0,
  brightRetention = 0.5,
  trackedStar?: TrackedStar,
) {
  const { stars, accretionExhale: accretion, grow: growth, interaction } = config;
  return new ParticleShaderMaterial({
    ...PARTICLE_BLENDING,
    depthTest: false,
    depthWrite: false,
    fragmentShader: STAR_FRAGMENT_SHADER,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uAccretionRatio: {
        value: accretion.accretionRatio,
      },
      uAmbientPulse: {
        value: 1,
      },
      uCoreIntensity: {
        value: accretion.coreIntensity,
      },
      uDensityFalloff: {
        value: MathUtils.clamp(stars.densityFalloff, 0, 0.98),
      },
      uDispersedMotion: {
        value: 0,
      },
      uFlowSpeed: {
        value: MathUtils.clamp(stars.flowSpeed, 0, 3),
      },
      uExhaleStrength: {
        value: accretion.exhaleStrength,
      },
      uFormationEnabled: {
        value: 0,
      },
      uFormationProgress: {
        value: 1,
      },
      uBackgroundStarsEnabled: {
        value: 0,
      },
      uBackgroundModelMatrix: {
        value: new Matrix4(),
      },
      uIntroProgress: {
        value: Number(!config.animationPlaying || "converge-tilt" !== config.animationPreset),
      },
      uGrowthEnabled: {
        value: 0,
      },
      uGrowthDirection: {
        value: 1,
      },
      uGrowthProgress: {
        value: 1,
      },
      uGrowthRadius: {
        value: 8.2,
      },
      uGrowthSoftness: {
        value: growth.softness,
      },
      uInwardStrength: {
        value: accretion.inwardStrength,
      },
      uIntensity: {
        value: MathUtils.clamp(stars.intensity, 0.1, 3),
      },
      uPathMotion: {
        value: Number(null !== pathTexture),
      },
      uPathOffset: {
        value: 0,
      },
      uPathSampleCount: {
        value: 512,
      },
      uPathSpeed: {
        value: pathSpeed,
      },
      uPathTexture: {
        value: pathTexture,
      },
      uPathShapeCenter: {
        value: new Vector2(),
      },
      uPathShapeBrightRetention: {
        value: MathUtils.clamp(brightRetention, 0, 1),
      },
      uPathShapeDepth: {
        value: MathUtils.clamp(shapeDepth, -1.8, 1.8),
      },
      uPathShapeDepthPhase: {
        value: depthPhase,
      },
      uPathShapeMotion: {
        value: 0,
      },
      uPathShapeProgress: {
        value: 0,
      },
      uPathShapePositionProgress: {
        value: 0,
      },
      uPathShapeRotation: {
        value: new Vector2(),
      },
      uPathShapeScatter: {
        value: 1,
      },
      uPathShapePointScale: {
        value: 1,
      },
      uPathShapeFilled: {
        value: 0,
      },
      uPathShapeRowSpacing: {
        value: 0,
      },
      uPathShapeAccentRange: {
        value: new Vector2(0, 0),
      },
      uPathShapeAccentColor: {
        value: new Color("#1685ff"),
      },
      uPathShapeSampleCount: {
        value: 1024,
      },
      uPathShapeSize: {
        value: new Vector2(),
      },
      uPathShapeTrackedScatter: {
        value: new Vector2(trackedStar?.acrossScatter ?? 0, trackedStar?.depthScatter ?? 0),
      },
      uTrackedClearanceSeed: {
        value: trackedStar?.clearanceSeed ?? 0,
      },
      uTrackedScatter: {
        value: trackedStar?.scatter.clone() ?? new Vector3(),
      },
      uPathShapeTrackedSeed: {
        value: trackedStar?.seed ?? 0,
      },
      uPathShapeTrackingEnabled: {
        value: Number(trackedStar !== undefined),
      },
      uPathShapeTexture: {
        value: null as DataTexture | null,
      },
      uLensActive: {
        value: 0,
      },
      uLensDepth: {
        value: interaction.depthDisplacement,
      },
      uLensIllumination: {
        value: interaction.illumination,
      },
      uLensMagnification: {
        value: interaction.magnification,
      },
      uLensPointer: {
        value: new Vector2(),
      },
      uLensRadius: {
        value: 0.2,
      },
      uParticleMotionEnabled: {
        value: 0,
      },
      uPointerRepelRadius: {
        value: 0.2,
      },
      uPixelRatio: {
        value: pixelRatio,
      },
      uSizeFalloff: {
        value: MathUtils.clamp(stars.sizeFalloff, 0, 1),
      },
      uPropagationSoftness: {
        value: accretion.propagationSoftness,
      },
      uScatterSize: {
        value: new Vector2(12, 12),
      },
      uScrollDrift: {
        value: 0,
      },
      uScrollScatter: {
        value: 0,
      },
      uScrollPositionProgress: {
        value: 0,
      },
      uScrollSizeScale: {
        value: 1,
      },
      uSettleRatio: {
        value: 0.15,
      },
      uTextBounds: {
        value: new Vector2(-3, 3),
      },
      uTime: {
        value: 0,
      },
      uTwinkleSpeed: {
        value: MathUtils.clamp(stars.twinkleSpeed, 0, 2),
      },
      uViewportAspect: {
        value: 1,
      },
    },
    vertexShader: STAR_VERTEX_SHADER,
  });
}
export function createDustMaterial(
  config: RuntimeConfig,
  orbit: { phase: number; strong: boolean },
  speed: number,
  pixelRatio: number,
) {
  const { orbitalDust: dust, accretionExhale: accretion, grow: growth, interaction } = config;
  return new ParticleShaderMaterial({
    ...PARTICLE_BLENDING,
    depthTest: false,
    depthWrite: false,
    fragmentShader: DUST_FRAGMENT_SHADER,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uAccretionRatio: { value: accretion.accretionRatio },
      uAmbientPulse: { value: 1 },
      uCoreIntensity: { value: accretion.coreIntensity },
      uDirection: { value: speed < 0 ? -1 : 1 },
      uDispersedMotion: { value: 0 },
      uDriftDistance: { value: 0.16 },
      uDriftSpeed: { value: MathUtils.clamp(dust.driftSpeed, 0, 1.5) },
      uExhaleStrength: { value: accretion.exhaleStrength },
      uFormationEnabled: { value: 0 },
      uFormationProgress: { value: 1 },
      uIntroProgress: {
        value: Number(!config.animationPlaying || config.animationPreset !== "converge-tilt"),
      },
      uGrowthEnabled: { value: 0 },
      uGrowthProgress: { value: 1 },
      uGrowthRadius: { value: 8.2 },
      uGrowthSoftness: { value: growth.softness },
      uHeadProgress: { value: orbit.phase },
      uInwardStrength: { value: accretion.inwardStrength },
      uIntensity: { value: MathUtils.clamp(dust.intensity, 0, 3) },
      uLightReach: { value: MathUtils.clamp(dust.reach, 0.02, 0.4) * (orbit.strong ? 1.15 : 1) },
      uPixelRatio: { value: pixelRatio },
      uStarBrightness: { value: orbit.strong ? 1 : 0.62 },
      uStarVisibility: { value: 1 },
      uLensActive: { value: 0 },
      uLensDepth: { value: interaction.depthDisplacement },
      uLensIllumination: { value: interaction.illumination },
      uLensMagnification: { value: interaction.magnification },
      uLensPointer: { value: new Vector2() },
      uLensRadius: { value: 0.2 },
      uParticleMotionEnabled: { value: 0 },
      uPointerRepelRadius: { value: 0.2 },
      uPropagationSoftness: { value: accretion.propagationSoftness },
      uScatterSize: { value: new Vector2(12, 12) },
      uScrollDrift: { value: 0 },
      uScrollScatter: { value: 0 },
      uScrollPositionProgress: { value: 0 },
      uSettleRatio: { value: 0.15 },
      uTrailEnabled: { value: 1 },
      uTrailLength: { value: 0.18 },
      uTime: { value: 0 },
      uViewportAspect: { value: 1 },
    },
    vertexShader: DUST_VERTEX_SHADER,
  });
}

export type StarMaterial = ReturnType<typeof createStarMaterial>;
export type DustMaterial = ReturnType<typeof createDustMaterial>;
