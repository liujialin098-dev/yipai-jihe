# Phase 1 数据模型：应用框架与匿名数据底座

## 关系概览

```text
auth.users (1)
├── (0..1) public.profiles
├── (0..1) public.user_preferences
└── (0..n) storage.objects in wardrobe-images/<user-id>/...
```

匿名用户和后续绑定邮箱后的用户使用同一个 `auth.users.id`。绑定行为不会新建业务资料，也不改变现有业务数据归属。

## 实体：profiles

| 字段 | 类型 | 约束 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `user_id` | UUID | 主键；引用 `auth.users.id`；级联删除 | 无 | 唯一用户归属 |
| `display_name` | TEXT | 必填；1～40 个字符 | `新朋友` | 应用内展示名称 |
| `onboarding_state` | TEXT | 必填；仅 `empty_wardrobe` 或 `ready` | `empty_wardrobe` | 当前引导状态 |
| `created_at` | TIMESTAMPTZ | 必填 | 当前时间 | 建立时间 |
| `updated_at` | TIMESTAMPTZ | 必填 | 当前时间 | 最近更新时间 |

### 规则

- 每个 Auth 用户最多一条资料。
- 初次初始化可重复执行，但只能覆盖当前用户自己的记录。
- 本阶段界面不提供名称或引导状态编辑；字段为后续阶段预留当前已知用途，不增加通用配置结构。

## 实体：user_preferences

| 字段 | 类型 | 约束 | 默认值 | 用途 |
| --- | --- | --- | --- | --- |
| `user_id` | UUID | 主键；引用 `auth.users.id`；级联删除 | 无 | 唯一用户归属 |
| `preferred_styles` | TEXT[] | 必填 | `['简约', '休闲']` | 推荐偏好的初始风格 |
| `preferred_occasions` | TEXT[] | 必填 | `['日常', '通勤']` | 推荐偏好的初始场景 |
| `created_at` | TIMESTAMPTZ | 必填 | 当前时间 | 建立时间 |
| `updated_at` | TIMESTAMPTZ | 必填 | 当前时间 | 最近更新时间 |

### 规则

- 每个 Auth 用户最多一条偏好。
- 默认数组不得为 `NULL`；本阶段不提供偏好编辑页面。
- 后续推荐阶段可以读取这些明确字段，不需要解析未约束的任意 JSON。

## 实体：wardrobe-images 私有对象

| 属性 | 规则 |
| --- | --- |
| bucket | 固定为私有 `wardrobe-images` |
| 对象路径 | `<当前用户 UUID>/<业务子目录或文件名>` |
| 所有者判定 | 对象路径第一段必须等于当前 `auth.uid()` |
| 允许角色 | 已认证用户，包括 Supabase 匿名用户 |
| 允许动作 | 仅对自身路径读取、写入、更新、删除 |
| 本阶段数据 | 不上传真实图片；只验证错误路径被拒绝 |

## 访问控制矩阵

| 资源 | 未登录 | 当前用户自己的记录/路径 | 其他用户记录/路径 |
| --- | --- | --- | --- |
| `profiles` 读取 | 拒绝 | 允许 | 拒绝/空结果 |
| `profiles` 插入/更新 | 拒绝 | 允许 | 拒绝 |
| `user_preferences` 读取 | 拒绝 | 允许 | 拒绝/空结果 |
| `user_preferences` 插入/更新 | 拒绝 | 允许 | 拒绝 |
| 私有对象读取/写入/更新/删除 | 拒绝 | 允许 | 拒绝 |

## 状态变化

```text
无会话
  → 匿名身份已建立
  → profiles 已初始化 + user_preferences 已初始化
  → 应用就绪（empty_wardrobe）

任何初始化步骤失败
  → 可重试错误
  → 对同一 user_id 再次幂等初始化
  → 应用就绪
```

本阶段不包含从匿名身份到邮箱身份的状态变化；该变化归 SDD-002。
