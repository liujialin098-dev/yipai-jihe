# 数据与边界

## 恢复增量

恢复输入只有email、token、password、confirmPassword，短暂处理且不回显到结果/日志/URL。客户端邮箱仅保存在当前表单内存，不写本设备存储。返回固定状态与字段提示；成功后没有session返回。启用开关为服务端环境变量，默认关闭。没有新表，没有删除操作，没有修改原有浏览器账号。

## 本阶段运行数据

- FormData：currentPassword、password、confirmPassword，读取为字符串，拒绝文件、缺少字段；原密码最多1024字符，新密码至少8字符且UTF-8不超过72字节，两次一致且与旧密码不同。
- 当前账号：auth.getUser 服务端返回 id/email/is_anonymous；不接受客户端指定账号。
- 临时验证会话：不写cookies/localStorage、不自动刷新、不导出；成功或失败后只清理它自己的local会话。清理失败不把成功改密变成失败。
- 返回：status/message/fieldErrors，只允许安全固定文案；密码、邮箱、token不返回。
- 资料标志 account_password_configured：仅展示提示，不是权限。写入true也不能替代原密码检查。

没有新增表、迁移或数据库权限，没有批量删除。认证供应商可能使其他会话后续失效，本轮不保证已发JWT立即失效，不宣称强制全设备退出。

## 初步业务数据地图（来自代码，不等于线上配置证明）

| 数据 | 用途与位置 | 源码依据 | 上架前待核实 |
|---|---|---|---|
| 邮箱/密码/会话 | Supabase Auth认证；密码不写业务表 | lib/auth/actions.ts、lib/supabase/* | 身份核验、密码策略、限流、会话期限、实际地域 |
| 昵称/头像/偏好 | profiles、user_preferences及私有对象 | lib/profile/data.ts、lib/auth/viewer.ts | 隐私告知、删除、备份保留期限 |
| 原始衣物与识别任务 | wardrobe_items、wardrobe_ingestions、wardrobe-images私有桶 | supabase/migrations、lib/wardrobe/* | 上传EXIF、失败对象/过期任务清理、访问签名期限 |
| 识别图片 | 目前仍有OpenAI视觉调用 | lib/wardrobe/recognition.ts | 独立告知与同意、真实模型、地域和合同，不称全国产 |
| 透明贴纸与精修图片 | 百度抠图处理，派生文件存私有桶 | lib/outfits/baidu-cutout.ts、lib/stickers/refinement.ts | 委托处理条款、是否留存、可撤回路径 |
| 城市/天气 | 前端向和风请求天气，设备坐标取两位小数直接交给和风解析城市；应用服务端提供短期授权并接收选定城市 | lib/recommendations/device-location.ts、lib/weather/client.ts、lib/weather/auth.ts | 定位告知、实际国内连通性、平台网络日志 |
| 推荐/反馈/收藏 | daily_recommendations、preference_feedback_events、两类favorites | lib/recommendations/*、supabase/migrations | 提交给千问的字段、最小化、关闭个性化机制 |
| 穿搭日记 | outfit_diary_entries，关联当前衣物 | lib/diary/*、supabase/migrations | 注销联动、同日幂等、跨设备一致性 |
| 资讯与阅读状态 | 公开RSS缓存、fashion_content_reads、fashion_topic_impressions | lib/inspiration/* | 来源使用条款、更新时间、个性化与非个性化区别 |
| 资讯标题翻译 | OpenAI仅处理公开标题和稳定ID | lib/inspiration/summary.ts | 供应商清单与AI标识，不能误写为衣橱照片输入 |
| 拼图草稿/皮肤 | 按账号键或本设备localStorage | lib/home/collage.ts、components/stickers/* | 账号注销/切换时清理范围、卸载数据恢复说明 |
| 请求日志与网络元数据 | 托管平台与供应商可能处理 | 部署配置与供应商合同 | 实际收集项、日志脱敏、保存期限、境外接收方 |

删除设计必须包含已退役的 outfit_canvases 及旧生成图片，不能只遍历当前UI可见记录。表的ON DELETE CASCADE不能替代Storage文件清理和会话撤销。
