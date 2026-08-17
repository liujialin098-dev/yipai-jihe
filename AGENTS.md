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

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
