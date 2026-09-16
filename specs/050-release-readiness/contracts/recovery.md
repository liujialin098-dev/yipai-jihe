# 邮箱数字验证码恢复

- requestRecoveryCode：仅用户提交触发；关闭时零网络调用。校验email后resetPasswordForEmail，不设置跳转URL。账号不存在与存在都返回同一不确认账户存在的文案；供应商异常只返回固定消息，无原始错误。
- resetPasswordWithCode：关闭时零网络调用；校验email/token/password/confirmPassword，再verifyOtp({email,token,type:"recovery"})；验证有效会话、两个用户ID一致、邮箱一致且非匿名后updateUser。无需管理员权限，禁止使用客户端ID或资料标志授权。
- 成功改密尝试signOut(global)，已有JWT可能持续到过期；清理失败仍报告密码成功并明确会话状态未确认。异常更新结果不确定时不得保证未修改。
- 浏览器原账号不被替换；如果它就是恢复账号，会话可能随后失效。体验用户不会因恢复另一个账号而自动丢掉当前会话；切换由用户主动登录完成。
- 数字码发送模板、SMTP/限制、验证码失效与复用、真实账号退出重登须由独立测试账号验证后方可启用。不在本轮发送真实邮件。
