# Implementation Plan: 场景一致性与雨天防水搭配

**Branch**: `017-scene-consistency-rain` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-scene-consistency-rain/spec.md`

## Summary

在既有四场景画像上新增“当前场景优先、异场景单品硬拒绝”的共享判断，使 AI 提示、规则降级与服务端最终复验完全一致；同时基于真实天气代码和衣物名称/类别识别完整防水三件套，在雨天库存满足且不违反温度与场景边界时，让至少一套推荐使用冲锋衣、防水下装和防水鞋。

## Technical Context

**Language/Version**: TypeScript 5、Node.js 20、Next.js 16.3.1、React 19  
**Primary Dependencies**: 现有 OpenAI Responses API 传输、Supabase 数据读取、Open-Meteo 天气快照；不新增依赖  
**Storage**: 沿用 `wardrobe_items`、`daily_recommendations` 与现有 JSON 字段；无迁移  
**Testing**: Node 固定样本门禁、TypeScript、Biome、Next.js production build  
**Target Platform**: Vercel 上的响应式 Web 应用与 Windows 本地开发环境  
**Project Type**: Next.js 单体 Web 应用  
**Performance Goals**: 保持单次推荐 15 秒目标；AI 无效后只执行一次本地规则降级  
**Constraints**: 只使用当前用户活跃衣物；真实雨天；不伪造单品；三套跨套不重复；不得放宽既有温度、季节、衣着偏好和归属边界  
**Scale/Scope**: 四场景推荐核心逻辑、一个新增固定样本门禁、28 件演示衣橱与现有推荐回归；只更新现有衣橱数量文案，无新页面、接口或数据库表

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MVP 结果优先**: 直接修复用户可见的串场问题，不增加新场景或配置后台。通过。
- **核心链路正确**: 场景、真实天气、衣物所有权和三套完整性仍在服务端统一复验。通过。
- **简单实现**: 扩展现有场景画像并新增一个纯函数防水分类模块，不引入服务、依赖或迁移。通过。
- **可验证**: 新增 SDD-017 固定样本，并回归 SDD-005、012、013、014。通过。
- **文档与安全**: 中文维护 Spec Kit、进度和代理约束；不触碰密钥与用户数据。通过。

设计后复核：数据模型不变；共享纯函数同时被规则和校验调用；AI 输出仍需通过本地复验；无章程例外。

## Project Structure

### Documentation (this feature)

```text
specs/017-scene-consistency-rain/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── recommendation-validation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/recommendations/
├── generator.ts
├── occasion-profile.ts
├── rain-protection.ts
├── rules.ts
├── validation.ts
└── weather.ts

lib/wardrobe/catalog.ts
public/demo-wardrobe/*.webp
app/wardrobe/actions.ts
app/wardrobe/page.tsx
components/wardrobe/demo-loader.tsx

scripts/
├── verify-sdd-017.mjs
└── verify-sdd-014.mjs

package.json
progress.md
AGENTS.md
```

**Structure Decision**: 延续当前推荐领域模块。场景冲突继续集中在 `occasion-profile.ts`；雨天与防水角色使用无副作用的 `rain-protection.ts`；生成器只描述约束，规则生成和最终复验共同调用相同函数。演示衣橱在既有目录追加四件正式胶囊，并同步现有加载数量文案，不引入新界面。

## Complexity Tracking

无章程例外。
