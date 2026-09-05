import { useEffect, useState } from "react";
import AstraBackground from "./AstraBackground.jsx";

const shapeMarkup = {"cursor": "<svg aria-hidden=\"true\" class=\"astra-shape-target\" fill=\"none\" viewBox=\"0 0 19 19\"><path d=\"M9.60978 17.0223C9.24308 17.739 8.76808 18.189 8.18478 18.3723C7.60148 18.564 7.03478 18.4931 6.48478 18.1598C5.93478 17.8348 5.53061 17.314 5.27228 16.5973L0.672282 3.68478C0.497282 3.19312 0.455612 2.72645 0.547282 2.28478C0.638952 1.83478 0.838952 1.45561 1.14728 1.14728C1.45561 0.838948 1.83478 0.638949 2.28478 0.547279C2.73478 0.455619 3.20561 0.497279 3.69728 0.672279L16.6098 5.27228C17.3265 5.53062 17.8473 5.93478 18.1723 6.48478C18.5056 7.02648 18.5765 7.58898 18.3848 8.17228C18.2015 8.75558 17.7515 9.23058 17.0348 9.59728L12.1098 12.1098L9.60978 17.0223Z\" stroke=\"currentColor\" stroke-width=\"0.8\"></path></svg>", "openai-knot": "<svg aria-hidden=\"true\" class=\"astra-shape-target\" fill=\"none\" viewBox=\"0 0 1726 1538\"><path d=\"M1025.52 167.475C960.586 89.5754 862.821 40 753.477 40C557.968 40 399.477 198.491 399.477 394V737.278C399.477 757.119 409.975 775.478 427.074 785.541L851.477 1035.3\" stroke=\"currentColor\" stroke-width=\"80\"></path><path d=\"M1465.07 608.95C1500.07 513.764 1494.12 404.309 1439.45 309.614C1341.69 140.298 1125.19 82.2866 955.872 180.041L658.585 351.68C641.402 361.6 630.752 379.872 630.587 399.712L626.49 892.135\" stroke=\"currentColor\" stroke-width=\"80\"></path><path d=\"M1302.52 1210.35C1402.45 1193.06 1494.27 1133.18 1548.94 1038.49C1646.69 869.17 1588.68 652.667 1419.36 554.912L1122.08 383.273C1104.89 373.353 1083.75 373.265 1066.48 383.042L637.982 625.706\" stroke=\"currentColor\" stroke-width=\"80\"></path><path d=\"M700.415 1370.27C765.351 1448.17 863.116 1497.74 972.461 1497.74C1167.97 1497.74 1326.46 1339.25 1326.46 1143.74V800.466C1326.46 780.625 1315.96 762.266 1298.86 752.203L874.461 502.444\" stroke=\"currentColor\" stroke-width=\"80\"></path><path d=\"M260.866 928.794C225.871 1023.98 231.82 1133.44 286.492 1228.13C384.247 1397.45 600.75 1455.46 770.065 1357.7L1067.35 1186.06C1084.54 1176.14 1095.19 1157.87 1095.35 1138.03L1099.45 645.61\" stroke=\"currentColor\" stroke-width=\"80\"></path><path d=\"M423.42 327.396C323.488 344.682 231.672 404.562 177 499.257C79.2456 668.573 137.257 885.076 306.573 982.83L603.861 1154.47C621.043 1164.39 642.192 1164.48 659.456 1154.7L1087.96 912.037\" stroke=\"currentColor\" stroke-width=\"80\"></path></svg>"};
const referenceUrl = "https://openai.com/index/gpt-6-astra/";

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" fill="none" viewBox="1.243 0.843 9.483 10.345" aria-hidden="true">
      <path fill="currentColor" d="M8.949 2.505a.497.497 0 0 1 .546.546L9.5 3.1V8a.5.5 0 0 1-1 0V4.207l-5.147 5.15a.5.5 0 1 1-.707-.707L7.794 3.5H4a.5.5 0 0 1 0-1h4.9z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="2.219 -0.578 11.563 18.5" aria-hidden="true">
      <path fill="currentColor" d="M12.47 5.72a.75.75 0 1 1 1.06 1.06l-4.764 4.765a1.083 1.083 0 0 1-1.532 0L2.47 6.78a.75.75 0 1 1 1.06-1.06L8 10.19z" />
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

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header className="site-header" data-scrolled={scrolled}>
      <a className="wordmark" href="https://openai.com/" aria-label="OpenAI Home">
        <img src="/assets/openai-wordmark.svg" alt="OpenAI" width="64" height="17" />
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="https://openai.com/research/index/">Research</a>
        <a href="https://openai.com/chatgpt/overview/">Products</a>
        <a href="https://openai.com/business/">Business</a>
        <a href="https://openai.com/api/">Developers</a>
        <a href="https://openai.com/about/">Company</a>
        <a href="https://openaifoundation.org/">Foundation</a>
      </nav>
      <a className="header-search" href="https://openai.com/search/" aria-label="Search OpenAI">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><use href="/assets/icons/magnifying-glass-lg.svg#size-16" width="16" height="16" /></svg>
      </a>
      <div className="header-actions">
        <a className="login-link" href="https://chatgpt.com/auth/login">Log in <ChevronIcon /></a>
        <a className="chatgpt-link" href="https://chatgpt.com/">Try ChatGPT <ArrowIcon /></a>
      </div>
      <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/sidebar.svg#size-20" width="20" height="20" /></svg>
      </button>
      {menuOpen && (
        <nav className="mobile-menu" id="mobile-menu" aria-label="Explore the Astra star field">
          <a href="#astra" onClick={() => setMenuOpen(false)}>GPT-6 Astra</a>
          <a href="#cursor" onClick={() => setMenuOpen(false)}>Cursor</a>
          <a href="#openai-knot" onClick={() => setMenuOpen(false)}>OpenAI</a>
          <a href={referenceUrl}>Read the announcement</a>
        </nav>
      )}
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
  return (
    <section className="shape-section" id={shape} aria-label={shape === "cursor" ? "Cursor constellation" : "OpenAI constellation"}>
      <div className="astra-shape-cue" data-astra-path-shape={shape} data-astra-scroll-cue="true">
        <div dangerouslySetInnerHTML={{ __html: shapeMarkup[shape] }} />
        <button type="button" className="astra-drag-surface" data-astra-drag aria-label={shape === "cursor" ? "Drag or use arrow keys to rotate the cursor" : "Drag or use arrow keys to rotate the OpenAI blossom"} />
      </div>
    </section>
  );
}

export function App() {
  return (
    <div className="astra-experience" data-astra-experience>
      <AstraBackground />
      <Header />
      <main>
        <section className="astra-hero" id="astra" data-astra-hero aria-label="GPT-6 Astra">
          <h1 className="sr-only">GPT-6 Astra</h1>
          <button type="button" className="astra-drag-surface" data-astra-drag aria-label="Drag or use arrow keys to rotate the Astra star field" />
          <HeroLabel text="GPT" side="left" />
          <HeroLabel text="Astra" side="right" />
          <button type="button" className="astra-replay" data-astra-copy aria-label="Replay spiral field animation" onClick={() => window.dispatchEvent(new CustomEvent("astra-replay"))}>
            <ReplayIcon />
          </button>
        </section>
        <article className="astra-article" data-astra-content>
          <section className="intelligence-section" id="intelligence">
            <div data-section-header>
              <h2 className="astra-title" data-astra-title>A new generation of intelligence</h2>
            </div>
            <div className="article-copy">
              <p>We’re introducing GPT‑6 Astra, the world’s most intelligent and aligned model.</p>
            </div>
          </section>
          <ShapeCue shape="cursor" />
          <div className="constellation-interlude" aria-hidden="true">
            <div className="astra-release-cue" data-astra-scroll-cue={JSON.stringify({ easing: "smoothstep", keyframe: { opacity: 1, motion: { autoplay: true }, particles: { disperse: 1, flowSpeed: 0.8 } } })} />
          </div>
          <ShapeCue shape="openai-knot" />
          <footer className="astra-footer">
            <a href={referenceUrl}>Explore GPT-6 Astra <ArrowIcon /></a>
            <a href="#astra">Back to top</a>
          </footer>
        </article>
      </main>
    </div>
  );
}
