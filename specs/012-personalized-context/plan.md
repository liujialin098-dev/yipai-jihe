# Implementation Plan: 账号城市与衣着偏好

**Branch**: `master` | **Date**: 2026-08-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-personalized-context/spec.md`

## Summary

在现有 `user_preferences` 增加账号级常用城市、经纬度、时区和衣着偏好，在 `wardrobe_items` 增加男装/女装/中性归属。偏好页通过城市名称解析并保存城市级位置；每日推荐读取当前账号位置获取天气，并在未设置城市时停止使用北京默认值。衣橱、首页预览和推荐候选统一应用可逆衣着过滤。黑色按钮的自动白色扫光作为 SDD-011 回归缺陷同步修复为无突兀闪光的柔和状态反馈。

## Technical Context

**Language/Version**: TypeScript 5，Next.js 16.3.1 App Router，React 19.2.8

**Primary Dependencies**: `@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3、Tailwind CSS 4、shadcn/ui Base UI、lucide-react；不新增依赖

**Storage**: 当前 Supabase Postgres 项目的 `user_preferences`、`wardrobe_items` 和既有 `daily_recommendations`

**Testing**: Biome/TypeScript 静态门禁、Next.js production build、新增 `scripts/verify-sdd-012.mjs` 双会话远端验证、390px 本地浏览器验收

**Target Platform**: Vercel Node.js 服务端与现代移动端浏览器

**Project Type**: Next.js 全栈 Web 应用

**Performance Goals**: 城市保存目标 5 秒内完成；实时天气继续保持 2.5 秒外部超时；完整推荐继续满足 15 秒目标；过滤 200 件以内衣橱不增加可感知等待

**Constraints**: 不从邮箱、IP 或姓名推断位置；不保存街道级地址；所有客户端输入在服务端校验；账号数据继续受 `auth.uid()` RLS；外部服务失败时不得显示错误城市；不新增前端动效库

**Scale/Scope**: 单账号一个常用城市和一个衣着偏好；当前演示衣橱 24 件；推荐候选上限 200 件；中国城市名称解析

## Constitution Check

*GATE: Phase 0 前通过，Phase 1 后复核通过。*

- **MVP 结果优先**: 只解决天气城市错误、裙装误出现和按钮闪光，不扩展持续定位、多城市或复杂性别画像。通过。
- **核心路径正确**: 设置偏好后立即让旧推荐失效，衣橱与推荐使用同一过滤规则。通过。
- **直接而简洁**: 复用现有偏好表、Server Action、天气服务和查询层，不新增状态库或定位 SDK。通过。
- **静态质量门禁**: 计划执行 `npm run check`、`npm run build` 和独立验证脚本。通过。
- **约束内清晰交付**: 中文文档，既有技术栈，服务端鉴权与 RLS 不变。通过。

## Project Structure

### Documentation (this feature)

```text
specs/012-personalized-context/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── personalization-action.md
│   └── weather-resolution.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── globals.css
├── recommendations/{actions.ts,page.tsx}
├── settings/{page.tsx,preferences/{actions.ts,page.tsx}}
└── wardrobe/actions.ts
components/
├── preferences/preference-form.tsx
└── wardrobe/item-form.tsx
lib/
├── auth/viewer.ts
├── recommendations/{constants.ts,data.ts,generator.ts,weather.ts}
├── supabase/database.types.ts
└── wardrobe/{catalog.ts,constants.ts,data.ts,validation.ts}
scripts/verify-sdd-012.mjs
supabase/migrations/20260825*_personalized_context.sql
```

**Structure Decision**: 延续单个 Next.js App Router 项目。页面保持 Server Component，只有偏好表单继续作为 Client Component；数据库读写和外部城市/天气请求均在 Server Action 或服务端模块内。

## Complexity Tracking

无章程偏离，不需要新增复杂度例外。
