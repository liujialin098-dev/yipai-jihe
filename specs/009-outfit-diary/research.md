# Research: 穿搭日记与基础衣物利用率报告

## 决策 1：使用一张日记表保存衣物 ID 数组和文字快照

- **Decision**: `outfit_diary_entries` 每行代表用户某一天，`item_ids uuid[]` 用于当前衣物聚合，`outfit_snapshot jsonb` 用于历史回顾。
- **Rationale**: 一天一条记录可在一次 upsert 中原子替换，不会出现主表保存成功但明细行只写一半；每名用户最多约每天一行，服务端聚合数组足够简单。
- **Alternatives considered**:
  - 日记主表 + 明细表：关系更规范，但需要事务 RPC 或承担部分写入，超出当前 MVP。
  - 只存 JSON：历史简单，但利用率统计需要从不受约束的 JSON 提取，安全和类型较弱。

## 决策 2：数据库触发器验证衣物所有权

- **Decision**: 在 insert/update 前检查 1～8 个 ID、无重复，并确认全部属于 `NEW.user_id`；RLS 同时限制行所有权。
- **Rationale**: Server Action 校验改善提示，但 PostgREST 仍是公开数据入口，数据库必须拒绝猜测到的跨用户衣物 ID。
- **Alternatives considered**:
  - 只做 Server Action 校验：不能阻止直接调用数据 API。
  - 仅依赖数组字段 check：跨表所有权不能由普通 check 约束表达。

## 决策 3：报告在服务端即时聚合

- **Decision**: 读取目标日期范围内的当前用户日记，按 `item_ids` 统计次数与最后日期，并与当前日常可见衣橱合并。
- **Rationale**: 每天最多一条，三年约 1095 行；无需物化视图、Cron 或数据库函数，逻辑易测试、易解释。
- **Alternatives considered**:
  - 写入时维护计数器：编辑、删除和范围切换会增加一致性风险。
  - AI 总结：无法替代精确计数且增加成本，不在当前范围。

## 决策 4：日记只记录今天和过去

- **Decision**: 以账号城市时区计算今天，未来日期和明日推荐均拒绝写入。
- **Rationale**: 日记代表实际穿着；若把计划算入利用率，会造成虚高。
- **Alternatives considered**:
  - 允许未来计划并单独标记：需要状态转换与提醒，属于后续能力。

## 决策 5：底部“收藏”入口替换为“记录”

- **Decision**: 保持 5 项移动端 Dock，把最后一项改为 `/diary`；日记页提供明确的收藏入口，收藏功能和路由不删除。
- **Rationale**: 6 项会压缩 390px 下的触控与文字空间；日记是需要持续进入的主功能，收藏仍可从记录页到达。
- **Alternatives considered**:
  - 6 项底部导航：移动端过密且主添加按钮失去中心感。
  - 日记只放首页卡片：可发现性不足。

## 官方资料复核

- Context7 library：`/supabase/supabase`。RLS 表先启用策略再授予最小 CRUD；update 同时依赖 select，所有权表达式使用 `(select auth.uid())`。
- Supabase 2026-08-28 变更日志：近期数据库破坏性变化集中在扩展版本固定、Realtime schema 和管理日志接口；本阶段不涉及这些能力。
- 项目本地 Next.js 16.3.1 文档：页面默认 Server Component；交互边界最小化；Server Action 必须把每个调用当成不可信 POST，重新认证、授权和验证输入；写入后用 `revalidatePath` 更新当前页面。
