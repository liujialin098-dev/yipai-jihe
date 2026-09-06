# Data model

无数据库迁移。沿用账号城市五元组及按账号绑定的临时 Cookie。

WeatherSession 不持久化：host、token、expiresAt、location（有效城市中心或 null）、targetDay、targetDate、issuedAt。接口不接受坐标或 userId，token 仅组件/函数内存。

WeatherSnapshot 扩展：provider=qweather、targetDate、temperatureBasis=feels_like|air_minimum、temperatureMaxC、providerCode、nightSummary、attributions、locationKey。旧字段兼容，observedAt 对和风指获取时间，不是观测时间。无 provider 的历史快照按 Open-Meteo 解释。

输入必须为有限摄氏温度 [-60,60]、有效日期、短描述与支持代码。状态 loading/ready/error/stale；目标变化取消旧请求，5 分钟过期。
