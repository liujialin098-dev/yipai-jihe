# Data Model: IP 天气城市建议

## 1. IP 城市建议（请求级、只读）

| 字段 | 类型 | 规则 |
|---|---|---|
| `city` | string | RFC3986 安全解码后 2～80 字符 |
| `country` | string | 当前只接受 `CN` |
| `region` | string \| null | 最多 3 字符的省级代码，仅用于说明 |
| `latitude` | number | `-90..90` |
| `longitude` | number | `-180..180` |
| `timezone` | string \| null | 可选 ICANN 时区，仅用于提示上下文 |

生命周期：随单次推荐页请求产生，不落库、不写 Cookie、不记录 IP 地址。只有字段完整且与当前有效城市相距至少 50 公里时进入“待确认”状态。

## 2. 本次天气城市（浏览器会话级）

Cookie 逻辑结构：

| 字段 | 类型 | 规则 |
|---|---|---|
| `version` | `1` | 仅接受当前版本 |
| `userId` | UUID string | 必须等于当前 Supabase 用户 ID |
| `location.city` | string | 规范城市名，1～80 字符 |
| `location.admin1` | string | 规范行政区，1～80 字符 |
| `location.latitude` | number | `-90..90` |
| `location.longitude` | number | `-180..180` |
| `location.timezone` | string | 1～80 字符 |

存储边界：Base64URL 编码的 JSON，HttpOnly，会话级，无显式到期时间；仅服务器读取和修改。不作为授权依据。

状态转换：

```text
无临时城市
  └─ 用户确认“本次使用” → 有效临时城市
有效临时城市
  ├─ 用户点击“恢复常用城市” → 无临时城市
  ├─ 用户保存常用城市 → 无临时城市 + 账号城市更新
  ├─ 当前用户变化 → 对新用户视为无临时城市
  └─ 浏览器会话结束 → 无临时城市
无效/损坏 Cookie
  └─ 读取时忽略 → 无临时城市
```

## 3. 账号常用城市（已有持久模型）

继续使用 `public.user_preferences`：

- `weather_city`
- `weather_admin1`
- `weather_latitude`
- `weather_longitude`
- `weather_timezone`

更新必须由当前会话用户身份和既有 RLS 共同限制，不新增字段或迁移。

## 4. 当前有效城市（派生模型）

计算顺序：

1. 读取当前账号的规范常用城市。
2. 读取 Cookie，校验版本、结构和 `userId`。
3. Cookie 对当前用户有效时采用临时城市；否则采用账号常用城市。
4. 两者都不存在时返回 `null`，要求用户手动选择，不提供默认城市。

用途：推荐目标日期时区、真实天气请求、推荐结果城市校验、推荐页当前城市标签与 IP 距离判断。

## 5. 天气推荐批次（已有持久模型）

继续使用 `public.daily_recommendations`。由于唯一键仍为 `(user_id, recommendation_date)`，有效城市改变或恢复时删除当前用户全部旧批次，之后重新生成。

不保存 IP 建议、临时来源或位置历史。
