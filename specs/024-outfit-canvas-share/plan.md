# Implementation Plan: 穿搭画布与分享卡片

**Branch**: `024-outfit-canvas-share` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

## Summary

本阶段把推荐卡默认视觉从人物参照和 AI 模特图切换为真实衣物自由画布。浏览器使用无第三方依赖的边缘连通纯色背景算法生成透明 PNG，保存到当前私有图片桶；穿搭布局以相对坐标持久化，并用浏览器 Canvas 生成 1080px 分享图。复杂背景保留原图，不阻塞编辑。

## Technical Context

**Language/Version**: TypeScript、React 19、Next.js 16.3.1 App Router

**Primary Dependencies**: 现有 Tailwind CSS 4、shadcn/ui、lucide-react、`@supabase/ssr`、`@supabase/supabase-js`；不新增 npm 依赖

**Storage**: Supabase Postgres 新增 `outfit_canvases`，`wardrobe_items` 新增 `cutout_path`；派生 PNG 复用私有 `wardrobe-images` bucket

**Testing**: Biome、TypeScript、Next build、`scripts/verify-sdd-024.mjs`、双账号 Supabase 验收、390px 浏览器验收

**Target Platform**: 移动端优先 Web，Vercel + 当前 Supabase 项目

**Project Type**: Next.js 全栈 Web 应用

**Performance Goals**: 拖动期间不触发 React 连续重渲染；普通手机上的 768px 固定样本单件本地抠图目标 5 秒内；保存后立即可读；导出图至少 1080px 宽

**Constraints**: 只处理当前用户衣物；不覆盖原图；不新增第三方图片传输；画布 2-8 件；Server Action 内重新鉴权并校验归属；减少动态可用

**Scale/Scope**: 一条推荐最多 3 套，每张画布 2-8 件，个人主页前先支持当前账号最近 24 张画布

## Constitution Check

- **MVP 结果优先**: 用可拖动真实衣物卡片替代不准确模特图，直接解决当前用户痛点。
- **核心路径正确**: 推荐搭配 → 画布编辑 → 本地抠图 → 保存 → 分享 PNG；每一步都可独立失败并保留上一步。
- **直接实现**: 使用浏览器 Pointer Events、Canvas 和现有 Supabase，不引入画布框架或 AGPL 抠图库。
- **静态质量**: 必须通过 `npm run check`、`npm run build` 和独立门禁。
- **安全**: 当前用户身份来自 `auth.getUser()`；RLS 和 Storage 路径双重隔离；客户端不能提交其他账号路径或衣物。
- **中文交付**: SDD、界面和验收说明均使用中文。

设计后复核：新增一张直接数据表和一个可逆派生图片字段即可支撑核心路径，没有引入公共链接、社交关系或外部抠图服务，符合 MVP 和最小授权原则。

## Project Structure

### Documentation

```text
specs/024-outfit-canvas-share/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── outfit-canvas-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
app/outfits/new/page.tsx
app/outfits/[id]/page.tsx
app/outfits/actions.ts
components/outfits/outfit-canvas-editor.tsx
components/outfits/outfit-canvas-preview.tsx
components/recommendations/recommendation-card.tsx
lib/outfits/canvas.ts
lib/outfits/cutout.ts
lib/outfits/data.ts
lib/outfits/validation.ts
lib/wardrobe/data.ts
supabase/migrations/*_outfit_canvas_share.sql
scripts/verify-sdd-024.mjs
```

**Structure Decision**: 页面和数据读取保持 Server Component 默认；自由拖动、本地像素处理和导出隔离在单个 Client Component。布局与校验使用无浏览器依赖的纯函数，便于脚本验收。

## Complexity Tracking

无章程偏离。

