# Implementation Plan: 贴纸画板与月历

## Summary

把现有 `/stickers` 固定自动排布升级为同页双视图。画板视图复用当天选择和专业贴纸生成，新增无格子自由拖动、缩放、旋转、重叠层级、恢复排布、五种品牌底色、下载和系统分享。月历视图复用当前账号穿搭日记与单品收藏，按月派生每日代表衣物和三项摘要，不新增数据库事实。

## Technical Context

- Next.js 16.3.1 App Router、React 19、TypeScript
- Supabase Auth、Postgres 与私有 Storage；只读取现有 RLS 保护的数据
- 浏览器 Pointer Events、Canvas 2D、Web Share 与 `localStorage`
- Tailwind CSS 4、lucide-react、既有四色视觉 token 与 `GarmentSticker`
- 不新增 npm 依赖，不新增数据库迁移

## Constitution Check

- MVP 结果：通过，围绕编辑、导出、月历三条独立可验收链路。
- 核心路径：通过，先完成画板和导出，再接月历统计。
- 直接实现：通过，复用既有画布算法与日记数据，不引入拖拽框架或新表。
- 安全边界：通过，客户端只消费当前页面签名图；月历查询继续按当前用户 RLS。
- 静态门禁：通过，新增 SDD-034 独立验证并回归 SDD-033/009。

## Project Structure

```text
app/stickers/page.tsx
components/stickers/sticker-studio.tsx
components/stickers/sticker-canvas.tsx
components/stickers/sticker-month-calendar.tsx
lib/stickers/canvas.ts
lib/stickers/export.ts
app/globals.css
scripts/verify-sdd-034.mjs
specs/034-sticker-canvas-calendar/
```

## Delivery Strategy

1. 建立贴纸专用画布状态、边界和 PNG 导出工具。
2. 将固定贴纸板替换为自由画板，并保留现有选择与专业生成链路。
3. 增加画板/月历视图、月份数据和视觉统计。
4. 完成静态门禁、构建、移动端交互、文档和提交。

## Risk Controls

- 手势冲突：画板外正常滚动，只有贴纸本身 `touch-action: none`；使用 pointer capture。
- 布局损坏：读取本地状态时逐字段校验、限幅并与可见衣物取交集。
- 图片失败：导出前要求全部透明贴纸就绪，任何图片加载失败则终止且不下载残图。
- 数据串号：月份查询继续使用当前会话和现有 RLS，客户端不提交用户 ID。
- 统计误导：只计算真实日记，未来或空白日期不补造。

## Post-design Constitution Check

无章程冲突。参考产品仅提供能力启发，最终信息架构、配色和命名保持衣拍即合独立风格。
