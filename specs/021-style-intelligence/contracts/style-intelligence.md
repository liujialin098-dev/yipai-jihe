# 契约

## 视觉识别结果

原有字段保持不变，新增：

```json
{
  "brand": "清晰可见的品牌；否则为空字符串",
  "brand_confidence": "unknown | low | medium | high"
}
```

- `brand` 最长 40 字符。
- `brand_confidence=unknown` 时 `brand` 必须为空。
- 浏览器必须允许修改品牌，最终确认值才进入衣橱。

## 推荐表单输入

```text
targetDay = today | tomorrow
occasion = commute | casual | date | formal
styleFocus = auto | <14 个稳定风格之一>
```

服务端必须重新验证风格与场景兼容性。无效输入返回可理解错误，不调用天气或模型。

## 推荐输出

每套：`slot`、`title`、`reason`、`stylingPoint`、`styleTags`、`itemIds`。三套必须继续通过现有归属、天气、季节、完整性、场景、跨套不重复与雨天复验。

