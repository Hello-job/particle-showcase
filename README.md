# GPT-6 Astra particle experience

A local React prototype of the interactive particle background from [OpenAI’s GPT-6 Astra announcement](https://openai.com/index/gpt-6-astra/).

The particle experience ports the original scene logic, particle paths, rendering behavior, and interactions. The page is a shortened showcase of the spiral “6”, cursor constellation, and OpenAI knot; it does not reproduce the entire announcement article. OpenAI Sans and the OpenAI wordmark are stored locally in `public/assets`.

## Interaction

- Move the pointer through a particle field.
- Drag a field to rotate it, or focus the field and use the arrow keys.
- Scroll to move between the three constellations.
- Use the circular replay button to restart the opening sequence.

## Structure

- `src/App.jsx`: navigation, hero labels, accessible drag surfaces, scroll cues, and constellation targets.
- `src/styles.css`: source-based typography, layout, responsive behavior, and page chrome.
- `src/AstraBackground.jsx`: fixed background canvas and scene integration.
- `src/astra/`: particle engine.

The scene discovers `[data-astra-hero]`, `[data-astra-content]`, `[data-astra-title]`, `[data-astra-copy]`, and `[data-astra-scroll-cue]`. Each path cue exposes its original SVG using `data-astra-path-shape="cursor"` or `data-astra-path-shape="openai-knot"`. Buttons with `[data-astra-drag]` receive the rotation interactions. The replay button dispatches `astra-replay` on `window`.

## Local development

The project uses Vite. Available scripts are `npm run dev`, `npm run build`, and `npm run test:sites`. The Sites-compatible worker and build preparation remain intact.
