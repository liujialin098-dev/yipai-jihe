# State Contract

```json
{
  "version": 2,
  "savedAt": "ISO-8601",
  "themeId": "paper",
  "items": [
    {
      "wardrobeItemId": "uuid",
      "x": 0.5,
      "y": 0.5,
      "scale": 1,
      "rotation": 0,
      "zIndex": 1,
      "crop": {
        "top": 0,
        "right": 0,
        "bottom": 0,
        "left": 0
      }
    }
  ]
}
```

## Invariants

- `wardrobeItemId` 必须属于当前账号可见衣物集合。
- `x/y/scale/rotation/zIndex` 继续使用现有服务端校验边界。
- 裁切遵循 `data-model.md` 的四边范围与对边总和限制。
- 导出、预览和重新载入必须使用同一状态。
