import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../lib/assets";
import { ASTRA_SHAPE_SVGS, createAstraScene, type AstraSceneHandle, type ShapeId } from "./engine";

interface ParticleBackgroundProps {
  heroShape?: ShapeId;
}

type SceneStatus = "loading" | "ready" | "fallback";

/** Owns the scene lifetime; per-frame animation stays outside React. */
export function ParticleBackground({ heroShape }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: AstraSceneHandle | undefined;
    let disposed = false;

    const initialize = async () => {
      try {
        scene = createAstraScene(canvas, {
          heroShape,
          data: heroShape
            ? {
                engine: ASTRA_SHAPE_SVGS[heroShape].filled
                  ? {
                      pathShapeScatter: 0.12,
                      stars: { intensity: 2.2 },
                      lensFlare: { intensity: 0.12 },
                    }
                  : { pathShapeScatter: 0.5 },
              }
            : undefined,
          heroElement: document.querySelector<HTMLElement>("[data-astra-hero]") ?? undefined,
          contentElement: document.querySelector<HTMLElement>("[data-astra-content]") ?? undefined,
          cues: [...document.querySelectorAll<HTMLElement>("[data-astra-scroll-cue]")],
          onError: (error) => {
            if (!disposed) {
              console.error("Particle rendering stopped:", error);
              setStatus("fallback");
            }
          },
        });
        await scene.ready;
        if (!disposed) setStatus("ready");
      } catch (error) {
        if (!disposed) {
          console.error("Particle renderer could not start:", error);
          setStatus("fallback");
        }
      }
    };
    void initialize();

    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [heroShape]);

  return (
    <div className="astra-background" data-astra-backdrop="true" aria-hidden="true">
      <div className="astra-scene" data-astra-scene={status}>
        <canvas ref={canvasRef} data-astra-canvas="true" />
      </div>
      {!heroShape && status !== "ready" && (
        <img className="astra-poster" src={assetUrl("assets/images/astra-poster.webp")} alt="" />
      )}
      <div className="astra-ambient" data-astra-ambient="true" />
      <div className="astra-vignette" />
    </div>
  );
}
