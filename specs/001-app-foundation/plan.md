# 实现计划：应用框架与匿名数据底座

**分支**：`001-app-foundation` | **日期**：2026-08-20 | **规格**：[spec.md](spec.md)

**输入**：`specs/001-app-foundation/spec.md` 中已经澄清的 SDD-001 功能规格。

## 摘要

本阶段建立一个移动端优先的应用外壳和六个稳定路由，并通过一个服务端会话初始化接口自动创建或复用 Supabase 匿名会话。首次会话同时初始化一对一的用户资料与默认偏好；所有数据库访问依赖当前用户身份和行级安全策略，私有图片桶按用户 ID 划分路径。页面读取默认保留在 Server Component，只有会话启动、重试和底部导航选中态使用 Client Component。

## 技术上下文

**语言/版本**：TypeScript 5、React 19.2.8、Node.js 20+
**主要依赖**：Next.js 16.3.1 App Router、Tailwind CSS 4、shadcn/ui、lucide-react、`@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3
**存储**：当前 Supabase 项目的 PostgreSQL 17.6、Supabase Auth、私有 Storage bucket
**测试**：`npm run check`；两组真实匿名测试会话的隔离验证；本地移动视口手工验收；Vercel Preview 冒烟验证
**目标平台**：现代移动浏览器和桌面浏览器移动视口；Vercel Node.js 运行时
**项目类型**：单体 Next.js Web 应用
**性能目标**：正常网络下新会话在 10 秒内完成初始化；已有会话刷新不产生重复资料；主要导航切换即时反馈
**约束**：不新增运行时依赖；不使用服务端密钥绕过 RLS；不实现邮箱绑定、衣橱业务或 AI；会话相关页面不得跨用户静态缓存
**规模/范围**：6 个页面路由、1 个会话初始化接口、2 张用户基础表、1 个私有存储桶、2 个隔离测试会话

## 章程检查

*门禁：Phase 0 研究前检查；Phase 1 设计后再次检查。*

| 章程要求 | 研究前 | 设计后 | 落实方式 |
| --- | --- | --- | --- |
| MVP 结果优先 | 通过 | 通过 | 只实现 SDD-001 入口、框架和安全底座，后续模块显示真实空状态。 |
| 核心路径正确 | 通过 | 通过 | 先完成“首次访问 → 匿名会话 → 资料初始化 → 空衣橱引导”，再补页面骨架。 |
| 直接而简洁 | 通过 | 通过 | 复用现有 Supabase 客户端和一个会话接口，不引入状态库、ORM 或额外认证层。 |
| 静态质量门禁 | 通过 | 通过 | 完成后运行 `npm run check`，并保留独立手工验收记录。 |
| 中文清晰交付 | 通过 | 通过 | SDD、界面文案、进度和交付记录均使用中文；复用 shadcn/ui 和 lucide 图标。 |
| Server Component 默认 | 通过 | 通过 | 页面和数据读取保持服务端；仅会话启动/重试和当前导航使用客户端组件。 |
| Supabase 安全 | 通过 | 通过 | SSR cookie 客户端分工不变；匿名身份仍使用 authenticated 角色；显式授权与 RLS 双重限制。 |

本阶段没有需要豁免或额外复杂度说明的章程偏离。

## 项目结构

### 本功能文档

```text
specs/001-app-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── session-api.yaml
│   └── storage-boundary.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 仓库源代码

```text
app/
├── api/session/anonymous/route.ts
├── favorites/page.tsx
├── recommendations/page.tsx
├── settings/page.tsx
├── wardrobe/page.tsx
├── wardrobe/new/page.tsx
├── error.tsx
├── loading.tsx
├── layout.tsx
└── page.tsx
components/
├── app-shell.tsx
├── bottom-navigation.tsx
├── empty-state.tsx
├── session-bootstrap.tsx
├── status-header.tsx
└── ui/button.tsx
lib/
├── auth/
│   └── viewer.ts
├── supabase/
│   ├── client.ts
│   ├── config.ts
│   ├── database.types.ts
│   ├── proxy.ts
│   └── server.ts
└── utils.ts
scripts/
└── verify-sdd-001.mjs
supabase/
└── migrations/
    └── <由 Supabase CLI 生成的迁移文件>.sql
proxy.ts
```

**结构决策**：保持当前单体 App Router 结构。路由页面只组合通用外壳和空状态；匿名身份初始化放在单一 Route Handler，服务端用户读取集中在一个轻量访问函数。数据库迁移、生成类型和隔离验证脚本留在仓库中，确保同一阶段可复验。

## 实施阶段

### Phase 0：研究收敛

1. 确认 Next.js 16 的 Proxy、异步 cookies、Server/Client Component 边界和错误处理方式。
2. 确认 Supabase 匿名登录、SSR cookie 刷新、匿名用户数据库角色和 RLS 写法。
3. 确认新表显式授权、私有 Storage 路径策略和测试会话隔离方法。
4. 记录所有决定、替代方案和不采用原因到 [research.md](research.md)。

### Phase 1：设计与契约

1. 定义 `profiles`、`user_preferences` 的一对一模型、约束和状态变化。
2. 定义 `wardrobe-images/<user-id>/...` 私有路径边界及对象操作权限。
3. 定义匿名会话初始化接口的成功、可重试失败和配置失败响应。
4. 编写可重复的本地、隔离和 Preview 验收流程。

### Phase 2：实现与验证

1. 建立数据库迁移、显式权限、RLS、私有 Storage bucket 与策略，并生成数据库类型。
2. 实现匿名会话初始化接口与服务端当前用户读取。
3. 实现移动端应用外壳、顶部状态区、底部导航、六个页面及通用状态。
4. 用两个新匿名会话创建测试资料，验证自身访问成功、交叉访问失败。
5. 运行静态检查和本地核心路径验收；构建并发布 Vercel Preview 后复验。
6. 更新 `tasks.md`、`progress.md`、`AGENTS.md`，记录限制与提交。

## 复杂度追踪

无章程偏离，本节不适用。
