# Tasks: 邮箱绑定与会话恢复

## Phase 1: Setup

- [x] T001 更新 `progress.md` 将 SDD-002 标记为进行中并记录范围恢复
- [x] T002 [P] 建立 `lib/auth/errors.ts` 的校验和安全错误映射
- [x] T003 [P] 扩展 `lib/auth/viewer.ts` 的邮箱账号状态 DTO

## Phase 2: Foundational

- [x] T004 在 `lib/auth/actions.ts` 实现受保护的绑定、设密码、登录和退出动作
- [x] T005 在 `app/auth/confirm/route.ts` 实现 PKCE 邮件确认与安全跳转
- [x] T006 调整 `components/app-shell.tsx` 与 `components/session-bootstrap.tsx`，让登录/确认页跳过自动匿名初始化

## Phase 3: User Story 1 - 匿名账号绑定邮箱

- [x] T007 [US1] 在 `components/auth/account-forms.tsx` 实现邮箱绑定与状态反馈表单
- [x] T008 [US1] 重构 `app/settings/page.tsx` 展示匿名、待设密码和已保护状态

## Phase 4: User Story 2 - 登录恢复

- [x] T009 [US2] 在 `components/auth/login-form.tsx` 实现邮箱密码登录与主动匿名体验
- [x] T010 [US2] 新建 `app/login/page.tsx` 并完成退出后的恢复入口

## Phase 5: User Story 3 - 状态与验收

- [x] T011 [US3] 为绑定、链接、密码和登录异常补齐中文可执行提示
- [x] T012 [US3] 新建 `scripts/verify-sdd-002.mjs` 并接入 `package.json`
- [ ] T013 运行静态检查、构建、脚本和浏览器独立验收
- [ ] T014 更新 `quickstart.md`、`progress.md`、`AGENTS.md` 与提交记录
- [x] T015 [US2] 为已验证但未设密码账号补充一次性密码设置邮件入口
- [ ] T016 [US2] 在 Preview 完成设置密码、退出、重新登录和原衣橱恢复验收
- [x] T017 [US1] 将绑定流程改为邮箱与密码一次提交、无需邮件验证的原地注册
- [x] T018 [US3] 在主页增加注册和已有账号登录入口
- [x] T019 [US2] 移除一次性密码邮件入口，并新增仅限本地的管理员密码设置脚本
- [x] T020 [US3] 修复邮箱与密码输入框图标覆盖文字
- [ ] T021 关闭 Supabase Confirm email，部署 Preview 并与用户完成真实注册/登录验收

## Dependencies

- T004 依赖 T002、T003；T007/T008 依赖 T004/T005；T009/T010 依赖 T004/T006。
- T021 涉及认证策略和真实账号密码，必须在保存代码后暂停，与用户共同完成。
