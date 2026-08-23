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

## `requestEmailBinding`

- 输入：`email`
- 前置：当前会话存在且为匿名身份
- 成功：发送验证邮件，不创建新业务用户
- 失败：无效/占用/限流/网络分别映射为中文提示

## `setAccountPassword`

- 输入：`password`、`confirmPassword`
- 前置：当前会话存在、邮箱已验证、账号不再匿名
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

