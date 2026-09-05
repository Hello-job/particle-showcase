# 维护与分发 Skill

`skills/particle-showcase/` 是受版本管理的 Skill 源目录。工作流和接入说明手动维护，可运行 starter 从主应用自动同步，避免页面和模板各自演变。

```text
src/ + public/ + 工程配置
            ↓ skill:sync
skills/particle-showcase/assets/starter/
            ↓ skill:check
模板同步与便携性检查
            ↓ skill:pack
deliverables/particle-showcase-skill.zip
```

## 文件职责

| 路径                              | 用途                         |
| --------------------------------- | ---------------------------- |
| `SKILL.md`                        | 触发范围、工作流程与关键约束 |
| `agents/openai.yaml`              | Skill 界面名称与描述         |
| `references/engine-and-shapes.md` | 场景接口、DOM 钩子与形状接入 |
| `references/verification.md`      | 浏览器与行为验收清单         |
| `references/provenance.md`        | 模板来源及素材说明           |
| `scripts/create_showcase.py`      | 向空目录生成项目并应用配置   |
| `assets/starter/`                 | 从当前应用同步的独立模板     |

## 更新流程

先在主应用完成修改并通过检查，然后同步模板。不要把功能只改在 starter 中，下一次同步会覆盖它。

```bash
npm run skill:sync
npm run skill:check
npm run test:skill
npm run skill:pack
```

`skill:check` 核对 starter 是否与主应用一致，并检查包内是否包含本机路径或不应分发的内容。`test:skill` 单独运行初始化器测试；独立项目的安装、类型检查和构建仍需实际执行。

修改结构或公开接口时，同步更新 `SKILL.md`、引用文档和初始化器里的路径。检查生成目录可以独立安装、类型检查和构建，且不包含原项目的个人路径、Git 历史、托管配置或 `node_modules/`。

涉及形状或渲染的改动仍需打开生成页面检查桌面与窄屏。类型检查和模板文件相同，并不能单独证明交互正确。记录实际检查过的首屏、底部、拖拽、重播与滚动行为。

最后刷新分发 ZIP；维护者本机已安装的 Skill 副本也应与版本目录保持一致。不要把本机安装目录当作唯一来源。

## 版本与来源

Skill、starter 和 ZIP 应在同一版本中更新。保留已有标签，不重写历史快照。首版记录位于 [verification-v1.md](verification-v1.md)，它只描述 JavaScript 首版的验证结果。

生成项目必须带上 `THIRD_PARTY_NOTICES.md`、`LICENSE.md` 与 renderer 来源记录。打包不改变第三方代码、字体和品牌资产的许可状态。
