# Data Model: 邮箱绑定与会话恢复

## 账号状态（读取模型，不新增表）

| 字段 | 含义 |
|---|---|
| `userId` | 稳定的 Supabase Auth 用户 ID |
| `isAnonymous` | 是否仍为匿名体验身份 |
| `email` | 仅在已绑定时返回给当前用户 |
| `emailMasked` | 页面展示用脱敏邮箱 |
| `providers` | 当前可用登录方式，用于判断是否已建立邮箱身份 |

## 状态流转

`anonymous` → `verification_sent` → `email_verified` → `password_ready`

- 前三步都使用同一 `userId`。
- 退出仅清除当前会话，不删除 Auth 用户或业务数据。
- 邮箱密码登录恢复同一 `userId` 后，现有 RLS 自动恢复数据访问。

## 现有关系

`auth.users.id` 继续一对一关联 `profiles.user_id`、`user_preferences.user_id`，并一对多关联 `wardrobe_items.user_id` 与 `wardrobe_ingestions.user_id`。本阶段无迁移。

