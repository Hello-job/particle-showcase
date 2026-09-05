---
name: particle-showcase
description: 创建或改造 Astra 风格的 WebGL 星光粒子展示页，支持 Logo 或文字成形、鼠标扰动、拖拽旋转、滚动散开与聚合、重播。用户提到粒子官网、星空 Logo、交互粒子背景、品牌粒子变形或复用 Astra / DeepSeek / Kimi / GLM 效果时使用；普通静态页面或图片生成不需要此 Skill。
---

# Particle Showcase

复用随包提供的 React + TypeScript / TSX 项目，让用户得到真实交互粒子页面。模板包含 Astra、DeepSeek、Kimi、GLM 四个示例，也支持用户自己的 SVG 或文字轮廓。应用、组件与接入代码使用 TypeScript；提取的第三方渲染器保留在 `src/particles/vendor/astra/`，通过类型边界调用。来源见 [素材与源码来源](references/provenance.md)，不要把整个引擎称为原创。

## 新建展示页

先确定目标目录和用户要的形状。信息足够时直接执行；未指定品牌时可使用默认 DeepSeek 示例作为起点。

使用本 Skill 实际所在位置解析以下相对路径，不依赖原作者的工作目录：

```bash
python3 /absolute/path/to/particle-showcase/scripts/create_showcase.py \
  --dest /absolute/path/to/new-project --brand deepseek
```

脚本需要 Python 3.9+，生成的项目需要 Node.js 20.19.x 或 22.12+ 和 npm。它只向新目录或空目录复制模板，不覆盖已有项目。可选 `--title "My Model"` 修改所选示例的标题，`--single-brand` 隐藏右上角版本切换。

在生成目录中执行 `npm ci`、`npm run typecheck`、`npm run lint` 和 `npm run build`，然后自行启动本地预览并打开页面。优先用可用端口，不抢占用户正在运行的服务。运行时图形、字体和粒子素材都在本地；首次安装 npm 依赖需要网络。

## 接入已有页面

阅读 [引擎与形状接入](references/engine-and-shapes.md)。复用 `assets/starter/src/particles/`、配套样式与 SVG 锚点组件，按现有项目结构接入 DOM 锚点与资源。不要把整套模板覆盖到已有应用，不要替换用户的路由、包配置或部署方式。已有项目依赖冲突时先检查兼容性，不强行安装或升级。

引擎默认是浏览器端、单实例、固定全屏背景，不能直接作为多个互不干扰的卡片使用。SSR 项目应在客户端挂载。子目录部署时设置 Vite 的 `base`；新增公共资源通过 `src/lib/assets.ts` 的 `assetUrl` 解析。现有 Logo、poster 已使用该方法，版本链接会保留当前子目录。

## 选择要改的层

- 页面组装：`src/app/App.tsx`；页头、首屏、形状锚点与控制按钮：`src/components/showcase/`。延续小组件边界，避免把整个展示页塞回单一组件。
- 文案、默认版本、页头品牌资源：`src/config/showcase.json`，由 `src/config/showcase.ts` 提供类型化配置；后续修改品牌时也同步 `index.html` 的初始标题与描述。模板的型号名称是 2026-09-06 的示例快照；只有用户要求“最新”时才查官方来源更新。
- 首屏与底部形状：阅读 [引擎与形状接入](references/engine-and-shapes.md)，注册 SVG 几何并接到 `hero` / `ending`。优先用用户提供的矢量文件；只有位图时可追踪，但需说明轮廓是近似的。
- 密度、星光、交互或动画节奏：从 `src/particles/ParticleBackground.tsx` 的局部配置与滚动 cue 入手，再按需查看 `engine/profile.ts` 和 `vendor/astra/` 的默认配置。
- 空滚动或留白：优先调整 `src/styles/` 的区间高度与标题间距，验证前后成形顺序。模板使用 20svh 中段留白及桌面 64px / 手机 40px 标题底部间距；这些是起始参数，可按用户目标调整。

保留形状采样、随机种子、着色器和粒子运动算法，除非用户明确要改它们或问题确实在该层。重新随机摆点、改成普通散点或用视频替代会改变这个效果。

## 关键约束

- SVG 锚点必须在 DOM 中、有尺寸且可测量；用透明度隐藏，不能 `display: none`。
- 新形状在 `src/particles/shapes/registry.ts` 注册；`ShapeId` 类型与 `resolveAstraPathShape` 自动沿用注册表，配置中使用相同的 key。
- 轮廓粒子应拆开不连续的子路径，避免字母间连线；填充粒子的孔洞要保留在同一个复合路径内。两种采样不能用同一种拆分策略。
- 转成填充粒子前先展开 SVG 的变换、描边及基础图元；文字先转路径。不要把 SVG 文本或带有变换的路径直接当成已归一化轮廓。
- 保留场景释放、鼠标/触摸退出、键盘旋转、减少动态效果和 WebGL 失败处理。不要因隐藏提示文案而删除交互。
- 根据用户要求保留或调整页面内容。示例的纯展示布局、四个页签、具体品牌和字体不是所有项目都必须采用的规则。
- 新写的应用与形状接入使用 TypeScript，保留严格类型检查。不要用批量重命名或 `@ts-nocheck` 把第三方 JavaScript 伪装成已经迁移的 TypeScript。

## 验证与交付

使用 [验收要点](references/verification.md) 检查实际渲染。至少验证一次桌面与窄屏的首屏、滚动到最终形状，以及鼠标、拖拽、重播是否可用；验证不能只停在构建通过。

修改已有作品时保留可回退版本，不移动原有标签。最后给用户预览入口、已完成的效果和实测范围；浏览器或 WebGL 不可用时直说未实测的部分。相同代码在不同 GPU、屏幕比例和像素比下仍会有差异，不承诺任意设备上逐像素 100% 一致。

在维护本 Skill 的源码仓库时，先改主项目，再用 `npm run skill:sync` 生成 `assets/starter`，以 `npm run skill:check` 检测偏差，最后执行 `npm run skill:pack` 更新分发 ZIP。不要在模板里独立维护第二套应用。同步与打包不会修改本机已安装的 Skill；需要更新安装时显式复制已验证的完整 Skill 文件夹。
