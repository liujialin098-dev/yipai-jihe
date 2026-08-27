# Implementation Plan: 推荐页城市切换与连续入库

**Branch**: `018-city-switch-batch-reset` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-city-switch-batch-reset/spec.md`

## Summary

在现有 10 件批量入库工作区增加安全的“已完成批次重置”，只释放浏览器队列和预览资源；在推荐页天气卡旁增加可展开的城市选择器，通过独立 Server Action 复用现有中国城市解析、账号偏好 RLS 和推荐失效逻辑。天气继续只使用账号主动保存的城市及真实 Open-Meteo 数据，不接入 IP 或持续定位。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 24、Next.js 16.3.1、React 19  
**Primary Dependencies**: 现有 Supabase SSR 客户端、Open-Meteo 城市解析与天气模块、lucide-react；不新增依赖  
**Storage**: 沿用 `user_preferences` 城市五元组与 `daily_recommendations`；无迁移  
**Testing**: Node 固定样本门禁、Biome、TypeScript、Next.js production build、现有 Supabase 双会话与真实天气回归  
**Target Platform**: Vercel 响应式 Web 应用与 Windows 本地开发环境  
**Project Type**: Next.js App Router 单体 Web 应用  
**Performance Goals**: 本地批次重置即时完成；城市保存目标 10 秒内返回；不增加推荐模型调用  
**Constraints**: 城市必须由用户主动选择；只保存城市级位置；失败不覆盖旧城市；城市变化后旧推荐失效；入库重置不得触碰已入库数据  
**Scale/Scope**: 两个现有页面、一个轻量客户端城市选择组件、一个 Server Action、一个独立静态门禁；无新表、路由、依赖或环境变量

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: 直接解除 10 件满批阻塞，并把城市修改入口放到天气结果附近。通过。
- **核心链路正确**: 入库数据不随队列重置删除；城市写入由会话身份和现有 RLS 限制，天气仍为真实来源。通过。
- **简单实现**: 复用现有解析、偏好表和推荐失效逻辑，不引入 IP 服务、定位权限、迁移或依赖。通过。
- **可验证**: 新增 SDD-018 静态/纯函数门禁，并回归 SDD-004、012、013。通过。
- **文档与安全**: 中文维护 Spec Kit、进度和约束；客户端不接触敏感密钥或任意用户 ID。通过。

设计后复核：已有城市五元组和 RLS 完整覆盖本阶段；Server Action 重新读取当前用户并校验输入；无章程例外。

## Project Structure

### Documentation (this feature)

```text
specs/018-city-switch-batch-reset/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── batch-reset-ui.md
│   └── weather-city-action.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
components/wardrobe/ingestion-workspace.tsx
components/recommendations/weather-city-selector.tsx
app/recommendations/actions.ts
app/recommendations/page.tsx
lib/recommendations/location.ts
scripts/verify-sdd-018.mjs
package.json
progress.md
AGENTS.md
```

**Structure Decision**: 批次重置保留在现有客户端工作区内；城市选择器作为推荐页专用 Client Component，调用同路由的独立 Server Action。城市解析继续由 `lib/recommendations/location.ts` 负责，数据写入复用当前账号偏好表，不把完整偏好问卷耦合到快速切换。

## Complexity Tracking

无章程例外。
