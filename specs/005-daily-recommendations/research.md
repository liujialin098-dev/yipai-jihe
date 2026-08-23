# Phase 0 Research: 每日 3 套 AI 推荐

## 天气服务

- **Decision**: 使用 Open-Meteo Forecast API 的 current weather，默认北京坐标，读取 `temperature_2m`、`apparent_temperature`、`weather_code` 与 `is_day`。
- **Rationale**: 无需密钥，支持当前温度、体感温度与 WMO 天气代码，适合 MVP；4 秒超时后可无缝降级到模拟天气。
- **Alternatives considered**: 和风天气、OpenWeatherMap。两者需要新密钥或账户配置，会增加当前阶段的人工阻塞。
- **Source**: Open-Meteo 当前官方文档说明 current 条件可返回温度、体感温度和天气代码，并自动选择适合位置的模型。

## AI 结构化输出

- **Decision**: 复用 OpenAI Responses API，`text.format` 使用 `type: json_schema`、`strict: true`，请求设置 `store: false`；默认模型继续使用 `gpt-4o-mini`，可由 `OPENAI_RECOMMENDATION_MODEL` 覆盖。
- **Rationale**: 与 SDD-004 已验证的调用方式一致；严格结构可以先约束字段，再由本地规则验证业务语义与所有权。
- **Alternatives considered**: 自由文本解析、工具调用、另接推荐供应商。自由文本不稳定，工具调用没有额外价值，多供应商超出 P0。
- **Source**: OpenAI 官方文档将 Responses API 的结构化输出定义在 `text.format`，严格模式只支持 JSON Schema 子集，因此契约不使用 `uniqueItems` 等已知不兼容关键字。

## 推荐持久化

- **Decision**: 使用单表 `daily_recommendations`，每个用户每天一行，`outfits` 与 `weather` 为 JSONB；唯一约束为 `(user_id, recommendation_date)`，生成完成后 upsert 原子覆盖。
- **Rationale**: 一次推荐的三套方案必须整体成功或整体失败；单行 upsert 天然避免部分写入和第二个当天批次，也最适合当前读取方式。
- **Alternatives considered**: 批次表加方案子表、每套一行。规范化结构能提供单品外键，但需要事务函数或多步写入，MVP 的故障面更大；后续收藏可建立独立收藏实体，不要求拆分当前快照。

## 数据隔离与查询

- **Decision**: 表启用 RLS，`authenticated` 仅拥有 CRUD；四类策略均使用 `(select auth.uid()) = user_id`，应用查询同时显式 `.eq("user_id", userId)`；`user_id` 参与唯一索引。
- **Rationale**: 匿名用户在 Supabase 中也使用 `authenticated` 数据库角色，必须靠所有权条件隔离；显式过滤可帮助查询计划利用索引。
- **Alternatives considered**: 仅在 Server Action 检查用户、使用 `service_role`。前者缺少纵深防御，后者会绕过 RLS，均不接受。

## 推荐规则与失败处理

- **Decision**: 先按场合、季节与体感温度筛选，再生成；AI 结果必须整批通过所有权、活跃状态、类别结构、场合、季节和跨套不重复校验，否则整体转规则生成器。
- **Rationale**: 部分采纳会产生难解释的混合结果；确定性规则保证失败时仍恰好 3 套且可回归测试。
- **Alternatives considered**: 对无效套装逐套重试 AI、允许跨套复用。重试会突破 15 秒目标，复用降低三套选择价值。

## UI 与交互

- **Decision**: 推荐页保持现有冷白银灰与系统蓝，卡片约 24px 软圆角；天气与场合控制是清晰的单选控件，三套卡片用真实原图拼贴；生成时使用与最终版位一致的骨架和气泡扩展状态，不新增动效依赖。
- **Rationale**: 延续现有 Apple 风格和 SDD-011 动效，不改变导航和视觉系统；真实原图避免伪造透明底效果。
- **Alternatives considered**: 横向轮播、整屏单卡、第三方 Motion 库。三张纵向卡更易比较，也不增加依赖。
