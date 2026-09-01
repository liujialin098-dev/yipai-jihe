# 实施计划：精准搭配预览

**分支标识**：`023-precision-outfit-preview` ｜ **日期**：2026-08-31 ｜ **规格**：[spec.md](spec.md)

## 摘要

本阶段将推荐卡的默认占位从“通用 AI 虚拟模特图”调整为确定性的精准搭配预览：固定无身份人物作为比例参照，当前推荐的真实衣物图片按角色和层次排列。方案不做自动抠图、不增加第三方图像服务、不修改推荐数据；现有 AI 效果图保留为用户主动触发的可选增强。

## 技术上下文

- **语言/版本**：TypeScript、React 19、Next.js 16.3.1 App Router。
- **依赖**：现有 Next Image、Tailwind CSS 4、lucide-react；不新增 npm 依赖。
- **数据**：复用 `RecommendationOutfitView`、`WardrobeItem`、签名图片地址和 `deriveOutfitLayers`；不新增表或迁移。
- **测试**：Biome、TypeScript、Next build、`verify-sdd-023.mjs`、390px 浏览器手工验收。
- **目标平台**：移动端优先 Web，Vercel + 当前 Supabase 项目。
- **性能目标**：精准预览不触发模型调用；页面数据到预览呈现沿用现有推荐页请求。
- **约束**：图片与角色必须来自当前用户当前推荐；缺图不阻塞；不能把原图误称为真实试穿。

## 章程检查

- MVP 结果优先：先验证“衣服不被 AI 改款”的核心价值。
- 核心路径正确：推荐结果 → 精准预览 → 实拍核对完整闭环，不改写推荐。
- 直接实现：一个展示组件复用现有数据和素材，不引入抠图库或远程服务。
- 静态质量：必须通过 `npm run check`、`npm run build` 和独立门禁。
- 安全：不新增数据传输，不读取或暴露私有路径以外的信息。

## 项目结构

```text
components/recommendations/
└── precision-outfit-preview.tsx
components/recommendations/recommendation-card.tsx
lib/recommendations/layers.ts
scripts/verify-sdd-023.mjs
specs/023-precision-outfit-preview/
```

**结构决定**：采用纯展示组件；推荐页服务端继续负责数据和签名地址，客户端只负责本地布局和状态呈现。

## 实施顺序

1. 建立精准预览组件，复用真实衣物图片和层次角色。
2. 将组件接入推荐卡，保留 AI 效果图的主动生成入口。
3. 增加缺图、7 件上限、无第三方请求和移动端静态门禁。
4. 运行检查、构建、独立验证，更新进度与开发说明后提交。

