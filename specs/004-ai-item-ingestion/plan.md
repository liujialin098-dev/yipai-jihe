# 实施计划：原图上传与 AI 识别入库

**功能分支**：`004-ai-item-ingestion` | **日期**：2026-08-21 | **规格**：[spec.md](spec.md)

## 摘要

在现有匿名会话、私有 `wardrobe-images` bucket 和衣橱 CRUD 基础上，增加最多 10 张原图的直接上传、OpenAI 图片识别、结构化结果校验、人工修正与幂等确认入库。未确认内容由 `wardrobe_ingestions` 跟踪并在 24 小时内清理；AI 不可用时保留原图，允许用户手工完成。

技术路径采用浏览器通过 Supabase signed upload 直接写私有 Storage，Next.js Route Handler 负责鉴权、识别与确认。OpenAI 请求仅在服务端发起，使用 Responses API、`store: false` 和严格 JSON Schema；默认模型为 `gpt-4o-mini`，可通过 `OPENAI_VISION_MODEL` 覆盖。

## 技术上下文

**语言/版本**：TypeScript 5、React 19.2.8、Next.js 16.3.1 App Router  
**主要依赖**：现有 `@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3、Tailwind CSS 4、lucide-react；OpenAI 通过原生 `fetch` 调用，不新增 SDK  
**存储**：Supabase Postgres、私有 Storage bucket `wardrobe-images`  
**验证**：`npm run check`、`npm run build`、`npm run verify:sdd-004`、390px 移动视口手工验收  
**目标平台**：移动端优先的现代浏览器、Vercel Preview/Functions  
**项目类型**：单体 Next.js Web 应用  
**性能目标**：单张识别目标 10 秒内显示结果，12 秒服务端超时且 15 秒内进入可重试状态；批量并发最多 3  
**约束**：单张不超过 10MB，仅 jpg/jpeg/png；单批最多 10；AI 密钥只在服务端；临时记录最长 24 小时；匿名用户隔离  
**规模/范围**：一个添加页、4 个入库 API 动作、1 张新表、1 个现有表幂等字段、10 张安全测试图片

## 章程检查

### 设计前门禁

- [x] MVP 结果优先：仅实现“选图 → 识别 → 修正 → 入库”，不加入抠图、推荐和试穿。
- [x] 核心路径正确：单件闭环先于批量；每项状态可结束为成功、失败或手工处理。
- [x] 直接实现：复用现有 Supabase 客户端、常量和校验；不新增 OpenAI SDK 或后台任务框架。
- [x] 静态质量门禁：任务包含 `npm run check` 与 `npm run build`。
- [x] 清晰交付：文档使用中文，UI 复用现有主题 token 与 lucide 图标。
- [x] 安全约束：Route Handler 每次重新鉴权；API Key 不进入客户端；Postgres 和 Storage 都以 `auth.uid()` 隔离。

### 设计后复核

- [x] 新增的 `wardrobe_ingestions` 只承担当前 24 小时工作区和验收日志，不扩展为通用作业系统。
- [x] 批量由客户端以最多 3 并发编排单件 API，不引入队列或常驻服务。
- [x] 确认使用唯一 `source_ingestion_id` 保证重试不重复，不建设额外幂等平台。
- [x] AI 失败保留手工路径，外部服务不成为正式入库的硬依赖。

## 项目结构

### 本功能文档

```text
specs/004-ai-item-ingestion/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ingestion-api.md
│   └── wardrobe-recognition.schema.json
├── checklists/requirements.md
└── tasks.md
```

### 源码变更

```text
app/
├── api/wardrobe/ingestions/
│   ├── route.ts
│   └── [id]/
│       ├── recognize/route.ts
│       ├── confirm/route.ts
│       └── route.ts
└── wardrobe/new/page.tsx
components/wardrobe/
└── ingestion-workspace.tsx
lib/wardrobe/
├── ingestion.ts
├── recognition.ts
└── validation.ts
scripts/
└── verify-sdd-004.mjs
supabase/migrations/
└── 20260821*_ai_item_ingestion.sql
```

**结构决策**：继续使用单体 Next.js App Router。页面负责工作区展示；客户端组件负责文件预览、直接上传和批量状态；Route Handler 负责每次鉴权、签名、AI 调用和确认；Supabase 继续承担持久化和跨会话隔离。

## 数据与请求流程

1. 客户端校验类型、大小和数量，为每张图片生成稳定 `clientRequestId`。
2. `POST /api/wardrobe/ingestions` 验证当前会话和文件元数据，创建或恢复当前用户的入库项目，并返回 2 小时有效的 signed upload token。
3. 浏览器直接调用 Supabase `uploadToSignedUrl`；上传成功后调用识别接口。
4. 识别接口验证所有权和有效期，为私有原图生成短时 signed read URL，在服务端调用 OpenAI Responses API，并把严格校验后的建议、耗时和失败类别写进入库项目。
5. 客户端显示可编辑字段；用户修改后，确认接口再次校验并幂等写入 `wardrobe_items`，随后标记入库项目为 `confirmed`。
6. 取消时先通过 Storage API 删除原图，再删除临时记录；每次进入工作区或创建项目时顺带清理当前用户已过期项目。

## 复杂度跟踪

无章程偏离。
