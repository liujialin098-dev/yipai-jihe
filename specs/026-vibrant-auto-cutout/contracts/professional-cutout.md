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
- `force=false` 且已有有效 `cutout_path` 时必须复用，不调用百度智能云。
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

失败响应只返回可理解的中文说明，不返回百度响应正文、密钥、Access Token 或内部路径。

## 内部百度智能云合约

- Token Endpoint: `POST https://aip.baidubce.com/oauth/2.0/token`，以服务端 `BAIDU_API_KEY`、`BAIDU_SECRET_KEY` 获取 Access Token，并按 `expires_in` 提前 5 分钟失效缓存
- Cutout Endpoint: `POST https://aip.baidubce.com/rest/2.0/image-process/v1/segment?access_token=...`
- JSON: `image=<无 data URL 头的 Base64>`、`method=auto`、`refine_mask=true`、`return_form=rgba`
- Timeout: Token 与抠图请求合计 20 秒；Token 失效错误只允许刷新后重试一次
- 输入：当前账号私有原图，最大 10MB，只接受 JPEG/PNG/WebP；服务端规范化为最短边至少 128px、最长边不超过 3000px且 Base64 不超过 10MB
- 输出：HTTP 200 JSON 中包含有效 PNG Base64；解码后最大 20MB且必须具有真实透明通道
- 日志：不得记录 API Key、Secret Key、Access Token、图片字节、签名 URL、第三方响应正文或用户原始文件名

## 自动处理调用

确认入库成功后调用相同的内部服务，等价于 `{ force: false }`。该调用在响应后执行，不改变确认接口的成功结果。
