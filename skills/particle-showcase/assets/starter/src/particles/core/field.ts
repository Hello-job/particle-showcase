// Readable TypeScript port of the extracted Astra particle implementation.
// Provenance and retained third-party terms are documented in THIRD_PARTY_NOTICES.md.
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Object3D,
  Points,
  Vector2,
  Vector3,
} from "three";
import type { Curve } from "three";
import type { RuntimeConfig } from "./config";
import { createDustMaterial, createStarMaterial } from "./field-materials";
import type { DustMaterial, StarMaterial } from "./field-materials";
import {
  ASTRA_ORBIT_SVG,
  AstraOrbitCurve,
  SECONDARY_COLOR_SEEDS,
  SVGLoader,
  createOrbitTexture,
  createRandom,
  densityProgress,
  getFlowSpeed,
  middleEnvelope,
  positiveModulo,
  scatterHash,
  sizeFalloff,
  tipFade,
  writeStarColor,
} from "./geometry";

export {
  createPathShapeTexture,
  densityProgress,
  easeOutExpo,
  positiveModulo,
  samplePath,
  samplePathRange,
  sizeFalloff,
  tipFade,
} from "./geometry";
export type { DustMaterial, StarMaterial } from "./field-materials";

interface OrbitSettings {
  depth: number;
  phase: number;
  speed: number;
  strong: boolean;
}

/** One deterministic orbit for each of the five source contours. */
const ORBIT_SETTINGS: OrbitSettings[] = [
  { depth: 0.62, phase: 0.16, speed: 0.025, strong: true },
  { depth: -0.46, phase: 0.72, speed: -0.018, strong: false },
  { depth: 0.78, phase: 0.38, speed: 0.021, strong: true },
  { depth: -0.7, phase: 0.58, speed: -0.016, strong: false },
  { depth: 0.42, phase: 0.08, speed: 0.03, strong: true },
];

export interface ParticleOrbit {
  group: Group;
  lag: number;
  spin: Vector2;
}

/** CPU state that follows one star/dust layer and its optical flare source. */
export interface ParticlePathLayer {
  curve: Curve<Vector3> | null;
  dustMaterial: DustMaterial | null;
  starMaterial: StarMaterial;
  flareAcrossOffset: number;
  flareBasePosition: Vector3;
  flareClearanceSeed: number;
  flareDepthOffset: number;
  flarePathSamples: Float32Array | null;
  flareProgress: number;
  flareScatter: Vector3;
  flareShapeAcrossScatter: number;
  flareShapeDepthScatter: number;
  flareShapeSeed: number;
  flareSource: Object3D | null;
  isCore: boolean;
  outwardSpeed: number;
  phase: number;
  motionOffset: number;
  speed: number;
  strong: boolean;
  pathShapeDepth: number;
  pathShapeDepthPhase: number;
  pathShapeTravel: number;
  travel: number;
}

export interface ParticleField {
  coreCluster: Points<BufferGeometry, StarMaterial> | null;
  coreSource: Object3D;
  disposables: Array<{ dispose(): void }>;
  group: Group;
  orbits: ParticleOrbit[];
  pathLayers: ParticlePathLayer[];
  secondarySources: Object3D[];
  particleCount: number;
  particleMotionEnabled?: boolean;
  dispose(): void;
}

export interface FieldOptions {
  tier?: number;
  maxParticleCount?: number;
  pixelRatio?: number;
  trackOpticalSources?: boolean;
}

/** Largest-remainder allocation keeps the budget exact and favors visible stars over dust. */
function allocateParticleBudget(requested: number[], budget: number): number[] {
  const requestedTotal = requested.reduce((total, count) => total + count, 0);
  if (budget >= requestedTotal) return requested;
  if (budget <= 0) return requested.map(() => 0);
  const proportional = requested.map((count) => (count / requestedTotal) * budget);
  const allocated = proportional.map(Math.floor);
  let remaining = budget - allocated.reduce((total, count) => total + count, 0);
  const remainders = proportional.map((count, index) => ({
    index,
    fraction: count - allocated[index],
  }));
  remainders.sort(
    (first, second) => second.fraction - first.fraction || first.index - second.index,
  );
  for (const { index } of remainders) {
    if (remaining <= 0) break;
    allocated[index] += 1;
    remaining -= 1;
  }
  for (let orbitIndex = 0; orbitIndex < ORBIT_SETTINGS.length; orbitIndex += 1) {
    const starsIndex = 2 * orbitIndex;
    const dustIndex = starsIndex + 1;
    if (allocated[starsIndex] === 0 && allocated[dustIndex] > 0) {
      allocated[starsIndex] = 1;
      allocated[dustIndex] -= 1;
    }
  }
  return allocated;
}

function createOrbitStars(
  curve: Curve<Vector3>,
  orbit: OrbitSettings,
  speed: number,
  orbitIndex: number,
  config: RuntimeConfig,
  foregroundCount: number,
  backgroundCount: number,
  pixelRatio: number,
) {
  const { stars, colorMode, colorPalette, colorPaletteColors, rotationDepth } = config;
  const count = foregroundCount + backgroundCount;
  const positions = new Float32Array(3 * count);
  const acrossOffsets = new Float32Array(count);
  const brightness = new Float32Array(count);
  const colors = new Float32Array(3 * count);
  const depthOffsets = new Float32Array(count);
  const heroFlags = new Float32Array(count);
  const opacity = new Float32Array(count);
  const progress = new Float32Array(count);
  const scales = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  const twinkleRates = new Float32Array(count);
  const random = createRandom(0x243f6a88 ^ ((orbitIndex + 1) * 0x9e3779b9));
  const colorRandom = createRandom(0xa4093822 ^ ((orbitIndex + 1) * 0x299f31d0));
  const position = new Vector3();
  const tangent = new Vector3();
  const across = new Vector3();
  const flarePosition = new Vector3();
  const densityFalloff = MathUtils.clamp(stars.densityFalloff, 0, 1);
  const scatter = MathUtils.clamp(stars.scatter, 0, 0.45);
  const { samples, texture } = createOrbitTexture(curve);
  let largestScale = -Infinity;
  let flareAcrossOffset = 0;
  let flareDepthOffset = 0;
  let flareProgress = 0.5;
  let heroIndex = 0;

  // The two random streams and their call order reproduce the captured constellation.
  for (let index = 0; index < count; index += 1) {
    const phase = random();
    const pathProgress = densityProgress(phase, densityFalloff);
    const envelope = middleEnvelope(pathProgress);
    curve.getPointAt(pathProgress, position);
    curve.getTangentAt(pathProgress, tangent).normalize();
    across.set(-tangent.y, tangent.x, 0).normalize();
    const spread = scatter * MathUtils.lerp(0.3, 1, envelope) * (0.22 + 0.78 * random());
    const acrossOffset = (random() + random() - 1) * spread;
    const depthOffset = (random() + random() - 1) * spread * 0.65;
    position.addScaledVector(across, acrossOffset);
    position.z += depthOffset;
    const brightProbability = MathUtils.lerp(
      (orbit.strong ? 0.085 : 0.055) * 0.22,
      orbit.strong ? 0.085 : 0.055,
      envelope,
    );
    const bright = random() < brightProbability;
    const scale =
      (bright ? 0.85 + 1.25 * random() : 0.12 + random() ** 2.4 * 0.68) *
      MathUtils.clamp(stars.size, 0.25, 3);
    const intensity =
      (bright ? 2 + 1.5 * random() : 0.56 + 0.78 * random()) * (orbit.strong ? 1 : 0.82);
    const offset = 3 * index;
    positions[offset] = position.x;
    positions[offset + 1] = position.y;
    positions[offset + 2] = position.z;
    acrossOffsets[index] = acrossOffset;
    brightness[index] = intensity;
    writeStarColor(colors, offset, colorMode, colorRandom(), colorPalette, colorPaletteColors);
    depthOffsets[index] = depthOffset;
    opacity[index] = 0.82 + 0.16 * random();
    progress[index] = phase;
    scales[index] = scale;
    twinklePhases[index] = random() * Math.PI * 2;
    twinkleRates[index] = 0.65 + 0.7 * random();
    if (index < foregroundCount && scale > largestScale) {
      largestScale = scale;
      flareAcrossOffset = acrossOffset;
      flareDepthOffset = depthOffset;
      flareProgress = phase;
      heroIndex = index;
      flarePosition.copy(position);
    }
  }

  // Read back rounded float32 values so CPU flare tracking agrees with GPU attributes.
  flareProgress = progress[heroIndex] ?? flareProgress;
  flareAcrossOffset = acrossOffsets[heroIndex] ?? flareAcrossOffset;
  flareDepthOffset = depthOffsets[heroIndex] ?? flareDepthOffset;
  const heroScale = (orbit.strong ? 2.2 : 2.05) * MathUtils.clamp(stars.size, 0.25, 3);
  scales[heroIndex] = Math.max(scales[heroIndex], heroScale);
  brightness[heroIndex] = Math.max(brightness[heroIndex], orbit.strong ? 3.35 : 2.85);
  heroFlags[heroIndex] = 1;
  const pathShapeDepth = orbit.depth * MathUtils.clamp(rotationDepth, 0, 2);
  const pathShapeDepthPhase = 0.82 * orbitIndex;
  const flareShapeSeed = Math.fround(
    positiveModulo(
      (progress[heroIndex] ?? 0) * 0.754877666 +
        (twinklePhases[heroIndex] ?? 0) * 0.159154943 +
        (scales[heroIndex] ?? 0) * 0.117,
      1,
    ),
  );
  const scatterX = scatterHash(
    progress[heroIndex] ?? 0,
    twinklePhases[heroIndex] ?? 0,
    127.1,
    311.7,
  );
  const scatterY = scatterHash(twinklePhases[heroIndex] ?? 0, scales[heroIndex] ?? 0, 269.5, 183.3);
  const scatterZ = scatterHash(progress[heroIndex] ?? 0, brightness[heroIndex] ?? 0, 419.2, 371.9);
  const flareClearanceSeed = scatterHash(
    opacity[heroIndex] ?? 0,
    twinkleRates[heroIndex] ?? 0,
    157.3,
    283.9,
  );
  const flareScatter = new Vector3(scatterX, scatterY, scatterZ);
  const flareShapeAcrossScatter = Math.fround((scatterX + scatterY - 1) * 0.12);
  const flareShapeDepthScatter = Math.fround((scatterZ - 0.5) * 0.22);
  writeStarColor(
    colors,
    3 * heroIndex,
    colorMode,
    SECONDARY_COLOR_SEEDS[orbitIndex] ?? 0.08,
    colorPalette,
    colorPaletteColors,
  );

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("orbitProgress", new Float32BufferAttribute(progress, 1));
  geometry.setAttribute("starAcrossOffset", new Float32BufferAttribute(acrossOffsets, 1));
  geometry.setAttribute("starDepthOffset", new Float32BufferAttribute(depthOffsets, 1));
  geometry.setAttribute("starHero", new Float32BufferAttribute(heroFlags, 1));
  geometry.setAttribute(
    "starBackground",
    new Float32BufferAttribute(new Float32Array(count).fill(1, foregroundCount), 1),
  );
  geometry.setAttribute("starBrightness", new Float32BufferAttribute(brightness, 1));
  geometry.setAttribute("starColor", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("starOpacity", new Float32BufferAttribute(opacity, 1));
  geometry.setAttribute("starScale", new Float32BufferAttribute(scales, 1));
  geometry.setAttribute("twinklePhase", new Float32BufferAttribute(twinklePhases, 1));
  geometry.setAttribute("twinkleRate", new Float32BufferAttribute(twinkleRates, 1));
  const material = createStarMaterial(
    config,
    pixelRatio,
    texture,
    speed,
    pathShapeDepth,
    pathShapeDepthPhase,
    0.5,
    {
      acrossScatter: flareShapeAcrossScatter,
      clearanceSeed: flareClearanceSeed,
      depthScatter: flareShapeDepthScatter,
      scatter: flareScatter,
      seed: flareShapeSeed,
    },
  );
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 40 + orbitIndex;
  return {
    flareAcrossOffset,
    flareBasePosition: flarePosition.clone(),
    flareClearanceSeed,
    flareDepthOffset,
    flarePathSamples: samples,
    flarePosition,
    flareProgress,
    flareScatter,
    flareShapeAcrossScatter,
    flareShapeDepthScatter,
    flareShapeSeed,
    geometry,
    material,
    pathShapeDepth,
    pathShapeDepthPhase,
    pathTexture: texture,
    points,
  };
}

/** Dim, narrow dust ribbons add density around the brighter orbital stars. */
function createOrbitDust(
  curve: Curve<Vector3>,
  orbit: OrbitSettings,
  speed: number,
  orbitIndex: number,
  config: RuntimeConfig,
  count: number,
  pixelRatio: number,
) {
  const { orbitalDust: dust, stars } = config;
  const positions = new Float32Array(3 * count);
  const driftPhases = new Float32Array(count);
  const driftTangents = new Float32Array(3 * count);
  const progress = new Float32Array(count);
  const opacity = new Float32Array(count);
  const scales = new Float32Array(count);
  const random = createRandom(0x9e3779b9 ^ ((orbitIndex + 1) * 0x85ebca6b));
  const position = new Vector3();
  const tangent = new Vector3();
  const across = new Vector3();
  const spread = MathUtils.clamp(dust.spread, 0, 0.65);
  const tightSpread = Math.min(MathUtils.clamp(dust.tightSpread, 0, 0.3), spread);
  const densityFalloff = MathUtils.clamp(stars.densityFalloff, 0, 1);
  const sizeFalloffStrength = MathUtils.clamp(stars.sizeFalloff, 0, 1);
  for (let index = 0; index < count; index += 1) {
    const uniformProgress = (index + 0.92 * random()) / count;
    const clusteredProgress = (random() + random() + random()) / 3;
    const pathProgress = random() < densityFalloff ? clusteredProgress : uniformProgress;
    const envelope = middleEnvelope(pathProgress);
    const sizeEnvelope = MathUtils.lerp(1, 0.18 + 0.82 * envelope ** 0.68, sizeFalloffStrength);
    curve.getPointAt(pathProgress, position);
    curve.getTangentAt(pathProgress, tangent).normalize();
    across.set(-tangent.y, tangent.x, 0).normalize();
    const tight = random() < 0.68;
    const localSpread = (tight ? tightSpread : spread) * sizeEnvelope;
    position.addScaledVector(across, (random() + random() - 1) * localSpread);
    position.z += (random() + random() - 1) * localSpread * 0.7;
    const offset = 3 * index;
    positions[offset] = position.x;
    positions[offset + 1] = position.y;
    positions[offset + 2] = position.z;
    progress[index] = pathProgress;
    driftPhases[index] = random();
    driftTangents[offset] = tangent.x;
    driftTangents[offset + 1] = tangent.y;
    driftTangents[offset + 2] = tangent.z;
    scales[index] = random() * (tight ? 1 : 0.72) * sizeEnvelope;
    opacity[index] =
      MathUtils.smoothstep(pathProgress, 0, 0.07) *
      (1 - MathUtils.smoothstep(pathProgress, 0.84, 1)) *
      (tight ? 1 : 0.72) *
      (0.38 + 0.58 * random()) *
      MathUtils.lerp(1, 0.3 + 0.7 * envelope, sizeFalloffStrength);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("driftPhase", new Float32BufferAttribute(driftPhases, 1));
  geometry.setAttribute("driftTangent", new Float32BufferAttribute(driftTangents, 3));
  geometry.setAttribute("orbitProgress", new Float32BufferAttribute(progress, 1));
  geometry.setAttribute("particleOpacity", new Float32BufferAttribute(opacity, 1));
  geometry.setAttribute("particleScale", new Float32BufferAttribute(scales, 1));
  const material = createDustMaterial(config, orbit, speed, pixelRatio);
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 70 + orbitIndex;
  return { geometry, material, points };
}

/** Optional dense center with a single brightest star used as the core flare source. */
function createCoreStars(config: RuntimeConfig, count: number, pixelRatio: number) {
  const { stars, colorMode, colorPalette, colorPaletteColors } = config;
  const positions = new Float32Array(3 * count);
  const brightness = new Float32Array(count);
  const colors = new Float32Array(3 * count);
  const heroFlags = new Float32Array(count);
  const opacity = new Float32Array(count);
  const scales = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  const twinkleRates = new Float32Array(count);
  const random = createRandom(0xb7e15162);
  const colorRandom = createRandom(0xc0ac29b7);
  let heroIndex = 0;
  let maximumBrightness = -Infinity;
  for (let index = 0; index < count; index += 1) {
    const radius = random() ** 2.4 * 0.42;
    const angle = random() * Math.PI * 2;
    const offset = 3 * index;
    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * 0.72;
    positions[offset + 2] = (random() - 0.5) * 0.16;
    const centerWeight = 1 - radius / 0.42;
    brightness[index] = 1.2 + 2.8 * centerWeight + 0.6 * random();
    writeStarColor(
      colors,
      offset,
      colorMode,
      centerWeight > 0.74 ? 0.99 : colorRandom(),
      colorPalette,
      colorPaletteColors,
    );
    opacity[index] = 0.62 + 0.38 * centerWeight;
    scales[index] =
      (0.28 + 1.45 * centerWeight + 0.45 * random()) * MathUtils.clamp(stars.size, 0.25, 3) * 0.8;
    const combinedBrightness = brightness[index] * scales[index];
    if (combinedBrightness > maximumBrightness) {
      heroIndex = index;
      maximumBrightness = combinedBrightness;
    }
    twinklePhases[index] = random() * Math.PI * 2;
    twinkleRates[index] = 0.55 + 0.45 * random();
  }
  heroFlags[heroIndex] = 1;
  const heroOffset = 3 * heroIndex;
  const flareBasePosition = new Vector3(
    positions[heroOffset] ?? 0,
    positions[heroOffset + 1] ?? 0,
    positions[heroOffset + 2] ?? 0,
  );
  const flareScatter = new Vector3(
    scatterHash(0, twinklePhases[heroIndex] ?? 0, 127.1, 311.7),
    scatterHash(twinklePhases[heroIndex] ?? 0, scales[heroIndex] ?? 0, 269.5, 183.3),
    scatterHash(0, brightness[heroIndex] ?? 0, 419.2, 371.9),
  );
  const flareClearanceSeed = scatterHash(
    opacity[heroIndex] ?? 0,
    twinkleRates[heroIndex] ?? 0,
    157.3,
    283.9,
  );
  const flareShapeSeed = Math.fround(
    positiveModulo(
      0 + (twinklePhases[heroIndex] ?? 0) * 0.159154943 + (scales[heroIndex] ?? 0) * 0.117,
      1,
    ),
  );
  const flareShapeAcrossScatter = Math.fround((flareScatter.x + flareScatter.y - 1) * 0.12);
  const flareShapeDepthScatter = Math.fround((flareScatter.z - 0.5) * 0.22);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("orbitProgress", new Float32BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("starAcrossOffset", new Float32BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("starDepthOffset", new Float32BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("starHero", new Float32BufferAttribute(heroFlags, 1));
  geometry.setAttribute("starBackground", new Float32BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("starBrightness", new Float32BufferAttribute(brightness, 1));
  geometry.setAttribute("starColor", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("starOpacity", new Float32BufferAttribute(opacity, 1));
  geometry.setAttribute("starScale", new Float32BufferAttribute(scales, 1));
  geometry.setAttribute("twinklePhase", new Float32BufferAttribute(twinklePhases, 1));
  geometry.setAttribute("twinkleRate", new Float32BufferAttribute(twinkleRates, 1));
  const material = createStarMaterial(
    { ...config, stars: { ...stars, intensity: 1.22 * stars.intensity } },
    pixelRatio,
    null,
    0,
    0.18,
    2.4,
    0.5,
    {
      acrossScatter: flareShapeAcrossScatter,
      clearanceSeed: flareClearanceSeed,
      depthScatter: flareShapeDepthScatter,
      scatter: flareScatter,
      seed: flareShapeSeed,
    },
  );
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 100;
  return {
    flareBasePosition,
    flareClearanceSeed,
    flareProgress: 0,
    flareScatter,
    flareShapeAcrossScatter,
    flareShapeDepthScatter,
    flareShapeSeed,
    geometry,
    material,
    points,
  };
}

/** Build the deterministic star attributes, orbital dust and optical tracking objects. */
export function generateAstraField(
  config: RuntimeConfig,
  options: FieldOptions = {},
): ParticleField {
  const tier = options.tier ?? 3;
  const trackOpticalSources = options.trackOpticalSources ?? true;
  const densityLimit = tier <= 1 ? 2 : 4;
  const starDensity = MathUtils.clamp(config.stars.density, 0.25, densityLimit);
  const dustDensity = MathUtils.clamp(config.orbitalDust.density, 0.1, densityLimit);
  const requested = ORBIT_SETTINGS.flatMap((orbit) => [
    Math.max(8, Math.round((orbit.strong ? 220 : 170) * starDensity)),
    config.orbitalDust.enabled
      ? Math.max(1, Math.round((orbit.strong ? 150 : 90) * dustDensity))
      : 0,
  ]);
  requested.push(config.showCenterCluster ? Math.max(18, Math.round(24 * starDensity)) : 0);
  const requestedBackground = requested.map((count, index) =>
    config.animationPreset === "converge-tilt" &&
    index < 2 * ORBIT_SETTINGS.length &&
    index % 2 === 0
      ? Math.ceil((0.12 * count) / 0.88)
      : 0,
  );
  const requestedTotal = [...requested, ...requestedBackground].reduce(
    (total, count) => total + count,
    0,
  );
  const maxParticleCount = options.maxParticleCount ?? requestedTotal;
  const budget =
    tier === 0
      ? 0
      : Number.isFinite(maxParticleCount)
        ? Math.max(0, Math.floor(maxParticleCount))
        : maxParticleCount === Infinity
          ? requestedTotal
          : 0;
  const allocated = allocateParticleBudget(requested, budget);
  const foregroundTotal = allocated.reduce((total, count) => total + count, 0);
  const allocatedBackground = allocateParticleBudget(
    requestedBackground,
    Math.max(0, budget - foregroundTotal),
  );
  const pixelRatio = Number.isFinite(options.pixelRatio)
    ? MathUtils.clamp(options.pixelRatio ?? 1, 0.1, tier <= 1 ? 1 : tier === 2 ? 1.5 : 2)
    : 1;
  const group = new Group();
  const coreSource = new Object3D();
  coreSource.scale.setScalar(0);
  group.add(coreSource);
  const disposables: ParticleField["disposables"] = [];
  const orbits: ParticleOrbit[] = [];
  const pathLayers: ParticlePathLayer[] = [];
  const secondarySources: Object3D[] = [];
  let coreCluster: Points<BufferGeometry, StarMaterial> | null = null;
  const particleCount =
    foregroundTotal + allocatedBackground.reduce((total, count) => total + count, 0);

  if (particleCount > 0) {
    const contours = new SVGLoader().parse(ASTRA_ORBIT_SVG).paths.map((path) => path.subPaths[0]);
    contours.forEach((contour, orbitIndex) => {
      const orbit = ORBIT_SETTINGS[orbitIndex];
      const starCount = allocated[2 * orbitIndex];
      const dustCount = allocated[2 * orbitIndex + 1];
      if (!contour || !orbit || starCount === 0) return;
      const curve = new AstraOrbitCurve(
        contour,
        orbit.depth,
        MathUtils.clamp(config.rotationDepth, 0, 2),
        0.82 * orbitIndex,
      );
      const speed = getFlowSpeed(curve, orbit.speed, config.stars.flowInward);
      const outwardSpeed = getFlowSpeed(curve, orbit.speed, false);
      const stars = createOrbitStars(
        curve,
        orbit,
        speed,
        orbitIndex,
        config,
        starCount,
        allocatedBackground[2 * orbitIndex],
        pixelRatio,
      );
      const dust =
        dustCount > 0
          ? createOrbitDust(curve, orbit, speed, orbitIndex, config, dustCount, pixelRatio)
          : null;
      const orbitGroup = new Group();
      orbitGroup.add(stars.points);
      if (dust) {
        orbitGroup.add(dust.points);
        disposables.push(dust.geometry, dust.material);
      }
      let flareSource: Object3D | null = null;
      if (trackOpticalSources) {
        flareSource = new Object3D();
        flareSource.position.copy(stars.flarePosition);
        flareSource.userData.astraFlareScatter = stars.flareScatter;
        const flareProgress = densityProgress(stars.flareProgress, config.stars.densityFalloff);
        flareSource.scale.setScalar(
          tipFade(flareProgress) * sizeFalloff(flareProgress, config.stars.sizeFalloff),
        );
        orbitGroup.add(flareSource);
        secondarySources.push(flareSource);
      }
      group.add(orbitGroup);
      orbits.push({ group: orbitGroup, lag: 0.18 + 0.17 * orbitIndex, spin: new Vector2() });
      pathLayers.push({
        curve,
        dustMaterial: dust?.material ?? null,
        flareAcrossOffset: stars.flareAcrossOffset,
        flareBasePosition: stars.flareBasePosition,
        flareClearanceSeed: stars.flareClearanceSeed,
        flareDepthOffset: stars.flareDepthOffset,
        flarePathSamples: stars.flarePathSamples,
        flareProgress: stars.flareProgress,
        flareScatter: stars.flareScatter,
        flareShapeAcrossScatter: stars.flareShapeAcrossScatter,
        flareShapeDepthScatter: stars.flareShapeDepthScatter,
        flareShapeSeed: stars.flareShapeSeed,
        flareSource,
        isCore: false,
        outwardSpeed,
        phase: orbit.phase,
        motionOffset: 0,
        speed,
        starMaterial: stars.material,
        strong: orbit.strong,
        pathShapeDepth: stars.pathShapeDepth,
        pathShapeDepthPhase: stars.pathShapeDepthPhase,
        pathShapeTravel: 0,
        travel: orbit.phase,
      });
      disposables.push(stars.geometry, stars.material, stars.pathTexture);
    });
    const coreCount = allocated[2 * ORBIT_SETTINGS.length];
    if (coreCount > 0) {
      const core = createCoreStars(config, coreCount, pixelRatio);
      group.add(core.points);
      if (trackOpticalSources) {
        coreSource.position.copy(core.flareBasePosition);
        coreSource.scale.setScalar(1);
        coreSource.userData.astraFlareScatter = core.flareScatter;
        core.points.add(coreSource);
      }
      coreCluster = core.points;
      disposables.push(core.geometry, core.material);
      pathLayers.push({
        curve: null,
        dustMaterial: null,
        flareAcrossOffset: 0,
        flareBasePosition: core.flareBasePosition,
        flareClearanceSeed: core.flareClearanceSeed,
        flareDepthOffset: 0,
        flarePathSamples: null,
        flareProgress: core.flareProgress,
        flareScatter: core.flareScatter,
        flareShapeAcrossScatter: core.flareShapeAcrossScatter,
        flareShapeDepthScatter: core.flareShapeDepthScatter,
        flareShapeSeed: core.flareShapeSeed,
        flareSource: trackOpticalSources ? coreSource : null,
        isCore: true,
        outwardSpeed: 0,
        phase: 0,
        motionOffset: 0,
        speed: 0,
        starMaterial: core.material,
        strong: true,
        pathShapeDepth: 0.18,
        pathShapeDepthPhase: 2.4,
        pathShapeTravel: 0,
        travel: 0,
      });
    }
  }
  let disposed = false;
  return {
    coreCluster,
    coreSource,
    disposables,
    group,
    orbits,
    pathLayers,
    secondarySources,
    particleCount,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposables.forEach((resource) => resource.dispose());
      group.clear();
    },
  };
}
