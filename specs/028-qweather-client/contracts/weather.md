# Weather contract

POST /api/weather/session?day=today|tomorrow：空请求体，同源 Origin，当前 Supabase 会话。无会话 401，跨源 403，day 非法 400，每账号每分钟超过 12 次 429，配置/读取失败 503。200 返回 WeatherSession；所有响应 private,no-store、Vary Cookie,Origin。私钥、原 IP、设备坐标、用户 ID 不返回。城市可空，便于首次定位。

Browser -> QWeather：短 JWT Authorization；redirect=error，8 秒超时，取消旧请求。今日 current；明日 daily?days=3&localTime=true 精确日期；设备 GeoAPI 传经度,纬度，只接受中国。天气必须展示归因。

Generate Action：expectedWeatherLocation、expectedWeatherDate 必须与服务端有效位置/日期一致，否则要求刷新；服务器独立获取天气，忽略客户端温度；持久化前再次校验城市日期。
