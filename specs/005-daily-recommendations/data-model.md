# Data Model: 每日 3 套 AI 推荐

## `public.daily_recommendations`

一行代表一个用户在一个自然日的完整推荐批次。

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | `uuid` | 主键，默认生成 |
| `user_id` | `uuid` | 必填，引用 `auth.users(id)`，用户删除时级联删除 |
| `recommendation_date` | `date` | 必填，按配置时区计算的自然日 |
| `occasion` | `text` | `commute/casual/date/formal` |
| `weather` | `jsonb` | 必填，保存经服务端校验的天气快照 |
| `outfits` | `jsonb` | 必填，必须是长度为 3 的数组 |
| `source` | `text` | `ai/rules` |
| `ai_model` | `text` | AI 成功时记录模型；规则结果为空 |
| `generation_ms` | `integer` | 0-15000 |
| `created_at` | `timestamptz` | 首次生成时间 |
| `updated_at` | `timestamptz` | 每次覆盖更新时间 |

### 唯一性与索引

- `unique (user_id, recommendation_date)` 保证同日只有一个批次，并支持客户端 upsert。
- 该唯一索引同时覆盖 RLS 与当日读取的首要过滤列，不增加重复索引。

### RLS

- `SELECT`: 仅 `(select auth.uid()) = user_id`。
- `INSERT`: 仅允许把 `user_id` 写为当前用户。
- `UPDATE`: `USING` 和 `WITH CHECK` 都要求当前用户所有权。
- `DELETE`: 仅当前用户。
- `anon` 无表权限；`authenticated` 有 `SELECT/INSERT/UPDATE/DELETE`，但始终受 RLS 限制。

## WeatherSnapshot

```text
city: 1-40 字符
temperatureC: -60 至 60
apparentTemperatureC: -60 至 60
weatherCode: 0-99
summary: 1-20 字符
source: live | simulated
observedAt: ISO 8601 时间
preset: live | mild | hot | cold | rainy
```

## RecommendationOutfit

```text
slot: 1 | 2 | 3
title: 1-30 个字符
reason: 1-140 个字符
styleTags: 1-3 个枚举风格
itemIds: 2-5 个 UUID
```

## 服务端状态转换

```text
无当日批次
  -> 生成中（仅 UI 瞬时状态）
  -> AI 结果通过校验 -> upsert source=ai
  -> AI 不可用/无效 -> 规则结果通过校验 -> upsert source=rules
  -> 衣橱不足 -> 不写入，返回可执行提示

已有当日批次
  -> 手动刷新/切换输入
  -> 生成完整新批次
  -> upsert 覆盖同一行
```

## 业务不变量

- 三套方案合计的 `itemIds` 不得重复。
- 每个 ID 必须在生成时属于当前用户且状态为 `active`。
- 每套必须为“连衣裙”或“上装 + 下装”，并包含鞋；外套和配饰可选。
- 冷天方案优先包含秋冬季衣物与外套；热天不得包含仅冬季衣物；雨天理由必须包含天气适配说明。
- AI 结果任一不变量失败时不保存，整批改用规则结果。
