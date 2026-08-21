# 入库 API 契约

所有接口都要求有效匿名或已认证会话；服务端每次用 `auth.getClaims()` 获取当前用户。错误响应只返回稳定错误码和用户可理解消息，不返回 Storage 内部路径、OpenAI 原始响应或密钥。

## `POST /api/wardrobe/ingestions`

创建或恢复入库项目，并返回仅能上传指定对象的 signed token。

请求：

```json
{
  "clientRequestId": "uuid",
  "mimeType": "image/jpeg",
  "byteSize": 2450123
}
```

成功 `201`（已存在时 `200`）：

```json
{
  "ingestionId": "uuid",
  "path": "user-id/ingestions/ingestion-id.jpg",
  "token": "signed-upload-token",
  "expiresAt": "2026-08-22T10:00:00.000Z"
}
```

错误：`400 invalid_file`、`401 unauthorized`、`409 already_confirmed`、`500 storage_sign_failed`。

## `POST /api/wardrobe/ingestions/{id}/recognize`

确认对象已上传后进行真实 AI 识别。服务端把状态设置为 `recognizing`，调用 OpenAI 后写入结果。

成功 `200`：

```json
{
  "ingestionId": "uuid",
  "status": "recognized",
  "result": {
    "name": "米色针织上衣",
    "category": "tops",
    "primary_color": "beige",
    "material": "knit",
    "style": "minimal",
    "seasons": ["spring", "autumn"],
    "occasions": ["commute", "casual"],
    "confidence": "medium",
    "note": "请核对材质"
  },
  "recognitionMs": 3810
}
```

可恢复错误：`409 image_missing`、`410 expired`、`422 invalid_result`、`424 ai_not_configured`、`429 rate_limited`、`504 timeout`、`502 provider_error`。这些错误不得删除原图，项目转为 `failed`。

## `POST /api/wardrobe/ingestions/{id}/confirm`

把人工核对后的最终字段写入正式衣橱。允许从 `recognized`、`failed` 或 `manual` 状态确认。

请求字段为 `name/category/primary_color/material/style/seasons/occasions`，与现有衣物编辑表单完全一致。

成功 `200`（首次或重试一致）：

```json
{
  "wardrobeItemId": "uuid",
  "status": "confirmed"
}
```

错误：`400 invalid_fields`、`401 unauthorized`、`404 not_found`、`410 expired`、`409 image_missing`、`500 save_failed`。

## `DELETE /api/wardrobe/ingestions/{id}`

取消未确认项目。先用 Storage API 删除原图，再删除数据库行。成功返回 `204`；已不存在也返回 `204`。已确认项目返回 `409 already_confirmed`，正式衣物必须使用现有衣橱删除流程。

## 并发与重试规则

- 客户端最多同时发起 3 个识别请求。
- 创建和确认都以稳定 id 幂等。
- 识别失败不自动无限重试；用户可逐项触发重试。
- OpenAI 服务端请求 12 秒中止，前端最晚 15 秒展示可重试状态。
