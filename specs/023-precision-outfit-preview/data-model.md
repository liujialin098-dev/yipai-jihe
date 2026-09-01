# 数据模型：精准搭配预览

本阶段不新增数据库实体、迁移或持久化字段。

## 复用数据

- `RecommendationOutfitView.itemIds`：当前套装的衣物顺序。
- `WardrobeItem.imageUrl`：当前用户可访问的签名图片地址。
- `deriveOutfitLayers(itemIds, items)`：稳定推导角色和显示顺序。
- `/virtual-models/neutral-studio.png`：固定无身份比例参照素材。

## 数据边界

- 组件只渲染服务端已完成归属校验的衣物图片地址。
- 组件不保存图片、不上传文件、不修改推荐 JSON。
- 图片缺失时使用名称占位，不生成替代图片。

