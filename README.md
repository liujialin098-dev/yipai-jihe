# 衣拍即合

衣拍即合是一个移动端优先的 AI 私人衣橱 MVP：用户先登录、直接注册或明确选择体验身份，再管理真实衣物原图、用 AI 辅助识别入库、按真实天气和场合生成每日 3 套穿搭，并通过换件、收藏和 3 题偏好持续调整结果；实际穿过后还可记入日记并查看基础衣物利用率。

当前 P0 核心闭环：

```text
选择登录 / 注册 / 体验 → 演示或真实衣橱 → AI 或手工入库 → 每日三套 → 换一件 → 收藏与偏好 → 日记与利用率 → 每日时尚灵感
```

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui、lucide-react
- Supabase Auth、Postgres、Storage 与 RLS
- OpenAI Responses API（服务端结构化图片识别与穿搭推荐）
- Vercel Preview

## 本地启动

环境要求：Node.js 20+、npm，以及可访问的 Supabase 项目。

```bash
npm install
copy .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。首次访问只显示账号入口，不会自动创建匿名会话。新用户可用邮箱和密码直接注册，不需要邮件确认；也可以主动选择体验身份。体验身份清除站点数据或更换设备后无法恢复。

## 环境变量

把 `.env.example` 复制为 `.env.local` 后填写：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL，可公开。
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`：Supabase publishable key，可公开。
- `OPENAI_API_KEY`：仅服务端使用，严禁 `NEXT_PUBLIC_` 前缀或提交仓库。
- `OPENAI_VISION_MODEL`：可选，图片识别模型，默认 `gpt-4o-mini`。
- `OPENAI_LOOKBOOK_MODEL`：可选，单套虚拟模特效果图模型，默认 `gpt-image-2`；仅在用户点击生成效果图时调用。
- `OPENAI_RECOMMENDATION_MODEL`：可选，推荐模型，默认 `gpt-4o-mini`。
- `SECRET_KEY`：只保留 Supabase 服务端密钥模板；当前应用流程不需要部署它，严禁浏览器读取。

`.env.local` 已被 Git 忽略。Vercel 只配置实际需要的服务端变量和两个 Supabase 公开变量。

SDD-028 本地已接入和风天气：浏览器直接获取天气，服务端只签发最长 5 分钟的短 JWT；生成搭配时服务端独立读取同一供应商的真实天气，不相信浏览器传入的温度。Production 尚未配置或部署此版本。

服务端配置：`QWEATHER_API_HOST`、`QWEATHER_DEVELOPER_ID`、`QWEATHER_PROJECT_ID`、`QWEATHER_CREDENTIAL_ID`、`QWEATHER_PRIVATE_KEY`（Ed25519 PEM，支持实际换行或转义换行）。这些变量均不能加 `NEXT_PUBLIC_`。已有本机准备文件时运行 `node scripts/configure-qweather-local.mjs`，将它们安全转入被忽略的 `.env.development.local`；脚本不会覆盖不同的已有文件，也不打印私钥。该文件仅用于 `npm run dev`，不会被 production build/start 加载；未来部署时须单独安全配置 Vercel 的五项服务端变量，不能直接拿未配置的构建发布。

天气城市由当前账号手动选择或点击定位后确认：本次城市优先、常用城市兜底，IP 只给建议；没有城市不默认武汉/北京。设备坐标只由浏览器发和风 GeoAPI，应用只接收城市名。今日显示实际气温与体感；明日精确匹配下一自然日，显示最低/最高气温，最低气温作为保守穿衣参考，不假称最低体感。快照标明获取时间，旧推荐另标生成时来源。天气请求失败或超过 5 分钟时暂停生成并允许刷新。

签发接口要求当前会话与同源 POST；每账号每分钟 12 次的进程级限频不替代分布式防滥用或平台配额。生产前须复核和风配额、域名/凭据限制以及国内手机网络。和风接口国内可达不等于整个 Vercel/Supabase 应用都已完成国内可用性验证。

## 数据库与 Storage

数据库唯一事实来源是 `supabase/migrations/`，按文件名顺序应用。不要从 README 复制另一份建表 SQL，以免和迁移漂移。

主要数据：用户资料与偏好、衣物、AI 入库任务、每日推荐、穿搭日记、单品收藏、穿搭快照收藏、偏好反馈事件，以及时尚内容的已读状态。所有业务表启用 RLS 并以当前 Auth 用户隔离。

`wardrobe-images` bucket 必须保持私有，对象路径第一段必须是当前 `auth.uid()`。`public/demo-wardrobe/` 和 `public/test-wardrobe/` 仅包含安全演示/测试素材。

## 质量与验收

```bash
npm run check
npm run build
npm run verify:sdd-007
```

远端业务隔离按阶段复核：

```bash
npm run verify:sdd-001
npm run verify:sdd-003
npm run verify:sdd-005
npm run verify:sdd-006
npm run verify:sdd-009
npm run verify:sdd-012
npm run verify:sdd-013
npm run verify:sdd-014
npm run verify:sdd-015
npm run verify:sdd-016
npm run verify:sdd-027
npm run verify:sdd-028
```

`verify:sdd-004` 会在配置 OpenAI Key 后执行 10 张真实识别并产生少量 API 费用，只在模型、提示词或识别代码变化后运行。当前真实结果和全部阶段证据见 `specs/*/quickstart.md` 与 `progress.md`。

## 5 分钟演示

1. 打开首页，选择登录、直接注册或体验身份进入。
2. 体验身份首次进入空衣橱时可一键加载演示衣橱；正式账号直接添加自己的衣物。
3. 在添加页选一张测试图，使用 AI 识别或手工填写后入库。
4. 在推荐页选择今天或明天与场合，生成来自当前衣橱的 3 套；两个日期分别保存。
5. 完成一次“换一件”，再收藏一件单品和一套穿搭。
6. 从今日推荐一键记入实际穿搭，或在“记录”里手工选择衣物；切换日记月份和 30/90/全部利用率范围。
7. 在“时尚灵感”查看来自 Vogue/GQ 的每日内容，标记已读并调整感兴趣主题。
8. 在设置 → 个人偏好保存常用城市、衣着偏好和 3 题问卷，再到收藏页查看反馈来源。

完整评审步骤和发布门禁见 `specs/007-release-deploy/quickstart.md`。

## 部署

当前 Production 项目为 `jialin-d583/yipai-jihe`，固定地址为 `https://yipai-jihe.vercel.app`。发布前确认项目链接、Next.js 预设和 Production 环境变量名称，再执行质量检查、生产构建与正式部署：

```bash
npx vercel link --yes --project yipai-jihe --scope jialin-d583
npm run check
npm run build
npx vercel deploy --prod --yes --scope jialin-d583
```

最新 Production 链接、部署 ID、访问状态和验收证据以 `progress.md` 为准。

## 已知限制

- 直接注册、退出和密码重新登录已通过合成账号自动验收；历史遗留的已绑定无密码账号仍需用户本人在本机设密并完成人工重登录。
- Windows 本地通过系统网络栈访问 OpenAI；识别超时仍可手工填写，推荐超过时限会自动使用规则降级。
- 当前主路径使用真实衣物自由排布、百度服务端去背和可分享穿搭卡片，不展示虚拟人物；尚不包含社交、电商或真人虚拟试穿。
- SDD-027 时尚灵感只提供 App 内入口与可关闭未读提示。来源为 Vogue/GQ 官方 RSS，24 小时访问触发更新；中文简述仅根据来源标题，不代表阅读全文；失败使用明确标记的阅读提示或空状态，不填充未经核实的新闻。
- SDD-027 两个迁移均已应用到现有 Supabase 项目；个性化沿用临时城市优先、真实天气和当前账号衣橱，主题展示记录按账号持久去重。Production 尚待用户发出部署指令。
- 常规忘记密码与第三方登录尚未实现；Production 固定域名已公开，历史 Preview 不再作为默认访问入口。

开发顺序、阶段边界和提交记录以 `progress.md` 为唯一入口；代码约定见 `AGENTS.md`。
