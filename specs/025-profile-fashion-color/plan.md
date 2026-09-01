# 实施计划：时尚个人主页与彩色视觉层

**分支标识**：`025-profile-fashion-color` ｜ **日期**：2026-09-01 ｜ **规格**：[spec.md](spec.md)

## 摘要

本阶段在 SDD-024 穿搭画布之上建立当前账号私有个人主页，复用 `profiles.display_name`，新增私有 `avatar_path`，聚合衣橱、画布、日记和利用率；同时用少量一致的时尚色彩 token 重塑核心页面气氛和导航状态，不改变已有信息架构。

## 技术上下文

- **语言/框架**：TypeScript、React 19、Next.js 16.3.1 App Router。
- **界面**：Tailwind CSS 4、lucide-react、现有语义排版和动效 token。
- **数据**：Supabase `profiles`、`wardrobe_items`、`outfit_canvases`、`outfit_diary_entries` 与私有 Storage。
- **测试**：Biome、TypeScript、Next build、`verify:sdd-025.mjs`、390px 浏览器验收。
- **约束**：Server Component 默认；浏览器只负责头像预检与上传；服务端重新鉴权、校验路径并更新资料。

## 章程检查

- 结果优先：主页先展示现有数据，不建设社交关系。
- 数据隔离：资料、统计、画布和头像均绑定 `auth.getUser()` 当前用户。
- 直接实现：复用现有 bucket、资料表和利用率聚合，不新增头像服务或图表依赖。
- 视觉一致：保留品牌标志、导航结构、六级排版 token 和无障碍降级。
- 阶段门禁：完成迁移、双账号 RLS/Storage 验收、check、build 和移动端验收后才能标记完成。

## 项目结构

```text
app/profile/
├── actions.ts
└── page.tsx
components/profile/
├── profile-editor.tsx
└── profile-outfit-grid.tsx
lib/profile/
├── data.ts
└── validation.ts
supabase/migrations/*_profile_fashion_color.sql
scripts/verify-sdd-025.mjs
```

## 实施顺序

1. 增加 `profiles.avatar_path` 和约束，更新数据库类型与 Viewer 签名读取。
2. 建立当前用户资料更新 Action、头像浏览器上传和失败回收。
3. 聚合个人主页统计与近期穿搭卡片，建立空状态和设置入口。
4. 将顶部设置按钮替换为头像主页入口，个人主页保留设置按钮。
5. 建立四个时尚色彩 token，更新应用背景、导航、首页与推荐的重点内容块。
6. 运行独立门禁、回归、移动端检查，更新进度与开发说明后提交。
