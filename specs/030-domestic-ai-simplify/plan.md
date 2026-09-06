# SDD-030 实现计划

2026-09-06 ｜ 输入：[spec.md](spec.md)

## 概要

先重排导航与视觉，再退役画布/抠图，最后切换每日推荐并增加诊断。增量范围继续完善推荐个性化：把反馈账本形成的风格分数和每日可信时尚资讯转换成最小模型上下文，并对模型与规则降级统一执行动态命名。最新导航增量将首页与日记收进五项底栏，顶部只保留品牌和头像，并把收藏作为日记内分页。沿用图片识别、天气、收藏和日记数据，保留历史资产与旧路由兼容。

## 技术上下文

- TypeScript、Next.js 16.3.1 / React 19、Tailwind 4、lucide-react、Biome；现有 Supabase，不改表及权限。
- 原生 fetch 调用北京百炼 Chat Completions，默认 qwen3.8-max，严格 JSON Schema；25 秒、4096 输出 token、单次调用，无国外推荐后备。
- 测试：Node 固定响应、静态门禁、check/build、390px 浏览器。
- OFL 许可 ZCOOL KuaiLe 自托管，next/font/local，仅标题与品牌使用，正文沿用系统字体。
- 中心添加按钮至少 56px，其他触点至少 44px，无水平溢出。
- 顶部使用青柠色浮动圆角壳层且只保留品牌和头像；底部使用浅紫浮动壳层，两者目标高度约 64-72px。底部维持五项以保证 390px 触点宽度，推荐通过首页主操作进入。
- 个性化不训练独立模型：只从当前账号 `preferred_styles`、`style_scores`、场合偏好和个性化开关派生简洁权重；关闭个性化后不向模型传递反馈分数。
- 每日趋势复用 SDD-027 的可信 RSS 白名单与 24 小时服务端缓存；只传来源、日期、主题和风格标签，不传全文、外部图片或用户身份。

## 章程门禁

- [x] 核心链路与三个独立用户故事明确。
- [x] 不新增库、通用框架或数据库权限；凭据仅服务端。
- [x] 中文文档、质量门禁和外部待验收项明确。
- [x] 设计后复核无偏离；停用入口而非删除资产。

## 代码结构

- components/bottom-navigation.tsx、status-header.tsx：首页/衣橱/中央添加/资讯/日记五项 Dock，以及品牌/头像单排顶栏。
- app/diary/page.tsx、components/diary/favorites-panel.tsx、app/favorites/page.tsx：日记/收藏/利用率三栏和旧收藏地址兼容。
- app/page.tsx：首页推荐主操作，承接从底栏收起的独立推荐入口。
- app/globals.css、layout.tsx、public/fonts/：渐变、字体与紫色交互。
- components/recommendations/recommendation-card.tsx：原图搭配与反馈。
- app/profile/page.tsx、lib/profile/data.ts：资料编辑与三项统计。
- app/outfits/、app/api/wardrobe/items/[id]/cutout/、入库 confirm route：停止处理。
- lib/recommendations/qwen.ts、generator.ts、app/recommendations/actions.ts：国内模型与诊断。
- lib/recommendations/personalization-context.ts、outfit-title.ts：最小用户画像、每日趋势上下文和动态标题复验。
- lib/inspiration/content.ts、ranking.ts：复用每日可信资讯及有效期，不新增抓取器。
- scripts/verify-sdd-030.mjs：免费固定门禁。

## 取舍

一段 AI Coding 对话 M/L，凭据联调可追加短对话。generation_ms 暂保持现有 15000 上限兼容；真实模型耗时写安全日志，不新增迁移。趋势只作为风格软信号，排序优先级固定为场景/天气/衣物归属与完整性 > 用户偏好 > 当日趋势，避免追逐趋势破坏可穿性。
