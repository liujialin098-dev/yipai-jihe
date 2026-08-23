# Quickstart: P0 受控评审版

## 发布前自动检查

```bash
npm run check
npm run build
npm run verify:sdd-007
npm run verify:sdd-001
npm run verify:sdd-003
npm run verify:sdd-005
npm run verify:sdd-006
```

SDD-004 的 10 张真实 AI 识别只在模型、提示词或识别代码变化后重跑；当前证据见 `specs/004-ai-item-ingestion/quickstart.md`。

## 5 分钟评审路径

1. 打开首页，确认匿名体验会话建立且底部导航可用。
2. 进入衣橱；若不足 20 件，执行“一键加载演示衣橱”。
3. 打开“添加”，选一张安全测试图片；AI 可用时识别，不可用时手工补齐并入库。
4. 进入推荐，选择场合并生成今日三套；确认所有图片来自当前衣橱。
5. 展开一个有候选的“换一件”并替换；若当前批次无候选，切换通勤或其他天气重新生成。
6. 收藏一件单品和一套穿搭，进入收藏页确认两个分区。
7. 进入设置 → 个人偏好，保存 3 题并查看问卷、收藏和换件来源。

## 暂缓且不阻塞

- 邮箱账号的密码设置、退出和重新登录：与用户一起集中调试。
- Vercel Production、正式域名和公开访问策略：必须由用户明确决定。
- 自动抠图、穿搭日记、分享和虚拟试穿：属于后续 SDD。

## 2026-08-24 完成证据

- 质量门禁：`npm run check`、`npm run build`、`npm run verify:sdd-007` 全部通过；静态审计确认 7 个核心页面、24 张演示图片、10 张识别样本、7 个迁移和客户端密钥边界。
- 远端隔离：SDD-001 会话 `2DD9AE2E`/`36C90691`，SDD-003 `168A330A`/`444CD30A`，SDD-005 `F98C45F8`/`DD9B41DF`，SDD-006 `B1E89EFA`/`1A933482` 全部通过并清理测试数据。
- 390px：`/`、`/wardrobe`、`/wardrobe/new`、`/recommendations`、`/favorites`、`/settings`、`/settings/preferences` 的 `scrollWidth` 均等于视口内容宽度；共检查 47 张页面图片，无损坏图片、无运行时错误文本。
- 核心交互沿用本轮同会话证据：25 件衣橱、3 套通勤推荐、合法换件持久化、1 套与 2 件收藏、3 题偏好来源均通过。
- Supabase：7 个远端迁移均存在；无缺失 RLS 和未索引外键。Security Advisor 仅保留当前匿名体验的所有权策略提醒及待 SDD-002 处理的泄露密码保护提醒；Performance Advisor 仅报告新/低流量索引尚未命中。
- AI：SDD-004 相同项目与模型的 10 张真实识别为 10/10，平均 3504ms；本轮不重复付费调用。当前本机 Node.js 连接 OpenAI 偶发超时，入库手工降级与推荐规则降级均可完成核心演示，线上真实推荐留到与密码一起集中调试。
- Preview：`https://ai-coding-84l2zuiur-jialin-d583.vercel.app`，部署 `dpl_AKheXxJmJbQNPVF1bzybPPbLnp5Z`，状态 READY，受 Vercel Authentication 保护，未发布 Production。
