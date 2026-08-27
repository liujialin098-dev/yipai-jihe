# Tasks: 推荐页城市切换与连续入库

**Input**: Design documents from `/specs/018-city-switch-batch-reset/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 本功能涉及满批状态边界、账号城市写入和旧推荐失效，必须新增独立门禁并回归既有入库、个性化与真实天气阶段。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立阶段文档与独立验收入口。

- [x] T001 创建 `specs/018-city-switch-batch-reset/` 的规格、规划、研究、数据模型、契约、快速验收和质量清单
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-018` 命令
- [x] T003 [P] 在 `scripts/verify-sdd-018.mjs` 建立满批按钮、城市选择、无 IP 文案和 Server Action 安全边界的独立门禁

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 固定本地批次重置与账号城市快速更新的安全边界。

- [x] T004 在 `components/wardrobe/ingestion-workspace.tsx` 增加仅满 10 件确认后成立的批次完成状态和预览资源释放函数
- [x] T005 [P] 在 `app/recommendations/actions.ts` 增加只接收城市名、从当前会话派生用户身份的天气城市保存动作
- [x] T006 在 `scripts/verify-sdd-018.mjs` 验证批次重置不调用删除接口、城市 Action 不接受客户端用户 ID 且继续使用所有权条件

**Checkpoint**: 两条链路都只改变本阶段明确允许的状态，不删除持久衣物、不越权更新城市。

---

## Phase 3: User Story 1 - 满批后继续添加衣服 (Priority: P1) 🎯 MVP

**Goal**: 10 件全部入库后可一键恢复空队列并开始下一批。

**Independent Test**: 构造 10 个 confirmed 队列项，确认按钮出现；执行重置后队列为空且代码路径不发送删除请求。

- [x] T007 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 将满批操作区替换为“继续添加衣服”和“查看衣橱”
- [x] T008 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 保持部分完成、失败和处理中批次继续显示原识别与入库操作
- [x] T009 [US1] 在 `scripts/verify-sdd-018.mjs` 覆盖 10/10 完成、9/10 完成、队列清空与已入库数据不删除的静态边界

**Checkpoint**: 连续入库入口可见且不会静默丢弃未完成项目。

---

## Phase 4: User Story 2 - 在推荐页选择天气城市 (Priority: P1)

**Goal**: 用户在天气卡附近主动切换账号城市，并明确天气不按 IP 自动变化。

**Independent Test**: 武汉账号在推荐页保存上海后，旧推荐消失，设置摘要更新，新生成的今天与明天天气均为上海。

- [x] T010 [US2] 在 `components/recommendations/weather-city-selector.tsx` 实现可展开城市输入、当前来源说明、pending 和结果反馈
- [x] T011 [US2] 在 `app/recommendations/page.tsx` 接入城市选择器，并在有无推荐两种状态下都显示当前城市入口
- [x] T012 [US2] 在 `app/recommendations/actions.ts` 复用城市解析，更新当前账号城市五元组、删除旧推荐并刷新相关页面
- [x] T013 [US2] 在 `scripts/verify-sdd-018.mjs` 覆盖无 IP 声明、输入边界、旧推荐全部失效、RLS 所有权条件与真实天气入口

**Checkpoint**: 城市修改不需要离开推荐页，失败保留原城市，成功后不会展示旧城市天气。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 完成质量门禁、移动端验收和进度记录。

- [x] T014 运行 `npm run check`、`npm run build` 与 `npm run verify:sdd-018`
- [x] T015 运行 `npm run verify:sdd-007`、`npm run verify:sdd-015`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；识别实现未变，按成本约束不重复付费 AI 基准
- [x] T016 [P] 更新 `progress.md` 与 `AGENTS.md`，记录 SDD-018 状态、天气非 IP 来源、连续入库边界和质量命令
- [x] T017 更新 `specs/018-city-switch-batch-reset/quickstart.md`、`spec.md` 与本文件的完成状态
- [x] T018 仅暂存本阶段文件并提交，不包含用户未跟踪的 PRD 脚本和文档

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 与 US2 → Polish。
- T004 与 T005 可分别实现；T006 在两者完成后固定安全边界。
- US1 与 US2 修改不同主链路，可独立验收；T014 和 T015 在两者完成后执行。
- 文档完成状态只在独立门禁、构建和必要回归通过后更新。

## Implementation Strategy

先实现不触碰持久数据的满批队列重置，再实现只更新城市字段的独立 Server Action；随后把城市选择器放到推荐天气上下文中，并明确“不按 IP 自动切换”。最后用静态门禁与既有真实 Supabase/天气脚本证明连续入库、账号隔离和城市日期链路未回归。
