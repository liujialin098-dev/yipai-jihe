# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。

## 项目速览

- `app/`：路由、布局和全局样式；当前首页为 `app/page.tsx`。
- `components/ui/`：shadcn/ui 组件；`lib/utils.ts`：类名合并工具。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。

## 注意事项

- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
