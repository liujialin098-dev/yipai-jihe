# Data Model: 换一件、收藏与偏好反馈

## `public.wardrobe_item_favorites`

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | uuid | 主键，默认生成 |
| `user_id` | uuid | 必填，引用 `auth.users`，删除级联 |
| `wardrobe_item_id` | uuid | 必填，引用 `wardrobe_items`，删除级联 |
| `created_at` | timestamptz | 必填 |

- 唯一约束 `(user_id, wardrobe_item_id)` 保证幂等。
- 插入时除 RLS 外，服务端必须确认衣物属于当前用户。

## `public.outfit_favorites`

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `user_id` | uuid | 必填，引用 `auth.users` |
| `source_key` | text | 必填，推荐 ID + 版本 + slot 的稳定键 |
| `title` | text | 必填 |
| `occasion` | text | 四种场合枚举 |
| `weather` | jsonb | 收藏时天气快照 |
| `outfit` | jsonb | 标题、理由、风格和衣物快照 |
| `created_at` | timestamptz | 必填 |

- 唯一约束 `(user_id, source_key)`。
- 快照衣物只包含当前用户在收藏时可见的 ID、名称和安全图片引用。

## `public.preference_feedback_events`

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `user_id` | uuid | 必填，引用 `auth.users` |
| `event_key` | text | 必填，幂等键 |
| `event_type` | text | `questionnaire/view/replace/favorite_item/unfavorite_item/favorite_outfit/unfavorite_outfit` |
| `style` | text | 可空，六种风格之一 |
| `weight` | numeric(6,2) | -10 到 10 |
| `recommendation_id` | uuid | 可空，不建立跨快照强依赖 |
| `outfit_slot` | smallint | 可空，1～3 |
| `wardrobe_item_id` | uuid | 可空 |
| `metadata` | jsonb | 必填对象，默认 `{}` |
| `created_at` | timestamptz | 必填 |

- 唯一约束 `(user_id, event_key)` 支持重复提交幂等。
- 事件不可由客户端直接指定其他用户；所有权 RLS 覆盖 CRUD。

## 扩展 `public.user_preferences`

| 新字段 | 类型 | 默认值 |
| --- | --- | --- |
| `preference_state` | text | `pending`，可为 `pending/completed/skipped` |
| `style_scores` | jsonb | `{}` |
| `preference_focus` | text | `versatile`，可为 `comfort/versatile/refined` |

- `preferred_styles` 继续保存按分数排序的前 3 项，供推荐生成直接使用。
- `preferred_occasions` 保存问卷选择；跳过时使用稳定默认值。

## RLS

- 三张新表均启用 RLS，只允许 `authenticated` 对 `user_id = auth.uid()` 的记录执行对应 CRUD。
- `anon` 表角色无权限；匿名登录用户进入 Supabase 后使用 `authenticated` 角色，仍受 `auth.uid()` 限制。
