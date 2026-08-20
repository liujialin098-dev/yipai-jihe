# 任务清单：应用框架与匿名数据底座

**输入**：`specs/001-app-foundation/` 下的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/` 和 `quickstart.md`
**范围**：只实现 SDD-001；邮箱绑定、衣橱业务、图片上传界面和 AI 均不在本清单内。
**验证方式**：本阶段不引入测试框架；使用静态检查、生产构建、真实匿名测试会话、移动端核心路径和 Preview 冒烟验收。

## 格式说明

- `[P]`：可与同阶段其他任务并行，且不会修改同一文件。
- `[US1]`、`[US2]`、`[US3]`：对应 `spec.md` 中的用户故事。
- 每个任务完成后立即将 `[ ]` 改为 `[X]`，不得等到阶段结束后批量补记。

## Phase 1：共享准备

**目标**：建立本阶段实现所需的可复现文件与基础约定。

- [X] T001 在 `supabase/migrations/20260820150709_app_foundation.sql` 编写 `profiles`、`user_preferences`、显式授权、RLS、私有 `wardrobe-images` bucket 和对象路径策略迁移
- [X] T002 [P] 在 `lib/supabase/config.ts` 完善公开环境变量检查，确保错误可诊断且不输出变量值
- [X] T003 [P] 在 `lib/supabase/database.types.ts` 建立与本阶段数据模型一致的类型文件占位，待远端迁移后用生成结果覆盖

**检查点**：本地迁移、环境边界和类型入口已经具备，才进入远端基础设施任务。

---

## Phase 2：阻塞性数据底座

**目标**：在用户故事实现前，使当前 Supabase 项目具备可访问且隔离的数据结构。

- [X] T004 将 `supabase/migrations/20260820150709_app_foundation.sql` 作为命名迁移应用到 Supabase 项目 `gmjtzmxuveoaqcdmuifr`
- [X] T005 用当前 Supabase schema 生成并覆盖 `lib/supabase/database.types.ts`，确认 `profiles` 与 `user_preferences` 类型存在
- [X] T006 运行 Supabase 安全和性能顾问，修复 `supabase/migrations/20260820150709_app_foundation.sql` 引入的高优先级问题并重新核对远端对象
- [X] T007 [P] 在 `lib/supabase/server.ts`、`lib/supabase/client.ts` 和 `lib/supabase/proxy.ts` 接入 `Database` 泛型，保留现有 browser/server/proxy cookie 分工

**检查点**：两张表、私有 bucket、授权与 RLS 在远端存在且顾问无本阶段高优先级问题，才开始用户故事。

---

## Phase 3：用户故事 1——首次访问即可开始体验（P1）🎯 MVP

**目标**：无会话用户自动获得匿名身份、资料和默认偏好；刷新后保持同一身份；失败时可重试。

**独立测试**：全新浏览器打开首页后进入空衣橱引导；记录短用户标识并连续刷新 3 次，标识不变且两张表各只有一条当前用户记录。

- [X] T008 [P] [US1] 在 `lib/auth/viewer.ts` 实现服务端当前用户声明、资料和偏好的最小读取结果
- [X] T009 [US1] 按 `contracts/session-api.yaml` 在 `app/api/session/anonymous/route.ts` 实现匿名登录、幂等资料初始化及安全错误响应
- [X] T010 [US1] 在 `components/session-bootstrap.tsx` 实现首次自动启动、加载、失败、重试和成功刷新状态
- [X] T011 [P] [US1] 在 `components/empty-state.tsx` 建立可复用的中文空状态展示
- [X] T012 [US1] 在 `app/page.tsx` 组合当前用户状态、会话启动和空衣橱引导，不提前实现衣橱业务
- [ ] T013 [US1] 按 `specs/001-app-foundation/quickstart.md` 完成全新会话和连续 3 次刷新验收，并把结果写入 `specs/001-app-foundation/tasks.md` 的执行记录

**检查点**：用户故事 1 可独立演示，异常时可重试，刷新不重复创建基础数据。

---

## Phase 4：用户故事 2——完整应用骨架与模块入口（P2）

**目标**：六个主要入口均可访问，移动端顶部状态区、底部导航和未实现模块空状态清晰一致。

**独立测试**：在 390px 宽视口依次访问六个入口，确认无死链接、选中态正确、页面没有伪装成已实现的业务操作。

- [X] T014 [P] [US2] 在 `components/status-header.tsx` 实现品牌、匿名状态和设置入口的顶部状态区
- [X] T015 [P] [US2] 在 `components/bottom-navigation.tsx` 实现首页、衣橱、添加、推荐和收藏的移动端导航及当前路由选中态
- [X] T016 [US2] 在 `components/app-shell.tsx` 组合顶部状态区、内容区、会话启动和底部安全区布局
- [X] T017 [P] [US2] 在 `app/wardrobe/page.tsx` 与 `app/wardrobe/new/page.tsx` 实现衣橱和添加衣物阶段空状态
- [X] T018 [P] [US2] 在 `app/recommendations/page.tsx` 与 `app/favorites/page.tsx` 实现推荐和收藏阶段空状态
- [X] T019 [P] [US2] 在 `app/settings/page.tsx` 实现匿名身份说明和短用户标识，不提供邮箱绑定操作
- [X] T020 [US2] 在 `app/layout.tsx` 与 `app/globals.css` 接入衣拍即合元数据、移动端视觉基线和应用外壳
- [X] T021 [P] [US2] 在 `app/loading.tsx` 与 `app/error.tsx` 实现统一加载和可重试错误界面
- [X] T022 [US2] 按 `specs/001-app-foundation/quickstart.md` 完成六个路由和 390px 视口验收，并把结果写入 `specs/001-app-foundation/tasks.md` 的执行记录

**检查点**：用户故事 1 与 2 可分别验证，所有入口均明确区分“底座已完成”和“业务待后续阶段”。

---

## Phase 5：用户故事 3——匿名用户数据隔离（P3）

**目标**：用两个真实匿名会话证明自己的数据可用、其他用户的数据和路径不可访问。

**独立测试**：运行隔离脚本，两个会话自身读取/更新成功，交叉读取、交叉修改和跨用户路径写入均失败。

- [X] T023 [US3] 在 `scripts/verify-sdd-001.mjs` 实现两组匿名测试会话、非敏感资料/偏好数据和 Storage 路径隔离验证，禁止输出密钥或令牌
- [ ] T024 [US3] 使用 `.env.local` 运行 `scripts/verify-sdd-001.mjs` 创建测试数据并把自身访问与交叉访问结果写入 `specs/001-app-foundation/tasks.md` 的执行记录
- [ ] T025 [US3] 用 Supabase 表、策略和顾问结果复核远端隔离状态，将最终安全结论写入 `specs/001-app-foundation/tasks.md` 的执行记录

**检查点**：三个用户故事全部可独立验收，数据安全不依赖客户端界面。

---

## Phase 6：收尾、Preview 与进度交接

**目标**：完成质量门禁、可访问 Preview 和唯一进度文档同步。

- [X] T026 运行 `npm run check` 和 `npm run build`，修复所有本阶段静态检查与生产构建问题
- [ ] T027 按项目现有 Vercel 关联配置发布 Preview，并在 Preview URL 重复主要路由、匿名会话与刷新保持冒烟检查
- [X] T028 在 `specs/001-app-foundation/quickstart.md` 补充实际执行差异、Preview 验收方式和 Supabase CLI Windows 兼容性取舍
- [X] T029 在 `progress.md` 将 SDD-001 的 TODO、状态、完成日期、验收结果、已知限制、下一步和提交记录更新为实际结果
- [X] T030 在 `AGENTS.md` 同步新增目录、数据模型、安全约定、Context7 library id 与当前阶段状态
- [X] T031 审查 `git diff` 与 `git status`，确认不包含 `.env.local`、密钥、真实照片或用户原有未跟踪文件，并提交 SDD-001 成果

## 依赖与执行顺序

- Phase 1 → Phase 2 → US1 → US2 → US3 → Phase 6，按核心路径顺序串行推进。
- T002 与 T003 可并行；T007 可在远端迁移检查期间独立处理。
- US1 内 T008 与 T011 可并行，T009 依赖 T004/T005/T007，T010 依赖 T009。
- US2 的页面空状态 T017～T019 可并行，T016 依赖 T014/T015，T020 最后接入统一外壳。
- US3 必须在远端 RLS 与 Storage 策略就绪后执行；T024 依赖 T023，T025 依赖 T024。
- Preview 只在 T026 通过后发布；`progress.md` 不得在 T027 失败时标记 SDD-001 已完成。

## 执行记录

- 2026-08-20：规格、澄清、计划和任务清单已生成；未发现关键需求歧义。
- 2026-08-20：Supabase CLI 生成迁移命令在当前 Windows/Node 环境因缺少 `win32-x64` 二进制失败，改用标准时间戳路径并计划通过 Supabase 受控迁移接口应用同一份 SQL。
- 2026-08-20：远端迁移 `20260820150709_app_foundation` 应用成功；`profiles` 与 `user_preferences` 均启用 RLS，安全和性能顾问均返回 0 项告警。
- 2026-08-20：`npm run check` 与 `npm run build` 通过；首页及 5 个模块入口在 390px 视口均返回 200、标题和导航选中态正确、无错误覆盖层或控制台异常。
- 2026-08-20：匿名登录验证被 Supabase 项目配置阻塞，实际返回 `Anonymous sign-ins are disabled`；应用正确显示中文可重试状态，待在 Dashboard 开启 Anonymous Sign-Ins 后重跑 T013/T024/T025。
- 2026-08-20：远端默认表权限曾宽于计划，已通过迁移 `20260820152608_tighten_foundation_grants` 收紧为 `authenticated` 仅 `SELECT/INSERT/UPDATE`、`anon` 无表权限；复跑安全与性能顾问仍为 0 告警。
- 2026-08-20：Vercel 项目 `ai-coding` 的 Preview `https://ai-coding-2m4gteem7-jialin-d583.vercel.app` 已 READY，六个页面均返回 200；构建注入的两个 Supabase 公开变量已生效，会话接口只剩匿名登录开关阻塞。
- 2026-08-20：已审查并提交进行中检查点 `da86c2e`；用户原有未跟踪脚本和更新版 PRD 未纳入提交。
