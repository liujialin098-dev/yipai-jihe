# Data Model: 贴纸画板与月历

## Existing persistent data

本阶段不新增数据库表或迁移。

- `wardrobe_items`：提供当前账号活跃衣物、原图和透明贴纸签名地址。
- `wardrobe_item_favorites`：用于识别当天日记中的优先代表单品。
- `outfit_diary_entries.worn_on`：月历日期事实。
- `outfit_diary_entries.item_ids`：当天真实穿着衣物顺序与件数。

## Client-only canvas state

键：`ensemble:sticker-canvas:<账号短标识>:<YYYY-MM-DD>`。

值：1～8 个对象，每个对象只包含 `wardrobeItemId`、`x`、`y`、`scale`、`rotation` 和 `zIndex`。

恢复规则：

1. 必须是合法有限数字且在界面允许范围内。
2. ID 必须仍在服务端返回的当前可见衣物中。
3. 当前选择新增衣物时补充默认位置，移除时同步删除布局。
4. 本地值不参与服务端授权。

## Derived monthly calendar

每个日记日期派生：

- `day`：`worn_on`。
- `itemCount`：当天不重复衣物数。
- `representativeItemId`：当天衣物中第一件已收藏单品；若无则取第一件。

月度摘要派生：记录日数、不同代表单品数、代表单品出现次数及最高频单品。所有值请求时计算，不持久化。
