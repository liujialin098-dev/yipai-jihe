# Tasks: 活力视觉与专业自动去背

**Input**: `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

## Phase 1: Setup

**Purpose**: 固化服务端密钥边界和独立验收门禁。

- [x] T001 在 `.env.example` 增加仅服务端 `PHOTOROOM_API_KEY` 模板与隐私说明
- [x] T002 在 `scripts/verify-sdd-026.mjs` 建立规格文件、密钥边界、PhotoRoom 合约、无网格与回退门禁
- [x] T003 在 `package.json` 增加 `verify:sdd-026` 命令

## Phase 2: Foundational

**Purpose**: 建立可复用的专业去背服务和分类初始布局。

- [x] T004 [P] 在 `lib/outfits/professional-cutout.ts` 实现 PhotoRoom multipart 传输、20 秒超时、PNG/大小验证和安全错误映射
- [x] T005 [P] 在 `lib/outfits/canvas.ts` 增加六类衣物初始尺寸系数并让 `createInitialCanvasItems` 接收类别映射
- [x] T006 在 `lib/outfits/professional-cutout.ts` 实现当前用户原图下载、版本化私有展示图/工作图、成功后绑定与已有结果幂等复用

## Phase 3: User Story 1 - 活力时尚视觉 (Priority: P1)

**Goal**: 用品牌化多彩舞台替换灰色渐变，并保持内容清晰稳定。

**Independent Test**: 390px 检查未登录页及五个核心页面，背景活泼统一、无溢出，减少动态/透明度可降级。

- [x] T007 [US1] 在 `app/globals.css` 调整浅色与深色背景 token、`.app-backdrop` 和 `.auth-entry-page` 为丁香紫主舞台与有限青柠/珊瑚/天空蓝高光
- [x] T008 [US1] 在 `components/recommendations/recommendation-card.tsx` 调整画布承载表面以适配新时尚色彩层级

## Phase 4: User Story 2 - 新衣自动专业去背 (Priority: P1)

**Goal**: 新衣确认后异步生成自动裁边透明 PNG，不阻塞入库。

**Independent Test**: 入库响应即时返回；成功后显示透明图；无密钥、超时和非法响应均继续使用原图。

- [x] T009 [US2] 在 `app/api/wardrobe/ingestions/[id]/confirm/route.ts` 使用 Next.js `after()` 在确认响应后调用幂等专业去背
- [x] T010 [US2] 在 `components/wardrobe/ingestion-workspace.tsx` 增加“后台优化中”的非阻塞说明且不伪造完成状态
- [x] T011 [US2] 在 `app/api/wardrobe/items/[id]/cutout/route.ts` 实现当前用户鉴权、归属校验、force 合约和短期签名结果

## Phase 5: User Story 4 - 无格子自由画布与人工精修 (Priority: P1)

**Goal**: 六类衣物自然起始、无吸附自由变换，并可擦除/恢复边缘。

**Independent Test**: 六类初始 scale 符合规则；画布无方格/吸附；人工擦除和恢复后保存刷新一致，取消不覆盖。

- [x] T012 [P] [US4] 在 `lib/outfits/data.ts` 将衣物类别传入新画布初始布局，同时保持历史画布不迁移
- [x] T013 [P] [US4] 在 `components/outfits/cutout-refiner.tsx` 实现原图/透明图加载、擦除、恢复、三档画笔、重置、取消和 PNG 导出
- [x] T014 [US4] 在 `components/outfits/outfit-canvas-editor.tsx` 接入专业重做、精修面板、私有 PNG 保存与成功后 URL 替换
- [x] T015 [US4] 在 `app/outfits/actions.ts` 调整派生图绑定成功文案为通用来源，并保持严格路径和归属校验
- [x] T016 [US4] 在 `app/globals.css` 完成精修弹层、画笔交互、无网格画布和减少动态/透明度样式

## Phase 6: User Story 3 - 历史衣物重做 (Priority: P2)

**Goal**: 历史衣物可以主动重新使用专业服务处理，失败保留旧结果。

**Independent Test**: 未处理、已处理和服务失败三种旧衣物分别得到创建、替换和安全回退。

- [x] T017 [US3] 在 `components/outfits/outfit-canvas-editor.tsx` 完成未处理“专业抠图”、已处理“重新抠图”和明确失败回退状态
- [x] T018 [US3] 在 `app/api/wardrobe/items/[id]/cutout/route.ts` 验证普通复用不调用、force 重做只在新结果成功后替换

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T019 在 `scripts/verify-sdd-026.mjs` 完成 PhotoRoom 合约、Sharp 固定透明样本、分类 scale、人工工具静态边界、无网格和服务端密钥门禁
- [x] T020 运行 `npm run check`、`npm run build`、`npm run verify:sdd-026` 及 SDD-024/025 回归
- [ ] T021 按 `specs/026-vibrant-auto-cutout/quickstart.md` 完成 390px 浏览器验收；无真实密钥时明确保留付费样本验收待办
- [x] T022 更新 `progress.md`、`AGENTS.md` 与 SDD-026 的完成状态、限制和下一步 SDD-027 边界
- [x] T023 提交 SDD-026，不包含用户未追踪文档和脚本（实现提交 `4f0712e`）

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1/US2 → US4 → US3 → Polish。
- T004 与 T005 可并行；T007 可与服务端 T004-T006 并行；T012 与 T013 可并行。
- US2 依赖服务端基础；US4 的分类布局依赖 T005，人工精修可独立开发；US3 复用 US2 Route Handler。

## Parallel Example: User Story 4

```text
Task: 在 lib/outfits/data.ts 接入分类尺寸初始布局
Task: 在 components/outfits/cutout-refiner.tsx 实现人工擦除/恢复
```

## Implementation Strategy

先建立服务端安全去背和失败回退，再完成视觉升级；随后把分类尺寸与人工精修接入现有自由画布。新闻和趋势推送不进入本阶段。真实 PhotoRoom 密钥缺失时允许完成静态、mock 和回退验收，但不得把付费真实样本标记为通过。
