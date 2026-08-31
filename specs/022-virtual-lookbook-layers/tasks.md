# 任务：虚拟模特与分层穿搭

**输入**：`spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

## Phase 1：共享底座

- [x] T001 在 `lib/recommendations/layers.ts` 建立稳定角色派生、标签和数量约束
- [x] T002 在 `lib/recommendations/constants.ts` 扩展单套数量与可选 Lookbook 元数据
- [x] T003 在 `lib/recommendations/validation.ts` 统一校验 3～7 件、类别上限和 Lookbook 字段

## Phase 2：用户故事 1——复杂分层推荐（P1）

**目标**：AI 与规则推荐可在天气和库存允许时加入内搭与最多两件配饰。

**独立测试**：冷、温、热三类固定样本均通过硬约束，层次角色一一对应。

- [x] T004 [US1] 在 `lib/recommendations/generator.ts` 更新复杂搭配提示与 7 件输出上限
- [x] T005 [US1] 在 `lib/recommendations/rules.ts` 增加温度驱动内搭与第二配饰选择
- [x] T006 [US1] 在 `lib/feedback/replacement.ts` 保持换件后的角色合法并清空旧效果图

## Phase 3：用户故事 2——单套虚拟模特效果图（P1）

**目标**：用户可为所属推荐的单套按需生成并缓存私有 Lookbook。

**独立测试**：成功图可刷新读取；错误不改变推荐；跨账号请求被拒绝。

- [x] T007 [P] [US2] 在 `lib/openai/images.ts` 增加服务端 Image API 传输与安全错误映射
- [x] T008 [P] [US2] 在 `lib/recommendations/lookbook.ts` 建立固定形象提示、路径和响应校验
- [x] T009 [US2] 在 `app/recommendations/actions.ts` 增加身份重验、图像生成、私有上传和 JSON 更新
- [x] T010 [US2] 在 `lib/recommendations/data.ts` 验证账号路径并签发短期图片地址

## Phase 4：用户故事 3——可信效果图界面（P2）

**目标**：效果图与固定模特呈现高级，但真实单品和误差说明始终可见。

**独立测试**：有图、无图、生成中和错误四种状态在 390px 下均清晰可用。

- [x] T011 [P] [US3] 将 `public/virtual-models/neutral-studio.png` 接入固定无身份模特占位
- [x] T012 [US3] 在 `components/recommendations/lookbook-generator.tsx` 实现生成状态和可重试反馈
- [x] T013 [US3] 在 `components/recommendations/recommendation-card.tsx` 重构效果图区、角色标签和实拍清单
- [x] T014 [US3] 在 `app/recommendations/page.tsx` 传入衣着偏好与签名效果图数据

## Phase 5：验证与交付

- [x] T015 在 `scripts/verify-sdd-022.mjs` 增加角色、边界、所有权和 UI 静态门禁
- [x] T016 在 `package.json` 增加 `verify:sdd-022` 并运行 check/build/推荐回归
- [x] T017 更新 `progress.md`、`AGENTS.md` 和 SDD 验收记录
- [x] T018 提交 SDD-022 代码与文档，不包含用户未追踪文件

## 依赖顺序

- T001～T003 阻塞全部故事。
- T004～T006 完成后普通推荐已可独立交付。
- T007、T008 可并行，完成后执行 T009、T010。
- T011 可与服务端实现并行；T012～T014 依赖 Action 和数据读取契约。
- T015～T018 在三个用户故事完成后执行。

## 实施策略

先交付不依赖图像服务的分层搭配，再接入可失败的单套效果图，最后优化移动端表现。任何图像能力都不得削弱真实天气、场景边界、衣着归属、完整性、跨套不重复和账号隔离。
