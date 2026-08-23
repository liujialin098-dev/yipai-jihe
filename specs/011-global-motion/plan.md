# Implementation Plan: 全局高级动效系统

**Branch**: `011-global-motion` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

## Summary

在现有苹果式冷白银灰视觉上建立一套无新依赖的 CSS 动效语言：页面以柔和气泡光晕扩散和分层显现进入，导航以共享选中气泡切换，按钮/卡片以填充、高光和景深反馈代替弹跳，并为减少动态与减少透明度提供完整降级。

## Technical Context

**Language/Version**: CSS、TypeScript 5、React 19、Next.js 16.3.1  
**Primary Dependencies**: Tailwind CSS 4、现有 Base UI、lucide-react  
**Storage**: N/A  
**Testing**: Biome、TypeScript、Next build、浏览器视觉与 reduced-motion 验收  
**Target Platform**: 现代移动与桌面浏览器  
**Performance Goals**: 交互反馈 <100ms；页面进入 <700ms；只动画合成友好属性  
**Constraints**: 无新动效库；不改变业务行为；长列表限制错峰延迟  
**Scale/Scope**: 全局 CSS、应用壳、底部导航、按钮及现有页面通用类

## Constitution Check

- 只扩展现有 token 和组件，不引入依赖：PASS
- 一套标志性动效加少量通用反馈，避免过度抽象：PASS
- reduced-motion/reduced-transparency 为验收门禁：PASS
- 动效不阻塞核心操作与 P0 数据流：PASS

## Project Structure

```text
app/globals.css
components/
├── app-shell.tsx
├── bottom-navigation.tsx
└── ui/button.tsx
specs/011-global-motion/
```

**Structure Decision**: 动效 token 和绝大多数行为集中在全局 CSS，组件只增加稳定语义类与选中态结构，避免让所有页面变成 Client Component。

