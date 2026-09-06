/** Public configuration boundary: scene keyframes are normalized into typed engine controls. */
import type { AstraKeyframe, AstraSceneConfig, AstraSceneSection } from "../engine/types";
import type { ResolvedHeroLayout } from "./keyframes";
import type { RuntimeConfig } from "./runtime-defaults";
import {
  interpolateAstraKeyframes,
  isPlainRecord,
  mergeAstraRecords,
  selectAstraRuntimeOverrides,
} from "./keyframes";
import {
  ownDataValue,
  pickAstraRuntimeOverrides,
  resolveAstraRuntimeData,
  resolveEngineConfig,
} from "./runtime-config";

export * from "./runtime-config";
export * from "./keyframes";
export { DEFAULT_HERO_LAYOUT, DEFAULT_SCENE } from "./scene-defaults";

function sceneSection(value: unknown): Record<string, unknown> {
  return isPlainRecord(value) ? value : {};
}
export function getAstraSceneValues(scene: AstraKeyframe) {
  return {
    background: sceneSection(scene.background),
    camera: sceneSection(scene.camera),
    core: sceneSection(scene.core),
    effects: sceneSection(scene.effects),
    interaction: sceneSection(scene.interaction),
    lighting: sceneSection(scene.lighting),
    motion: sceneSection(scene.motion),
    particles: sceneSection(scene.particles),
    renderer: sceneSection(scene.renderer),
  };
}
export function getAstraBoolean(
  section: AstraSceneSection,
  key: string,
  fallback: boolean,
): boolean {
  const value = section[key];
  return typeof value === "boolean" ? value : fallback;
}
export function getAstraNumber(
  section: AstraSceneSection,
  key: string,
  fallback: number,
  bounds?: { min?: number; max?: number },
): number {
  const value = section[key];
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(bounds?.max ?? Infinity, Math.max(bounds?.min ?? -Infinity, number));
}
export function getAstraString(section: AstraSceneSection, key: string, fallback: string): string {
  const value = section[key];
  return typeof value === "string" ? value : fallback;
}
function sceneValue(section: unknown, key: string): unknown {
  return isPlainRecord(section) ? ownDataValue(section, key) : undefined;
}
function sceneToRuntimeOverrides(scene: AstraKeyframe): Record<string, unknown> {
  const { effects, interaction, motion, particles } = getAstraSceneValues(scene);
  const flareSize = sceneValue(effects, "flareSize");
  const animation = sceneValue(motion, "animation");
  return {
    animationPlaying: sceneValue(motion, "autoplay"),
    animationPreset: animation === "convergeTilt" ? "converge-tilt" : animation,
    bloomIntensity: sceneValue(effects, "bloomIntensity"),
    bloomThreshold: sceneValue(effects, "bloomThreshold"),
    colorPaletteColors: sceneValue(particles, "colors"),
    convergeDuration: sceneValue(motion, "revealDuration"),
    dirtyGlass: {
      enabled: sceneValue(effects, "dirtyGlass"),
      texture: sceneValue(effects, "textureIntensity"),
    },
    faceForward: sceneValue(interaction, "faceForward"),
    interaction: {
      followDamping: sceneValue(interaction, "followDamping"),
      particleRepel: sceneValue(interaction, "particleRepel"),
      repelDistance: sceneValue(interaction, "repelDistance"),
      repelFalloff: sceneValue(interaction, "repelFalloff"),
      repelHighlight: sceneValue(interaction, "repelHighlight"),
      repelHighlightRadius: sceneValue(interaction, "repelHighlightRadius"),
      repelPressMultiplier: sceneValue(interaction, "repelPressMultiplier"),
      repelRadius: sceneValue(interaction, "repelRadius"),
      repelReturnSpring: sceneValue(interaction, "repelReturnSpring"),
      repelSpring: sceneValue(interaction, "repelSpring"),
      rotationLag: sceneValue(interaction, "pathLag"),
      smearCurl: sceneValue(interaction, "smearCurl"),
      smearTrailLength: sceneValue(interaction, "smearTrailLength"),
    },
    interactionMode: sceneValue(interaction, "mode"),
    lensFlare: {
      enabled: sceneValue(effects, "lensFlare"),
      intensity: sceneValue(effects, "flareIntensity"),
      streakLength:
        typeof flareSize === "number" && Number.isFinite(flareSize) ? 0.085 * flareSize : undefined,
    },
    pathShapeAutoRotate: sceneValue(motion, "shapeAutoRotate"),
    pathShapeAutoRotateAmount: sceneValue(motion, "shapeRotationAmount"),
    pathShapeAutoRotateSpeed: sceneValue(motion, "shapeRotationSpeed"),
    rotationDepth: sceneValue(particles, "pathDepth"),
    scrollDisperseDistance: sceneValue(motion, "disperseDistance"),
    scrollStarDriftSpeed: sceneValue(motion, "starDriftSpeed"),
    scrollStartOffset: sceneValue(motion, "scrollStart"),
    scrollTextFadeDistance: sceneValue(motion, "textFadeDistance"),
    showCenterCluster: sceneValue(particles, "centerCluster"),
    stars: {
      density: sceneValue(particles, "starDensity"),
      densityFalloff: sceneValue(particles, "densityFalloff"),
      flowInward: sceneValue(particles, "flowInward"),
      flowSpeed: sceneValue(particles, "flowSpeed"),
      intensity: sceneValue(particles, "starIntensity"),
      scatter: sceneValue(particles, "scatter"),
      size: sceneValue(particles, "starSize"),
      sizeFalloff: sceneValue(particles, "sizeFalloff"),
      twinkleSpeed: sceneValue(particles, "twinkleSpeed"),
    },
  };
}
export interface PreparedRuntimeConfig {
  readonly override: AstraKeyframe;
  readonly resolved: RuntimeConfig;
}
export function prepareAstraRuntimeConfig(
  base: RuntimeConfig,
  keyframe: AstraKeyframe,
): PreparedRuntimeConfig {
  const selected = selectAstraRuntimeOverrides(keyframe);
  const engine = sceneValue(selected, "engine");
  const mapped = mergeAstraRecords(
    pickAstraRuntimeOverrides(sceneToRuntimeOverrides(selected)),
    pickAstraRuntimeOverrides(selected),
  );
  const override = mergeAstraRecords(
    mapped,
    isPlainRecord(engine) ? pickAstraRuntimeOverrides(engine) : undefined,
  );
  return { override, resolved: resolveAstraRuntimeData(override, base) };
}
export function resolveAstraRendererConfig(
  layout: ResolvedHeroLayout,
  data: AstraSceneConfig,
): RuntimeConfig {
  const engine = sceneValue(data, "engine");
  const mapped = mergeAstraRecords(sceneToRuntimeOverrides(layout.scene), data);
  return resolveEngineConfig(mergeAstraRecords(mapped, isPlainRecord(engine) ? engine : undefined));
}
export function resolvePreparedAstraRuntimeConfig({
  base,
  from,
  progress,
  to,
}: {
  base: RuntimeConfig;
  from: PreparedRuntimeConfig;
  progress: number;
  to: PreparedRuntimeConfig;
}): RuntimeConfig {
  const amount = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  if (amount <= 0 || from === to) return from.resolved;
  if (amount >= 1) return to.resolved;
  const interpolated = interpolateAstraKeyframes({
    easing: "linear",
    from: from.override,
    progress: amount,
    to: to.override,
  });
  return interpolated === from.override
    ? from.resolved
    : interpolated === to.override
      ? to.resolved
      : resolveAstraRuntimeData(interpolated, base);
}
