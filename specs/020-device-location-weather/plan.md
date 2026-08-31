# Implementation Plan: 设备定位天气城市

**Branch**: `020-device-location-weather` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-device-location-weather/spec.md`

## Summary

在现有推荐页城市选择器中增加由用户点击触发的设备定位。浏览器取得单次经纬度后，按客户端接口的公平使用规则直接换成中国城市名；衣拍即合 Server Action 只接收城市名并重新鉴权，再复用现有 Open-Meteo 城市规范化、账号绑定会话 Cookie、Supabase 常用城市和旧推荐失效逻辑。应用服务器不接收精确坐标，定位失败继续使用手动选城，天气仍只来自真实 Open-Meteo 数据。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 24、Next.js 16.3.1、React 19  
**Primary Dependencies**: Browser Geolocation API、BigDataCloud 免费客户端 Reverse Geocode to City API、Next.js Server Actions、现有 Supabase SSR 客户端、现有 Open-Meteo 城市/天气模块、lucide-react；不新增 npm 依赖  
**Storage**: 设备精确坐标不存储；临时城市继续使用账号绑定 HttpOnly 会话 Cookie；常用城市继续使用 `user_preferences` 城市五元组；无迁移  
**Testing**: Node 固定反向地理编码样本与静态边界门禁、Biome、TypeScript、Next.js production build、既有城市/IP/天气回归、390px 浏览器权限与布局验收  
**Target Platform**: 支持安全上下文定位的移动端浏览器与 Vercel Production；桌面和不支持定位的浏览器安全降级  
**Project Type**: Next.js App Router 单体 Web 应用  
**Performance Goals**: 浏览器定位等待上限 10 秒；城市确认服务等待上限 8 秒；正常网络下目标 10 秒内完成城市切换  
**Constraints**: 必须点击后触发；不保存精确坐标；只支持中国大陆城市；反向地理编码为公共服务、单次用户触发且需署名；真实天气失败不得模拟  
**Scale/Scope**: 一个现有客户端城市选择组件、一个客户端城市解析模块、一个 Server Action、一个独立门禁；无新页面、表、迁移、依赖或环境变量

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: 只解决“移动后天气城市不对”的核心问题，不加入地图、轨迹或持续定位。通过。
- **核心链路正确**: 设备坐标先确认城市，再走既有城市规范化和真实天气链路；失败保持原城市。通过。
- **简单实现**: 复用现有 Server Action、会话覆盖和 Supabase 偏好，无迁移或新依赖。通过。
- **可验证**: 坐标校验、响应解析、不持久化和用户触发边界可用固定样本验证；浏览器另验权限分支。通过。
- **文档与安全**: Server Action 每次重新鉴权，不信任客户端用户 ID/城市/时区；精确坐标不持久化或记录。通过。

设计后复核：设备坐标只存在于点击后的浏览器内存和设备到 BigDataCloud 的一次客户端请求中，不提交给衣拍即合 Server Action；存入 Cookie 或数据库的是二次规范化后的城市中心坐标。客户端服务只在用户点击后调用，拒绝 IP 回退结果，并在 UI 透明说明处理方。无章程例外。

## Project Structure

### Documentation (this feature)

```text
specs/020-device-location-weather/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── device-location-action.md
│   └── weather-city-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/recommendations/device-location.ts
app/recommendations/actions.ts
components/recommendations/weather-city-selector.tsx
scripts/verify-sdd-018.mjs
scripts/verify-sdd-019.mjs
scripts/verify-sdd-020.mjs
package.json
progress.md
AGENTS.md
```

**Structure Decision**: 浏览器权限和错误反馈留在已有客户端选择器；坐标校验、客户端城市请求和响应解析放在可测试的浏览器兼容模块；状态变更继续由已有推荐 Server Action 统一鉴权、再次规范化城市并复用临时/常用城市写入。旧门禁改为禁止静默定位，而不是全面禁止显式定位。

## Complexity Tracking

无章程例外。
