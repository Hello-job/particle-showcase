/**
 * Audited TypeScript boundary for the original compiled module loader.
 * Vendor-owned state is opaque; no structural cast is needed in application code.
 */
import type {
  AstraAnimationState, AstraCueData, AstraEasing, AstraField, AstraInput,
  AstraKeyframe, AstraRenderer, AstraRendererProfile, AstraRuntimeConfig,
  AstraSceneConfig, AstraSceneSection,
} from "../../engine/types";
import type { Group, OrthographicCamera } from "three";

export interface ResolvedHeroLayout {
  activationLine: number;
  easing: AstraEasing;
  scene: AstraKeyframe;
  keyframes: AstraKeyframe[];
}

export interface PreparedRuntimeConfig {
  readonly override: AstraSceneSection;
  readonly resolved: AstraRuntimeConfig;
}

export function createAstraRenderer(
  canvas: HTMLCanvasElement,
  config: AstraRuntimeConfig,
  profile: AstraRendererProfile,
  options?: { invalidate?(): void },
): AstraRenderer;
export function createAstraAnimationState(config: AstraRuntimeConfig, progress?: number): AstraAnimationState;
export function updateAstraAnimation(
  scene: {
    state: AstraAnimationState;
    config: AstraRuntimeConfig;
    input: AstraInput;
    camera: OrthographicCamera;
    animationRoot: Group;
    spinRoot: Group;
    field: AstraField;
    viewport: { width: number; height: number };
  },
  animationDelta: number,
  delta: number,
): boolean;
export function resolveHeroLayout(data: AstraSceneConfig): ResolvedHeroLayout;
export function resolveCueKeyframe(options: {
  cueIndex: number;
  data?: AstraCueData;
  keyframes: AstraKeyframe[];
}): AstraKeyframe;
export function resolveAstraRendererConfig(layout: ResolvedHeroLayout, data: AstraSceneConfig): AstraRuntimeConfig;
export function prepareAstraRuntimeConfig(config: AstraRuntimeConfig, keyframe: AstraKeyframe): PreparedRuntimeConfig;
export function resolvePreparedAstraRuntimeConfig(options: {
  base: AstraRuntimeConfig;
  from: PreparedRuntimeConfig;
  to: PreparedRuntimeConfig;
  progress: number;
}): AstraRuntimeConfig;
export function getAstraScrollState(scroll: number, config: AstraRuntimeConfig, reducedMotion: boolean): {
  textOpacity: number;
  dispersion: number;
  progress: number;
};
export const sceneMath: {
  getAstraSceneValues(scene: AstraKeyframe): { motion: AstraSceneSection };
  getAstraNumber(section: AstraSceneSection, key: string, fallback: number, bounds?: { min?: number; max?: number }): number;
};
export const interpolateAstra: {
  applyAstraEasing(progress: number, easing: AstraEasing): number;
};
