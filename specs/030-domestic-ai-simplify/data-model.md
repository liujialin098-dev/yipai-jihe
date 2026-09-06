# 数据边界

- 不建表、不改 RLS、不删除衣物、图片、头像、历史画布或收藏。
- daily_recommendations 继续保存 source 与 ai_model；国内结果成功且复验通过才写 ai。
- generation_ms 保持原表兼容上限；安全日志记录实际模型耗时。
- ProfilePageData 移除 canvases/canvasCount；仅统计当前 viewer.userId 的日记与活跃衣物。
- 旧画布和抠图应用入口停止写入，不扩大客户端数据库权限。
