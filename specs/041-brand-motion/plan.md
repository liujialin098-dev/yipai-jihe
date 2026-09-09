# Implementation Plan: SDD-041 品牌开屏与加载动效

**Branch**: `041-brand-motion` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/041-brand-motion/spec.md`

## Summary

用户最终批准衣服→E方案：本地SVG同构路径插值，外轮廓与两个青柠色块同步变化，固定双色、连续曲线、无收尾换图。文字和退出仍使用CSS transform/opacity；根布局开屏、loading.tsx及会话返回复用共享组件。900ms单次形变，3.2秒往返加载，无泡泡、光晕、扫光；正式PNG仅用于减少动态静态降级。不新增依赖、业务请求或业务状态。

## Technical Context

**Language/Version**: TypeScript 5、CSS、React 19.2.8

**Primary Dependencies**: Next.js 16.3.1 App Router、现有 `next/image`、现有本地 Fredoka/ZCOOL 字体

**Storage**: N/A；不新增持久化数据，开屏生命周期仅由根布局挂载范围决定

**Testing**: Node 固定源码门禁、Biome/TypeScript、Next.js production build、本地浏览器视觉与减少动态复核

**Target Platform**: 移动优先的现代 Web 浏览器，320px 起，兼容桌面与横屏

**Project Type**: 单体 Next.js Web 应用

**Performance Goals**: 图标采用小型SVG几何形变，其余仅transform/opacity；不产生布局抖动；标准开屏1.5秒内退出，页面加载延迟120ms显示

**Constraints**: 复用正式 PNG 与既有色彩/字体 token；无新依赖、无网络请求、无音频/振动；减少动态关闭位移与循环

**Scale/Scope**: 1 个共享品牌动效组件、1 个开屏壳层、2 个现有加载入口与相关样式/门禁

## Constitution Check

- **MVP 结果优先**：PASS。只覆盖用户明确提出的开屏与页面级加载，不扩展原生启动页或营销视频。
- **核心路径正确**：PASS。动效为展示层，退出后不改变页面、导航、会话或业务数据。
- **直接而简洁**：PASS。采用浏览器原生 CSS 动画和现有品牌资源，不引入 Motion/GSAP 或新服务。
- **静态质量门禁**：PASS。计划执行 `npm run check`、`npm run build` 与独立 SDD-041 门禁。
- **约束内清晰交付**：PASS。中文文档，复用现有 Next.js/React/Tailwind 与无障碍规则。
- **安全约束**：PASS。无密钥、网络、数据库、Storage 或账号权限变更。

Phase 1 设计复核：仍为 PASS。组件契约只包含显示变体和文案，不新增持久状态或外部接口。

## Project Structure

### Documentation (this feature)

```text
specs/041-brand-motion/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── globals.css
├── layout.tsx
└── loading.tsx
components/
├── brand-motion.tsx
└── session-bootstrap.tsx
scripts/
└── verify-sdd-041.mjs
```

**Structure Decision**: 保持当前单体 App Router 结构。共享视觉放在 `components/brand-motion.tsx`，根布局和现有加载边界仅负责装配；所有运动规则集中在现有 `app/globals.css`，避免平行样式系统。

## Complexity Tracking

无章程偏离，不需要复杂度豁免。
