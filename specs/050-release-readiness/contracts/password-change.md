# 改密与注册契约

## setAccountPassword(previousState, formData)

- 方法：既有同源Server Action，仅用户提交触发。
- 入参：currentPassword、password、confirmPassword；不接收目标email/userId。
- 身份：getUser确认非匿名、有邮箱的当前用户；独立公开密钥认证客户端验证原密码，返回用户ID必须相同且存在会话。
- 写入：在验证客户端调用updateUser({password,current_password,data:{account_password_configured:true}})。绝不调用admin、service_role或自定义任意用户reset。
- 错误：参数、凭据、限流、需要额外验证、安全清理等只显示固定文案；更新期间断网说明可能尚未确认结果。
- 成功：不返回用户记录或session；提示新密码已保存，如需重新登录使用新密码。临时验证会话清理失败不反转成功结果。
- UI：设置“账号安全 → 修改密码”，原密码current-password、新密码new-password；48px以上提交；密码粘贴与管理器不拦截。

## registerCurrentAccount

无会话：保持signUp(email,password)与session成功门禁。
体验会话：单次updateUser同时传入email/password/展示标志；不得使用不同账号返回值初始化或重定向为成功。失败不删除或搬迁用户衣物。
正式会话：注册入口不作为改密入口，保持原重定向行为。

## 安全限制

新应用入口保证原密码校验，但Supabase公开Auth API仍由平台策略决定。上架前应核实require current password、认证限流、会话策略和恢复流程。未经用户确认不自动修改这些生产配置。
