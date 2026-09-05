import { useEffect } from "react";
import { ShapeSection } from "../components/showcase/ShapeSection";
import { ShowcaseFooter } from "../components/showcase/ShowcaseFooter";
import { ShowcaseHeader } from "../components/showcase/ShowcaseHeader";
import { ShowcaseHero } from "../components/showcase/ShowcaseHero";
import { selectShowcase } from "../config/showcase";
import { ParticleBackground } from "../particles/ParticleBackground";

const releaseCue = JSON.stringify({
  easing: "smoothstep",
  keyframe: { opacity: 1, motion: { autoplay: true }, particles: { disperse: 1, flowSpeed: 0.8 } },
});

export function App() {
  const { variant, version } = selectShowcase(window.location.search);
  useEffect(() => {
    document.title = `${version.modelName} — ${version.hero ? "Particle Constellation" : "Interactive Particle Field"}`;
  }, [version.hero, version.modelName]);

  return (
    <div
      className="astra-experience"
      data-astra-experience
      data-variant={variant}
      data-showcase={version.showcase ? "true" : undefined}
    >
      <ParticleBackground key={variant} heroShape={version.hero} />
      <ShowcaseHeader variant={variant} version={version} />
      <main>
        <ShowcaseHero version={version} />
        <article className="astra-article" data-astra-content>
          <section className="intelligence-section" id="intelligence">
            <div className="astra-model-intro" data-section-header data-astra-title>
              <h2 className="astra-title">{version.modelName}</h2>
            </div>
          </section>
          {!version.hero && <ShapeSection shape="cursor" />}
          <div className="constellation-interlude" aria-hidden="true">
            <div className="astra-release-cue" data-astra-scroll-cue={releaseCue} />
          </div>
          <ShapeSection shape={version.ending} />
          <ShowcaseFooter version={version} />
        </article>
      </main>
    </div>
  );
}
