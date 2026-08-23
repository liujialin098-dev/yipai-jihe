# Tasks: 换一件、收藏与偏好反馈

**Input**: `specs/006-outfit-feedback/` 下的规格、计划、研究、数据模型、契约与 quickstart

## Phase 1: 数据与共用能力

- [x] T001 创建收藏、反馈和偏好字段迁移 `supabase/migrations/*_outfit_feedback.sql`
- [x] T002 更新生成数据库类型 `lib/supabase/database.types.ts`
- [x] T003 增加验证命令 `package.json`
- [x] T004 [P] 实现反馈类型、固定权重和偏好重算 `lib/feedback/preferences.ts`
- [x] T005 [P] 实现收藏、偏好和候选数据读取 `lib/recommendations/data.ts`、`app/favorites/page.tsx`
- [x] T006 实现换件候选过滤和替换后完整校验 `lib/feedback/replacement.ts`

## Phase 2: User Story 1 - 换一件

- [x] T007 [US1] 实现服务端换件与事件记录 `app/recommendations/actions.ts`
- [x] T008 [US1] 实现移动端候选面板 `components/recommendations/replace-item-panel.tsx`
- [x] T009 [US1] 将候选与替换入口接入推荐卡和页面 `components/recommendations/recommendation-card.tsx`、`app/recommendations/page.tsx`

## Phase 3: User Story 2 - 收藏

- [x] T010 [US2] 实现单品与整套收藏 Server Actions `lib/feedback/actions.ts`
- [x] T011 [US2] 实现可复用收藏按钮并接入推荐卡、衣物详情 `components/favorites/favorite-button.tsx`
- [x] T012 [US2] 将收藏占位页替换为单品与整套列表 `app/favorites/page.tsx`、`components/favorites/`

## Phase 4: User Story 3 - 偏好

- [x] T013 [US3] 实现 3 题问卷保存/跳过 Action `app/settings/preferences/actions.ts`
- [x] T014 [US3] 实现偏好问卷与来源说明页面 `app/settings/preferences/page.tsx`、`components/preferences/`
- [x] T015 [US3] 从设置页加入偏好入口，并让推荐读取排序后风格 `app/settings/page.tsx`、`lib/recommendations/data.ts`
- [x] T016 [US3] 记录幂等查看事件并显示偏好影响说明 `components/recommendations/`

## Phase 5: 验收与交付

- [x] T017 编写双会话、收藏/反馈幂等和跨用户 RLS 验证 `scripts/verify-sdd-006.mjs`
- [x] T018 运行 `npm run check`、`npm run build`、`npm run verify:sdd-006` 和 390px quickstart
- [x] T019 更新 `progress.md` 与 `AGENTS.md`
- [x] T020 部署 SDD-006 Preview 并记录状态
- [ ] T021 提交完成变更并记录 commit

## Dependencies

- T001～T006 为所有用户故事基础。
- US1 可独立验收后再接 US2；US2 的反馈权重完成后再验收 US3 来源说明。
- T017～T021 依赖三个用户故事全部通过。
