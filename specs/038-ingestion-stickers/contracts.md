# 状态与接口合同

入库状态与贴纸状态独立：confirmed不会因贴纸失败退回manual/failed。

贴纸：idle → queued → processing → ready / failed；failed → 用户重试 → queued。成功缓存当前短期签名URL，不保存原始私有路径或凭据到浏览器持久存储。

复用 `POST /api/stickers/items/<uuid>`，不接收userId或任意图片地址；服务端auth.getUser、active衣物归属、私有bucket路径与同源检查保持不变。created/reused且cutoutUrl为HTTPS才显示就绪，其他响应一律保留原图。

同页面单并发，间隔4秒；页面离开只停止未开始任务。不是分布式持久队列，不承诺跨刷新/跨设备继续执行。
