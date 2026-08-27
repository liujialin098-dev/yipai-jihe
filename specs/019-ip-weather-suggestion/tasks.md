# Tasks: IP 天气城市建议

**Input**: Design documents from `/specs/019-ip-weather-suggestion/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 本阶段涉及不可靠位置输入、会话隔离、推荐城市一致性和 Supabase 所有权写入，必须新增独立固定样本门禁并回归既有真实天气与城市切换阶段。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立独立 SDD 文档和验收入口。

- [x] T001 创建 `specs/019-ip-weather-suggestion/` 的规格、规划、研究、数据模型、契约、快速验收和质量清单
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-019` 命令
- [x] T003 [P] 在 `scripts/verify-sdd-019.mjs` 建立 IP 请求头、距离、Cookie 隔离和代码接入的独立门禁

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立不依赖页面和数据库的 IP 候选判断，以及账号绑定的服务端会话位置上下文。

- [x] T004 [P] 在 `lib/recommendations/ip-location.ts` 实现 RFC3986 城市解码、字段校验、Haversine 距离和 50 公里提示门槛
- [x] T005 [P] 在 `lib/auth/viewer.ts` 补齐当前账号常用城市的坐标读取，不改变现有会话身份规则
- [x] T006 在 `lib/recommendations/location-context.ts` 实现版本化 HttpOnly 会话 Cookie 的编码、校验、当前用户绑定与有效位置选择
- [x] T007 在 `scripts/verify-sdd-019.mjs` 覆盖缺失字段、非中国、无效坐标、同城、跨城、损坏 Cookie 和跨账号 Cookie

**Checkpoint**: IP 只产生待确认建议；临时位置只有匹配当前用户且结构合法时才参与天气上下文。

---

## Phase 3: User Story 1 - 发现可能所在城市 (Priority: P1) 🎯 MVP

**Goal**: 跨城请求出现不自动切换的近似城市提示，同城、无定位和不受支持位置保持安静。

**Independent Test**: 武汉有效城市配合杭州请求头返回杭州建议；武汉附近、字段缺失和非中国样本均不返回建议，当前有效城市不发生变化。

- [x] T008 [US1] 在 `lib/recommendations/data.ts` 组装保存城市、当前有效城市、临时状态和 IP 建议，并按有效城市计算日期与校验推荐天气城市
- [x] T009 [US1] 在 `app/recommendations/page.tsx` 把当前城市来源、常用城市和 IP 建议传入城市选择器
- [x] T010 [US1] 在 `components/recommendations/weather-city-selector.tsx` 展示近似城市、误差说明和两个待确认操作，不在无建议时展示错误定位状态
- [x] T011 [US1] 在 `scripts/verify-sdd-019.mjs` 验证页面文案不宣称自动定位、不保存原始 IP 且无默认武汉/北京回退

**Checkpoint**: 用户可看见可信的跨城建议，但未点击前推荐、Cookie 和账号城市都不改变。

---

## Phase 4: User Story 2 - 本次使用、永久保存与恢复 (Priority: P1)

**Goal**: 用户可明确选择临时或永久城市，临时状态可恢复且推荐读取与生成保持一致。

**Independent Test**: 武汉账号确认杭州“本次使用”后只改变当前会话；恢复后回武汉；“设为常用城市”后跨刷新保持杭州，另一账号不继承临时城市。

- [x] T012 [US2] 在 `app/recommendations/actions.ts` 扩展城市确认模式，临时模式写账号绑定 Cookie，永久模式更新自身偏好并清除临时 Cookie
- [x] T013 [US2] 在 `app/recommendations/actions.ts` 增加恢复常用城市动作，切换和恢复均删除当前用户旧推荐并刷新相关页面
- [x] T014 [US2] 在 `app/recommendations/actions.ts` 让推荐生成使用当前有效城市，不再只读取账号城市
- [x] T015 [US2] 在 `components/recommendations/weather-city-selector.tsx` 接入“本次使用”“设为常用城市”和“恢复常用城市”的 pending、成功与错误反馈
- [x] T016 [US2] 在 `components/recommendations/recommendation-controls.tsx` 把天气来源说明改为当前选择城市，避免临时城市被误称为账号城市
- [x] T017 [US2] 在 `scripts/verify-sdd-019.mjs` 验证 Action 不接受用户 ID/坐标、永久更新保留所有权条件、临时 Cookie 为 HttpOnly 会话级且所有切换清除旧推荐

**Checkpoint**: 临时和永久选择语义清晰，另一账号不会继承，天气和推荐始终使用同一当前有效城市。

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 完成质量门禁、移动端验收、进度文档和提交。

- [x] T018 运行 `npm run check`、`npm run build` 与 `npm run verify:sdd-019`
- [x] T019 运行 `npm run verify:sdd-012`、`npm run verify:sdd-013` 与 `npm run verify:sdd-018`
- [x] T020 在 390px 本地浏览器使用合成账号和可控请求头验收无 IP 安静降级、杭州建议、双操作、无溢出和无控制台 error；临时、恢复与永久分支由真实 Cookie 纯函数和 Action 契约覆盖
- [ ] T021 [P] 更新 `progress.md` 与 `AGENTS.md`，记录 SDD-019 状态、IP 仅作建议、会话城市边界和质量命令
- [x] T022 更新 `specs/019-ip-weather-suggestion/spec.md`、`quickstart.md` 与本文件的完成状态和实际证据
- [ ] T023 仅暂存本阶段文件并提交，不包含用户未跟踪的 PRD 脚本和文档

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → Polish。
- T004 与 T005 可并行；T006 依赖二者的类型和账号字段。
- US1 可仅展示建议并独立验收；US2 在其基础上增加状态变更。
- T012、T013、T014 同在一个 Action 文件，按顺序执行；T015 在 Action 契约稳定后接入。
- 文档完成状态只在独立门禁、构建、真实天气回归和 390px 验收通过后更新。

## Parallel Opportunities

- T002、T003 与文档整理可并行。
- T004 的纯 IP 解析与 T005 的 Viewer 字段扩展修改不同文件，可并行。
- T010 的 UI 骨架可在 T008 数据契约明确后与 T011 的静态门禁补充并行。
- T021 可在质量命令运行期间先准备草稿，但只能在结果确认后标记完成。

## Implementation Strategy

先交付只读的 IP 建议并证明不会自动修改，再增加账号绑定会话 Cookie和两种确认模式；随后统一推荐读取、日期与生成使用同一有效城市。最后用固定请求头/Cookie 样本、现有 Supabase 双账号与真实天气脚本以及 390px 浏览器完成验收，不部署到 Production，除非用户另行要求。
