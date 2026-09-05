import { useEffect, useState } from "react";
import { PARTICLE_REPLAY_EVENT } from "../../particles/events";
import type { ShowcaseStyle } from "../../types/styles";

export function HeroLabel({ text, side }: { text: string; side: "left" | "right" }) {
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const reset = () => setReplay((value) => value + 1);
    window.addEventListener(PARTICLE_REPLAY_EVENT, reset);
    return () => window.removeEventListener(PARTICLE_REPLAY_EVENT, reset);
  }, []);
  return (
    <p aria-hidden="true" className={`astra-label astra-label-${side}`} data-astra-copy>
      {Array.from(text).map((letter, index, letters) => {
        const style: ShowcaseStyle = {
          "--astra-label-delay": `${0.85 + (side === "left" ? letters.length - index - 1 : index) * 0.1}s`,
          "--astra-label-shift": side === "left" ? "-44px" : "44px",
        };
        return (
          <span key={`${replay}-${index}`} className="astra-label-letter" style={style}>
            {letter}
          </span>
        );
      })}
    </p>
  );
}
