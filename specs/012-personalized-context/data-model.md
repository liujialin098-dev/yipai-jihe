# Data Model: 账号城市与衣着偏好

## user_preferences 扩展

| 字段 | 类型 | 规则 |
|------|------|------|
| `clothing_preference` | text | 非空，默认 `unrestricted`，只允许 `male/female/unrestricted` |
| `weather_city` | text nullable | 规范城市名，1-80 字符；未设置为 null |
| `weather_admin1` | text nullable | 省级行政区，用于界面确认，最长 80 字符 |
| `weather_latitude` | double precision nullable | -90 至 90；与经度、城市、时区成组出现 |
| `weather_longitude` | double precision nullable | -180 至 180；与纬度、城市、时区成组出现 |
| `weather_timezone` | text nullable | IANA 时区，最长 80 字符；与城市和坐标成组出现 |

### 一致性规则

- 未设置位置时，上述五个天气字段全部为 null。
- 已设置位置时，上述五个天气字段全部非 null。
- 新增列继续受现有 `user_preferences` 当前用户 SELECT/INSERT/UPDATE RLS 保护。
- 偏好保存后更新 `updated_at`，并让当前账号已有当日推荐失效。

## wardrobe_items 扩展

| 字段 | 类型 | 规则 |
|------|------|------|
| `audience` | text | 非空，默认 `unisex`，只允许 `male/female/unisex` |

### 迁移与生命周期

- 既有非演示衣物和无法判断归属的衣物回填 `unisex`。
- `black-evening-dress`、`lavender-knit-dress`、`navy-shirt-dress`、`blush-date-dress` 回填 `female`。
- 新演示数据按目录元数据写入归属。
- 新上传衣物由 AI 给出归属，用户可在确认和编辑表单中修正。
- 切换账号衣着偏好只改变查询结果，不改变衣物状态，不删除、不归档。

## 过滤关系

```text
user_preferences.clothing_preference
  unrestricted -> male + female + unisex
  male         -> male + unisex
  female       -> female + unisex
```

衣橱列表、首页预览、计数、推荐候选必须调用同一匹配函数，避免页面之间出现不同结果。

## 天气快照

既有 `daily_recommendations.weather` JSON 结构保持兼容。新快照中的 `city` 来自账号保存城市；`source` 仍为 `live | simulated`。位置变更后旧批次删除并重新生成，不原地篡改历史天气快照。
