# Implementation Plan: 穿搭日记与基础衣物利用率报告

**Branch**: `009-outfit-diary` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-outfit-diary/spec.md`

## Summary

新增一张按用户和日期唯一的穿搭日记表，以 UUID 数组保存当前衣物引用、以 JSON 快照保留历史文字。今日推荐通过专用 Server Action 重新读取并验证后写入；手工记录页只展示当前偏好允许的日常衣物。日记主页提供月份回顾、编辑删除、收藏入口和基础利用率标签页，报告在服务端按 30 天、90 天或全部范围即时聚合，不调用 AI、不持久化派生统计。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 24、Next.js 16.3.1、React 19
**Primary Dependencies**: 现有 Supabase SSR、`@supabase/supabase-js`、Tailwind CSS 4、lucide-react、Next.js Image；不新增依赖
**Storage**: Supabase Postgres 新表 `outfit_diary_entries`；沿用私有 `wardrobe-images` 签名地址
**Testing**: SDD-009 固定聚合测试与静态门禁、真实 Supabase 双会话/RLS/幂等脚本、Biome、TypeScript、Next.js production build、390px 浏览器验收
**Target Platform**: Vercel 响应式 Web 应用与 Windows 本地开发环境
**Project Type**: Next.js App Router 单体 Web 应用
**Performance Goals**: 记录保存目标 3 秒内反馈；单用户 3 年日记（约 1095 行）下报告服务端聚合目标 1 秒内完成，不增加模型调用
**Constraints**: 一天一条；未来日期拒绝；服务端重读所有外部 ID；RLS + 数据库触发器验证衣物归属；历史快照不含签名 URL；报告分母只使用当前日常可见衣物
**Scale/Scope**: 一张新表、两个新路由、三个轻量交互组件、一个数据模块、一组 Server Actions、一个独立验证脚本；无照片、提醒、价格或 AI 分析

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: 仅实现记录、回顾和基础报告，不加入照片、提醒、分享或 AI 文案。通过。
- **核心链路正确**: 报告只来自真实日记；推荐和手工路径都由服务端重读当前账号衣物；一天唯一由数据库保证。通过。
- **简单实现**: 单表原子 upsert + 服务端聚合满足当前数据量，避免明细表、物化视图和定时任务。通过。
- **静态质量门禁**: 新增 SDD-009 独立脚本并运行 check、build 和必要回归。通过。
- **文档与安全**: Spec Kit 文档使用中文；RLS、最小授权、触发器和会话派生身份同时约束。通过。

设计后复核：官方文档确认更新需要 SELECT 策略，所有权策略使用 `(select auth.uid())`；当前 Supabase 变更日志中与本阶段相关的托管 Postgres/RLS/SDK 无破坏性变化。新迁移不创建或固定扩展版本，不受 2026-08-05 扩展版本规则变化影响。无章程例外。

## Project Structure

### Documentation (this feature)

```text
specs/009-outfit-diary/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── diary-actions.md
│   └── diary-pages.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/diary/page.tsx
app/diary/new/page.tsx
app/diary/actions.ts
components/diary/diary-composer.tsx
components/diary/diary-delete-button.tsx
components/diary/recommendation-diary-button.tsx
components/recommendations/recommendation-card.tsx
components/bottom-navigation.tsx
lib/diary/data.ts
lib/diary/report.ts
lib/diary/validation.ts
lib/supabase/database.types.ts
lib/wardrobe/data.ts
supabase/migrations/*_outfit_diary.sql
scripts/verify-sdd-009.mjs
package.json
progress.md
AGENTS.md
```

**Structure Decision**: 页面继续以 Server Component 读取数据；仅表单、删除确认和推荐按钮使用小型 Client Component。所有写入集中在 `app/diary/actions.ts`，所有读取与聚合集中在 `lib/diary/`，推荐卡只接入一个保存按钮，不复制日记规则。

## Complexity Tracking

无章程例外。
