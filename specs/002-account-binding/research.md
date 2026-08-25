# Research: 邮箱绑定与会话恢复

## 决策 1：匿名账号无邮件原地升级

- **Decision**: 关闭 Supabase Confirm email，已登录匿名用户在一次服务端表单动作中先调用 `updateUser({ email })`，确认身份已立即转正后，再调用 `updateUser({ password })`。
- **Rationale**: Supabase 当前匿名账号文档明确要求邮箱身份先完成确认，再添加密码。关闭 Confirm email 后第一步应立即完成，第二步复用同一认证会话；继续更新当前匿名用户可保持用户 ID、RLS 归属和既有数据。
- **Alternatives rejected**: 新注册一个邮箱用户后搬迁数据会扩大权限、事务和失败回滚范围。

## 决策 2：旧 PKCE 回调只保留兼容

- **Decision**: 新流程不再生成邮件；`/auth/confirm` 仅保留旧链接兼容与安全失败处理，不作为注册或密码设置入口。
- **Rationale**: 已发出的旧链接可能仍被打开，保留白名单跳转可以安全收尾，且不影响无邮件的新流程。

## 决策 3：服务端动作处理凭据

- **Decision**: 绑定、设密码、登录和退出使用 Server Actions；每个动作独立验证输入与当前身份。
- **Rationale**: Next.js 16 官方文档要求把 Server Actions 当公开端点保护，且 `redirect` 必须位于 `try/catch` 之外。

## 决策 4：登录页跳过匿名引导

- **Decision**: 应用壳在 `/login` 与认证回调/错误页不自动建立匿名会话；用户必须主动选择“开始新的匿名体验”。
- **Rationale**: 否则退出后会立即创建新用户，造成登录恢复路径混乱。

## 决策 5：历史无密码账号仅本地恢复

- **Decision**: 使用 `SECRET_KEY` 和 `auth.admin.updateUserById` 的本地交互脚本设置一次密码，密码隐藏输入并要求输入 `SET` 确认。
- **Rationale**: Supabase 普通 `updateUser({ password })` 必须有原账号会话；原会话丢失时，无邮件方案只能使用管理员能力。把它限制在本机脚本可以避免创建公开的越权重置接口。

## 外部配置

- Supabase 必须启用 Email Provider、Anonymous Sign-Ins 与 Manual Linking，并关闭 Confirm email。
- Site URL/Redirect URL 保留生产评审域名和本地地址，仅兼容旧链接。
- `SECRET_KEY` 只配置在本地 `.env.local`，不得配置到 Vercel。
- 2026-08-25 检查 Supabase changelog，未发现影响托管项目邮箱密码注册、`signInWithPassword` 或 `updateUserById` 的相关破坏性变更。
