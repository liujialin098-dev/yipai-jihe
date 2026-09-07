# Tasks: 贴纸画板与月历

**Input**: Design documents from `/specs/034-sticker-canvas-calendar/`

**Tests**: 独立静态契约、生产构建、SDD-033/009 回归与 390px 浏览器验收。

## Phase 1: Setup

- [x] T001 固定 SDD-034 规格、研究、数据边界、UI 与导出契约于 `specs/034-sticker-canvas-calendar/`
- [x] T002 [P] 注册 `verify:sdd-034` 质量命令于 `package.json`

## Phase 2: Foundational

- [x] T003 [P] 建立贴纸画布类型、初始布局、限幅和层级工具于 `lib/stickers/canvas.ts`
- [x] T004 [P] 建立 1080×1350 PNG 导出工具于 `lib/stickers/export.ts`
- [x] T005 [P] 建立 SDD-034 静态门禁于 `scripts/verify-sdd-034.mjs`

## Phase 3: User Story 1 - 自由制作贴纸画板

- [x] T006 [US1] 实现 Pointer Events 拖动、键盘方向键和本地布局恢复于 `components/stickers/sticker-canvas.tsx`
- [x] T007 [US1] 实现缩放、旋转、四向微调、置顶置底和恢复排布于 `components/stickers/sticker-canvas.tsx`
- [x] T008 [US1] 将贴纸选择与专业生成结果接入自由画板于 `components/stickers/sticker-studio.tsx`
- [x] T009 [US1] 增加无格子画板、浅色/深色主题、对应选中态和减少动态样式于 `app/globals.css`

## Phase 4: User Story 2 - 下载或分享贴纸成品

- [x] T010 [US2] 实现独立下载、原生分享和下载降级于 `components/stickers/sticker-canvas.tsx`
- [x] T011 [US2] 验证透明贴纸就绪、图片失败和隐私字段排除于 `scripts/verify-sdd-034.mjs`

## Phase 5: User Story 3 - 查看每月贴纸日历

- [x] T012 [US3] 在 `app/stickers/page.tsx` 读取当前账号月份日记并派生收藏优先代表衣物
- [x] T013 [US3] 实现月份导航、七列日历、每日贴纸与统计摘要于 `components/stickers/sticker-month-calendar.tsx`
- [x] T014 [US3] 在 `components/stickers/sticker-studio.tsx` 增加画板/月历视图且保持画板状态

## Phase 6: Polish

- [x] T015 运行 `npm run check`、`npm run build`、`npm run verify:sdd-034`、SDD-033 与 SDD-009 回归
- [x] T016 按 `specs/034-sticker-canvas-calendar/quickstart.md` 完成 390px 浏览器核心验收；真实透明贴纸下载/系统分享保留为 Production 复验项
- [x] T017 更新 `progress.md`、`AGENTS.md` 和 `specs/034-sticker-canvas-calendar/tasks.md` 并提交

## Dependencies

- US1 依赖 T003；US2 依赖 US1 与 T004；US3 可在 T003 后并行开发。
- MVP 首先完成 US1 + US2；US3 为同阶段可独立验收的统计扩展。

## Scope Guard

- 不新增数据库表或迁移，不恢复旧公开穿搭画布入口。
- 不加入 Reel、视频、MP4、直播、转盘、烟花播放或公开社交发布。
- 不自动调用第三方去背；仍只处理用户明确选择并点击生成的当前账号衣物。
