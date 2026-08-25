# Implementation Plan: 今日与明日真实天气搭配

**Branch**: `master` | **Date**: 2026-08-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-real-forecast-days/spec.md`

## Summary

在现有推荐闭环上增加账号时区下的“今天 / 明天”目标日。页面通过 URL 查询参数读取对应自然日的推荐，Server Action 使用账号保存的城市位置向 Open-Meteo 一次请求当前天气与两天日预报：今天取当前值，明天按精确日期取日预报原始最低温度与最低体感温度。天气请求失败或数据无效时终止生成，不再创建模拟天气；AI 失败仍可在真实天气前提下使用既有规则搭配。既有 `daily_recommendations` 的用户+日期唯一键已支持两个日期，无需数据库迁移。

## Technical Context

**Language/Version**: TypeScript 5，Next.js 16.3.1 App Router，React 19.2.8

**Primary Dependencies**: `@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3、Tailwind CSS 4、shadcn/ui Base UI、lucide-react；不新增依赖

**Storage**: 复用 Supabase `public.daily_recommendations`；`unique (user_id, recommendation_date)` 分离今天和明天

**Testing**: `npm run check`、`npm run build`、新增 `npm run verify:sdd-013`、Open-Meteo 真实两日响应校验、390px 本地浏览器验收

**Target Platform**: Vercel Node.js 服务端与现代移动端浏览器

**Project Type**: Next.js 全栈 Web 应用

**Performance Goals**: 天气请求 4 秒内成功或明确失败；完整推荐继续满足 15 秒目标；日期切换读取一个目标批次

**Constraints**: 不使用模拟天气；不回退默认城市；明日日期必须精确匹配；天气与 Supabase 读写仅在服务端；沿用当前账号 RLS；不新增运行时依赖

**Scale/Scope**: 单账号同时最多维护今天和明天两个近期批次；每批 3 套；账号城市仍限中国城市级位置

## Constitution Check

*GATE: Phase 0 前通过，Phase 1 后复核通过。*

- **MVP 结果优先**: 只增加今天/明天选择与真实天气失败边界，不扩展多日周计划。通过。
- **核心路径正确**: 目标日贯穿 URL、天气、写入、读取和文案；天气失败不生成。通过。
- **直接而简洁**: 复用现有日期唯一键和 Server Action，不新增表、队列或状态库。通过。
- **静态质量门禁**: 计划执行静态检查、构建、独立脚本和浏览器验收。通过。
- **约束内清晰交付**: 中文文档，既有 UI token，服务端外部请求与 RLS 不变。通过。

## Project Structure

### Documentation (this feature)

```text
specs/013-real-forecast-days/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── recommendation-target-day.md
│   └── weather-provider.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/recommendations/{actions.ts,page.tsx}
components/recommendations/recommendation-controls.tsx
lib/recommendations/{constants.ts,data.ts,validation.ts,weather.ts}
scripts/verify-sdd-013.mjs
package.json
progress.md
AGENTS.md
```

**Structure Decision**: 保持现有单体 App Router 结构。目标日由页面 URL 表达，Server Component 按目标日期读取；生成表单仅提交场合和目标日，Server Action 重新认证并计算目标日期。

## Complexity Tracking

无章程偏离，不需要新增复杂度例外。

