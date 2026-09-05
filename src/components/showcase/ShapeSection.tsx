import { ASTRA_SHAPE_SVGS, type ShapeId, type ShapeDefinition } from "../../particles/engine";
import { ShapeTarget } from "./ShapeTarget";

const shapeLabels: Partial<Record<ShapeId, string>> = {
  cursor: "Cursor",
  deepseek: "DeepSeek whale",
  "deepseek-wordmark": "DeepSeek wordmark",
  "openai-knot": "OpenAI blossom",
};

export function ShapeSection({ shape }: { shape: ShapeId }) {
  const definition: ShapeDefinition = ASTRA_SHAPE_SVGS[shape];
  const label = definition.label ?? shapeLabels[shape] ?? shape;
  const customCue = definition.filled || shape === "deepseek-wordmark";
  const cue = customCue
    ? JSON.stringify({
        keyframe: {
          engine: {
            pathShapeScatter: definition.filled ? 0.12 : 0.18,
            lensFlare: { intensity: 0.12 },
          },
          particles: { starIntensity: 2.2 },
        },
      })
    : "true";
  return (
    <section className="shape-section" id={shape} aria-label={`${label} constellation`}>
      <div className="astra-shape-cue" data-astra-path-shape={shape} data-astra-scroll-cue={cue}>
        <ShapeTarget shape={shape} />
        <button
          type="button"
          className="astra-drag-surface"
          data-astra-drag
          aria-label={`Drag or use arrow keys to rotate the ${label}`}
        />
      </div>
    </section>
  );
}
