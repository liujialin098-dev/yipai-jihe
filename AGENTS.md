# 项目开发说明

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript；Sharp 0.34 仅用于服务端透明图验证与裁边。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：首页、衣橱列表与单品详情/编辑、AI 添加衣物工作区、推荐、时尚灵感、自由穿搭画布、个人主页、穿搭日记/利用率、收藏、设置路由，以及匿名会话与衣物入库 Route Handlers。
- `components/`：移动端应用外壳、统一品牌标志、顶部头像入口、底部导航、会话启动、衣橱筛选/卡片/表单、入库工作区、无人物穿搭画布/推荐换件、个人资料编辑、日记记录、收藏、偏好问卷和通用状态；`components/ui/` 保留 shadcn/ui 基础组件。
- `lib/auth/viewer.ts`：服务端当前用户最小读取；`lib/supabase/`：browser/server/proxy 客户端、公开配置检查和生成的数据库类型。
- `lib/openai/responses.ts`：Responses API 服务端传输；非 Windows 使用标准 `fetch`，Windows 本地使用 PowerShell 网络栈与 Base64 请求体，密钥只通过子进程环境传递。
- `lib/wardrobe/`：14 类衣物风格常量、品牌与字段校验、查询、衣橱组成判断、OpenAI 结构化识别和入库生命周期辅助；私有图片签名地址在服务端短期缓存并限制条目数。
- `lib/personalization/`：账号衣着偏好、衣物归属和共享可逆过滤规则。
- `lib/recommendations/`：账号城市、Vercel IP 城市建议与用户触发的设备城市解析、账号隔离的临时城市会话、有效位置选择、真实今日/明日天气快照、四场景共享画像与异场景硬边界、雨天防水角色、自动/指定风格方向、严格推荐契约、OpenAI 生成、差异化规则降级、分层角色派生、虚拟模特 Lookbook 提示与私有缓存、归属与搭配结构校验、来源化本季趋势快照，以及目标日期批次读取映射。
- `lib/feedback/`：同类合法候选、换件后完整复验、单品/整套收藏 Action、固定偏好权重、事件写入和风格分数重算。
- `lib/diary/`：日记输入校验、账号日期/月度读取、推荐/手工快照解析和 30/90/全部范围的即时利用率聚合。
- `lib/outfits/`：穿搭画布主题、2～8 件初始布局、变换校验、浏览器本地纯色背景抠图、当前用户画布读取和 1080×1350 PNG 导出。
- `lib/profile/`：昵称、头像类型/大小/私有路径校验，以及个人主页当前账号统计与近期画布聚合。
- `lib/inspiration/`：Vogue/GQ 官方 RSS 白名单、每日来源/中文标题缓存、纯函数过滤与排序、稳定 URL ID 和 30 天账号主题展示记录；个性化复用临时城市优先、真实天气、近期场景和当前衣橱。未核实日期的编辑后备不得展示。
- `supabase/migrations/`：可复现数据库迁移；`scripts/verify-sdd-001.mjs` 至 `scripts/verify-sdd-007.mjs`、`scripts/verify-sdd-009.mjs`、`scripts/verify-sdd-012.mjs` 至 `scripts/verify-sdd-027.mjs`：双匿名会话、幂等、固定样本、推荐/日记/反馈隔离、天气/场景/风格、分层搭配、无人物画布、本地/百度专业抠图、私有头像、个人主页、内容阅读状态与 UI 门禁。
- `specs/001-app-foundation/`、`specs/003-wardrobe-core/` 至 `specs/007-release-deploy/`、`specs/009-outfit-diary/`、`specs/011-global-motion/` 至 `specs/027-fashion-news-feed/` 为已完成阶段；SDD-027 尚待 Production 部署。`specs/002-account-binding/` 的无邮件注册与合成账号重登录已通过，本地历史账号设密与用户本人重登录仍等待集中调试。
- `README.md`：本地启动、环境变量、迁移、质量命令、5 分钟演示、部署和已知限制的交付入口。
- `public/brand/`：抽象品牌主标、保留设计稿和冷白底 512px App 图标；页面统一通过 `components/brand-mark.tsx` 使用正式 App 图标。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。
- 当前视觉基线：冷白画布和近黑文字为功能底层，青柠、丁香紫、珊瑚橙与天空蓝四个时尚 token 用于内容主题、导航选中态、画布与个人主页；颜色 MUST 按固定角色复用，不得随机给所有容器上色。保留软圆角、Apple 式触感和固定底部玻璃 Dock。正式 Logo 继续复用 `BrandMark`。Liquid Glass 仅为 Web 材质近似，并提供减少动态与减少透明度降级。排版 MUST 复用六级语义 token；黑色按钮不得恢复高对比白色扫光。

## 注意事项

- SDD-029（2026-09-06）个人主页采用纯色丁香封面、突出头像昵称、横排真实统计与近期穿搭作品区；用户随后要求 App 底板采用浅紫到冷白的低对比渐变（#f0eaff → #f8f5ff → #fff），覆盖首版纯白决定，不恢复高饱和四色渐变。四色仍按固定角色用于内容与操作，正式 Logo、底部 Dock、原路由和私密边界不变。资料编辑默认为收起，原生 details 支持键盘；仅个人主页的 `OutfitCanvasPreview` 使用 `hideHeading` 将标题放到图外，不改原画布变换或分享图。减少常驻解释文案，生成快照在“生成信息”内按需展开，保留天气来源、权限隐私及真实错误。抠图失败提示简写，不代表专业服务已恢复。保留根节点既有固定浅色策略。验收为 `npm run verify:sdd-029`、check/build 和 390px/桌面浏览器；本阶段未部署，027/028 也仍未发布。

- SDD-028 和风天气（2026-09-06）：本地接入已实现，覆盖 SDD-012/013/018/020 中 Open-Meteo/BigDataCloud 供应商约定；位置主动确认、账号隔离和禁止模拟原则不变。服务端 QWEATHER_API_HOST、QWEATHER_DEVELOPER_ID、QWEATHER_PROJECT_ID、QWEATHER_CREDENTIAL_ID、QWEATHER_PRIVATE_KEY 签发 5 分钟 JWT；仅同源且 auth.getUser() 有效的 POST /api/weather/session 可取，返回 private,no-store，每账号每分钟 12 次进程级限频。浏览器天气和设备城市解析直连和风，私钥不得进入浏览器。推荐与灵感使用服务端独立真实天气，不能信任客户端温度。lib/weather/parse.ts 统一现象映射与日期解析，未知代码/异常单位/缺预报失败；明日最低气温必须注明 air_minimum，不得称体感。历史 Open-Meteo 快照保留原来源，不标为实时。
- 和风本机配置：setup-qweather-keys.mjs 必须复用 Git 忽略的 .env.qweather-private.pem，不轮换；准备文件 .env.qweather.local 不自动加载，configure-qweather-local.mjs 安全生成 .env.development.local，仅用于 dev，不覆盖 .env.local、不打印密钥。生产构建不加载 development 配置；Vercel 尚未配置和风五项环境或部署 SDD-027/028。生产前须复核供应商额度、浏览器凭据限制与国内手机无代理网络。验证：verify:sdd-028 固定解析/短 JWT，verify:sdd-013 真实和风两日与日期隔离；另回归 007/012/014/015/017/018/019/020，浏览器查真实直连、失败重试、跨城市与 390px。
- 2026-09-06 文档复核：Context7 `/websites/dev_qweather_en` 部分认证示例仍为旧版；以和风天气当前官方 `https://dev.qweather.com/docs/configuration/authentication/` 为准，JWT Header 为 `alg=EdDSA` 与 `kid`，Payload 同时包含 `iss`（开发者 ID）、`sub`（项目 ID）、`iat` 与 `exp`。测试使用 `/weather/v1/current/{latitude}/{longitude}` 与 `/weather/v1/daily/{latitude}/{longitude}` 新版接口，天气现象代码不能直接作为现有 WMO 代码使用。
- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 后续页面 MUST 延续当前视觉 token：卡片使用约 24px 软圆角，主要按钮使用胶囊或圆形，玻璃效果只用于导航和悬浮控件；丁香紫只作为四色体系的一部分，不得恢复单一紫色模板或在所有容器滥用毛玻璃。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`、`/supabase/supabase`、`/supabase/auth`、`/websites/developers_openai_api`、`/websites/vercel`、`/websites/ai_baidu_tech`、`/lovell/sharp`。
- 2026-08-25 复核 `/supabase/supabase`：匿名账号必须先用 `updateUser({ email })` 完成邮箱身份，再在同一有效会话用 `updateUser({ password })` 添加密码；关闭 Confirm email 后第一步应立即完成而无需邮件。无会话的历史账号只能由服务端密钥通过 `auth.admin.updateUserById` 处理，且不得暴露到浏览器。
- 2026-08-31 再次复核 `/supabase/supabase`：本次只通过可复现迁移扩展现有列与 CHECK 约束，不新增 Auth、Storage 或 RLS 模式；迁移后继续用生成类型、双账号真实写入和 Advisors 复核数据库边界。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SDD-004 的 `OPENAI_API_KEY` 必须仅配置在 `.env.local` 和 Vercel 服务端环境；可选 `OPENAI_VISION_MODEL` 默认 `gpt-4o-mini`。浏览器不得读取这两个变量，OpenAI 请求必须使用 Responses API、`store: false` 和严格 JSON Schema。Windows 本地 Node.js 直连超时时统一经过 `lib/openai/responses.ts` 使用系统网络栈，密钥不得出现在命令参数、日志或响应中。
- SDD-022 的虚拟模特效果图为历史能力，当前默认 UI 已由 SDD-024 取消入口；若未来单独恢复，仍只能通过服务端 Image API 生成，密钥不得进入浏览器，生成图只能写入当前用户私有路径并先做归属校验。未经新的明确需求不得把历史 Lookbook 接回推荐页。
- SDD-024 已覆盖 SDD-022/023 的默认展示：推荐卡和穿搭编辑主路径 MUST 只展示当前推荐的真实衣物排布，不得出现固定人物、人物轮廓、虚拟模特或 AI 效果图入口。历史 Lookbook 与人物预览代码不得重新接回默认 UI。每张画布只能保存当前账号 2～8 件活跃衣物；服务端必须重新鉴权并复验衣物与来源推荐归属。浏览器本地抠图只作为近纯色背景备用，复杂背景必须保留原图。分享图为 1080×1350 PNG，不得包含邮箱、用户 ID、私有路径或原始推荐内部字段。
- SDD-025 起 `profiles.avatar_path` 只允许 `<auth.uid()>/profile/avatar-<uuid>.(jpg|png|webp)`；头像必须小于等于 5MB，读取只使用短期签名地址。浏览器上传后，Server Action 必须用 `auth.getUser()` 重新鉴权、验证对象实际存在并只更新当前账号；绑定成功后清理旧头像，失败时删除未绑定新对象。个人主页统计只聚合当前账号衣物、画布和日记；不得发展为公开主页、关注、评论或用户搜索。
- SDD-026 起专业去背采用百度智能云“智能抠图”API；用户于 2026-09-02 明确选择该国内方案，覆盖此前 PhotoRoom 决策。`BAIDU_API_KEY` 与 `BAIDU_SECRET_KEY` 只能配置在 `.env.local` 和 Vercel 服务端环境，不得使用 `NEXT_PUBLIC_` 前缀；Access Token 只能在服务端按 `expires_in` 缓存并提前 5 分钟失效。服务端先将当前账号原图规范化为百度尺寸与 Base64 上限，再固定请求 `method=auto`、`refine_mask=true`、`return_form=rgba`，Token 与抠图共享 20 秒超时；透明 PNG 保存为私有精修工作图，再由 Sharp 校验透明通道并自动裁边生成展示图。新版本展示图与工作图全部写入成功后才更新 `cutout_path`，失败必须继续使用旧透明图或原图。新衣确认通过 Next.js `after()` 在响应后异步处理，不得阻塞入库；客户端批量确认固定为 2 路并在每件后等待 4 秒，避免 10 件同时挤压第三方接口。画布 MUST 保持无格子、无吸附的自由移动/旋转/缩放；分类尺寸只影响新画布初始 scale，不改写历史画布或图片像素。人工精修必须同时提供擦除和从原图恢复，原图与工作图都必须通过同源、当前用户鉴权接口读取，取消或保存失败不得覆盖当前结果。
- SDD-005 推荐默认复用 `gpt-4o-mini`，可通过服务端 `OPENAI_RECOMMENDATION_MODEL` 单独覆盖；OpenAI 失败、超时或输出不合法时 MUST 在 15 秒目标内转为规则推荐。SDD-012 起天气位置只能来自当前账号保存的常用城市，由服务端通过 Open-Meteo 解析并获取天气；未设置时不得静默回退北京。SDD-013 起普通推荐只允许 `today | tomorrow`：今天取当前天气，明天按账号时区精确匹配日预报；天气失败 MUST 停止生成，不得返回或保存模拟天气。AI 失败仍可在真实天气成功后使用规则推荐。
- SDD-014 起 AI、规则降级和服务端校验 MUST 复用 `lib/recommendations/occasion-profile.ts` 的四场景画像；每套至少有两个独立场景信号，正式场景不得包含仅运动单品，可选配饰/外套不得使用场景明确不推荐的风格，热天不得使用非夏季外套，首个风格标签必须来自当前场景画像。语义相邻场合只提供弱信号，不得覆盖硬冲突。天气、衣着偏好、当前用户活跃衣物、完整性和跨套不重复优先于差异度；库存充足的固定样本六组场景核心单品 Jaccard MUST 不超过 0.5，小衣橱不得为追求差异伪造或错误搭配。AI 无效时沿用单次规则降级，不追加模型调用。
- SDD-017 起异场景标签是 AI、规则降级与最终复验共用的硬边界：衣物明确包含当前场景时可跨场景使用；否则休闲拒绝约会/正式/通勤标签，约会拒绝休闲标签，正式拒绝休闲/通勤标签，通勤不新增排斥。正式画像不得再把通勤作为弱关联或偏好风格。雨天只包含 WMO 51～67、80～82、95～99；雪天不得误判。防水能力只按明确名称语义与类别识别，普通 `synthetic` 不等于防水；若场景合法且季节适配的防水外层、下装与鞋三类候选完整，3 套中 MUST 至少 1 套使用完整组合，否则不得强行补齐。不得覆盖温度、衣着偏好、归属、完整性、跨套不重复或单次规则降级边界。
- SDD-018 起普通天气位置仍只来自当前账号主动保存的城市，不根据 IP、邮箱或浏览器位置静默变化；推荐页“选择城市”只接收城市名，Server Action 必须用 `auth.getUser()` 派生当前用户并复用城市解析，成功后更新城市五元组并删除当前用户全部旧推荐。失败不得覆盖原城市。入库工作区只有在单批 10 件全部 `confirmed` 后才显示“继续添加衣服”；该操作只释放浏览器预览 URL 并清空本地队列，严禁调用删除接口或修改已入库衣物。
- SDD-019 起可使用 Vercel 服务端可信请求头推导城市建议，但 IP 仍不得静默改变天气位置：仅中国大陆字段完整、坐标有效且与当前有效城市相距至少 50 公里时提示，浏览器只接收城市名，不得接收或持久化原始 IP、坐标、地区或时区。“本次使用”必须先复用城市解析，再写入绑定当前 `auth.getUser()` 账号的 HttpOnly、SameSite=Lax、无持久期限会话 Cookie；“设为常用城市”继续更新 Supabase 城市五元组并清除临时状态。推荐页日期、天气、批次校验和生成 MUST 统一使用临时城市优先、常用城市兜底的有效位置；切换或恢复后必须删除当前用户旧推荐。本地无 Vercel 请求头时安静降级到手动选城，不得设置默认武汉或北京。
- SDD-020 起设备定位只允许由用户点击“本次使用当前位置”或“设为常用城市”触发；页面加载、刷新和 Effect MUST NOT 请求权限，也不得使用 `watchPosition`。定位使用城市级低精度、10 秒超时和最多 5 分钟浏览器位置缓存。当前坐标只能由同一设备直接调用 BigDataCloud 免费客户端 Reverse Geocode to City API，并只接受 `lookupSource=coordinates`、`countryCode=CN` 的城市结果；衣拍即合 Server Action 只接收城市名和模式，MUST 用 `auth.getUser()` 重新鉴权并通过 `resolveChineseCity` 再次规范化，严禁接收或持久化设备经纬度。临时/常用城市继续复用 SDD-019 状态模型，切换后删除当前用户旧推荐；定位失败、非中国或第三方不可用时保留原城市和手动入口，不回退 IP、默认城市或模拟天气。
- SDD-021 起衣物风格规范固定为 `minimal/casual/commute/elegant/sporty/vintage/cleanfit/streetwear/cityboy/gorpcore/preppy/workwear/oldmoney/y2k` 14 类，入库、编辑、长期偏好、反馈账本、AI、规则降级与最终复验 MUST 共用该目录。`wardrobe_items.brand` 可空且最长 40 字符；品牌只有在图片存在清晰文字或标志证据时才能建议，否则 MUST 为 `brand=""`、`brand_confidence="unknown"`，最终值始终允许用户编辑确认。推荐页单次风格选择不写回长期偏好；自动模式在库存允许时分配三个不同兼容方向，指定模式保持同一方向，但天气、衣着归属、场景硬边界、完整性、雨天防水和跨套不重复始终优先。趋势灵感只允许使用包含来源 URL、发布日期和有效期的人工审核快照，过期条目不得继续标记为本季；不得在页面运行时抓取外站或复制外部图片。
- SDD-022 起推荐单套允许 3～7 件，角色由 `lib/recommendations/layers.ts` 统一派生并限制为最多 2 件上装、1 件下装/连衣裙、1 件外套、1 双鞋、2 件配饰。冷天可增加内搭，热天不得为追求复杂度强行叠穿。SDD-024 起角色只服务于衣物排布和实拍核对；换件仍须清空历史效果图元数据，防止旧缓存与新衣物错配。
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
- 当前主 Vercel 项目为 `yipai-jihe`（project id：`prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team：`jialin-d583`，框架预设：Next.js）；Production 固定域名为 `https://yipai-jihe.vercel.app`，2026-09-02 最新部署为 `dpl_Asby267EpX5q46dSJDyXgq4uMoZJ`，对应部署源 Git 提交 `702bc6f`。SDD-024/025/026 的无人物自由画布、分享卡片、个人主页、时尚四色视觉与百度专业去背均已上线。Production 已配置两个 Supabase `NEXT_PUBLIC_` 变量、服务端 `OPENAI_API_KEY`、`OPENAI_VISION_MODEL`、`BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`。旧 `ai-coding` 项目仅保留历史 Preview，不得再作为默认部署目标。
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
- SDD-022 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-022`，并回归 `npm run verify:sdd-005`、`npm run verify:sdd-014`、`npm run verify:sdd-017` 与 `npm run verify:sdd-021`；独立门禁覆盖冷/温/热分层数量、角色顺序、类别上限、图像提示安全、私有 Storage 双账号隔离、占位素材和推荐卡静态边界。图像模型调用只做按需人工验收，不在自动测试中消耗额度；390px 浏览器另验收有图、无图、生成中、错误和换件失效状态。SDD-005/021 的联网回归若因环境审批未执行，必须在进度文档中保留未完成记录。
- SDD-023 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-023`；独立门禁覆盖真实图片地址复用、固定人物素材、角色标签、缺图占位、无模型/第三方请求、AI 可选增强边界和推荐卡实拍核对保留。390px 浏览器必须另验收精准预览的 3～7 件展示、长名称、缺图状态、无横向溢出和无控制台 error；本阶段不重复消耗图像模型额度。
- SDD-024 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-024`；独立门禁覆盖 2～8 件布局边界、纯色/透明/复杂背景固定像素样本、无人物默认路径、保存校验、双账号画布 RLS 和私有抠图签名隔离。390px 浏览器另验收衣物可移动、工具栏、五种底色、无溢出和无控制台 error。
- SDD-025 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-025`，并回归 SDD-024；独立门禁覆盖昵称标准化、头像 MIME/5MB/UUID 路径、四个时尚 token、当前账号统计、资料 RLS 和私有头像签名隔离。390px 浏览器另验收个人主页四项统计、头像昵称编辑、近期卡片、顶部入口、无溢出和无控制台 error。
- SDD-026 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-026`，并回归 `npm run verify:sdd-024` 与 `npm run verify:sdd-025`；独立门禁覆盖百度 OAuth Token 缓存、智能抠图参数、双密钥边界、Sharp 透明样本裁边、六类初始尺寸、无格子画布和人工擦除/恢复静态边界。2026-09-02 Production 隔离体验身份完成 10 张真实固定样本：首次后台并发 7/10，安全回退后单件顺序重试达到 10/10；所有透明图和工作图均位于当前账号私有路径。390px 已验证移动、旋转、专业重试、擦除/恢复和 0 console error。
- 开启匿名登录后，Supabase 安全顾问会对允许匿名身份使用的 `authenticated` 策略给出提醒；只有策略同时使用 `auth.uid()` 所有权或对象路径约束时才可接受。SDD-002 已启用邮箱密码能力并关闭 Confirm email，完成真实登录验收时必须同步复核泄露密码保护提示。
- SDD-027：只展示白名单 RSS 的标题级中文简述，不下载外图、全文或绕过付费墙。AI 仅接收公开标题和稳定 ID，复用服务端 Responses、`store:false` 与严格 JSON Schema，默认 `gpt-4o-mini`，可复用 `OPENAI_RECOMMENDATION_MODEL`。失败保留原题并标为阅读提示，不假装生成新闻事实。`unstable_cache` 只缓存公开内容，不能在缓存中读取用户 cookies/位置/衣橱；个人排序在缓存之外。
- SDD-027 数据：`fashion_content_reads` 和 `fashion_topic_impressions` 均启用当前账号四类所有权 RLS；`record_fashion_impression` 为 security invoker，仅当前用户、同主题 30 天内保留首次内容与时间，不得在普通已读操作中写提醒时间。关闭个性化不查询衣橱、日记或天气；关闭提示不显示徽标，也不删除历史记录。
- SDD-027 验证：`npm run check`、`npm run build`、`npm run verify:sdd-027`；离线运行可加 `node --no-warnings scripts/verify-sdd-027.mjs --offline`。脚本覆盖纯规则、SQL 幂等与双账号隔离；390px 另测全空主题、设置持久化、详情已读与无溢出。未知同义主题、真实跨日来源恢复与 Production 验收不得自动宣称完成。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 当前阶段：SDD-028 国内和风天气前端直连本地 MVP 已实现并通过核心验收（2026-09-06），详细证据以 progress.md 为准；SDD-027 MVP 本地复验通过（实现 c5ca213）。SDD-026 仍是线上版本，Production 为 dpl_Asby267EpX5q46dSJDyXgq4uMoZJ、源提交 702bc6f；未经用户新部署指令不得发布 027/028。027 已确认可信来源、App 内提醒与每日更新，028 已选和风，无需重问。SDD-002 本人历史账号设密和重登录仍待集中调试；不得代替用户输入或保存密码、擅改公开策略或保护绕过设置。

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前真实衣物原图始终是可信源；SDD-026 已在用户明确授权后接入百度智能云服务端专业去背。第三方只接收当前用户触发处理的单件原图；无密钥、超时、限额、非法响应、私有存储失败或数据库绑定失败时必须保留当前有效透明图或原图。穿搭新闻属于独立 SDD-027，不改动衣物去背或推荐生成主链路。
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
