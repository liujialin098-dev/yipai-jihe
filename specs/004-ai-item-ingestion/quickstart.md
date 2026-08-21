# 快速验收：SDD-004

## 1. 环境准备

在 `.env.local` 中保留现有 Supabase 变量，并由开发者本地填写：

```text
OPENAI_API_KEY=从 OpenAI 平台创建的服务端密钥
OPENAI_VISION_MODEL=gpt-4o-mini
```

`OPENAI_VISION_MODEL` 可省略；`OPENAI_API_KEY` 不得使用 `NEXT_PUBLIC_` 前缀、不得提交。

## 2. 应用数据库迁移

把本阶段 migration 应用到已配置的 Supabase 项目，确认：

- `wardrobe_ingestions` 已创建并开启 RLS。
- `anon` 无表权限，`authenticated` 仅有必要 CRUD。
- `wardrobe_items.source_ingestion_id` 和幂等唯一索引存在。
- `wardrobe-images` 仍为 private，用户路径隔离策略有效。

## 3. 质量命令

```powershell
npm run check
npm run build
npm run verify:sdd-004
```

## 4. 单件验收

1. 以 390px 宽度打开 `/wardrobe/new`。
2. 选择一张 jpg/png，确认预览与文件校验。
3. 观察上传中、识别中和可编辑结果。
4. 修改至少一个字段并确认。
5. 确认只新增一件衣物，详情展示原图与修改后的字段。
6. 连续确认 3 次，确认仍只有一条正式记录。
7. 临时移除 `OPENAI_API_KEY`，确认仍可手工填写并入库。

## 5. 批量验收

1. 一次选择 `public/test-wardrobe/` 中的 10 张固定安全样本，期望值见 `test-samples.json`。
2. 确认每项状态独立，单个失败不清空其他结果。
3. 修正至少一项并批量确认。
4. 确认成功、失败、待处理数量汇总正确。
5. 选择第 11 张时得到上限提示。

## 6. 隔离与生命周期验收

1. 使用两组匿名会话分别创建入库项目。
2. 验证跨用户读取、识别、确认、取消和 Storage 访问全部失败。
3. 取消项目后确认临时对象和记录被删除。
4. 把测试项目 `expires_at` 调整为过去，确认 API 返回 expired；再次进入工作区后确认对象和记录被清理。

## 7. 固定样本记录

对 10 张非敏感测试图片记录：模型、耗时、类别是否正确、修正字段数量。至少 8 张类别无需修正才能通过 SC-002；不达标时优先调整提示词，再通过 `OPENAI_VISION_MODEL` 升级模型复测。
