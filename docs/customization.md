# 定制自己的粒子展示

通常只需要改配置、形状和布局，不必深入着色器。先运行默认示例，确认当前浏览器能完成首屏和底部成形，再替换素材。

## 1. 修改品牌信息

编辑 `src/config/showcase.json`。顶层 `versions` 保存品牌条目，品牌配置决定名称、标题、页头资源、首屏形状和最终形状；`src/config/showcase.ts` 校验字段与形状标识，再交给页面使用。

| 配置                | 用途                             |
| ------------------- | -------------------------------- |
| `defaultVariant`    | 没有有效地址参数时显示的默认版本 |
| `showVersionSwitch` | 是否显示右上角版本切换           |
| `name`、`modelName` | 品牌名与中间标题                 |
| `logo`、`logoClass` | 本地页头资源与对应样式           |
| `url`               | 品牌外部地址                     |
| `hero`、`ending`    | 形状注册表中的首屏和底部标识     |
| `showcase`          | 简洁页脚，只显示 Back to top     |

以现有条目为模板保留完整结构。型号文案不会自动更新，修改品牌后同步检查 `index.html` 的初始标题与描述。页头 SVG 存放在 `public/assets/brands/`。

## 2. 准备 SVG

优先使用已有矢量 Logo。文字先转为路径；描边、基础图元、裁剪、遮罩与变换应展开为最终轮廓。仅有位图时，需要先获得适合的矢量轮廓，并记录是否经过近似描摹。

形状定义至少包含 `width`、`height` 和 `paths`，建议提供 `label`，让屏幕阅读器能读到有意义的名称。几何类型见 `src/particles/shapes/types.ts`。

- **轮廓模式**适合鲸鱼与线条字标：不连续的轮廓分别保存为独立路径，避免粒子在部件之间连线。
- **填充模式**适合较粗的字母与实体剪影：使用 `filled: true`；内部孔洞应与外部轮廓保留在同一个复合路径内，并保留正确绕向。
- **分离配色**参考 Kimi：独立蓝色部件通过 `accentPaths` 标记；现有引擎不是任意多色 SVG 渲染器。

若 SVG 使用非零 viewBox 起点、特殊填充规则或复杂变换，应先核对实际采样支持，不能只保证浏览器中的实心 SVG 看起来正确。

## 3. 注册形状

在 `src/particles/shapes/` 新增形状模块，注明来源及调整方式。参考 `brands.ts`、`deepseek.ts` 和 `deepseek-titlecase.ts` 的组织方式。

然后在 `registry.ts` 导入并加入 `shapeDefinitions`。导出的 `ASTRA_SHAPE_SVGS`、`ShapeId` 和 `resolveAstraPathShape` 共享这份注册信息，无需维护另一份形状白名单。把品牌配置的 `hero` 和 `ending` 指向这些标识。

粒子目标还需要存在于页面 DOM 中。复用 `components/showcase/` 的形状目标组件，确保 SVG 有尺寸、可测量，且已正确传递填充与配色属性。不要使用一张可见 PNG 叠在星空上替代真实成形。

## 4. 调整布局与节奏

`src/styles/showcase.css` 管理标题、形状区间和品牌展示布局，`particles.css` 管理固定背景及粒子相关样式，`global.css` 管理基础样式。

紧凑符号与宽字标需要不同的最大宽度。修改后同时检查桌面和窄屏，特别留意长标题、字母间距、Logo 内部留白与最终形状的完整度。

空滚动太长时，优先调整 `.constellation-interlude` 和标题底部间距。保持首屏、散开与最终形状的顺序；不要仅缩短页面总高度而裁掉最终成形空间。原始随机种子、粒子运动和光学参数位于 `src/particles/core/`，普通换 Logo 无需修改它们。

## 5. 验证和集成

运行类型检查、lint、测试和构建；再实际检查：

- 首屏没有实心 Logo 闪现，形状完整。
- 滚动能散开并聚成最终形状，返回顶部恢复首屏。
- 鼠标、拖拽、方向键和重播仍可用。
- 窄屏没有横向溢出，孔洞、分离部件与蓝色配色保留。
- 场景切换和卸载后没有重复画布、残留监听或控制台错误。

接入已有 React 页面时复用 `particles/` 与对应样式，使用 `ParticleBackground.tsx` 的生命周期做参考。保留现有路由和构建系统，初始化只在客户端执行。子目录部署时设置 Vite `base`。现有页头图形与 fallback poster 通过 `src/lib/assets.ts` 的 `assetUrl` 读取 `BASE_URL`，版本链接保留当前路径；新增公共资源也应使用该辅助函数，并在构建后检查字体和资源地址。

完整 DOM 钩子、采样约束和故障排查见 [Skill 引擎接入参考](../skills/particle-showcase/references/engine-and-shapes.md)。
