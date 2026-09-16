# 实施研究（2026-09-14）

## 用户确认后的邮箱数字码恢复

Context7已核实Supabase恢复、verifyOtp、会话撤销和Storage删除规则。官方[verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)支持email/token与recovery类型；邮件须使用 `{{ .Token }}` 而不是登录链接。不能使用signInWithOtp替代，以免引入注册或不同类型验证码。

[2026-06-03邮件模板变更](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier)：新建免费项目使用默认发信服务时不允许自定义模板；旧项目、付费方案或自定义SMTP例外。本项目实际模板/SMTP尚未核实，不假定Outlook联系邮箱已具备应用发信能力。因此恢复功能默认关闭，并将实际发送/限流/码长/有效期作为启用门禁。

用户已接受数字码恢复与立即开始注销。删除账号前需清理Storage；auth删除和退出不等于已发JWT立即失效，需数据库封锁和并发/重试设计。暂不把管理密钥加入应用或执行任何注销。

## 决策：原密码验证不依赖资料标志或后台开关

理由：user_metadata 是用户可编辑字段，不能决定是否跳过原密码。当前 JS SDK 支持 current_password，但服务端策略是否开启尚未确认。因此独立公开密钥客户端 signInWithPassword，核对同一 UUID，再通过该验证会话更新；旧会话只用于确定目标账号。

替代方案：只传 current_password（依赖生产策略，暂不单独采用）；管理员 reset（不允许远程接口）；恢复邮件（需用户确认，后续阶段）；从资料标志判断首次设密（不安全）。

参考：[Supabase密码安全](https://supabase.com/docs/guides/auth/password-security)、[updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser)、本地 SDK UserAttributes.current_password。已通过 Context7 /supabase/supabase 查询并与本地版本核对。

更新日志检查：[Supabase changelog](https://supabase.com/changelog)。与本轮有关的安全通知可由平台另行发送，不能承诺绝无任何邮件；本轮不调用 reauthenticate/resetPasswordForEmail、不改邮件配置。自托管 API_EXTERNAL_URL、管理日志、OIDC 的变化不涉及本轮托管密码请求。临时客户端禁用持久化、URL会话检测与自动刷新，只清理 local 会话。

## 决策：注册与遗留账号分开

新注册保持无确认链接。体验注册将邮箱/密码/展示标志放在一个 updateUser 请求里；不替换 UUID。既有无密码邮箱账号不允许靠会话直接新设密码，本地历史恢复脚本保留但不执行。恢复方式需另行确认，不发布不可用的“忘记密码”按钮。

## 决策：隐私资料先做内部核实，不发布伪完整协议

运营主体、支持邮箱、境外接收方合同、地域、保留期均未确认。数据地图记录“代码能证明什么”和“后台/合同还需证明什么”，不杜撰法律结论。

上架依据：[苹果账号删除](https://developer.apple.com/support/offering-account-deletion-in-your-app/)、[隐私申报](https://developer.apple.com/app-store/app-privacy-details/)、[中国大陆APP信息](https://developer.apple.com/cn/help/app-store-connect/reference/app-information/app-information)、[工信部备案说明](https://www.miit.gov.cn/zwgk/zcjd/art/2023/art_39b4f1acc36745b98478e0ec3e07128d.html)、[生成合成标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)、[应用调用已备案模型登记说明](https://www.cac.gov.cn/2025-09/10/c_1759222982377536.htm)。这些是核实入口，不代表本项目已取得许可或完成法律审查。

## 决策：增量表单复用品牌，不重新设计页面

沿用现有设置页、语义色与圆润输入框；UI/UX技能用于就近错误、焦点、等待与减少动态检查。Next.js本地安全文档要求每个Action重新授权，不能只依赖页面显隐；重定向和缓存失效放在捕获认证异常之外。
