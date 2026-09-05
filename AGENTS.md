# Project instructions

## Development

This is a React + TypeScript particle showcase and a distributable Agent Skill. Keep React components in `.tsx`, handwritten logic and geometry data in `.ts`, and strict type checking enabled. Do not use `@ts-nocheck`, broad `any` casts, or file renaming to hide migration errors.

Run the local server and open the available browser yourself when working on the preview. Preserve its existing port when possible; do not give the user startup instructions when you can run it. For source refactors, verify that the existing visual result and interactions still work.

Read `README.md`, `docs/architecture.md` and `docs/customization.md` for the maintained structure. Record durable user preferences here. Keep historical experiments and screenshots under `docs/archive/` and `docs/reference/` instead of the repository root.

## Source layout

- `src/app/App.tsx`: page composition and scroll stages.
- `src/components/showcase/`: header, hero, SVG targets, drag surfaces and footer.
- `src/config/showcase.json`: brand/model copy, default mode, hero/ending shapes and switch visibility.
- `src/config/showcase.ts`: validated configuration types and mode selection.
- `src/particles/ParticleBackground.tsx`: React scene lifetime.
- `src/particles/engine/`: typed DOM, scroll, device profile and public API.
- `src/particles/shapes/`: SVG geometry, shape registry and filled sampler.
- `src/particles/vendor/astra/`: retained compiled renderer and typed adapter boundary.
- `src/styles/`: global, page and particle styles.
- `public/assets/brands/`, `fonts/`, `images/`: local runtime resources.

The vendor JavaScript is intentionally retained to preserve the source shaders, seeded distribution, geometry, optical postprocessing and motion parameters. Do not rename this compiled code to TypeScript or rewrite its mathematics as routine cleanup. Its provenance is recorded in `src/particles/vendor/astra/README.md` and `THIRD_PARTY_NOTICES.md`.

## Visual and interaction contract

The target is the interactive background from https://openai.com/index/gpt-6-astra/. Match the references in `docs/reference/`; do not redesign the effect during maintenance. For substantial visual changes with an unclear source, use the Product Design context workflow first. When the user selects a mock, that image governs anatomy, spacing, typography, color and hierarchy.

All modes retain the top-left brand logo and one shared top-right Astra / DeepSeek / Kimi / GLM switch. Tabs must have equal widths, common sizing and consistent alignment at each breakpoint. No navigation menus, search, login, CTA, mobile menu, old lower-left switch or `Move · Drag · Scroll` hint. Preserve pointer response, drag rotation, arrow-key interaction, scroll transitions, replay, reverse scrolling, reduced motion and scene disposal.

| Mode     | Hero                                          | Final constellation                                     | Model title     |
| -------- | --------------------------------------------- | ------------------------------------------------------- | --------------- |
| Astra    | Original spiral 6, with GPT/Astra side labels | OpenAI knot; cursor appears in the intermediate stage   | GPT-6 Astra     |
| DeepSeek | Official whale                                | Custom titlecase DeepSeek wordmark                      | DeepSeek-V4-Pro |
| Kimi     | Official K and detached blue droplet          | Official uppercase KIMI wordmark                        | Kimi K3         |
| GLM      | Outlined GLM letters                          | Exact Z.ai three-piece emblem, without its outer square | GLM-5.3         |

Model titles are manually maintained examples verified on 2026-09-06, not live latest-model queries. Show only the title in the introduction. DeepSeek, Kimi and GLM do not include the intermediate cursor or a solid Logo loading poster. Kimi and GLM footers contain only Back to top; Astra and DeepSeek also retain their Explore link.

Keep the middle interlude at 20svh and the title bottom spacing at 64px desktop / 40px mobile. Adjust layout spacing before changing scroll-cue equations when addressing inactive scroll distance. Preserve the latest compact transition.

## Shape integrity

DeepSeek's whale, mouth and eye use the exact official paths in `shapes/deepseek.ts`. Its custom `DeepSeek` lettering in `shapes/deepseek-titlecase.ts` preserves official lowercase e/e/p/e/e/k by translation and adds real OpenAI Sans Medium D/S outlines, aligned to the original k height and baseline. Keep ten independent contours for counters and disconnected pieces; this is not the official logotype. Header and bottom use consistent D/S casing. Retain the original lowercase assets as source material.

Kimi and Z.ai paths in `shapes/brands.ts` retain their official geometry and source URLs. GLM lettering is outlined from the bundled OpenAI Sans Medium font, not traced from an official GLM logo. Kimi/GLM use the filled sampler, which preserves counters, independent pieces and the Kimi blue accent. Astra/DeepSeek retain contour sampling. `shapes/registry.ts` is the single registry and derives accepted shape keys.

## Checks and builds

Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` and `npm run build` after substantive changes. Run meaningful browser checks for changes affecting the visible result or input/lifecycle behavior. Do not claim a physical-phone or failure-mode check that was only simulated or not performed.

The normal Vite build produces `dist/`. Preserve `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` for the optional Sites adapter. Before a Sites handoff, run `npm run build:sites` and `npm run test:sites`; the Sites build must leave `dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`. No deployment is implied by repository cleanup.

## Skill maintenance

The maintained Skill is `skills/particle-showcase/`. Its `assets/starter/` is generated from the application, not independently maintained. After relevant source changes, run `npm run skill:sync`, `npm run skill:check`, `npm run test:skill` and `npm run skill:pack`. Validate a newly generated project when changing the template or initializer. Refresh the installed Skill copy as part of an authorized Skill update; packing must not silently alter a user's global installation.

The shareable archive is `deliverables/particle-showcase-skill.zip`. Keep the template portable, free of personal paths, build output, dependency folders and Sites-only configuration. Documentation belongs in `docs/skill/` and the Skill's scoped references.

## Provenance and version preservation

Do not assign a blanket MIT or other open-source license to the extracted renderer, brand paths, bundled fonts or posters. Keep `LICENSE.md` and `THIRD_PARTY_NOTICES.md` accurate. The user plans to make the project available for others to study; publishing or licensing third-party contents requires a separate, accurate decision.

Keep all prior snapshots intact: `astra-original-v1` (`3dd20cf`, also `main`), `deepseek-v1`, `deepseek-wordmark-v2`, `two-brand-showcase-v1`, `kimi-glm-v1`, `model-titles-v1`, `showcase-polish-v1`, `shorter-scroll-v1` and `particle-showcase-skill-v1`. Do not move or overwrite these tags. The TypeScript organization is developed on `refactor/typescript-showcase`; save verified changes separately.
