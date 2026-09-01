# Research: 活力视觉与专业自动去背

## Decision 1：采用 PhotoRoom Remove Background Basic API

- **Decision**: 服务端调用 `POST https://sdk.photoroom.com/v1/segment`，以 multipart `image_file` 上传当前用户原图，设置 `format=png`、`channels=rgba`、`size=hd`、`crop=false` 与 `despill=true`。同尺寸结果作为私有精修工作图，再用 Sharp 对透明边进行自动裁边，生成展示图。
- **Rationale**: 官方 Basic API 能输出透明 PNG、自动移除透明边并处理背景色溢出，适合真实衣物卡片；用户已选择方案 A 并同意第三方处理和按次成本。
- **Alternatives considered**: 继续仅用本地边缘连通算法无法覆盖复杂背景；生成式重绘会改变真实衣物；新增 AGPL 浏览器模型会改变许可与下载体积。
- **Documentation**: Context7 `/websites/photoroom`，PhotoRoom Remove Background Basic 官方文档，2026-09-01 复核。

## Decision 2：确认响应后异步处理

- **Decision**: 衣物数据库写入和 ingestion 状态确认完成后，通过 Next.js `after()` 启动专业去背；用户立即得到入库成功响应。
- **Rationale**: 项目内 Next.js 16.3.1 文档说明 `after()` 可用于 Route Handler，并由 Vercel `waitUntil` 延长函数生命周期，适合不阻塞响应的副作用。
- **Alternatives considered**: 在确认请求内同步等待会显著延迟 10 件批量入库；仅由浏览器 fire-and-forget 会在用户关闭页面时丢失任务。

## Decision 3：结果验证后原子式绑定

- **Decision**: 下载当前账号私有原图，限制输入大小与 MIME；PhotoRoom 结果必须是受限大小的 PNG 图片。每次成功处理生成带版本号的私有展示图和同版本工作图，二者均写入成功后再更新 `wardrobe_items.cutout_path`，随后清理旧版本。
- **Rationale**: 复用现有路径与 RLS，避免生成多份派生文件；失败时旧透明图或原图保持可用。
- **Alternatives considered**: 先清空旧路径会造成失败窗口；使用公共 bucket 会破坏隐私边界。

## Decision 4：分类标准化只改变初始布局

- **Decision**: 新画布建立时按类别乘以初始缩放系数：外套/连衣裙最大，上下装居中，鞋较小，配饰最小；旧画布保存数据不迁移。
- **Rationale**: 用户需要卡片开箱即用，但仍要求自由缩放和旋转。只调整初始 scale 不会改变真实图片，也不影响历史作品。
- **Alternatives considered**: 将图片统一填充到固定像素画布会重新制造透明空边；强制吸附模板与自由排布冲突。

## Decision 5：人工擦除/恢复使用原生 Canvas

- **Decision**: 精修器同时加载原图和当前透明图；擦除画笔降低 alpha，恢复画笔从原图恢复 RGB 与 alpha。提供三档画笔、重置、取消和保存。
- **Rationale**: 不新增依赖，恢复操作有真实像素来源；只有保存成功才更新编辑器中的透明图 URL。
- **Alternatives considered**: 只提供橡皮擦无法恢复误删；保存每一笔会造成网络和存储压力。

## Decision 6：色彩学习 Whering 的活力，不复制界面

- **Decision**: 以丁香紫作为页面舞台，青柠作为主要功能高光，珊瑚和天空蓝作为状态/装饰色，内容保持冷白卡片和近黑文字。
- **Rationale**: 与现有正式 Logo 和彩色主题兼容，能明显去除灰色工具感，同时保留中文产品的信息架构和可读性。
- **Alternatives considered**: 复刻 Whering 的商标、文案和具体卡片结构会造成品牌混淆；全屏高饱和色会压过衣物内容。
