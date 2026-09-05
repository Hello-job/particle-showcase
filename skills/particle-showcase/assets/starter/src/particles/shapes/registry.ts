import { ASTRA_CURSOR_PATH, ASTRA_OPENAI_KNOT_PATHS } from "./astra";
import { DEEPSEEK_SHAPE } from "./deepseek";
import { DEEPSEEK_TITLECASE_WORDMARK_SHAPE } from "./deepseek-titlecase";
import { KIMI_SHAPE, KIMI_WORDMARK_SHAPE, GLM_WORDMARK_SHAPE, ZAI_SHAPE } from "./brands";
import type { ShapeDefinition } from "./types";

export { ASTRA_CURSOR_PATH, ASTRA_OPENAI_KNOT_PATHS } from "./astra";
export type { ShapeDefinition } from "./types";

/** Register new geometry here; the engine and React wrapper share these keys. */
const shapeDefinitions = {
  cursor: { height: 19, paths: [ASTRA_CURSOR_PATH], width: 19 },
  deepseek: DEEPSEEK_SHAPE,
  "deepseek-wordmark": DEEPSEEK_TITLECASE_WORDMARK_SHAPE,
  kimi: { ...KIMI_SHAPE, filled: true, label: "Kimi symbol" },
  "kimi-wordmark": { ...KIMI_WORDMARK_SHAPE, filled: true, label: "Kimi wordmark" },
  "glm-wordmark": { ...GLM_WORDMARK_SHAPE, filled: true, label: "GLM wordmark" },
  zai: { ...ZAI_SHAPE, filled: true, label: "Z.ai symbol" },
  "openai-knot": { height: 1538, paths: ASTRA_OPENAI_KNOT_PATHS, width: 1726 },
} satisfies Record<string, ShapeDefinition>;

export type ShapeId = keyof typeof shapeDefinitions;
export const ASTRA_SHAPE_SVGS: Record<ShapeId, ShapeDefinition> = shapeDefinitions;

export function resolveAstraPathShape(value: unknown): ShapeId | null {
  if (value === "blossom") return "openai-knot";
  return typeof value === "string" && Object.hasOwn(ASTRA_SHAPE_SVGS, value)
    ? (value as ShapeId)
    : null;
}
