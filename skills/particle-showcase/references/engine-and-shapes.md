# Engine integration and shape customization

## What is reusable

All application paths below are relative to the source repository or an exported project. The lightweight Skill does not contain a copy of the application.

The source repository provides a procedural WebGL particle scene with pointer repulsion, drag rotation, replay, a scrolling transition through SVG destinations, and optical postprocessing. It is not a video, raster logo overlay, or generic CSS particle animation. Its original renderer and motion modules were ported from the public Astra page; custom brand shapes and the standalone DOM adapter were added locally. Preserve the source provenance in `src/particles/core/README.md` and the shape modules.

Reuse the entire `src/particles/` module graph and the particle stylesheet in `src/styles/`. `src/particles/ParticleBackground.tsx` is the React lifecycle wrapper; `src/app/App.tsx`, `src/components/showcase/` and `src/styles/` supply the working DOM and layout. Application, coordinator, shapes and the rendering core use strict TypeScript. The reconstructed modules in `src/particles/core/` use standard imports, meaningful names and structural types; they retain third-party provenance. Preserve shader formulas and seeded random call order when changing the core. The portable engine imports `three` and `postprocessing`; the verified versions are Three.js `0.180.0` and postprocessing `6.39.4`. Keep the source `pnpm-lock.yaml` and `pnpm-workspace.yaml` intact in standalone exports and install with the pinned pnpm version. Do not silently upgrade the rendering dependencies.

## Scene contract

Call `createAstraScene(canvas, options)` from `src/particles/engine/index.ts` only after the canvas, hero, content, SVG targets and cue elements are mounted in a browser. Its relevant options are:

- `heroElement`: a measured DOM element; defaults to `[data-astra-hero]`. Missing this throws.
- `contentElement`: the entire scrolling content range, including the last destination and footer; defaults to `[data-astra-content]`, then `document.body`.
- `cues`: an iterable of cue elements or `{ element, data }` registrations. If omitted, queries cue/path-shape elements inside content.
- `heroShape`: custom hero identifier. Omit for the original spiral. The hero must contain `[data-astra-hero-shape]` with its SVG; the identifier alone does not generate a target.
- `data`: optional hero/config overrides; prefer `data.engine` for engine parameter overrides and `data.scene` for grouped scene settings. Do not replace the defaults wholesale.
- `profile`: optional `createAstraProfile(tier, reducedMotion)` result. Default is tier 3.
- `onError(error)` and `onScroll({ progress, scatter, shape, shapeStrength, active })`.

The returned scene exposes `ready`, `replay()`, `refresh()`, `dispose()`, `input`, and renderer/animation getters. Await `ready`; handle rejection with a deliberate fallback. Always call `dispose()` on unmount before creating the replacement scene. `refresh()` remeasures existing registrations; if a wrapper captured its `cues` array before a route or structure change, recreate the scene with the new DOM. Current `ParticleBackground` does this when `heroShape` changes.

Use one scene per page with the current adapter. Copy/title/drag selectors and replay events are document/window scoped. Multiple simultaneous scenes need scoped selectors and events first. Initialize only on the client in SSR frameworks.

## Required layout and DOM hooks

Keep a fixed viewport canvas behind normal scrolling content. The backdrop uses `pointer-events: none`; transparent buttons in the content receive drag/keyboard interaction. Preserve a stacking context and place interactive content above the canvas.

| Hook                                              | Purpose                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `[data-astra-experience]`                         | Root pointer-hover region and scene wrapper.                                       |
| `[data-astra-backdrop]`                           | Fixed canvas wrapper; adapter sets its opacity, visibility and ending translation. |
| `[data-astra-hero]`                               | Hero bounds and initial scroll anchor.                                             |
| `[data-astra-content]`                            | Complete scroll range.                                                             |
| `[data-astra-hero-shape]`                         | Contains custom hero SVG.                                                          |
| `[data-astra-scroll-cue]`                         | Cue registration; attribute may be empty/`"true"` or serialized JSON.              |
| `[data-astra-path-shape="id"]`                    | A cue destination; contains the measurable SVG.                                    |
| `[data-astra-drag]`                               | Transparent focusable button for pointer capture and arrow-key rotation.           |
| `[data-astra-copy]`                               | Hero text/replay chrome that fades during scroll.                                  |
| `[data-section-header]` with `[data-astra-title]` | Intermediate title bounds, particle text clearance and parallax.                   |
| `[data-astra-ambient]`                            | Optional ambient layer restarted by replay.                                        |

Render target SVGs with a valid positive `viewBox`, real `<path d="...">` children, absolute positioning and `opacity: 0`. Keep them mounted and measurable; do not use `display: none`, hidden attributes, or a zero-sized cue. Reference geometry is invisible because particles render it. It must not flash as a solid logo during loading. `aria-hidden="true"` on decorative SVGs is appropriate.

Current shortened layout: hero `min-height: 100svh`; destination sections `min-height: 100svh`; target cue height `80svh`, normally maximum width `36rem`. `.constellation-interlude` is `20svh`; title section bottom padding is `64px` desktop and `40px` below 768px. The release marker remains one pixel tall at `calc(120px - 10svh)` desktop / `calc(80px - 10svh)` mobile. The adapter separately adds title trailing space, normally 7% of viewport height. Retain the wrapper's `translate: 0 var(--astra-title-parallax-y, 0px)`.

Shorten inactive scrolling by adjusting section spacing before changing motion equations. A canvas parent's CSS transform can alter fixed-position behavior; avoid introducing transformed ancestors without verifying the measured coordinate system.

## Cue sequence

Cues are deduplicated and ordered by DOM position. Shape anchors use their cue center; plain keyframe anchors use their top. The first cue anchor is at least `disperseDistance` (default 800px) after hero activation; later anchors are at least one pixel after the previous anchor. Shape visibility also depends on the destination's actual bounds and the viewport, so keyframe timing and shape formation are related but distinct.

Typical custom sequence: hero → model title → release cue → final shape. Original Astra additionally uses the cursor between title and release. A release cue is:

```tsx
data-astra-scroll-cue={JSON.stringify({
  easing: "smoothstep",
  keyframe: {
    opacity: 1,
    motion: { autoplay: true },
    particles: { disperse: 1, flowSpeed: 0.8 },
  },
})}
```

A destination combines `data-astra-path-shape="registered-id"` with `data-astra-scroll-cue`. Filled destination tuning currently uses:

```js
{ keyframe: {
  engine: { pathShapeScatter: 0.12, lensFlare: { intensity: 0.12 } },
  particles: { starIntensity: 2.2 }
} }
```

Each cue merges onto a default keyframe by cue index; adding many cues can eventually inherit the default final fade-out. Supply explicit keyframes/opacity when extending beyond the template. Only the last registered cue receives final-shape hold behavior, so keep the intended final shape last. Do not append a plain release cue after it. During overlapping formations, the adapter selects one strongest destination, rather than rendering two independent particle logos.

## Add or replace a shape

1. Give each custom shape a human-readable `label` for accessible button/section names (the template falls back to its registry key). Add a definition in a separate shape module: `{ width, height, paths: [d, ...], label?, viewBox?, filled?, accentPaths? }`. Keep source URLs and describe custom lettering truthfully.
2. Add it to `shapeDefinitions` in `src/particles/shapes/registry.ts`. The `ShapeId` union and `resolveAstraPathShape` derive from that registry, so there is no separate allowlist to maintain. Shape modules should satisfy `ShapeDefinition` from `src/particles/shapes/types.ts`; run the type check after registering a new key.
3. Render it through `ShapeTarget`, which supplies the `viewBox`, `data-filled="true"` for filled shapes, and `data-accent="true"` on indexed accent paths.
4. Set the variant's `hero` and/or `ending` in `src/config/showcase.json`; the configuration loader validates those keys against the shape registry. Each version has `name`, `modelName`, `logo`, `logoClass`, `url`, `hero` (omit only for Astra), `ending` and optional `showcase: true` (footer only Back to top). Set `defaultVariant` to its key, provide a matching local header SVG, and update static title/description in `index.html`. The `showcase` flag also aligns Back to top on the right. The switch derives its column count from this registry; check narrow-screen fit if adding entries.
5. Set the destination's `--astra-shape-max-width` when its proportions differ. Prefer broad wordmarks at a larger width than compact symbols, then inspect desktop/mobile. Custom hero sizing is separately computed in `src/particles/engine/coordinator.ts` from aspect ratio and viewport.

**Contour mode:** best for the existing Astra and whale outlines. It samples 1024 points across path lengths and records each path's travel interval. Keep each disconnected contour in a separate `<path>`; several pen-up `M` subpaths inside one path can create unwanted connecting travel. DOM transforms are accounted for by this sampler. All points must fit the supplied viewBox; a nonzero origin needs `viewBox`, not just width/height.

**Filled mode:** best for substantial lettering or broad silhouettes. `src/particles/shapes/filled-sampler.ts` makes cached independent interior scanline routes, returns 1024 RGBA samples, reduces row count for complex shapes, and supplies `rowSpacing`/`flowScale` to avoid visible bands. Holes must be genuine filled-path holes: keep outer and inner contours within the same compound path and preserve winding or an appropriate fill rule. Separate independently filled paths are combined as a union; putting a hole in its own filled path will fill it. Flatten SVG transforms into path coordinates first: this sampler does not apply path/group transformation matrices. Convert text, strokes, clipping and masks into final outline paths rather than expecting the sampler to render them.

The fill cache detects path data, fill-rule and accent changes, not arbitrary transform/style changes. Fill attributes should be explicit and stable. The bundled ShapeTarget assumes nonzero winding. If a new SVG requires evenodd, extend ShapeTarget to pass its fillRule to the actual SVG/path instead of only recording it in the registry. `accentPaths` supports one contiguous accent group, currently rendered in the engine's fixed blue `#1685ff`; it is not a generic multicolor SVG renderer. Arbitrary brand colors require an intentional renderer extension.

Current `deepseek-wordmark` is custom **DeepSeek** casing, not the official lowercase wordmark: original lowercase contours were retained and uppercase D/S added from the bundled font. Its contour visibility tuning includes an identifier check in `src/particles/core/animation.ts`; a new contour wordmark does not automatically inherit that special tuning. Filled shapes receive the generic filled treatment.

## Controls, lifecycle and performance

Replay can call `scene.replay()` or dispatch `astra-replay` / `astra:replay` on window. Optional adapter events are `astra:rotate` (`detail: { x, y }` in radians), `astra:pointer` (`{ active, clientX, clientY, pressed }`) and `astra:return`. Ordinary controls already attach to the drag surfaces. Keep their accessible labels, visible focus style and `touch-action: pan-y pinch-zoom`; dragging must not remove ordinary mobile page scrolling.

Keep the canvas decorative with an accessible heading and real buttons outside it. Reduced motion disables pointer/rotation motion, uses a stable scene and discrete keyframe changes, and rebuilds the renderer profile when the preference changes. It intentionally does not reproduce animated scroll formations. Retain the existing CSS reduced-motion behavior too.

The adapter pauses animation when the document is hidden or the scene is outside its content range, remeasures for resize/visual viewport/font loading, and disposes listeners/observers/GPU resources. WebGL context loss reports an error and stops the scene; there is no automatic context restoration. Original Astra can show its local poster on failure. Custom modes deliberately have no solid logo loading poster, so define a nonflashing fallback if the host product needs one.

Tier 3 limits are 40,000 maximum particles, 16 shader samples and full postprocessing; actual renderer DPR is capped at 1.5 with a 2.4-million-pixel framebuffer budget. Preserve these caps and the filled-shape cache. Use lower profiles when required rather than raising particle counts to solve a geometry issue. Validate hero, middle transition and final shape at desktop/mobile sizes, then pointer drag, replay, reverse scroll and reduced motion. No network request to the reference website is required at runtime.

## Packaging caveats

For subdirectory hosting, set Vite's `base` to the deployment path. Resolve new public assets with `assetUrl` from `src/lib/assets.ts`; existing logos and the fallback poster already use `import.meta.env.BASE_URL` through this helper. Vite rewrites bundled CSS font URLs for the configured base, and version links preserve the current directory. Font changes can alter title width and the measured transition; call refresh after asynchronous layout changes. Keep the typed scene interface and its core imports intact.

Model-name strings are manually maintained examples verified on 2026-09-06, not a live latest-model lookup. Do not promise future currency. Public-source provenance is not itself a redistribution license: do not assign a blanket original-work or MIT claim to the copied renderer, brand paths, bundled fonts or posters.
