# Research: 设备定位天气城市

## Decision 1：浏览器定位必须由按钮事件触发

- **Decision**: 仅在用户点击“本次使用当前位置”或“设为常用城市”后调用 `navigator.geolocation.getCurrentPosition`；不在页面加载、Effect、刷新或定时任务中调用。
- **Rationale**: Next.js 16.3.1 本地文档明确浏览器 API 应位于 Client Component，Server Action 可从事件处理器的 transition 中调用。显式点击同时满足权限预期和现有“不静默切换”原则。
- **Alternatives considered**: 页面加载即定位会弹出意外权限请求；持续 `watchPosition` 会扩大隐私、耗电和状态复杂度；仅用 IP 精度不足且已由 SDD-019 实现为待确认建议。

## Decision 2：只请求城市级定位精度

- **Decision**: 使用单次定位、`enableHighAccuracy: false`、10 秒超时和 5 分钟 `maximumAge`，定位进行时禁用两个入口。
- **Rationale**: 天气只需要城市级位置，高精度会增加耗电与等待，不改善产品结果。短期缓存可减少用户连续尝试时重复唤醒定位硬件。
- **Alternatives considered**: 高精度 GPS 更适合导航而非城市天气；无限等待会让 UI 卡住；零缓存会产生不必要的重复定位。

## Decision 3：设备端直接确认城市，应用服务器不接收坐标

- **Decision**: 浏览器在用户授权获得当前坐标后，直接调用 BigDataCloud 免费客户端 Reverse Geocode to City API；只接受 `lookupSource=coordinates`、国家为 `CN` 且有城市/地区名的结果，然后只把城市名提交给 Server Action。Server Action 重新鉴权并调用既有 `resolveChineseCity` 再次规范化。
- **Rationale**: Open-Meteo 的 Geocoding API 只提供名称到坐标的正向搜索，不能把设备坐标转为城市。BigDataCloud 官方免费接口明确要求由取得当前设备坐标的同一客户端直接调用，无需密钥；这样衣拍即合服务器完全不接收精确坐标。二次规范化确保天气仍使用项目现有城市、行政区、中心坐标和时区格式。
- **Alternatives considered**: Nominatim 服务端方案在当前开发网络固定样本连续超时，且让应用服务器接触精确坐标；直接保存 GPS 会扩大敏感数据范围；付费服务端地图 API 需要密钥、成本和新环境配置。

## Decision 4：遵守免费客户端接口的公平使用边界

- **Decision**: 接口只在用户点击并成功获得当前设备坐标后由同一浏览器调用；不使用历史坐标、第三方坐标、批量请求或无坐标的 IP 回退。设置 8 秒超时，UI 明确“定位城市由 BigDataCloud 处理；衣拍即合只接收城市名”。
- **Rationale**: 官方公平使用政策要求调用来自取得当前设备坐标的客户端，并禁止把坐标先传给服务器再代调。检查 `lookupSource=coordinates` 可拒绝意外 IP 回退。
- **Alternatives considered**: 服务端代调违反免费端点使用边界；不检查来源可能在坐标缺失时悄悄退回 IP；长期缓存坐标或城市映射没有必要。

## Decision 5：精确坐标不持久化

- **Decision**: 衣拍即合 Server Action 只接收城市名和模式，不接收 latitude/longitude、用户 ID、行政区或时区。客户端城市名视为不可信输入，必须经 `resolveChineseCity` 重新解析后才保存城市中心五元组。
- **Rationale**: 产品只需要城市天气，不需要位置轨迹。服务端不接收设备坐标进一步缩小敏感数据范围；重新解析城市名可防止客户端任意注入坐标或时区。
- **Alternatives considered**: 保存最后 GPS 位置会产生不必要的位置历史；完全信任客户端返回的完整位置对象会扩大篡改面。

## Decision 6：复用现有临时与常用城市状态转换

- **Decision**: 定位完成后，“本次使用”写账号绑定 HttpOnly 会话 Cookie；“设为常用城市”更新当前用户 `user_preferences` 并清除临时 Cookie。两者都先删除当前用户旧推荐并刷新相关页面。
- **Rationale**: SDD-018/019 已验证临时城市、账号城市、跨账号隔离和真实天气的一致性；设备定位只增加新的城市发现入口，不应建立第二套状态模型。
- **Alternatives considered**: 新表或坐标字段会重复现有模型；纯客户端状态刷新即丢失且无法统一服务端推荐；自动保存常用城市会误伤旅行场景。

## Documentation Evidence

- Next.js 16.3.1 本地文档：Client Component 用于 `Navigator.geolocation` 等浏览器 API；Server Action 可由事件处理器包在 transition 中调用，每个 Action 必须重新鉴权和校验不可信输入。
- Open-Meteo Forecast：天气接口接受经纬度与 `timezone=auto`；项目继续由既有服务端模块调用。
- Open-Meteo Geocoding：只提供城市名/邮编搜索，不提供设备坐标反向城市解析。
- BigDataCloud 免费客户端 Reverse Geocode to City：[官方接口文档](https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api)。
- BigDataCloud 公平使用规则：[官方 Fair Use Policy](https://www.bigdatacloud.com/docs/article/fair-use-policy-for-free-client-side-reverse-geocoding-api)。
- Supabase：沿用当前 `auth.getUser()`、`user_preferences` 所有权 RLS 和既有城市五元组，无 schema 或权限变更。
