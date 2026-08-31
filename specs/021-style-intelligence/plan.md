# 实施计划：风格智能、品牌识别与本季灵感

**分支标识**：`021-style-intelligence` ｜ **日期**：2026-08-31 ｜ **规格**：[spec.md](spec.md)

## 摘要

在不改变现有衣橱与推荐主链路的前提下扩充风格枚举，为衣物增加可选品牌，更新视觉识别严格契约，并把长期偏好与单次推荐风格接入 AI、规则降级和最终校验。推荐页新增人工维护、带日期与来源的趋势灵感快照，不做运行时抓取。

## 技术上下文

- **语言/版本**：TypeScript 5、React 19、Next.js 16.3.1 App Router。
- **主要依赖**：现有 Supabase SSR、OpenAI Responses API、Tailwind CSS 4、lucide-react；不新增依赖。
- **存储**：Supabase Postgres；`wardrobe_items` 新增可空 `brand`，扩展衣物与反馈事件风格约束；推荐继续存入现有 JSONB。
- **测试**：Biome/TypeScript、Next build、独立 `verify-sdd-021.mjs`、现有推荐与识别回归、390px 浏览器验收。
- **目标平台**：移动端优先 Web，Vercel + 当前 Supabase 项目。
- **性能目标**：不增加额外模型调用；推荐仍保留 15 秒整体目标，识别仍为一次视觉请求。
- **约束**：所有 Server Action 重新验证用户与输入；品牌无可见证据时为空；场景、天气、归属、完整性和跨套不重复优先于风格。
- **规模**：14 个稳定风格、1 个可选品牌字段、3 套推荐、4～6 条趋势快照。

## 章程检查

- MVP 结果优先：通过扩展现有枚举和 JSON 契约完成，不引入内容平台或调度系统。
- 核心路径正确：先更新数据库与统一常量，再更新识别、偏好、推荐和展示。
- 直接实现：趋势目录为类型安全静态数据；不新增表、不抓取网页、不增加模型轮次。
- 静态质量：必须通过 `npm run check`、`npm run build` 与独立验收。
- 安全：品牌与风格继续绑定现有用户所有权 RLS；模型密钥只在服务端。

设计后复核：无章程偏离，不需要复杂度例外。

## 项目结构

```text
app/
├── api/wardrobe/ingestions/[id]/confirm/route.ts
├── recommendations/actions.ts
└── settings/preferences/
components/
├── preferences/preference-form.tsx
├── recommendations/{recommendation-controls,recommendation-card,trend-inspiration}.tsx
└── wardrobe/{ingestion-workspace,item-form}.tsx
lib/
├── recommendations/{constants,generator,rules,style-direction,trend-catalog,validation}.ts
├── wardrobe/{constants,data,recognition,validation}.ts
└── supabase/database.types.ts
supabase/migrations/*_style_intelligence.sql
scripts/verify-sdd-021.mjs
specs/021-style-intelligence/
```

**结构决定**：沿用单体 Next.js App Router；浏览器只负责选择和表单状态，所有持久化与最终合法性判断在服务端。

## 实施顺序

1. 统一扩展风格目录、场景兼容矩阵和品牌验证。
2. 建立可复现数据库迁移并更新生成类型。
3. 更新视觉识别 Schema、提示词、确认入库与编辑展示。
4. 更新偏好问卷、风格分数与推荐临时选择。
5. 让 AI、规则降级和最终校验共用三套风格方向。
6. 增加带来源和有效期的趋势目录及推荐页卡片。
7. 独立验证、回归、更新进度与 AGENTS.md 后提交。

