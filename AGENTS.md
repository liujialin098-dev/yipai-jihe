# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：首页、衣橱列表与单品详情/编辑、AI 添加衣物工作区、推荐、穿搭日记/利用率、收藏、设置路由，以及匿名会话与衣物入库 Route Handlers。
- `components/`：移动端应用外壳、统一品牌标志、顶部状态区、底部导航、会话启动、衣橱筛选/卡片/表单、入库工作区、推荐换件、日记记录、收藏、偏好问卷和通用状态；`components/ui/` 保留 shadcn/ui 基础组件。
- `lib/auth/viewer.ts`：服务端当前用户最小读取；`lib/supabase/`：browser/server/proxy 客户端、公开配置检查和生成的数据库类型。
- `lib/openai/responses.ts`：Responses API 服务端传输；非 Windows 使用标准 `fetch`，Windows 本地使用 PowerShell 网络栈与 Base64 请求体，密钥只通过子进程环境传递。
- `lib/wardrobe/`：14 类衣物风格常量、品牌与字段校验、查询、衣橱组成判断、OpenAI 结构化识别和入库生命周期辅助；私有图片签名地址在服务端短期缓存并限制条目数。
- `lib/personalization/`：账号衣着偏好、衣物归属和共享可逆过滤规则。
- `lib/recommendations/`：账号城市、Vercel IP 城市建议与用户触发的设备城市解析、账号隔离的临时城市会话、有效位置选择、真实今日/明日天气快照、四场景共享画像与异场景硬边界、雨天防水角色、自动/指定风格方向、严格推荐契约、OpenAI 生成、差异化规则降级、归属与搭配结构校验、来源化本季趋势快照，以及目标日期批次读取映射。
- `lib/feedback/`：同类合法候选、换件后完整复验、单品/整套收藏 Action、固定偏好权重、事件写入和风格分数重算。
- `lib/diary/`：日记输入校验、账号日期/月度读取、推荐/手工快照解析和 30/90/全部范围的即时利用率聚合。
- `supabase/migrations/`：可复现数据库迁移；`scripts/verify-sdd-001.mjs` 至 `scripts/verify-sdd-007.mjs`、`scripts/verify-sdd-009.mjs`、`scripts/verify-sdd-012.mjs` 至 `scripts/verify-sdd-021.mjs`：双匿名会话、幂等、固定样本、每日推荐、日记与利用率、反馈隔离、静态发布门禁、账号个性化隔离、真实两日天气日期隔离、四场景差异、自然化排版、首次账号入口、场景一致性、雨天防水、连续入库、手动选城、确认式 IP 城市建议、显式设备定位、14 风格、品牌安全与来源化趋势门禁。
- `specs/001-app-foundation/`、`specs/003-wardrobe-core/` 至 `specs/007-release-deploy/`、`specs/009-outfit-diary/`、`specs/011-global-motion/` 至 `specs/019-ip-weather-suggestion/` 为已完成并部署阶段；`specs/020-device-location-weather/` 与 `specs/021-style-intelligence/` 已完成本地实现与验收，尚未部署。`specs/002-account-binding/` 的无邮件注册与合成账号重登录已通过，本地历史账号设密与用户本人重登录仍等待集中调试。
- `README.md`：本地启动、环境变量、迁移、质量命令、5 分钟演示、部署和已知限制的交付入口。
- `public/brand/`：抽象品牌主标、保留设计稿和冷白底 512px App 图标；页面统一通过 `components/brand-mark.tsx` 使用正式 App 图标。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。
- 当前视觉基线：浅色冷白银灰画布、近黑主色、系统蓝焦点色、软圆角卡片和固定底部玻璃 Dock；正式 Logo 为两片交叠衣料与系统蓝节点组成的抽象标志，顶部栏、账号入口和站点图标 MUST 复用 `BrandMark`，不得另造衣架、机器人或渐变字母标志。`app/globals.css` 中的 Liquid Glass 仅为 Web 材质近似，并提供减少动态与减少透明度降级。排版 MUST 复用 `.app-page-meta`、`.app-page-title`、`.app-page-lead`、`.app-section-title`、`.app-card-title` 和 `.app-display-number` 六级语义 token；页面标题保持中等字重和自然字距，不得恢复重复蓝色眉题、装饰性前导零、超大计数或宣传式比喻。黑色按钮不得恢复高对比白色扫光。

## 注意事项

- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 后续页面 MUST 延续当前视觉 token：卡片使用约 24px 软圆角，主要按钮使用胶囊或圆形，玻璃效果只用于导航和悬浮控件，不得恢复旧紫色模板风格或在所有容器滥用毛玻璃。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`、`/supabase/supabase`、`/supabase/auth`、`/websites/developers_openai_api`、`/websites/vercel`。
- 2026-08-25 复核 `/supabase/supabase`：匿名账号必须先用 `updateUser({ email })` 完成邮箱身份，再在同一有效会话用 `updateUser({ password })` 添加密码；关闭 Confirm email 后第一步应立即完成而无需邮件。无会话的历史账号只能由服务端密钥通过 `auth.admin.updateUserById` 处理，且不得暴露到浏览器。
- 2026-08-31 再次复核 `/supabase/supabase`：本次只通过可复现迁移扩展现有列与 CHECK 约束，不新增 Auth、Storage 或 RLS 模式；迁移后继续用生成类型、双账号真实写入和 Advisors 复核数据库边界。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SDD-004 的 `OPENAI_API_KEY` 必须仅配置在 `.env.local` 和 Vercel 服务端环境；可选 `OPENAI_VISION_MODEL` 默认 `gpt-4o-mini`。浏览器不得读取这两个变量，OpenAI 请求必须使用 Responses API、`store: false` 和严格 JSON Schema。Windows 本地 Node.js 直连超时时统一经过 `lib/openai/responses.ts` 使用系统网络栈，密钥不得出现在命令参数、日志或响应中。
- SDD-005 推荐默认复用 `gpt-4o-mini`，可通过服务端 `OPENAI_RECOMMENDATION_MODEL` 单独覆盖；OpenAI 失败、超时或输出不合法时 MUST 在 15 秒目标内转为规则推荐。SDD-012 起天气位置只能来自当前账号保存的常用城市，由服务端通过 Open-Meteo 解析并获取天气；未设置时不得静默回退北京。SDD-013 起普通推荐只允许 `today | tomorrow`：今天取当前天气，明天按账号时区精确匹配日预报；天气失败 MUST 停止生成，不得返回或保存模拟天气。AI 失败仍可在真实天气成功后使用规则推荐。
- SDD-014 起 AI、规则降级和服务端校验 MUST 复用 `lib/recommendations/occasion-profile.ts` 的四场景画像；每套至少有两个独立场景信号，正式场景不得包含仅运动单品，可选配饰/外套不得使用场景明确不推荐的风格，热天不得使用非夏季外套，首个风格标签必须来自当前场景画像。语义相邻场合只提供弱信号，不得覆盖硬冲突。天气、衣着偏好、当前用户活跃衣物、完整性和跨套不重复优先于差异度；库存充足的固定样本六组场景核心单品 Jaccard MUST 不超过 0.5，小衣橱不得为追求差异伪造或错误搭配。AI 无效时沿用单次规则降级，不追加模型调用。
- SDD-017 起异场景标签是 AI、规则降级与最终复验共用的硬边界：衣物明确包含当前场景时可跨场景使用；否则休闲拒绝约会/正式/通勤标签，约会拒绝休闲标签，正式拒绝休闲/通勤标签，通勤不新增排斥。正式画像不得再把通勤作为弱关联或偏好风格。雨天只包含 WMO 51～67、80～82、95～99；雪天不得误判。防水能力只按明确名称语义与类别识别，普通 `synthetic` 不等于防水；若场景合法且季节适配的防水外层、下装与鞋三类候选完整，3 套中 MUST 至少 1 套使用完整组合，否则不得强行补齐。不得覆盖温度、衣着偏好、归属、完整性、跨套不重复或单次规则降级边界。
- SDD-018 起普通天气位置仍只来自当前账号主动保存的城市，不根据 IP、邮箱或浏览器位置静默变化；推荐页“选择城市”只接收城市名，Server Action 必须用 `auth.getUser()` 派生当前用户并复用城市解析，成功后更新城市五元组并删除当前用户全部旧推荐。失败不得覆盖原城市。入库工作区只有在单批 10 件全部 `confirmed` 后才显示“继续添加衣服”；该操作只释放浏览器预览 URL 并清空本地队列，严禁调用删除接口或修改已入库衣物。
- SDD-019 起可使用 Vercel 服务端可信请求头推导城市建议，但 IP 仍不得静默改变天气位置：仅中国大陆字段完整、坐标有效且与当前有效城市相距至少 50 公里时提示，浏览器只接收城市名，不得接收或持久化原始 IP、坐标、地区或时区。“本次使用”必须先复用城市解析，再写入绑定当前 `auth.getUser()` 账号的 HttpOnly、SameSite=Lax、无持久期限会话 Cookie；“设为常用城市”继续更新 Supabase 城市五元组并清除临时状态。推荐页日期、天气、批次校验和生成 MUST 统一使用临时城市优先、常用城市兜底的有效位置；切换或恢复后必须删除当前用户旧推荐。本地无 Vercel 请求头时安静降级到手动选城，不得设置默认武汉或北京。
- SDD-020 起设备定位只允许由用户点击“本次使用当前位置”或“设为常用城市”触发；页面加载、刷新和 Effect MUST NOT 请求权限，也不得使用 `watchPosition`。定位使用城市级低精度、10 秒超时和最多 5 分钟浏览器位置缓存。当前坐标只能由同一设备直接调用 BigDataCloud 免费客户端 Reverse Geocode to City API，并只接受 `lookupSource=coordinates`、`countryCode=CN` 的城市结果；衣拍即合 Server Action 只接收城市名和模式，MUST 用 `auth.getUser()` 重新鉴权并通过 `resolveChineseCity` 再次规范化，严禁接收或持久化设备经纬度。临时/常用城市继续复用 SDD-019 状态模型，切换后删除当前用户旧推荐；定位失败、非中国或第三方不可用时保留原城市和手动入口，不回退 IP、默认城市或模拟天气。
- SDD-021 起衣物风格规范固定为 `minimal/casual/commute/elegant/sporty/vintage/cleanfit/streetwear/cityboy/gorpcore/preppy/workwear/oldmoney/y2k` 14 类，入库、编辑、长期偏好、反馈账本、AI、规则降级与最终复验 MUST 共用该目录。`wardrobe_items.brand` 可空且最长 40 字符；品牌只有在图片存在清晰文字或标志证据时才能建议，否则 MUST 为 `brand=""`、`brand_confidence="unknown"`，最终值始终允许用户编辑确认。推荐页单次风格选择不写回长期偏好；自动模式在库存允许时分配三个不同兼容方向，指定模式保持同一方向，但天气、衣着归属、场景硬边界、完整性、雨天防水和跨套不重复始终优先。趋势灵感只允许使用包含来源 URL、发布日期和有效期的人工审核快照，过期条目不得继续标记为本季；不得在页面运行时抓取外站或复制外部图片。
- 2026-08-27 复核 `/websites/vercel` 与项目内 Next.js 16.3.1 文档：Vercel 地理请求头只应在服务端读取；App Router 的 `headers()` 与 `cookies()` 均按异步 API 使用，Cookie 写入只发生在 Server Action/Route Handler。
- SSR 客户端遵循 Supabase 官方模式：浏览器端使用 `createBrowserClient`，服务端使用 `createServerClient` + `next/headers` cookies，Next.js 16 使用根目录 `proxy.ts` 调用 `auth.getClaims()` 刷新会话。
- `lib/auth/viewer.ts` 的账号属性必须使用 `auth.getUser()` 获取 Auth 服务端最新记录；`getClaims()` 继续用于 Proxy 和轻量身份校验，但不得用于邮箱绑定后的即时匿名状态判断，因为当前 JWT 可能仍携带旧声明。
- SDD-001 数据底座为 `public.profiles` 和 `public.user_preferences`，均以 `auth.users.id` 为主键并启用 RLS；`authenticated` 仅有 `SELECT/INSERT/UPDATE`，`anon` 无表权限。
- SDD-003 衣橱底座为 `public.wardrobe_items`：记录绑定 `user_id`，`demo_key` 保证当前用户演示数据幂等，状态仅为 `active/archived`；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。
- SDD-004 入库底座为 `public.wardrobe_ingestions`：每张原图使用稳定请求 id、私有路径、处理状态与最长 24 小时有效期；`wardrobe_items.source_ingestion_id` 保证确认重试只创建一件衣物。表启用四类用户所有权 RLS，`anon` 无表权限。
- SDD-005 推荐底座为 `public.daily_recommendations`：每名用户每天最多一个批次，`outfits` 必须恰好 3 套，AI 来源必须记录模型；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。推荐结果 MUST 只引用当前用户活跃衣物，跨套不重复，且不得在同一套中混用连衣裙与上衣裤装。
- SDD-006 反馈底座为 `public.wardrobe_item_favorites`、`public.outfit_favorites` 和 `public.preference_feedback_events`；收藏使用唯一键幂等，整套收藏保存不可变 JSON 快照，反馈事件通过唯一 `event_key` 去重，三表均启用当前用户所有权 RLS。`user_preferences.style_scores` 必须由事件账本重算，不得让客户端直接写任意分数。
- SDD-009 日记底座为 `public.outfit_diary_entries`：每名用户每个自然日唯一，记录来源、场合、1～8 个当前用户活跃衣物 ID 与不可变文字快照；数据库触发器拒绝重复衣物和跨用户/已归档衣物引用，表启用四类当前用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。利用率从日记与当前可见日常衣橱即时计算，不单独持久化；未来日期不得写入，明日推荐不得提前计数。
- SDD-012 在 `public.user_preferences` 保存账号级 `clothing_preference` 与完整城市位置五元组，在 `public.wardrobe_items.audience` 保存男装/女装/中性归属。衣着过滤 MUST 可逆且不得删除记录；衣橱、首页预览和推荐候选 MUST 使用同一共享规则。
- Storage bucket `wardrobe-images` 必须保持私有，对象路径第一段固定为当前 `auth.uid()`；读取、插入、更新和删除均由同一路径规则限制。
- 当前 Supabase 项目已于 2026-08-21 开启 Anonymous Sign-Ins；`npm run verify:sdd-001` 已用两组真实匿名会话验证自身访问、跨用户 RLS 与 Storage 路径隔离。
- 当前 Supabase Auth 已开启 Email、Anonymous Sign-Ins 和 Manual Linking，并于 2026-08-25 经用户明确允许关闭 Confirm email；保存后重新加载页面复核仍为关闭。Site URL 为 `http://localhost:3000`，Redirect URL 包含 `http://localhost:3000/**` 与 `https://*-jialin-d583.vercel.app/**`，仅用于兼容旧链接和新增部署域名。
- 当前主 Vercel 项目为 `yipai-jihe`（project id：`prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team：`jialin-d583`，框架预设：Next.js）；Production 固定域名为 `https://yipai-jihe.vercel.app`，2026-08-28 最新部署 `dpl_GWYzhLiwS2FNNQMuVjWjpyAkT8C3` 已 `READY`，对应部署源 Git 提交 `1e65360`。Production 已配置两个 Supabase `NEXT_PUBLIC_` 变量、服务端 `OPENAI_API_KEY` 和 `OPENAI_VISION_MODEL`，不得配置 `SECRET_KEY` 或 `VERCEL_OIDC_TOKEN`。经用户明确同意，项目级 SSO 已关闭；首页、登录、衣橱、添加、推荐、收藏、设置、日记与手工记录页面公网均返回 200，首次账号入口、显式体验身份、28 件演示衣橱、武汉男装偏好、四场景一致性、雨天防水组合、连续入库、手动选城、确认式 IP 城市建议、穿搭日记、基础利用率报告、演示入口收敛、自然化排版及抽象品牌 Logo 均已上线。旧 `ai-coding` 项目仅保留历史 Preview，不得再作为默认部署目标。
- Vercel Production 发布流程：先运行 `npx vercel link --yes --project yipai-jihe --scope jialin-d583`、`npx vercel project inspect yipai-jihe --scope jialin-d583` 与 `npx vercel env ls production --scope jialin-d583`，确认链接项目正确、框架预设为 Next.js 且变量名称齐全；再运行 `npm run check`、`npm run build`，最后执行 `npx vercel deploy --prod --yes --scope jialin-d583`。发布后使用 `npx vercel inspect <deployment-url> --scope jialin-d583` 核对 `target=production`、`status=Ready` 和固定别名，并检查核心页面 HTTP 状态及 `npx vercel logs <deployment-id> --level error --since 30m --scope jialin-d583`；不得把密钥放进命令参数、日志或仓库。
- SDD-001 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-001`；最后一项会创建两组非敏感匿名测试资料并验证跨用户访问被拒绝。
- SDD-003 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-003`；最后一项会创建两组安全合成 PNG 衣物，验证记录与 Storage 的自身 CRUD 和跨用户拒绝，然后自动清理。
- SDD-004 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-004`；最后一项验证 10 张固定 jpg、双会话隔离、确认幂等、取消/过期清理和 10 项批量边界。2026-08-23 真实 `gpt-4o-mini` 基准为 10/10、平均 3504ms；2026-08-25 Windows 本地传输修复后，当前页面 10 张真实图片全部识别成功。
- SDD-005 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-005`；最后一项创建两组非敏感匿名测试衣橱，验证三套契约、同日三次覆盖为一行和跨用户 RLS 后自动清理。390px 浏览器必须另测至少两种场合/天气组合与规则降级。
- SDD-006 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-006`；最后一项创建两组匿名测试衣物，验证单品/整套收藏和反馈幂等、跨用户读取/写入拒绝后自动清理。390px 浏览器必须另测合法替换持久化、无候选说明、收藏页和 3 题问卷来源说明。
- SDD-007 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-007`；最后一项为无网络静态门禁，核对 7 个核心页面、演示/测试素材、迁移、npm 脚本、README、环境模板和客户端密钥边界。远端隔离继续复跑 SDD-001、003、005、006；真实 AI 识别仅在模型、提示词或识别代码变化时复跑以避免无意义付费。
- SDD-009 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-009`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-012`、`npm run verify:sdd-015` 与 `npm run verify:sdd-016`；独立门禁覆盖固定利用率聚合、未来日期、同日 upsert、编辑删除、双账号 RLS、跨账号衣物拒绝和页面静态边界。390px 浏览器另验收日记、报告、手工记录与今日推荐入口无溢出、无残留遮罩和无控制台 error。
- SDD-012 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-012`；最后一项创建武汉男装与上海女装两组隔离账号，验证字段约束、跨用户 RLS、过滤不删除和按钮扫光静态边界。浏览器另验收账号摘要、当前 24 件男装/中性演示视图及武汉实时天气。
- SDD-013 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-013`；最后一项读取武汉真实两日天气、精确匹配明日日期，验证代码无模拟降级，并用匿名会话确认今天/明天分别保存且同日刷新不覆盖另一日期。390px 浏览器另验收日期切换、真实来源和无水平溢出。
- SDD-014 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-014`，并回归 `npm run verify:sdd-005`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖四场景 12 套、两个场景信号、正式雷区、六组核心单品重合度、当前 24 件男装/中性演示候选、冷热天气和最小衣橱边界。
- SDD-015 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-015`；独立门禁覆盖 8 个核心页面的语义排版接入、旧超大字号、极端负字距、前导零计数、模板式文案和长破折号边界。390px 浏览器另验收标题换行、横向溢出、AI 来源层级和控制台错误。
- SDD-016 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-016`，并回归 `npm run verify:sdd-002`；无会话首页 MUST 只显示登录、直接注册和显式体验身份入口，不得自动调用匿名登录或展示业务 App chrome。直接注册依赖 Supabase Confirm email 关闭并必须立即返回会话；登录后需幂等补齐资料与偏好。390px 浏览器另验收标签切换、字段留白、无横向溢出和无控制台 error。
- SDD-017 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-017`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-014`、`npm run verify:sdd-005`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 6 组异场景硬冲突、多场景基础款例外、雨/阵雨/雷雨与雪天边界、完整/不完整防水库存、热天冬季外层、28 件演示素材和 24 件男装/中性候选。
- SDD-018 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-018`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-015`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 10/10 满批重置、预览资源释放、无持久删除、推荐页城市选择、无 IP 定位、当前会话身份、偏好 RLS 和旧推荐失效。识别模型、提示词或 API 未变化时不得为本 UI 重置重复执行 10 张付费 AI 识别。
- SDD-019 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-019`，并回归 `npm run verify:sdd-018`、`npm run verify:sdd-007`、`npm run verify:sdd-015`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 Vercel 请求头解码、非中国与缺失字段降级、50 公里提示门槛、账号绑定 HttpOnly 会话 Cookie、跨账号拒绝、服务端城市规范化、切换后旧推荐失效和浏览器不接收坐标。390px 浏览器必须另验收无 IP 安静降级、可控异地提示、双操作、无溢出和无控制台 error。
- SDD-020 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-020`，并回归 `npm run verify:sdd-018`、`npm run verify:sdd-019` 与 `npm run verify:sdd-013`；独立门禁覆盖非法坐标、只接受当前坐标城市、中国范围、无静默或持续定位、低精度与超时、应用服务器不接收设备经纬度、当前会话身份、城市二次规范化和旧推荐失效。390px 浏览器另验收双按钮至少 44px、高级动效延续、手动入口、无溢出和无控制台 error；真实设备权限只能由用户本人决定。
- SDD-021 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-021`，并回归 `npm run verify:sdd-004`、`npm run verify:sdd-005`、`npm run verify:sdd-014`、`npm run verify:sdd-017` 与 `npm run verify:sdd-007`；独立门禁覆盖 14 风格、品牌长度与防猜、双账号 RLS、自动/指定风格方向和来源化趋势有效期。识别提示或 Schema 变化时 MUST 复跑 10 张真实图片，要求类别至少 8/10 且无品牌固定样本不得猜品牌；390px 浏览器另验收偏好换行、风格选择、搭配要点、趋势来源和控制台 error。
- 开启匿名登录后，Supabase 安全顾问会对允许匿名身份使用的 `authenticated` 策略给出提醒；只有策略同时使用 `auth.uid()` 所有权或对象路径约束时才可接受。SDD-002 已启用邮箱密码能力并关闭 Confirm email，完成真实登录验收时必须同步复核泄露密码保护提示。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 当前阶段：P0 的 SDD-001、SDD-003～SDD-007、SDD-011～SDD-019 与 P1 的 SDD-009 已完成并部署；SDD-020 设备定位天气城市和 SDD-021 风格智能、品牌识别与本季灵感已于 2026-08-31 完成本地实现和验收，尚未部署。穿搭日记、基础利用率报告、演示衣橱入口收敛与抽象品牌 Logo 已于 2026-08-28 上线。当前 `yipai-jihe` Production 仍为 `dpl_GWYzhLiwS2FNNQMuVjWjpyAkT8C3`，对应部署源提交 `1e65360`。SDD-002 的合成账号无邮件注册和重新登录已通过，下一步仍须由用户本人完成历史账号密码和真实账号重登录集中验收。不得建议更换邮箱，不得替用户输入、保存或记录密码，也不得在未获明确同意时修改公开访问策略、设置自定义域名或创建保护绕过链接。证据和限制以 [`progress.md`](progress.md) 为准。

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前仍使用原图卡片，不执行自动抠图；P1 的基础穿搭日记与利用率已由 SDD-009 完成，照片上传、提醒、分享、AI 长报告和日记偏好加权不在该阶段。P1 抠图 MUST 经过服务端 `cutoutService` 调用外部 API，密钥只能通过环境变量提供，失败不得阻塞原图入库。
- SDD-002 已实现邮箱和密码一次提交的原地注册、直接登录、退出和跨设备恢复，但在用户完成真实账号验收前保持“验收中”，且仍不得作为 SDD-003 至 SDD-007 的依赖。匿名用户必须明确知道清除站点数据或换设备后无法恢复未注册身份；注册流程 MUST 保持同一 `auth_user_id` 和原匿名数据。登录与旧认证回调页面 MUST 跳过自动匿名初始化，只有用户主动选择时才创建新匿名身份。
- SDD-016 起首次访问不得自动创建匿名身份。无会话首页 MUST 先展示完整账号入口；新用户可直接邮箱密码注册，已有用户可登录，体验身份只允许由明确按钮触发。无会话深链接必须返回 `/`，不得在跳转前展示顶部状态或底部导航；已有会话继续进入原应用。
- SDD-002 不再发送注册确认或密码设置邮件。历史遗留的已绑定无密码账号只允许在本机运行 `npm run account:set-password-local`，通过 `.env.local` 的 `SECRET_KEY` 和 `auth.admin.updateUserById` 一次性设密；不得把该能力做成 Route Handler、Server Action 或 Vercel 环境能力。常规忘记密码仍不在当前范围。
- 全局动效以 `app/globals.css` 的气泡扩散、分层显现、导航选中气泡、按钮径向反馈和卡片景深为准；不得恢复所有控件统一上下弹跳，也不得恢复黑色按钮的白色横向扫光。所有后续 UI MUST 支持 `prefers-reduced-motion` 和 `prefers-reduced-transparency`。
- 演示数据 MUST 按当前用户隔离加载，且入口只允许空衣橱体验身份使用：正式账号、已有任意真实衣物或内置演示衣橱已经完整时 MUST 隐藏入口；体验身份部分加载失败且没有真实衣物时只显示“继续加载演示衣橱”。`loadDemoWardrobe` Server Action MUST 使用 `auth.getUser()` 重新确认匿名身份并在服务端拒绝正式账号和已有真实衣物的账号，不能只依赖页面显隐。不得把真实个人敏感照片写入仓库或提交记录。
- 内置演示衣物共 28 件，图片位于 `public/demo-wardrobe/`，按 `demo_key` 使用同名 768px WebP 棚拍素材；其中 4 件 SDD-017 正式胶囊为无人物、无品牌的透明背景生成素材。仅演示数据使用公开静态图，真实用户上传仍 MUST 使用 `wardrobe-images` 私有 bucket 与签名 URL。
- SDD-004 固定识别样本位于 `public/test-wardrobe/`，期望值在 `specs/004-ai-item-ingestion/test-samples.json`；这些图片只用于测试，不得作为用户真实衣橱数据自动加载。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
