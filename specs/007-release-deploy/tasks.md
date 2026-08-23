# Tasks: 全链路加固与受控上线

**Input**: `specs/007-release-deploy/` 下的规格、计划、研究、发布门禁与 quickstart

## Phase 1: 发布规格与快速门禁

- [x] T001 完成 SDD-007 `spec.md` 与需求检查单
- [x] T002 完成 `plan.md`、`research.md`、发布门禁和 quickstart
- [x] T003 实现无网络静态发布审计 `scripts/verify-sdd-007.mjs`
- [x] T004 在 `package.json` 增加 `verify:sdd-007`
- [x] T005 补齐 `.env.example` 的推荐与天气变量模板

## Phase 2: 交付文档与核心回归

- [x] T006 将默认 Next.js README 改为项目本地启动、迁移、验证和 5 分钟演示说明
- [x] T007 复跑 SDD-001、003、005、006 的双会话远端验证
- [x] T008 复核 SDD-004 真实 AI 证据、手工入库降级和 SDD-005 规则降级
- [x] T009 执行 390px 七页面布局、图片、错误覆盖层和核心交互验收
- [x] T010 复核 Supabase Security/Performance Advisors 与 RLS/索引边界

## Phase 3: 构建、部署与交付

- [x] T011 运行 `npm run check`、`npm run build`、`npm run verify:sdd-007`
- [x] T012 部署受保护 Vercel Preview 并确认 READY
- [x] T013 将实际证据写入 quickstart、`progress.md` 与 `AGENTS.md`
- [x] T014 提交 SDD-007 主体与完成状态（`f798207`）

## Dependencies

- T001～T005 定义发布门禁；T006～T010 在门禁基础上回归。
- T011 通过后才能执行 T012；Preview READY 后才能完成 T013～T014。
- 正式生产发布、密码设置和重登录不属于本任务依赖。
