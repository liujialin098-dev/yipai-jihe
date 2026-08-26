# Implementation Plan: 自然化文字排版

**Branch**: `015-natural-typography` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

## Summary

在不改变信息架构和业务流程的前提下，对现有 UI 做保留式排版演进。通过全局语义排版 token 收敛字号、字重、字距和行高；去掉重复蓝色眉题、超大计数和宣传式句子；让 AI 只作为来源信息出现。

## Technical Context

**Language/Version**: CSS、TypeScript 5、React 19、Next.js 16.3.1  
**Primary Dependencies**: Tailwind CSS 4、现有 shadcn/ui、lucide-react  
**Storage**: N/A  
**Testing**: Biome、TypeScript、Next build、静态排版门禁、390px 浏览器视觉验收  
**Target Platform**: 移动端优先的现代浏览器  
**Constraints**: 不新增字体或依赖；不改路由、数据和表单；延续现有动效与无障碍降级  
**Scale/Scope**: 全局排版 CSS、8 个核心页面、详情与通用状态组件

## Design Read

这是面向日常穿搭用户的移动端生活工具。保留冷白、轻盈、接近 Apple 的视觉语言，采用变化度 5、动效 4、信息密度 4 的克制演进。

## Constitution Check

- 使用现有系统字体栈和主题 token，不引入依赖：PASS
- 只调整视觉层级和文字表达，不改变业务边界：PASS
- 核心页面共用少量语义类，避免逐页复制任意字号：PASS
- 保持移动端可读性、焦点状态和 reduced-motion 行为：PASS

## Project Structure

```text
app/globals.css
app/
├── page.tsx
├── wardrobe/
├── recommendations/
├── favorites/
├── settings/
└── login/
components/
├── empty-state.tsx
├── status-header.tsx
├── recommendations/recommendation-card.tsx
└── wardrobe/ingestion-workspace.tsx
scripts/verify-sdd-015.mjs
specs/015-natural-typography/
```

**Structure Decision**: 全局 CSS 只保存真正跨页面的语义排版 token；页面继续用 Tailwind 管理局部布局。无需新增 Client Component 或数据层代码。
