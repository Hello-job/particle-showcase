/** Stable entry point for the React layer and reusable Skill template. */
export { createAstraScene } from "./coordinator";
export { createAstraProfile } from "./profile";
export { ASTRA_SHAPE_SVGS, resolveAstraPathShape } from "../shapes/registry";
export type { ShapeId, ShapeDefinition } from "../shapes/registry";
export type {
  AstraSceneConfig,
  AstraSceneOptions,
  AstraSceneHandle,
  AstraRendererProfile,
  AstraScrollSnapshot,
  AstraCueData,
} from "./types";
