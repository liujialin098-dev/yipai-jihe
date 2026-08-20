# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：路由、布局和全局样式；当前首页为 `app/page.tsx`。
- `components/ui/`：shadcn/ui 组件；`lib/utils.ts`：类名合并工具。
- `lib/supabase/`：Supabase browser、server 和 proxy 客户端工厂；根目录 `proxy.ts` 负责刷新 SSR 会话。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。

## 注意事项

- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SSR 客户端遵循 Supabase 官方模式：浏览器端使用 `createBrowserClient`，服务端使用 `createServerClient` + `next/headers` cookies，Next.js 16 使用根目录 `proxy.ts` 调用 `auth.getClaims()` 刷新会话。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前 P0 使用原图卡片，不执行自动抠图和穿搭日记；自动抠图与穿搭日记均移至 P1。P1 抠图 MUST 经过服务端 `cutoutService` 调用外部 API，密钥只能通过环境变量提供，失败不得阻塞原图入库。
- P0 账号范围为匿名体验加可选邮箱绑定、邮件验证、登录和退出；绑定后 MUST 保持同一 `auth_user_id` 和原匿名数据。不实现第三方登录、账号切换和密码找回。
- 演示数据 MUST 按当前用户隔离加载，优先采用可重复的一键加载方式；不得把真实个人敏感照片写入仓库或提交记录。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
