# Phase 1 操作契约：衣橱核心

本阶段没有对第三方公开的 HTTP API。页面通过 Next.js Server Action 调用以下服务端操作；所有输入均视为不可信，所有操作都从当前 cookie 会话重新获取用户 ID。

## 通用返回

```ts
type ActionState = {
  status: "idle" | "success" | "error"
  message: string
  fieldErrors?: Record<string, string[]>
}
```

- 不返回原始数据库错误、用户 ID、Storage 内部路径或其他用户是否拥有资源。
- 目标不存在或不属于当前用户时统一返回“未找到该衣物”。
- 成功变更后刷新 `/`、`/wardrobe` 和对应详情路径。

## `loadDemoWardrobe`

- **输入**：无业务字段。
- **前置条件**：当前请求具有有效匿名或已认证会话。
- **行为**：读取已有 `demo_key`，只为缺失项生成并上传私有 SVG，再插入缺失记录。
- **并发规则**：`(user_id, demo_key)` 唯一约束作为最终幂等保证；重复操作保持最多 24 条演示记录。
- **成功**：返回当前演示总数和本次补齐数量。
- **部分失败**：保留已成功项，返回可重试提示；再次调用只补齐缺失项。

## `updateWardrobeItem`

- **输入**：`itemId` 及名称、类别、主色、材质、风格、季节、场合。
- **校验**：名称去除首尾空格后 1～60 字；其他字段均为已定义白名单；季节和场合至少一项。
- **权限**：目标必须满足 `id = itemId AND user_id = currentUserId`。
- **成功**：更新属性和 `updated_at`，刷新页面并跳转详情。
- **失败**：保留用户可修正的字段错误，不修改原图、状态、归属或演示标识。

## `archiveWardrobeItem`

- **输入**：`itemId`。
- **行为**：仅把当前用户目标记录从 `active` 更新为 `archived`。
- **幂等**：目标已经归档时仍视为目标状态已满足。

## `restoreWardrobeItem`

- **输入**：`itemId`。
- **行为**：仅把当前用户目标记录从 `archived` 更新为 `active`。
- **幂等**：目标已经正常时仍视为目标状态已满足。

## `deleteWardrobeItem`

- **输入**：`itemId`，UI 必须先获得明确确认。
- **行为**：重新读取当前用户记录；先删除其独占 `image_path`，再删除数据库行。
- **安全**：不得接受客户端传入的 `image_path` 或 `user_id`。
- **成功**：详情不可再访问，默认和归档列表均不存在该项目，签名 URL 到期后无法再读取图片。
- **失败**：明确提示删除未完全完成并允许重试，不返回底层路径。

## 衣橱查询参数

```text
/wardrobe?q=<name>&category=<category>&color=<color>
          &season=<season>&occasion=<occasion>&status=active|archived
```

- 未知参数值被忽略并回落到默认值，不直接拼接 SQL。
- 默认 `status=active`。
- 各非空维度之间使用 AND；季节和场合表示数组包含所选值。
- `q` 去除首尾空格并限制为 60 字符。
