import type { Group, OrthographicCamera, Vector2 } from "three";
import type { ShapeId } from "../shapes/registry";

export type AstraEasing = "linear" | "smoothstep";
export type AstraTier = 0 | 1 | 2 | 3;

/** Scene sections are passed through to the original normalizer unchanged. */
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

// Opaque internals are created and consumed only by the retained vendor code.
// The public boundary exposes exactly the fields read by our DOM coordinator.
declare const configBrand: unique symbol;
declare const fieldBrand: unique symbol;
declare const animationBrand: unique symbol;

export interface AstraRuntimeConfig {
  readonly [configBrand]: true;
  readonly animationPlaying: boolean;
  readonly scrollEffects: boolean;
  readonly faceForward: boolean;
}

export interface AstraField {
  readonly [fieldBrand]: true;
}

export interface AstraAnimationState {
  readonly [animationBrand]: true;
  readonly railPresence: number;
  readonly railContentBounds: Vector2;
  readonly particleMotion: { epoch: number };
  dispose(): void;
}

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
