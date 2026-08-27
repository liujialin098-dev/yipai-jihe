# Data Model: 推荐页城市切换与连续入库

## 入库批次队列（浏览器临时状态）

沿用 `QueueItem[]`，不新增持久化实体。

| 字段 | 作用 |
|------|------|
| `localId` | 当前浏览器批次内稳定标识 |
| `previewUrl` | 本地对象 URL，批次重置时必须释放 |
| `status` | 从选择、上传、识别到确认入库的状态 |
| `ingestionId` | 服务端入库生命周期记录 |
| `wardrobeItemId` | 成功确认后的衣橱记录 ID |

状态规则：

- 满批完成条件为队列长度恰好 10，且 10 项状态均为 `confirmed`。
- 满批重置只把浏览器队列恢复为空并释放 10 个对象 URL。
- 重置不得调用入库删除接口，不得修改 `wardrobe_items` 或 Storage 对象。

## 账号天气城市（既有 `user_preferences`）

沿用以下成组字段：

| 字段 | 规则 |
|------|------|
| `weather_city` | 规范中国城市名 |
| `weather_admin1` | 省级行政区 |
| `weather_latitude` | -90 至 90 |
| `weather_longitude` | -180 至 180 |
| `weather_timezone` | IANA 时区 |
| `updated_at` | 保存时间 |

城市解析成功后五元组一次更新；失败时全部保留原值。写入行必须满足 `user_id = auth.uid()`。

## 天气推荐批次（既有 `daily_recommendations`）

- 城市切换成功后，删除当前用户的今天和明天既有批次。
- 下一次生成从新城市坐标读取真实 Open-Meteo 天气。
- 不修改历史收藏快照，不生成模拟天气，不新增城市历史列表。
