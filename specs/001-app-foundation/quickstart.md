# SDD-001 快速验证

## 前置条件

- 使用仓库现有 Node.js 与依赖。
- `.env.local` 已配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；不要打印或提交变量值。
- Supabase 项目为 `next-app-supabase`（ref：`gmjtzmxuveoaqcdmuifr`）。
- Supabase Dashboard 的 Authentication 设置已开启 Anonymous Sign-Ins；否则会话接口会返回可重试错误，隔离脚本会报告 `Anonymous sign-ins are disabled`。

## 1. 准备数据库

1. 核对 `supabase/migrations/20260820150709_app_foundation.sql` 和 `20260820152608_tighten_foundation_grants.sql`。
2. 将 schema、显式最小授权、RLS、私有 bucket 和 Storage 策略迁移应用到当前 Supabase 项目。
4. 生成并保存 TypeScript 数据库类型。
5. 运行 Supabase 安全与性能顾问，处理本阶段新增对象的高优先级问题。

## 2. 本地运行

```powershell
npm run dev
```

打开 `http://localhost:3000`，使用移动端视口检查：

- 首次打开显示会话初始化状态，随后进入首页空衣橱引导。
- 首页、衣橱、添加衣物、推荐、收藏、设置均可访问。
- 底部导航选中态与当前页面一致。
- 设置页显示匿名身份状态，但不提供邮箱绑定。

## 3. 会话保持验收

1. 记录设置页展示的短用户标识。
2. 连续刷新 3 次。
3. 每次标识保持一致，页面不重复产生资料或偏好。

## 4. 双会话隔离验收

```powershell
npm run verify:sdd-001
```

脚本创建两组匿名测试会话与各自的非敏感测试资料，并验证：

- 两组会话都能读取自己的资料和偏好。
- 任一会话不能读取或修改另一会话的数据。
- 任一会话不能向另一用户的 Storage 路径写入测试对象。
- 脚本只输出匿名测试用户的短标识和通过/失败结果，不输出环境变量或访问令牌。

## 5. 静态检查与构建

```powershell
npm run check
npm run build
```

两条命令均通过后，才可以进入 Preview 验收。

## 6. Preview 验收

1. 将同名 Supabase 公开变量配置到 Vercel Preview 环境。
2. 发布 Preview，不包含 `SECRET_KEY` 或任何高权限密钥。
3. 在 Preview URL 重复主要路由、首次匿名会话、刷新保持和空衣橱引导检查。
4. 将 URL、验收结果、限制和提交号写回 `progress.md`。

当前项目使用 Vercel 项目 `ai-coding`。受保护 Preview 可通过 Vercel 登录或临时分享链接验收，不得为了测试关闭 Deployment Protection。

## 7. 本次实际执行记录

- Supabase CLI 在当前 Windows/Node 组合下因缺少 `win32-x64` 二进制无法生成迁移；本次使用标准时间戳文件并通过 Supabase 受控迁移接口应用，远端迁移版本与本地文件名已对齐。
- Supabase 迁移和类型生成成功；两张 public 表均启用 RLS，私有 `wardrobe-images` bucket 已创建，安全与性能顾问均为 0 告警。
- 默认表授权曾宽于最小权限，已用第二个迁移收紧为 `authenticated` 仅 `SELECT/INSERT/UPDATE`。
- `npm run check` 与 `npm run build` 已通过；6 个页面路由在本地 390px 视口和 Preview 均可访问。
- Preview `https://ai-coding-2m4gteem7-jialin-d583.vercel.app` 状态为 READY，且 Vercel 到 Supabase 的公开配置已连通。
- 2026-08-21 已开启 Supabase Anonymous Sign-Ins；双会话脚本、自身访问、交叉访问、Storage 路径隔离与测试对象清理均通过。
- 本地新会话匿名编号 `CCF08712` 连续刷新 3 次保持一致，资料与偏好各只有 1 条；受保护 Preview 会话 `43FC08A9` 也完成六路由和 3 次刷新复验。
- 性能顾问为 0 项；安全顾问的 3 项匿名访问策略提示属于本阶段预期行为，实际策略仍以 `auth.uid()` 限制所有权；泄露密码保护提示在 SDD-002 引入邮箱密码前处理。
- 已知部署限制：当前 Preview 构建中的两个 Supabase 公开变量有效，但仍需在 Vercel Preview 环境持久配置后续自动部署所需变量。

## 完成条件

- `tasks.md` 当前阶段任务全部标记完成。
- `npm run check` 与生产构建通过。
- 本地核心路径、双会话隔离和 Preview 冒烟均通过。
- `progress.md` 和 `AGENTS.md` 已同步更新。
