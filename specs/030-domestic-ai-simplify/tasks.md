# SDD-030 TODO

## 准备与底座

- [x] T001 阅读 progress.md、章程与现有实现，完成 specs/030-domestic-ai-simplify/spec.md。
- [x] T002 完成 plan.md、research.md、data-model.md、contracts/api.md 与 quickstart.md。
- [x] T003 在 scripts/verify-sdd-030.mjs 写独立固定测试并确认旧实现未满足新入口契约。

## US1 导航与视觉

- [x] T004 [US1] 改 components/bottom-navigation.tsx 与 components/status-header.tsx，中心添加最突出。
- [x] T005 [P] [US1] 在 public/fonts/ 保存授权字体，在 app/layout.tsx / app/globals.css 接入标题、渐变与紫色反馈。
- [x] T006 [US1] 390px 检查导航、标题、hover/active、减少动态和横向溢出。

## US2 停用卡片和抠图

- [x] T007 [US2] 精简 components/recommendations/recommendation-card.tsx、app/profile/page.tsx、lib/profile/data.ts。
- [x] T008 [P] [US2] 停用 app/outfits/ 保存与页面、app/api/wardrobe/items/[id]/cutout/ 接口，移除 confirm 自动处理。
- [x] T009 [US2] 验证旧路由 410/跳转、无自动抠图调用、无历史资产删除。

## US3 国内搭配 AI

- [x] T010 [US3] 新建 lib/recommendations/qwen.ts 及固定成功/失败测试。
- [x] T011 [US3] generator.ts 接入千问，actions.ts 受控日志和失败提示，沿用全部搭配复验。
- [x] T012 [US3] 更新 .env.example、README.md 服务端配置说明，不写凭据。
- [ ] T013 [US3] 用户配置北京百炼 Key/Host 后，真实隔离衣橱联调三套合法 AI 结果。

## 交付

- [x] T014 运行 npm run check、npm run build、verify:sdd-030 及适用回归，按 quickstart.md 浏览器验收。
- [x] T015 更新 progress.md、AGENTS.md 和本任务清单，保存提交；明确待凭据联调和未部署。
- [x] T016 [US1] 按最新反馈将背景校正为浅雾丁香，隔离底部 Dock 与通用按钮填充规则，并在 390px 复验普通项、中央按钮、溢出和浏览器错误。
- [x] T017 [US1] 清除全局一刀切紫色填充，按中性/彩色/危险/大面积四类保留交互语义，并在 390px 复验青柠卡、黑色按钮、白色整行入口、统计区及浏览器错误。
- [x] T018 [US1] 确定英文名 Ensemble，接入自托管双语字标与 Metadata，并在首次入口、登录后 Header 和 390px 浏览器验证字体加载及无重叠。
- [x] T019 [US1] 按反馈移除偏细 Cormorant Garamond，替换为 Fredoka Variable 圆润粗体，收紧字号与字距并复验 640 字重、390px 间距和浏览器错误。
- [x] T020 [P] [US4] 在 scripts/verify-sdd-030.mjs 增加动态标题、画像开关、可信趋势有效期与最小上下文固定测试，并确认旧实现未满足。
- [x] T021 [US4] 新建 lib/recommendations/outfit-title.ts，统一三套标题的风格语义、模板词拒绝、唯一性和规则降级命名。
- [x] T022 [US4] 新建 lib/recommendations/personalization-context.ts，规范化 style_scores，按个性化开关派生最多 5 个学习信号，并从 SDD-027 每日可信内容派生最多 4 条有效趋势。
- [x] T023 [US4] 修改 app/recommendations/actions.ts 与 lib/recommendations/generator.ts，把当前账号最小偏好画像和当日趋势传给千问，并保持场景、天气、库存与业务复验优先。
- [x] T024 [US1] 修改 components/status-header.tsx 与 app/globals.css，将顶部品牌与三项导航收进青柠悬浮壳层，复验 320px/390px 的滚动可达、焦点、无覆盖和减少透明度降级。
- [x] T025 [US4] 运行 npm run check、npm run build、verify:sdd-030 及推荐/资讯回归，更新 quickstart.md、progress.md、AGENTS.md 和本清单后提交；真实千问联调仍以 T013 独立追踪。
- [x] T026 [US1] 更新导航固定门禁：首页与日记进入五项底栏，顶部文字导航归零，头像保留个人主页语义，底栏使用独立浅紫材质。
- [x] T027 [US1] 修改顶部/底部导航与首页，在保持中央添加最突出的前提下，以首页主操作承接推荐入口，并将上下栏实际高度控制在 8px 差值内。
- [x] T028 [US1] 把收藏内容抽为日记内服务端分页，日记形成“日记/收藏/利用率”三栏；旧 `/favorites` 重定向且不改数据与 RLS。
- [x] T029 [US1] 运行 check/build、007/009/015/029/030 回归和 390px 浏览器验收；更新 SDD、progress.md 与 AGENTS.md，明确本增量尚未部署。
- [x] T030 [US1] 将穿搭日记从底栏移动为顶部左侧圆形入口，保持品牌居中、头像位于右侧并保留收藏/利用率分页。
- [x] T031 [US1] 底部第五项恢复推荐穿搭，中央添加衣物改为四角切面的倒角矩形，保留五等分触控区和浅紫材质。
- [x] T032 [US1] 运行 check/build、007/009/015/029/030 回归和 390px 浏览器验收；更新进度与提交记录，明确是否部署。
- [x] T033 [US1] 将底部五项可见文字统一为首页、衣橱、添加、推荐、资讯两个汉字，不改变路径、图标、选中态或功能。
- [x] T034 [US1] 将 `275ef04` 部署到 Production，检查固定域名核心七路由、390px 双字导航和最近 30 分钟错误日志，并更新交付记录。

## 依赖与独立验收

T001 → T002 → T003；US1/US2/US3 可独立推进，T007 与 T008、T004 与 T005 可并行。增量任务中 T020 可先行，T021 与 T022 可并行，T023 依赖两者，T024 可与推荐链路并行，T025 依赖 T020～T024；导航收敛依次执行 T026 → T027/T028 → T029。每个故事按 spec.md 的独立路径验证。T013 依赖外部凭据，不能勾选替代为模拟结果。先交付本地功能，真实模型与发布各自记录，不擅自扩大范围。
