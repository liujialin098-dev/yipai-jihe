# Data Model: 贴纸日记工作台

## StickerCrop

```ts
type StickerCrop = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
```

- 每个值范围 `0..0.4`。
- `top + bottom <= 0.72`。
- `left + right <= 0.72`。
- 默认四边均为 `0`。

## StickerCanvasItem

沿用原字段并新增 `crop`：

```ts
type StickerCanvasItem = {
  wardrobeItemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  crop: StickerCrop;
};
```

`zIndex` 在每次置顶/置底后按可见顺序重新编号为连续正整数。

## Local draft migration

- 新草稿版本：`version: 2`。
- 读取 `version: 1` 时自动补齐零裁切，不丢失位置、大小、旋转或层级。
- 无效裁切值在读取和保存前统一约束。

## Derived diary views

本阶段不新增数据库表或列：

- 月历格来自现有 `outfit_diary_entries`。
- 收藏仍来自现有单品/整套收藏。
- 最近 30 天贴纸墙由日记记录和当前可见衣物即时聚合。
