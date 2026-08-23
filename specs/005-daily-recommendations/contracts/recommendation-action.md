# Server Action Contract: 生成每日推荐

## `generateDailyRecommendations(previousState, formData)`

### 输入

- `occasion`: `commute | casual | date | formal`
- `weatherPreset`: `live | mild | hot | cold | rainy`

客户端只提交用户选择。用户 ID、衣物、偏好、日期与天气实际值都由服务端重新读取。

### 成功

```json
{
  "status": "success",
  "message": "今日 3 套穿搭已更新。",
  "source": "ai"
}
```

- 当天批次已原子 upsert。
- Action 调用 `revalidatePath('/recommendations')`，当前页面在同一往返中显示新结果。
- `source` 可能为 `ai` 或 `rules`；规则结果的消息必须说明已使用稳定搭配规则。

### 输入不足

```json
{
  "status": "error",
  "message": "还缺少能组成 3 套完整穿搭的衣物，请先补充上装、下装或鞋。"
}
```

- 不写入残缺批次。
- 不调用天气或 AI。

### 会话失效

```json
{
  "status": "error",
  "message": "当前体验会话已失效，请刷新后重试。"
}
```

### 安全约束

- Action 内必须重新调用认证能力获得当前用户，不能相信隐藏字段或客户端传来的用户 ID。
- 查询和 upsert 必须同时包含当前 `user_id`；数据库 RLS 是第二层保护。
- 返回值不包含完整数据库行、邮箱、访问令牌、模型原始响应或服务端错误详情。
