# 使用 Particle Showcase Skill

Skill 包含工作说明、可运行的 React + TypeScript 模板、创建脚本与形状接入参考。使用完整文件夹或 ZIP；单独一个 `SKILL.md` 不包含粒子引擎。

[下载完整 Skill ZIP](../../deliverables/particle-showcase-skill.zip) · [查看 Skill 源码](../../skills/particle-showcase/SKILL.md)

## 安装

将压缩包中的整个 `particle-showcase` 文件夹放入 `~/.codex/skills/`。如果设置了 `CODEX_HOME`，放到该目录下的 `skills/`。最终目录结构应为：

```text
skills/
└── particle-showcase/
    ├── SKILL.md
    ├── agents/
    ├── scripts/
    ├── references/
    └── assets/starter/
```

重新打开任务后调用 `$particle-showcase`。也可以把完整压缩包交给支持此 Skill 格式的 Agent，让它安装并创建项目。

## 调用示例

使用内置示例：

```text
使用 $particle-showcase，创建 DeepSeek 粒子展示页。
保留鼠标扰动、拖拽旋转、滚动成形和重播，打开本地预览。
```

使用自己的 SVG：

```text
使用 $particle-showcase，把首屏粒子换成我提供的 SVG Logo，
底部聚成 ORION 字样。使用黑色背景，只保留左上角 Logo，
隐藏版本切换，中间标题写 Orion One。
```

也可以要求接入已有 React 页面。Skill 会指导 Agent 合并必要组件和 DOM 锚点，而不是覆盖整个应用。

## 手动生成项目

创建脚本需要 Python 3.9+；生成项目需要 Node.js 22.12+、npm，以及支持 WebGL 的浏览器。

```bash
python3 /path/to/particle-showcase/scripts/create_showcase.py \
  --dest /path/to/new-project \
  --brand deepseek \
  --title "My Model" \
  --single-brand
```

`--brand` 可选 `astra`、`deepseek`、`kimi`、`glm`。省略 `--title` 和 `--single-brand` 保留示例标题与切换栏。脚本只接受新目录或空目录，不覆盖已有项目。

```bash
cd /path/to/new-project
npm ci
npm run typecheck
npm run build
npm run dev
```

生成项目保留同样的 TypeScript 分层：React 组件为 `.tsx`，自有逻辑为 `.ts`，有来源记录的原始渲染器独立保存在 `src/particles/vendor/astra/`。首次安装依赖需要网络，运行粒子效果无需访问原始网站。

## 使用范围

内置 Astra、DeepSeek、Kimi 和 GLM 四套示例。自己的 Logo 应优先提供 SVG；文字需要转为轮廓。不同设备的性能、光点和光晕细节可能不同。

模板保留源码、字体和品牌图形的来源说明，当前没有统一开源许可证。具体范围见 [第三方来源](../../THIRD_PARTY_NOTICES.md) 和 [许可状态](../../LICENSE.md)。
