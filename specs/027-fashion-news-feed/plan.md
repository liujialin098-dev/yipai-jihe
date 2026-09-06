# 实施计划：穿搭新闻与趋势推送

**阶段**：SDD-027 | **日期**：2026-09-03 | **规格**：[spec.md](spec.md)

## Summary

新增 App 内“时尚灵感”内容页。服务端只读取 Vogue、GQ 官方 RSS 白名单，按 24 小时缓存更新，过滤非穿搭内容并保留原始标题、发布日期和链接；页面只展示衣拍即合重新撰写的短中文摘要，不复制图片或全文。内容根据当前账号衣着归属、风格偏好、真实城市天气和活跃衣橱排序；用户可管理主题、关闭个性化和未读提示，阅读状态通过 Supabase RLS 隔离。

## Technical Context

**Language/Version**: TypeScript 5、React 19.2.8、Next.js 16.3.1  
**Primary Dependencies**: Next.js App Router、Supabase SSR/JS、lucide-react、现有 OpenAI Responses 传输  
**Storage**: Supabase PostgreSQL；不保存外站正文，仅存偏好、阅读状态和账号主题首次展示记录  
**Testing**: Biome、TypeScript、Next build、`scripts/verify-sdd-027.mjs`、390px 浏览器验收  
**Target Platform**: Vercel Node.js Functions、移动优先 Web/PWA  
**Project Type**: 单体 Next.js Web 应用  
**Performance Goals**: 首页通过 Suspense 隔离新闻入口，摘要生成不得阻塞衣橱主体；RSS 单来源 5 秒、首次标题转写 12 秒上限，命中缓存复用结果。实际耗时受数据库和网络影响，不宣称已验证 1 秒 SLA。  
**Constraints**: 不复制外图/全文；不编造来源与日期；无 Cron、无系统通知、无新增客户端密钥；真实天气失败只取消天气加权  
**Scale/Scope**: 首版 2 个白名单来源、6 类主题、每次最多展示 12 条、每账号独立偏好和阅读状态

## Constitution Check

- **MVP 结果优先**：只做内容浏览、可信来源、个性化排序、已读和偏好闭环。
- **核心路径正确**：入口 → 内容流 → 阅读/外链 → 未读减少 → 偏好生效可独立验收。
- **直接而简洁**：复用官方 RSS、现有天气/画像和 Supabase；不引入 CMS、队列、Cron 或 XML 依赖。
- **静态质量门禁**：必须通过 `npm run check`、`npm run build` 与独立验证脚本。
- **约束内交付**：中文文档、Server Component 默认、敏感配置只在服务端。

阶段后复核：两张当前账号所有权表、少量偏好列与一个 security invoker 幂等 RPC 属于阅读和 30 天去重闭环所需；没有新增依赖、服务角色密钥或定时任务。

## Project Structure

```text
app/inspiration/
├── page.tsx
└── actions.ts
components/inspiration/
├── inspiration-card.tsx
├── inspiration-feed.tsx
└── inspiration-preferences.tsx
lib/inspiration/
├── catalog.ts
├── content.ts
├── ranking.ts
├── rss.ts
└── validation.ts
supabase/migrations/*_fashion_news_feed.sql
scripts/verify-sdd-027.mjs
specs/027-fashion-news-feed/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

**Structure Decision**: 延续现有 App Router 单体结构；内容获取、校验与排序放在 `lib/inspiration`，浏览器交互限制在偏好表单与已读按钮。

收尾文件：`content-rules.ts` 为可直接测试的纯规则；`summary.ts` 为仅服务端的标题转写缓存；`content-details.tsx`、`reading-controls.tsx`、`impression-tracker.tsx` 负责明确交互，`unread-badge.tsx` 负责首页独立加载。追加迁移 `20260906090000_fashion_topic_impressions.sql` 保存跨请求主题记录。

缓存沿用当前未开启 Cache Components 的配置，使用 Next.js `unstable_cache`，只缓存公开来源数据和标题转写；cookies、有效位置与个人排序必须在缓存外获取。Next.js 16 已推荐新 `use cache` API，整体缓存模式迁移不混入本阶段。

## Complexity Tracking

无章程偏离。
