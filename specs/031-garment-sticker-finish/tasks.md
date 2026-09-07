# Tasks: 衣物纸贴质感

**Input**: Design documents from `/specs/031-garment-sticker-finish/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/ui-contract.md、quickstart.md

**Tests**: 本阶段要求独立静态契约脚本、生产构建和 390px 浏览器视觉验收。

**Organization**: 任务按用户故事组织，每个故事均可独立验收。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 锁定范围并准备独立验收入口。

- [x] T001 核对 SDD-031 规格、视觉边界与现有衣物数据输入，记录在 `specs/031-garment-sticker-finish/plan.md`
- [x] T002 [P] 在 `package.json` 注册 `verify:sdd-031` 独立质量命令

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立透明图与原图都能复用的单一展示组件。

- [x] T003 在 `components/wardrobe/garment-sticker.tsx` 实现 cutout/photo/missing 三态共享组件
- [x] T004 在 `app/globals.css` 实现白色轮廓、带紫调轻阴影、低对比纸纹和减少动态/透明度降级

**Checkpoint**: 共享贴纸组件可由任何现有衣物图片入口直接复用。

---

## Phase 3: User Story 1 - 衣物像真实纸质贴纸 (Priority: P1)

**Goal**: 透明衣物在衣橱和推荐中拥有一致的白边、阴影与纸张质感，且不改变衣物本身。

**Independent Test**: 使用已有透明图分别查看衣橱卡片、推荐单品和换件候选，确认材质一致且交互无遮挡。

- [x] T005 [US1] 在 `components/wardrobe/item-card.tsx` 接入共享贴纸组件并优先使用当前衣物透明图
- [x] T006 [US1] 在 `components/recommendations/recommendation-card.tsx` 接入共享贴纸组件并保留角色标签与收藏按钮
- [x] T007 [US1] 在 `components/recommendations/replace-item-panel.tsx` 接入共享贴纸组件并保留提交状态

**Checkpoint**: 透明图衣物在三个核心入口均呈现统一纸贴材质。

---

## Phase 4: User Story 2 - 原图优雅降级 (Priority: P2)

**Goal**: 没有透明图的衣物以完整圆角纸卡展示，不出现错误外轮廓。

**Independent Test**: 使用只有原图和完全缺图的衣物核对三个入口，确认原图完整、占位不变、布局不塌陷。

- [x] T008 [US2] 在 `components/wardrobe/garment-sticker.tsx` 与三个调用方复核原图圆角纸卡和缺图回退边界

**Checkpoint**: 混合透明图和原图的列表保持统一，所有缺图状态仍可读。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 固化视觉、安全和交付边界。

- [x] T009 [P] 在 `scripts/verify-sdd-031.mjs` 覆盖共享组件、三态、三个入口、无数据写入、无退役功能恢复和可访问性边界
- [x] T010 运行 `npm run check`、`npm run build`、`npm run verify:sdd-031`，按 `specs/031-garment-sticker-finish/quickstart.md` 完成浏览器复核并更新 `progress.md`、`AGENTS.md` 和本任务清单

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 无依赖。
- Phase 2 依赖 Phase 1，并阻塞所有用户故事。
- US1 依赖共享组件和材质样式。
- US2 依赖同一组件，但不依赖任何新数据或第三方服务。
- Polish 依赖 US1、US2 完成。

### Parallel Opportunities

- T002 可与规格复核并行。
- T009 可在组件契约确定后与文档复核并行，但最终断言必须匹配实现。

## Implementation Strategy

### MVP First

1. 建立共享贴纸组件与全局材质。
2. 接入衣橱卡片，先验证透明图白边和原图降级。
3. 接入推荐单品与换件候选。
4. 执行自动与移动端视觉验收。

### Scope Guard

- 不恢复自由画布、分享卡片、专业抠图按钮或虚拟人物。
- 不新增数据库迁移、环境变量、图片写入或外部 API。
- 不修改衣物真实像素、颜色或款式。
