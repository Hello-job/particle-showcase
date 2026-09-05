# TypeScript 重构验收

验收日期：2026-09-06。基线为 `particle-showcase-skill-v1`（`40b853d`），重构分支为 `refactor/typescript-showcase`。本次调整工程组织、类型边界、文档和 Skill 模板，保留现有四套视觉与交互。

## 自动检查

| 检查                   | 结果                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `npm run typecheck`    | 严格 TypeScript 检查通过                                       |
| `npm run lint`         | 通过，零警告                                                   |
| `npm run format:check` | 通过                                                           |
| `npm test`             | 4 项配置与形状注册行为测试通过                                 |
| `npm run test:skill`   | 7 项初始化器测试通过，包括已有目录保护、自定义标题和单品牌配置 |
| `npm run build`        | 普通 Vite 构建通过，生成 `dist/index.html`                     |
| `npm run build:sites`  | 可选 Sites 构建通过，生成 client、server 和 hosting 配置       |
| `npm run test:sites`   | 4 项已有 Worker 测试通过                                       |
| `npm run skill:check`  | 独立模板与维护源码一致，便携性检查通过                         |
| Skill 校验与打包       | 元数据校验、ZIP CRC、重复打包一致性通过                        |

独立初始化一个单 Kimi 品牌、标题为 `Particle Studio` 的项目，在仓库外完成依赖安装、类型检查、Lint、格式检查、4 项测试与生产构建。其生产预览成功呈现 Kimi 首屏与 KIMI 底部字标，隐藏品牌切换栏，标题按配置显示。

## 渲染实现保真

- 九个保留的渲染、几何、动画、默认配置模块与重构前逐字节一致。
- 八套注册形状数据与重构前深度比较一致。
- 设备配置覆盖七组档位输入及两种 reduced-motion 设置，比较结果一致。
- DOM 协调器和填充采样器迁移为严格 TypeScript；复核未发现数学参数、滚动 cue、指针事件或销毁逻辑的行为改动。
- `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 与 `tests/sites-worker.test.mjs` 保持原文件内容。

## 浏览器回归

在内置浏览器以 1440 × 900 桌面视口和 360 × 780 窄屏视口检查；窄屏模拟不等同于实体手机验收。

| 模式     | 桌面检查                                         | 窄屏检查                           |
| -------- | ------------------------------------------------ | ---------------------------------- |
| Astra    | 螺旋首屏、滚动光标、最终 OpenAI 结形，方向键输入 | 首屏、两侧标题与切换栏             |
| DeepSeek | 鲸鱼首屏、底部 `DeepSeek` 大小写与轮廓           | 首屏、底部字标、切换栏，无横向溢出 |
| Kimi     | K 与蓝色水滴、拖动、重播散开、底部 KIMI          | 首屏、底部 KIMI 与切换栏           |
| GLM      | GLM 首屏、底部三段 Z.ai 图形                     | 首屏、底部图形与切换栏             |

桌面切换栏每项宽度为 94.5px，360px 窄屏时每项为 52px。四个版本使用同一套控件。标题与已批准文案一致，未恢复交互提示或导航菜单。

本轮记录截图：

- [Kimi 桌面首屏](images/typescript-kimi-desktop.jpg)
- [DeepSeek 窄屏底部](images/typescript-deepseek-mobile.jpg)
- [Skill 独立项目底部](images/typescript-skill-standalone.jpg)

## 分发一致性与范围

Skill 源目录、ZIP 与本机安装目录中的 75 个文件逐一校验一致，旧版安装已另行备份。最终 ZIP 的 SHA-256 为：

```text
b644d57e3f7c9bf739a096d171244b584f767923602e899529bef8af46a2b398
```

这次没有进行实体手机、跨浏览器、WebGL 故障注入或帧率基准测试。构建仍提示 WebGL 主包较大；本次没有拆分或改写渲染器来消除此提示。新增 CI 工作流已覆盖上述自动检查，但尚未在远程 GitHub Actions 执行。素材来源与统一许可状态见 [第三方说明](../../THIRD_PARTY_NOTICES.md)和 [LICENSE.md](../../LICENSE.md)。
