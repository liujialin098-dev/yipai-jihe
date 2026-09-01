# Contract: 专业衣物去背

## POST `/api/wardrobe/items/:id/cutout`

为当前登录账号的一件衣物生成或重新生成透明派生图。

### 请求

```json
{
  "force": false
}
```

- `id` 必须是 UUID。
- `force=false` 且已有有效 `cutout_path` 时必须复用，不调用 PhotoRoom。
- `force=true` 表示用户明确要求重新处理。

### 成功响应

```json
{
  "status": "created",
  "cutoutUrl": "signed-private-url",
  "message": "专业抠图已完成。"
}
```

`status` 也可为 `reused`。签名地址只短期有效，浏览器不得收到 Storage 物理路径或第三方服务信息。

### 可降级响应

- `400 invalid_request`：参数无效。
- `401 unauthorized`：会话失效。
- `404 not_found`：衣物不存在或不属于当前账号。
- `409 image_missing`：可信原图不存在。
- `503 cutout_unavailable`：未配置密钥、第三方超时/限额、结果无效或私有文件保存失败。

失败响应只返回可理解的中文说明，不返回 PhotoRoom 响应正文、密钥或内部路径。

## 内部 PhotoRoom 合约

- Endpoint: `POST https://sdk.photoroom.com/v1/segment`
- Header: `x-api-key`，仅来自服务端 `PHOTOROOM_API_KEY`
- Multipart: `image_file`、`format=png`、`channels=rgba`、`size=hd`、`crop=false`、`despill=true`；同尺寸结果供恢复画笔使用，展示图由服务端 Sharp 自动裁透明边
- Timeout: 20 秒
- 输入：当前账号私有原图，最大 10MB，只接受 JPEG/PNG/WebP
- 输出：HTTP 200、图片 MIME、有效 PNG 签名、最大 20MB
- 日志：不得记录密钥、图片字节、签名 URL、第三方响应正文或用户原始文件名

## 自动处理调用

确认入库成功后调用相同的内部服务，等价于 `{ force: false }`。该调用在响应后执行，不改变确认接口的成功结果。
