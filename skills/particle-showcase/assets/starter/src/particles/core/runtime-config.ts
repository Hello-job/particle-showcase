import {
  ACCRETION_EXHALE_DEFAULTS,
  BASE_DEFAULTS,
  COLOR_PALETTES,
  DEFAULT_ENGINE_CONFIG,
  DIRTY_GLASS_DEFAULTS,
  GROW_DEFAULTS,
  INTERACTION_DEFAULTS,
  LENS_FLARE_DEFAULTS,
  ORBITAL_DUST_DEFAULTS,
  STARS_DEFAULTS,
} from "./runtime-defaults";
import type { ColorPaletteColors, RuntimeConfig } from "./runtime-defaults";

export * from "./runtime-defaults";

type NumericBounds = readonly [number, number];
type ControlBounds<T> = { [Key in keyof T as T[Key] extends number ? Key : never]: NumericBounds };

const BASE_BOUNDS: ControlBounds<typeof BASE_DEFAULTS> = {
  animationRestartKey: [0, Number.MAX_SAFE_INTEGER],
  bloomIntensity: [0, 2],
  bloomThreshold: [0, 1],
  convergeDuration: [1, 10],
  pathShapeAutoRotateAmount: [0, 1.2],
  pathShapeAutoRotateSpeed: [0, 2],
  pathShapeScatter: [0, 3],
  rotationDepth: [0, 2],
  scrollDisperseDistance: [200, 2400],
  scrollStarDriftSpeed: [0, 3],
  scrollStartOffset: [0, 1600],
  scrollTextFadeDistance: [50, 1600],
};
const STARS_BOUNDS: ControlBounds<typeof STARS_DEFAULTS> = {
  density: [0.25, 4],
  densityFalloff: [0, 1],
  flowSpeed: [0, 3],
  intensity: [0.1, 3],
  scatter: [0, 0.4],
  size: [0.25, 3],
  sizeFalloff: [0, 1],
  twinkleSpeed: [0, 2],
};
const INTERACTION_BOUNDS: ControlBounds<typeof INTERACTION_DEFAULTS> = {
  depthDisplacement: [-1.5, 1.5],
  followDamping: [1, 30],
  illumination: [0, 2],
  magnification: [-0.3, 0.8],
  repelDistance: [0, 160],
  repelFalloff: [0.5, 6],
  repelHighlight: [0, 1],
  repelHighlightRadius: [16, 480],
  repelPressMultiplier: [1, 4],
  repelRadius: [16, 360],
  repelReturnSpring: [1, 40],
  repelSpring: [1, 40],
  rotationLag: [0, 1],
  radius: [32, 360],
  smearCurl: [0, 1],
  smearTrailLength: [0.5, 4],
};
const ORBITAL_DUST_BOUNDS: ControlBounds<typeof ORBITAL_DUST_DEFAULTS> = {
  density: [0.25, 4],
  driftSpeed: [0, 3],
  intensity: [0, 2],
  reach: [0, 1],
  spread: [0, 1],
  tightSpread: [0, 1],
};
const LENS_FLARE_BOUNDS: ControlBounds<typeof LENS_FLARE_DEFAULTS> = {
  ghosts: [0, 1],
  halo: [0, 1],
  intensity: [0, 1.5],
  secondary: [0, 1],
  streakLength: [0.025, 0.2],
  streaks: [0, 1],
  verticalStreaks: [0, 1],
};
const DIRTY_GLASS_BOUNDS: ControlBounds<typeof DIRTY_GLASS_DEFAULTS> = {
  distortion: [0, 1],
  driftStrength: [0, 1],
  grain: [0, 1],
  procedural: [0, 1],
  texture: [0, 1],
};
const ACCRETION_EXHALE_BOUNDS: ControlBounds<typeof ACCRETION_EXHALE_DEFAULTS> = {
  accretionRatio: [0.12, 0.72],
  ambientAmount: [0, 0.16],
  ambientSpeed: [0, 3],
  coreIntensity: [0.5, 3],
  duration: [2, 20],
  exhaleStrength: [0, 1.5],
  inwardStrength: [0, 3],
  propagationSoftness: [0, 0.6],
  settleDuration: [0.2, 3],
  startScale: [0.3, 1.25],
};
const GROW_BOUNDS: ControlBounds<typeof GROW_DEFAULTS> = {
  duration: [2, 20],
  growthSpeed: [0.2, 2],
  softness: [0.005, 0.3],
  startZoom: [1, 8],
};

/** Read data properties only: inherited properties and accessors are not controls. */
export function ownDataValue(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
function boundedNumber(value: unknown, fallback: number, [min, max]: NumericBounds): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

/** Every output key comes from defaults and is checked against the matching scalar type. */
function normalizeControls<T extends object>(
  value: unknown,
  defaults: T,
  bounds: ControlBounds<T>,
  base: T = defaults,
): Readonly<T> {
  const resolved = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    const defaultValue = defaults[key];
    const baseValue = ownDataValue(base, key);
    const overrideValue = ownDataValue(value, key);
    const range = ownDataValue(bounds, key);
    let result: unknown;
    if (typeof defaultValue === "number") {
      if (
        !Array.isArray(range) ||
        range.length !== 2 ||
        typeof range[0] !== "number" ||
        typeof range[1] !== "number"
      ) {
        throw new Error(`Missing numeric bounds for ${key}`);
      }
      const limits: NumericBounds = [range[0], range[1]];
      const fallback = boundedNumber(baseValue, defaultValue, limits);
      result = boundedNumber(overrideValue, fallback, limits);
    } else {
      const fallback = typeof baseValue === "boolean" ? baseValue : defaultValue;
      result = typeof overrideValue === "boolean" ? overrideValue : fallback;
    }
    // The checks above preserve the type of this particular default key.
    resolved[key] = result as T[typeof key];
  }
  return Object.freeze(resolved);
}
function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((candidate) => candidate === value) ?? fallback;
}
function paletteColors(value: unknown, fallback: ColorPaletteColors): ColorPaletteColors {
  if (!Array.isArray(value) || value.length !== 5) return fallback;
  const colors: unknown[] = Array.from(
    { length: 5 },
    (_, index) => Object.getOwnPropertyDescriptor(value, String(index))?.value,
  );
  if (
    colors.every(
      (color): color is string =>
        typeof color === "string" && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color),
    )
  ) {
    return Object.freeze([colors[0], colors[1], colors[2], colors[3], colors[4]]);
  }
  return fallback;
}
function pickControls(value: unknown, defaults: object): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) {
    const item = ownDataValue(value, key);
    if (item !== undefined) result[key] = item;
  }
  return result;
}
export function pickAstraRuntimeOverrides(value: unknown): Record<string, unknown> {
  const result = pickControls(value, BASE_DEFAULTS);
  const groups = {
    accretionExhale: ACCRETION_EXHALE_DEFAULTS,
    dirtyGlass: DIRTY_GLASS_DEFAULTS,
    grow: GROW_DEFAULTS,
    interaction: INTERACTION_DEFAULTS,
    lensFlare: LENS_FLARE_DEFAULTS,
    orbitalDust: ORBITAL_DUST_DEFAULTS,
    stars: STARS_DEFAULTS,
  };
  for (const [name, defaults] of Object.entries(groups)) {
    const controls = pickControls(ownDataValue(value, name), defaults);
    if (Object.keys(controls).length > 0) result[name] = controls;
  }
  for (const name of ["animationPreset", "colorPalette", "colorPaletteColors", "interactionMode"]) {
    const item = ownDataValue(value, name);
    if (item !== undefined) result[name] = item;
  }
  return result;
}

/** Normalize external controls before the animation and shaders consume them. */
export function resolveAstraRuntimeData(
  value: unknown,
  base: RuntimeConfig,
): Readonly<RuntimeConfig> {
  return Object.freeze({
    ...normalizeControls(value, BASE_DEFAULTS, BASE_BOUNDS, base),
    accretionExhale: normalizeControls(
      ownDataValue(value, "accretionExhale"),
      ACCRETION_EXHALE_DEFAULTS,
      ACCRETION_EXHALE_BOUNDS,
      base.accretionExhale,
    ),
    animationPreset: enumValue(
      ownDataValue(value, "animationPreset"),
      ["none", "legacy-zoom", "converge-tilt", "accretion-exhale", "grow"],
      base.animationPreset,
    ),
    colorPalette: enumValue(
      ownDataValue(value, "colorPalette"),
      ["astra", "aurora", "ember"],
      base.colorPalette,
    ),
    colorPaletteColors: paletteColors(
      ownDataValue(value, "colorPaletteColors"),
      base.colorPaletteColors,
    ),
    dirtyGlass: normalizeControls(
      ownDataValue(value, "dirtyGlass"),
      DIRTY_GLASS_DEFAULTS,
      DIRTY_GLASS_BOUNDS,
      base.dirtyGlass,
    ),
    grow: normalizeControls(ownDataValue(value, "grow"), GROW_DEFAULTS, GROW_BOUNDS, base.grow),
    interaction: normalizeControls(
      ownDataValue(value, "interaction"),
      INTERACTION_DEFAULTS,
      INTERACTION_BOUNDS,
      base.interaction,
    ),
    interactionMode: enumValue(
      ownDataValue(value, "interactionMode"),
      ["rotate", "depth-lens", "none"],
      base.interactionMode,
    ),
    lensFlare: normalizeControls(
      ownDataValue(value, "lensFlare"),
      LENS_FLARE_DEFAULTS,
      LENS_FLARE_BOUNDS,
      base.lensFlare,
    ),
    orbitalDust: normalizeControls(
      ownDataValue(value, "orbitalDust"),
      ORBITAL_DUST_DEFAULTS,
      ORBITAL_DUST_BOUNDS,
      base.orbitalDust,
    ),
    stars: normalizeControls(
      ownDataValue(value, "stars"),
      STARS_DEFAULTS,
      STARS_BOUNDS,
      base.stars,
    ),
  });
}
export function resolveEngineConfig(value?: unknown): Readonly<RuntimeConfig> {
  const palette = enumValue(
    ownDataValue(value, "colorPalette"),
    ["astra", "aurora", "ember"],
    DEFAULT_ENGINE_CONFIG.colorPalette,
  );
  return resolveAstraRuntimeData(value, {
    ...DEFAULT_ENGINE_CONFIG,
    colorPalette: palette,
    colorPaletteColors: COLOR_PALETTES[palette],
  });
}
export function getAstraScrollState(
  scroll: number,
  config: RuntimeConfig = DEFAULT_ENGINE_CONFIG,
  reducedMotion = false,
): { textOpacity: number; dispersion: number; progress: number } {
  if (!config.scrollEffects) return { textOpacity: 1, dispersion: 0, progress: 0 };
  const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
  const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);
  const distance =
    finite(scroll, 0) -
    Math.max(finite(config.scrollStartOffset, BASE_DEFAULTS.scrollStartOffset), 0);
  const fade = clampUnit(
    distance /
      Math.max(finite(config.scrollTextFadeDistance, BASE_DEFAULTS.scrollTextFadeDistance), 1),
  );
  const progress = Math.max(
    distance /
      Math.max(finite(config.scrollDisperseDistance, BASE_DEFAULTS.scrollDisperseDistance), 1),
    0,
  );
  const dispersion = clampUnit(progress);
  if (reducedMotion) {
    const snapped = dispersion < 0.5 ? 0 : 1;
    return { textOpacity: Number(fade < 0.5), dispersion: snapped, progress: snapped };
  }
  return {
    textOpacity: 1 - fade * fade * fade * (fade * (6 * fade - 15) + 10),
    dispersion,
    progress,
  };
}
