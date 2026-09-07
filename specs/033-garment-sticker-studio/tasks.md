# Tasks: 衣物贴纸册

**Input**: Design documents from `/specs/033-garment-sticker-studio/`

**Tests**: 独立静态契约、生产构建、既有贴纸回归与 390px 浏览器验收。

## Phase 1: Setup

- [x] T001 固定 SDD-033 规格、研究、数据边界与 API/UI 契约
- [x] T002 [P] 注册 `verify:sdd-033` 独立质量命令

## Phase 2: Foundational

- [x] T003 新增贴纸专用 Route Handler，完成同源、当前用户、UUID 与衣物归属校验
- [x] T004 扩展 `GarmentSticker` 的显式 loose 表面，不改变现有默认 card 外观
- [x] T005 [P] 建立 SDD-033 静态门禁，覆盖账号边界、用户触发、最大数量和退役功能排除

## Phase 3: User Story 1 - 挑选今天的衣物贴纸

- [x] T006 [US1] 新增 `/stickers` 服务端页面，读取当前可见衣物和当前账号单品收藏
- [x] T007 [US1] 实现来源切换、1～8 件选择、当天本地恢复和无效 ID 清理
- [x] T008 [US1] 实现浅丁香贴纸板、固定自然排布、空状态和已有贴纸即时预览

## Phase 4: User Story 2 - 生成白边衣物贴纸

- [x] T009 [US2] 实现待生成识别、逐件处理进度、安全错误映射和失败重试
- [x] T010 [US2] 生成成功后即时切换透明贴纸，并保持原图安全降级
- [x] T011 [US2] 在首页和日记增加贴纸册入口，不改变底部五项导航

## Phase 5: Polish

- [x] T012 运行 `npm run check`、`npm run build`、`npm run verify:sdd-033` 和 SDD-031 回归
- [x] T013 按 quickstart 完成 390px 浏览器验收
- [x] T014 更新 `progress.md`、`AGENTS.md` 和任务状态并提交

## Scope Guard

- 不新增数据库表或迁移。
- 不恢复自由拖拽、分享卡片、虚拟人物、Reel、转盘或统计。
- 不自动调用第三方去背；仅处理用户明确选择并点击生成的当前账号衣物。
