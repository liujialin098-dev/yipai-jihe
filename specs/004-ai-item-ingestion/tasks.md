# 任务：原图上传与 AI 识别入库

**输入**：`specs/004-ai-item-ingestion/` 下的规格、计划、数据模型、契约与快速验收文档  
**组织方式**：按用户故事递增交付，先打通单件识别，再确认入库，最后增加批量处理。

## 阶段 1：准备

**目标**：固定运行配置、验证命令和本阶段目录。

- [x] T001 在 `.env.example` 与 `AGENTS.md` 记录服务端 `OPENAI_API_KEY`、可选 `OPENAI_VISION_MODEL` 和密钥边界
- [x] T002 [P] 在 `package.json` 增加 `verify:sdd-004` 命令并建立 `scripts/verify-sdd-004.mjs` 验证入口
- [x] T003 [P] 在 `specs/004-ai-item-ingestion/quickstart.md` 固定 10 张安全样本、双会话和 390px 视口验收步骤

---

## 阶段 2：公共底座（阻塞项）

**目标**：完成所有用户故事共同依赖的数据、权限、校验和服务端辅助能力。

- [x] T004 在 `supabase/migrations/20260821*_ai_item_ingestion.sql` 创建 `wardrobe_ingestions`、幂等字段、索引、约束、显式授权和 RLS 策略
- [x] T005 在 `lib/supabase/database.types.ts` 同步 `wardrobe_ingestions` 与 `wardrobe_items.source_ingestion_id` 类型
- [x] T006 [P] 在 `lib/wardrobe/validation.ts` 增加文件元数据、入库请求、识别结果和 JSON 请求校验
- [x] T007 [P] 在 `lib/wardrobe/recognition.ts` 定义共享识别 Schema、OpenAI 提示词、Responses API 调用、12 秒超时和稳定错误分类
- [x] T008 在 `lib/wardrobe/ingestion.ts` 实现当前用户项目读取、过期清理、短时图片签名和安全错误响应辅助函数

**检查点**：数据库和共享服务就绪，用户故事可以开始实现。

---

## 阶段 3：用户故事 1——选择原图并得到可修正结果（P1）

**目标**：完成单张选图、直传、真实 AI 识别、失败重试和手工填写。

**独立验收**：选择一张不超过 10MB 的 jpg/png，观察上传和识别状态，得到可编辑结果；无 Key、超时或无效结果时保留原图并可手工填写。

- [x] T009 [US1] 在 `app/api/wardrobe/ingestions/route.ts` 实现鉴权、元数据校验、幂等创建、过期清理和 signed upload token 返回
- [x] T010 [US1] 在 `app/api/wardrobe/ingestions/[id]/recognize/route.ts` 实现所有权与有效期检查、图片存在检查、OpenAI 识别和结果持久化
- [x] T011 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 实现单张文件选择、格式/大小校验、本地预览和 Supabase signed upload
- [x] T012 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 增加上传中、识别中、成功、失败、超时、重试和手工填写状态
- [x] T013 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 复用衣橱枚举渲染名称与六类可编辑字段，并保持人工修改值
- [x] T014 [US1] 在 `app/wardrobe/new/page.tsx` 替换占位页为 Apple 风格的识别工作区入口和匿名数据风险提示
- [x] T015 [US1] 在 `scripts/verify-sdd-004.mjs` 增加文件边界、Schema 守卫、缺少 OpenAI Key 的手工降级和单件 API 状态检查

**检查点**：单件可以独立完成“选图 → 识别/失败 → 编辑”，尚不要求创建正式衣物。

---

## 阶段 4：用户故事 2——确认后安全写入自己的衣橱（P2）

**目标**：把最终人工确认值幂等写入现有衣橱，并支持安全取消和 24 小时生命周期。

**独立验收**：修正一项 AI 建议并确认，正式衣橱只新增一件且详情显示修改后的字段与原图；连续确认 3 次仍为同一条记录；另一会话无法访问。

- [x] T016 [US2] 在 `app/api/wardrobe/ingestions/[id]/confirm/route.ts` 实现最终字段校验、图片存在检查和 `source_ingestion_id` 幂等入库
- [x] T017 [US2] 在 `app/api/wardrobe/ingestions/[id]/confirm/route.ts` 记录人工修正字段、确认状态和正式 `wardrobe_item_id`，并恢复部分成功重试
- [x] T018 [US2] 在 `app/api/wardrobe/ingestions/[id]/route.ts` 实现未确认项目的幂等取消，按 Storage API 后数据库的顺序清理
- [x] T019 [US2] 在 `components/wardrobe/ingestion-workspace.tsx` 增加确认入库、取消、成功跳转和错误后保留编辑内容
- [x] T020 [US2] 在 `lib/wardrobe/data.ts` 与 `app/wardrobe/[id]/page.tsx` 验证真实上传原图沿用现有签名读取和详情展示
- [x] T021 [US2] 在 `scripts/verify-sdd-004.mjs` 增加三次确认幂等、两匿名会话 RLS/Storage 隔离、取消清理和过期拒绝检查

**检查点**：单件核心闭环完整且可独立验收。

---

## 阶段 5：用户故事 3——批量处理最多 10 件（P3）

**目标**：在同一工作区对最多 10 张图片独立识别、修正、重试、移除和批量确认。

**独立验收**：选择 10 张安全样本，每项状态互不影响；修正至少一项并批量确认，失败项可单独重试或手工完成，第 11 张被明确拒绝。

- [x] T022 [US3] 在 `components/wardrobe/ingestion-workspace.tsx` 把单件状态扩展为稳定 id 的最多 10 项队列并拒绝超出部分
- [x] T023 [US3] 在 `components/wardrobe/ingestion-workspace.tsx` 实现最多 3 项并发的批量上传与识别，保证单件失败不终止批次
- [x] T024 [US3] 在 `components/wardrobe/ingestion-workspace.tsx` 实现逐项选择、重试、手工编辑、移除和批量确认
- [x] T025 [US3] 在 `components/wardrobe/ingestion-workspace.tsx` 增加成功、失败、待处理汇总与 390px 无水平溢出的移动端布局
- [x] T026 [US3] 在 `scripts/verify-sdd-004.mjs` 增加 10 项边界、独立失败、并发上限和批量确认结果检查

**检查点**：全部三个用户故事可独立演示。

---

## 阶段 6：收尾与跨故事验收

**目标**：完成可重复验收、文档追踪、质量门禁和阶段提交。

- [x] T027 在 `scripts/verify-sdd-004.mjs` 和 `specs/004-ai-item-ingestion/quickstart.md` 记录 10 张样本的模型、耗时、类别正确性和修正字段，验证至少 8/10 类别正确
- [x] T028 运行 `npm run check`、`npm run build` 和 `npm run verify:sdd-004`，修复发现的问题并在 `specs/004-ai-item-ingestion/tasks.md` 勾选已完成任务
- [x] T029 更新 `progress.md` 与 `AGENTS.md` 的阶段状态、完成日期、验收结果、已知限制、环境变量和提交记录
- [ ] T030 仅提交 SDD-004 相关文件并在 `progress.md` 回填最终 commit hash

---

## 依赖与执行顺序

- 阶段 1 可立即开始；T002 与 T003 可并行。
- 阶段 2 依赖阶段 1；T006 与 T007 可并行，T008 依赖 T004、T005、T006。
- US1 依赖公共底座，是最小可演示范围。
- US2 依赖 US1 已产生可编辑项目；完成后形成单件核心闭环。
- US3 复用 US1/US2 的单件 API，最后扩展客户端编排。
- 收尾阶段依赖全部目标故事完成。

## 并行示例

```text
T006：共享业务校验
T007：OpenAI 识别服务

T009：创建项目 API
T011：客户端文件队列和直传骨架

T016：确认 API
T018：取消 API
```

## 实施策略

1. 先完成公共数据库与识别服务。
2. 交付 US1，独立验证真实 AI 与手工降级。
3. 交付 US2，形成可用的单件入库 MVP。
4. 在稳定单件 API 上交付 US3，不为批量新增第二套后端流程。
5. 通过全量质量门禁后更新进度并提交。
