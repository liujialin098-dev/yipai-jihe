# Research: 账号城市与衣着偏好

## 城市来源

- **Decision**: 使用用户主动保存的常用城市作为账号天气位置，不从登录邮箱、IP、姓名或设备静默推断。
- **Rationale**: Supabase Auth 身份不包含可靠居住城市；主动保存可解释、可跨设备恢复，也避免持续定位与隐私误解。
- **Alternatives considered**: 每次打开页面请求浏览器定位，会频繁触发权限且无法直接得到规范城市名；IP 定位精度不足且用户不可控；继续使用部署环境固定城市会重复当前北京错误。

## 城市解析

- **Decision**: 服务端使用 Open-Meteo Geocoding API 将中国城市名解析为规范名称、经纬度、省级行政区和 IANA 时区，仅取最相关中国城市结果。
- **Rationale**: 项目已使用 Open-Meteo，城市解析无需新增密钥或依赖。官方接口支持 `name`、`language`、`countryCode` 并返回经纬度、行政区和时区。
- **Alternatives considered**: 内置城市坐标表维护成本高且覆盖有限；额外地图供应商需要密钥和新的合规边界。
- **Source**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

## 天气降级

- **Decision**: 实时天气始终接收账号保存的位置；未设置位置时阻止“实时天气”生成并引导设置，服务失败时使用同一城市名的明确模拟天气。
- **Rationale**: 这能保证降级只改变天气来源，不偷偷改变城市。Open-Meteo Forecast API 接受经纬度与 IANA 时区并返回当前温度、体感温度和天气代码。
- **Alternatives considered**: 回退北京会产生错误结果；完全阻断所有推荐会削弱演示闭环，因此保留明确模拟天气。
- **Source**: [Open-Meteo Forecast API](https://open-meteo.com/en/docs)

## 衣着偏好与单品归属

- **Decision**: 账号使用 `male | female | unrestricted`，衣物使用 `male | female | unisex`。匹配规则为不限显示全部；男装排除 female；女装排除 male；unisex 始终保留。
- **Rationale**: 规则简单、可逆、可测试。它既解决演示裙装问题，又不删除任何用户数据。
- **Alternatives considered**: 仅按类别隐藏所有连衣裙无法覆盖未来明确男装/女装单品；切换时删除演示衣物不可逆；从账号邮箱猜偏好不可接受。

## 既有数据迁移

- **Decision**: 新字段采用安全默认值，既有账号衣着偏好默认 `unrestricted`，既有衣物默认 `unisex`；四件演示连衣裙按稳定 `demo_key` 回填 `female`。
- **Rationale**: 加法迁移不会破坏现有账号，且明确解决当前演示数据问题。已有 `user_preferences` 更新策略同时包含 SELECT、USING 和 WITH CHECK，可继续保护新增列。
- **Alternatives considered**: 新建独立偏好表会重复一对一数据和 RLS；强制既有账号默认男装或女装会静默隐藏数据。
- **Source**: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 黑色按钮动效回归

- **Decision**: 移除 `.motion-button::before` 的横向白色扫光，保留受控径向填充、轻微缩放和阴影反馈；深色按钮的径向反馈降低亮度。
- **Rationale**: 当前 620ms 扫光在按钮出现、悬停或焦点时像“东西一闪而过”。状态反馈仍由按压缩放和柔和气泡表达，不需要自动高亮条。
- **Alternatives considered**: 降低扫光速度仍会经过文字；仅对黑色按钮禁用会造成组件行为不一致。
