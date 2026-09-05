# 验收要点

模板基准为 React 19.2、Three.js 0.180.0、postprocessing 6.39.4、Vite 6.4.2，应用与接入层使用严格 TypeScript。以随包 `package-lock.json` 为准执行 `npm ci`，不在初次复现时顺手升级。

先运行 `npm run typecheck`、`npm run lint`、`npm run format:check` 和 `npm run build`。应用代码新增功能应补充匹配的类型；保留在 `src/particles/vendor/astra/` 的提取渲染器是明确隔离的 JavaScript，不是已经全部迁移或逐行验证的 TypeScript。

## 可见结果

- 桌面约 1440 × 900、手机约 360 × 780：首屏完整，Logo 的孔洞、断开部件和宽高比例正确；最终图形不被裁切。
- 正向滚动经过模型标题、散开区、底部成形，反向滚动能回到首屏。Astra 额外经过中段光标。中段应有过渡，不应长时间空滚。
- 鼠标经过图形有扰动；拖拽有旋转，松开并离开窗口后不会继续处于按下状态；触屏纵向滑动仍能滚页。
- 聚焦透明交互按钮后方向键可以旋转；重播按钮能重启开场；Back to top 正常。提示文案是否可见不影响这些能力。
- 减少动态效果模式下是稳定场景。模拟 WebGL 不可用时进入 fallback，导航和可访问文本仍能使用；自定义品牌默认不显示实心 Logo 加载占位图。

通过实际截图或浏览器目视检查，不只读取配置。桌面浏览器窄窗口不等于真实手机触屏测试，交付时区分二者。

## 常见故障

| 现象             | 优先检查                                                                             |
| ---------------- | ------------------------------------------------------------------------------------ |
| 黑屏             | 控制台、`[data-astra-scene]` 是否 ready、WebGL、资源路径                             |
| 新 Logo 不出现   | registry.ts 有新 key（resolver 自动派生）；DOM cue 和配置一致；新 DOM 挂载后重建场景 |
| 字母孔洞消失     | filled 模式的复合路径及 fill-rule；不能把孔洞拆成独立正填充路径                      |
| 偏位或比例失真   | 紧凑的有效 viewBox、展开的 transform、SVG 实际尺寸                                   |
| 字母之间连线     | 轮廓模式下不连续子路径是否拆开                                                       |
| 填充有条带或闪跳 | 保留 filled-shapes 的独立区间、缓存和抖动                                            |
| 小屏光晕糊成一片 | 局部降低该形状 scatter/flare，调整宽度，不先改全局 shader                            |
| 新宽字标太窄     | 为新 key 增加 `.astra-shape-cue` 的 max-width 并适配手机                             |
| 滚动突然消失     | hero/content/cue 可测量且有高度，检查 cue 顺序及 keyframe opacity                    |
| 切换后重复运行   | 调用 scene.dispose；保持单实例；替换 cue 节点后重建监听                              |

构建可能报告较大 WebGL bundle，这不等于渲染失败。保留固定随机种子、DPR 限制、像素预算和减少动态效果的逻辑。

## Skill 维护检查

源仓库的 `npm run skill:sync` 生成 starter，`npm run skill:check` 比较主项目与 starter 的文件内容并拒绝构建产物、本机绝对路径和符号链接；`npm run skill:pack` 在检查通过后生成固定时间戳、固定文件顺序的 ZIP。它们不会静默更新本机安装。

运行 `python3 -m unittest discover -s tests -p "test_skill_initializer.py"` 验证生成器拒绝覆盖非空目录、拒绝模板内目录与符号链接、支持空目录和带空格的路径，并正确处理自定义标题中的 HTML 字符。发布前还需用真实 starter 在临时目录生成项目、安装依赖并完成构建和浏览器检查；这些脚本测试不替代粒子效果验收。
