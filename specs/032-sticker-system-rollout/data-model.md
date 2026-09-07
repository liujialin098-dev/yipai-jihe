# Data Model: 全局衣物贴纸统一

## 持久化实体

本阶段不新增或修改数据库实体、字段、Storage 对象或 RLS 策略。

## 现有只读输入

### WardrobeItem

- `id`: 当前账号衣物标识。
- `name`: 替代文本与缺图提示来源。
- `imageUrl`: 原图短期签名地址或公开演示图片地址，可空。
- `cutoutUrl`: 已有透明图短期签名地址，可空。

### DiaryEntryItemView

- `name`: 不可变日记快照中的衣物名称。
- `current`: 当前衣物仍存在时关联 `WardrobeItem`，否则为空。

## 派生展示状态

- `cutout`: 当前衣物有 `cutoutUrl`，显示轮廓纸贴。
- `photo`: 当前衣物只有 `imageUrl`，显示完整圆角纸卡。
- `missing`: 当前衣物不存在或两类地址都不可用，由页面保留原缺图/历史名称状态。

展示状态仅在渲染时派生，不写回数据库。
