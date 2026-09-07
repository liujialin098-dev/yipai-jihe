# Tasks: 全局衣物贴纸统一

**Input**: Design documents from `/specs/032-sticker-system-rollout/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/ui-contract.md、quickstart.md

**Tests**: 本阶段要求独立静态契约、生产构建和 390px 浏览器视觉/交互复核。

**Organization**: 按用户故事组织，先完成当前衣物贴纸统一，再覆盖原图和历史缺图降级。

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 核对 SDD-032 范围、章程与 SDD-031 既有契约，记录在 `specs/032-sticker-system-rollout/plan.md`
- [x] T002 [P] 在 `package.json` 注册 `verify:sdd-032` 独立质量命令

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 复核 `components/wardrobe/garment-sticker.tsx` 的比例、指针穿透、透明图优先和原图降级合同
- [x] T004 [P] 在 `scripts/verify-sdd-032.mjs` 建立五类入口、上传排除、无写入与退役功能边界

## Phase 3: User Story 1 - 全应用看到一致的衣物贴纸 (Priority: P1)

**Goal**: 首页、详情、日记、收藏和利用率中的当前衣物使用同一材质。

**Independent Test**: 用同一件透明图衣物遍历所有入口，确认白边、纸纹和阴影一致，操作无遮挡。

- [x] T005 [P] [US1] 在 `app/page.tsx` 将首页衣橱预览接入 `GarmentSticker`
- [x] T006 [P] [US1] 在 `app/wardrobe/[id]/page.tsx` 将详情主图接入 `GarmentSticker`
- [x] T007 [US1] 在 `app/diary/page.tsx` 将日记记录与利用率图片接入 `GarmentSticker`
- [x] T008 [US1] 在 `app/diary/new/page.tsx` 和 `components/diary/diary-composer.tsx` 传递并展示 `cutoutUrl`
- [x] T009 [US1] 在 `components/diary/favorites-panel.tsx` 将单品与整套收藏图片接入 `GarmentSticker`

## Phase 4: User Story 2 - 普通照片与缺图稳定降级 (Priority: P2)

**Goal**: 原图纸卡和历史缺图状态在所有新入口中保持正确。

**Independent Test**: 遍历只有原图和已移除衣物，确认图片完整、名称保留且布局不塌陷。

- [x] T010 [US2] 复核 `app/page.tsx`、`app/wardrobe/[id]/page.tsx`、`app/diary/page.tsx`、`components/diary/diary-composer.tsx` 和 `components/diary/favorites-panel.tsx` 的原图与缺图分支
- [x] T011 [US2] 确认 `components/wardrobe/ingestion-workspace.tsx` 继续保留原始照片核对，不接入贴纸装饰

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T012 运行 `npm run check`、`npm run build`、`npm run verify:sdd-032`，按 `specs/032-sticker-system-rollout/quickstart.md` 完成浏览器复核
- [x] T013 更新 `progress.md`、`AGENTS.md` 和 `specs/032-sticker-system-rollout/tasks.md` 的完成状态与验收记录

## Dependencies & Execution Order

- Phase 1 无依赖；Phase 2 依赖 Phase 1。
- US1 依赖 SDD-031 共享组件合同；T005/T006 可并行，日记数据传递与展示按 T007→T008 完成。
- US2 依赖所有新入口接入完成，但不依赖新数据或外部服务。
- Polish 依赖 US1 与 US2 全部完成。

## Implementation Strategy

1. 注册独立门禁并锁定共享组件合同。
2. 先接入首页和详情，再统一日记与收藏。
3. 复核原图、缺图和上传排除边界。
4. 执行自动检查、移动端验收和进度更新。

## Scope Guard

- 不恢复专业抠图、人工精修、自由画布、分享卡片或人物预览。
- 不修改 Supabase 表、RLS、Storage、账号或图片。
- 不把上传确认和识别预览替换为装饰性贴纸。
