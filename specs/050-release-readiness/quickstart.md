# 验证指南

## 邮箱验证码恢复增量（2026-09-14）

本地安全测试：`npm run verify:account-recovery`。不加载.env，不发送邮件，供应商全为固定假体，先观察缺少实现失败再实现。覆盖默认关闭/严格开关、格式校验、账号存在性一致回复、固定recovery类型、同账号与邮箱、清理失败、更新结果未知及Action操作白名单。

UI：`node scripts/verify-recovery-ui.mjs`，使用SDD050_PLAYWRIGHT_PACKAGE指定已安装Playwright。真实RecoveryForm、SupportPage、PrivacyPage、RecoverPage及SessionBootstrap；替换Action、Link/导航适配和品牌加载依赖，只允许本机网络。375px浅/深、844×390深色20px、320px浅色24px通过错误聚焦/字段跳转、邮箱保留、秘密输入清空、等待/倒计时、错误后倒计时继续、成功及公开页面不跳转；横向溢出及浏览器error均0。人工查看浅色帮助与深色错误截图。未模拟真实Supabase会话、邮件送达或iPhone系统键盘。

新页面直接复用外层路由动效，不挂旧page-enter装饰，避免伪元素导致横向溢出；没有改动全局皮肤。

启用前必须完成（本轮未做）：

1. 核实实际认证项目的SMTP和密码恢复邮件模板。模板正文使用数字 `{{ .Token }}`，不放ConfirmationURL/TokenHash链接。不能把支持邮箱当成已配置SMTP。
2. 核实验证码长度（前端兼容6～10位）、失效期、尝试限流与发信限流；需要CAPTCHA时先完整接入，而不是关闭供应商保护。页面60秒倒计时仅防误触，不代替服务端限流。
3. 在非生产隔离账号验证不存在邮箱的响应一致、正常收件、失效/重复验证码拒绝、旧密码失败/新密码登录同UUID且衣物保留。核实后台原密码强制策略不妨碍安全恢复。
4. 验证恢复同账号与恢复另一个账号时浏览器会话不被替换；成功global退出后旧JWT仍需按实际期限处理。`/login?recovery=complete`仅显示登录表单，不提供身份权限。
5. 只有以上通过才显式设置服务端ACCOUNT_EMAIL_RECOVERY_ENABLED=true。当前未设置、未发信、未更改生产配置、未部署。

## 无真实账号、无网络验证

1. `node --no-warnings scripts/verify-sdd-050.mjs`：执行假体认证与实际Action集成回归。不得读取.env或创建生产账号。
2. `npm run check`、`npm run build`。
3. `node --no-warnings scripts/verify-sdd-042.mjs`、`node --no-warnings scripts/verify-sdd-030.mjs`：品牌与必要文案回归。

## 用户参与的真实验收（本阶段不能自动勾选）

2026-09-14本地证据：050固定测试、027离线、030、042与来源故障测试全部通过；最终check无警告、build生成29个路由成功。`scripts/verify-sdd-050-ui.mjs`使用真实PasswordChangeForm和假体Action，375px浅/深色、844×390深色20px字号、320px浅色24px字号均通过错误焦点、错误字段跳转、等待禁用、成功清空、44px操作区、无横向溢出与无浏览器error检查。已人工查看浅色错误态与深色成功态。

本机agent-browser不可用，使用已安装Chrome及独立Playwright执行等价隔离验证；运行时通过`SDD050_PLAYWRIGHT_PACKAGE`指定本机Playwright路径，未新增项目依赖。样本与测试脚本已排除部署；全部输入为假体，无认证网络请求。以上不代表真实改密、iOS系统字号或线上业务验收。

使用用户同意的隔离账号，用户自己输入密码，不在聊天/日志中发送。

1. 注册新账号并创建一件安全示例衣物；体验账号升级后UUID、衣物不变。
2. 设置 → 修改密码，错误原密码被拒绝；正确原密码成功。
3. 退出后旧密码失败，新密码可登录且衣物不变。
4. 多设备会话、认证限流、供应商安全通知、过期会话分别验证，不承诺JWT即时撤销。
5. 历史无密码账号只检查提示，不自动重置。
6. iPhone小屏/横屏、系统最大字、减少动态、日夜皮肤；错误焦点、等待禁用、成功清空、粘贴/密码管理器。

## 发布门禁

见 release-gates.md，状态只维护于progress.md；本阶段完成不代表完成国内App Store上架。主体、隐私联系邮箱、删除保留期、账号恢复路线未确认前不发布正式隐私协议或删除能力。
