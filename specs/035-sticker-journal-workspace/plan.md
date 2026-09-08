# Implementation Plan: 贴纸日记工作台

**Branch**: `main` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

## Summary

在现有贴纸能力上完成一轮面向移动端的核心体验升级：修复贴纸层级顺序，增加非破坏式裁切和四角缩放/旋转控制；重排上下导航，使贴纸成为底部中央主入口；把贴纸贯穿日记、收藏与利用率，日记默认展示完整月历，利用率展示最近 30 天真实穿着单品贴纸墙。实现复用现有 Next.js、Supabase、私有衣物图片和贴纸导出链路，不新增第三方依赖或数据库迁移。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1 App Router

**Primary Dependencies**: Tailwind CSS 4、lucide-react、Supabase SSR、Sharp 0.34

**Storage**: Supabase PostgreSQL/私有 Storage；浏览器 localStorage 保存未提交画板

**Testing**: Biome/TypeScript、Next.js production build、独立 `verify:sdd-035`、390px 与横屏浏览器验收

**Target Platform**: 移动优先 Web/PWA，兼容桌面浏览器

**Project Type**: 单体 Next.js Web 应用

**Performance Goals**: 单画板 2～24 件衣物时拖动、缩放、旋转保持即时反馈；导出仍为 1080×1350 PNG

**Constraints**: 不伪造日记或统计数据；不暴露私有图片路径；触控热区至少 44px；未来日期只读；无格子、允许重叠

**Scale/Scope**: 贴纸编辑器、顶部/底部导航、日记月历、收藏入口、利用率贴纸墙及对应静态门禁

## Constitution Check

- [x] 每个阶段为独立 Spec Kit SDD 单元，边界仅覆盖贴纸日记体验。
- [x] 复用现有技术栈，不新增依赖，不提前引入数据库结构。
- [x] 所有展示数据来自当前账号现有衣物、收藏和日记，保持账号隔离。
- [x] 贴纸图片继续走当前用户私有签名地址，导出不包含私有字段。
- [x] 移动端交互提供可见控件、键盘/按钮降级与至少 44px 触控区。
- [x] 完成后更新 `progress.md`、`AGENTS.md` 并运行项目质量门禁。

## Project Structure

### Documentation

```text
specs/035-sticker-journal-workspace/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── state-contract.md
│   └── ui-contract.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
app/
├── diary/page.tsx
└── globals.css
components/
├── bottom-navigation.tsx
├── status-header.tsx
├── diary/
│   ├── diary-sticker-calendar.tsx
│   └── utilization-sticker-wall.tsx
└── stickers/sticker-canvas.tsx
lib/
├── diary/data.ts
└── stickers/
    ├── canvas.ts
    └── export.ts
scripts/verify-sdd-035.mjs
```

**Structure Decision**: 继续使用现有 App Router 单体结构；可复用的数据规则放入 `lib/`，状态型编辑器留在客户端组件，日记与统计由服务端读取真实账号数据后渲染。

## Complexity Tracking

无章程例外。
