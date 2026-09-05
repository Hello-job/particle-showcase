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
