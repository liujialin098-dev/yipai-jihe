# Implementation Plan: 活力视觉与专业自动去背

**Branch**: `026-vibrant-auto-cutout` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

## Summary

本阶段把应用背景升级为丁香紫主舞台与青柠、珊瑚、天空蓝功能高光，并在现有私有衣物图片链路上接入 PhotoRoom Remove Background Basic API。衣物确认响应完成后使用 Next.js `after()` 异步生成经过边缘分割和透明裁边的 PNG；失败保留原图或旧透明图。现有无人物画布继续自由拖动、旋转、缩放和分层，不显示网格；新布局按衣物品类给出合理初始尺寸，并新增基于原图像素的人工擦除/恢复精修工具。

## Technical Context

**Language/Version**: TypeScript、React 19、Next.js 16.3.1 App Router

**Primary Dependencies**: 现有 Tailwind CSS 4、shadcn/ui、lucide-react、`@supabase/ssr`、`@supabase/supabase-js`；PhotoRoom HTTPS API；新增 `sharp` 仅用于服务端透明图验证与自动裁边

**Storage**: 复用 Supabase `wardrobe_items.image_path`、`cutout_path` 与私有 `wardrobe-images` bucket；不新增表和迁移

**Testing**: Biome、TypeScript、Next build、`scripts/verify-sdd-026.mjs`、PhotoRoom mock/可选真实样本、390px 浏览器验收

**Target Platform**: 移动端优先 Web，Vercel + 当前 Supabase 项目

**Project Type**: Next.js 全栈 Web 应用

**Performance Goals**: 衣物确认响应不等待去背；单张 PhotoRoom 调用设 20 秒超时；画布拖动维持连续反馈；人工画笔只处理当前编辑图

**Constraints**: PhotoRoom 密钥仅服务端；只处理当前 `auth.getUser()` 账号衣物；输入最大 10MB；原图永不覆盖；新结果成功验证并保存后才绑定；无密钥或服务失败时功能可降级

**Scale/Scope**: 新衣单批最多 10 件并行入库后各自异步处理；历史衣物按需单件重做；画布 2-8 件、六种衣物品类

## Constitution Check

- **MVP 结果优先**: 直接解决灰色背景和衣物卡片边缘质量问题，新闻推送留给独立 SDD-027。
- **核心路径正确**: 原图入库 → 异步专业去背 → 私有透明图 → 无格子画布 → 人工精修 → 保存/分享；任何派生步骤失败都不破坏原图。
- **直接实现**: 复用现有 `cutout_path`、私有 bucket、原生 Canvas 与 Pointer Events，不新增图像框架或处理队列表。
- **静态质量**: 必须通过 `npm run check`、`npm run build` 和 SDD-026 独立门禁。
- **安全**: Route Handler/Server Action 内部重新鉴权和校验归属；第三方密钥、原始路径和服务错误不得暴露到浏览器。
- **中文交付**: SDD、界面状态和验收说明均使用中文。

设计后复核：外部 API 是实现复杂背景高质量去背的必要依赖，用户已明确同意第三方处理与按次成本。数据模型复用现有字段，人工精修沿用浏览器 Canvas，未引入额外持久化状态，符合 MVP 最小复杂度。

## Project Structure

### Documentation

```text
specs/026-vibrant-auto-cutout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── professional-cutout.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
app/api/wardrobe/items/[id]/cutout/route.ts
app/api/wardrobe/ingestions/[id]/confirm/route.ts
app/outfits/actions.ts
app/globals.css
components/outfits/cutout-refiner.tsx
components/outfits/outfit-canvas-editor.tsx
components/outfits/outfit-canvas-preview.tsx
components/recommendations/recommendation-card.tsx
components/wardrobe/ingestion-workspace.tsx
lib/outfits/canvas.ts
lib/outfits/professional-cutout.ts
scripts/verify-sdd-026.mjs
.env.example
```

**Structure Decision**: PhotoRoom 传输、输入验证和 Supabase 私有文件替换集中在服务端模块与 Route Handler；交互式像素精修只在 Client Component；全局色彩延续现有 CSS token。确认入库 Route Handler 用稳定的 `after()` 延长 Vercel Function 生命周期，不阻塞响应。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 将单件原图发送给外部 PhotoRoom API | 复杂背景、浅色主体和细小配饰需要专业分割质量 | 现有边缘连通算法只适合纯色背景，无法达到用户要求的稳定卡片质量 |
