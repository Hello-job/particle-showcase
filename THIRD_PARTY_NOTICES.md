# 第三方代码与素材来源

本文件记录来源与修改范围，不替代原始许可，也不为第三方内容授予新的许可。仓库整体的许可状态见 [LICENSE.md](LICENSE.md)。

## Astra 渲染器

粒子渲染器来自 [OpenAI GPT-6 Astra 公开页面](https://openai.com/index/gpt-6-astra/)，于 2026-09-05 获取。当前实现已将提取的编译模块整理为可读 TypeScript，位于 `src/particles/core/`；旧编译基线保存在 Git 标签 `typescript-showcase-v1`。公开 chunk、模块编号和参数记录见[渲染器来源说明](src/particles/core/README.md)。

本项目保留了原始着色器、种子随机数、粒子运动与光学后处理，并增加独立 DOM 生命周期、品牌形状、TypeScript 接入与可读核心重构。它是移植和扩展，不能把整个效果引擎描述为本项目原创。来源页面的公开可访问性不等于本项目已经取得源码再许可授权。

## 图形与字体

| 内容                                            | 原始来源                                                                                                                       | 本地处理                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| OpenAI Sans、OpenAI 字标、Astra fallback poster | [Astra 页面](https://openai.com/index/gpt-6-astra/)                                                                            | 本地保存在 `public/assets/`                                      |
| DeepSeek 鲸鱼与小写字标轮廓                     | [DeepSeek-V2 官方 SVG](https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/logo.svg)                                  | 拆分为独立轮廓，保留鲸鱼、嘴部与眼部几何                         |
| 定制 `DeepSeek` 大小写字标                      | 上述 DeepSeek SVG 与随包 OpenAI Sans Medium                                                                                    | 小写轮廓仅平移；D/S 来自字体轮廓，并对齐高度与基线；不是官方字标 |
| Kimi K 与蓝色水滴                               | [Moonshot AI K 标志](https://moonshotai.github.io/Branding-Guide/scenarios/04-k-only/k-only-dark.svg)                          | 保留官方路径及独立蓝色部件                                       |
| KIMI 字标                                       | [Moonshot AI KIMI 字标](https://moonshotai.github.io/Branding-Guide/scenarios/02-kimi-without-icon/kimi-without-icon-dark.svg) | 保留完整大写轮廓                                                 |
| Z.ai 三段图形                                   | [GLM-4.5 官方 SVG](https://github.com/zai-org/GLM-4.5/blob/main/resources/logo.svg)                                            | 移除外围方框并平移坐标                                           |
| GLM 字母轮廓                                    | 随包 OpenAI Sans Medium                                                                                                        | 字体转路径；不是描摹或宣称的官方 GLM 字标                        |

品牌名称、标志与字标用于展示形状和交互，不表示官方关系或背书。项目没有为上述素材取得或授予新的商标、字体或再分发许可。

## 依赖、截图与 Skill

React、Three.js、postprocessing、Vite 及其他 npm 依赖遵循各自软件包中的许可；实际版本以 `package-lock.json` 为准。

主展示仓库的 `docs/reference/` 保留原页面截图、选定概念图和本地实现截图，供历史比较与视觉验证。它们不应被误认为全部由本项目独立创作的素材。

`skills/particle-showcase/assets/starter/` 是从当前应用同步的独立模板，包含同源渲染器与素材。生成项目和 ZIP 应同时保留本文件、许可状态及代码中的来源说明；打包操作不改变许可范围。
