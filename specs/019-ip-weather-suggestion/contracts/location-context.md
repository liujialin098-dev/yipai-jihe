# Contract: 当前天气位置上下文

## 输入

- 当前 Supabase 用户 ID。
- 当前账号保存的规范天气城市，可为空。
- 当前请求 Cookie。
- 当前请求的 Vercel IP 地理头。

## 输出

```text
savedLocation: 账号常用城市或 null
effectiveLocation: 临时城市、常用城市或 null
overrideActive: 当前用户是否有有效临时城市
ipSuggestion: 待确认 IP 城市建议或 null
```

## 规则

1. 临时 Cookie 只有在版本、结构、坐标和用户 ID 全部合法时生效。
2. `effectiveLocation = validOverride ?? savedLocation`。
3. IP 国家不是 `CN`、城市/坐标缺失或字段无效时，`ipSuggestion = null`。
4. IP 候选与有效城市距离小于 50 公里时，`ipSuggestion = null`。
5. IP 候选只用于 UI 提示；不得直接传入天气服务或数据库。
6. 没有有效位置时不生成默认武汉、北京或模拟位置。

## 安全约束

- 不读取、保存或返回原始 IP 地址。
- Cookie 不可被普通浏览器脚本读取。
- 位置上下文不得用于用户授权；用户身份始终来自 Supabase 服务端会话。
