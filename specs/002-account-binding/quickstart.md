# Quickstart: SDD-002 独立验收

1. 确认 Supabase Email Provider、Manual Linking 与 Anonymous Sign-Ins 已开启，并关闭 Confirm email。
2. 运行 `npm run check`、`npm run build`、`npm run verify:sdd-002`。
3. 新建匿名会话，记录设置页匿名编号并加载一件测试衣物。
4. 从主页点击“注册账号”，在设置页一次输入测试邮箱、至少 8 位密码和二次确认；不得收到或打开验证邮件。
5. 确认页面立即显示邮箱账号已受保护。
6. 退出，在登录页输入相同邮箱密码，确认匿名编号和测试衣物保持不变。
7. 用错误密码和重复邮箱验证错误提示，并确认不会发送验证邮件。
8. 在 390px 与桌面宽度检查页面、键盘焦点、减少动态效果与控制台。
9. 对历史遗留的“已绑定但无密码”账号，仅在本地终端运行 `npm run account:set-password-local`。用户本人隐藏输入密码并输入 `SET` 后，再回到 `/login` 验收；不得把密码发到聊天或写入命令参数。

> 密码只在应用表单中输入，不得写入聊天、脚本、日志或仓库。

目标远端配置（待共同切换）：Email、Anonymous Sign-Ins 与 Manual Linking 开启，Confirm email 关闭；Site URL 与 Redirect URL 继续保留旧链接兼容。真实邮箱和最终密码仍必须由验收者本人操作。

回归说明：账号属性使用 `auth.getUser()` 读取 Auth 服务端最新记录，避免 JWT 旧 `is_anonymous` 声明导致重复显示注册表单。已绑定且当前会话有效但未设密码时直接显示密码设置步骤。
