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
- [x] T018 [US1] 确定英文名 Ensemble，接入自托管 Cormorant Garamond 双语字标与 Metadata，并在首次入口、登录后 Header 和 390px 浏览器验证字体加载及无重叠。

## 依赖与独立验收

T001 → T002 → T003；US1/US2/US3 可独立推进，T007 与 T008、T004 与 T005 可并行。每个故事按 spec.md 的独立路径验证。T014 依赖实现任务；T013 依赖外部凭据，不能勾选替代为模拟结果。先交付本地功能，真实模型与发布各自记录，不擅自扩大范围。
