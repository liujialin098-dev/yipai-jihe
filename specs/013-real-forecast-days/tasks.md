# Tasks: 今日与明日真实天气搭配

**Input**: Design documents from `/specs/013-real-forecast-days/`

**Prerequisites**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

**Tests**: 本阶段要求独立自动验收、真实天气接口校验和移动端浏览器验收。

## Phase 1: Setup

**Purpose**: 固定本阶段文档、共享类型与验证入口。

- [x] T001 核对 SDD-013 规格、研究、数据模型和接口契约 `specs/013-real-forecast-days/`
- [x] T002 在 `package.json` 建立 `verify:sdd-013` 独立验收命令

---

## Phase 2: Foundational

**Purpose**: 建立目标日、日期计算和真实天气失败边界。

- [x] T003 [P] 定义 `today | tomorrow` 目标日类型、标签和校验 `lib/recommendations/constants.ts`
- [x] T004 扩展账号时区自然日计算并支持目标日期读取 `lib/recommendations/data.ts`
- [x] T005 [P] 将天气服务改为当前天气与精确明日预报，并删除模拟降级 `lib/recommendations/weather.ts`

**Checkpoint**: 可独立得到今天和明天的目标日期与真实天气，任何异常均明确失败。

---

## Phase 3: User Story 1 - 选择今天或明天生成搭配 (Priority: P1)

**Goal**: 今天与明天分别生成、保存和读取三套方案。

**Independent Test**: 先生成今日再生成明日，往返切换后两个日期各自保持一条结果且互不覆盖。

- [x] T006 [US1] 让生成动作校验目标日并按账号时区写入目标日期 `app/recommendations/actions.ts`
- [x] T007 [US1] 让推荐页按 `searchParams.day` 读取对应日期并统一日期文案 `app/recommendations/page.tsx`
- [x] T008 [US1] 增加今天/明天分段切换并提交隐藏目标日 `components/recommendations/recommendation-controls.tsx`

**Checkpoint**: User Story 1 可独立完成两个日期的生成、刷新和读取。

---

## Phase 4: User Story 2 - 只使用真实天气数据 (Priority: P1)

**Goal**: 普通界面不再生成、选择或展示模拟天气，失败时停止写入。

**Independent Test**: 成功时对照真实接口；模拟天气旧记录、网络失败和缺失明日日期均不产生可展示的新方案。

- [x] T009 [US2] 在生成动作中识别真实天气错误并停止推荐写入 `app/recommendations/actions.ts`
- [x] T010 [US2] 从普通界面移除测试天气并展示真实服务、实时/预报语义 `components/recommendations/recommendation-controls.tsx`、`app/recommendations/page.tsx`
- [x] T011 [US2] 在页面数据层拒绝旧模拟天气批次作为当前结果 `lib/recommendations/data.ts`

**Checkpoint**: 两个用户故事均可独立验收，真实天气失败时没有模拟数据或新推荐。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 完成自动验证、浏览器验收、进度和提交闭环。

- [x] T012 编写真实两日响应、精确日期、无模拟分支和日期唯一性验收 `scripts/verify-sdd-013.mjs`
- [x] T013 运行 `npm run check`、`npm run build`、`npm run verify:sdd-013` `specs/013-real-forecast-days/quickstart.md`
- [x] T014 完成 390px 浏览器今天/明天、失败提示和互不覆盖验收 `specs/013-real-forecast-days/quickstart.md`
- [x] T015 更新阶段状态、天气真实性约束和质量命令 `progress.md`、`AGENTS.md`
- [x] T016 提交 SDD-013 完成变更并记录提交号 `progress.md`

---

## Dependencies & Execution Order

- Phase 1 无依赖。
- Phase 2 依赖 Phase 1，并阻塞两个用户故事。
- US1 与 US2 共享推荐动作和页面，按 US1 后 US2 顺序完成。
- Phase 5 依赖两个用户故事完成。

## Parallel Opportunities

- T003 与 T005 可先在不同文件并行准备，再由 T004 统一日期契约。
- T012 的验证脚本骨架可在 UI 完成前准备，但最终断言依赖 T006-T011。
- 文档更新可在质量命令运行期间准备，最终状态只在全部通过后勾选。

## Implementation Strategy

1. 先建立目标日和真实天气服务，不改数据库结构。
2. 再让写入和读取都使用同一目标日期。
3. 移除用户侧测试天气并拒绝旧模拟结果。
4. 最后验证真实响应、失败不写入、两个日期互不覆盖和移动端界面。

## Format Validation

- 16 项任务均使用 `- [ ] TNNN` 格式。
- 用户故事任务均包含 `[US1]` 或 `[US2]`。
- 每项任务包含明确文件路径或命令验证目标。
