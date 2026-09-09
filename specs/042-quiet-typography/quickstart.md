# SDD-042 验收记录

## 资讯卡精简增量

- 覆盖此前“详情展开”验收：实际卡片不含details/重复summary/reason，标题速览、来源与time保留。渲染三种summaryKind和未读开关，ReadingControls使用真实组件但Action明确mock，不读写账号。
- check/build/042通过；375浅色client/scroll=375/375，320深色305/305，844横屏829/829；按钮44px，浏览器error为空。027仅同步文案断言，未跑联网；真机大字体、真实阅读状态持久化待验。

## 自动检查

运行 `npm run verify:sdd-042`、`npm run check`、`npm run build`。042渲染真实PageHeading/InspirationCard，外部依赖为明确的固定样本，不联网写账号；检查标题转义、统一token、介绍语移除、真实来源性质和提示保留。

- check/build（21/21）、042/015/029/030/034/035/037/041通过。
- 027离线URL、日期、去重及排序通过；旧脚本随后自动进入联网测试，鉴权请求fetch失败，不能标记027全部通过。未重试或更改数据服务。

## 视觉检查

先build，然后 `node --no-warnings scripts/verify-sdd-042.mjs --preview`，打开 `http://127.0.0.1:3042/?width=375`；查询 `width=320&dark=1` 为深色、`width=844` 为横屏样本。样本使用实际组件/构建CSS/自托管字体，导航只是排版占位，不能当作完整App功能验收。

- 375px标题居中；独立宽度测量中心差0px。320px深色、375px浅色及844×390横屏的clientWidth/scrollWidth分别305/305、360/360、829/829。
- 页面标题移动端24px、分区18px、卡片16px，统一圆润字体；长标题自然换行。首页Hello为已确认品牌字形例外。
- 内容详情默认折叠，点击后显示推荐依据与日期；来源和错误提示可见。浏览器error日志为空。
- 用户现有完整账号页面、系统最大字体与真机仍待集中复验。

## Production发布（2026-09-09 14:53）

- 源提交 `17074b2`；部署 `dpl_4cgNbmMZrS8n9Nkx4Zqot1uyc1Nn`，正式链接 `https://yipai-jihe.vercel.app`，唯一URL `https://yipai-jihe-n3ujejs90-jialin-d583.vercel.app`。inspect核实Ready/production/正式别名，云端构建14秒通过；发布前check/build/042再跑通过。
- 正式首页/login/stickers/inspiration无会话HTTP GET均200；公开CSS为200，包含新标题token及app-page-heading规则。资讯/CSS首次TLS失败，单次重试成功；最近30分钟error日志无记录。
- 本轮未做登录后浏览器交互复验，不将HTTP、样式资源及无错误日志写作完整功能验收。项目、命令与限制同步AGENTS.md及progress.md。
