import type { Group, OrthographicCamera } from "three";
import type { ShapeId } from "../shapes/registry";
import type { RuntimeConfig } from "../core/config";
import type { ParticleField } from "../core/field";
import type { AnimationState } from "../core/animation";

export type AstraEasing = "linear" | "smoothstep";
export type AstraTier = 0 | 1 | 2 | 3;

/** Editable scene sections are validated by the core configuration normalizer. */
export type AstraSceneSection = Readonly<Record<string, unknown>>;

export interface AstraKeyframe {
  opacity?: number;
  motion?: AstraSceneSection;
  particles?: AstraSceneSection;
  effects?: AstraSceneSection;
  interaction?: AstraSceneSection;
  engine?: AstraSceneSection;
  [section: string]: unknown;
}

export interface AstraSceneConfig {
  activationLine?: number;
  easing?: AstraEasing;
  scene?: AstraKeyframe;
  engine?: AstraSceneSection;
  keyframes?: readonly AstraKeyframe[];
  [option: string]: unknown;
}

export interface AstraCueData {
  shape?: string;
  easing?: AstraEasing;
  keyframe?: AstraKeyframe;
}

export interface AstraCueRegistration {
  element: HTMLElement;
  data?: AstraCueData;
}

export interface AstraRendererProfile {
  tier: AstraTier;
  canUseWebGL(): boolean;
  getAntialias(): boolean;
  getDpr(): [number, number];
  getMaxParticleCount(): number;
  getMaxShaderSamples(): number;
  getPostprocessing(): "none" | "selective" | "full";
  getShaderQuality(): "none" | "low" | "medium" | "high";
  getShaderQualityLevel(): AstraTier;
  shouldUseContinuousMotion(): boolean;
}

export interface AstraScrollSnapshot {
  progress: number;
  scatter: number | null;
  /** Samples use occurrence IDs, such as `hero:kimi` or `zai:1`. */
  shape: string | null;
  shapeStrength: number;
  active: boolean;
}

export interface AstraSceneOptions {
  heroElement?: HTMLElement;
  contentElement?: HTMLElement;
  heroShape?: ShapeId;
  data?: AstraSceneConfig;
  profile?: AstraRendererProfile;
  cues?: Iterable<HTMLElement | AstraCueRegistration>;
  onScroll?(snapshot: AstraScrollSnapshot): void;
  onError?(error: unknown): void;
}

export interface AstraInput {
  contentBounds: { left: number; right: number } | null;
  heroViewportHeight: number | null;
  reducedMotion: boolean;
  heroShapeEnabled: boolean;
  progress: number;
  scatterProgress: number | null;
  tiltProgress: number | null;
  starsOpacity: number;
  scrolling: boolean;
  returning: boolean;
  rotation: { x: number; y: number };
  pointer: { active: boolean; pressed: boolean; reset: boolean; x: number; y: number };
  shape: {
    centerNdc: { x: number; y: number };
    id: string | null;
    samples: Float32Array | null;
    sizeNdc: { x: number; y: number };
    strength: number;
    hero: boolean;
    filled: boolean;
    accentRange: [number, number];
    flowScale: number;
    rowSpacing: number;
  };
}

// Preserve the public names while exposing the core's real structural types.
export type AstraRuntimeConfig = RuntimeConfig;
export type AstraField = ParticleField;
export type AstraAnimationState = AnimationState;

export interface AstraRenderer {
  ready: Promise<void>;
  camera: OrthographicCamera;
  animationRoot: Group;
  spinRoot: Group;
  field: AstraField;
  resize(width: number, height: number, dpr: number): void;
  render(
    delta: number,
    state: AstraAnimationState,
    config: AstraRuntimeConfig,
    reducedMotion: boolean,
  ): void;
  dispose(): void;
}

export interface AstraSceneHandle {
  ready: Promise<{ renderer: AstraRenderer; animation: AstraAnimationState } | undefined>;
  replay(): void;
  refresh(): void;
  readonly input: AstraInput;
  readonly renderer: AstraRenderer | undefined;
  readonly animation: AstraAnimationState | undefined;
  dispose(): void;
}
