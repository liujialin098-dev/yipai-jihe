# Contract: P0 受控发布门禁

发布证据必须同时满足：

1. `npm run check`、`npm run build`、`npm run verify:sdd-007` 返回 0。
2. SDD-001、003、005、006 最近一次远端隔离验证通过并记录短会话 ID。
3. 390px 的首页、衣橱、添加、推荐、收藏、设置、偏好页无水平溢出和错误覆盖层。
4. `.env.example` 只含模板；仅 Supabase URL 与 publishable key 使用 `NEXT_PUBLIC_`。
5. `supabase/migrations/` 包含所有已上线表和索引，远端顾问无未索引外键或缺失 RLS 错误。
6. Vercel Preview 状态为 READY，链接、部署 ID和保护状态写入 quickstart 与 progress。
7. 密码设置、退出/重登录、正式域名、自动抠图和穿搭日记明确不计入本门禁。

任何一项失败时，SDD-007 保持“进行中”，不得把 Preview 称为最终评审版。
