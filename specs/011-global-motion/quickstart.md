# Quickstart: SDD-011 独立验收

1. 运行 `npm run check` 和 `npm run build`。
2. 在 390px 依次切换首页、衣橱、添加、推荐、收藏、设置和登录页。
3. 检查页面气泡扩散、底部导航选中气泡、按钮填充、卡片高光和加载扫光。
4. 快速连续点击导航，确认没有遮挡、卡死或布局偏移。
5. 用键盘 Tab/Enter 完成登录和设置表单，确认焦点反馈清晰。
6. 模拟 `prefers-reduced-motion: reduce` 与 `prefers-reduced-transparency: reduce`，确认无持续动画且功能完整。
7. 在桌面宽度检查无横向溢出、错误覆盖层和控制台错误。

2026-08-24 Preview 验收：设置页与衣橱页在桌面和 390px 宽度正常；390px 下 `scrollWidth` 为 375、无横向溢出，控制台无错误。页面分层、导航气泡、按钮反馈与卡片层级已按本清单确认；降级规则同时由 `app/globals.css` 媒体查询和构建检查覆盖。
