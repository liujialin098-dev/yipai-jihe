# Tasks: 自然化文字排版

## Phase 1: Foundations

- [x] T001 审计核心页面的字号、字重、字距、蓝色眉题和宣传式文案
- [x] T002 在 `app/globals.css` 建立六级语义排版 token
- [x] T003 调整全局正文的字距与行高，提升中文连续阅读舒适度

## Phase 2: Core Pages

- [x] T004 [P] 重排首页、衣橱和添加衣物首屏层级
- [x] T005 [P] 重排推荐、推荐卡与天气来源信息
- [x] T006 [P] 重排收藏、设置、偏好和登录页面
- [x] T007 统一详情、编辑、错误与空状态标题层级

## Phase 3: Copy and AI Presence

- [x] T008 移除刻意比喻、重复宣传句、装饰性前导零和超大计数
- [x] T009 保留 AI 来源透明度，并将其降为普通元信息
- [x] T010 完成核心可见文案自然语言自检

## Phase 4: Verification and Release

- [x] T011 新增 `verify:sdd-015` 静态排版门禁
- [x] T012 运行 `npm run check`、`npm run build` 和独立门禁
- [x] T013 在 390px 验收核心页面的换行、溢出和层级
- [x] T014 更新 `progress.md`、`AGENTS.md`，提交并发布 Production

## Dependencies

- T004-T010 依赖 T002；T012-T013 依赖全部实现任务；T014 依赖所有验收通过。
