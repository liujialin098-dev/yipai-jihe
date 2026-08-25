# Tasks: 全局高级动效系统

## Phase 1: Foundations

- [x] T001 在 `app/globals.css` 建立时长、缓动、气泡、光泽和层级 token
- [x] T002 在 `components/app-shell.tsx` 建立动效舞台且保持 Server Component 边界

## Phase 2: User Story 1 - 页面空间层次

- [x] T003 [US1] 升级 `.page-enter` 为气泡扩散与内容显现组合
- [x] T004 [US1] 限制 `.stagger-item` 延迟并优化长列表表现

## Phase 3: User Story 2 - 高级操作反馈

- [x] T005 [US2] 重构 `components/bottom-navigation.tsx` 的选中气泡并移除中央按钮弹跳
- [x] T006 [P] [US2] 升级 `components/ui/button.tsx` 的填充扩散与光泽反馈
- [x] T007 [US2] 统一 `.pressable`、输入框、状态卡和加载反馈

## Phase 4: User Story 3 - 降级与验收

- [x] T008 [US3] 补齐 reduced-motion 与 reduced-transparency 降级
- [x] T009 [US3] 运行 390px、桌面、键盘、快速导航和控制台验收
- [x] T010 更新 `quickstart.md`、`progress.md`、`AGENTS.md` 并提交
- [x] T011 [US2] 2026-08-25 回归修复：移除黑色按钮在悬停或聚焦时掠过的白色扫光，保留克制的按压扩散与焦点反馈

## Dependencies

- T003-T007 依赖 T001；T009 依赖全部实现任务。
