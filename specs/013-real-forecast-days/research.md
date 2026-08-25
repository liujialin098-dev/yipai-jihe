# Research: 今日与明日真实天气搭配

## 天气数据范围

- **Decision**: 请求 Open-Meteo `/v1/forecast` 的 `current` 当前温度、体感温度、天气代码，以及 `daily` 的天气代码、最高/最低温度、最高/最低体感温度和最大降水概率；`forecast_days=2` 且使用账号 IANA 时区。
- **Rationale**: 官方 Forecast API 支持在同一响应中返回当前值和按本地自然日聚合的日预报，日数组包含 ISO 日期，可精确寻找明日。
- **Alternatives considered**: 分两次请求会增加延迟和两个响应不一致的风险；只取 hourly 需要自行选择代表时刻；固定测试天气不满足用户真实性要求。
- **Source**: Context7 `/websites/open-meteo_en`，对应 [Open-Meteo Forecast API](https://open-meteo.com/en/docs)。

## 今日与明日温度语义

- **Decision**: 今天保存当前温度与当前体感温度；明天保存日预报返回的最低温度与最低体感温度，天气概况使用该日天气代码。
- **Rationale**: 两类值均为接口原始字段，不做随机或隐式默认；明日穿搭以最低体感作为保守厚薄依据，降低早晚穿着过薄风险。
- **Alternatives considered**: 最高最低平均值是二次推导且不够直观；只用最高温可能忽略早晚低温；添加完整温度范围会扩大历史天气 JSON 契约，本阶段不必要。

## 失败策略

- **Decision**: 位置缺失、HTTP 失败、超时、目标日期缺失、字段缺失或数值异常均抛出明确天气错误，并在 Server Action 中停止写入。
- **Rationale**: 用户明确禁止虚构天气。旧的模拟降级会形成看似成功但事实不可信的结果，因此必须移除生产入口。
- **Alternatives considered**: 同城模拟、北京默认值、最近一次天气或旧推荐继续展示都可能被误认为当前真实天气。

## 目标日期与持久化

- **Decision**: `today | tomorrow` 先按账号时区得到本地日期，再将明天在日历日期上加一天；页面查询和 upsert 均使用该目标日期。
- **Rationale**: 现有表已以 `(user_id, recommendation_date)` 唯一，天然允许同一账号分别保存今天和明天。Supabase JavaScript `upsert` 可通过 `onConflict` 对唯一键覆盖同日记录。
- **Alternatives considered**: 增加 `target_day` 列会重复日期语义；把明天覆盖到今天会丢失今日方案。
- **Source**: [Supabase JavaScript upsert](https://supabase.com/docs/reference/javascript/upsert)。

## 页面状态

- **Decision**: 目标日放在 `/recommendations?day=today|tomorrow`，使用链接式分段控件切换；生成表单带隐藏 `targetDay`。
- **Rationale**: URL 可刷新、可返回、可直接读取正确批次，也避免仅客户端状态与服务端数据错位。Next.js 16 Server Page 的 `searchParams` 是 Promise，适合按 URL 加载数据。
- **Alternatives considered**: 仅 React 本地状态在刷新后丢失，且 Server Component 仍会读取今日结果；新增客户端数据请求层没有必要。

