# 实施计划：虚拟模特与分层穿搭

**分支标识**：`022-virtual-lookbook-layers` ｜ **日期**：2026-08-31 ｜ **规格**：[spec.md](spec.md)

## 摘要

扩展现有推荐 JSON 契约，使每套支持最多 7 件衣物并从分类稳定派生内搭、主上装、外套、下装/连衣裙、鞋和配饰角色。推荐卡保留真实衣物拼图，并增加按单套触发的虚拟模特 Lookbook；成功图写入账号私有 Storage 并缓存，失败不影响推荐主链路。

## 技术上下文

- **语言/版本**：TypeScript 5、React 19、Next.js 16.3.1 App Router。
- **主要依赖**：现有 Supabase SSR、OpenAI Image API、Tailwind CSS 4、lucide-react；不新增 npm 依赖。
- **存储**：现有 `daily_recommendations.outfits` JSONB 和私有 `wardrobe-images` bucket；不新增表或迁移。
- **测试**：Biome/TypeScript、Next build、独立 `verify-sdd-022.mjs`、推荐硬约束回归、390px 浏览器验收。
- **目标平台**：移动端优先 Web，Vercel + 当前 Supabase 项目。
- **性能目标**：普通推荐仍在 15 秒目标内；图片仅单套按需调用，完成目标 60 秒内，缓存命中不调用模型。
- **约束**：Server Action 必须重验身份和所有权；密钥仅服务端；图片路径必须归属当前用户；图像失败不得改变推荐。
- **规模**：每次推荐 3 套、每套 3～7 件、每套最多 1 张缓存 Lookbook。

## 章程检查

- MVP 结果优先：按需生成单张效果图，不建设批处理、人物编辑器或任务队列。
- 核心路径正确：先保证分层推荐和真实单品可用，再叠加可失败的图像能力。
- 直接实现：复用现有 JSONB 与私有 bucket，不新增数据库抽象或供应商。
- 静态质量：必须通过 `npm run check`、`npm run build`、独立验收和既有推荐回归。
- 安全：所有读写绑定 `auth.getUser()` 和用户路径；浏览器不接收密钥或私有路径。

设计后复核：无章程偏离，不需要复杂度例外。

## 项目结构

```text
app/recommendations/
├── actions.ts
└── page.tsx
components/recommendations/
├── lookbook-generator.tsx
└── recommendation-card.tsx
lib/openai/
├── images.ts
└── responses.ts
lib/recommendations/
├── constants.ts
├── layers.ts
├── lookbook.ts
├── generator.ts
├── rules.ts
├── validation.ts
└── data.ts
public/virtual-models/neutral-studio.png
scripts/verify-sdd-022.mjs
specs/022-virtual-lookbook-layers/
```

**结构决定**：沿用单体 App Router。页面为 Server Component；按钮状态放在小型 Client Component；图像调用、Storage 上传和 JSON 更新全部留在 Server Action 与服务端库。

## 实施顺序

1. 建立层次角色派生和新推荐数量边界。
2. 更新 AI 提示、规则降级、最终校验与换件失效逻辑。
3. 建立服务端图像生成传输、提示构造和私有路径校验。
4. 增加按单套生成 Action、私有上传、缓存读取与签名 URL。
5. 重构推荐卡：效果图区、角色标签、真实衣物清单和降级说明。
6. 增加独立门禁并回归 SDD-005/014/017/021。
7. 更新进度与开发说明后提交；本阶段不自动部署。

