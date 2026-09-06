# 参与贡献

欢迎改进代码可读性、类型约束、可访问性、性能与使用说明。报告问题时，请提供复现步骤、浏览器和设备信息、所选模式，以及有帮助的截图或控制台错误。

## 本地开发

使用 Node.js 22.12+ 与 npm。在独立分支工作，并保留已有 Git 标签。

```bash
npm ci
npm run dev
```

提交前执行：

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

用 `npm run format` 统一格式。涉及 Sites 适配时，另执行 `npm run build:sites` 和 `npm run test:sites`。

## 修改边界

- React 组件写在 `.tsx` 中，普通逻辑和数据类型写在 `.ts` 中；为组件边界、配置和形状数据提供明确类型。
- 先在配置、形状或布局层解决问题；只有确认问题来自渲染器时才修改 `src/particles/core/`。
- 新增 SVG 应注明来源和处理方式，保留孔洞、分离部件与必要配色。不要把定制字标描述为官方图形。
- 保留鼠标、拖拽、方向键、滚动、重播、场景释放与减少动态效果处理。
- 不提交 `node_modules/`、构建产物、临时文件、个人路径或凭据。参考截图归入 `docs/reference/`，说明其用途。

类型检查和构建不能替代视觉检查。影响布局、采样或交互的改动，应在桌面和窄屏检查首屏、最终形状、滚动衔接及相关交互；说明实际测试范围。

## 维护 Skill

应用代码与资源只保存在仓库根目录。`skills/particle-showcase/` 只维护指南、参考和项目导出脚本；不要在 Skill 中新增一份应用示例或素材副本。

```bash
npm run skill:check
npm run test:skill
npm run skill:pack
```

Skill 文案位于 `skills/particle-showcase/SKILL.md` 与其 `references/`，初始化器位于 `skills/particle-showcase/scripts/create_showcase.py`。它通过 `--source` 从本地仓库向新目录或空目录导出项目；修改导出规则后，应实际验证生成项目能独立安装、检查和构建。检查与打包流程见 [Skill 开发说明](docs/skill/development.md)。

## 提交说明

Pull Request 描述应交代具体问题、修改后的行为和验证方式。视觉改动附前后截图；引擎改动说明为什么无法在上层解决。避免把无关的重构和效果调整放在同一次提交。

贡献内容应有准确的来源记录。项目当前没有统一开源许可证，请先阅读 [LICENSE.md](LICENSE.md) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；不要随提交为不属于自己的素材添加许可声明。
