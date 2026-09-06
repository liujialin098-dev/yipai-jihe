# SDD-029 实施计划

复杂度 S～M，一段 AI Coding 对话。独立于 SDD-028 未完成的手机联网与线上配置验收，不改变其实现。

沿用 Next.js Server Component 页面、React 客户端资料编辑、Tailwind/CSS token、lucide。无新依赖、无迁移、无接口变化。遵守章程的中文文档、最小实现、隐私边界和静态质量门禁。

1. `app/profile/page.tsx` 重排身份、横排统计、作品标题和现有入口。
2. `components/profile/profile-editor.tsx` 增加默认只读摘要和可展开编辑；原上传及保存逻辑保持不变。
3. `components/outfits/outfit-canvas-preview.tsx` 可选隐藏内嵌标题，仅个人主页传入；其他预览与分享不变。
4. `app/globals.css` 使用浅丁香到冷白的低对比渐变，保留局部纯色封面、细线统计与作品区样式，复用四色和六级文字 token。动效为轻微淡入/按压，不引入运动库。本轮同时精简推荐/画布重复说明，保留重要错误、来源和隐私提示。
5. 静态门禁与移动/桌面浏览器验收，更新 progress.md 和 AGENTS.md。

设计参数：保持型改版，变化度 5、动效 3、密度 4。冷白和炭黑承担阅读，丁香紫封面、青柠主操作、珊瑚/天空蓝留给原内容主题。不改正式 Logo，不套用营销落地页结构。
