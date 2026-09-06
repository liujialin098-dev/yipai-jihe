# 内容流契约

## 输入

- 当前账号：衣着归属、风格、场景、城市位置。
- 当前账号活跃衣橱：类别、颜色、风格、季节。
- 当前有效天气：可用时参与排序，不可用时为空。
- 内容偏好：主题、个性化与未读开关。

## 输出

```ts
type FashionContentCard = {
  id: string;
  title: string;
  summary: string;
  topic: FashionTopic;
  publishedAt: string;
  validUntil: string;
  sourceName: "Vogue" | "GQ";
  summaryKind: "source-summary" | "reading-guide";
  originalTitle?: string;
  fetchedAt?: string;
  sourceUrl: string;
  reason: string;
  isRead: boolean;
};
```

## 不变量

- 只返回白名单来源；不使用日期未核实的编辑精选。
- `publishedAt` 必须来自来源，缓存刷新不得改写。
- URL 必须为 HTTPS 且主机属于来源白名单。
- 同一主题键 30 天内不重新投递另一条内容；当前批次先去重，再按账号首次展示记录过滤。有限规则不承诺识别所有自然语言同义主题。
- 原始摘要、图片、全文和模型内部字段不得返回浏览器。
- 关闭个性化时只按发布时间排序，不查询用户衣橱、日记或天气；关闭提醒时不返回未读提示，但保留阅读记录。
- `summaryKind=source-summary` 仅表示来源标题中文简述；`reading-guide` 明确不是新闻事实。
