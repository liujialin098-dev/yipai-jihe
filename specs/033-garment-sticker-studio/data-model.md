# Data Model: 衣物贴纸册

## Existing persistent data

本阶段不新增表和迁移。

- `wardrobe_items.id`：贴纸生成请求的唯一客户端输入。
- `wardrobe_items.user_id`：由服务端当前会话校验，客户端不得提交。
- `wardrobe_items.image_path`：当前用户私有原图，仅服务端读取。
- `wardrobe_items.cutout_path`：成功生成后的私有透明图路径。
- `wardrobe_item_favorites.wardrobe_item_id`：构成“我的喜欢”来源。

## Client-only daily selection

键：`ensemble:sticker-studio:<YYYY-MM-DD>`

值：当前设备当天选中的 1～8 个衣物 UUID 数组。

恢复规则：仅保留仍出现在服务端当前可见活跃衣橱中的 ID；不得把本地值视为授权或服务端事实。

## Transient processing state

- `idle`：未处理或等待重试。
- `processing`：当前请求处理中。
- `done`：已生成或复用透明图。
- `error`：本次失败，仍保留原图。

处理状态只存在于当前页面内，不写入新的持久化结构。
