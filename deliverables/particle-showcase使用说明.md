# 粒子星光展示 Skill

把 `particle-showcase-skill.zip` 发给对方即可。压缩包包含完整 Skill、可运行的页面模板、粒子引擎、四种示例形状，以及自定义 Logo 的接入说明；不要只发送 SKILL.md。

## 安装到 Codex

将压缩包中的整个 `particle-showcase` 文件夹放入自己的 `~/.codex/skills/`，如果设置了 CODEX_HOME，则放入该目录下的 `skills/`。最终应能找到 `skills/particle-showcase/SKILL.md`。重新打开任务后调用 `$particle-showcase`。

也可以把压缩包交给对方的 Codex，说：“请把这个完整 Skill 安装到我的技能目录，并用它创建页面。”

## 直接这样说

```text
使用 $particle-showcase，创建一个和示例一样的 DeepSeek 粒子展示页。
保留鼠标扰动、拖拽旋转、滚动变形和重播，打开本地预览。
```

换成自己的品牌时，最好同时提供 SVG Logo：

```text
使用 $particle-showcase，把首屏粒子换成我提供的 SVG Logo，
底部聚成 ORION 字样。黑色背景，只保留左上角 Logo，
不要版本切换，中间标题写 Orion One。
```

也可要求接入已有 React 页面。Skill 会指引 Agent 合并必要组件，而不是覆盖原项目。

## 包含什么

- Astra 螺旋 / 光标 / 结形、DeepSeek 鲸鱼 / 字标、Kimi 标志 / 字标、GLM / Z.ai。
- 完整 WebGL 粒子引擎及鼠标、拖拽、方向键、滚动、重播、减少动态效果处理。
- 可配置默认版本、标题、页签显示和自定义形状的独立 Vite 模板。
- Logo 孔洞、独立部件、轮廓与填充采样的处理说明，以及故障排查。

新建脚本需要 Python 3.9+；页面需要 Node.js 20.19.x 或 22.12+、npm，以及支持 WebGL 的浏览器。首次安装依赖需要网络；运行粒子效果无需访问原网站。不同设备的性能与光点细节可能不同。

模板保留源码和素材来源说明。自定义字标、官方品牌图形与原页面移植代码在包内分别注明，不将所有内容宣称为原创或统一开源授权。
