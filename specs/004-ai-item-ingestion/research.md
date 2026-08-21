# 技术调研：原图上传与 AI 识别入库

## 决策 1：使用 OpenAI Responses API

**选择**：服务端原生 `fetch` 调用 `POST /v1/responses`，图片以 Supabase 短时 signed URL 作为 `input_image`，文本指令与图片位于同一用户消息；`text.format` 使用 `json_schema`、`strict: true`，并设置 `store: false`。

**原因**：Responses API 当前支持图片输入和结构化 JSON 输出；严格 Schema 能把类别等字段约束在现有衣橱枚举内。原生 `fetch` 已能满足单个接口需求，无需增加 SDK。

**模型**：默认 `gpt-4o-mini`，通过服务端变量 `OPENAI_VISION_MODEL` 覆盖。固定测试样本类别准确率不足 80% 时，可只改环境变量升级模型，不改变 UI、数据库或接口。

**未选方案**：

- 客户端直接调用 OpenAI：会暴露密钥，拒绝。
- 旧 Chat Completions JSON mode：结构约束较弱，拒绝。
- 多供应商抽象：P0 没有当前收益，推迟。
- 引入 OpenAI SDK：当前只调用单一端点，原生 `fetch` 更直接。

**资料**：Context7 `/websites/developers_openai_api`；OpenAI Responses API、Structured Outputs 与 image input 官方指南，读取日期 2026-08-21。

## 决策 2：浏览器直传 Supabase 私有 Storage

**选择**：服务端为 `${userId}/ingestions/${ingestionId}.${extension}` 创建 signed upload token，浏览器使用现有 Supabase 客户端直接上传。服务端不接收 10MB 图片正文。

**原因**：避免 Vercel Function 请求体和内存压力，同时保留当前 private bucket、用户首段路径和 RLS 隔离。签名仅允许特定对象路径，上传凭据短时有效。

**未选方案**：

- Multipart 上传至 Next.js 后再转存：增加服务端带宽、内存和超时风险。
- Public bucket：无法满足用户图片隐私。
- Service role 绕过 RLS：当前用户态功能无需高权限密钥。

## 决策 3：数据库记录管理 24 小时生命周期

**选择**：新增 `wardrobe_ingestions`，保存文件元数据、状态、AI 建议、耗时、错误码、修正字段和 `expires_at`。未确认项目在创建工作区、创建新项目和显式取消时由当前用户会话清理；所有读取和操作都排除过期项目。

**原因**：刷新后可恢复处理状态；失败仍可手工填写；验收日志无需额外分析平台。Storage 对象必须通过 Storage API 删除，不能直接删除 `storage.objects` 元数据。

**限制**：P0 不增加 Cron。超过 24 小时后应用接口立即拒绝访问；物理对象在该用户下一次进入工作区时清理。未来需要严格到点物理清理时再增加 Supabase Cron/Edge Function。

## 决策 4：确认入库使用数据库唯一约束保证幂等

**选择**：`wardrobe_items` 增加可空 `source_ingestion_id`，建立 `(user_id, source_ingestion_id)` 条件唯一索引。确认接口先查或插入正式单品，再更新入库项目；网络重放会返回同一单品。

**原因**：直接满足重复点击最多一条记录，不引入事务协调器。即使“正式记录已写入、状态更新失败”，重试也能恢复到 confirmed。

## 决策 5：批量为单件 API 的有限并发编排

**选择**：客户端一次最多处理 10 项，识别并发限制为 3；每项独立维护 `selected/uploading/recognizing/recognized/failed/manual/confirmed` 状态。

**原因**：单件可独立测试和重试，批量不需要新后端批处理系统；有限并发降低外部 API 限流和浏览器资源竞争。

## 决策 6：校验采用共享枚举与手写守卫

**选择**：复用 `lib/wardrobe/constants.ts` 和 `validateWardrobeItemForm` 的枚举规则，新增 JSON 数据守卫；OpenAI Schema 与服务端守卫保持同一字段集合。

**原因**：项目没有 Zod，现有手写校验足够，避免为一个结构引入新依赖。数据库约束仍是最终防线。
