# Implementation Plan: 衣物贴纸册

## Summary

新增独立 `/stickers` 页面，将活跃衣橱与当前账号单品收藏汇合为可选择的当天贴纸册。客户端负责当天选择、来源切换、即时预览和逐件进度；服务端新增贴纸专用 POST Route Handler，重新鉴权后复用既有百度专业去背与私有透明图保存流程。共享 `GarmentSticker` 增加无矩形底板的 loose 形态，用于自由散落感的白边贴纸板。

## Technical Context

- Next.js 16.3.1 App Router、React 19、TypeScript
- Supabase Auth、Postgres、私有 Storage；继续使用现有 RLS 和 `wardrobe_items.cutout_path`
- Sharp 0.34.5 服务端透明通道验证、裁边和留白
- 百度智能云智能抠图，仅由服务端读取双密钥
- Tailwind CSS 4、lucide-react、既有四色视觉 token

## Constitution Check

- 独立 SDD：通过，目录为 `specs/033-garment-sticker-studio/`。
- 先核心后拓展：通过，仅实现选择、生成和贴纸板；不实现分享、视频、统计和自由拖拽。
- 账号隔离：通过，Route Handler 使用 `auth.getUser()`，只接收衣物 ID。
- 私有图片：通过，继续写入当前用户私有 `wardrobe-images` 路径并返回短期签名地址。
- 可验证：通过，增加静态门禁、构建、既有贴纸回归和 390px 浏览器验收。

## Project Structure

```text
app/stickers/page.tsx
app/stickers/loading.tsx
app/api/stickers/items/[id]/route.ts
components/stickers/sticker-studio.tsx
components/wardrobe/garment-sticker.tsx
app/globals.css
scripts/verify-sdd-033.mjs
```

## Delivery Strategy

1. 先完成服务端页面数据和专用鉴权接口。
2. 再完成客户端选择、当天本地恢复、贴纸板和处理进度。
3. 扩展共享贴纸组件的 loose 形态，不改变现有默认外观。
4. 补首页与日记入口、静态门禁、移动端验收和进度文档。

## Risk Controls

- 外部服务失败：原图保留，错误可重试，503 后停止继续排队避免重复消耗。
- 请求滥用：同源检查、用户鉴权、UUID 校验、当前用户活跃衣物查询。
- 数据串号：客户端不传 userId、image_path、cutout_path；所有归属由服务端派生。
- 长任务：已有透明图跳过；缺失项串行处理并逐件反馈，最多 8 件。
- 视觉回归：`surface="loose"` 为显式可选，默认仍是现有 card 材质。
