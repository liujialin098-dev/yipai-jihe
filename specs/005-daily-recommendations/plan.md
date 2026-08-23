# Implementation Plan: 每日 3 套 AI 推荐

**Branch**: `master` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-daily-recommendations/spec.md`

## Summary

在现有衣橱和匿名数据隔离之上增加每日推荐闭环：服务端读取当前用户活跃衣物和偏好，获取北京实时天气或模拟天气，优先通过 OpenAI Responses API 生成 3 套严格结构化搭配并进行所有权与业务校验；任何外部失败都切换到确定性规则生成器。当天结果以一个 JSONB 批次原子覆盖保存，推荐页使用真实原图组成三张移动端搭配卡。

## Technical Context

**Language/Version**: TypeScript 5、React 19.2.8、Node.js 20 兼容运行时

**Primary Dependencies**: Next.js 16.3.1 App Router、`@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3、Tailwind CSS 4、shadcn/ui、lucide-react；不新增运行时依赖

**Storage**: Supabase Postgres 新增 `public.daily_recommendations`；衣物原图继续来自现有私有 Storage 与演示静态图

**Testing**: `npm run check`、`npm run build`、`npm run verify:sdd-005`、Supabase 双会话 RLS/唯一性验证、390px 浏览器核心流程验收

**Target Platform**: Vercel Node.js Functions + 移动优先 Web，主要验收宽度 390px

**Project Type**: 单体 Next.js Web 应用，Server Component 默认，交互表单使用 Client leaf + Server Action

**Performance Goals**: 推荐总耗时不超过 15 秒；天气请求 4 秒超时；AI 请求 12 秒超时；页面读取一个当日批次并并行准备衣物图片

**Constraints**: OpenAI 与天气请求仅在服务端；`store: false`；严格 JSON Schema；外部服务失败必须降级；同批次单品不重复；同用户同日唯一；不得阻塞匿名体验

**Scale/Scope**: MVP 单用户活跃衣物不超过数百件；每次最多向模型提供 80 件按场合与季节预筛后的摘要；每天每用户 1 个批次、3 套方案

## Constitution Check

*GATE: Phase 0 前及 Phase 1 后均通过。*

- MVP 结果优先：PASS。只实现“衣橱到每日 3 套推荐”，收藏、换件和行为反馈留到 SDD-006。
- 核心路径正确：PASS。衣橱不足、天气失败、AI 失败、无效 ID 和重复提交都有明确结果。
- 直接而简洁：PASS。一个批次表保存完整不可分割结果，不引入任务队列、向量库、定位服务或新状态库。
- 静态质量门禁：PASS。保留 `npm run check`，增加阶段脚本与 build 验证。
- 清晰交付：PASS。文档和 UI 使用中文，复用现有 shadcn、主题 token 与 lucide-react。
- 安全约束：PASS。Server Action 内重新认证；数据库 RLS 使用 `(select auth.uid()) = user_id`；查询显式过滤 `user_id`；公开客户端无密钥。
- Phase 1 复核：PASS。数据模型没有 `SECURITY DEFINER`，JSONB 只保存服务端验证后的用户自有 ID，表级授权与四类 RLS 齐全。

## Project Structure

### Documentation (this feature)

```text
specs/005-daily-recommendations/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/recommendation-action.md
├── contracts/recommendation-output.schema.json
└── tasks.md
```

### Source Code (repository root)

```text
app/
└── recommendations/
    ├── actions.ts
    ├── loading.tsx
    └── page.tsx

components/
└── recommendations/
    ├── recommendation-controls.tsx
    └── recommendation-card.tsx

lib/
└── recommendations/
    ├── constants.ts
    ├── data.ts
    ├── generator.ts
    ├── rules.ts
    ├── validation.ts
    └── weather.ts

supabase/migrations/
└── *_daily_recommendations.sql

scripts/
└── verify-sdd-005.mjs
```

**Structure Decision**: 延续现有单体 App Router 结构。页面读取放在 Server Component；只有场合和天气切换表单成为 Client Component；认证、外部请求、业务校验和写入集中在 Server Action 与 `lib/recommendations/`。

## Complexity Tracking

无章程例外。
