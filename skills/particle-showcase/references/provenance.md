# 源码与素材来源

本 Skill 仅分发操作说明、接入文档和项目导出脚本，不包含应用或素材副本。可运行实现由 Particle Showcase 源仓库提供；初版基于 `shorter-scroll-v1`（`476b0b5`），随后升级为 React + TypeScript / TSX 与可读粒子核心。生成器按需从本地源仓库导出代码、四套品牌示例和运行资源，可以选择默认品牌、自定义标题或隐藏版本切换。导出项目不包含源仓库 Git 历史、Sites 托管配置、参考截图或本机路径。

粒子渲染器是 [OpenAI GPT-6 Astra 公开页面](https://openai.com/index/gpt-6-astra/) 的本地移植。公开 chunk、模块编号和参数记录在生成项目 `src/particles/core/README.md` 中。核心已将提取的编译实现重构为可读 TypeScript，场景接口、DOM 协调与形状注册在相邻的 `engine/` 和 `shapes/`。旧编译版仅保留在源仓库 Git 标签 `typescript-showcase-v1`。新的命名与类型是本项目整理，不代表恢复了原作者的 TypeScript 源码或独立原创算法。字体、OpenAI 字标与 fallback poster 来自该页面，分别存于 `public/assets/fonts`、`brands` 和 `images`。

- DeepSeek 鲸鱼及小写轮廓：[官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)。`DeepSeek` 是定制大小写字标，D/S 由源仓库中的字体转路径，不是官方字标。
- Kimi：[官方 K 标志](https://moonshotai.github.io/Branding-Guide/scenarios/04-k-only/k-only-dark.svg) 与 [官方 KIMI 字标](https://moonshotai.github.io/Branding-Guide/scenarios/02-kimi-without-icon/kimi-without-icon-dark.svg)，保留独立蓝色水滴。
- Z.ai：[官方 SVG](https://raw.githubusercontent.com/zai-org/GLM-4.5/main/resources/logo.svg)，移除外围方框。GLM 字母由源仓库中的字体转路径，不是官方 GLM 字标。

本项目未为这些第三方源码、字体或商标取得新的授权，也不以统一的 MIT / 开源许可重新授权它们。此文件记录来源而非许可结论；生成项目中的 `THIRD_PARTY_NOTICES.md` 应保留。替换用户自己的素材时保留准确来源记录。

型号文案是原项目 2026-09-06 的示例快照，不会自动更新。首次运行需安装依赖，渲染本身不请求原网站。
