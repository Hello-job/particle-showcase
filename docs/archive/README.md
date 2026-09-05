# 历史参考与验证

此目录保存实现过程中的视觉验证，帮助定位效果变更。历史记录描述对应版本，不是当前代码的测试结果。

- [视觉验收记录](design-qa.md)：原始 Astra 复刻、品牌扩展、标题、切换栏与滚动间距。
- [参考图片](../reference/)：原站截图、选定概念图与本地浏览器截图。文件名保留，便于对照历史记录。
- [Skill v1 验证](../skill/verification-v1.md)：首版 JavaScript starter 的独立生成与浏览器验证。

## 保留的版本

| 标签 | 快照 |
| --- | --- |
| `astra-original-v1` | 原始完整 Astra 页面，提交 `3dd20cf` |
| `deepseek-v1` | 初版鲸鱼 / 光标 / 鲸鱼 |
| `deepseek-wordmark-v2` | 鲸鱼首屏与底部小写字标 |
| `two-brand-showcase-v1` | Astra / DeepSeek 简洁展示 |
| `kimi-glm-v1` | 四品牌扩展 |
| `model-titles-v1` | 模型名称与当时的交互提示 |
| `showcase-polish-v1` | 去提示、DeepSeek 大小写、统一切换栏 |
| `shorter-scroll-v1` | 缩短中段滚动留白 |
| `particle-showcase-skill-v1` | 首版可分发 Skill |

查看历史代码时可以从所需标签创建独立分支，保留当前工作目录的变更。现有标签不移动、不覆盖。
