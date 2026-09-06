# 架构与数据流

页面配置决定展示哪个品牌，React 负责可访问的页面和交互控件，场景协调器把实际布局转换为粒子目标，渲染器在固定画布上绘制星点。

```text
config/showcase.json
        ↓
app/App.tsx + components/showcase/
        ↓ 可测量的 SVG、滚动锚点、交互按钮
particles/ParticleBackground.tsx
        ↓ 创建、重播、刷新、释放
particles/engine/ ── particles/shapes/
        ↓ 配置、输入与几何
particles/core/
        ↓
Three.js + postprocessing → WebGL canvas
```

## 各层职责

| 目录                       | 职责                                     | 常见修改                        |
| -------------------------- | ---------------------------------------- | ------------------------------- |
| `src/app/`                 | 组合页面、选择当前模式                   | 页面内容与模式逻辑              |
| `src/components/showcase/` | 页头、SVG 目标、拖拽和重播控件           | UI、可访问名称、展示结构        |
| `src/config/`              | 品牌配置与数据类型                       | 标题、Logo 资源、首屏和底部形状 |
| `src/particles/engine/`    | 浏览器生命周期、DOM 测量、滚动和输入协调 | 宿主页面接入、场景管理          |
| `src/particles/shapes/`    | 几何数据、形状注册、填充采样             | 新增 Logo、文字轮廓与蓝色部件   |
| `src/particles/core/`      | 可读 TS 数学、状态、着色器与后处理       | 阅读或调整底层算法              |
| `src/styles/`              | 全局基础、展示布局与背景样式             | 字体、间距、响应式布局          |

## TypeScript 核心

React 组件使用 `.tsx`，配置、协调器、采样、动画和渲染使用严格检查的 `.ts`。`core/` 使用标准 ES 模块，不再通过数字编号加载原网站的编译工厂；配置、粒子场和动画状态都有结构类型。外部页面从 `particles/engine/index.ts` 获取公开接口。

通用 SVG 解析使用固定版本 Three.js 自带的 SVGLoader。着色器仍使用 GPU 执行的 GLSL 源码，这是 WebGL 的语言要求。粒子生成、运动和光学参数保留来源，命名和模块结构经过重新整理；原作者在编译中丢失的类型、注释与命名不能自动恢复。

底层阅读顺序和来源对应关系见 [core 阅读指南](../src/particles/core/README.md)。旧编译实现保存在 `typescript-showcase-v1`，用于回归比较和回退，不在当前应用与 Skill 内重复携带。

## 场景生命周期

`ParticleBackground.tsx` 在浏览器完成 DOM 挂载后创建场景，监听准备完成和失败状态，在卸载或切换形状时释放旧场景。`createAstraScene` 返回准备状态、重播、刷新和释放能力；具体契约由 `AstraSceneOptions` 与 `AstraSceneHandle` 描述。

滚动计算依赖真正的 DOM 尺寸。透明 SVG 提供粒子目标，透明且可聚焦的按钮接收拖拽和方向键；背景画布本身不拦截页面交互。标题、最后一个形状与页脚必须包含在内容测量范围内。

目标 SVG 可以使用 `opacity: 0` 隐藏，但不能使用 `display: none`、隐藏属性或零尺寸，否则采样与布局测量会失效。页面上的实心页头 Logo 与这些不可见目标是不同元素。

## 形状与滚动

`particles/shapes/registry.ts` 保存形状注册表与解析入口。轮廓形状沿 SVG 路径分配粒子；填充形状通过缓存的扫描线采样内部区域，保留字母孔洞和分离部件。不同模式使用不同的 SVG 目标，共享同一套场景生命周期与交互。

自定义品牌通常依次展示首屏形状、模型标题、散开区和最终形状；Astra 额外包含中间光标。中段留白为 `20svh`，标题底部间距为桌面 `64px`、窄屏 `40px`。调节滚动节奏时先修改布局，避免无意改变运动参数。

## Skill 与构建

应用代码、素材与工程配置只保存在仓库根目录。`skills/particle-showcase/` 包含工作指南、参考和创建脚本，不再保存 `assets/starter/` 副本。在本仓库使用 Skill 时直接修改 `src/` 与 `public/`；创建独立项目时，初始化器从指定的本地仓库导出所需文件。

`npm run skill:check` 检查轻量包结构和便携性，`test:skill` 验证初始化器，`skill:pack` 生成仅含 Skill 文件的分发包。安装或解压后的 Skill 需要通过 `--source` 获取已克隆或下载的仓库；只有脚本位于源仓库内的标准 Skill 路径时，才能自动定位仓库。导出的项目保留 TypeScript 核心、测试、依赖锁文件与来源说明，不携带机器路径、Git 历史或 Sites 适配。导出规则与使用方式见 [Skill 开发说明](skill/development.md)。

普通 Vite 构建输出到 `dist/`。Sites 构建是独立适配，保留原有 worker 和构建整理脚本，不要求普通使用者采用同一托管平台。

## 当前范围

引擎默认用于一个页面上的单个固定全屏场景。多个并行卡片需要先隔离查询选择器与事件；SSR 宿主应仅在客户端创建场景。不同 GPU、浏览器和像素比可能影响光晕与性能，参考截图用于视觉比较，不构成所有设备逐像素一致的承诺。
