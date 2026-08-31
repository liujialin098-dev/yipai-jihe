# Data Model: 设备定位天气城市

## 1. 设备坐标输入（瞬时）

| 字段 | 类型 | 规则 |
|---|---|---|
| `latitude` | number | 有限数，`-90..90` |
| `longitude` | number | 有限数，`-180..180` |
| `mode` | `session \| saved` | 仅本次或保存为常用城市 |

生命周期：由用户点击后产生，只存在于浏览器内存和设备到城市确认方的一次客户端请求中，不提交给衣拍即合 Server Action。不得写入 Cookie、数据库、日志、分析事件或长期浏览器存储。

## 2. 反向城市结果（请求级）

| 字段 | 类型 | 规则 |
|---|---|---|
| `city` | string | 从稳定地址字段提取，2～80 字符 |
| `countryCode` | string | 必须为 `CN`（不区分大小写） |
| `lookupSource` | string | 必须为 `coordinates`，拒绝 IP 回退 |

城市字段优先级：`city` → `locality`。结果不在中国、不是当前坐标结果、缺少城市或结构非法时拒绝。

## 3. 设备定位城市（规范化、城市级）

客户端只把反向城市名提交给 Server Action；服务器必须再次调用既有城市解析，形成现有 `WeatherLocation`：

- `city`
- `admin1`
- `latitude`（城市中心）
- `longitude`（城市中心）
- `timezone`

设备原始坐标不进入应用服务器；后续状态只使用城市中心五元组。

## 4. 本次天气城市（已有会话模型）

继续使用账号绑定 HttpOnly 会话 Cookie。选择 `session` 时写入规范化城市；另一账号不能继承，浏览器会话结束后失效，可通过“恢复常用城市”清除。

## 5. 账号常用城市（已有持久模型）

继续使用 `public.user_preferences`：

- `weather_city`
- `weather_admin1`
- `weather_latitude`
- `weather_longitude`
- `weather_timezone`

选择 `saved` 时只更新当前 `auth.getUser()` 对应记录，现有 RLS 继续限制所有权，不新增字段或迁移。

## 6. 状态转换

```text
等待用户操作
  ├─ 页面加载/刷新 → 不请求定位，状态不变
  └─ 点击定位按钮 → 定位中
定位中
  ├─ 权限拒绝/超时/不可用 → 状态不变，可手动选城或重试
  └─ 获得合法坐标 → 服务端城市确认
服务端城市确认
  ├─ 非中国/无法识别/服务不可用 → 状态不变
  └─ 规范化成功
       ├─ mode=session → 删除自身旧推荐 + 写本次城市
       └─ mode=saved → 删除自身旧推荐 + 更新常用城市 + 清除本次城市
```
