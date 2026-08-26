# Implementation Plan: 场景差异化推荐

**Branch**: `master` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-scene-diversity/spec.md`

## Summary

在既有每日推荐链路中增加共享的四场景画像与匹配判定，让 AI 提示、输出校验和规则降级使用同一套场景标准。通过固定男装衣橱分别生成通勤、休闲、约会和正式结果，验证每套至少具备两个场景信号、正式场景排除仅运动单品，并在衣橱充足时将场景间核心单品 Jaccard 重合度控制在 50% 以内。保持天气、衣着偏好、用户所有权、三套完整性和每日批次数据规则不变。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 24、Next.js 16.3.1、React 19

**Primary Dependencies**: 既有 Next.js App Router、OpenAI Responses API 传输封装、Supabase 客户端；不新增依赖

**Storage**: 沿用 Supabase `daily_recommendations` 与 `wardrobe_items`，无迁移、无字段变化

**Testing**: `npm run check`、`npm run build`、新增 `npm run verify:sdd-014`，并回归 `npm run verify:sdd-005`、`npm run verify:sdd-012`、`npm run verify:sdd-013`

**Target Platform**: Vercel Production 上的响应式 Web 应用，移动端优先

**Project Type**: 单体 Next.js Web 应用

**Performance Goals**: 不增加模型调用次数；AI 仍在 10 秒调用时限内完成或转入规则降级，用户总等待目标不超过既有 15 秒

**Constraints**: 真实天气、衣着偏好、当前用户所有权、活跃状态、完整套装和跨套不重复优先；不更换模型，不保存四场景历史，不引入新服务

**Scale/Scope**: 四种场景、每次三套推荐、最多 80 件候选衣物；改动集中在推荐画像、生成、规则和校验

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**：通过一个共享画像模块和既有链路改造解决用户已观察到的雷同问题，不扩展历史、多模型或新交互。PASS。
- **核心路径正确**：保持“真实天气 → 当前衣橱 → 三套结果 → 保存展示”主链路，只加强场景质量。PASS。
- **直接而简洁**：复用现有类型、生成器、规则降级和校验器，不新增依赖或数据库结构。PASS。
- **静态质量门禁**：计划包含 `npm run check`、构建和独立验证脚本。PASS。
- **约束内清晰交付**：文档使用中文，敏感密钥与服务端边界不变。PASS。

Phase 1 设计后复核：数据模型仅增加内存画像与测试报告，接口仍为现有生成动作；无章程偏离。PASS。

## Project Structure

### Documentation (this feature)

```text
specs/014-scene-diversity/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── occasion-profile.md
│   └── recommendation-validation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/recommendations/
├── occasion-profile.ts    # 四场景画像、信号与匹配判定
├── generator.ts           # AI 提示复用场景画像
├── rules.ts               # 场景化候选排序与稳定降级
└── validation.ts          # 统一场景结果校验

scripts/
└── verify-sdd-014.mjs     # 固定样本、场景匹配与差异度门禁

package.json               # 独立验收命令
AGENTS.md                   # 当前推荐约束与质量命令
progress.md                 # 阶段 TODO 与完成证据
```

**Structure Decision**: 继续使用现有单体目录；场景规则独立为一个小型共享模块，避免生成器、规则降级和校验器各自维护重复定义。

## Complexity Tracking

无章程违规，不需要额外复杂度说明。
