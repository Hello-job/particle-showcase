/** SVG contours remain separate so particles never connect pen-up segments. */
export interface ShapeDefinition {
  width: number;
  height: number;
  paths: readonly string[];
  viewBox?: string;
  filled?: boolean;
  accentPaths?: readonly number[];
  label?: string;
}

export interface SampledShape {
  id: string;
  samples: Float32Array;
  aspectRatio: number;
  filled?: boolean;
  accentRange?: [number, number];
  flowScale?: number;
  rowSpacing?: number;
}

export interface SampledElement extends SampledShape {
  element: HTMLElement;
}
