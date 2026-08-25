# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：首页、衣橱列表与单品详情/编辑、AI 添加衣物工作区、推荐、收藏、设置路由，以及匿名会话与衣物入库 Route Handlers。
- `components/`：移动端应用外壳、顶部状态区、底部导航、会话启动、衣橱筛选/卡片/表单、入库工作区、推荐换件、收藏、偏好问卷和通用状态；`components/ui/` 保留 shadcn/ui 基础组件。
- `lib/auth/viewer.ts`：服务端当前用户最小读取；`lib/supabase/`：browser/server/proxy 客户端、公开配置检查和生成的数据库类型。
- `lib/openai/responses.ts`：Responses API 服务端传输；非 Windows 使用标准 `fetch`，Windows 本地使用 PowerShell 网络栈与 Base64 请求体，密钥只通过子进程环境传递。
- `lib/wardrobe/`：衣物常量、校验、查询、OpenAI 结构化识别和入库生命周期辅助；私有图片签名地址在服务端短期缓存并限制条目数。
- `lib/personalization/`：账号衣着偏好、衣物归属和共享可逆过滤规则。
- `lib/recommendations/`：账号城市解析、真实今日/明日天气快照、严格推荐契约、OpenAI 生成、规则降级、归属与搭配结构校验，以及目标日期批次读取映射。
- `lib/feedback/`：同类合法候选、换件后完整复验、单品/整套收藏 Action、固定偏好权重、事件写入和风格分数重算。
- `supabase/migrations/`：可复现数据库迁移；`scripts/verify-sdd-001.mjs` 至 `scripts/verify-sdd-007.mjs`、`scripts/verify-sdd-012.mjs` 与 `scripts/verify-sdd-013.mjs`：双匿名会话、幂等、固定样本、每日推荐、反馈隔离、静态发布门禁、账号个性化隔离和真实两日天气日期隔离。
- `specs/001-app-foundation/`、`specs/003-wardrobe-core/` 至 `specs/007-release-deploy/`、`specs/011-global-motion/` 与 `specs/012-personalized-context/` 为已完成阶段；`specs/002-account-binding/` 的无邮件注册代码与远端 Confirm email 切换已完成，本地历史账号设密与重登录等待集中调试。
- `README.md`：本地启动、环境变量、迁移、质量命令、5 分钟演示、部署和已知限制的交付入口。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。
- 当前视觉基线：浅色冷白银灰画布、近黑主色、系统蓝焦点色、软圆角卡片和固定底部玻璃 Dock；`app/globals.css` 中的 Liquid Glass 仅为 Web 材质近似，并提供减少动态与减少透明度降级。黑色按钮不得恢复高对比白色扫光。

## 注意事项

- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 后续页面 MUST 延续当前视觉 token：卡片使用约 24px 软圆角，主要按钮使用胶囊或圆形，玻璃效果只用于导航和悬浮控件，不得恢复旧紫色模板风格或在所有容器滥用毛玻璃。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`、`/supabase/supabase`、`/supabase/auth`、`/websites/developers_openai_api`。
- 2026-08-25 复核 `/supabase/supabase`：匿名账号必须先用 `updateUser({ email })` 完成邮箱身份，再在同一有效会话用 `updateUser({ password })` 添加密码；关闭 Confirm email 后第一步应立即完成而无需邮件。无会话的历史账号只能由服务端密钥通过 `auth.admin.updateUserById` 处理，且不得暴露到浏览器。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SDD-004 的 `OPENAI_API_KEY` 必须仅配置在 `.env.local` 和 Vercel 服务端环境；可选 `OPENAI_VISION_MODEL` 默认 `gpt-4o-mini`。浏览器不得读取这两个变量，OpenAI 请求必须使用 Responses API、`store: false` 和严格 JSON Schema。Windows 本地 Node.js 直连超时时统一经过 `lib/openai/responses.ts` 使用系统网络栈，密钥不得出现在命令参数、日志或响应中。
- SDD-005 推荐默认复用 `gpt-4o-mini`，可通过服务端 `OPENAI_RECOMMENDATION_MODEL` 单独覆盖；OpenAI 失败、超时或输出不合法时 MUST 在 15 秒目标内转为规则推荐。SDD-012 起天气位置只能来自当前账号保存的常用城市，由服务端通过 Open-Meteo 解析并获取天气；未设置时不得静默回退北京。SDD-013 起普通推荐只允许 `today | tomorrow`：今天取当前天气，明天按账号时区精确匹配日预报；天气失败 MUST 停止生成，不得返回或保存模拟天气。AI 失败仍可在真实天气成功后使用规则推荐。
- SSR 客户端遵循 Supabase 官方模式：浏览器端使用 `createBrowserClient`，服务端使用 `createServerClient` + `next/headers` cookies，Next.js 16 使用根目录 `proxy.ts` 调用 `auth.getClaims()` 刷新会话。
- `lib/auth/viewer.ts` 的账号属性必须使用 `auth.getUser()` 获取 Auth 服务端最新记录；`getClaims()` 继续用于 Proxy 和轻量身份校验，但不得用于邮箱绑定后的即时匿名状态判断，因为当前 JWT 可能仍携带旧声明。
- SDD-001 数据底座为 `public.profiles` 和 `public.user_preferences`，均以 `auth.users.id` 为主键并启用 RLS；`authenticated` 仅有 `SELECT/INSERT/UPDATE`，`anon` 无表权限。
- SDD-003 衣橱底座为 `public.wardrobe_items`：记录绑定 `user_id`，`demo_key` 保证当前用户演示数据幂等，状态仅为 `active/archived`；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。
- SDD-004 入库底座为 `public.wardrobe_ingestions`：每张原图使用稳定请求 id、私有路径、处理状态与最长 24 小时有效期；`wardrobe_items.source_ingestion_id` 保证确认重试只创建一件衣物。表启用四类用户所有权 RLS，`anon` 无表权限。
- SDD-005 推荐底座为 `public.daily_recommendations`：每名用户每天最多一个批次，`outfits` 必须恰好 3 套，AI 来源必须记录模型；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。推荐结果 MUST 只引用当前用户活跃衣物，跨套不重复，且不得在同一套中混用连衣裙与上衣裤装。
- SDD-006 反馈底座为 `public.wardrobe_item_favorites`、`public.outfit_favorites` 和 `public.preference_feedback_events`；收藏使用唯一键幂等，整套收藏保存不可变 JSON 快照，反馈事件通过唯一 `event_key` 去重，三表均启用当前用户所有权 RLS。`user_preferences.style_scores` 必须由事件账本重算，不得让客户端直接写任意分数。
- SDD-012 在 `public.user_preferences` 保存账号级 `clothing_preference` 与完整城市位置五元组，在 `public.wardrobe_items.audience` 保存男装/女装/中性归属。衣着过滤 MUST 可逆且不得删除记录；衣橱、首页预览和推荐候选 MUST 使用同一共享规则。
- Storage bucket `wardrobe-images` 必须保持私有，对象路径第一段固定为当前 `auth.uid()`；读取、插入、更新和删除均由同一路径规则限制。
- 当前 Supabase 项目已于 2026-08-21 开启 Anonymous Sign-Ins；`npm run verify:sdd-001` 已用两组真实匿名会话验证自身访问、跨用户 RLS 与 Storage 路径隔离。
- 当前 Supabase Auth 已开启 Email、Anonymous Sign-Ins 和 Manual Linking，并于 2026-08-25 经用户明确允许关闭 Confirm email；保存后重新加载页面复核仍为关闭。Site URL 为 `http://localhost:3000`，Redirect URL 包含 `http://localhost:3000/**` 与 `https://*-jialin-d583.vercel.app/**`，仅用于兼容旧链接和新增部署域名。
- 当前主 Vercel 项目为 `yipai-jihe`（project id：`prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team：`jialin-d583`，框架预设：Next.js）；Production 固定域名为 `https://yipai-jihe.vercel.app`，2026-08-25 部署 `dpl_Eq4fjWm1ZVY9iETcLPANVEALiWpN` 已 `READY`。Production 已配置两个 Supabase `NEXT_PUBLIC_` 变量、服务端 `OPENAI_API_KEY` 和 `OPENAI_VISION_MODEL`，不得配置 `SECRET_KEY` 或 `VERCEL_OIDC_TOKEN`。经用户明确同意，项目级 SSO 已关闭；首页、登录、衣橱、明日推荐与设置页面公网均返回 200，匿名会话建立及带会话衣橱访问均通过。旧 `ai-coding` 项目仅保留历史 Preview，不得再作为默认部署目标。
- Vercel Production 发布流程：先运行 `npx vercel link --yes --project yipai-jihe --scope jialin-d583`、`npx vercel project inspect yipai-jihe --scope jialin-d583` 与 `npx vercel env ls production --scope jialin-d583`，确认链接项目正确、框架预设为 Next.js 且变量名称齐全；再运行 `npm run check`、`npm run build`，最后执行 `npx vercel deploy --prod --yes --scope jialin-d583`。发布后使用 `npx vercel inspect <deployment-url> --scope jialin-d583` 核对 `target=production`、`status=Ready` 和固定别名，并检查核心页面 HTTP 状态及 `npx vercel logs <deployment-id> --level error --since 30m --scope jialin-d583`；不得把密钥放进命令参数、日志或仓库。
- SDD-001 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-001`；最后一项会创建两组非敏感匿名测试资料并验证跨用户访问被拒绝。
- SDD-003 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-003`；最后一项会创建两组安全合成 PNG 衣物，验证记录与 Storage 的自身 CRUD 和跨用户拒绝，然后自动清理。
- SDD-004 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-004`；最后一项验证 10 张固定 jpg、双会话隔离、确认幂等、取消/过期清理和 10 项批量边界。2026-08-23 真实 `gpt-4o-mini` 基准为 10/10、平均 3504ms；2026-08-25 Windows 本地传输修复后，当前页面 10 张真实图片全部识别成功。
- SDD-005 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-005`；最后一项创建两组非敏感匿名测试衣橱，验证三套契约、同日三次覆盖为一行和跨用户 RLS 后自动清理。390px 浏览器必须另测至少两种场合/天气组合与规则降级。
- SDD-006 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-006`；最后一项创建两组匿名测试衣物，验证单品/整套收藏和反馈幂等、跨用户读取/写入拒绝后自动清理。390px 浏览器必须另测合法替换持久化、无候选说明、收藏页和 3 题问卷来源说明。
- SDD-007 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-007`；最后一项为无网络静态门禁，核对 7 个核心页面、演示/测试素材、迁移、npm 脚本、README、环境模板和客户端密钥边界。远端隔离继续复跑 SDD-001、003、005、006；真实 AI 识别仅在模型、提示词或识别代码变化时复跑以避免无意义付费。
- SDD-012 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-012`；最后一项创建武汉男装与上海女装两组隔离账号，验证字段约束、跨用户 RLS、过滤不删除和按钮扫光静态边界。浏览器另验收账号摘要、20 件男装视图及武汉实时天气。
- SDD-013 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-013`；最后一项读取武汉真实两日天气、精确匹配明日日期，验证代码无模拟降级，并用匿名会话确认今天/明天分别保存且同日刷新不覆盖另一日期。390px 浏览器另验收日期切换、真实来源和无水平溢出。
- 开启匿名登录后，Supabase 安全顾问会对允许匿名身份使用的 `authenticated` 策略给出提醒；只有策略同时使用 `auth.uid()` 所有权或对象路径约束时才可接受。SDD-002 已启用邮箱密码能力并关闭 Confirm email，完成真实登录验收时必须同步复核泄露密码保护提示。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 当前阶段：P0 的 SDD-001、SDD-003～SDD-007、SDD-011、账号个性化 SDD-012 与真实两日天气 SDD-013 已完成；2026-08-25 已发布并验收公开可访问的 `yipai-jihe` Production。SDD-002 下一步仍须由用户本人完成历史账号密码和重新登录集中验收。不得建议更换邮箱，不得替用户输入、保存或记录密码，也不得在未获明确同意时修改公开访问策略、设置自定义域名或创建保护绕过链接。证据和限制以 [`progress.md`](progress.md) 为准。

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前 P0 使用原图卡片，不执行自动抠图和穿搭日记；自动抠图与穿搭日记均移至 P1。P1 抠图 MUST 经过服务端 `cutoutService` 调用外部 API，密钥只能通过环境变量提供，失败不得阻塞原图入库。
- SDD-002 已实现邮箱和密码一次提交的原地注册、直接登录、退出和跨设备恢复，但在用户完成真实账号验收前保持“验收中”，且仍不得作为 SDD-003 至 SDD-007 的依赖。匿名用户必须明确知道清除站点数据或换设备后无法恢复未注册身份；注册流程 MUST 保持同一 `auth_user_id` 和原匿名数据。登录与旧认证回调页面 MUST 跳过自动匿名初始化，只有用户主动选择时才创建新匿名身份。
- SDD-002 不再发送注册确认或密码设置邮件。历史遗留的已绑定无密码账号只允许在本机运行 `npm run account:set-password-local`，通过 `.env.local` 的 `SECRET_KEY` 和 `auth.admin.updateUserById` 一次性设密；不得把该能力做成 Route Handler、Server Action 或 Vercel 环境能力。常规忘记密码仍不在当前范围。
- 全局动效以 `app/globals.css` 的气泡扩散、分层显现、导航选中气泡、按钮径向反馈和卡片景深为准；不得恢复所有控件统一上下弹跳，也不得恢复黑色按钮的白色横向扫光。所有后续 UI MUST 支持 `prefers-reduced-motion` 和 `prefers-reduced-transparency`。
- 演示数据 MUST 按当前用户隔离加载，优先采用可重复的一键加载方式；不得把真实个人敏感照片写入仓库或提交记录。
- 内置演示衣物图片位于 `public/demo-wardrobe/`，按 `demo_key` 使用同名 768px WebP 棚拍素材；仅演示数据使用公开静态图，真实用户上传仍 MUST 使用 `wardrobe-images` 私有 bucket 与签名 URL。
- SDD-004 固定识别样本位于 `public/test-wardrobe/`，期望值在 `specs/004-ai-item-ingestion/test-samples.json`；这些图片只用于测试，不得作为用户真实衣橱数据自动加载。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
