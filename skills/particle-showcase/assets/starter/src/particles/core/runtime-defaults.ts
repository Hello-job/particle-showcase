/** Validated runtime controls. Values and limits retain the reference renderer behavior. */
export interface BaseConfig {
  animationPlaying: boolean;
  animationRestartKey: number;
  bloomIntensity: number;
  bloomThreshold: number;
  colorMode: boolean;
  convergeDuration: number;
  faceForward: boolean;
  pathShapeAutoRotate: boolean;
  pathShapeAutoRotateAmount: number;
  pathShapeAutoRotateSpeed: number;
  pathShapeScatter: number;
  rotationDepth: number;
  scrollDisperseDistance: number;
  scrollEffects: boolean;
  scrollStarDriftSpeed: number;
  scrollStartOffset: number;
  scrollTextFadeDistance: number;
  showCenterCluster: boolean;
}
export const BASE_DEFAULTS: Readonly<BaseConfig> = Object.freeze({
  animationPlaying: true,
  animationRestartKey: 0,
  bloomIntensity: 0.7,
  bloomThreshold: 0.08,
  colorMode: true,
  convergeDuration: 5.5,
  faceForward: true,
  pathShapeAutoRotate: true,
  pathShapeAutoRotateAmount: 0.42,
  pathShapeAutoRotateSpeed: 0.22,
  pathShapeScatter: 1,
  rotationDepth: 1.4,
  scrollDisperseDistance: 800,
  scrollEffects: true,
  scrollStarDriftSpeed: 3,
  scrollStartOffset: 0,
  scrollTextFadeDistance: 200,
  showCenterCluster: true,
});
export interface AccretionConfig {
  accretionRatio: number;
  ambientAmount: number;
  ambientSpeed: number;
  coreIntensity: number;
  duration: number;
  exhaleStrength: number;
  inwardStrength: number;
  propagationSoftness: number;
  settleDuration: number;
  startScale: number;
}
export const ACCRETION_EXHALE_DEFAULTS: Readonly<AccretionConfig> = Object.freeze({
  accretionRatio: 0.42,
  ambientAmount: 0.04,
  ambientSpeed: 0.55,
  coreIntensity: 1.45,
  duration: 8,
  exhaleStrength: 0.42,
  inwardStrength: 1.2,
  propagationSoftness: 0.16,
  settleDuration: 1.2,
  startScale: 0.58,
});
export interface DirtyGlassConfig {
  distortion: number;
  drift: boolean;
  driftStrength: number;
  enabled: boolean;
  grain: number;
  procedural: number;
  texture: number;
}
export const DIRTY_GLASS_DEFAULTS: Readonly<DirtyGlassConfig> = Object.freeze({
  distortion: 0.68,
  drift: true,
  driftStrength: 0.28,
  enabled: true,
  grain: 0.031,
  procedural: 0,
  texture: 0,
});
export interface GrowthConfig {
  duration: number;
  growthSpeed: number;
  softness: number;
  startZoom: number;
}
export const GROW_DEFAULTS: Readonly<GrowthConfig> = Object.freeze({
  duration: 8,
  growthSpeed: 0.55,
  softness: 0.075,
  startZoom: 4,
});
export interface InteractionConfig {
  depthDisplacement: number;
  followDamping: number;
  illumination: number;
  magnification: number;
  particleRepel: boolean;
  repelDistance: number;
  repelFalloff: number;
  repelHighlight: number;
  repelHighlightRadius: number;
  repelPressMultiplier: number;
  repelRadius: number;
  repelReturnSpring: number;
  repelSpring: number;
  rotationLag: number;
  radius: number;
  smearCurl: number;
  smearTrailLength: number;
}
export const INTERACTION_DEFAULTS: Readonly<InteractionConfig> = Object.freeze({
  depthDisplacement: 0.5,
  followDamping: 6,
  illumination: 0.55,
  magnification: 0.18,
  particleRepel: true,
  repelDistance: 52,
  repelFalloff: 2,
  repelHighlight: 0.16,
  repelHighlightRadius: 196,
  repelPressMultiplier: 2.2,
  repelRadius: 176,
  repelReturnSpring: 2.8,
  repelSpring: 7,
  rotationLag: 0.68,
  radius: 156,
  smearCurl: 0.24,
  smearTrailLength: 2.25,
});
export interface LensFlareConfig {
  animated: boolean;
  enabled: boolean;
  ghosts: number;
  halo: number;
  intensity: number;
  secondary: number;
  streakLength: number;
  streaks: number;
  verticalStreaks: number;
}
export const LENS_FLARE_DEFAULTS: Readonly<LensFlareConfig> = Object.freeze({
  animated: true,
  enabled: true,
  ghosts: 0.1,
  halo: 0.12,
  intensity: 0.28,
  secondary: 0.55,
  streakLength: 0.03485,
  streaks: 0.18,
  verticalStreaks: 1,
});
export interface OrbitalDustConfig {
  density: number;
  driftSpeed: number;
  enabled: boolean;
  intensity: number;
  reach: number;
  spread: number;
  tightSpread: number;
}
export const ORBITAL_DUST_DEFAULTS: Readonly<OrbitalDustConfig> = Object.freeze({
  density: 0.55,
  driftSpeed: 0.2,
  enabled: false,
  intensity: 2,
  reach: 0.17,
  spread: 0.4,
  tightSpread: 0.03,
});
export interface StarsConfig {
  density: number;
  densityFalloff: number;
  flowInward: boolean;
  flowSpeed: number;
  intensity: number;
  scatter: number;
  size: number;
  sizeFalloff: number;
  twinkleSpeed: number;
}
export const STARS_DEFAULTS: Readonly<StarsConfig> = Object.freeze({
  density: 4,
  densityFalloff: 0.22,
  flowInward: true,
  flowSpeed: 0.8,
  intensity: 1.35,
  scatter: 0.4,
  size: 2.05,
  sizeFalloff: 0.45,
  twinkleSpeed: 0.62,
});
export type AnimationPreset =
  "none" | "legacy-zoom" | "converge-tilt" | "accretion-exhale" | "grow";
export type InteractionMode = "rotate" | "depth-lens" | "none";
export type ColorPalette = "astra" | "aurora" | "ember";
export type ColorPaletteColors = readonly [string, string, string, string, string];
export interface RuntimeConfig extends BaseConfig {
  readonly accretionExhale: Readonly<AccretionConfig>;
  readonly dirtyGlass: Readonly<DirtyGlassConfig>;
  readonly grow: Readonly<GrowthConfig>;
  readonly interaction: Readonly<InteractionConfig>;
  readonly lensFlare: Readonly<LensFlareConfig>;
  readonly orbitalDust: Readonly<OrbitalDustConfig>;
  readonly stars: Readonly<StarsConfig>;
  readonly animationPreset: AnimationPreset;
  readonly interactionMode: InteractionMode;
  readonly colorPalette: ColorPalette;
  readonly colorPaletteColors: ColorPaletteColors;
}
export const COLOR_PALETTES: Readonly<Record<ColorPalette, ColorPaletteColors>> = Object.freeze({
  astra: Object.freeze(["#6DCBF4", "#7AB1FE", "#F87915", "#FA994C", "#F5F6FB"] as const),
  aurora: Object.freeze(["#47E2C2", "#6DCBF4", "#B06DFF", "#E96AC8", "#F5F6FB"] as const),
  ember: Object.freeze(["#F7CB59", "#FA994C", "#F67576", "#B06DFF", "#F5F6FB"] as const),
});
export const DEFAULT_ENGINE_CONFIG: Readonly<RuntimeConfig> = Object.freeze({
  ...BASE_DEFAULTS,
  accretionExhale: ACCRETION_EXHALE_DEFAULTS,
  dirtyGlass: DIRTY_GLASS_DEFAULTS,
  grow: GROW_DEFAULTS,
  interaction: INTERACTION_DEFAULTS,
  lensFlare: LENS_FLARE_DEFAULTS,
  orbitalDust: ORBITAL_DUST_DEFAULTS,
  stars: STARS_DEFAULTS,
  animationPreset: "converge-tilt",
  interactionMode: "rotate",
  colorPalette: "astra",
  colorPaletteColors: COLOR_PALETTES.astra,
});
