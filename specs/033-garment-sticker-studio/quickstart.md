# Quickstart: 衣物贴纸册验收

## Automated

```bash
npm run check
npm run build
npm run verify:sdd-033
npm run verify:sdd-031
```

## Browser at 390px

1. 使用隔离体验身份进入 `/stickers`。
2. 在“今日想穿”选择 1～8 件，确认贴纸板即时更新且页面无水平溢出。
3. 刷新页面，确认当天有效选择恢复。
4. 切换“我的喜欢”，确认只显示收藏单品，切换不清空选择。
5. 对已有透明图确认直接展示白边 loose 贴纸且不请求接口。
6. 对仅有原图的衣物点击生成，确认逐件状态、成功替换或失败保留原图。
7. 确认首页和日记均可进入贴纸册，底部五项导航未改变。
8. 检查控制台无 error，`document.documentElement.scrollWidth <= innerWidth`。

## Known environment condition

真实去背依赖服务端 `BAIDU_API_KEY` 与 `BAIDU_SECRET_KEY`。若本地未配置，只验收安全失败、原图保留和重试；不得标记为真实接口成功。
