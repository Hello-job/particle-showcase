# DeepSeek / Astra particle experience

当前默认显示 DeepSeek 鲸鱼粒子。页面右上角可切换到 Astra，原版也已单独保存在 Git 中。

- DeepSeek: http://localhost:4173/?shape=deepseek
- Astra: http://localhost:4173/?shape=astra
- 原始基线：`main` 分支、`astra-original-v1` 标签、提交 `3dd20cf`
- DeepSeek 开发分支：`feature/deepseek-particles`

返回完整原版代码：`git switch main`。回到鲸鱼版：`git switch feature/deepseek-particles`。两份代码都有独立提交，无需删除或覆盖文件。

鲸鱼的轮廓、嘴部和眼部来自 [DeepSeek 官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)，路径保存在 `src/astra/custom-shapes.js`。首屏、滚动末屏均使用鲸鱼；中间保留光标形状。DeepSeek 模式略微收窄粒子沿轮廓的散布，让尾鳍和口眼更清晰。

## Astra engine origin

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

## Custom opening shape

`AstraBackground` passes `heroShape` to `createAstraScene`. The hero includes `[data-astra-hero-shape]` with measurable SVG paths. The adapter samples these paths and the animation releases them directly into dispersed stars, retaining the original convergence, pointer response, rotation and replay. Omitting `heroShape` keeps the original spiral logic.
