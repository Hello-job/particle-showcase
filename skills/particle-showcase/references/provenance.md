# 模板来源与范围

初版模板基于原项目 `shorter-scroll-v1`（`476b0b5`）整理；当前版本随主项目升级为 React + TypeScript / TSX，并由 `npm run skill:sync` 从主项目生成，避免维护两套分叉代码。保留四种示例形状、交互和短间距布局，增加严格类型、配置检查与标准化目录。生成器可选择默认品牌、自定义标题或隐藏版本切换。主项目 Git 历史、Sites 托管配置、参考截图和本机路径不在包内。

粒子渲染器是 [OpenAI GPT-6 Astra 公开页面](https://openai.com/index/gpt-6-astra/) 的本地移植。公开 chunk、模块编号和参数记录在生成项目 `src/particles/vendor/astra/README.md` 中。提取的第三方 JavaScript 保留在该目录，类型化场景接口、DOM 协调与形状注册在相邻的 `engine/` 和 `shapes/`，不将前者伪称为原创 TypeScript。字体、OpenAI 字标与 fallback poster 来自该页面，分别存于 `public/assets/fonts`、`brands` 和 `images`。

- DeepSeek 鲸鱼及小写轮廓：[官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)。`DeepSeek` 是定制大小写字标，D/S 由随包字体转路径，不是官方字标。
- Kimi：[官方 K 标志](https://moonshotai.github.io/Branding-Guide/scenarios/04-k-only/k-only-dark.svg) 与 [官方 KIMI 字标](https://moonshotai.github.io/Branding-Guide/scenarios/02-kimi-without-icon/kimi-without-icon-dark.svg)，保留独立蓝色水滴。
- Z.ai：[官方 SVG](https://raw.githubusercontent.com/zai-org/GLM-4.5/main/resources/logo.svg)，移除外围方框。GLM 字母由随包字体转路径，不是官方 GLM 字标。

本包未为这些第三方源码、字体或商标取得新的授权，也不以统一的 MIT / 开源许可重新授权它们。此文件记录来源而非许可结论；生成项目中的 `THIRD_PARTY_NOTICES.md` 应保留。替换用户自己的素材时保留准确来源记录。

型号文案是原项目 2026-09-06 的示例快照，不会自动更新。首次运行需安装 npm 依赖，渲染本身不请求原网站。
