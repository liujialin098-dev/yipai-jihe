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
- 根元素具备 `role="status"` 与礼貌播报；装饰性裁片、光晕和高光不重复朗读。
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

- 图标始终来自 `/brand/ensemble-icon-a-folded-e.png`。
- 动画属性只使用 transform/opacity；不得使用 `transition: all` 或 `scale(0)`。
- 所有运动提供 `prefers-reduced-motion: reduce` 降级；透明材质提供 `prefers-reduced-transparency: reduce` 降级。
- 320px 起无水平溢出；文案允许系统字号放大后换行。
