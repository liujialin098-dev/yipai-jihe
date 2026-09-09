# Research: SDD-041 品牌开屏与加载动效

## 最终决策覆盖（2026-09-09）

以下为初版研究历史。用户最终批准衣服→E的SVG同构路径插值，取代PNG裁片、高光和折叠呼吸。外轮廓及两个内部色块使用同一时间轴/缓动、固定填充色、连续三次曲线，结尾不切换PNG。文字与退出继续CSS transform/opacity；正式PNG仅用于减少动态。根布局与两个加载入口的集成方案保持不变，不新增依赖或业务请求。完整打开动画从根布局返回后播放，不代替网络等待或原生启动页。

## 决策 1：实时 CSS 动效，不输出固定 GIF

- **Decision**: 使用正式 PNG 的多层裁片、透明遮罩高光与 CSS 动画组成开屏和加载变体。
- **Rationale**: 同一资产可适配任意清晰度、浅色/深色、窄屏和减少动态；体积更小，也不会把背景色或播放速度固化进文件。
- **Alternatives considered**: GIF 会失去透明边缘质量且无法响应减少动态；视频/Lottie 增加资产与依赖；重绘 SVG 容易偏离已确认正式图标。

## 决策 2：开屏一段解释性动效，加载为克制循环

- **Decision**: 开屏由三段轻微错位的图标在 0.7 秒内合拢，随后字标出现，约 1.35 秒整体淡出；加载只保留 1～2px 的折叠呼吸和形状内高光。
- **Rationale**: 开屏属于低频品牌时刻，可以使用有限 delight；加载属于重复状态，必须避免弹跳和高速旋转造成焦躁。
- **Alternatives considered**: 整枚 Logo 连续旋转过于通用；反复弹跳与项目既有“高级、克制”方向冲突；复杂 3D 翻面会扭曲品牌轮廓。

## 决策 3：使用现有 motion token 与合成属性

- **Decision**: 动画只改变 `transform` 和 `opacity`，沿用 `--motion-gentle` / `--motion-spring`，高光使用线性位移；开屏使用 CSS keyframes，避免运行时脚本驱动帧。
- **Rationale**: 预定加载动画在页面繁忙时仍应稳定；复用 token 避免新增一套曲线系统。
- **Alternatives considered**: JavaScript `requestAnimationFrame` 没有动态输入需求且更易掉帧；安装运动库超出当前复杂度。

## 决策 4：根布局只挂载一次，页面加载交给 loading.tsx

- **Decision**: 开屏作为根布局中的非交互覆盖层，完整刷新时播放，站内导航因根布局保留而不重复；页面等待继续通过现有根级 `loading.tsx` 自动边界展示。
- **Rationale**: Next.js App Router 的 `loading.tsx` 会为页面提供即时 Suspense fallback；将客户端交互下推到叶节点是当前栈的推荐方式。本方案开屏无需客户端状态。
- **Alternatives considered**: 每个页面手写加载状态会重复且不一致；把整个布局改成客户端组件会扩大 hydration 边界。

## 决策 5：延迟加载提示并提供减少动态降级

- **Decision**: 页面级动画在 120ms 后才可见；减少动态时取消裁片位移、旋转、循环和高光，仅保留静态图标与短淡变。减少透明度时使用实色背景。
- **Rationale**: 可避免瞬时加载闪烁，并降低全屏动效对动态敏感用户的影响。
- **Alternatives considered**: 完全移除所有反馈会使真实等待看起来像卡死；统一长延迟会让慢请求缺少及时状态。

## 资料依据

- Context7 `/vercel/next.js/v16.2.9`：`loading.tsx` 在对应路由段自动提供 Suspense 加载界面，可为流式页面提供即时反馈。
- 本地动画设计 skill：预定加载适合 CSS animation；使用 transform/opacity，进入用强 ease-out，移动用 ease-in-out，并必须随功能一起交付减少动态规则。
- 本地 Apple 设计 skill：全屏动效应克制、短促、保持图标原色；减少动态使用淡变替代位移；深浅材质需保持层级但不能牺牲可读性。
- UI/UX Pro Max 检索：只动画 1～2 个关键元素，加载提示需避免近乎瞬时操作闪烁，并保留可访问的忙碌状态。
