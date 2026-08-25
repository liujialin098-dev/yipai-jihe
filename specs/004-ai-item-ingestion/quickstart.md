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

2026-08-23 使用 `gpt-4o-mini`、`detail: low`、`store: false` 和严格 JSON Schema 完成真实基准：

| 样本 | 预期类别 | 实际类别 | 类别修正 | 耗时 |
| --- | --- | --- | ---: | ---: |
| `cloud-white-tee.jpg` | tops | tops | 0 | 4225ms |
| `mist-blue-linen-shirt.jpg` | tops | tops | 0 | 2683ms |
| `indigo-straight-jeans.jpg` | bottoms | bottoms | 0 | 5317ms |
| `sand-wide-trousers.jpg` | bottoms | bottoms | 0 | 3149ms |
| `black-evening-dress.jpg` | dresses | dresses | 0 | 5107ms |
| `oat-knit-cardigan.jpg` | outerwear | outerwear | 0 | 3271ms |
| `navy-trench-coat.jpg` | outerwear | outerwear | 0 | 2322ms |
| `clean-white-sneakers.jpg` | shoes | shoes | 0 | 2560ms |
| `chestnut-boots.jpg` | shoes | shoes | 0 | 3123ms |
| `black-work-tote.jpg` | accessories | accessories | 0 | 3283ms |

- 类别准确率：10/10（100%），通过 8/10 验收线。
- 平均耗时：3504ms；最慢 5317ms，全部低于 10 秒目标。
- Preview 批量验收：10 个不同入库项目均识别成功并确认入库，确认接口全部返回 200。
- 当前网络对 Node.js 直连 OpenAI 存在异常 DNS/连接阻断，因此 `npm run verify:sdd-004` 的非 AI 验证与真实 AI 基准分别执行；真实 AI 同时通过 PowerShell 直连和 Vercel Preview 完成，不使用模拟结果。

### 2026-08-25 Windows 本地回归

- 复现结果：Supabase 上传正常，Node.js 标准 `fetch` 到 OpenAI 超时；同机 Windows 网络栈立即获得 OpenAI 响应，排除密钥、额度和请求 Schema 问题。
- 修复方式：`lib/openai/responses.ts` 在 Windows 服务端使用 PowerShell 系统网络栈，JSON 请求体经 Base64 无损传递；非 Windows 和 Vercel 继续使用标准 `fetch`。
- 安全边界：API Key 只通过子进程环境传递，不写入命令参数、标准输出、浏览器或仓库。
- 真实验收：当前添加页原有 10 张图片全部从失败状态重试为“等待核对”，服务端 10/10 返回 200，单张约 6.4～11.6 秒。
