# 调研与决策

2026-09-06

- 百炼[官方结构化输出](https://help.aliyun.com/zh/model-studio/qwen-structured-output)：qwen3.8-max 支持严格 JSON Schema，使用北京工作空间 API Host。仍保留业务复验，不依赖模型保证归属。
- Context7 已查询 DashScope，ID `/dashscope/dashscope-sdk-python`；SDK 索引只作辅助，HTTP 格式以官方网页为准。
- 本地 Next.js 文档 `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`：next/font/local 不向 Google 发起浏览器请求。
- 字体：[Google Fonts 官方 ZCOOL KuaiLe](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile)，保留原字体与 OFL 授权。
- Supabase changelog.md 读取失败。本阶段只删除历史画布查询，沿用 getUser / 当前账号过滤，不修改 API 模式或数据库。
- 旧推荐 catch 丢弃原因，无法从通用后备文案确定过去的失败根因；新日志仅受控错误类别、状态码、模型与耗时。
- 本机无百炼凭据，固定测试不能替代真实联调。
