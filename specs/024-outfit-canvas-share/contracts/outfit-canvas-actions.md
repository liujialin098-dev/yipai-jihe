# Contract: 穿搭画布界面与 Action

## 页面入口

### `GET /outfits/new?recommendationId=<uuid>&slot=<1|2|3>`

- 服务端从当前会话读取推荐和衣物，不接受客户端提供图片地址或 user_id。
- 成功：返回 2-8 件真实衣物、稳定初始变换、标题建议和主题默认值。
- 失败：返回推荐页可理解的错误状态，不创建空记录。

### `GET /outfits/<canvas-id>`

- 仅当前用户可读取。
- 返回已保存标题、主题、变换和当前有效衣物签名地址。

## `saveOutfitCanvas`

输入：

```text
{
  canvasId?: uuid,
  sourceRecommendationId?: uuid,
  sourceSlot?: 1 | 2 | 3,
  title: string,
  backgroundTheme: theme,
  items: CanvasItem[]
}
```

输出：

```text
{ ok: true, canvasId: uuid }
{ ok: false, message: string }
```

约束：Action 内重新鉴权和校验衣物归属；新建使用 insert，编辑只更新当前用户行；成功后刷新 `/outfits/<id>`、`/profile` 和当前推荐页。

## `saveWardrobeCutout`

输入：`wardrobeItemId`、`storagePath`。

约束：

- Action 从 Auth 派生 user_id。
- 路径必须精确匹配 `<user-id>/cutouts/<wardrobe-item-id>.png`。
- 衣物必须为当前用户所有。
- Action 只保存路径，不接收图片 Base64。

输出：成功返回当前抠图短期签名 URL；失败返回可重试信息，原图保持可用。

## 客户端分享

- `exportCard()` 返回 PNG Blob，宽 1080px、高 1350px。
- `navigator.share({ files })` 可用且 `navigator.canShare` 通过时调起系统分享。
- 其他情况创建临时下载链接，下载完成后释放 Object URL。
- 图片中不绘制邮箱、账号 ID、天气位置或私有路径。

