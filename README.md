# 衣拍即合

衣拍即合是一个移动端优先的 AI 私人衣橱 MVP：用户先登录、直接注册或明确选择体验身份，再管理真实衣物原图、用 AI 辅助识别入库、按真实天气和场合生成每日 3 套穿搭，并通过换件、收藏和 3 题偏好持续调整结果。

当前 P0 核心闭环：

```text
选择登录 / 注册 / 体验 → 演示或真实衣橱 → AI 或手工入库 → 每日三套 → 换一件 → 收藏与偏好
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
- `OPENAI_RECOMMENDATION_MODEL`：可选，推荐模型，默认 `gpt-4o-mini`。
- `SECRET_KEY`：只保留 Supabase 服务端密钥模板；当前应用流程不需要部署它，严禁浏览器读取。

`.env.local` 已被 Git 忽略。Vercel 只配置实际需要的服务端变量和两个 Supabase 公开变量。

天气位置由登录账号在“设置 → 个人偏好”保存常用城市，系统只保存城市级坐标并使用 Open-Meteo 获取当地天气；未设置时不会静默回退到其他城市。推荐页可选择今天或明天：今天使用当前天气，明天使用精确日期的真实预报；天气获取失败会停止生成，不会使用模拟天气冒充。

## 数据库与 Storage

数据库唯一事实来源是 `supabase/migrations/`，按文件名顺序应用。不要从 README 复制另一份建表 SQL，以免和迁移漂移。

主要数据：用户资料与偏好、衣物、AI 入库任务、每日推荐、单品收藏、穿搭快照收藏、偏好反馈事件。所有业务表启用 RLS 并以当前 Auth 用户隔离。

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
npm run verify:sdd-012
npm run verify:sdd-013
npm run verify:sdd-014
npm run verify:sdd-015
npm run verify:sdd-016
```

`verify:sdd-004` 会在配置 OpenAI Key 后执行 10 张真实识别并产生少量 API 费用，只在模型、提示词或识别代码变化后运行。当前真实结果和全部阶段证据见 `specs/*/quickstart.md` 与 `progress.md`。

## 5 分钟演示

1. 打开首页，选择登录、直接注册或体验身份进入。
2. 衣橱不足 20 件时，一键加载演示衣橱。
3. 在添加页选一张测试图，使用 AI 识别或手工填写后入库。
4. 在推荐页选择今天或明天与场合，生成来自当前衣橱的 3 套；两个日期分别保存。
5. 完成一次“换一件”，再收藏一件单品和一套穿搭。
6. 在设置 → 个人偏好保存常用城市、衣着偏好和 3 题问卷，再到收藏页查看反馈来源。

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
- P0 使用原图卡片，不包含自动抠图、穿搭日记、分享、社交、电商或真人虚拟试穿。
- 常规忘记密码与第三方登录尚未实现；Production 固定域名已公开，历史 Preview 不再作为默认访问入口。

开发顺序、阶段边界和提交记录以 `progress.md` 为唯一入口；代码约定见 `AGENTS.md`。
