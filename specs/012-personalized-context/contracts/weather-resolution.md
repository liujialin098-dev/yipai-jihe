# Contract: 账号位置天气解析

## 输入

- `preset`: `live | mild | hot | cold | rainy`
- `location`: 保存的规范城市名、纬度、经度和时区；`live` 时必填

## 输出

```text
city: string
temperatureC: integer
apparentTemperatureC: integer
weatherCode: 0-99
summary: string
source: live | simulated
observedAt: ISO timestamp
preset: live | mild | hot | cold | rainy
```

## 行为

- `live` 使用输入位置请求实时天气，成功时 `source=live`。
- 实时请求超时、失败或结构非法时，返回同一城市的温和模拟天气并标记 `source=simulated`。
- 测试预设使用输入城市；没有账号位置的测试流程显示“测试城市”，不得显示北京。
- `live` 缺少位置时返回可识别错误，由调用方提示先设置城市。
