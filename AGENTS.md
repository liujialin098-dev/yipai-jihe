# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：首页、衣橱列表与单品详情/编辑、AI 添加衣物工作区、推荐、收藏、设置路由，以及匿名会话与衣物入库 Route Handlers。
- `components/`：移动端应用外壳、顶部状态区、底部导航、会话启动、衣橱筛选/卡片/表单、入库工作区和通用状态；`components/ui/` 保留 shadcn/ui 基础组件。
- `lib/auth/viewer.ts`：服务端当前用户最小读取；`lib/supabase/`：browser/server/proxy 客户端、公开配置检查和生成的数据库类型。
- `lib/wardrobe/`：衣物常量、校验、查询、OpenAI 结构化识别和入库生命周期辅助；私有图片签名地址在服务端短期缓存并限制条目数。
- `lib/recommendations/`：天气快照、严格推荐契约、OpenAI 生成、规则降级、归属与搭配结构校验，以及当日批次读取映射。
- `supabase/migrations/`：可复现数据库迁移；`scripts/verify-sdd-001.mjs`、`scripts/verify-sdd-003.mjs`、`scripts/verify-sdd-004.mjs` 与 `scripts/verify-sdd-005.mjs`：双匿名会话、幂等、固定样本和每日推荐覆盖验证。
- `specs/001-app-foundation/`、`specs/003-wardrobe-core/`、`specs/004-ai-item-ingestion/`、`specs/005-daily-recommendations/` 与 `specs/011-global-motion/` 为已完成阶段；`specs/002-account-binding/` 的代码和远端配置已完成，密码设置与重登录等待集中调试。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。
- 当前视觉基线：浅色冷白银灰画布、近黑主色、系统蓝焦点色、软圆角卡片和固定底部玻璃 Dock；`app/globals.css` 中的 Liquid Glass 仅为 Web 材质近似，并提供减少动态与减少透明度降级。

## 注意事项

- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 后续页面 MUST 延续当前视觉 token：卡片使用约 24px 软圆角，主要按钮使用胶囊或圆形，玻璃效果只用于导航和悬浮控件，不得恢复旧紫色模板风格或在所有容器滥用毛玻璃。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`、`/supabase/supabase`、`/supabase/auth`、`/websites/developers_openai_api`。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SDD-004 的 `OPENAI_API_KEY` 必须仅配置在 `.env.local` 和 Vercel 服务端环境；可选 `OPENAI_VISION_MODEL` 默认 `gpt-4o-mini`。浏览器不得读取这两个变量，OpenAI 请求必须使用 Responses API、`store: false` 和严格 JSON Schema。
- SDD-005 推荐默认复用 `gpt-4o-mini`，可通过服务端 `OPENAI_RECOMMENDATION_MODEL` 单独覆盖；OpenAI 失败、超时或输出不合法时 MUST 在 15 秒目标内转为规则推荐。天气默认使用 Open-Meteo 北京快照，可通过 `WEATHER_CITY`、`WEATHER_LATITUDE`、`WEATHER_LONGITUDE` 和 `WEATHER_TIMEZONE` 覆盖；天气失败必须显示模拟天气来源。
- SSR 客户端遵循 Supabase 官方模式：浏览器端使用 `createBrowserClient`，服务端使用 `createServerClient` + `next/headers` cookies，Next.js 16 使用根目录 `proxy.ts` 调用 `auth.getClaims()` 刷新会话。
- `lib/auth/viewer.ts` 的账号属性必须使用 `auth.getUser()` 获取 Auth 服务端最新记录；`getClaims()` 继续用于 Proxy 和轻量身份校验，但不得用于邮箱绑定后的即时匿名状态判断，因为当前 JWT 可能仍携带旧声明。
- SDD-001 数据底座为 `public.profiles` 和 `public.user_preferences`，均以 `auth.users.id` 为主键并启用 RLS；`authenticated` 仅有 `SELECT/INSERT/UPDATE`，`anon` 无表权限。
- SDD-003 衣橱底座为 `public.wardrobe_items`：记录绑定 `user_id`，`demo_key` 保证当前用户演示数据幂等，状态仅为 `active/archived`；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。
- SDD-004 入库底座为 `public.wardrobe_ingestions`：每张原图使用稳定请求 id、私有路径、处理状态与最长 24 小时有效期；`wardrobe_items.source_ingestion_id` 保证确认重试只创建一件衣物。表启用四类用户所有权 RLS，`anon` 无表权限。
- SDD-005 推荐底座为 `public.daily_recommendations`：每名用户每天最多一个批次，`outfits` 必须恰好 3 套，AI 来源必须记录模型；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。推荐结果 MUST 只引用当前用户活跃衣物，跨套不重复，且不得在同一套中混用连衣裙与上衣裤装。
- Storage bucket `wardrobe-images` 必须保持私有，对象路径第一段固定为当前 `auth.uid()`；读取、插入、更新和删除均由同一路径规则限制。
- 当前 Supabase 项目已于 2026-08-21 开启 Anonymous Sign-Ins；`npm run verify:sdd-001` 已用两组真实匿名会话验证自身访问、跨用户 RLS 与 Storage 路径隔离。
- 当前 Supabase Auth 已开启 Email、Confirm email、Anonymous Sign-Ins 和 Manual Linking；Site URL 为 `http://localhost:3000`，Redirect URL 包含 `http://localhost:3000/**` 与 `https://*-jialin-d583.vercel.app/**`。新增部署域名时必须同步确认其匹配白名单。
- 当前 Vercel 项目为 `ai-coding`（project id：`prj_xUFZtC1OoY5mTQci9o8GaR3CIsK6`）；Preview 环境已持久配置两个 Supabase `NEXT_PUBLIC_` 变量、服务端 `OPENAI_API_KEY` 和 `OPENAI_VISION_MODEL`，不得配置 `SECRET_KEY`。Preview 受 Vercel Authentication 保护。
- SDD-001 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-001`；最后一项会创建两组非敏感匿名测试资料并验证跨用户访问被拒绝。
- SDD-003 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-003`；最后一项会创建两组安全合成 PNG 衣物，验证记录与 Storage 的自身 CRUD 和跨用户拒绝，然后自动清理。
- SDD-004 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-004`；最后一项验证 10 张固定 jpg、双会话隔离、确认幂等、取消/过期清理和 10 项批量边界。2026-08-23 真实 `gpt-4o-mini` 基准为 10/10、平均 3504ms；当前本地 Node.js 网络无法直连 OpenAI，真实基准由同机 PowerShell 与 Vercel Preview 双重完成。
- SDD-005 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-005`；最后一项创建两组非敏感匿名测试衣橱，验证三套契约、同日三次覆盖为一行和跨用户 RLS 后自动清理。390px 浏览器必须另测至少两种场合/天气组合与规则降级。
- 开启匿名登录后，Supabase 安全顾问会对允许匿名身份使用的 `authenticated` 策略给出提醒；只有策略同时使用 `auth.uid()` 所有权或对象路径约束时才可接受。泄露密码保护在未来恢复 SDD-002 并启用邮箱密码能力时复核处理。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 当前阶段：SDD-001、SDD-003、SDD-004、SDD-005 与 SDD-011 已完成；下一步启动 SDD-006 换一件、收藏与偏好反馈。SDD-002 密码设置、退出和重登录保留到与用户集中调试，不作为 SDD-006 依赖。证据和限制以 [`progress.md`](progress.md) 为准。

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前 P0 使用原图卡片，不执行自动抠图和穿搭日记；自动抠图与穿搭日记均移至 P1。P1 抠图 MUST 经过服务端 `cutoutService` 调用外部 API，密钥只能通过环境变量提供，失败不得阻塞原图入库。
- SDD-002 已实现邮箱绑定、邮件验证、登录、退出和跨设备恢复，但在用户完成真实邮箱验收前保持“验收中”，且仍不得作为 SDD-003 至 SDD-007 的依赖。匿名用户必须明确知道清除站点数据或换设备后无法恢复未绑定身份；绑定流程 MUST 保持同一 `auth_user_id` 和原匿名数据。登录与认证回调页面 MUST 跳过自动匿名初始化，只有用户主动选择时才创建新匿名身份。
- SDD-002 允许一个窄范围恢复例外：已验证邮箱但尚未设密码的账号可从 `/login` 请求一次性密码设置邮件；响应不得泄露邮箱是否存在，回调必须进入 `/auth/confirm` 并只允许站内安全跳转。常规忘记密码仍不在当前范围。
- 全局动效以 `app/globals.css` 的气泡扩散、分层显现、导航选中气泡、按钮填充/光泽和卡片景深为准；不得恢复所有控件统一上下弹跳。所有后续 UI MUST 支持 `prefers-reduced-motion` 和 `prefers-reduced-transparency`。
- 演示数据 MUST 按当前用户隔离加载，优先采用可重复的一键加载方式；不得把真实个人敏感照片写入仓库或提交记录。
- 内置演示衣物图片位于 `public/demo-wardrobe/`，按 `demo_key` 使用同名 768px WebP 棚拍素材；仅演示数据使用公开静态图，真实用户上传仍 MUST 使用 `wardrobe-images` 私有 bucket 与签名 URL。
- SDD-004 固定识别样本位于 `public/test-wardrobe/`，期望值在 `specs/004-ai-item-ingestion/test-samples.json`；这些图片只用于测试，不得作为用户真实衣橱数据自动加载。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
