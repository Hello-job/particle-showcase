# 维护与分发 Skill

`skills/particle-showcase/` 是受版本管理的轻量 Skill 源目录，只包含工作说明、参考和项目导出脚本。应用代码、示例和素材只在仓库根目录维护，不再同步到 `assets/starter/`。

```text
当前仓库的 src/ + public/ + 工程配置
            ↓ create_showcase.py --source ... --dest ...
独立 React + TypeScript 项目

skills/particle-showcase/（指南、参考、脚本）
            ↓ skill:check + test:skill
            ↓ skill:pack
deliverables/particle-showcase-skill.zip（不包含应用）
```

## 文件职责

| 路径                              | 用途                         |
| --------------------------------- | ---------------------------- |
| `SKILL.md`                        | 触发范围、工作流程与关键约束 |
| `agents/openai.yaml`              | Skill 界面名称与描述         |
| `references/engine-and-shapes.md` | 场景接口、DOM 钩子与形状接入 |
| `references/verification.md`      | 浏览器与行为验收清单         |
| `references/provenance.md`        | 引擎来源及素材说明           |
| `scripts/create_showcase.py`      | 从指定仓库向空目录导出项目   |

初始化器接受 `--source`、`--dest`、`--brand`、`--title` 与 `--single-brand`。`--source` 是已克隆或下载的仓库根目录，`--dest` 必须是新目录或空目录。只有脚本仍位于源仓库的 `skills/particle-showcase/scripts/` 中时，才允许省略 `--source` 并按相对位置定位；全局安装和独立解压后的脚本必须显式传入源仓库路径，不猜测其他项目或仓库 URL。

## 更新流程

先在主应用完成修改并通过检查。应用不需要另行同步；更新接入说明或导出规则时，检查 Skill 并重新打包：

```bash
pnpm skill:check
pnpm test:skill
pnpm skill:pack
```

`skill:check` 检查轻量包的必需文件、结构和便携性；导出脚本会在写入目标目录前检查源仓库所需文件。`test:skill` 单独运行初始化器测试；独立项目的安装、类型检查和构建仍需实际执行。`skill:pack` 只打包 Skill 文件，不将粒子引擎、品牌资源或示例项目放入 ZIP。

修改结构或公开接口时，同时更新 `SKILL.md`、引用文档和初始化器里的路径。修改导出规则后，用源仓库和安装目录中的脚本分别检查源路径解析，并在新目录实际生成项目。生成目录应保留 TypeScript 核心、测试、依赖锁文件和来源说明，能独立安装、类型检查和构建，且不包含原项目的个人路径、Git 历史、Sites 配置、构建产物或 `node_modules/`。

导出项目保留 `packageManager` 的 pnpm 版本约束，并逐字节复制 `pnpm-lock.yaml` 与 `pnpm-workspace.yaml`。pnpm 的根导入项是 `.`，项目改名不需要重写锁文件；不要重新解析或升级依赖。用 `pnpm install --frozen-lockfile` 验证锁文件与生成项目一致。

涉及形状或渲染的改动仍需打开生成页面检查桌面与窄屏。类型检查与文件导出成功并不能单独证明交互正确。记录实际检查过的首屏、底部、拖拽、重播与滚动行为。

最后刷新分发 ZIP。经授权维护 Skill 时，也应单独刷新维护者本机已安装的副本；打包命令不自动修改全局安装。不要把本机安装目录当作唯一来源。分发完整的轻量 Skill 文件夹，并明确说明创建项目还需一份独立提供的源仓库。

## 版本与来源

Skill 指南、导出规则与 ZIP 应在同一版本中更新。保留已有标签，包括 `readable-engine-v1`，不重写历史快照。首版记录位于 [verification-v1.md](verification-v1.md)，它只描述 JavaScript 首版的验证结果与当时的分发方式。

生成项目必须带上 `THIRD_PARTY_NOTICES.md`、`LICENSE.md` 与 renderer 来源记录。打包不改变第三方代码、字体和品牌资产的许可状态。
