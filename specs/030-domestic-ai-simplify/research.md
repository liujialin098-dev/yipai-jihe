# 调研与决策

2026-09-06

- 百炼[官方结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)：qwen3.8-max 支持严格 JSON Schema，使用北京工作空间 API Host。仍保留业务复验，不依赖模型保证归属。
- Context7 已查询 DashScope，ID `/dashscope/dashscope-sdk-python`；SDK 索引只作辅助，HTTP 格式以官方网页为准。
- 本地 Next.js 文档 `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`：next/font/local 不向 Google 发起浏览器请求。
- 字体：[Google Fonts 官方 ZCOOL KuaiLe](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile)，保留原字体与 OFL 授权。
- Supabase changelog.md 读取失败。本阶段只删除历史画布查询，沿用 getUser / 当前账号过滤，不修改 API 模式或数据库。
- 旧推荐 catch 丢弃原因，无法从通用后备文案确定过去的失败根因；新日志仅受控错误类别、状态码、模型与耗时。
- 本机无百炼凭据，固定测试不能替代真实联调。
- 用户偏好已有可解释账本：`preference_feedback_events` 经 `recalculatePreferenceScores` 汇总为 `user_preferences.style_scores`，收藏、换件和问卷信号可直接复用，无需训练或保存新的用户专属模型。
- SDD-027 已将 Vogue/GQ 官方 RSS 放入可信白名单，并用 `unstable_cache` 每 24 小时刷新；推荐只读取通过 URL、发布日期和有效期验证的摘要元数据，外部不可用时传空趋势上下文，不伪造“最新流行”。
- 动态标题采用“双层保证”：提示词要求标题与首个风格标签、场景、天气或关键单品一致；业务复验拒绝三套重名、编号式/通用模板名和与首风格无语义线索的标题。规则降级使用颜色 + 风格语汇组合，仍保持 3 套唯一。
- 顶栏采用轻青柠实体浮层而非整页荧光色：外层保留背景间距和柔和阴影，当前项使用半透明白胶囊，既满足品牌识别又避免大面积高饱和。
