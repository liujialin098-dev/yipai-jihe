# SDD-050 任务

## 后续增量任务（2026-09-14，用户关键选择已确认）

- [x] T013 更新specs/050-release-readiness/spec.md、plan.md、research.md、data-model.md与contracts/recovery.md，明确默认关闭和真实配置门禁。
- [x] T014 [US3] 在scripts/verify-account-recovery.mjs先建立关闭/错误/同身份/成功/未知结果固定测试。
- [x] T015 [US3] 实现lib/auth/password-recovery.ts与lib/auth/recovery-actions.ts，不使用管理员权限或替换浏览器会话。
- [x] T016 [US3] 实现components/auth/recovery-form.tsx和app/auth/recover/page.tsx，接入登录与设置入口。
- [x] T017 [P] [US4] 实现app/support/page.tsx、app/privacy/page.tsx与公开页面白名单，保留清楚的未完成边界。
- [x] T018 验证安全测试、类型、构建与实际表单隔离交互，更新specs/050-release-readiness/quickstart.md和progress.md。
- [ ] T019 [US3] 在测试账号核实真实SMTP/数字模板/限流/失效/重登，再启用恢复；本轮不自动操作。
- [ ] T020 [US2] 继续specs/050-release-readiness/account-deletion-design.md的数据库封锁/文件清理/重试落地与隔离测试，启用前不得暴露可执行注销。
- [ ] T021 [US2] 补齐独立AI授权及正式隐私/协议材料，核实实际保留、地域、主体；未完成不标记已合规。

增量顺序T013→T014→T015→T016→T018→T019；T017可在T013后并行。当前最小交付为US3本地安全闭环+US4，T019/T020/T021保持后续门禁。

## 阶段一：准备

- [x] T001 明确specs/050-release-readiness/spec.md与需求质量检查，保留已有未提交修改。
- [x] T002 核实当前认证文档，记录specs/050-release-readiness/research.md。

## 阶段二：基础边界

- [x] T003 完成specs/050-release-readiness/data-model.md和contracts/password-change.md，禁止真实数据删除与远程管理员重置。

## 阶段三：US1 安全改密

独立验收：正确原密码/同账号才可改密；拒绝路径无写入，密码不回显。

- [x] T004 [US1] 先编写scripts/verify-sdd-050.mjs固定安全与Action集成用例，确认缺实现时失败。
- [x] T005 [US1] 实现lib/auth/password-change.ts并扩展lib/auth/errors.ts的原密码字段。
- [x] T006 [US1] 修改lib/auth/actions.ts，旧设密委托同一安全服务，体验注册单次写入。
- [x] T007 [US1] 在components/auth/account-forms.tsx与app/settings/page.tsx加入可访问的改密表单及历史提示。

## 阶段四：US2 发布证据

独立验收：门禁明确负责人/证据/下一步；未确认信息不作为正式法律文案上线。

- [x] T008 [P] [US2] 完成specs/050-release-readiness/release-gates.md与内部隐私编制清单，不创建虚假政策网页。
- [x] T009 [P] [US2] 完成specs/050-release-readiness/account-deletion-design.md的文件/身份删除顺序、故障与验收方案，暂不执行。

## 阶段五：验证和保存

- [x] T010 运行scripts/verify-sdd-050.mjs、check/build及相关回归，记录specs/050-release-readiness/quickstart.md的实际结果。
- [x] T011 进行改密表单隔离交互/视觉检查，将无法完成的真机与真实账号检查记录在progress.md。
- [x] T012 更新progress.md与AGENTS.md，汇总用户需决定的主体和身份方案；不部署。

## 依赖与实施策略

T001→T002→T003→T004→T005→T006→T007→T010→T011→T012。T008/T009可在T003完成后独立进行，不与业务代码共享写入。先完成US1最小安全闭环，US2给出后续上架依据而不提前实现新的平台。

真实账号改密、供应商策略和真机验收是后续发布门禁，不得把固定假体结果替代它们。
