# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Astra recreation target

The user requests maximum fidelity to the interactive particle background at https://openai.com/index/gpt-6-astra/, including mouse and scroll behavior. Preserve the source shaders, geometry, seeded distribution, original interaction parameters and desktop/mobile proportions. Match the captured source in `reference/`; do not redesign the effect. The page surrounding the effect is a compact demo of its three shapes. Keep particle assets and dependencies local.

## DeepSeek customization

The original Astra experience is preserved on `main` and the annotated tag `astra-original-v1` (commit `3dd20cf`). Work on the DeepSeek whale variation belongs to `feature/deepseek-particles`. Keep the original engine defaults available, use the official DeepSeek SVG paths rather than drawing an approximation, and preserve mouse, drag, replay and scroll effects. Save each verified variation as its own commit; never overwrite or move the original tag.

The user selected generated option 1 (the lowercase particle `deepseek` wordmark) on 2026-09-05. Put it in the final constellation section at the bottom, remove the intermediate cursor in DeepSeek mode, and keep the whale as the particle hero. Remove the solid whale loading poster that flashes before the particles initialize. Reference: `reference/deepseek-wordmark-selected.png`. The earlier whale/cursor/whale version remains preserved at `deepseek-v1`.

The user wants both versions to be minimal particle showcases: keep each brand logo at the top left and the shared version switch at the top right. Remove navigation menus, search, login, CTA buttons, the mobile menu, and the old bottom-left switch. Preserve particle layout and interactions. The original full Astra snapshot remains at `main` / `astra-original-v1`; keep `deepseek-wordmark-v2` unchanged as the previous wordmark snapshot.

## Kimi and GLM customization

The user approved the Kimi and GLM hero and bottom concepts on 2026-09-06. Selected visual references are `reference/kimi-glm-hero-selected.png` and `reference/kimi-glm-bottom-selected.png`; use these as the source of truth. Extend the shared top-right switch to Astra / DeepSeek / Kimi / GLM, preserving the top-left brand logo and minimal showcase header in all four modes.

Kimi starts with the exact official K symbol and its detached blue droplet, then ends with the full official uppercase KIMI wordmark. GLM starts with the selected simple uppercase GLM lettering, then ends with the exact official three-piece Z.ai emblem without its surrounding square. Neither new mode includes the intermediate cursor. Their footer only contains Back to top. Keep the original mouse, drag, scroll and replay behavior and avoid solid logo loading posters in custom particle heroes.

Keep Kimi and Z.ai official paths in `src/astra/brand-shapes.js` with source provenance. GLM lettering is outlined from the bundled OpenAI Sans Medium font and must not be described as a traced official GLM logo. Register the new shapes in `src/astra/shapes.js`; their cached filled scanline sampler in `src/astra/filled-shapes.js` must preserve counters, gaps between disconnected parts, and the Kimi blue accent. Preserve the existing Astra / DeepSeek contour sampling and engine defaults.

Kimi and GLM are available at `/?shape=kimi` and `/?shape=glm` on the existing `feature/deepseek-particles` branch. Preserve all existing baseline tags, including `astra-original-v1`, `deepseek-v1`, and `deepseek-wordmark-v2`; save the verified expansion as a separate commit without moving earlier tags.

## Model title copy

On 2026-09-06, the user approved replacing the intro headline in each mode with its verified model name: Astra → `GPT-6 Astra`, DeepSeek → `DeepSeek-V4-Pro`, Kimi → `Kimi K3`, and GLM → `GLM-5.3`. Remove the prior marketing sentence and show only the subtle interaction hint `Move · Drag · Scroll` below the model name. These names reflect verification on that date from the official [Astra announcement](https://openai.com/index/gpt-6-astra/), [DeepSeek website](https://deepseek.com/), [Kimi K3 announcement](https://kimi.com/news/kimi-k3), and [Z.ai model page](https://autoclaw.z.ai/models/); they are maintained manually, not automatically updated.
