# Astra / DeepSeek / Kimi / GLM particle experience

当前默认显示 DeepSeek 鲸鱼粒子。四个版本均保留左上角品牌标志和右上角 Astra / DeepSeek / Kimi / GLM 切换；切换控件使用统一的尺寸、内边距和四列等宽布局，桌面及手机端切换版本时都保持一致。页头不设导航菜单、搜索、登录、CTA 按钮或手机菜单，也没有旧的左下角切换入口。完整 Astra 原版已单独保存在 Git 中。

四个版本的介绍标题分别为 `GPT-6 Astra`、`DeepSeek-V4-Pro`、`Kimi K3`、`GLM-5.3`，标题下不显示营销文案或交互提示；`Move · Drag · Scroll` 已按最新要求全部移除。型号名称以 2026-09-06 的官网核实结果为准，后续手动维护。

| 版本 | 本地预览 | 首屏粒子 | 底部粒子 |
| --- | --- | --- | --- |
| Astra | http://localhost:4173/?shape=astra | 螺旋 6 | OpenAI 结形，中间保留光标 |
| DeepSeek | http://localhost:4173/?shape=deepseek | 官方鲸鱼 | 定制大小写 DeepSeek 字标 |
| Kimi | http://localhost:4173/?shape=kimi | 官方 K 标志和独立蓝色水滴 | 官方完整大写 KIMI 字标 |
| GLM | http://localhost:4173/?shape=glm | 简洁大写 GLM 字标 | 官方 Z.ai 三段图形，不含外框 |

Kimi 和 GLM 使用已选效果图 `reference/kimi-glm-hero-selected.png`、`reference/kimi-glm-bottom-selected.png`，沿用黑底星光、鼠标、拖拽、滚动及重播交互。两个新版本的页脚只保留 Back to top。

- 原始基线：`main` 分支、`astra-original-v1` 标签、提交 `3dd20cf`
- 当前扩展开发分支：`feature/deepseek-particles`
- 上一版鲸鱼 / 光标 / 鲸鱼：`deepseek-v1`（提交 `582d779`）
- 之前的鲸鱼 / 底部英文字标快照：`deepseek-wordmark-v2`（保持不变）
- 添加 Kimi / GLM 之前的双品牌简洁展示：`two-brand-showcase-v1`（提交 `9974c46`）
- Kimi / GLM 四品牌扩展快照：`kimi-glm-v1`（保持不变）
- 模型名称与操作提示版：`model-titles-v1`（保持不变）
- 当前去提示、DeepSeek 大小写及统一切换栏版本：`showcase-polish-v1`

返回完整原版代码：`git switch main`。回到包含各品牌的扩展版本：`git switch feature/deepseek-particles`。现有原版与 DeepSeek 标签保持不变，无需删除或覆盖文件。

鲸鱼的轮廓、嘴部和眼部来自 [DeepSeek 官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)，路径保存在 `src/astra/custom-shapes.js`，保持不变。首屏使用鲸鱼，滚动后散开，最底部聚成 `DeepSeek` 英文字标，左上角也使用相同的大写 D / S；DeepSeek 模式不再出现光标。首屏没有实心鲸鱼加载占位图。字标在手机上会等比例缩小光点和光晕，保留字母间隙。

`DeepSeek` 是用户要求的定制大小写字标，不是官方字标。其粒子路径保存在 `src/astra/deepseek-titlecase.js`：保留官方小写 e / e / p / e / e / k 轮廓，仅平移排版；大写 D / S 使用本地 OpenAI Sans Medium 的真实字形轮廓，按原 k 的高度和基线缩放，字母间距统一为 2.3 单位。十条独立轮廓保留 D 的内部空白和 k 的分离部件，沿用现有轮廓采样。页头资源为 `public/assets/deepseek-titlecase.svg`，单独字标为 `public/assets/deepseek-titlecase-wordmark.svg`。原官方小写路径及 SVG 资源继续保留，不覆盖已有快照。

Kimi 路径来自 Moonshot AI 官方品牌指南的 [K 标志](https://moonshotai.github.io/Branding-Guide/scenarios/04-k-only/k-only-dark.svg)和 [KIMI 字标](https://moonshotai.github.io/Branding-Guide/scenarios/02-kimi-without-icon/kimi-without-icon-dark.svg)。Z.ai 图形来自 [GLM-4.5 官方 SVG](https://raw.githubusercontent.com/zai-org/GLM-4.5/main/resources/logo.svg)，只去掉外围方框并平移坐标。GLM 字母使用现有本地 OpenAI Sans Medium 字体转为路径，与选定效果图的简洁字形一致，不声称它是官方 GLM 标志。四个新形状的路径与来源注释放在 `src/astra/brand-shapes.js`，页头字标也存于本地 `public/assets`。

## Astra engine origin

A local React prototype of the interactive particle background from [OpenAI’s GPT-6 Astra announcement](https://openai.com/index/gpt-6-astra/).

The particle experience ports the original scene logic, particle paths, rendering behavior, and interactions. The page is a shortened showcase of the spiral “6”, cursor constellation, and OpenAI knot; it does not reproduce the entire announcement article. OpenAI Sans and the OpenAI wordmark are stored locally in `public/assets`.

## Interaction

- Move the pointer through a particle field.
- Drag a field to rotate it, or focus the field and use the arrow keys.
- Scroll to move between the constellations.
- Use the circular replay button to restart the opening sequence.

## Structure

- `src/App.jsx`: brand logos, version switch, hero labels, accessible drag surfaces, scroll cues, and constellation targets.
- `src/styles.css`: source-based typography, layout, responsive behavior, and page chrome.
- `src/AstraBackground.jsx`: fixed background canvas and scene integration.
- `src/astra/shapes.js`: shared shape registry; Kimi / GLM contours come from `brand-shapes.js`, and the custom DeepSeek casing comes from `deepseek-titlecase.js`.
- `src/astra/filled-shapes.js`: cached interior scanline sampler for Kimi / GLM, preserving letter counters, disconnected pieces, and the Kimi accent.
- `src/astra/`: particle engine.

The scene discovers `[data-astra-hero]`, `[data-astra-content]`, `[data-astra-title]`, `[data-astra-copy]`, and `[data-astra-scroll-cue]`. Each path cue exposes its SVG through `data-astra-path-shape` with a shape registry key. Buttons with `[data-astra-drag]` receive the rotation interactions. The replay button dispatches `astra-replay` on `window`.

## Local development

The project uses Vite. Available scripts are `npm run dev`, `npm run build`, and `npm run test:sites`. The Sites-compatible worker and build preparation remain intact.

## Custom opening shape

`AstraBackground` passes `heroShape` to `createAstraScene`. The hero includes `[data-astra-hero-shape]` with measurable SVG paths. The adapter samples these paths and the animation releases them directly into dispersed stars, retaining the original convergence, pointer response, rotation and replay. Omitting `heroShape` keeps the original spiral logic.

New Kimi / GLM shapes use `filled: true`. Their sampler creates independent interior intervals instead of connecting disconnected contours, caches results by SVG geometry, and keeps the Kimi blue accent in a separate sample range. Existing Astra and DeepSeek shapes retain their contour sampler.
