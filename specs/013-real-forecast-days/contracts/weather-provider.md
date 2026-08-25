# Contract: 真实天气提供方

## 请求

- Endpoint: Open-Meteo Forecast API `/v1/forecast`
- 坐标与时区：来自当前账号已保存城市。
- 当前字段：`temperature_2m,apparent_temperature,weather_code`
- 日字段：`weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max`
- `forecast_days=2`
- `cache=no-store`，请求超时后失败。

## 今日映射

- 取 `current.temperature_2m`、`current.apparent_temperature`、`current.weather_code`。
- 所有字段必须是有限数值并位于合理范围。

## 明日映射

- 先按账号时区计算目标 `YYYY-MM-DD`。
- 在 `daily.time` 中精确匹配目标日期。
- 同一索引读取 `temperature_2m_min`、`apparent_temperature_min` 和 `weather_code`。
- 不允许使用索引 1 盲取、不允许退回今天或后天。

## 失败

以下任一情况返回稳定错误 `real_weather_unavailable`：

- 网络、超时或非 2xx；
- JSON 解析失败；
- 当前或日预报节点缺失；
- 目标日期不匹配；
- 温度、体感或天气代码不是有限数值或越界。

失败不得返回模拟快照。

