# Tasks: 穿搭画布与分享卡片

**Input**: `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

## Phase 1: Setup

**Purpose**: 建立独立 SDD 门禁和迁移骨架。

- [x] T001 在 `scripts/verify-sdd-024.mjs` 建立规格文件、无人物主路径、画布边界与本地抠图的失败门禁
- [x] T002 在 `package.json` 增加 `verify:sdd-024` 命令
- [x] T003 在 `supabase/migrations/*_outfit_canvas_share.sql` 创建 SDD-024 迁移文件

## Phase 2: Foundational

**Purpose**: 建立画布数据、抠图路径和共享校验基础。

- [x] T004 在 `supabase/migrations/*_outfit_canvas_share.sql` 增加 `wardrobe_items.cutout_path`、`outfit_canvases`、约束、索引、最小授权和四类用户所有权 RLS
- [x] T005 [P] 在 `lib/outfits/canvas.ts` 定义主题、初始相对布局、变换边界和纯函数
- [x] T006 [P] 在 `lib/outfits/validation.ts` 实现标题、主题、2-8 件衣物、唯一 ID、有限数值和变换范围校验
- [x] T007 在 `lib/supabase/database.types.ts` 更新 SDD-024 数据库类型，并在 `lib/wardrobe/data.ts` 增加私有 `cutoutUrl` 签名读取与原图回退

## Phase 3: User Story 1 - 真实衣物自由画布 (Priority: P1)

**Goal**: 从推荐进入无人物画布，稳定完成拖动和变换。

**Independent Test**: 3-7 件推荐全部使用真实衣物，拖动、缩放、旋转、层级、移除和重置可独立工作。

- [x] T008 [P] [US1] 在 `lib/outfits/data.ts` 实现当前用户推荐来源读取、已保存画布读取和衣物签名地址组装
- [x] T009 [P] [US1] 在 `components/outfits/outfit-canvas-preview.tsx` 实现可复用的无人物只读布局预览
- [x] T010 [US1] 在 `components/outfits/outfit-canvas-editor.tsx` 实现 Pointer Events 拖动、离散缩放/旋转/层级/移除/重置和减少动态降级
- [x] T011 [US1] 在 `app/outfits/new/page.tsx` 和 `app/outfits/[id]/page.tsx` 建立新建与重开页面，处理无效来源和空状态
- [x] T012 [US1] 在 `components/recommendations/recommendation-card.tsx` 将默认人物预览替换为衣物画布预览和“编辑穿搭卡片”入口

## Phase 4: User Story 2 - 设备本地抠图 (Priority: P1)

**Goal**: 对纯色棚拍图生成可复用透明派生图，复杂图安全回退原图。

**Independent Test**: 固定纯色、透明和复杂背景样本分别得到透明结果、原样复用和明确失败回退。

- [x] T013 [P] [US2] 在 `lib/outfits/cutout.ts` 实现背景估计、边缘连通移除、羽化、透明图短路和复杂背景置信度拒绝
- [x] T014 [US2] 在 `components/outfits/outfit-canvas-editor.tsx` 接入浏览器像素处理、私有 PNG upsert、进度和失败回退
- [x] T015 [US2] 在 `app/outfits/actions.ts` 实现当前用户衣物归属与严格路径校验后的 `saveWardrobeCutout`
- [x] T016 [US2] 在 `app/wardrobe/actions.ts` 补充删除真实衣物时清理对应抠图派生文件，不影响原有演示和入库边界

## Phase 5: User Story 3 - 保存与分享卡片 (Priority: P2)

**Goal**: 保存布局并导出可分享 PNG。

**Independent Test**: 保存刷新后布局 100% 一致；导出 1080×1350 PNG，全部衣物出现且无账号私密信息。

- [x] T017 [US3] 在 `app/outfits/actions.ts` 实现重新鉴权、衣物归属复验、insert/update 和页面刷新
- [x] T018 [US3] 在 `components/outfits/outfit-canvas-editor.tsx` 增加名称、主题选择、保存状态和编辑恢复
- [x] T019 [US3] 在 `lib/outfits/export.ts` 实现 Canvas 位图加载、同变换绘制、品牌信息和 1080×1350 PNG 生成
- [x] T020 [US3] 在 `components/outfits/outfit-canvas-editor.tsx` 接入 Web Share API、下载回退、Object URL 释放和导出错误状态

## Phase 6: User Story 4 - 移动端稳定编辑 (Priority: P3)

**Goal**: 390px 手机端无溢出、无拖动滚动冲突并具备完整可访问名称。

**Independent Test**: 在 390px 完成全流程，键盘可操作，减少动态开启后功能不变。

- [x] T021 [US4] 在 `app/globals.css` 增加画布选择框、时尚色卡、触摸边界和减少动态样式
- [x] T022 [US4] 在 `components/outfits/outfit-canvas-editor.tsx` 完成焦点、ARIA、键盘微调和 390px 工具栏适配

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T023 在 `scripts/verify-sdd-024.mjs` 完成固定像素样本、布局纯函数、静态安全边界和迁移门禁
- [x] T024 运行 `npm run check`、`npm run build`、`npm run verify:sdd-024` 及相关回归，并按 `specs/024-outfit-canvas-share/quickstart.md` 完成移动端验收
- [x] T025 应用 Supabase 迁移并完成双账号 RLS、Storage 路径隔离和顾问检查
- [x] T026 更新 `progress.md`、`AGENTS.md` 与 SDD-024 完成记录
- [x] T027 提交 SDD-024，不包含用户未追踪文件

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → Polish。
- T005 与 T006 可并行；T008 与 T009 可并行；T013 可在 US1 页面开发后独立完成。
- US3 依赖 US1 数据结构和 US2 的图片回退，但分享导出纯函数可提前开发。

## Parallel Example: User Story 1

```text
Task: 在 lib/outfits/data.ts 实现当前用户画布数据读取
Task: 在 components/outfits/outfit-canvas-preview.tsx 实现只读布局预览
```

## Implementation Strategy

先交付“真实衣物可移动”最小闭环，再加入可逆本地抠图，最后保存与分享。任何抠图失败都不能阻塞原图画布；任何导出失败都不能损坏已保存布局。
