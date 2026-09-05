import type { ShowcaseVersion } from "../../config/showcase";
import { replayParticles } from "../../particles/events";
import { ReplayIcon } from "../icons/ReplayIcon";
import { HeroLabel } from "./HeroLabel";
import { ShapeTarget } from "./ShapeTarget";

export function ShowcaseHero({ version }: { version: ShowcaseVersion }) {
  return (
    <section
      className="astra-hero"
      id="astra"
      data-astra-hero
      aria-label={`${version.name} particle constellation`}
    >
      <h1 className="sr-only">{version.modelName}</h1>
      {version.hero && (
        <div data-astra-hero-shape>
          <ShapeTarget shape={version.hero} />
        </div>
      )}
      <button
        type="button"
        className="astra-drag-surface"
        data-astra-drag
        aria-label={`Drag or use arrow keys to rotate the ${version.name} star field`}
      />
      {!version.hero && (
        <>
          <HeroLabel text="GPT" side="left" />
          <HeroLabel text="Astra" side="right" />
        </>
      )}
      <button
        type="button"
        className="astra-replay"
        data-astra-copy
        aria-label={`Replay ${version.name} particle animation`}
        onClick={replayParticles}
      >
        <ReplayIcon />
      </button>
    </section>
  );
}
