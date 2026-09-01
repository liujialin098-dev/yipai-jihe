# Data Model: 活力视觉与专业自动去背

本阶段不新增数据库表或字段，复用 SDD-024 已建立的数据边界。

## 衣物原图

- 数据源：`public.wardrobe_items.image_path`
- 存储：私有 `wardrobe-images` bucket
- 所有权：路径第一段与 `wardrobe_items.user_id` 均必须等于当前 `auth.uid()`
- 生命周期：长期保留，专业去背和人工精修均不得覆盖

## 透明派生图

- 数据源：`public.wardrobe_items.cutout_path`
- 版本路径：`<user-id>/cutouts/<wardrobe-item-id>-<version>.png`
- 状态表达：`cutout_path is null` 表示无有效派生图；字段存在表示已成功写入并绑定
- 生命周期：可重新生成；替换失败时保留旧文件/字段；删除衣物时与原图一起清理

## 精修工作图

- 路径由当前 `cutout_path` 确定性派生：将 `/cutouts/` 替换为 `/cutout-sources/`。
- 与原图保持相同像素尺寸，用于人工恢复真实像素；浏览与分享只使用裁边后的透明派生图。
- 新版本展示图和工作图全部写入成功后才绑定；删除或替换时同步清理。

## 专业去背处理

- 不持久化独立任务表。
- 自动处理由确认 Route Handler 在响应后执行；主动重做由当前用户显式 POST 触发。
- 幂等规则：非强制请求且已有 `cutout_path` 时直接复用；强制重做允许调用，但仍写入同一固定路径。
- 失败状态通过 HTTP/界面消息表达，不修改原图和已有有效字段。

## 画布项目

- 复用 `outfit_canvases.items` JSON 中的 `wardrobeItemId`、`x`、`y`、`scale`、`rotation`、`zIndex`。
- 分类尺寸标准化仅影响 `createInitialCanvasItems` 生成的初始 `scale`。
- 保存后的历史画布不自动改写。
