# Tasks: 穿搭日记与基础衣物利用率报告

**Input**: Design documents from `/specs/009-outfit-diary/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 本功能新增用户数据表、派生统计和推荐写入入口，必须先建立独立门禁，再以双账号真实 Supabase 验证 RLS、幂等和数据库归属约束。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 固定阶段文档、目录和独立验收入口。

- [x] T001 创建 `specs/009-outfit-diary/` 的规格、规划、研究、数据模型、契约、快速验收和质量清单
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-009` 命令
- [x] T003 [P] 在 `scripts/verify-sdd-009.mjs` 建立固定聚合、未来日期、页面入口和安全边界门禁

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立所有日记故事共用的安全数据底座。

- [x] T004 使用 Supabase CLI 创建 `supabase/migrations/*_outfit_diary.sql`，实现单表、约束、所有权触发器、索引、最小授权和四类 RLS
- [x] T005 应用迁移到 `gmjtzmxuveoaqcdmuifr`，在 `lib/supabase/database.types.ts` 更新生成类型并运行安全/性能 Advisor
- [x] T006 [P] 在 `lib/diary/validation.ts` 实现日期、月份、范围、场合、标题、短记和衣物 ID 校验
- [x] T007 [P] 在 `lib/diary/report.ts` 实现 30/90/全部固定输入聚合和利用状态
- [x] T008 在 `lib/diary/data.ts` 实现当前账号日期、月份日记、编辑记录、报告输入和当前图片映射读取
- [x] T009 在 `scripts/verify-sdd-009.mjs` 覆盖表结构、触发器、RLS 表达式、唯一键、范围聚合和跨用户衣物拒绝

**Checkpoint**: 日记行能原子保存且数据库可独立阻止跨用户记录；报告纯函数固定样本通过。

---

## Phase 3: User Story 1 - 记录当天实际穿搭 (Priority: P1) 🎯 MVP

**Goal**: 从今日推荐一键记录，或手工选择衣物保存/覆盖一天记录。

**Independent Test**: 今日推荐保存一次，再用手工组合覆盖同一天；数据库始终一行，最后组合与页面一致。

- [x] T010 [US1] 在 `app/diary/actions.ts` 实现推荐保存、手工 upsert 和删除 Action，全部重新认证、校验归属并刷新相关路径
- [x] T011 [P] [US1] 在 `components/diary/recommendation-diary-button.tsx` 实现今日推荐保存状态与日记跳转
- [x] T012 [US1] 在 `components/recommendations/recommendation-card.tsx` 和 `app/recommendations/page.tsx` 接入今日按钮、明日只读说明和目标日期
- [x] T013 [P] [US1] 在 `components/diary/diary-composer.tsx` 实现 1～8 件选择、日期/场合/标题/短记和已有记录编辑状态
- [x] T014 [US1] 在 `app/diary/new/page.tsx` 服务端读取候选与目标日期记录并接入手工表单
- [x] T015 [P] [US1] 在 `components/diary/diary-delete-button.tsx` 实现显式二次确认和结果反馈
- [x] T016 [US1] 在 `scripts/verify-sdd-009.mjs` 覆盖客户端不提交 user_id/整套快照、服务端重读推荐、1～8 件和未来日期拒绝

**Checkpoint**: 推荐和手工两条记录路径独立可用，同日覆盖可解释，删除不影响衣物。

---

## Phase 4: User Story 2 - 回顾穿搭历史 (Priority: P1)

**Goal**: 按月份回看记录，原衣物变化后仍保留文字快照。

**Independent Test**: 本月创建两条，切换前后月份，确认过滤、倒序、编辑删除和快照回退正确。

- [x] T017 [US2] 在 `app/diary/page.tsx` 实现日记/报告视图壳、月份切换、记录摘要和空状态
- [x] T018 [US2] 在 `app/diary/page.tsx` 实现当前衣物图片与历史快照回退、场合/来源、短记、编辑和删除
- [x] T019 [US2] 在 `components/bottom-navigation.tsx` 将最后入口调整为“记录”，并在日记页保留 `/favorites` 明确入口
- [x] T020 [P] [US2] 在 `app/page.tsx` 增加今日记录快捷入口和状态摘要，不改变无会话账号入口
- [x] T021 [US2] 在 `scripts/verify-sdd-009.mjs` 覆盖未来月份回退、倒序、快照字段、收藏仍可达和 5 项 Dock

**Checkpoint**: 用户可持续找到并核对历史，收藏能力未丢失。

---

## Phase 5: User Story 3 - 查看基础衣物利用率 (Priority: P2)

**Goal**: 查看 30 天、90 天和全部范围的可解释精确统计。

**Independent Test**: 10 件衣橱、3 条近 30 天记录的固定样本输出 30% 利用率、6 次单品穿着和正确最后日期。

- [x] T022 [US3] 在 `app/diary/page.tsx` 实现报告范围切换、总利用率、记录天数和单品穿着次数
- [x] T023 [US3] 在 `app/diary/page.tsx` 实现最常穿与未穿列表、详情链接、空数据 0 值和说明
- [x] T024 [US3] 在 `scripts/verify-sdd-009.mjs` 覆盖范围边界、删除后回算、当前偏好分母、排行稳定顺序和无 AI/虚假趋势

**Checkpoint**: 报告每个数字都能由日记和当前衣橱解释，不保存冗余统计。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完成真实数据库、质量、移动端和文档验收。

- [x] T025 使用 React 最佳实践清单复核新增 Client Component 的边界、状态、可访问性和重复渲染
- [x] T026 运行 `npm run check`、`npm run build` 与 `npm run verify:sdd-009`
- [x] T027 运行 `npm run verify:sdd-007`、`npm run verify:sdd-012`、`npm run verify:sdd-015` 与 `npm run verify:sdd-016`，确认发布、个性化、排版和首次账号入口未回归
- [x] T028 390px 本地浏览器验收推荐保存、手工记录、月份回顾、报告三范围、删除、减少动态、无溢出和控制台错误
- [x] T029 [P] 更新 `progress.md` 与 `AGENTS.md`，记录 SDD-009 完成状态、数据模型、质量命令、范围和已知限制
- [x] T030 更新 `specs/009-outfit-diary/quickstart.md`、`spec.md` 与本文件的真实结果和完成状态
- [x] T031 仅暂存本阶段文件并提交，不包含用户未跟踪的 PRD 脚本和 Word 文档；不主动 Production 部署

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish。
- T006 与 T007 可并行；T008 在数据结构与校验确定后完成。
- 推荐按钮、手工表单和删除按钮可分文件并行，但均依赖 T010 Action 契约。
- US2 依赖日记可写，US3 依赖真实日记读取；每个故事仍可用固定数据单独验收。
- 只有迁移、独立门禁、构建、真实双账号隔离和 390px 核心路径全部通过后，才把阶段标记为完成。

## Implementation Strategy

先落地安全单表和纯聚合函数，再打通推荐与手工记录；随后完成按月回顾和导航，最后基于同一数据提供报告。所有统计均即时计算，不把未来计划、收藏或推荐浏览误算为实际穿着。
