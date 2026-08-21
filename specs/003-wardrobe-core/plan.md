# 实施计划：我的衣橱与演示数据

**分支**：`master` ｜ **日期**：2026-08-21 ｜ **规格**：[spec.md](spec.md)

**输入**：`specs/003-wardrobe-core/spec.md`

## 摘要

在 SDD-001 的匿名身份、RLS 和私有 Storage 底座上，新增当前用户专属的衣物数据模型、24 件幂等演示衣橱、列表搜索筛选、详情编辑、归档恢复和永久删除。页面读取以 Server Component 为主，变更通过逐次鉴权的 Server Action 完成；私有原图使用短期签名 URL 展示，演示图片由受控代码生成并写入每个用户自己的私有路径。

## 技术上下文

**语言/版本**：TypeScript 5、React 19.2.8、Next.js 16.3.1  
**主要依赖**：Next.js App Router、`@supabase/ssr`、`@supabase/supabase-js`、Tailwind CSS 4、shadcn/ui、lucide-react  
**存储**：Supabase Postgres `public.wardrobe_items`；私有 Storage bucket `wardrobe-images`  
**测试**：`npm run check`、`npm run build`、双匿名会话隔离脚本、390px 浏览器核心流程验收  
**目标平台**：移动端优先的现代浏览器；Vercel Preview / Supabase `ap-southeast-1`  
**项目类型**：Next.js 全栈 Web 应用  
**性能目标**：24 件演示数据 15 秒内可用；常规搜索筛选 2 秒内返回  
**约束**：匿名身份不跨设备恢复；图片必须私有；不新增运行时依赖；不提前实现 AI、上传、收藏和推荐  
**范围**：1 张业务表、24 个固定演示模板、衣橱列表及 2 个动态子路由、6 类核心变更操作

## 章程检查

*门禁：Phase 0 研究前检查，并在 Phase 1 设计后复核。*

| 原则 | 设计响应 | 结果 |
| --- | --- | --- |
| MVP 结果优先 | 只交付演示衣橱与衣物维护闭环，上传、AI、推荐继续后置 | 通过 |
| 核心路径正确 | “加载 → 浏览/筛选 → 详情 → 编辑/归档/删除”均有独立验收 | 通过 |
| 直接而简洁 | 直接使用现有 Supabase 客户端、Server Component 和 Server Action，不引入仓储层或新依赖 | 通过 |
| 静态质量门禁 | 完成前运行 `npm run check` 和构建；失败不标记完成 | 通过 |
| 约束内清晰交付 | 中文文档、现有主题 token、shadcn/ui 与 lucide-react | 通过 |
| 数据安全 | 每个 Server Action 重新鉴权；表级 RLS、显式授权、Storage 路径规则共同约束 | 通过 |

**Phase 1 设计后复核**：数据模型、操作契约和验收方案未引入章程偏离，门禁保持通过。

## 技术设计

### 读取路径

1. Server Component 从请求 cookie 建立 Supabase 服务端客户端并读取当前匿名用户。
2. 衣橱列表把 URL 查询参数转换为白名单筛选条件，再组合 `user_id`、状态、类别、名称、颜色、季节和场合查询。
3. 列表与详情仅为返回记录批量创建短期签名 URL；签名失败时展示安全占位，不输出内部对象路径。
4. 动态路由参数按 Next.js 16 Promise 形式读取；不存在或不属于当前用户的记录统一进入未找到页面。

### 写入路径

1. 每个 Server Action 都重新读取会话，不信任页面传入的用户 ID。
2. 表单字段经过长度、枚举和多选白名单校验；对象 ID 只用作受当前用户约束的查询条件。
3. 变更成功后使用 `revalidatePath` 刷新衣橱相关页面，必要时再跳转。
4. 永久删除先读取当前用户记录并移除其独占 Storage 对象，再删除数据库记录；任一步失败都返回可重试反馈。

### 演示数据路径

1. 代码内维护 24 个固定目录项和稳定 `demo_key`，不把真实照片写入仓库。
2. 服务端按类别生成受控 PNG 衣物图，上传到 `<auth.uid()>/demo/<demo_key>.png`。
3. 数据库使用 `(user_id, demo_key)` 唯一约束；加载时只处理缺失项，支持部分失败后重试和多标签页并发。
4. 每个用户拥有自己的图片副本和记录，不共享可跨用户访问的对象。

## 项目结构

### 本功能文档

```text
specs/003-wardrobe-core/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── wardrobe-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 源码

```text
app/
├── page.tsx
└── wardrobe/
    ├── actions.ts
    ├── page.tsx
    └── [id]/
        ├── page.tsx
        ├── edit/page.tsx
        └── not-found.tsx
components/wardrobe/
├── action-button.tsx
├── demo-loader.tsx
├── filter-panel.tsx
├── item-card.tsx
└── item-form.tsx
lib/wardrobe/
├── catalog.ts
├── constants.ts
├── data.ts
├── demo-image.ts
└── validation.ts
supabase/migrations/
└── <timestamp>_wardrobe_core.sql
scripts/
└── verify-sdd-003.mjs
```

**结构决策**：沿用单体 Next.js 项目。业务读取与校验集中在 `lib/wardrobe/`，交互组件仅在需要 pending、确认或表单反馈时使用客户端边界；数据库迁移继续放入现有 Supabase 目录。

## 实施顺序

1. 数据库表、约束、授权、RLS 和类型。
2. 演示目录、合成图片生成与幂等加载。
3. 列表、类别、搜索、多条件筛选和首页计数。
4. 详情、编辑、归档、恢复与永久删除。
5. 静态检查、构建、双会话隔离和移动端浏览器验收。
6. 更新 `tasks.md`、`progress.md`、`AGENTS.md` 并提交。

## 复杂度跟踪

无章程偏离，不需要复杂度豁免。
