# Particle Showcase

A React + TypeScript / TSX starter for an interactive WebGL particle showcase.
Includes Astra, DeepSeek, Kimi and GLM examples, with pointer interaction,
drag rotation, scroll transitions and replay.

## Development

Use the Node.js version in `.nvmrc` and npm, then run:

```sh
npm ci
npm run dev
```

`npm run typecheck`, `npm run lint`, `npm test` and `npm run format:check` validate
the source. `npm run build` creates a static site in `dist/`;
`npm run preview` serves that build locally.

## Source map

- `src/app/`: application composition.
- `src/components/showcase/`: header, hero, shape targets and controls.
- `src/config/showcase.json`: model names, brands, default version and shapes.
- `src/particles/ParticleBackground.tsx`: React scene lifecycle.
- `src/particles/engine/`: typed scene API and DOM/scroll coordination.
- `src/particles/shapes/`: shape registry and custom SVG sampling.
- `src/particles/core/`: readable TypeScript particle generation, animation and rendering.
- `src/styles/`: page and particle styles.
- `public/assets/`: bundled logos, fonts and fallback image.

Use the parent Skill's `references/engine-and-shapes.md` for new SVG shapes.
The canvas requires measurable DOM anchors and one active scene per page.
For subdirectory hosting, set Vite's `base` to the deployment path. Resolve new
public assets with `assetUrl` from `src/lib/assets.ts`; the bundled logos and
poster already use it, and version links preserve the current directory.

The application and rendering core use strict TypeScript. The core is a readable
reconstruction of extracted particle modules; it is not the original author's
uncompiled source or an independently original algorithm. GPU shaders use GLSL. Preserve [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and
`src/particles/core/README.md`. Source availability does not grant
redistribution rights to all bundled source, fonts or brand assets.

This starter is generated from the maintained showcase source. Maintainers
update the main application and run `npm run skill:sync` in the source
repository, then verify and pack the Skill. Generated projects can be edited
independently.
