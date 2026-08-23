# Research: 邮箱绑定与会话恢复

## 决策 1：匿名账号原地升级

- **Decision**: 已登录匿名用户调用邮箱更新，完成邮件验证后再设置密码。
- **Rationale**: Supabase 官方匿名登录文档明确支持把邮箱身份链接到当前匿名用户；验证完成会清除匿名标记并保持用户 ID，因此 RLS 归属和既有数据自然保持。
- **Alternatives rejected**: 新注册一个邮箱用户后搬迁数据会扩大权限、事务和失败回滚范围。

## 决策 2：PKCE 服务端确认

- **Decision**: 使用 `/auth/confirm` Route Handler 校验 `token_hash` 与邮件类型，并只允许站内目标路径。
- **Rationale**: 符合 Supabase SSR 官方模式，Cookie 在 Route Handler 响应中安全写入；白名单路径避免开放重定向。

## 决策 3：服务端动作处理凭据

- **Decision**: 绑定、设密码、登录和退出使用 Server Actions；每个动作独立验证输入与当前身份。
- **Rationale**: Next.js 16 官方文档要求把 Server Actions 当公开端点保护，且 `redirect` 必须位于 `try/catch` 之外。

## 决策 4：登录页跳过匿名引导

- **Decision**: 应用壳在 `/login` 与认证回调/错误页不自动建立匿名会话；用户必须主动选择“开始新的匿名体验”。
- **Rationale**: 否则退出后会立即创建新用户，造成登录恢复路径混乱。

## 外部配置

- Supabase 必须启用 Email Provider 与 Manual Linking。
- Site URL/Redirect URL 必须包含生产评审域名和本地地址。
- 默认 SMTP 仅适合受控验收；正式公开上线前应配置自有 SMTP。

