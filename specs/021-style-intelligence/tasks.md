# 任务：风格智能、品牌识别与本季灵感

**输入**：`spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

## Phase 1：共享底座

- [x] T001 在 `lib/wardrobe/constants.ts` 扩展 14 风格目录与统一类型守卫
- [x] T002 在 `lib/recommendations/style-direction.ts` 建立场景兼容和三套方向解析
- [x] T003 在 `supabase/migrations/*_style_intelligence.sql` 增加品牌并扩展风格约束
- [x] T004 在 `lib/supabase/database.types.ts` 同步品牌字段类型

## Phase 2：用户故事 1——品牌与细分风格识别（P1）

**目标**：识别结果给出可确认品牌和 14 类风格，最终值可入库与编辑。

**独立测试**：严格契约拒绝猜测品牌与未知风格；品牌可在确认、详情和编辑链路保存。

- [x] T005 [US1] 在 `lib/wardrobe/validation.ts` 增加品牌与品牌置信校验
- [x] T006 [US1] 在 `lib/wardrobe/recognition.ts` 更新严格 Schema 与不猜品牌提示词
- [x] T007 [US1] 在 `components/wardrobe/ingestion-workspace.tsx` 增加品牌建议与编辑输入
- [x] T008 [US1] 在 `app/api/wardrobe/ingestions/[id]/confirm/route.ts` 持久化最终品牌
- [x] T009 [US1] 在 `lib/wardrobe/data.ts`、`components/wardrobe/item-form.tsx` 和衣物详情展示品牌

## Phase 3：用户故事 2——偏好与多风格推荐（P1）

**目标**：长期偏好支持 14 风格，单次可自动或指定风格，AI/规则/校验一致。

**独立测试**：自动模式三套方向不同；指定模式保持方向；不兼容输入被服务端拒绝。

- [x] T010 [US2] 在 `components/preferences/preference-form.tsx` 与 `app/settings/preferences/actions.ts` 接入扩展风格
- [x] T011 [US2] 在 `lib/feedback/preferences.ts` 保持 14 风格分数重算稳定
- [x] T012 [US2] 在 `lib/recommendations/constants.ts` 扩展推荐契约与搭配要点
- [x] T013 [US2] 在 `components/recommendations/recommendation-controls.tsx` 增加自动/指定风格选择
- [x] T014 [US2] 在 `app/recommendations/actions.ts` 校验风格输入并解析三套方向
- [x] T015 [US2] 在 `lib/recommendations/generator.ts`、`rules.ts` 与 `validation.ts` 共用风格方向
- [x] T016 [US2] 在 `components/recommendations/recommendation-card.tsx` 展示中文风格和搭配要点

## Phase 4：用户故事 3——本季趋势灵感（P2）

**目标**：展示有来源、日期和有效期的当前季节灵感。

**独立测试**：每条有来源且外链安全；过期条目不标本季；页面不复制外部图片。

- [x] T017 [US3] 在 `lib/recommendations/trend-catalog.ts` 建立 2026 秋季来源快照
- [x] T018 [US3] 在 `components/recommendations/trend-inspiration.tsx` 创建趋势卡片
- [x] T019 [US3] 在 `app/recommendations/page.tsx` 接入趋势区并保持 390px 布局

## Phase 5：验证与交付

- [x] T020 在 `scripts/verify-sdd-021.mjs` 增加静态契约、风格方向和趋势来源门禁
- [x] T021 在 `package.json` 增加 `verify:sdd-021` 并运行 check/build/回归
- [x] T022 更新 `progress.md`、`AGENTS.md` 和 SDD 验收记录
- [x] T023 提交 SDD-021 代码与文档，不包含用户未追踪文件

## 依赖顺序

- T001～T004 阻塞全部故事。
- US1 与 US2 在共享底座后可分文件推进；US3 只依赖 T001。
- T020～T023 在三个故事完成后执行。

## 实施策略

先完成品牌与风格数据闭环，再完成推荐差异，最后接入只读趋势内容。任何风格要求都不得跳过现有天气、场景、衣着归属、完整性、跨套不重复和雨天规则。
