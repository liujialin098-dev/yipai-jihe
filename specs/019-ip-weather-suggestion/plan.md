# Implementation Plan: IP 天气城市建议

**Branch**: `019-ip-weather-suggestion` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-ip-weather-suggestion/spec.md`

## Summary

在推荐页服务端读取 Vercel 提供的城市级 IP 地理请求头，只在中国城市、字段完整且与当前有效城市相距至少 50 公里时展示待确认建议。用户可以把规范化后的建议城市写入 HttpOnly 会话 Cookie 作为“本次使用”，或继续复用现有 Supabase 账号城市五元组永久保存；临时状态绑定当前用户 ID，推荐读取与生成统一使用“会话临时城市优先、账号常用城市兜底”的位置上下文。任何切换或恢复都会清除当前账号旧推荐，天气仍只读取真实 Open-Meteo 数据。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 24、Next.js 16.3.1、React 19  
**Primary Dependencies**: Next.js `headers()` / `cookies()`、现有 Supabase SSR 客户端、Open-Meteo 城市解析与天气模块、lucide-react；不新增依赖  
**Storage**: 临时城市使用账号绑定的 HttpOnly 会话 Cookie；常用城市继续使用 `user_preferences` 城市五元组；无迁移  
**Testing**: Node 固定请求头与 Cookie 样本门禁、Biome、TypeScript、Next.js production build、现有 Supabase 账号隔离与真实天气回归、390px 浏览器验收  
**Target Platform**: Vercel Production 响应式 Web 应用；Windows 本地开发缺少 Vercel 定位头时安全降级  
**Project Type**: Next.js App Router 单体 Web 应用  
**Performance Goals**: 请求头判断在单次服务端渲染内同步完成；城市确认目标 10 秒内返回；不增加推荐模型调用  
**Constraints**: IP 只作建议；城市必须再次经既有中国城市解析；临时状态不得跨账号；真实天气失败即停止；不保存 IP 地址或位置历史  
**Scale/Scope**: 推荐页、一个现有城市选择组件、一个服务端位置上下文模块、两个 Server Action 分支、一个独立门禁；无新表、路由、依赖或环境变量

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: 直接解决旅行时天气城市不跟随的问题，同时保留手动选择。通过。
- **核心链路正确**: IP 不直接成为天气来源；确认后先规范化城市，推荐读取和生成共享同一有效位置。通过。
- **简单实现**: 使用平台已有请求头和 Next.js 会话 Cookie，不接入定位供应商、浏览器权限或数据库迁移。通过。
- **可验证**: 纯函数覆盖编码、缺失、国家、距离和账号绑定；真实 Supabase/天气脚本继续回归。通过。
- **文档与安全**: 不保存 IP，不把临时状态开放给浏览器脚本，不使用位置进行授权；现有 RLS 所有权条件保持不变。通过。

设计后复核：请求头仅决定是否展示建议；所有状态变更均由 Server Action 重新读取当前用户、重新解析城市并删除自身旧推荐。会话 Cookie 含版本、用户 ID 和规范位置，解析时严格校验；无章程例外。

## Project Structure

### Documentation (this feature)

```text
specs/019-ip-weather-suggestion/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── location-context.md
│   └── weather-city-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/auth/viewer.ts
lib/recommendations/ip-location.ts
lib/recommendations/location-context.ts
lib/recommendations/location-override.ts
lib/recommendations/data.ts
app/recommendations/actions.ts
app/recommendations/page.tsx
components/recommendations/weather-city-selector.tsx
components/recommendations/recommendation-controls.tsx
scripts/verify-sdd-019.mjs
package.json
progress.md
AGENTS.md
```

**Structure Decision**: IP 请求头解析与距离判断放在纯函数模块，便于离线验收；读取/写入 Cookie 的 Next.js 服务端边界放在独立位置上下文模块。页面数据与生成 Action 都调用同一上下文，避免一个使用临时城市、另一个仍使用账号城市。现有城市选择器扩展建议和恢复状态，不新增页面或公开接口。

## Complexity Tracking

无章程例外。
