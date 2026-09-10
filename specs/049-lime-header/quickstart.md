# 验证说明

```powershell
npm run check
npm run build
npm run verify:sdd-049
```

浏览器至少检查 375px 默认浅色、375px 默认夜间和 844×390 替代皮肤：顶部导航与中央添加按钮均为 `#d8ff52`，顶部图标与文字清晰，导航高度仍为 72px，页面无横向溢出或控制台错误。

同时使用减少动态与 125% 根字号检查：顶部允许随内容自然增高，但品牌、图标和安全区不得被截断，也不得出现横向滚动。

Production 发布与检查：

```powershell
npx vercel deploy --prod --yes --scope jialin-d583
npx vercel inspect yipai-jihe-9iwmexhv7-jialin-d583.vercel.app --scope jialin-d583
npx vercel logs dpl_DrPvVFCiKHzY89fbDZfuaZU6UWMS --level error --since 30m --scope jialin-d583
```
