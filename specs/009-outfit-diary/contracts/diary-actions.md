# Contract: 穿搭日记 Server Actions

## 统一返回值

```ts
type DiaryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};
```

所有 Action 都重新调用 `auth.getUser()`，不接受客户端 `user_id`，返回值不包含原始数据库行。

## `saveRecommendationToDiary(previousState, formData)`

### 输入

- `recommendationId`: UUID
- `slot`: `1 | 2 | 3`

### 服务端规则

1. 读取当前用户推荐的日期、场合、套装和更新时间。
2. 拒绝未来日期、无效套装或已变化推荐。
3. 只从当前用户衣橱重建快照。
4. 以推荐日期 upsert，同日已有记录时替换。

### 成功

`{ status: "success", message: "已记为今日穿搭。" }`

## `saveManualDiaryEntry(previousState, formData)`

### 输入

- `wornOn`: `YYYY-MM-DD`
- `title`: 1～40 字符
- `occasion`: 五个现有场合之一
- `itemIds`: 同名多值，1～8 个 UUID
- `note`: 0～160 字符

### 服务端规则

1. 日期不得晚于账号城市时区下的今天。
2. 去重后数量必须与提交数量相同。
3. 重新查询所有 ID，要求均为当前用户、`active` 且符合当前衣着偏好。
4. 写入来源为 `manual`，清除推荐来源字段，同日 upsert。

## `deleteDiaryEntry(previousState, formData)`

### 输入

- `entryId`: UUID

### 服务端规则

- 只删除 `id = entryId AND user_id = currentUser.id` 的行。
- 删除成功后刷新 `/diary` 和 `/diary/new`，不触碰衣物和推荐。

## 错误文案原则

- 会话失效：提示重新进入应用。
- 非法或越权衣物：提示“所选衣物已变化，请重新选择”。
- 未来日期：提示“穿过以后再记录，明日计划暂不计入利用率”。
- 数据库暂时失败：保留当前表单并提示稍后重试，不暴露 SQL 或内部错误。
