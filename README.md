# Particle Showcase

让 Logo 在星光中成形，随鼠标、拖拽和滚动散开、旋转、再次聚合。

基于 **React + TypeScript + Vite + Three.js** 的交互粒子展示项目，包含四套品牌示例和可独立使用的 Agent Skill。页面、形状数据与渲染器分层组织，便于阅读、调整和接入自己的作品。

![DeepSeek 粒子字标的实际浏览器截图](docs/reference/deepseek-titlecase-desktop.jpg)

[快速开始](#快速开始) · [定制形状](docs/customization.md) · [架构说明](docs/architecture.md) · [使用 Skill](docs/skill/usage.md) · [参与贡献](CONTRIBUTING.md)

## 体验

- **真实粒子渲染**：本地 WebGL 场景，保留星点、光晕、聚合和散开动画。
- **连续交互**：鼠标扰动、拖拽旋转、方向键控制、滚动变形与重播。
- **四套示例**：统一的品牌切换、简洁页头、桌面和窄屏布局。
- **可替换形状**：支持 SVG 轮廓、填充形状、字母内部留白、分离部件和局部配色。
- **可复用 Skill**：从同一份源码生成独立模板，附创建脚本、接入说明和验证清单。

| 模式     | 地址参数          | 首屏                 | 底部                       |
| -------- | ----------------- | -------------------- | -------------------------- |
| Astra    | `?shape=astra`    | 螺旋 6               | OpenAI 结形，中间包含光标  |
| DeepSeek | `?shape=deepseek` | 鲸鱼轮廓             | 定制大小写 `DeepSeek` 字标 |
| Kimi     | `?shape=kimi`     | K 标志与独立蓝色水滴 | 完整 KIMI 字标             |
| GLM      | `?shape=glm`      | GLM 字母             | 去除外框的 Z.ai 三段图形   |

默认模式为 DeepSeek。示例模型名称是 2026-09-06 的文案快照，手动维护，不作为实时型号列表。

## 快速开始

需要 **Node.js 22.12+**、npm，以及支持 WebGL 的现代浏览器。

```bash
npm ci
npm run dev
```

打开终端显示的本地地址，使用右上角切换模式。粒子、字体和图形资源均在本地；首次安装依赖需要网络。

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

普通生产构建输出到 `dist/`。Sites 适配独立保留，需要时执行 `npm run build:sites` 与 `npm run test:sites`；对应产物位于 `dist/client/`、`dist/server/` 和 `dist/.openai/`。

## 目录

```text
src/
├── app/                  # 页面组合与入口逻辑
├── components/showcase/  # 页头、形状锚点和交互控件
├── config/               # 展示配置与类型
├── particles/
│   ├── ParticleBackground.tsx
│   ├── engine/           # TypeScript 场景接入与类型边界
│   ├── shapes/           # SVG 几何、注册表与采样
│   └── core/             # 可读 TypeScript 粒子、动画、渲染和着色器
├── styles/               # 页面与粒子背景样式
└── main.tsx
public/assets/            # 本地图形与字体
docs/                     # 架构、定制、Skill 和历史视觉记录
skills/particle-showcase/ # Skill 源文件与自动同步的独立模板
scripts/                  # 构建适配、模板同步与打包
tests/                    # 行为与构建检查
deliverables/             # 可分发的 Skill ZIP
worker/                   # 可选 Sites 适配
```

React 组件使用 `.tsx`，粒子核心和其他逻辑使用 `.ts`。`particles/core/` 将提取的编译模块整理为普通导入、明确命名和结构类型；GPU 着色器保留为 GLSL 源码。原始编译版本保存在 Git 标签 `typescript-showcase-v1`，不参与当前运行或 Skill 分发。这是有来源记录的重构，不能称为找回原作者源码。详见[架构与数据流](docs/architecture.md)和[粒子核心阅读指南](src/particles/core/README.md)。

## 定制与 Skill

先从 `src/config/showcase.json` 调整品牌信息、默认模式和标题；更换 SVG、文字轮廓或滚动节奏时阅读[定制指南](docs/customization.md)。

将 [Skill ZIP](deliverables/particle-showcase-skill.zip) 安装后，可以直接向 Agent 描述目标：

```text
使用 $particle-showcase，把我的 SVG Logo 做成互动粒子页面。
首屏展示 Logo，底部聚成品牌英文，保留鼠标、拖拽、滚动和重播。
```

[安装与使用](docs/skill/usage.md)介绍完整流程。[Skill 开发说明](docs/skill/development.md)说明如何同步模板、检查初始化器和重新打包；不要手动维护另一份应用代码。

## 来源与许可状态

粒子渲染器移植自 [OpenAI GPT-6 Astra 页面](https://openai.com/index/gpt-6-astra/)，本项目增加了独立页面、品牌形状、工程组织和 Skill。它不是 OpenAI、DeepSeek、Moonshot AI 或 Z.ai 的官方项目。

**仓库尚未选择统一的开源许可证。** 原始渲染代码、字体与品牌素材保留各自来源，本仓库不对它们授予新的许可。公开展示源码与授予开源许可是两个独立步骤；当前状态见 [LICENSE.md](LICENSE.md)，具体素材见[第三方来源说明](THIRD_PARTY_NOTICES.md)。

本轮检查见 [可读核心验收](docs/verification/readable-engine.md)，前一轮页面迁移见 [TypeScript 重构验收](docs/verification/typescript-migration.md)。历史截图与视觉验收在 [docs/archive](docs/archive/README.md)，各阶段 Git 标签保持可回退。
