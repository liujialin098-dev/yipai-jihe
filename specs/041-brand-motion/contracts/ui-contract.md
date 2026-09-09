# UI Contract: BrandMotion

## 共享组件

```text
BrandMotion
  variant: "loader" | "splash"
  label?: string
  className?: string
```

### `loader`

- 输出可见品牌图标和短等待文案。
- 根元素具备 `role="status"` 与礼貌播报；装饰性裁片不重复朗读；不使用泡泡、光晕与高光。
- 120ms 之前保持不可见；出现后持续循环，组件卸载时立即消失。
- 默认文案为“正在准备页面”。调用方可传入更具体但不承诺结果的文案。

### `splash`

- 输出正式图标与 `Ensemble / 衣拍即合` 字标。
- 整体为装饰性开屏，不建立焦点、不接收指针、不包含可点击控件。
- 标准模式在 1.5 秒内完成并变为不可见；减少动态在 0.5 秒内完成。
- 由根布局挂载，因此同一次站内导航生命周期只出现一次。

## 页面集成

- `app/layout.tsx`: 在应用壳层之前放置开屏覆盖层；不把根布局改为客户端组件。
- `app/loading.tsx`: 只渲染页面级 `loader`，由路由加载边界控制生命周期。
- `components/session-bootstrap.tsx`: 跳转覆盖层复用 `loader`，不保留通用旋转图标。

## 视觉与无障碍约束

- 边缘使用周期三次B样条转换的同构贝塞尔路径，首尾及相邻曲段切线/曲率连续，统一5位精度；几何平滑不得引入填充变化、模糊或新描边。

- 最新色块合同覆盖旧的末段PNG衔接：形变全程使用同一SVG和固定青柠/丁香填充，内部色块与外轮廓同时间轴插值，停留E时不切换图片、不改变填充。正式PNG仅用于减少动态静态显示。

- 动态图标来自 `/brand/ensemble-shirt-morph.svg` 和 `/brand/ensemble-shirt-morph-loop.svg`；减少动态时使用 `/brand/ensemble-icon-a-folded-e.png`。
- 文字维持既有transform/opacity时序。图标使用SVG同构路径插值，从短袖衣服变成E，末段保持同一SVG；这是允许的几何动画例外。不得使用 `transition: all` 或 `scale(0)`。
- 所有运动提供 `prefers-reduced-motion: reduce` 降级；透明材质提供 `prefers-reduced-transparency: reduce` 降级。
- 320px 起无水平溢出；文案允许系统字号放大后换行。
