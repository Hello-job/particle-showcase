import { useEffect, useState } from "react";
import AstraBackground from "./AstraBackground.jsx";
import { ASTRA_SHAPE_SVGS } from "./astra/index.js";
import showcase from "./showcase.config.json";

function ShapeTarget({ shape }) {
  const definition = ASTRA_SHAPE_SVGS[shape];
  return (
    <svg aria-hidden="true" className="astra-shape-target" data-filled={definition.filled ? "true" : undefined} fill={definition.filled ? "white" : "none"} viewBox={definition.viewBox ?? `0 0 ${definition.width} ${definition.height}`}>
      {definition.paths.map((path, index) => <path key={index} d={path} data-accent={definition.accentPaths?.includes(index) ? "true" : undefined} />)}
    </svg>
  );
}

const { versions } = showcase;

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

function Header({ variant }) {
  const version = versions[variant];
  return (
    <header className="site-header">
      <a className={version.logoClass} href={variant === "astra" ? "https://openai.com/" : version.url} aria-label={`${version.name} home`}>
        <img src={version.logo} alt={variant === "astra" ? "OpenAI" : version.name} />
      </a>
      {showcase.showVersionSwitch && <nav className="version-switch" aria-label="粒子版本" style={{ "--showcase-version-count": Object.keys(versions).length }}>
        {Object.entries(versions).map(([key, option]) => (
          <a key={key} href={`/?shape=${key}`} aria-current={variant === key ? "page" : undefined}>{option.name}</a>
        ))}
      </nav>}
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
  const definition = ASTRA_SHAPE_SVGS[shape];
  const shapeName = definition.label ?? ({ cursor: "Cursor", deepseek: "DeepSeek whale", "deepseek-wordmark": "DeepSeek wordmark", "openai-knot": "OpenAI blossom" })[shape] ?? shape;
  const customCue = definition.filled || shape === "deepseek-wordmark";
  const cue = customCue ? JSON.stringify({ keyframe: { engine: { pathShapeScatter: definition.filled ? 0.12 : 0.18, lensFlare: { intensity: 0.12 } }, particles: { starIntensity: 2.2 } } }) : "true";
  return (
    <section className="shape-section" id={shape} aria-label={`${shapeName} constellation`}>
      <div className="astra-shape-cue" data-astra-path-shape={shape} data-astra-scroll-cue={cue}>
        <ShapeTarget shape={shape} />
        <button type="button" className="astra-drag-surface" data-astra-drag aria-label={`Drag or use arrow keys to rotate the ${shapeName}`} />
      </div>
    </section>
  );
}

export function App() {
  const requested = new URLSearchParams(window.location.search).get("shape");
  const variant = Object.hasOwn(versions, requested) ? requested : showcase.defaultVariant;
  const version = versions[variant];
  const custom = variant !== "astra";
  useEffect(() => {
    document.title = `${version.modelName} — ${custom ? "Particle Constellation" : "Interactive Particle Field"}`;
  }, [custom, version.modelName]);
  return (
    <div className="astra-experience" data-astra-experience data-variant={variant} data-showcase={version.showcase ? "true" : undefined}>
      <AstraBackground heroShape={version.hero} />
      <Header variant={variant} />
      <main>
        <section className="astra-hero" id="astra" data-astra-hero aria-label={custom ? `${version.name} particle constellation` : "GPT-6 Astra"}>
          <h1 className="sr-only">{version.modelName}</h1>
          {custom && <div data-astra-hero-shape><ShapeTarget shape={version.hero} /></div>}
          <button type="button" className="astra-drag-surface" data-astra-drag aria-label={`Drag or use arrow keys to rotate the ${version.name} star field`} />
          {!custom && <><HeroLabel text="GPT" side="left" /><HeroLabel text="Astra" side="right" /></>}
          <button type="button" className="astra-replay" data-astra-copy aria-label={`Replay ${version.name} particle animation`} onClick={() => window.dispatchEvent(new CustomEvent("astra-replay"))}>
            <ReplayIcon />
          </button>
        </section>
        <article className="astra-article" data-astra-content>
          <section className="intelligence-section" id="intelligence">
            <div className="astra-model-intro" data-section-header data-astra-title>
              <h2 className="astra-title">{version.modelName}</h2>
            </div>
          </section>
          {!custom && <ShapeCue shape="cursor" />}
          <div className="constellation-interlude" aria-hidden="true">
            <div className="astra-release-cue" data-astra-scroll-cue={JSON.stringify({ easing: "smoothstep", keyframe: { opacity: 1, motion: { autoplay: true }, particles: { disperse: 1, flowSpeed: 0.8 } } })} />
          </div>
          <ShapeCue shape={version.ending} />
          <footer className="astra-footer">
            {!version.showcase && <a href={version.url}>{custom ? `Explore ${version.name}` : "Explore GPT-6 Astra"} <ArrowIcon /></a>}
            <a href="#astra">Back to top</a>
          </footer>
        </article>
      </main>
    </div>
  );
}
