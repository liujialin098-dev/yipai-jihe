# Research — 2026-09-06

- Decision: 用户创建的 JWT 凭据，服务端 Ed25519 签发 5 分钟票据。Rationale: 浏览器直连且长期私钥不暴露；Alternative: 前端长期 API Key，拒绝。当前要求 iss=开发者 ID、sub=项目 ID、kid=凭据 ID。[身份认证](https://dev.qweather.com/docs/configuration/authentication/)
- Decision: 新 weather/v1/current 与 daily 经纬度路径。Context7 /websites/dev_qweather_en 仍是旧 v7，已用当前官方页与真实 HTTP200 复核。[实时](https://dev.qweather.com/docs/api/weather/weather-current/)、[每日](https://dev.qweather.com/docs/api/weather/weather-daily-forecast/)
- Decision: 明日最低气温作为保守穿衣参考，最高温避免强行叠穿，不能伪造体感；每日预报不包含体感。
- Decision: 代码适配原规则，并保留原始代码。雪/雨夹雪保持雪类别；未知拒绝，不猜测。[现象表](https://dev.qweather.com/docs/api/weather/weather-conditions/)
- Decision: 城市中心发前端请求天气，不是用户设备坐标。设备坐标由浏览器直接 GeoAPI 查询，只将城市名传回应用。
- Decision: 无 Supabase 表/权限变更；route 每次 auth.getUser()。已复核技能 changelog、官方 getUser 与本地 Next.js 16 Route Handler 文档。
- Decision: 同源 POST、不缓存、有界账号限频为进程级防抖，不是分布式计费防护；生产配额和凭据限制另行复核。
