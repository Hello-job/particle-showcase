import { ASTRA_SHAPE_SVGS, type ShapeId, type ShapeDefinition } from "../../particles/engine";

export function ShapeTarget({ shape }: { shape: ShapeId }) {
  const definition: ShapeDefinition = ASTRA_SHAPE_SVGS[shape];
  return (
    <svg
      aria-hidden="true"
      className="astra-shape-target"
      data-filled={definition.filled ? "true" : undefined}
      fill={definition.filled ? "white" : "none"}
      viewBox={definition.viewBox ?? `0 0 ${definition.width} ${definition.height}`}
    >
      {definition.paths.map((path, index) => (
        <path
          key={index}
          d={path}
          data-accent={definition.accentPaths?.includes(index) ? "true" : undefined}
        />
      ))}
    </svg>
  );
}
