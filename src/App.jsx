import { useEffect, useState } from "react";
import AstraBackground from "./AstraBackground.jsx";
import { ASTRA_SHAPE_SVGS } from "./astra/index.js";

function ShapeTarget({ shape }) {
  const definition = ASTRA_SHAPE_SVGS[shape];
  return (
    <svg aria-hidden="true" className="astra-shape-target" fill="none" viewBox={definition.viewBox ?? `0 0 ${definition.width} ${definition.height}`}>
      {definition.paths.map((path, index) => <path key={index} d={path} />)}
    </svg>
  );
}

const referenceUrl = "https://openai.com/index/gpt-6-astra/";

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" fill="none" viewBox="1.243 0.843 9.483 10.345" aria-hidden="true">
      <path fill="currentColor" d="M8.949 2.505a.497.497 0 0 1 .546.546L9.5 3.1V8a.5.5 0 0 1-1 0V4.207l-5.147 5.15a.5.5 0 1 1-.707-.707L7.794 3.5H4a.5.5 0 0 1 0-1h4.9z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M10 1.834a8.167 8.167 0 1 1-7.965 9.98.876.876 0 0 1 1.707-.387A6.416 6.416 0 1 0 4.5 6.695h1.45a.876.876 0 0 1 0 1.75H2.71a.875.875 0 0 1-.876-.875V3.924a.875.875 0 1 1 1.75 0V4.95A8.15 8.15 0 0 1 10 1.834" />
    </svg>
  );
}

function Header({ deepseek }) {
  return (
    <header className="site-header">
      {deepseek ? (
        <a className="deepseek-wordmark" href="https://www.deepseek.com/" aria-label="DeepSeek">
          <img src="/assets/deepseek-official.svg" alt="DeepSeek" />
        </a>
      ) : (
        <a className="wordmark" href="https://openai.com/" aria-label="OpenAI Home">
          <img src="/assets/openai-wordmark.svg" alt="OpenAI" width="64" height="17" />
        </a>
      )}
      <nav className="version-switch" aria-label="粒子版本">
        <a href="/?shape=deepseek" aria-current={deepseek ? "page" : undefined}>DeepSeek</a>
        <a href="/?shape=astra" aria-current={deepseek ? undefined : "page"}>Astra 原版</a>
      </nav>
    </header>
  );
}

function HeroLabel({ text, side }) {
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const reset = () => setReplay((value) => value + 1);
    window.addEventListener("astra-replay", reset);
    return () => window.removeEventListener("astra-replay", reset);
  }, []);
  return (
    <p aria-hidden="true" className={`astra-label astra-label-${side}`} data-astra-copy>
      {Array.from(text).map((letter, index, letters) => (
        <span key={`${replay}-${index}`} className="astra-label-letter" style={{
          "--astra-label-delay": `${0.85 + (side === "left" ? letters.length - index - 1 : index) * 0.1}s`,
          "--astra-label-shift": side === "left" ? "-44px" : "44px",
        }}>{letter}</span>
      ))}
    </p>
  );
}

function ShapeCue({ shape }) {
  const shapeName = shape === "cursor" ? "Cursor" : shape === "deepseek-wordmark" ? "DeepSeek wordmark" : shape === "deepseek" ? "DeepSeek" : "OpenAI";
  return (
    <section className="shape-section" id={shape} aria-label={`${shapeName} constellation`}>
      <div className="astra-shape-cue" data-astra-path-shape={shape} data-astra-scroll-cue={shape === "deepseek-wordmark" ? JSON.stringify({ keyframe: { engine: { pathShapeScatter: 0.18, lensFlare: { intensity: 0.12 } }, particles: { starIntensity: 2.2 } } }) : "true"}>
        <ShapeTarget shape={shape} />
        <button type="button" className="astra-drag-surface" data-astra-drag aria-label={shape === "cursor" ? "Drag or use arrow keys to rotate the cursor" : shape === "deepseek-wordmark" ? "Drag or use arrow keys to rotate the DeepSeek wordmark" : shape === "deepseek" ? "Drag or use arrow keys to rotate the DeepSeek whale" : "Drag or use arrow keys to rotate the OpenAI blossom"} />
      </div>
    </section>
  );
}

export function App() {
  const deepseek = new URLSearchParams(window.location.search).get("shape") !== "astra";
  useEffect(() => {
    document.title = deepseek ? "DeepSeek — Particle Constellation" : "GPT Astra — Interactive Particle Field";
  }, [deepseek]);
  return (
    <div className="astra-experience" data-astra-experience data-variant={deepseek ? "deepseek" : "astra"}>
      <AstraBackground heroShape={deepseek ? "deepseek" : undefined} />
      <Header deepseek={deepseek} />
      <main>
        <section className="astra-hero" id="astra" data-astra-hero aria-label={deepseek ? "DeepSeek particle constellation" : "GPT-6 Astra"}>
          <h1 className="sr-only">{deepseek ? "DeepSeek particle constellation" : "GPT-6 Astra"}</h1>
          {deepseek && <div data-astra-hero-shape><ShapeTarget shape="deepseek" /></div>}
          <button type="button" className="astra-drag-surface" data-astra-drag aria-label={deepseek ? "Drag or use arrow keys to rotate the DeepSeek star field" : "Drag or use arrow keys to rotate the Astra star field"} />
          {!deepseek && <><HeroLabel text="GPT" side="left" /><HeroLabel text="Astra" side="right" /></>}
          <button type="button" className="astra-replay" data-astra-copy aria-label="Replay spiral field animation" onClick={() => window.dispatchEvent(new CustomEvent("astra-replay"))}>
            <ReplayIcon />
          </button>
        </section>
        <article className="astra-article" data-astra-content>
          <section className="intelligence-section" id="intelligence">
            <div data-section-header>
              <h2 className="astra-title" data-astra-title>{deepseek ? "A familiar shape. A universe of particles." : "A new generation of intelligence"}</h2>
            </div>
            <div className="article-copy">
              <p>{deepseek ? "Move through the stars. Drag to rotate. Scroll to transform." : "We’re introducing GPT‑6 Astra, the world’s most intelligent and aligned model."}</p>
            </div>
          </section>
          {!deepseek && <ShapeCue shape="cursor" />}
          <div className="constellation-interlude" aria-hidden="true">
            <div className="astra-release-cue" data-astra-scroll-cue={JSON.stringify({ easing: "smoothstep", keyframe: { opacity: 1, motion: { autoplay: true }, particles: { disperse: 1, flowSpeed: 0.8 } } })} />
          </div>
          <ShapeCue shape={deepseek ? "deepseek-wordmark" : "openai-knot"} />
          <footer className="astra-footer">
            <a href={deepseek ? "https://www.deepseek.com/" : referenceUrl}>{deepseek ? "Explore DeepSeek" : "Explore GPT-6 Astra"} <ArrowIcon /></a>
            <a href="#astra">Back to top</a>
          </footer>
        </article>
      </main>
    </div>
  );
}
