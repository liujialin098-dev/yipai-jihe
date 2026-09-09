# Tasks: SDD-041 品牌开屏与加载动效

**Input**: Design documents from `/specs/041-brand-motion/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/ui-contract.md、quickstart.md

**Tests**: 本阶段需要独立源码门禁、生产构建和浏览器视觉验收，以验证动效时序、接入范围与减少动态边界。

## Phase 1: Setup

- [x] T001 核对正式图标、现有 motion token、根布局与加载入口，确认不新增依赖并验证 `.gitignore` 已覆盖 Node/Next/环境文件
- [x] T002 [P] 为正式资产、组件契约、根接入、时序和辅助设置建立失败优先门禁 `scripts/verify-sdd-041.mjs`

---

## Phase 2: User Story 1 - 品牌开屏成形 (Priority: P1) 🎯 MVP

**Goal**: 完整打开时播放一次折叠 E 成形、字标出现和短淡出的品牌开屏，站内导航不重复。

**Independent Test**: 完整刷新任意页面观察一次完整开屏；站内切页确认不重复，1.5 秒后页面可操作。

- [x] T003 [US1] 在 `components/brand-motion.tsx` 实现复用正式图标的 splash 结构与双语品牌锁定
- [x] T004 [US1] 本地SVG实现衣服→E固定双色同步形变，CSS实现字标出现及覆盖层淡出；不保留高光
- [x] T005 [US1] 在 `app/layout.tsx` 根壳层接入非交互开屏，保持 Server Component 和现有主题初始化

---

## Phase 3: User Story 2 - 页面级品牌加载 (Priority: P1)

**Goal**: 慢页面和会话返回过程使用同一品牌语言的克制循环加载，短等待不闪烁。

**Independent Test**: 延长路由等待观察 120ms 后加载出现并随内容完成退出；访问受保护路由观察同款会话加载。

- [x] T006 [US2] 在 `components/brand-motion.tsx` 与 `app/globals.css` 完成延迟显示的 loader 变体、可见文案和可访问状态
- [x] T007 [P] [US2] 在 `app/loading.tsx` 替换通用骨架为页面级品牌加载
- [x] T008 [P] [US2] 在 `components/session-bootstrap.tsx` 用品牌加载替换通用旋转图标

---

## Phase 4: User Story 3 - 辅助设置与多设备舒适观看 (Priority: P2)

**Goal**: 减少动态、减少透明度、深色和窄屏下保持舒适、清晰且不溢出。

**Independent Test**: 在减少动态、浅/深色、320/375/390px 和横屏环境逐项检查动画与边界。

- [x] T009 [US3] 在 `app/globals.css` 增加减少动态、减少透明度、深色、安全区域和响应式降级，确保退出后不拦截交互

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T010 运行 `npm run verify:sdd-041`、`npm run check`、`npm run build` 并修复全部问题
- [x] T011 依据 `specs/041-brand-motion/quickstart.md` 完成本地浏览器标准/深浅色/多尺寸验收并记录真实结果；系统减少动态偏好仅完成源码门禁，保留真机复验项
- [x] T012 更新 `specs/041-brand-motion/tasks.md`、`specs/041-brand-motion/quickstart.md`、`progress.md` 与 `AGENTS.md` 的完成状态、限制和下一步

---

## Dependencies & Execution Order

- T001 与 T002 完成后进入用户故事。
- US1 提供共享开屏结构；US2 复用同一组件，依赖 T003，但 T007 与 T008 可并行。
- US3 在 US1/US2 样式完成后统一收口辅助设置。
- 质量、浏览器和文档任务依次执行；本阶段不部署 Production。

## Parallel Opportunities

- T002 可与只读结构核对并行。
- T007 与 T008 修改不同调用方，可并行。
- 自动门禁中的 verify/check 可在代码稳定后并行，build 在格式化完成后执行。

## Implementation Strategy

1. 先交付可独立观察的开屏成形。
2. 再抽取同一图标动作语言为页面加载并替换两处页面级入口。
3. 最后以减少动态、深浅色和多尺寸收口，避免为了“更炫”扩大到高频按钮。
# 用户视觉修订（2026-09-09）

- [x] 边缘精修：六条轮廓采用连续B样条曲线，保留双色/节奏/文字；验证12条资产端点轮廓接缝连续、check/build/041通过，并刷新浏览器预览。

- [x] 修复色块跳变：固定双色、内部片区同步变形、取消收尾PNG替换；追加颜色和时间轴一致性门禁，刷新本地预览。

- [x] 最终图标方案：短袖衣服连续形变为E，保持同一SVG，不以PNG收尾；保留文字显现，check/build通过。用户已批准接入App，根开屏/全局加载/会话等待均已复用；本地生产构建首页及两份SVG均HTTP200，未部署。

- [x] 移除泡泡/光晕/扫光，改用纯色背景与透视折页动效；清除旧样式。
- [x] 预览默认实时播放，提供重播、加载与明暗切换；3014端口避免旧预览冲突。
- [x] check/build/041门禁通过并同步文档；本轮修订未部署。
