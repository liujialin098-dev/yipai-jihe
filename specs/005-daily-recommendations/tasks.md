---

description: "SDD-005 每日 3 套 AI 推荐实现任务"
---

# Tasks: 每日 3 套 AI 推荐

**Input**: `specs/005-daily-recommendations/` 下的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/` 和 `quickstart.md`

**Tests**: 本阶段要求数据库隔离/唯一性脚本、静态检查、构建和移动端浏览器核心路径验收。

**Organization**: 任务按用户故事组织，先完成共享数据和生成底座，再交付核心推荐、天气场合切换和外部失败降级。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立可复现的数据表、类型和质量命令。

- [x] T001 使用 Supabase CLI 创建并填写每日推荐迁移 `supabase/migrations/*_daily_recommendations.sql`
- [x] T002 更新生成数据库类型以包含 `daily_recommendations` 表 `lib/supabase/database.types.ts`
- [x] T003 增加 SDD-005 验证命令 `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立三个用户故事共同依赖的天气、验证、规则、AI 和读取边界。

**CRITICAL**: 本阶段完成前不得开始页面实现。

- [x] T004 [P] 定义场合、天气预设、输出类型与严格 Schema `lib/recommendations/constants.ts`
- [x] T005 [P] 实现天气快照获取、WMO 文案和模拟天气降级 `lib/recommendations/weather.ts`
- [x] T006 实现衣橱充分性、所有权、类别、季节、场合和跨套去重验证 `lib/recommendations/validation.ts`
- [x] T007 实现确定性三套规则推荐器 `lib/recommendations/rules.ts`
- [x] T008 实现 OpenAI Responses API 结构化推荐及失败归类 `lib/recommendations/generator.ts`
- [x] T009 实现当日批次、偏好和衣物图片的数据读取映射 `lib/recommendations/data.ts`

**Checkpoint**: 可以在不依赖页面的情况下得到经过验证的 AI 或规则三套方案。

---

## Phase 3: User Story 1 - 得到今天三套方案 (Priority: P1) MVP

**Goal**: 从当前用户衣橱生成、保存并展示恰好 3 套真实衣物搭配。

**Independent Test**: 24 件演示衣橱选择通勤后生成，页面显示三套有原图、名称、理由和标签的方案，所有 ID 属于当前用户且跨套不重复。

- [x] T010 [US1] 实现认证、生成、同日 upsert 和页面重验证 Server Action `app/recommendations/actions.ts`
- [x] T011 [P] [US1] 实现真实原图拼贴推荐卡 `components/recommendations/recommendation-card.tsx`
- [x] T012 [US1] 将推荐占位页替换为当日推荐页面 `app/recommendations/page.tsx`

**Checkpoint**: User Story 1 可独立生成并再次读取同一当天批次。

---

## Phase 4: User Story 2 - 天气与场合重新生成 (Priority: P2)

**Goal**: 用户可切换四种场合和实时/测试天气，重新生成并覆盖当天结果。

**Independent Test**: 依次使用通勤实时天气、约会冷天和休闲雨天生成，页面输入、天气来源、理由和最终批次均对应最后一次选择。

- [x] T013 [US2] 实现场合与天气预设交互、提交状态和结果反馈 `components/recommendations/recommendation-controls.tsx`
- [x] T014 [US2] 在推荐页整合实时/模拟天气摘要与同日覆盖提示 `app/recommendations/page.tsx`

**Checkpoint**: User Stories 1 和 2 均可独立验收，数据库仍只有一个当天批次。

---

## Phase 5: User Story 3 - 外部失败时仍可用 (Priority: P3)

**Goal**: 天气或 AI 失败时仍展示 3 套可解释规则方案，并对衣橱不足给出明确下一步。

**Independent Test**: 禁用 AI 并模拟天气失败，仍生成三套且标明规则与模拟来源；衣橱不足时不写入残缺记录。

- [x] T015 [P] [US3] 增加与最终版位一致的生成骨架 `app/recommendations/loading.tsx`
- [x] T016 [US3] 完善规则来源、模拟天气、衣橱不足和外部失败状态 `components/recommendations/recommendation-controls.tsx`

**Checkpoint**: 所有用户故事均可独立运行，外部服务不是核心路径单点故障。

---

## Phase 6: Verification & Delivery

**Purpose**: 自动验证数据隔离、同日覆盖、契约与核心页面，并完成阶段追踪。

- [x] T017 编写双匿名会话、RLS、同日三次覆盖和三套契约验证 `scripts/verify-sdd-005.mjs`
- [x] T018 运行 `npm run check`、`npm run build`、`npm run verify:sdd-005` 并按 `specs/005-daily-recommendations/quickstart.md` 完成 390px 浏览器验收
- [x] T019 更新阶段状态、服务选择、验收数据和已知限制 `progress.md`
- [x] T020 更新项目结构、数据约束、质量命令和当前阶段 `AGENTS.md`
- [x] T021 提交 SDD-005 完成变更并记录 commit `progress.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 无依赖。
- Phase 2 依赖迁移与数据库类型，阻塞所有用户故事。
- User Story 1 依赖 Phase 2，是页面 MVP。
- User Story 2 复用 User Story 1 的 Action 和页面，但天气服务可在 Phase 2 独立验证。
- User Story 3 复用规则生成器，可在 User Story 1 完成后独立模拟失败验收。
- Verification & Delivery 依赖三个用户故事完成。

### Parallel Opportunities

- T004 与 T005 位于不同文件，可并行准备。
- T011 可在 T010 后端契约确定后与页面骨架并行。
- T015 可与 T013 的正常交互实现并行。

## Parallel Example: User Story 1

```text
Task: 实现 app/recommendations/actions.ts 的服务端生成与 upsert
Task: 实现 components/recommendations/recommendation-card.tsx 的原图拼贴卡
```

## Implementation Strategy

### MVP First

1. 完成迁移、类型、天气、验证、规则和 AI 服务。
2. 完成 User Story 1 并先用规则路径验收三套真实衣物。
3. 接入天气与场合切换。
4. 模拟 AI/天气失败并补齐降级状态。
5. 完成远端数据与 390px 页面验证后提交。

### Scope Guard

- 不在本阶段实现收藏、换一件、行为偏好加权、定位、多城市、抠图或穿搭日记。
- 不为集中调试前的密码设置和重新登录增加新的 005 依赖。
- 不增加队列、定时任务、向量数据库或额外 AI 供应商。
