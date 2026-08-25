# Contract: 账号动作与确认回调

## Server Action 结果

所有表单动作返回：

```ts
type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: { email?: string; password?: string; confirmPassword?: string };
};
```

## `registerCurrentAccount`

- 输入：`email`、`password`、`confirmPassword`
- 前置：当前会话存在且为匿名身份
- 成功：单次表单提交内先原地链接邮箱，再在同一有效会话设置密码；不发送邮件、不创建新业务用户
- 失败：无效/占用/弱密码/限流/网络分别映射为中文提示；若项目仍要求邮件确认则明确阻止误报成功

## `setAccountPassword`

- 输入：`password`、`confirmPassword`
- 前置：当前会话存在、邮箱已绑定、账号不再匿名
- 成功：更新密码并刷新设置页

## `signInWithEmail`

- 输入：`email`、`password`
- 成功：建立 SSR Cookie 会话并跳转首页
- 失败：统一提示邮箱或密码不正确

## `signOut`

- 前置：当前会话存在
- 成功：清除本浏览器会话并跳转 `/login?status=signed-out`

## `GET /auth/confirm`

- 输入：`token_hash`、`type`、可选 `next`
- `next` 只允许 `/settings` 或 `/login`，其他值回退 `/settings`
- 成功：校验 OTP、写入会话并跳转 `/settings?binding=verified`
- 失败：跳转 `/login?error=invalid-link`
- 仅兼容变更前已发送的旧链接，新流程不得调用

## `npm run account:set-password-local`

- 输入：本地交互式输入已绑定邮箱、两次密码和最终 `SET` 确认
- 前置：`.env.local` 已配置真实 `SECRET_KEY`，且只在开发者本机运行
- 成功：通过 `auth.admin.updateUserById` 为目标账号设置密码和完成标记
- 安全边界：密码不从命令参数/管道读取、不回显、不写日志；不得建立 Web Route 或部署密钥
