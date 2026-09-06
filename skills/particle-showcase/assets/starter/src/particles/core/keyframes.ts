import type { AstraCueData, AstraEasing, AstraKeyframe, AstraSceneConfig } from "../engine/types";
import { DEFAULT_HERO_LAYOUT } from "./scene-defaults";

export interface ResolvedHeroLayout {
  activationLine: number;
  content: Record<string, unknown>;
  easing: AstraEasing;
  engine: Record<string, unknown>;
  keyframes: AstraKeyframe[];
  scene: AstraKeyframe;
  version: number;
  [key: string]: unknown;
}
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const NO_OVERRIDE = Symbol("no-astra-override");
const KEYFRAME_OVERRIDES = Symbol("astra-keyframe-overrides");
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !UNSAFE_KEYS.has(key))
        .map(([key, child]) => [key, cloneValue(child)]),
    );
  }
  return value;
}

/** Undefined/nonfinite overrides retain the baseline; arrays replace by index. */
export function mergeAstraValue(base: unknown, override: unknown): unknown {
  if (override === undefined || (typeof override === "number" && !Number.isFinite(override)))
    return cloneValue(base);
  if (Array.isArray(override))
    return override.map((value, index) =>
      mergeAstraValue(Array.isArray(base) ? base[index] : undefined, value),
    );
  if (isPlainRecord(override)) {
    const original = isPlainRecord(base) ? base : {};
    return Object.fromEntries(
      [...new Set([...Object.keys(original), ...Object.keys(override)])]
        .filter((key) => !UNSAFE_KEYS.has(key))
        .map((key) => [key, mergeAstraValue(original[key], override[key])]),
    );
  }
  return cloneValue(override);
}
export function mergeAstraRecords(base: object, override: unknown): Record<string, unknown> {
  const result = mergeAstraValue(base, override);
  if (!isPlainRecord(result)) throw new TypeError("Expected an Astra configuration object");
  return result;
}
export function markAstraKeyframeOverrides<T extends object>(frame: T, ...overrides: unknown[]): T {
  Object.defineProperty(frame, KEYFRAME_OVERRIDES, {
    configurable: true,
    value: overrides.reduce((merged, value) => mergeAstraValue(merged, value), {}),
  });
  return frame;
}
function selectMarkedValues(
  frame: Record<string, unknown>,
  marked: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(marked).flatMap(([key, override]) => {
      if (UNSAFE_KEYS.has(key) || !(key in frame)) return [];
      const value = frame[key];
      return [
        [
          key,
          isPlainRecord(override) && isPlainRecord(value)
            ? selectMarkedValues(value, override)
            : cloneValue(value),
        ],
      ];
    }),
  );
}
export function selectAstraRuntimeOverrides(frame: AstraKeyframe): Record<string, unknown> {
  const marked: unknown = Object.getOwnPropertyDescriptor(frame, KEYFRAME_OVERRIDES)?.value;
  return isPlainRecord(marked) ? selectMarkedValues(frame, marked) : frame;
}
function differenceFromScene(base: unknown, value: unknown): unknown {
  if (Array.isArray(value)) {
    return Array.isArray(base) &&
      value.length === base.length &&
      value.every((child, index) => differenceFromScene(base[index], child) === NO_OVERRIDE)
      ? NO_OVERRIDE
      : cloneValue(value);
  }
  if (isPlainRecord(value)) {
    const original = isPlainRecord(base) ? base : {};
    const differences = Object.entries(value).flatMap(([key, child]) => {
      if (UNSAFE_KEYS.has(key)) return [];
      const difference = differenceFromScene(original[key], child);
      return difference === NO_OVERRIDE ? [] : [[key, difference]];
    });
    return differences.length === 0 ? NO_OVERRIDE : Object.fromEntries(differences);
  }
  return Object.is(base, value) ? NO_OVERRIDE : cloneValue(value);
}
export function resolveHeroLayout(data: AstraSceneConfig = {}): ResolvedHeroLayout {
  const merged = mergeAstraRecords(DEFAULT_HERO_LAYOUT, isPlainRecord(data) ? data : undefined);
  const activationLine =
    typeof merged.activationLine === "number" && Number.isFinite(merged.activationLine)
      ? Math.min(0.9, Math.max(0.1, merged.activationLine))
      : DEFAULT_HERO_LAYOUT.activationLine;
  const scene = mergeAstraRecords(
    DEFAULT_HERO_LAYOUT.scene,
    isPlainRecord(data?.scene) ? data.scene : undefined,
  );
  const engine = mergeAstraRecords(
    DEFAULT_HERO_LAYOUT.engine,
    isPlainRecord(data?.engine) ? data.engine : undefined,
  );
  const suppliedKeyframes = Array.isArray(data?.keyframes)
    ? data.keyframes.filter(isPlainRecord)
    : null;
  const hasSuppliedKeyframes = Boolean(suppliedKeyframes?.length);
  const keyframes = (
    suppliedKeyframes?.length ? suppliedKeyframes : DEFAULT_HERO_LAYOUT.keyframes
  ).map((frame) => {
    const difference = hasSuppliedKeyframes
      ? frame
      : differenceFromScene(DEFAULT_HERO_LAYOUT.scene, frame);
    const override = isPlainRecord(difference) ? difference : {};
    return markAstraKeyframeOverrides(mergeAstraRecords(scene, override), override);
  });
  return {
    ...merged,
    activationLine,
    content: {
      ...DEFAULT_HERO_LAYOUT.content,
      ...(isPlainRecord(merged.content) ? merged.content : {}),
    },
    easing: merged.easing === "linear" ? "linear" : "smoothstep",
    engine,
    keyframes,
    scene,
    version:
      typeof merged.version === "number" && Number.isFinite(merged.version)
        ? merged.version
        : DEFAULT_HERO_LAYOUT.version,
  };
}
export function resolveCueKeyframe({
  cueIndex,
  data,
  keyframes,
}: {
  cueIndex: number;
  data?: AstraCueData;
  keyframes: AstraKeyframe[];
}): AstraKeyframe {
  const index = Math.min(cueIndex + 1, keyframes.length - 1);
  const base = keyframes[Math.max(0, index)] ?? {};
  const override = isPlainRecord(data?.keyframe) ? data.keyframe : undefined;
  return markAstraKeyframeOverrides(
    mergeAstraRecords(base, override),
    selectAstraRuntimeOverrides(base),
    override ?? {},
  );
}
function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}
export function applyAstraEasing(progress: number, easing: AstraEasing): number {
  const normalized = clampProgress(progress);
  return easing === "linear" ? normalized : normalized * normalized * (3 - 2 * normalized);
}
function interpolateValue(from: unknown, to: unknown, progress: number): unknown {
  if (Object.is(from, to) || progress <= 0) return from;
  if (progress >= 1) return to;
  if (
    typeof from === "number" &&
    Number.isFinite(from) &&
    typeof to === "number" &&
    Number.isFinite(to)
  )
    return from + (to - from) * progress;
  if (
    Array.isArray(from) &&
    Array.isArray(to) &&
    from.length === to.length &&
    from.every((item): item is number => typeof item === "number" && Number.isFinite(item)) &&
    to.every((item): item is number => typeof item === "number" && Number.isFinite(item))
  ) {
    const values = from.map((value, index) => value + (to[index] - value) * progress);
    return values.every((value, index) => Object.is(value, from[index]))
      ? from
      : values.every((value, index) => Object.is(value, to[index]))
        ? to
        : values;
  }
  if (isPlainRecord(from) && isPlainRecord(to)) {
    const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
    const values: [string, unknown][] = [...keys].map((key) => [
      key,
      interpolateValue(from[key], to[key], progress),
    ]);
    const matchesFrom = keys.size === Object.keys(from).length;
    const matchesTo = keys.size === Object.keys(to).length;
    return matchesFrom && values.every(([key, value]) => Object.is(value, from[key]))
      ? from
      : matchesTo && values.every(([key, value]) => Object.is(value, to[key]))
        ? to
        : Object.fromEntries(values);
  }
  return progress < 0.5 ? from : to;
}
export function interpolateAstraKeyframes({
  easing,
  from,
  progress,
  reducedMotion = false,
  to,
}: {
  easing: AstraEasing;
  from: AstraKeyframe;
  progress: number;
  reducedMotion?: boolean;
  to: AstraKeyframe;
}): AstraKeyframe {
  const amount = reducedMotion
    ? clampProgress(progress) < 0.5
      ? 0
      : 1
    : applyAstraEasing(progress, easing);
  const result = interpolateValue(from, to, amount);
  if (!isPlainRecord(result)) throw new TypeError("Expected an interpolated Astra keyframe");
  return markAstraKeyframeOverrides(
    result,
    selectAstraRuntimeOverrides(from),
    selectAstraRuntimeOverrides(to),
  );
}
