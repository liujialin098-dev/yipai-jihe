# Implementation Plan: 衣物纸贴质感

**Branch**: `master` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/031-garment-sticker-finish/spec.md`

## Summary

在不修改衣物图片和数据的前提下，新增一个可复用的衣物贴纸展示组件。组件优先使用已有透明图，通过同图白色轮廓层、真实衣物层、低对比度纸纹和带丁香紫调的柔和阴影建立层次；只有原图时使用圆角纸卡降级。首批接入衣橱列表、每日推荐单品和换件候选，保留所有现有交互。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1 App Router

**Primary Dependencies**: Next.js Image、Tailwind CSS 4、现有 shadcn/ui 与项目主题 token；不新增第三方依赖

**Storage**: 复用 Supabase 私有衣物原图和已有透明图签名地址；无数据结构变化

**Testing**: Biome/TypeScript 静态检查、Next.js 生产构建、SDD-031 静态契约脚本、390px 浏览器视觉验收

**Target Platform**: 移动端优先 Web App，320px 及以上现代浏览器

**Project Type**: Next.js 全栈 Web 应用中的展示层增量

**Performance Goals**: 同一张图片依赖浏览器缓存复用；列表滚动保持顺畅，不增加网络 API 请求

**Constraints**: 不修改图片文件，不新增抠图调用，不恢复自由画布/分享卡片/人物预览，不暴露私有路径，不使用纯黑重阴影或高对比纹理

**Scale/Scope**: 1 个共享视觉组件、3 个现有衣物展示入口、1 组全局材质样式、1 个独立验证脚本

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: PASS。只覆盖衣橱与推荐核心图片，不扩展编辑器或数据模型。
- **核心路径正确**: PASS。详情、收藏、换件等行为不变，只有图片承载层变化。
- **直接而简洁**: PASS。复用现有图片地址和 CSS 能力，不新增依赖或服务。
- **静态质量门禁**: PASS。实现后执行 `npm run check`、`npm run build` 和 `npm run verify:sdd-031`。
- **约束内清晰交付**: PASS。中文文档，继续使用现有 Next.js、Tailwind 与主题 token。
- **安全约束**: PASS。组件只接收既有签名地址，不读取路径、不修改 Supabase 权限。

Phase 1 复核：设计没有引入新存储、外部接口或客户端密钥，全部门禁继续通过。

## Project Structure

### Documentation (this feature)

```text
specs/031-garment-sticker-finish/
├── checklists/requirements.md
├── contracts/ui-contract.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
components/
├── recommendations/
│   ├── recommendation-card.tsx
│   └── replace-item-panel.tsx
└── wardrobe/
    ├── garment-sticker.tsx
    └── item-card.tsx

app/
└── globals.css

scripts/
└── verify-sdd-031.mjs
```

**Structure Decision**: 将视觉规则集中在 `components/wardrobe/garment-sticker.tsx`，由衣橱和推荐入口复用；材质参数放入 `app/globals.css`，避免多个页面各自复制阴影和纹理。

## Complexity Tracking

无章程偏离，不需要复杂度例外。
