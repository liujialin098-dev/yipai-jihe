# 外观状态合同

- 不新增或变更数据库表、Storage对象、API、身份及RLS。
- `ensemble-sticker-outline-v1`：浏览器设备级localStorage字符串；只允许white/lilac/lime/coral/sky/ink，未知或无权限回退white。仅保存色名，不保存衣物、图片URL、账号数据。
- `GarmentSticker`：现有cutoutUrl不变，客户端只派生短生命周期轮廓PNG遮罩；按源URL最多缓存64条，失败移出缓存，组件离开后不更新状态。图片仍来自既有私有签名地址，不能上传到其他服务。
- 首页：最多8个去重且具有cutoutUrl的当前可见衣物，不修改推荐itemIds。
- `exportStickerBoard`新增可选outlineColor，默认white；保持原1～8件、层级、裁切和1080×1350 PNG合同。不存储生成图片。
