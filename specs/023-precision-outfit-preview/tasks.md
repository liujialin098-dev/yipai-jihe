# 任务：精准搭配预览

**输入**：`spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

## Phase 1：精准预览组件（MVP）

**目标**：默认展示固定人物比例参照和真实衣物原图分层板。

**独立测试**：3～7 件推荐中每件衣物都能在预览或名称占位中找到，且角色顺序稳定。

- [x] T001 [P] [US1] 在 `components/recommendations/precision-outfit-preview.tsx` 建立固定人物参照、真实衣物原图分层板和缺图占位
- [x] T002 [US1] 在 `components/recommendations/recommendation-card.tsx` 接入精准预览并保留实拍核对清单

## Phase 2：主动增强边界

**目标**：保留 AI 效果图，但不让它替代准确预览。

**独立测试**：未生成、已生成和生成失败三种状态均能看到真实衣物核对。

- [x] T003 [US2] 在 `components/recommendations/recommendation-card.tsx` 明确区分精准搭配预览与 AI 效果图说明
- [x] T004 [US2] 在 `components/recommendations/lookbook-generator.tsx` 和相关提示中保持按需生成与误差说明

## Phase 3：验收与交付

- [x] T005 [P] 在 `scripts/verify-sdd-023.mjs` 增加原图复用、无模型调用、缺图、角色顺序和静态移动端门禁
- [x] T006 在 `package.json` 增加 `verify:sdd-023` 并运行 check/build/独立验证
- [x] T007 更新 `progress.md`、`AGENTS.md` 和 SDD 验收记录
- [ ] T008 提交 SDD-023 代码与文档，不包含用户未追踪文件

## 依赖顺序

- T001 完成后执行 T002。
- T003、T004 依赖 T002，可顺序完成。
- T005 可与 T003 并行；T006～T008 在功能和门禁完成后执行。

## 实施策略

先交付本地确定性精准预览，再保留现有 AI 图作为可选增强；本阶段不接入专业 VTON、不新增抠图服务、不向第三方发送用户衣物图片。
