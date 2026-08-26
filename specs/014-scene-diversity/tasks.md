# Tasks: 场景差异化推荐

**Input**: Design documents from `/specs/014-scene-diversity/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格明确要求固定样本、规则降级和既有推荐回归，因此包含先失败后实现的自动验收任务。

**Organization**: 任务按三个用户故事组织，每个故事均具有独立验收边界。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可在不同文件上并行处理
- **[Story]**: 对应 spec.md 的用户故事
- 所有任务包含明确文件路径

## Phase 1: Setup（独立门禁）

**Purpose**: 先建立会失败的场景差异验收，锁定当前雷同问题。

- [x] T001 在 `scripts/verify-sdd-014.mjs` 创建四场景固定男装衣橱、场景信号、正式雷区和两两 Jaccard 断言，并确认当前实现无法通过
- [x] T002 在 `package.json` 增加 `verify:sdd-014` 命令并将独立门禁纳入本阶段 quickstart

---

## Phase 2: Foundational（共享场景画像）

**Purpose**: 建立 AI、规则和校验共同依赖的单一场景定义。

**⚠️ CRITICAL**: 未完成本阶段前不得分别修改三条推荐路径。

- [x] T003 在 `lib/recommendations/occasion-profile.ts` 定义四场景画像、两个独立信号判定、正式仅运动硬冲突和核心单品集合工具
- [x] T004 在 `scripts/verify-sdd-014.mjs` 直接验证共享画像四键完整、男装无裙装依赖及正式仅运动冲突

**Checkpoint**: 共享画像可独立验证，后续路径不再各自硬编码场景语义。

---

## Phase 3: User Story 1 - 四种场景呈现明确差异 (Priority: P1) 🎯 MVP

**Goal**: AI 与规则结果都体现通勤、休闲、约会、正式的不同核心选择。

**Independent Test**: 同一固定衣橱和天气下四场景各三套均通过场景画像，六组核心单品 Jaccard 均不超过 0.5。

- [x] T005 [P] [US1] 在 `lib/recommendations/generator.ts` 将共享场景画像、两信号要求和正式雷区写入现有单次模型提示，不增加模型调用
- [x] T006 [US1] 在 `lib/recommendations/rules.ts` 使用场景画像调整候选排序、场景锚点和必要补全，使规则降级稳定产出差异化三套
- [x] T007 [US1] 在 `lib/recommendations/validation.ts` 对 AI 与规则结果统一执行两个场景信号及正式仅运动冲突校验
- [x] T008 [US1] 运行 `npm run verify:sdd-014` 并修正固定样本，直到四场景匹配与六组差异度全部通过

**Checkpoint**: User Story 1 可独立演示四场景结果差异，不依赖新页面或数据库变化。

---

## Phase 4: User Story 2 - 差异化不牺牲真实可穿性 (Priority: P1)

**Goal**: 天气、男装偏好、当前用户衣物和三套完整性保持既有正确性。

**Independent Test**: 热天与冷天固定样本均保持天气约束，男装不出现裙装，AI 无效时规则路径仍通过同一场景门禁。

- [x] T009 [P] [US2] 在 `scripts/verify-sdd-014.mjs` 增加热天、冷天、男装过滤、无效 AI 结构和正式运动鞋拒绝用例
- [x] T010 [US2] 回归并按需修正 `app/recommendations/actions.ts` 的 AI 无效转规则行为，确保不保存未通过场景校验的 AI 结果
- [x] T011 [US2] 运行 `npm run verify:sdd-005`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`，确认推荐、个性化与真实天气无回归

**Checkpoint**: User Story 2 证明差异化是质量增强，不改变天气、性别和数据隔离边界。

---

## Phase 5: User Story 3 - 衣橱有限时给出稳妥结果 (Priority: P2)

**Goal**: 小衣橱优先完整性和基本场景匹配，无法完成时保持明确不足提示。

**Independent Test**: 最小可用衣橱仍返回三套并各有两个场景信号；少一件关键类别时稳定抛出既有衣橱不足错误。

- [x] T012 [US3] 在 `scripts/verify-sdd-014.mjs` 增加最小可用衣橱与关键类别不足用例
- [x] T013 [US3] 在 `lib/recommendations/rules.ts` 调整必要复用边界与场景信号补全，确保不放宽天气、完整性和跨套不重复

**Checkpoint**: 三个用户故事全部完成，小衣橱不会因差异度目标生成雷区或伪造结果。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完成文档、质量门禁、提交和公开部署。

- [x] T014 [P] 更新 `AGENTS.md` 与 `progress.md`，记录 SDD-014 约束、质量命令、验收证据和阶段状态
- [x] T015 在 `specs/014-scene-diversity/tasks.md` 勾选已完成任务，并运行 `npm run check`、`npm run build` 与 `git diff --check`
- [x] T016 提交 SDD-014 代码与文档，使用 `npx vercel deploy --prod --yes --scope jialin-d583` 发布到既有 `yipai-jihe` 项目
- [x] T017 使用固定 Production 域名验证核心页面、匿名会话、四场景生成与最近 30 分钟 error 日志，并把最终部署 ID 写入 `AGENTS.md` 和 `progress.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: 无依赖，先建立失败门禁。
- **Foundational**: 依赖 Setup，阻塞所有用户故事。
- **US1**: 依赖共享画像，是 MVP 主体。
- **US2**: 依赖 US1 的统一校验，可并行补充测试文件但回归必须在 US1 后运行。
- **US3**: 依赖 US1 的规则选择，小衣橱边界最后收敛。
- **Polish**: 依赖全部用户故事完成。

### User Story Dependencies

- **US1**: 完成共享画像后可独立交付。
- **US2**: 使用 US1 的场景门禁验证天气、男装和无效 AI 降级。
- **US3**: 使用 US1 的规则路径验证衣橱有限边界。

### Parallel Opportunities

- T005 与 T009 可在不同文件上并行准备，但 T009 的完整执行等待 T007。
- T014 可在代码验收稳定后与最终质量命令准备并行。
- 数据库无迁移，现有 Supabase 回归脚本可在静态检查通过后按顺序运行并自动清理。

---

## Implementation Strategy

### MVP First

1. T001-T004 建立失败门禁和共享画像。
2. T005-T008 完成四场景差异化主路径。
3. 停止并验证 12 套固定结果和 6 组重合度。

### Incremental Delivery

1. US1 解决用户直接观察到的雷同。
2. US2 证明天气、男装和规则降级没有退化。
3. US3 收敛小衣橱边界。
4. 完成文档、提交并更新公开 Production。

## Notes

- 不新增数据库迁移、环境变量、依赖或场景历史。
- 不通过提高随机度制造不可控差异。
- 所有完成任务必须立即在本文件标记 `[x]`。
