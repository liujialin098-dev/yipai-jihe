# Tasks: 账号城市与衣着偏好

**Input**: Design documents from `/specs/012-personalized-context/`

**Prerequisites**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

**Tests**: 本阶段要求独立自动验收和移动端浏览器验收。

## Phase 1: Setup

**Purpose**: 固定本阶段文档、数据边界与验证入口。

- [x] T001 核对 SDD-012 规格、研究、数据模型和接口契约 `specs/012-personalized-context/`
- [x] T002 在 `package.json` 建立 `verify:sdd-012` 独立验收命令

---

## Phase 2: Foundational

**Purpose**: 为城市与衣着偏好建立共同数据底座。

- [x] T003 新增账号位置、衣着偏好和衣物归属迁移 `supabase/migrations/20260825*_personalized_context.sql`
- [x] T004 同步远端生成的数据库类型 `lib/supabase/database.types.ts`
- [x] T005 [P] 建立衣着偏好、衣物归属枚举与共享匹配规则 `lib/personalization/constants.ts`
- [x] T006 [P] 建立中国城市解析与错误分类 `lib/recommendations/location.ts`

**Checkpoint**: 数据字段、类型和共享规则可供三个用户故事复用。

---

## Phase 3: User Story 1 - 保存常用城市并使用当地天气 (Priority: P1)

**Goal**: 武汉账号的新推荐使用武汉天气，未设置时不再静默显示北京。

**Independent Test**: 保存武汉后生成实时推荐，天气快照城市为武汉；无效城市不覆盖原值。

- [x] T007 [US1] 将天气服务改为显式接收账号位置并保留同城降级 `lib/recommendations/weather.ts`
- [x] T008 [US1] 在偏好保存动作中校验、解析和持久化城市，并使旧推荐失效 `app/settings/preferences/actions.ts`
- [x] T009 [US1] 在推荐动作中读取账号位置并处理未设置状态 `app/recommendations/actions.ts`
- [x] T010 [US1] 在偏好表单和推荐页展示城市输入、当前城市及设置引导 `components/preferences/preference-form.tsx`、`app/settings/preferences/page.tsx`、`app/recommendations/page.tsx`

**Checkpoint**: User Story 1 可独立通过武汉、无效城市和天气降级场景。

---

## Phase 4: User Story 2 - 按衣着偏好整理衣橱与推荐 (Priority: P1)

**Goal**: 男装账号可逆排除明确女装，推荐与衣橱使用同一规则。

**Independent Test**: 24 件演示衣物在男装模式排除 4 件连衣裙，切回不限恢复 24 件且数据未删除。

- [x] T011 [P] [US2] 为演示目录补充衣物归属并让加载动作写入归属 `lib/wardrobe/catalog.ts`、`app/wardrobe/actions.ts`
- [x] T012 [US2] 为衣橱列表、预览、计数和推荐候选应用共享可逆过滤 `lib/wardrobe/data.ts`、`lib/recommendations/data.ts`
- [x] T013 [P] [US2] 扩展衣物校验、编辑表单和详情展示归属 `lib/wardrobe/validation.ts`、`components/wardrobe/item-form.tsx`、`app/wardrobe/[id]/page.tsx`
- [x] T014 [US2] 扩展 AI 识别契约、确认入库和工作区修正归属 `lib/wardrobe/recognition.ts`、`components/wardrobe/ingestion-workspace.tsx`、`app/api/wardrobe/ingestions/[id]/confirm/route.ts`
- [x] T015 [US2] 将衣着偏好写入推荐提示并更新不足衣橱提示 `lib/recommendations/generator.ts`、`app/recommendations/actions.ts`

**Checkpoint**: User Story 2 可独立通过男装、不限、AI 入库和规则推荐场景。

---

## Phase 5: User Story 3 - 看懂当前个性化状态 (Priority: P2)

**Goal**: 设置页明确显示账号城市与衣着偏好。

**Independent Test**: 保存武汉和男装后，设置摘要刷新及重新登录仍显示对应值。

- [x] T016 [US3] 扩展服务端 Viewer 的城市与衣着偏好最小读取 `lib/auth/viewer.ts`
- [x] T017 [US3] 在设置摘要显示城市和衣着偏好并保留统一编辑入口 `app/settings/page.tsx`

**Checkpoint**: 三个用户故事均可独立演示。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 修复动效回归，完成自动化、安全和进度闭环。

- [x] T018 修复黑色按钮白色扫光并补充 reduced-motion 降级 `app/globals.css`、`specs/011-global-motion/`
- [x] T019 编写双会话、字段约束、RLS、过滤可逆和静态边界验收 `scripts/verify-sdd-012.mjs`
- [x] T020 执行 `npm run check`、`npm run build`、`npm run verify:sdd-012` 和移动端窄栏浏览器验收 `specs/012-personalized-context/quickstart.md`
- [x] T021 更新阶段状态、已知限制和开发约定 `progress.md`、`AGENTS.md`
- [ ] T022 提交 SDD-012 与 SDD-011 回归修复并记录提交号 `progress.md`

---

## Dependencies & Execution Order

- Phase 1 无依赖。
- Phase 2 依赖 Phase 1，并阻塞所有用户故事。
- US1 与 US2 均依赖 Phase 2；代码有共享文件，当前单代理按 US1 后 US2 顺序执行。
- US3 依赖偏好字段与 Viewer 类型完成。
- Phase 6 依赖三个用户故事完成。

## Parallel Opportunities

- T005 与 T006 可并行，因为分别修改个性化规则和城市解析文件。
- T011 与 T013 可并行，因为目录/加载和表单/校验位于不同文件组。
- 文档更新在质量命令通过后可与最终安全顾问读取并行。

## Implementation Strategy

1. 先完成加法迁移和共享类型，不改现有身份与 RLS 结构。
2. 先跑通武汉实时天气，再接入衣着偏好过滤。
3. 保持所有过滤可逆，旧数据只回填归属，不删除。
4. 最后修复按钮扫光、运行双会话验收并更新唯一进度文档。

## Format Validation

- 所有任务均使用 `- [ ] TNNN` 格式。
- 用户故事任务均包含 `[US1]`、`[US2]` 或 `[US3]`。
- 每项任务包含明确文件路径或命令验证目标。
