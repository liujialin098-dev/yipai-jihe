# SDD-027 数据模型

## `public.user_preferences` 扩展

| 字段 | 类型 | 默认值 | 约束 |
|---|---|---|---|
| `fashion_topics` | `text[]` | 六类全部 | 数据库限制枚举与 1～6 项；服务端去重并拒绝非法主题 |
| `fashion_personalized` | `boolean` | `true` | 非空 |
| `fashion_unread_enabled` | `boolean` | `true` | 非空 |
| `fashion_last_prompted_at` | `timestamptz` | `null` | 最近一次站内提示时间 |

沿用原有当前账号 SELECT/INSERT/UPDATE RLS。

## `public.fashion_content_reads`

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | `uuid` | 关联 `auth.users(id)`，级联删除 |
| `content_id` | `text` | 由规范化来源 URL 得到的稳定 ID，8～96 字符 |
| `read_at` | `timestamptz` | 已读时间 |
| `created_at` | `timestamptz` | 首次记录时间 |

- 主键：`(user_id, content_id)`，天然保证幂等。
- RLS：当前用户可读、新增、更新、删除自己的记录；`anon` 角色无表权限，匿名体验用户通过 `authenticated` + `auth.uid()` 隔离。
- 索引：主键已以 `user_id` 开头，无需重复索引。

## `public.fashion_topic_impressions`

- 字段：`user_id`、`topic_key`、`content_id`、`first_seen_at`；主键为 `(user_id, topic_key)`。
- CRUD 均由当前用户 RLS 隔离；`anon` 无权限。
- `record_fashion_impression(topic_key, content_id)` 使用调用者身份，无用户 ID 参数。首次插入或超过 30 天才替换，重复展示不会改变时间；仅在新增有效提示且提醒开启时更新 `fashion_last_prompted_at`。
- Server Action 接收内容 ID，重新鉴权并从服务端白名单内容派生主题键；浏览器不能指定来源、主题键或他人账号。

## 非持久化内容实体

`FashionContentItem` 包含 `id/title/originalTitle/summary/summaryKind/topic/styles/occasions/publishedAt/validUntil/fetchedAt/sourceName/sourceUrl/topicFingerprint`。来源时间不随转写而变化；不返回来源 description、抓取响应或模型原始输出。

## 状态变化

1. 未读 → 已读：对 `(user_id, content_id)` upsert。
2. 已读 → 未读：删除当前账号对应记录。
3. 修改内容偏好：只更新当前账号 `user_preferences` 的四个内容字段。
4. 关闭未读提示：不删除阅读历史，重新开启后状态仍可恢复。
