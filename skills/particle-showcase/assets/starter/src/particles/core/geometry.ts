// Readable TypeScript port of the extracted Astra particle implementation.
// Provenance and retained third-party terms are documented in THIRD_PARTY_NOTICES.md.
import {
  ClampToEdgeWrapping,
  Color,
  Curve,
  DataTexture,
  FloatType,
  LinearFilter,
  MathUtils,
  NearestFilter,
  RGBAFormat,
  Vector3,
} from "three";
import type { Path, Vector2 } from "three";

// The extracted chunk bundled Three's general SVG parser. Use the pinned,
// maintained dependency instead; only its parsed contour curves are needed.
export { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export const STAR_PALETTES = [
  {
    id: "astra",
    label: "Astra",
    colors: ["#6DCBF4", "#7AB1FE", "#F87915", "#FA994C", "#F5F6FB"],
  },
  {
    id: "aurora",
    label: "Aurora",
    colors: ["#47E2C2", "#6DCBF4", "#B06DFF", "#E96AC8", "#F5F6FB"],
  },
  {
    id: "ember",
    label: "Ember",
    colors: ["#F7CB59", "#FA994C", "#F67576", "#B06DFF", "#F5F6FB"],
  },
];
const DEFAULT_PALETTE = "astra";
const paletteColors = new Map(
  STAR_PALETTES.map(({ id, colors }) => [id, colors.map((color) => new Color(color))]),
);
const white = new Color(1, 1, 1);
const customPaletteCache = new Map<string, Color[]>();

export const SECONDARY_COLOR_SEEDS = [0.08, 0.58, 0.22, 0.68, 0.44];
export const ASTRA_PARTICLE_OPACITY_REVEAL_END = 0.2;

function getPalette(paletteId: string, overrides?: readonly string[]): Color[] {
  const palette = paletteColors.get(paletteId) ?? paletteColors.get(DEFAULT_PALETTE);
  if (!palette) throw new Error("The default Astra star palette is missing");
  if (!overrides) return palette;

  const sourceColors = (
    STAR_PALETTES.find((candidate) => candidate.id === paletteId)?.colors ?? STAR_PALETTES[0].colors
  ).map((color, index) => overrides[index] || color);
  const cacheKey = sourceColors.join(",");
  const cached = customPaletteCache.get(cacheKey);
  if (cached) {
    customPaletteCache.delete(cacheKey);
    customPaletteCache.set(cacheKey, cached);
    return cached;
  }
  const colors = sourceColors.map((color) => new Color(color));
  if (customPaletteCache.size >= 32) {
    const oldestKey = customPaletteCache.keys().next().value;
    if (oldestKey !== undefined) customPaletteCache.delete(oldestKey);
  }
  customPaletteCache.set(cacheKey, colors);
  return colors;
}

/** Write linear RGB values; the original palette thresholds are deliberately uneven. */
export function writeStarColor(
  target: Float32Array,
  offset: number,
  colorMode: boolean,
  seed: number,
  paletteId = DEFAULT_PALETTE,
  overrides?: readonly string[],
): void {
  let color = white;
  if (colorMode) {
    const palette = getPalette(paletteId, overrides);
    const index = seed < 0.36 ? 0 : seed < 0.52 ? 1 : seed < 0.64 ? 2 : seed < 0.74 ? 3 : 4;
    color = palette[index];
  }
  target[offset] = color.r;
  target[offset + 1] = color.g;
  target[offset + 2] = color.b;
}

export function getAstraParticleRevealProgress(progress: number, seed: number): number {
  const clampedProgress = Number.isFinite(progress) ? MathUtils.clamp(progress, 0, 1) : 0;
  const delay = 0.015 * (Number.isFinite(seed) ? MathUtils.clamp(seed, 0, 1) : 0);
  return (
    MathUtils.smoothstep(clampedProgress, delay, 0.14 + delay) *
    MathUtils.lerp(0.2, 1, MathUtils.smoothstep(clampedProgress, 0.2, 1))
  );
}

/** Lift an SVG orbit into the source's shallow, sine-shaped three-dimensional ribbon. */
export class AstraOrbitCurve extends Curve<Vector3> {
  constructor(
    readonly source: Path,
    readonly depth: number,
    readonly rotationDepth: number,
    readonly depthPhase: number,
  ) {
    super();
    this.arcLengthDivisions = 640;
  }

  getPoint(progress: number, target = new Vector3()): Vector3 {
    const clampedProgress = MathUtils.clamp(progress, 0, 1);
    const point = this.source.getPointAt(clampedProgress);
    const envelope = Math.sin(clampedProgress * Math.PI);
    const depth =
      Math.sin(clampedProgress * Math.PI * 1.35 + this.depthPhase) *
      this.depth *
      this.rotationDepth *
      envelope;
    return target.set((point.x - 114.973) * (9.7 / 325), (211.36 - point.y) * (9.7 / 325), depth);
  }
}

/** Seeded Mulberry32 generator. Draw order is part of the particle distribution. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    let value = (state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    return (
      (((value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ (value >>> 14)) >>> 0) /
      0x100000000
    );
  };
}

export function scatterHash(
  first: number,
  second: number,
  firstWeight: number,
  secondWeight: number,
): number {
  const value = 43758.5453 * Math.sin(first * firstWeight + second * secondWeight);
  return value - Math.floor(value);
}

export function configureDataTexture<Texture extends DataTexture>(
  texture: Texture,
  interpolate: boolean,
): Texture {
  texture.magFilter = interpolate ? LinearFilter : NearestFilter;
  texture.minFilter = interpolate ? LinearFilter : NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export type Float32DataTexture = DataTexture & {
  image: { data: Float32Array; width: number; height: number };
};

function createFloat32Texture(
  data: Float32Array,
  width: number,
  height: number,
): Float32DataTexture {
  return Object.assign(new DataTexture(data, width, height, RGBAFormat, FloatType), {
    image: { data, width, height },
  });
}

export function createPathShapeTexture(): Float32DataTexture {
  return configureDataTexture(createFloat32Texture(new Float32Array(4096), 1024, 1), false);
}

export function createOrbitTexture(curve: Curve<Vector3>): {
  samples: Float32Array;
  texture: Float32DataTexture;
} {
  const samples = new Float32Array(2048);
  const point = new Vector3();
  for (let index = 0; index < 512; index += 1) {
    curve.getPointAt(index / 511, point);
    const offset = 4 * index;
    samples[offset] = point.x;
    samples[offset + 1] = point.y;
    samples[offset + 2] = point.z;
    samples[offset + 3] = 1;
  }
  return {
    samples,
    texture: configureDataTexture(createFloat32Texture(samples, 512, 1), false),
  };
}

export function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

export function middleEnvelope(progress: number): number {
  return Math.sin(MathUtils.clamp(progress, 0, 1) * Math.PI);
}

export function tipFade(progress: number): number {
  return MathUtils.smoothstep(progress, 0, 0.055) * (1 - MathUtils.smoothstep(progress, 0.945, 1));
}

export function sizeFalloff(progress: number, strength: number): number {
  return MathUtils.lerp(
    1,
    0.14 + 0.86 * middleEnvelope(progress) ** 0.68,
    MathUtils.clamp(strength, 0, 1),
  );
}

export function densityProgress(progress: number, strength: number): number {
  const phase = positiveModulo(progress, 1);
  return (
    phase + (MathUtils.clamp(strength, 0, 0.98) * Math.sin(phase * Math.PI * 2)) / (2 * Math.PI)
  );
}

export function easeOutExpo(progress: number): number {
  return progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
}

export function getFlowSpeed(curve: Curve<Vector3>, speed: number, inward: boolean): number {
  const startRadiusSquared = curve.getPointAt(0).lengthSq();
  const endsCloserToCenter = curve.getPointAt(1).lengthSq() < startRadiusSquared;
  return Math.abs(speed) * ((inward ? endsCloserToCenter : !endsCloserToCenter) ? 1 : -1);
}

/** Interpolate the RGBA path texture exactly as the vertex shader does. */
export function samplePath(samples: Float32Array, progress: number, target: Vector3): Vector3 {
  const sampleCount = Math.max(Math.floor(samples.length / 4), 1);
  const scaledProgress = MathUtils.clamp(progress, 0, 1) * (sampleCount - 1);
  const lowerIndex = Math.floor(scaledProgress);
  const upperIndex = Math.min(lowerIndex + 1, sampleCount - 1);
  const blend = scaledProgress - lowerIndex;
  const lowerOffset = 4 * lowerIndex;
  const upperOffset = 4 * upperIndex;
  return target.set(
    MathUtils.lerp(samples[lowerOffset] ?? 0, samples[upperOffset] ?? 0, blend),
    MathUtils.lerp(samples[lowerOffset + 1] ?? 0, samples[upperOffset + 1] ?? 0, blend),
    MathUtils.lerp(samples[lowerOffset + 2] ?? 0, samples[upperOffset + 2] ?? 0, blend),
  );
}

/** Filled shapes encode each scanline's start/end interval in texture Z/W. */
export function samplePathRange(samples: Float32Array, progress: number, target: Vector2): Vector2 {
  const sampleCount = Math.max(Math.floor(samples.length / 4), 1);
  const offset =
    4 * Math.min(Math.floor(MathUtils.clamp(progress, 0, 0.999999) * sampleCount), sampleCount - 1);
  return target.set(samples[offset + 2] ?? 0, samples[offset + 3] ?? 1);
}

/** Five source SVG contours form the Astra numeral. */
export const ASTRA_ORBIT_SVG = `<svg viewBox="0 0 231 325" xmlns="http://www.w3.org/2000/svg">${["M128.472 2.36011C65.4727 24.3601 10.7725 93.1601 9.97246 162.36C8.97246 248.86 79.4138 262.86 87.9725 262.86C116.973 262.86 135.973 244.36 135.973 221.36C135.973 189.86 102.973 193.86 102.973 209.36", "M224.973 31.8602C132.473 3.86011 29.9727 75.8601 29.9727 159.86C29.9727 247.86 98.4726 259.86 126.473 247.86", "M126.473 215.359C124.639 222.692 117.073 237.159 101.473 236.359C89.1905 235.729 76.0585 219.995 76.4724 195.859C76.4724 165.859 100.473 142.859 132.473 142.859C171.973 142.859 213.473 171.36 213.473 231.36C213.473 276.36 170.473 328.36 85.9727 316.86", "M106.973 237.36C81.9727 240.36 61.4727 222.86 61.4727 184.86C61.4727 153.36 91.9727 123.36 132.473 123.36C172.973 123.36 227.973 149.86 227.973 225.36C227.973 287.36 168.473 322.36 121.473 322.36C53.4727 322.36 10.9727 264.86 2.47266 208.36", "M114.973 211.36C114.973 225.86 92.4727 226.86 92.4727 205.36C92.4727 183.86 109.938 175.36 127.973 175.36C146.008 175.36 174.473 195.86 174.473 230.86C174.473 264.36 148.473 281.86 133.973 287.36C119.473 292.86 81.6727 296.56 54.4727 269.36"].map((path) => `<path d="${path}"/>`).join("")}</svg>`;
