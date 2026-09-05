# 模板来源与范围

模板基于原项目 `shorter-scroll-v1`（`476b0b5`）整理。提取展示配置、增加隐藏切换栏选项、自定义品牌的页脚与标签兜底、生成时同步标题、固定依赖并改为标准 Vite 构建；粒子引擎、形状与最新间距值保持原样。原项目 Git 历史、托管配置、参考截图和本机路径不在包内。

粒子渲染器是 [OpenAI GPT-6 Astra 公开页面](https://openai.com/index/gpt-6-astra/) 的本地移植。公开 chunk、模块编号和参数记录在生成项目 `src/astra/README.md` 中。字体、OpenAI 字标与 fallback poster 来自该页面，存于 `public/assets`。

- DeepSeek 鲸鱼及小写轮廓：[官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)。`DeepSeek` 是定制大小写字标，D/S 由随包字体转路径，不是官方字标。
- Kimi：[官方 K 标志](https://moonshotai.github.io/Branding-Guide/scenarios/04-k-only/k-only-dark.svg) 与 [官方 KIMI 字标](https://moonshotai.github.io/Branding-Guide/scenarios/02-kimi-without-icon/kimi-without-icon-dark.svg)，保留独立蓝色水滴。
- Z.ai：[官方 SVG](https://raw.githubusercontent.com/zai-org/GLM-4.5/main/resources/logo.svg)，移除外围方框。GLM 字母由随包字体转路径，不是官方 GLM 字标。

本包未为这些第三方源码、字体或商标取得新的授权，也不以统一的 MIT / 开源许可重新授权它们。此文件记录来源而非许可结论；生成项目中的 `THIRD_PARTY_NOTICES.md` 应保留。替换用户自己的素材时保留准确来源记录。

型号文案是原项目 2026-09-06 的示例快照，不会自动更新。首次运行需安装 npm 依赖，渲染本身不请求原网站。
