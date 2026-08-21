# 数据模型：原图上传与 AI 识别入库

## `public.wardrobe_ingestions`

一行表示当前用户选择的一张待入库原图。确认前最长保留 24 小时，确认后保留最小验收信息，不再作为临时原图。

| 字段 | 类型 | 约束/用途 |
|---|---|---|
| `id` | uuid | 主键，服务端生成 |
| `user_id` | uuid | `auth.users.id`，删除用户时级联 |
| `client_request_id` | uuid | 客户端稳定标识；同用户唯一 |
| `image_path` | text | `${userId}/ingestions/${id}.jpg|jpeg|png`，全局唯一 |
| `mime_type` | text | 仅 `image/jpeg`、`image/png` |
| `byte_size` | bigint | 1 至 10,485,760 |
| `status` | text | `uploading/uploaded/recognizing/recognized/failed/manual/confirmed` |
| `ai_result` | jsonb? | 通过共享守卫的结构化建议 |
| `ai_model` | text? | 实际模型名，不保存密钥 |
| `recognition_ms` | integer? | 本次识别耗时 |
| `failure_code` | text? | 稳定失败类别 |
| `corrected_fields` | text[] | 用户最终修改过的字段名 |
| `wardrobe_item_id` | uuid? | 确认后的正式单品 id |
| `expires_at` | timestamptz | 默认创建后 24 小时 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 状态更新时间 |

### 约束与索引

- `unique (user_id, client_request_id)`：重复创建返回同一项目。
- `unique (image_path)`：一个对象只属于一个入库项目。
- `(user_id, status, expires_at)`：恢复工作区和清理过期项目。
- 图片路径首段必须等于 `user_id`，第二段必须为 `ingestions`。
- `ai_result` 仅在 `recognized` 或 `confirmed` 时允许存在。
- RLS 的 SELECT/INSERT/UPDATE/DELETE 都要求 `(select auth.uid()) = user_id`。
- 显式撤销 `anon` 权限，只授予 `authenticated` 必需 CRUD。

## `public.wardrobe_items` 变更

新增：

| 字段 | 类型 | 约束/用途 |
|---|---|---|
| `source_ingestion_id` | uuid? | 真实上传来源；演示数据为空 |

新增唯一索引：`unique (user_id, source_ingestion_id)`。Postgres 允许多条空值，因此演示数据不受影响。

不建立外键：确认后临时处理记录可独立清理或保留最小验收数据，不影响正式衣物生命周期。

## 识别结果 JSON

```json
{
  "name": "米色针织上衣",
  "category": "tops",
  "primary_color": "beige",
  "material": "knit",
  "style": "minimal",
  "seasons": ["spring", "autumn"],
  "occasions": ["commute", "casual"],
  "confidence": "medium",
  "note": "背景较复杂，请核对材质"
}
```

业务字段必须通过现有枚举校验；`confidence` 仅为 `low/medium/high`；`note` 最多 120 字。

## 状态转换

```text
uploading → uploaded → recognizing → recognized → confirmed
                         └──────────→ failed → recognizing
                                      └──────→ manual → confirmed
```

- 任何未确认状态到期后都不可继续读取、识别或确认。
- 失败可重试或进入手工填写。
- 确认是终态；重复确认返回同一 `wardrobe_item_id`。
- 取消不保留业务行：先删除 Storage 对象，再删除入库项目。
