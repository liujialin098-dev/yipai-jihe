# Data Model: 今日与明日真实天气搭配

## 推荐目标日

| 字段 | 值 | 规则 |
|------|----|------|
| `targetDay` | `today \| tomorrow` | 仅作为页面与服务端动作输入，不写入新数据库列 |
| `targetDate` | `YYYY-MM-DD` | 按账号天气时区计算；明天为本地日历日期加一天 |

## 天气快照

复用现有 `daily_recommendations.weather` JSON 结构，不新增迁移。

| 字段 | 今日 | 明日 |
|------|------|------|
| `city` | 账号保存城市 | 同一账号保存城市 |
| `temperatureC` | 当前温度原始值取整 | 明日最低温度原始值取整 |
| `apparentTemperatureC` | 当前体感原始值取整 | 明日最低体感原始值取整 |
| `weatherCode` | 当前天气代码 | 明日日天气代码 |
| `summary` | 天气代码对应中文概况 | 天气代码对应中文概况 |
| `source` | `live` | `live` |
| `observedAt` | 实际获取时刻 | 实际获取时刻 |
| `preset` | `live` | `live` |

任何新生成天气快照必须为真实 `live`；旧 `simulated` 快照仍可被低层解析以兼容历史数据，但页面数据层不再将其作为当前有效方案返回。

## 每日推荐批次

现有唯一关系保持不变：

```text
unique(user_id, recommendation_date)
```

- 今日生成写入 `targetDate(today)`。
- 明日生成写入 `targetDate(tomorrow)`。
- 同一目标日期重复生成使用 upsert 覆盖。
- 两个目标日期不同，因此互不覆盖。
- 不新增表、不修改 RLS、不修改数据库授权。

## 状态转换

```text
选择目标日
  -> 读取对应日期批次
  -> 获取该目标日真实天气
      -> 失败：显示错误，不写入
      -> 成功：AI 或规则生成
          -> upsert 对应日期
          -> 刷新并展示对应日期
```

