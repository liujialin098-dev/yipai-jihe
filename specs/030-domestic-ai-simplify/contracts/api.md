# 接口契约

- `DASHSCOPE_API_KEY`：北京百炼服务端密钥，禁止浏览器、日志、仓库和聊天传递。
- `DASHSCOPE_API_HOST`：控制台北京工作空间域名，只接受 `*.cn-beijing.maas.aliyuncs.com`，不接受任意代理。
- `QWEN_RECOMMENDATION_MODEL` 默认 `qwen3.8-max`，覆盖值必须支持严格 JSON Schema。
- POST `/compatible-mode/v1/chat/completions`：Bearer、messages、response_format=json_schema(strict=true)、max_tokens=4096，25 秒，不重试。
- 错误：not_configured、invalid_config、unauthorized、rate_limited、timeout、provider_error、output_truncated、invalid_result。
- 抠图 POST、source GET/POST 返回 410/no-store；旧保存 action 返回 error，不访问存储。
- 两类 `/outfits` 页面跳转推荐，不加载编辑器。
