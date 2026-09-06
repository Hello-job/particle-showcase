# 使用 Particle Showcase Skill

Skill 包含工作说明、创建脚本与形状接入参考。粒子引擎、页面示例和素材只保存在本仓库根目录，Skill 不再复制一份应用。你可以直接在本项目中使用它，也可以从本地仓库导出一个独立项目。

[下载最新 Skill ZIP](https://github.com/Hello-job/particle-showcase/releases/latest/download/particle-showcase-skill.zip) · [备用下载](https://github.com/Hello-job/particle-showcase/raw/refs/heads/main/deliverables/particle-showcase-skill.zip) · [查看 Skill 源码](../../skills/particle-showcase/SKILL.md)

## 安装

点击上方下载链接，解压 ZIP，将其中整个 `particle-showcase` 文件夹放入 `~/.codex/skills/`。如果设置了 `CODEX_HOME`，放到 `$CODEX_HOME/skills/`。最终目录结构应为：

```text
skills/
└── particle-showcase/
    ├── SKILL.md
    ├── agents/
    ├── references/
    └── scripts/
        └── create_showcase.py
```

安装整个文件夹，保留脚本与参考文件。重新打开任务后调用 `$particle-showcase`。也可以把压缩包交给支持此 Skill 格式的 Agent 安装。

**ZIP 不包含引擎或品牌素材。** 使用安装后的 Skill 时，还需获取仓库源码：

```bash
git clone https://github.com/Hello-job/particle-showcase.git
```

也可以打开 [GitHub 仓库](https://github.com/Hello-job/particle-showcase)，选择 **Code → Download ZIP** 并解压。告诉 Agent 源码的本地路径，或直接在源码目录中打开任务。Skill ZIP 与仓库源码各有用途，二者需要同时保留，直到新项目导出完成。

## 调用示例

在本仓库使用已有示例：

```text
使用 $particle-showcase，在当前仓库调整 DeepSeek 粒子展示页。
保留鼠标扰动、拖拽旋转、滚动成形和重播，打开本地预览。
```

使用自己的 SVG：

```text
使用 $particle-showcase，把首屏粒子换成我提供的 SVG Logo，
底部聚成 ORION 字样。使用黑色背景，只保留左上角 Logo，
隐藏版本切换，中间标题写 Orion One。
```

创建另一个项目时，同时提供源仓库和目标路径。也可以要求接入已有 React 页面，Skill 会指导 Agent 合并必要组件和 DOM 锚点。

## 手动生成项目

创建脚本需要 **Python 3.9+**；生成项目需要 **Node.js 22.13+**、**pnpm 11.17.0**，以及支持 WebGL 的浏览器。pnpm 版本由生成项目的 `package.json` 固定。

```bash
python3 ~/.codex/skills/particle-showcase/scripts/create_showcase.py \
  --source /path/to/particle-showcase-repository \
  --dest /path/to/new-project \
  --brand deepseek \
  --title "My Model" \
  --single-brand
```

上例使用默认安装位置；设置了 `CODEX_HOME` 时，请将脚本路径改为该目录下的 `skills/particle-showcase/scripts/create_showcase.py`。把 `/path/to/…` 换成你的实际路径。

`--source` 指向本仓库的根目录，那里应有 `src/`、`public/` 和 `package.json`。已安装或单独解压的 Skill 必须显式提供这个参数。只有运行源仓库内的 `skills/particle-showcase/scripts/create_showcase.py` 时，脚本才可按相对位置自动找到仓库，此时可以省略 `--source`。

`--brand` 可选 `astra`、`deepseek`、`kimi`、`glm`。省略 `--title` 和 `--single-brand` 保留示例标题与切换栏。脚本只接受新目录或空目录，不覆盖已有项目；它导出所选本地仓库的当前文件，不要求 Git 历史。

```bash
cd /path/to/new-project
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm dev
```

生成项目保留同样的 TypeScript 分层：React 组件为 `.tsx`，页面逻辑和可读粒子核心为 `.ts`，有来源记录的底层实现位于 `src/particles/core/`。同时保留测试、依赖锁文件和来源说明，排除原仓库的 Git 数据、机器路径、依赖目录、构建产物和 Sites 适配。导出完成后，生成项目可以独立运行，不再依赖源仓库。首次安装依赖需要网络，运行粒子效果无需访问原始网站。

## 使用范围

仓库提供 Astra、DeepSeek、Kimi 和 GLM 四套示例。自己的 Logo 应优先提供 SVG；文字需要转为轮廓。不同设备的性能、光点和光晕细节可能不同。

导出的项目保留源码、字体和品牌图形的来源说明，当前没有统一开源许可证。具体范围见 [第三方来源](../../THIRD_PARTY_NOTICES.md) 和 [许可状态](../../LICENSE.md)。
