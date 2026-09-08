# /api/stickers/items/:id/refine

GET：当前会话、当前账号活跃衣物，读取私有透明PNG。200 image/png，ETag为路径SHA256（无私有路径返回）；private,no-store。404无衣物/透明图，401无会话。

POST：同源Origin；Content-Type:image/png；If-Match:GET的ETag；body为PNG，最多3MiB、最长1280px、有透明和非透明像素。不接受客户端用户ID或文件路径。200 {cutoutUrl}；400格式不合法；401未登录；403非同源；404不属于当前账号；409版本冲突；413超限；422图片不合法；503存储失败。

更新绑定id/user_id/active/原cutout_path；新文件双上传和签名成功才改指针。失败清理仅本次UUID文件，旧图不删除。无数据库结构变化。
