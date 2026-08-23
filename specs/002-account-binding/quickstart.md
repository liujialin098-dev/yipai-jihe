# Quickstart: SDD-002 独立验收

1. 确认 Supabase Email Provider、Manual Linking、Site URL 与 Redirect URL 已配置。
2. 运行 `npm run check`、`npm run build`、`npm run verify:sdd-002`。
3. 新建匿名会话，记录设置页匿名编号并加载一件测试衣物。
4. 在设置页输入测试邮箱，打开验证邮件并回到设置页。
5. 设置至少 8 位密码，确认页面显示邮箱账号已受保护。
6. 退出，在登录页输入相同邮箱密码，确认匿名编号和测试衣物保持不变。
7. 用错误密码、失效链接和重复邮箱验证错误提示。
8. 在 390px 与桌面宽度检查页面、键盘焦点、减少动态效果与控制台。
9. 若邮箱已验证但当前域名没有账号会话，从 `/login` 展开“已绑定邮箱，但还没有密码？”，输入邮箱并打开一次性设置链接；确认回到设置页且未新建用户。

> 密码只在应用表单中输入，不得写入聊天、脚本、日志或仓库。

当前远端配置（2026-08-24）：Email、Confirm email、Anonymous Sign-Ins 与 Manual Linking 已开启；Site URL 为 `http://localhost:3000`，Redirect URL 已加入 `http://localhost:3000/**` 与 `https://*-jialin-d583.vercel.app/**`。真实邮箱、邮件链接和最终密码仍必须由验收者本人操作。

回归说明：账号属性使用 `auth.getUser()` 读取 Auth 服务端最新记录，避免邮箱验证完成后 JWT 仍带旧 `is_anonymous` 声明而重复显示绑定表单。已绑定但未设密码时必须直接显示密码设置步骤。
