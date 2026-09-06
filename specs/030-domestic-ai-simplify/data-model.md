# 数据边界

- 不建表、不改 RLS、不删除衣物、图片、头像、历史画布或收藏。
- daily_recommendations 继续保存 source 与 ai_model；国内结果成功且复验通过才写 ai。
- generation_ms 保持原表兼容上限；安全日志记录实际模型耗时。
- ProfilePageData 移除 canvases/canvasCount；仅统计当前 viewer.userId 的日记与活跃衣物。
- 旧画布和抠图应用入口停止写入，不扩大客户端数据库权限。
- user_preferences.style_scores 继续作为反馈学习结果；本阶段只读并规范化 14 个合法风格的非负有限分数，不保存提示词或新的画像副本。
- fashion_personalized=false 时不使用 style_scores；preferred_styles 和用户本次显式选择仍可作为当前请求输入。
- 每日趋势上下文为请求期派生值，不落库：id、title、topic、styles、occasions、publishedAt、validUntil、sourceName、sourceUrl。过期、未来日期、无可信 HTTPS 来源的条目不得进入模型。
- daily_recommendations 仍只保存最终三套标题、理由、风格标签、衣物 ID、source 与 ai_model；三套 title 必须规范化后唯一并通过风格语义检查。
