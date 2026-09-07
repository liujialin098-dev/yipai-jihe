# Implementation Plan: 全局衣物贴纸统一

**Branch**: `master` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/032-sticker-system-rollout/spec.md`

## Summary

复用 SDD-031 的 `GarmentSticker`，把首页衣橱预览、单品详情、日记记录与选衣、利用率和收藏中的衣物图统一为纸贴材质。所有入口继续使用 `WardrobeItem` 已有的原图和透明图签名地址，不新增查询、依赖、存储或服务调用；上传确认仍保留原始照片。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1 App Router

**Primary Dependencies**: Next.js Image、Tailwind CSS 4、现有 `GarmentSticker`；不新增第三方依赖

**Storage**: 只读复用 Supabase 私有图片短期签名地址；无迁移、无写入

**Testing**: Biome/TypeScript、Next.js 生产构建、SDD-032 静态契约、390px 浏览器视觉与交互复核

**Target Platform**: 移动端优先 Web App，320px 及以上现代浏览器

**Project Type**: 现有 Next.js 全栈应用的展示层一致性增量

**Performance Goals**: 不增加图片请求种类和客户端状态；继续使用同地址浏览器缓存与按需加载

**Constraints**: 不触发去背、不改图、不恢复退役功能、不让贴纸遮挡操作、不把上传原图变成装饰图

**Scale/Scope**: 5 类核心入口、5 个页面/组件文件、1 个既有共享组件、1 个独立验证脚本

## Constitution Check

- **MVP 结果优先**: PASS。只统一仍不一致的核心衣物入口。
- **核心路径正确**: PASS。选择、详情、收藏、日记和统计行为保持不变。
- **直接而简洁**: PASS。复用现有组件与数据，不新增抽象层或依赖。
- **静态质量门禁**: PASS。执行 check、build 与 verify:sdd-032。
- **约束内清晰交付**: PASS。中文文档，继续使用既有技术栈和主题规则。
- **安全约束**: PASS。只传递已经授权的短期图片地址，不接触私有路径和密钥。

Phase 1 复核：设计没有引入实体、迁移、接口或客户端凭据，章程门禁继续通过。

## Project Structure

### Documentation (this feature)

```text
specs/032-sticker-system-rollout/
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
app/
├── diary/page.tsx
├── diary/new/page.tsx
├── page.tsx
└── wardrobe/[id]/page.tsx

components/diary/
├── diary-composer.tsx
└── favorites-panel.tsx

scripts/verify-sdd-032.mjs
```

**Structure Decision**: 只替换各入口的图片承载方式，不创建第二套贴纸组件；页面继续负责缺图和交互覆盖层。

## Complexity Tracking

无章程偏离，不需要复杂度例外。
