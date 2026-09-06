# SDD-030 实现计划

2026-09-06 ｜ 输入：[spec.md](spec.md)

## 概要

先重排导航与视觉，再退役画布/抠图，最后切换每日推荐并增加诊断。沿用图片识别、天气、收藏和日记，保留历史资产。

## 技术上下文

- TypeScript、Next.js 16.3.1 / React 19、Tailwind 4、lucide-react、Biome；现有 Supabase，不改表及权限。
- 原生 fetch 调用北京百炼 Chat Completions，默认 qwen3.8-max，严格 JSON Schema；25 秒、4096 输出 token、单次调用，无国外推荐后备。
- 测试：Node 固定响应、静态门禁、check/build、390px 浏览器。
- OFL 许可 ZCOOL KuaiLe 自托管，next/font/local，仅标题与品牌使用，正文沿用系统字体。
- 中心添加按钮至少 56px，其他触点至少 44px，无水平溢出。

## 章程门禁

- [x] 核心链路与三个独立用户故事明确。
- [x] 不新增库、通用框架或数据库权限；凭据仅服务端。
- [x] 中文文档、质量门禁和外部待验收项明确。
- [x] 设计后复核无偏离；停用入口而非删除资产。

## 代码结构

- components/bottom-navigation.tsx、status-header.tsx：五项 Dock 和双排顶栏。
- app/globals.css、layout.tsx、public/fonts/：渐变、字体与紫色交互。
- components/recommendations/recommendation-card.tsx：原图搭配与反馈。
- app/profile/page.tsx、lib/profile/data.ts：资料编辑与三项统计。
- app/outfits/、app/api/wardrobe/items/[id]/cutout/、入库 confirm route：停止处理。
- lib/recommendations/qwen.ts、generator.ts、app/recommendations/actions.ts：国内模型与诊断。
- scripts/verify-sdd-030.mjs：免费固定门禁。

## 取舍

一段 AI Coding 对话 M/L，凭据联调可追加短对话。generation_ms 暂保持现有 15000 上限兼容；真实模型耗时写安全日志，不新增迁移。
