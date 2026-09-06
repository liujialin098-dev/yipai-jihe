# SDD-027 任务：穿搭新闻与趋势推送

## Phase 1：数据与内容底座

- [x] T001 新增 Supabase 迁移，扩展内容偏好并创建 `fashion_content_reads`、RLS 与授权
- [x] T002 更新 `lib/supabase/database.types.ts` 与 `lib/auth/viewer.ts` 的类型和读取字段
- [x] T003 [P] 在 `lib/inspiration/validation.ts` 定义主题、来源、内容和偏好校验
- [x] T004 [P] 在 `lib/inspiration/catalog.ts` 建立来源白名单；未核实日期的编辑后备不展示，失败只保留有效缓存或空状态
- [x] T005 在 `lib/inspiration/rss.ts` 实现 24 小时缓存 RSS 读取、解析与白名单 URL 校验

## Phase 2：核心内容流

- [x] T006 [US1] 在 `lib/inspiration/content.ts`、`content-rules.ts`、`summary.ts` 实现穿搭过滤、来源标题中文简述、30 天主题去重和明确降级
- [x] T007 [US2] 在 `lib/inspiration/ranking.ts` 实现偏好、衣橱、近期场景和真实有效城市天气可解释排序；关闭后不使用个人信号
- [x] T008 在 `lib/inspiration/data.ts` 组合当前账号内容、偏好、阅读状态和未读数量
- [x] T009 在 `app/inspiration/actions.ts` 实现已读幂等切换和内容偏好保存

## Phase 3：移动端体验

- [x] T010 [P] 在 `components/inspiration/inspiration-card.tsx` 实现无外图的来源化时尚卡片
- [x] T011 [P] 在 `components/inspiration/inspiration-preferences.tsx` 实现主题、个性化和提示开关
- [x] T012 在 `components/inspiration/inspiration-feed.tsx` 组合内容、空状态和阅读交互
- [x] T013 在 `app/inspiration/page.tsx` 建立独立内容页及移动端布局
- [x] T014 在首页和顶部状态栏增加时尚灵感入口，在首页与内容页显示未读提示
- [x] T015 将推荐页旧趋势面板替换为统一内容流预览入口

## Phase 4：验收与交付

- [x] T016 新增 `scripts/verify-sdd-027.mjs`，覆盖来源、去重、内容边界、双账号 RLS 和设置幂等
- [x] T017 更新 `package.json`、README、`progress.md` 与 `AGENTS.md`
- [x] T018 运行 `npm run check`、`npm run build`、`npm run verify:sdd-027` 和相关回归
- [x] T019 完成 390px 浏览器验收并记录限制
- [ ] T020 提交 SDD-027 实现与文档

## 收尾补齐（2026-09-06，仍属于本阶段）

- [x] T021 [US3] 新增 `fashion_topic_impressions` 与幂等 RPC，持久记录 30 天主题首次展示；不可通过刷新覆盖首次提示时间
- [x] T022 [US3] 阅读和偏好操作增加鉴权、错误反馈、保存中状态、主题为空校验；展开详情或打开原文后保存已读
- [x] T023 [US1] 来源 URL 去追踪参数、拒绝非 HTTPS/凭据/端口/重定向/超大 XML，拒绝未来与过期条目，过滤折扣促销和旧秀场回顾
- [x] T024 [US2] 复用临时城市优先与衣着归属过滤；首页未读独立流式加载，不等待模型翻译

验收边界：本阶段为来源标题级简述，不抓取文章正文；模型失败时保留原题并明确标记阅读提示。主题语义采用有限单品/颜色/季节规则，不声称理解所有同义表达。Production、真实来源跨日失效及长期运行验证尚待发布后完成。

## 依赖顺序

T001/T021→T002→T008/T009；T003/T004/T023→T005→T006→T007/T024→T008；T008/T009/T010/T011/T022→T012→T013→T014/T015；功能完成后执行 T016～T019，T020 最后提交。
