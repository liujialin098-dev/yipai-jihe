# Ensemble（衣拍即合）

原创代码采用 [MIT](LICENSE)；字体、品牌及图片的许可边界见 [第三方声明](THIRD_PARTY_NOTICES.md)。安全问题请参阅 [SECURITY.md](SECURITY.md)。这是正在迭代的 Web 应用，不是已经通过 App Store 审核的 iOS 产品。

衣拍即合是一个移动端优先的 AI 私人衣橱 MVP：用户先登录、直接注册或明确选择体验身份，再管理真实衣物原图、用 AI 辅助识别入库、按真实天气和场合生成每日 3 套穿搭，并通过换件、收藏和 3 题偏好持续调整结果；实际穿过后还可记入日记并查看基础衣物利用率。

当前 P0 核心闭环：

```text
选择登录 / 注册 / 体验 → 空衣橱 → AI 或手工添加自己的衣物 → 每日三套 → 换一件 → 收藏与偏好 → 日记与利用率 → 每日时尚灵感
```

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui、lucide-react
- Supabase Auth、Postgres、Storage 与 RLS
- 百炼千问 Chat Completions（服务端每日搭配）；OpenAI Responses API 用于图片识别及资讯标题处理；自行部署需要各自的有效凭据。
- 和风天气、服务端抠图与贴纸处理；Vercel Web 部署

## 本地启动

环境要求：Node.js 22+（本地当前验证为 Node.js 24）、npm，以及可访问的 Supabase 项目。

```bash
npm install
copy .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。首次访问只显示账号入口，不会自动创建匿名会话。可以选择邮箱密码注册或体验身份；实际能否免注册邮件确认、使用匿名身份取决于你自己的 Auth 项目配置，不由克隆代码自动保证。体验身份清除站点数据或更换设备后可能无法恢复。

## 环境变量

把 `.env.example` 复制为 `.env.local` 后填写：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL，可公开。
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`：Supabase publishable key，可公开。
- `OPENAI_API_KEY`：仅服务端使用，严禁 `NEXT_PUBLIC_` 前缀或提交仓库。
- `OPENAI_VISION_MODEL`：可选，图片识别模型，默认 `gpt-4o-mini`。
- 虚拟模特效果图为历史功能，不作为当前主路径或首发承诺。
- `DASHSCOPE_API_KEY`：北京百炼工作空间的服务端密钥。
- `DASHSCOPE_API_HOST`：百炼控制台提供的北京域名，形如 `<workspace>.cn-beijing.maas.aliyuncs.com`；只填域名，不加协议或路径。
- `QWEN_RECOMMENDATION_MODEL`：每日推荐默认 `qwen3.8-max`，覆盖模型必须支持严格 JSON Schema。旧 `OPENAI_RECOMMENDATION_MODEL` 不再用于每日推荐。
- 千问请求最多 25 秒、4096 输出 token，不自动重试；错误按配置/鉴权/限流/超时/截断/搭配不合法区分。缺凭据时仅在真实天气成功后规则降级，不宣称 AI 成功。用户自行写入忽略的 `.env.local`，不得把密钥发到聊天；配置后重启开发服务。Production 需另行配置、部署和联调。
- `SECRET_KEY`：只保留 Supabase 服务端密钥模板；当前应用流程不需要部署它，严禁浏览器读取。

`.env.local` 已被 Git 忽略。Vercel 只配置实际需要的服务端变量和两个 Supabase 公开变量。

已接入和风天气：浏览器直接获取天气，服务端只签发最长 5 分钟的短 JWT；生成搭配时服务端独立读取同一供应商的真实天气，不相信浏览器传入的温度。自行部署须配置自己的和风项目，不能复用本项目生产凭据。

服务端配置：`QWEATHER_API_HOST`、`QWEATHER_DEVELOPER_ID`、`QWEATHER_PROJECT_ID`、`QWEATHER_CREDENTIAL_ID`、`QWEATHER_PRIVATE_KEY`（Ed25519 PEM，支持实际换行或转义换行）。这些变量均不能加 `NEXT_PUBLIC_`。已有本机准备文件时运行 `node scripts/configure-qweather-local.mjs`，将它们安全转入被忽略的 `.env.development.local`；脚本不会覆盖不同的已有文件，也不打印私钥。该文件仅用于 `npm run dev`，不会被 production build/start 加载；未来部署时须单独安全配置 Vercel 的五项服务端变量，不能直接拿未配置的构建发布。

天气城市由当前账号手动选择或点击定位后确认：本次城市优先、常用城市兜底，IP 只给建议；没有城市不默认武汉/北京。设备坐标只由浏览器发和风 GeoAPI，应用只接收城市名。今日显示实际气温与体感；明日精确匹配下一自然日，显示最低/最高气温，最低气温作为保守穿衣参考，不假称最低体感。快照标明获取时间，旧推荐另标生成时来源。天气请求失败或超过 5 分钟时暂停生成并允许刷新。

签发接口要求当前会话与同源 POST；每账号每分钟 12 次的进程级限频不替代分布式防滥用或平台配额。生产前须复核和风配额、域名/凭据限制以及国内手机网络。和风接口国内可达不等于整个 Vercel/Supabase 应用都已完成国内可用性验证。

## 数据库与 Storage

数据库唯一事实来源是 `supabase/migrations/`，按文件名顺序应用。不要从 README 复制另一份建表 SQL，以免和迁移漂移。

主要数据：用户资料与偏好、衣物、AI 入库任务、每日推荐、穿搭日记、单品收藏、穿搭快照收藏、偏好反馈事件，以及时尚内容的已读状态。所有业务表启用 RLS 并以当前 Auth 用户隔离。

`wardrobe-images` bucket 必须保持私有，对象路径第一段必须是当前 `auth.uid()`。`public/demo-wardrobe/` 和 `public/test-wardrobe/` 为演示/测试素材，来源确认及许可范围见 [第三方声明](THIRD_PARTY_NOTICES.md)，不代表真实用户数据。

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
2. 新体验身份和新正式账号均从空衣橱开始，直接添加自己的衣物；演示导入入口已停用，已有衣物不受影响。
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
npx vercel link
npm run check
npm run build
npx vercel deploy --prod
```

Fork 使用者须链接到自己的 Vercel 团队和项目，不要尝试部署到维护者的生产项目。维护者的项目、指令及最新 Production 证据以 `AGENTS.md` 和 `progress.md` 为准。

## 已知限制

- 正式账号改密须验证原密码；历史已绑定无密码账号不能绕过验证。邮箱数字验证码找回已有默认关闭的实现，SMTP、邮件模板、限流及真实账号联调完成前不得启用。
- Windows 本地通过系统网络栈访问 OpenAI；识别超时仍可手工填写，推荐超过时限会自动使用规则降级。
- 贴纸册、可编辑画板、描边、人工擦除和贴纸日历已逐步恢复并扩展；供应商抠图需要独立配置和实际验收，不能保证每张照片都精确去背。
- 时尚灵感来自 Vogue / GQ / Hypebeast 的公开 RSS，访问触发 3 小时缓存重验证，不是后台定时推送，也不保证每天均有合适新内容。标题处理不等于阅读全文，用户可调整八个主题。
- 自助账号注销、独立 AI 授权、完整隐私材料及真实账号验收仍未完成。不要把当前隐私现状说明当作适用于所有部署的正式协议。
- 尚无已签名的 iOS 客户端、TestFlight 或 App Store 发布；首发准备见 [上架执行清单](specs/050-release-readiness/submission-workbook.md)。Production 固定域名已公开，历史 Preview 不再作为默认访问入口。

开发顺序、阶段边界和提交记录以 `progress.md` 为唯一入口；代码约定见 `AGENTS.md`。
