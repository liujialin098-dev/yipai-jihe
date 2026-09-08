# Tasks: 贴纸日记工作台

**Input**: `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`

**Tests**: 独立静态门禁、既有回归门禁、production build、移动端浏览器验收

## Phase 1: Setup

- [x] T001 在 `scripts/verify-sdd-035.mjs` 与 `package.json` 建立 SDD-035 独立门禁

## Phase 2: Shared foundation

- [x] T002 [US1] 在 `lib/stickers/canvas.ts` 扩展裁切状态、v1→v2 草稿兼容和稳定层级重排函数

## Phase 3: User Story 1 — 移动端贴纸画板

**Goal**: 贴纸可重叠、真正置顶/置底、四角缩放/旋转、非破坏裁切，并正确导出。

**Independent Test**: 两张重叠贴纸切换层级后视觉顺序变化；裁切、旋转和缩放在重载及导出后保持一致。

- [x] T003 [P] [US1] 在 `lib/stickers/export.ts` 让 PNG 导出应用裁切区域和当前层级
- [x] T004 [US1] 在 `components/stickers/sticker-canvas.tsx` 接入 v2 草稿和修复后的置顶/置底
- [x] T005 [US1] 在 `components/stickers/sticker-canvas.tsx` 实现四角 44px 缩放/旋转手柄与中央移动
- [x] T006 [US1] 在 `components/stickers/sticker-canvas.tsx` 和 `app/globals.css` 实现四边裁切面板及移动端反馈

## Phase 4: User Story 2 — 贴纸成为主导航能力

**Goal**: 衣库进入顶部，贴纸位于底部中央，日记/收藏/推荐成为同级主路径。

**Independent Test**: 任一业务页面都能通过顶部进入衣库，通过底部五项进入首页、日记、贴纸、收藏、推荐，当前态准确。

- [x] T007 [P] [US2] 在 `components/status-header.tsx` 把顶部左侧入口改为衣库
- [x] T008 [US2] 在 `components/bottom-navigation.tsx` 重排为首页/日记/贴纸/收藏/推荐并处理收藏查询态
- [x] T009 [US2] 在 `app/globals.css` 调整上下导航厚度、中央贴纸主按钮和安全区

## Phase 5: User Story 3 — 月历式日记与收藏融合

**Goal**: 日记默认显示完整月历，单日以代表贴纸呈现，并让日记和收藏都能醒目进入贴纸工作台。

**Independent Test**: 空月份也展示完整日期；过去/今天可添加，未来只读；收藏页可进入贴纸工作台。

- [x] T010 [P] [US3] 新建 `components/diary/diary-sticker-calendar.tsx` 渲染完整月份和每日代表贴纸
- [x] T011 [US3] 在 `app/diary/page.tsx` 接入月历、添加单品按钮与日记/收藏贴纸入口

## Phase 6: User Story 4 — 最近 30 天利用率贴纸墙

**Goal**: 利用率页用最近一个月真实穿着过的去重衣物填满贴纸画板。

**Independent Test**: 有日记时最多展示 24 件真实单品且可重叠；无数据时显示空状态，不生成假数据。

- [x] T012 [P] [US4] 在 `lib/diary/data.ts` 派生最近 30 天真实去重单品
- [x] T013 [US4] 新建 `components/diary/utilization-sticker-wall.tsx` 并在 `app/diary/page.tsx` 接入

## Phase 7: Verification and handoff

- [x] T014 更新 `progress.md`、`AGENTS.md` 和 SDD-035 文档中的实际状态与限制
- [x] T015 运行 `npm run check`、`npm run build`、`npm run verify:sdd-035`、`npm run verify:sdd-034`、`npm run verify:sdd-009`
- [x] T016 按 `quickstart.md` 在 390px 与横屏完成浏览器验收并修复发现的问题
- [ ] T017 提交 SDD-035 实现，记录提交号；本阶段不执行 Production 部署

## Dependencies

- T001、T002 完成后进入各用户故事。
- T003～T006 完成后贴纸编辑闭环可独立验收。
- T007～T009 与 T010/T012 可并行，T011 依赖 T010，T013 依赖 T012。
- T014～T017 仅在所有用户故事完成后执行。
