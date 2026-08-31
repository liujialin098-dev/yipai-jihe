# Tasks: 设备定位天气城市

**Input**: Design documents from `/specs/020-device-location-weather/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 本阶段涉及浏览器权限、精确位置隐私、外部城市确认和账号城市写入，必须新增固定样本与静态边界门禁，并回归既有城市和真实天气阶段。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立独立 SDD 文档和验收入口。

- [x] T001 创建 `specs/020-device-location-weather/` 的规格、规划、研究、数据模型、契约、快速验收和质量清单
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-020` 命令
- [x] T003 [P] 在 `scripts/verify-sdd-020.mjs` 建立坐标校验、反向响应解析、显式触发和隐私边界门禁

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立不依赖页面状态的坐标校验与城市级反向解析。

- [x] T004 在 `lib/recommendations/device-location.ts` 实现坐标范围校验、BigDataCloud 响应解析、中国范围和坐标来源过滤
- [x] T005 在 `lib/recommendations/device-location.ts` 实现用户触发型客户端请求、8 秒超时和稳定错误类型
- [x] T006 在 `scripts/verify-sdd-020.mjs` 用固定中国城市、非中国、非法坐标、缺字段和服务不可用样本验证基础模块

**Checkpoint**: 设备坐标只得到受支持的中国城市名，失败不返回默认城市或精确地址。

---

## Phase 3: User Story 1 - 主动使用当前位置 (Priority: P1) 🎯 MVP

**Goal**: 用户点击并授权后，可只在当前浏览器会话使用定位城市的真实天气。

**Independent Test**: 武汉常用城市账号定位到杭州并选择“本次使用”后，当前城市变杭州、常用城市仍是武汉，旧推荐失效。

- [x] T007 [US1] 在 `app/recommendations/actions.ts` 增加设备定位城市 Action，校验客户端城市、重新读取当前用户并复用既有城市规范化
- [x] T008 [US1] 在 `app/recommendations/actions.ts` 让 session 模式复用账号绑定 Cookie 和当前用户旧推荐清理，返回城市级结果
- [x] T009 [US1] 在 `components/recommendations/weather-city-selector.tsx` 增加只由按钮触发的单次低精度定位和“本次使用当前位置”入口
- [x] T010 [US1] 在 `components/recommendations/weather-city-selector.tsx` 增加 pending、成功反馈、隐私说明和 BigDataCloud 处理说明
- [x] T011 [US1] 在 `scripts/verify-sdd-020.mjs` 验证定位不在 Effect/加载路径触发、不使用持续或高精度定位、不提交用户 ID/设备坐标/行政区/时区

**Checkpoint**: 页面不会自动请求权限；临时城市只对当前账号会话生效，天气继续来自真实数据。

---

## Phase 4: User Story 2 - 保存为常用城市 (Priority: P1)

**Goal**: 用户可把定位城市明确保存为当前账号常用城市，且不影响其他账号。

**Independent Test**: 定位到杭州并选择“设为常用城市”后刷新和重登录仍为杭州；另一账号保持原城市。

- [x] T012 [US2] 在 `app/recommendations/actions.ts` 让 saved 模式更新当前用户城市五元组并清除旧临时城市
- [x] T013 [US2] 在 `components/recommendations/weather-city-selector.tsx` 增加“设为常用城市”入口，与临时模式共享单次定位和 pending
- [x] T014 [US2] 在 `scripts/verify-sdd-020.mjs` 验证保存动作使用 `auth.getUser()`、自身 RLS 条件、城市中心五元组和旧推荐失效

**Checkpoint**: 临时与永久语义清晰，设备精确坐标不进入持久模型。

---

## Phase 5: User Story 3 - 拒绝或无法定位时继续使用 (Priority: P2)

**Goal**: 权限拒绝、超时、不可用和不支持时保留原城市与手动入口。

**Independent Test**: 四种浏览器失败分支均显示对应说明，原城市不变，手动城市仍可保存。

- [x] T015 [US3] 在 `components/recommendations/weather-city-selector.tsx` 映射权限拒绝、超时、不可用和不支持错误，不自动重试
- [x] T016 [US3] 在 `scripts/verify-sdd-020.mjs` 验证失败文案、10 秒超时、5 分钟缓存、低精度和手动入口保留
- [x] T017 [US3] 调整 `scripts/verify-sdd-018.mjs` 与 `scripts/verify-sdd-019.mjs`，把旧“全面禁止设备定位”升级为“禁止静默定位，允许 SDD-020 显式点击定位”

**Checkpoint**: 定位是增强能力而非阻塞依赖，任何失败都不制造天气或覆盖城市。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完成质量门禁、移动端验收、进度文档和提交。

- [x] T018 运行 `npm run check`、`npm run build`、`npm run verify:sdd-020`、`npm run verify:sdd-018` 与 `npm run verify:sdd-019`
- [x] T019 运行 `npm run verify:sdd-013`，确认真实今天/明天天气和日期隔离不回归
- [x] T020 在 390px 本地浏览器用无账号临时组件预览验收无自动权限、临时/常用入口、无溢出和无控制台 error；四种失败反馈由独立门禁覆盖
- [x] T021 [P] 更新 `progress.md` 与 `AGENTS.md`，记录 SDD-020 边界、来源政策、质量命令和未部署状态
- [x] T022 更新 `specs/020-device-location-weather/spec.md`、`quickstart.md` 与本文件的完成状态和实际证据
- [x] T023 仅暂存本阶段文件并提交，不包含用户未跟踪的 PRD 脚本和文档

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish。
- T004 先定义解析契约，T005 再接入客户端外部请求；T006 覆盖纯函数和请求失败。
- US1 先完成临时定位最小闭环；US2 只增加明确持久化分支；US3 统一失败体验并更新旧门禁。
- T020 依赖全部代码和自动门禁完成；文档只能在实际结果确认后标记完成。

## Parallel Opportunities

- T002、T003 与 SDD 文档整理修改不同文件，可并行。
- T010 的静态 UI 说明可在 T007 Action 契约稳定后与 T011 门禁补充并行。
- T021 可在质量命令运行期间准备草稿，但不得提前写“已完成”。

## Implementation Strategy

先交付用户点击后的“本次使用当前位置”，证明无静默权限、无精确坐标持久化和真实天气一致性；再增加“设为常用城市”，最后补齐失败分支与旧阶段回归。完成本地验证和提交，不发布 Production，除非用户另行要求。
