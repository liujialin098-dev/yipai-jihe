# Research: IP 天气城市建议

## Decision 1：使用 Vercel 请求头作为近似城市建议来源

- **Decision**: 服务端读取 `x-vercel-ip-city`、`x-vercel-ip-country`、`x-vercel-ip-country-region`、`x-vercel-ip-latitude`、`x-vercel-ip-longitude` 和 `x-vercel-ip-timezone`；非 ASCII 城市按 RFC3986 解码。字段缺失、无效或国家不是 `CN` 时不展示建议。
- **Rationale**: Vercel 已在请求入口提供城市级近似信息，不需要新增供应商、密钥、浏览器权限或客户端 IP 上传。官方文档明确城市可能被编码，所有字段均可能不可用。
- **Alternatives considered**: 浏览器 GPS 精度更高但需要敏感权限且超出范围；第三方 IP 服务增加隐私、成本和故障面；从客户端读取公网 IP 再回传没有必要。

## Decision 2：IP 只触发提示，不直接覆盖天气位置

- **Decision**: 只有候选位置完整、在中国且与当前有效城市地理距离至少 50 公里时展示提示；是否切换完全由用户确认。
- **Rationale**: VPN、运营商出口和企业网络会让 IP 城市偏离真实位置。50 公里门槛可过滤同城不同出口和近距离抖动，同时仍能覆盖典型跨城旅行。
- **Alternatives considered**: 每次请求自动切换会让天气不可预测；只比较城市字符串会因中文/英文、区县/城市写法重复提示；始终显示定位状态会增加噪声。

## Decision 3：临时城市采用账号绑定的 HttpOnly 会话 Cookie

- **Decision**: Cookie 保存版本、当前用户 ID 和已规范化城市五元组，不设置 `maxAge`/`expires`，使用 `httpOnly`、`sameSite=lax`、`path=/`，Production 开启 `secure`。读取时验证版本、用户 ID、字段长度和坐标范围。
- **Rationale**: “本次使用”本质是浏览器会话偏好，不应写入账号数据库；HttpOnly 避免普通浏览器脚本读取，绑定用户 ID 防止同一浏览器换账号后继承。位置只到城市级且不包含 IP 地址。
- **Alternatives considered**: `localStorage` 可被客户端脚本读取且会长期保留；数据库新增临时字段会把设备会话状态错误地跨设备同步；内存状态刷新即丢失。

## Decision 4：确认后仍通过既有城市解析规范化

- **Decision**: “本次使用”和“设为常用城市”都只提交候选城市名，Server Action 重新读取当前会话并调用既有中国城市解析，不能直接信任隐藏字段中的经纬度。
- **Rationale**: 请求头和表单都不是授权或持久数据来源；统一解析可得到与现有天气逻辑一致的城市、行政区、坐标和时区，并阻止任意坐标注入。
- **Alternatives considered**: 直接使用请求头坐标更快，但会把可伪造输入直接变成天气来源；客户端提交完整位置会扩大校验面。

## Decision 5：推荐读取和生成共享“当前有效城市”

- **Decision**: 当前有效城市为“当前用户有效会话覆盖值，否则账号常用城市”。推荐日期、天气请求、已保存推荐读取和城市显示都使用该位置；切换或恢复时清除当前用户全部旧推荐。
- **Rationale**: `daily_recommendations` 当前按用户和日期唯一，不区分城市。清除旧批次可避免临时杭州天气与武汉账号城市互相污染，也保持 SDD-013 的今天/明天真实天气边界。
- **Alternatives considered**: 在推荐表新增城市唯一键需要迁移和历史模型扩展；只在生成时使用临时城市会让页面日期和读取结果不一致；保留旧推荐再按城市过滤会留下不可见陈旧数据。

## Decision 6：沿用现有 Supabase 所有权与无迁移方案

- **Decision**: 常用城市仍只更新当前用户 `user_preferences`，旧推荐仍只删除当前用户 `daily_recommendations`；不新增表、策略或授权字段。
- **Rationale**: 2026-08-27 复核 Supabase changelog，近期破坏性变更不涉及当前托管项目的 `auth.getUser()`、PostgREST 更新/删除或现有 RLS。现有策略已使用 `auth.uid()` 所有权边界。
- **Alternatives considered**: 新增位置历史表不符合“不保存轨迹”的产品边界；服务端管理员密钥不需要且会扩大权限。

## Documentation Evidence

- Context7 library id：`/websites/vercel`。
- Vercel Request Headers：城市头为 `x-vercel-ip-city` 且非 ASCII 按 RFC3986 编码；纬度、经度、国家区域和 ICANN 时区均通过对应 `x-vercel-ip-*` 头提供，值可能为空。
- Next.js 16.3.1 本地文档：`headers()` 与 `cookies()` 均为异步请求时 API；Cookie 只能在 Server Function 或 Route Handler 写入/删除；本阶段使用 Server Action 修改。
- Supabase changelog：2026-08-27 检查最新摘要，未发现影响本阶段现有会话读取、RLS 所有权更新或删除的破坏性变更。
