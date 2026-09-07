# Quickstart: 贴纸画板与月历验收

## Automated

```bash
npm run check
npm run build
npm run verify:sdd-034
npm run verify:sdd-033
npm run verify:sdd-009
```

## Browser at 390px

1. 使用隔离体验身份进入 `/stickers`，选择 1～8 件衣物并生成缺失贴纸。
2. 拖动两件贴纸形成重叠，调整大小、旋转、置顶和置底；确认画板无格子、无吸附。
3. 分别切换至少一种浅色和一种深色，确认标题、选中轮廓清楚，下载图与屏幕配色一致。
4. 使用方向键与页面方向按钮微调，确认拖动不是唯一操作方式。
5. 刷新页面，确认当天布局和底色恢复且无效衣物已清理。
6. 点击下载，确认得到 1080×1350 PNG；支持分享的设备再验证系统分享，不支持时验证下载降级。
7. 切换月历，核对真实日记日期、收藏优先代表衣物、件数角标和三项月度摘要。
8. 切换前后月份，确认未来月份不可进入、空白日不伪造贴纸。
9. 检查 `document.documentElement.scrollWidth <= innerWidth`、触控控件无遮挡且控制台无 error。

## Scope note

本阶段不验收 Reel、视频、直播、转盘、烟花布局播放、公开发布或跨设备画板同步。
