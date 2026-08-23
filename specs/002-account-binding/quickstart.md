# Quickstart: SDD-002 独立验收

1. 确认 Supabase Email Provider、Manual Linking、Site URL 与 Redirect URL 已配置。
2. 运行 `npm run check`、`npm run build`、`npm run verify:sdd-002`。
3. 新建匿名会话，记录设置页匿名编号并加载一件测试衣物。
4. 在设置页输入测试邮箱，打开验证邮件并回到设置页。
5. 设置至少 8 位密码，确认页面显示邮箱账号已受保护。
6. 退出，在登录页输入相同邮箱密码，确认匿名编号和测试衣物保持不变。
7. 用错误密码、失效链接和重复邮箱验证错误提示。
8. 在 390px 与桌面宽度检查页面、键盘焦点、减少动态效果与控制台。

> 密码只在应用表单中输入，不得写入聊天、脚本、日志或仓库。

