# Tasks: 场景一致性与雨天防水搭配

**Input**: Design documents from `/specs/017-scene-consistency-rain/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 本功能明确要求固定样本和既有推荐回归，因此测试任务属于交付范围。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 固定新阶段范围并建立独立验收入口。

- [x] T001 创建 `specs/017-scene-consistency-rain/` 的规格、规划、研究、数据模型、契约、快速验收和质量清单
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-017` 命令
- [x] T003 [P] 在 `scripts/verify-sdd-017.mjs` 建立混合场景、完整防水和不完整防水固定样本

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立 AI、规则与最终复验共用的纯函数边界。

- [x] T004 在 `lib/recommendations/occasion-profile.ts` 为场景画像增加异场景排斥集合与共享冲突判定
- [x] T005 [P] 在 `lib/recommendations/rain-protection.ts` 实现雨天代码、防水角色识别、完整候选和结果覆盖判断
- [x] T006 在 `scripts/verify-sdd-017.mjs` 先验证场景冲突真值表与雨天/雪天代码边界

**Checkpoint**: 场景冲突和防水判断可独立验证，后续生成链路不得自行复制另一套规则。

---

## Phase 3: User Story 1 - 场景不串台 (Priority: P1) 🎯 MVP

**Goal**: 休闲、约会和正式结果不再使用未标记当前场景的被排斥单品。

**Independent Test**: 固定混合衣橱逐场景检查规则结果与伪造 AI 形态结果。

- [x] T007 [US1] 更新 `lib/recommendations/occasion-profile.ts` 的正式画像，移除通勤弱关联和通勤优先风格
- [x] T008 [US1] 更新 `lib/recommendations/rules.ts`，确保候选过滤和衣橱充足判断不回退到冲突单品
- [x] T009 [US1] 更新 `lib/recommendations/validation.ts`，拒绝任意套装中的异场景单品
- [x] T010 [US1] 在 `scripts/verify-sdd-017.mjs` 覆盖休闲、约会、正式排斥边界和多场景基础款例外

**Checkpoint**: 规则与服务端复验对异场景衣物判断一致。

---

## Phase 4: User Story 2 - 整套风格一致 (Priority: P1)

**Goal**: AI、规则降级和最终复验表达同一场景契约。

**Independent Test**: 将一件异场景单品注入结构合法的三套结果，复验必须拒绝；规则结果必须保持合法。

- [x] T011 [US2] 更新 `lib/recommendations/generator.ts`，向模型明确当前场景优先、异场景硬拒绝和无二次重试约束
- [x] T012 [US2] 在 `scripts/verify-sdd-017.mjs` 覆盖 AI 形态违规结果拒绝、跨套不重复和衣橱不足不放宽边界
- [x] T013 [US2] 运行 `npm run verify:sdd-014`，确认四场景画像、冷热天气和小衣橱边界继续通过

**Checkpoint**: AI 无效时只进入一次既有规则降级，降级结果仍满足相同场景契约。

---

## Phase 5: User Story 3 - 雨天优先防水组合 (Priority: P2)

**Goal**: 雨天且库存完整时至少一套使用防水外层、下装和鞋；库存不完整时保持普通合法结果。

**Independent Test**: 用相同衣橱分别测试雨天、雪天和缺一类防水角色三种输入。

- [x] T014 [US3] 更新 `lib/recommendations/rules.ts`，在首套优先选择完整且合法的防水三件套
- [x] T015 [US3] 更新 `lib/recommendations/validation.ts`，在库存支持时强制批次至少一套覆盖三类防水角色
- [x] T016 [US3] 更新 `lib/recommendations/generator.ts`，把有条件的雨天完整防水组合写入 AI 提示
- [x] T017 [US3] 更新 `lib/recommendations/rules.ts` 的理由文案，只在真实雨天且实际使用防水组合时说明防水逻辑
- [x] T018 [US3] 在 `scripts/verify-sdd-017.mjs` 覆盖完整组合、库存不全、非雨天不加权和炎热冬季外套边界

**Checkpoint**: 雨天规则改变实际选品而非只改变文案，且不覆盖温度和场景边界。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完成全量门禁、文档和交付记录。

- [x] T019 运行 `npm run check` 与 `npm run build`
- [x] T020 运行 `npm run verify:sdd-017`、`verify:sdd-005`、`verify:sdd-012`、`verify:sdd-013` 和 `verify:sdd-014`
- [x] T021 [P] 更新 `progress.md`，记录 SDD-017 TODO、完成日期、验收结果和已知限制
- [x] T022 [P] 更新 `AGENTS.md`，记录场景硬边界、雨天条件规则和质量命令
- [x] T023 更新 `specs/017-scene-consistency-rain/quickstart.md` 与本文件完成状态
- [x] T024 [P] 在 `lib/wardrobe/catalog.ts`、`public/demo-wardrobe/` 与现有衣橱加载文案中补足 28 件演示衣橱和 4 件正式胶囊
- [ ] T025 仅暂存本阶段文件并提交，不包含用户未跟踪的 PRD 脚本和文档

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish。
- T004 与 T005 可分别实现；T006 依赖两者的公开契约。
- US2 依赖 US1 的共享冲突判断；US3 依赖同一冲突判断和防水纯函数。
- T014–T018 完成后才能执行完整 SDD-017 门禁。
- 文档完成状态只在所有验收命令通过后更新。

## Implementation Strategy

先用共享纯函数固定场景冲突真值表，再让规则和复验接入；随后更新 AI 提示。雨天作为独立增量加入，只有完整、合法、季节适配的三角色候选存在时才触发批次硬要求。最后集中回归既有推荐、个性化和真实天气阶段。
