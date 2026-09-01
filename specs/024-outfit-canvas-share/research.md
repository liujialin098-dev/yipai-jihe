# Research: 穿搭画布与分享卡片

## Decision 1：学习 Whering 的产品原则，不复制品牌界面

- **Decision**: 采用“真实衣橱是主角、自由 Canvas、保存分享”的产品结构，同时保留衣拍即合现有 Logo、中文信息架构和天气推荐。
- **Rationale**: Whering 官方将添加衣物、自动去背景、Canvas 创建搭配、保存和衣橱洞察作为连续体验；用户提供截图也强调大色块与衣物排布，而不是模特试穿。
- **Alternatives considered**: 一比一复刻截图会造成品牌混淆，也无法复用现有推荐、天气和日记能力，因此拒绝。
- **Sources**: Whering 官方主页、官方 Outfit Maker 说明，检索日期 2026-09-01。

## Decision 2：首版本地纯色背景抠图，不接云 API

- **Decision**: 使用边缘连通区域算法：从图片四周估计背景色，只移除与背景色接近且连接到边缘的像素，并对边缘做透明度羽化。
- **Rationale**: 现有演示和推荐图以棚拍/白底为主；该方案不上传新增第三方、不需要密钥、不覆盖原图，失败可立即退回原图。
- **Alternatives considered**:
  - `@imgly/background-removal`：浏览器端效果更强，但当前公开包采用 AGPL，直接集成会改变项目许可边界，因此不采用。
  - remove.bg 等云服务：质量更高，但需要用户确认供应商、费用、密钥和图片出境/隐私边界，留给后续专业抠图 SDD。
  - OpenAI 图像编辑：可能重绘衣物，违背“真实衣物不改款”的核心要求。

## Decision 3：使用原生 Pointer Events 与 DOM transform

- **Decision**: 拖动期间通过元素 ref 和 `transform` 更新视觉位置，抬手时才提交 React 状态；缩放、旋转和层级使用离散按钮。
- **Rationale**: 不增加拖拽依赖，避免每个 pointermove 触发整棵 React 树重渲染，兼容鼠标、触摸和触控笔。
- **Alternatives considered**: 引入画布/拖拽框架会扩大 bundle 和学习成本；自由缩放手势在首版容易与页面滚动冲突，因此首版使用明确控件。

## Decision 4：浏览器 Canvas 生成分享 PNG

- **Decision**: 将卡片背景、标题、品牌文字和当前衣物位图按同一相对变换绘制到 1080×1350 Canvas，再使用 Web Share API 或下载回退。
- **Rationale**: 输出确定、无需服务端截图和新依赖；通过 `fetch → Blob → createImageBitmap` 载入签名图，失败时明确中止而不是导出残缺图片。
- **Alternatives considered**: DOM 截图库会新增依赖并受 CSS 支持差异影响；公开分享链接会扩大隐私和访问控制范围，当前不做。

## Decision 5：私有派生图和当前用户画布由 RLS 隔离

- **Decision**: 抠图路径固定为 `<auth.uid()>/cutouts/<wardrobe-item-id>.png`，画布新表以 `user_id` 建立四类所有权 RLS，所有外键和 RLS 过滤列建立索引。
- **Rationale**: Supabase 当前文档要求私有签名 URL 具备 `SELECT`，覆盖上传需要 `INSERT + SELECT + UPDATE`；现有 bucket 已具备对应的用户文件夹策略。
- **Alternatives considered**: 公共 bucket 或仅依赖页面隐藏都无法满足账号隔离。
- **Documentation**: Context7 `/supabase/supabase`；Supabase 2026-09-01 changelog 复核未发现影响当前 Storage/RLS 客户端的破坏性变更。

## Decision 6：Server Action 只接收变更，不信任客户端归属

- **Decision**: Action 每次使用 `auth.getUser()` 派生账号，只接收画布 ID、衣物 ID、标题、主题和受限变换值；服务端重新读取当前用户衣物和推荐。
- **Rationale**: Next.js 16.3.1 项目内文档明确 Server Action 是可被直接 POST 的安全入口，必须在内部鉴权、授权和验证输入。
- **Alternatives considered**: 从客户端提交完整数据库记录或 user_id 会扩大越权风险。

