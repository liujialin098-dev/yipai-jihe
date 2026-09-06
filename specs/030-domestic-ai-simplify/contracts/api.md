# 接口契约

- `DASHSCOPE_API_KEY`：北京百炼服务端密钥，禁止浏览器、日志、仓库和聊天传递。
- `DASHSCOPE_API_HOST`：控制台北京工作空间域名，只接受 `*.cn-beijing.maas.aliyuncs.com`，不接受任意代理。
- `QWEN_RECOMMENDATION_MODEL` 默认 `qwen3.8-max`，覆盖值必须支持严格 JSON Schema。
- POST `/compatible-mode/v1/chat/completions`：Bearer、messages、response_format=json_schema(strict=true)、max_tokens=4096，25 秒，不重试。
- 错误：not_configured、invalid_config、unauthorized、rate_limited、timeout、provider_error、output_truncated、invalid_result。
- 抠图 POST、source GET/POST 返回 410/no-store；旧保存 action 返回 error，不访问存储。
- 两类 `/outfits` 页面跳转推荐，不加载编辑器。
- 推荐模型上下文新增 `preferenceProfile` 与 `trendSignals`，均由服务端构造；不得包含用户 ID、邮箱、头像、原始反馈事件、资讯全文或外部图片。
- preferenceProfile 最多包含 3 个显式偏好和 5 个非零反馈风格分数；个性化关闭时 learnedStyles 必须为空。
- trendSignals 最多 4 条，只接受未过期且已发布的可信内容；RSS 获取失败时使用空数组，生成流程继续但不得声称参考了最新趋势。
- 每套 title 为 4～16 个可读字符，三套唯一；不得使用“第一套/第二套/方案一/今日推荐”等编号或通用模板，并须命中首个 styleTag 对应的中文风格语义。
