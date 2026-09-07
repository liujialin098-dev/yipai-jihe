# Contract: 单件衣物贴纸生成 API

## Endpoint

`POST /api/stickers/items/{itemId}`

## Request

- 路径参数必须是 UUID。
- 不接收请求体，不接收 userId、Storage 路径或图片 URL。
- 必须来自同源页面并携带有效 Supabase 会话。

## Success response

```json
{
  "status": "created",
  "cutoutUrl": "short-lived-signed-url"
}
```

`status` 可为 `created` 或 `reused`。响应必须使用 `Cache-Control: private, no-store`。

## Failure response

```json
{
  "error": "cutout_unavailable"
}
```

- `400`：非法衣物 ID。
- `401`：无有效会话。
- `403`：跨站请求。
- `404`：衣物不存在、不属于当前用户或不是活跃状态。
- `422`：原图缺失或图片无效。
- `503`：第三方去背或私有存储暂时不可用。

响应不得包含密钥、内部异常、用户 ID、私有路径或第三方原始响应。
