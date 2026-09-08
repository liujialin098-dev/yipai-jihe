# Quickstart: SDD-035 验收

## Automated gates

```powershell
npm run check
npm run build
npm run verify:sdd-035
npm run verify:sdd-034
npm run verify:sdd-009
```

## Mobile acceptance

1. 在 390px 宽度打开 `/stickers`，把两件贴纸拖到重叠位置。
2. 选中底层贴纸执行置顶，确认覆盖顺序立即变化；再执行置底，确认被覆盖。
3. 使用四角分别缩放和旋转，确认中央仍只负责移动且控件易于点按。
4. 裁切四边后下载图片，确认导出与画板预览一致；重载页面确认草稿保留。
5. 打开 `/diary`，空月与有数据月份都显示完整日历；过去/今天可添加，未来只读。
6. 打开收藏视图，确认可进入贴纸工作台。
7. 打开利用率，确认最近 30 天真实日记单品填入贴纸墙，无数据时不伪造。
8. 横屏复核画板、底部导航与裁切面板无水平溢出，浏览器控制台无 error。
