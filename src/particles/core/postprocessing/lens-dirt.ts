import { ClampToEdgeWrapping, DataTexture, LinearFilter, NoColorSpace, RGBAFormat } from "three";

interface NoiseGrid {
  columns: number;
  rows: number;
  values: Float32Array;
}
interface DirtTextureOptions {
  width?: number;
  height?: number;
  seed?: number;
}
type RandomSource = () => number;
let defaultDirtPixels: Uint8Array | undefined;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}
function normalizeTextureSize(size: number | undefined, fallback: number): number {
  return size !== undefined && Number.isFinite(size) ? clamp(Math.floor(size), 16, 1024) : fallback;
}
function createNoiseGrid(columns: number, rows: number, random: RandomSource): NoiseGrid {
  const values = new Float32Array(columns * rows);
  for (let index = 0; index < values.length; index++) values[index] = random();
  return { columns, rows, values };
}
function sampleNoiseGrid(grid: NoiseGrid, normalizedX: number, normalizedY: number): number {
  const x = clamp(normalizedX, 0, 1) * (grid.columns - 1);
  const y = clamp(normalizedY, 0, 1) * (grid.rows - 1);
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.min(left + 1, grid.columns - 1);
  const bottom = Math.min(top + 1, grid.rows - 1);
  const horizontalMix = smoothstep(0, 1, x - left);
  const verticalMix = smoothstep(0, 1, y - top);
  return (
    (grid.values[top * grid.columns + left] * (1 - horizontalMix) +
      grid.values[top * grid.columns + right] * horizontalMix) *
      (1 - verticalMix) +
    (grid.values[bottom * grid.columns + left] * (1 - horizontalMix) +
      grid.values[bottom * grid.columns + right] * horizontalMix) *
      verticalMix
  );
}
function centeredRandom(random: RandomSource): number {
  return (random() + random() + random() + random() + random() + random() - 3) / 3;
}
function pixelNoise(x: number, y: number, seed: number): number {
  let hash = Math.imul(x + 31 * seed, 0x466f45d);
  hash ^= Math.imul(y + 17 * seed, 0x127409f);
  hash = Math.imul(hash ^ (hash >>> 13), 0x4bf19f61);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000;
}
function paintDirtSpot(
  pixels: Float32Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  intensity: number,
  seed: number,
): void {
  const spotRadius = Math.max(radius, 0.5);
  const left = Math.max(0, Math.floor(centerX - spotRadius - 1));
  const right = Math.min(width - 1, Math.ceil(centerX + spotRadius + 1));
  const top = Math.max(0, Math.floor(centerY - spotRadius - 1));
  const bottom = Math.min(height - 1, Math.ceil(centerY + spotRadius + 1));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const distance = Math.hypot(x - centerX, y - centerY) / spotRadius;
      if (distance >= 1) continue;
      const noise = pixelNoise(x, y, seed);
      if (distance > 0.42 && noise < 0.3 + 0.24 * distance) continue;
      const grain = 0.52 + 0.48 * noise;
      const value = intensity * (1 - smoothstep(0.48, 1, distance)) * grain;
      const offset = y * width + x;
      pixels[offset] = Math.max(pixels[offset], value);
    }
  }
}

/** Deterministic lens dirt: cloud noise, wipe marks, grit clusters and thin scratches. */
export function createDirtPixels(width: number, height: number, seed: number): Uint8Array {
  let randomState = seed >>> 0;
  const random = (): number => {
    let value = (randomState += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
  const coarseNoise = createNoiseGrid(13, 10, random);
  const fineNoise = createNoiseGrid(47, 35, random);
  const wipeMarks = Array.from({ length: 7 }, () => {
    const angle = random() * Math.PI;
    return {
      centerX: 0.08 + 0.84 * random(),
      centerY: 0.08 + 0.84 * random(),
      cosine: Math.cos(angle),
      frequency: 8 + 18 * random(),
      phase: random() * Math.PI * 2,
      radiusX: 0.08 + 0.18 * random(),
      radiusY: 0.035 + 0.09 * random(),
      sine: Math.sin(angle),
      strength: 0.035 + 0.075 * random(),
    };
  });
  const luminance = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const normalizedY = y / Math.max(height - 1, 1);
    for (let x = 0; x < width; x++) {
      const normalizedX = x / Math.max(width - 1, 1);
      const coarse = sampleNoiseGrid(coarseNoise, normalizedX, normalizedY);
      const fine = sampleNoiseGrid(fineNoise, normalizedX, normalizedY);
      const grain = random();
      const cloud = smoothstep(0.43, 0.74, 0.68 * coarse + 0.32 * fine);
      let brightness =
        0.018 + 0.032 * coarse + 0.022 * fine + 0.012 * grain + cloud * (0.038 + 0.032 * grain);
      for (const wipe of wipeMarks) {
        const offsetX = normalizedX - wipe.centerX;
        const offsetY = normalizedY - wipe.centerY;
        const localX = (offsetX * wipe.cosine + offsetY * wipe.sine) / wipe.radiusX;
        const localY = (-offsetX * wipe.sine + offsetY * wipe.cosine) / wipe.radiusY;
        const radiusSquared = localX * localX + localY * localY;
        if (radiusSquared >= 1) continue;
        const envelope = 1 - smoothstep(0.18, 1, Math.sqrt(radiusSquared));
        const ridge = Math.pow(
          0.5 + 0.5 * Math.sin((0.72 * localX + localY) * wipe.frequency + wipe.phase),
          8,
        );
        brightness += wipe.strength * envelope * (0.18 + 0.82 * ridge) * (0.5 + 0.5 * grain);
      }
      const sparkle = random();
      if (sparkle > 0.965) brightness += 0.5 * Math.pow((sparkle - 0.965) / 0.035, 1.8);
      luminance[y * width + x] = brightness;
    }
  }
  const clusters = Array.from({ length: 18 }, () => ({
    x: random() * width,
    y: random() * height,
    spreadX: width * (0.022 + 0.095 * random()),
    spreadY: height * (0.018 + 0.075 * random()),
  }));
  const gritCount = Math.max(32, Math.round((width * height) / 58));
  for (let index = 0; index < gritCount; index++) {
    let x = random() * width;
    let y = random() * height;
    if (random() < 0.58) {
      const cluster = clusters[Math.floor(random() * clusters.length)];
      x = cluster.x + centeredRandom(random) * cluster.spreadX;
      y = cluster.y + centeredRandom(random) * cluster.spreadY;
    }
    paintDirtSpot(
      luminance,
      width,
      height,
      x,
      y,
      0.52 + 1.15 * Math.pow(random(), 3),
      0.24 + 0.7 * Math.pow(random(), 1.8),
      seed + index,
    );
  }
  const smudgeCount = Math.max(6, Math.round((width * height) / 4e3));
  for (let index = 0; index < smudgeCount; index++) {
    const centerX = random() * width;
    const centerY = random() * height;
    const spotCount = 2 + Math.floor(4 * random());
    const intensity = 0.28 + 0.5 * random();
    for (let spot = 0; spot < spotCount; spot++) {
      paintDirtSpot(
        luminance,
        width,
        height,
        centerX + 3.5 * centeredRandom(random),
        centerY + 3.5 * centeredRandom(random),
        1.2 + 3.8 * random(),
        intensity * (0.55 + 0.45 * random()),
        seed + 7 * index + spot,
      );
    }
  }
  const scratchCount = Math.max(3, Math.round((width * height) / 2e4));
  for (let index = 0; index < scratchCount; index++) {
    const centerX = random() * width;
    const centerY = random() * height;
    const angle = random() * Math.PI * 2;
    const length = width * (0.08 + 0.22 * random());
    const steps = Math.max(1, Math.ceil(length / 0.7));
    const intensity = 0.07 + 0.15 * random();
    for (let step = 0; step <= steps; step++) {
      if (random() < 0.28) continue;
      const progress = step / steps;
      const jitter = 0.9 * centeredRandom(random);
      paintDirtSpot(
        luminance,
        width,
        height,
        centerX + Math.cos(angle) * length * progress - Math.sin(angle) * jitter,
        centerY + Math.sin(angle) * length * progress + Math.cos(angle) * jitter,
        0.45 + 0.45 * random(),
        intensity * (0.55 + 0.45 * random()),
        seed + 131 * index + step,
      );
    }
  }
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < luminance.length; index++) {
    const value = Math.round(255 * Math.pow(clamp(luminance[index], 0, 1), 0.94));
    const offset = 4 * index;
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
    pixels[offset + 3] = 255;
  }
  return pixels;
}

export function createDirtTexture(options: DirtTextureOptions = {}): DataTexture {
  const width = normalizeTextureSize(options.width, 256);
  const height = normalizeTextureSize(options.height, 192);
  const seed =
    options.seed !== undefined && Number.isFinite(options.seed)
      ? Math.floor(options.seed)
      : 0xa57ad175;
  const pixels =
    width === 256 && height === 192 && seed === 0xa57ad175
      ? (defaultDirtPixels ??= createDirtPixels(width, height, seed))
      : createDirtPixels(width, height, seed);
  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.name = "Astra procedural lens dirt";
  texture.colorSpace = NoColorSpace;
  texture.flipY = false;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
