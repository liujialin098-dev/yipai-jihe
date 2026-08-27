# Research: 推荐页城市切换与连续入库

## 天气城市来源

- **Decision**: 继续以账号主动保存的天气城市为唯一普通推荐位置，不根据 IP、邮箱或设备静默切换。
- **Rationale**: 现有 SDD-012 已明确该隐私与准确性边界；IP 可能对应运营商出口、VPN 或部署节点，旅行场景也需要用户可控和跨设备一致的城市。
- **Alternatives considered**: Vercel/IP 地理信息会误判且不可控；浏览器 GPS 需要权限并增加反向地理编码；固定武汉明显不适合旅行。

## 推荐页快速修改

- **Decision**: 在天气区域提供可展开的城市输入，并由独立 Server Action 仅更新城市五元组。
- **Rationale**: 用户不必离开天气上下文或重新提交整份风格问卷；React 19 `useActionState` 可直接展示 pending、成功和错误状态。
- **Alternatives considered**: 只链接设置页步骤较多；直接复用完整问卷 Action 会把未改动的风格和场合重新写入事件账本。

## Supabase 写入与隔离

- **Decision**: Server Action 使用当前 SSR 会话 `auth.getUser()` 得到用户 ID，再对 `user_preferences.user_id` 等值更新；沿用已有 SELECT 与 UPDATE 所有权 RLS。
- **Rationale**: Supabase 当前文档 `/supabase/supabase` 明确 UPDATE 需要 SELECT policy，并应同时使用 `USING` 与 `WITH CHECK` 约束所有权；项目现有表已经具备这些策略。
- **Alternatives considered**: 客户端携带用户 ID 不可信；服务端 secret/service role 会绕过 RLS，范围过大且没有必要。

## 城市变化后的推荐

- **Decision**: 城市保存成功后删除当前用户全部 `daily_recommendations`，并刷新推荐页、设置页和偏好页。
- **Rationale**: 今天和明天都可能仍含旧城市天气；全部失效比逐条比较 JSON 更直接，下一次生成会读取新坐标的真实天气。
- **Alternatives considered**: 仅删除当前日期会残留另一天旧城市结果；保留旧结果并加提示仍可能误导。

## 满批队列重置

- **Decision**: 只有 10 件全部确认后显示“继续添加衣服”，点击时撤销所有本地预览 URL 并把队列恢复为空。
- **Rationale**: 确认成功后的入库和 Storage 生命周期已由服务端完成，本地队列只是展示状态；此时重置不会影响持久数据，也不会丢失待处理项。
- **Alternatives considered**: 自动重置会让用户来不及确认结果；任何数量确认后都显示重置会造成失败项被误丢。

## 近期平台变更复核

- **Decision**: 本阶段无 Supabase 兼容性调整。
- **Rationale**: 2026-08-27 读取官方 changelog 索引，近期 breaking changes 涉及 GraphQL、自托管数据库和 Data API 默认暴露，不影响既有已暴露表上的 SSR 所有权更新。
- **Alternatives considered**: 无。
