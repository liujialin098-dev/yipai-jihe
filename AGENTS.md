# 项目开发说明

## SDD-042资讯卡精简增量（2026-09-09，当前功能覆盖）

- 用户确认移除“来源标题简述 · 非全文摘要”、重复标题的说明段和“内容详情与时效”折叠区。当前资讯只由来源标题整理，因此统一保留轻量“标题速览”，不伪装成全文摘要；不再渲染summary/reason/获取时间/有效期，但数据字段与后台过滤、排序、缓存均不变。
- 底部展示来源与发布时间，使用time语义；阅读原文改为可见文字按钮，保留新窗口提示、noopener noreferrer/no-referrer和阅读状态失败提示。标记已读和ImpressionTracker保留；旧ContentDetails文件不删除，但不再挂载。
- 保持既有字体、颜色和动效；footer分行且操作可换行。check/build/042通过，source-summary/reading-guide/未声明类型、标题转义、未读隐藏及外链安全固定测试通过。375px浅色、320px深色、844px横屏实际组件隔离样本无溢出，按钮高44px，浏览器error为空；不宣称真实登录后读状态写入验收。完整真机最大字体仍待补。后续部署记录见最新Production节。

## 最新Production：SDD-042（2026-09-09 14:53，覆盖下方旧发布记录）

- 项目 `yipai-jihe` / `prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team `jialin-d583`；源提交 `17074b2`，部署 `dpl_4cgNbmMZrS8n9Nkx4Zqot1uyc1Nn`，部署URL `https://yipai-jihe-n3ujejs90-jialin-d583.vercel.app`，正式链接 `https://yipai-jihe.vercel.app`。包含贴纸册居中、统一标题与文案精简。inspect确认Ready/production/正式别名；云端Next.js16.3.1构建14秒通过。
- 本轮check/build/042通过，11项生产配置名称已核对；复用既有project.json，不pull、不改密钥和权限，无关PRD/Logo草稿排除上传。首次上传fetch失败，ls确认没有新部署后重试成功。发布 `npx vercel deploy --prod --yes --scope jialin-d583`；核验 `npx vercel inspect yipai-jihe-n3ujejs90-jialin-d583.vercel.app --scope jialin-d583`；日志 `npx vercel logs dpl_4cgNbmMZrS8n9Nkx4Zqot1uyc1Nn --level error --since 30m --scope jialin-d583`。Context7 `/vercel/vercel`已复核；部署技能用于项目锁定与发布后检查。
- 正式首页/login/stickers/inspiration无会话HTTP GET均200，公开CSS为200且包含新title-page-size和app-page-heading；资讯与CSS首次TLS失败，单次重试成功。最近30分钟error日志无记录。以上仅证明入口及新版样式可用，不替代登录后浏览器交互与真机验收；本轮未进行登录后视觉复验。

## SDD-042已发布功能与边界

- 新增无状态PageHeading，贴纸册/资讯/衣橱/日记/添加编辑复用全宽居中标题；不得用右侧装饰挤占宽度造成伪居中。资讯标题缩为“时尚灵感”，移除介绍段落与装饰口号；其他页面同类介绍节点显式删除，不全局隐藏p或app-page-lead。
- 标题统一使用title-font与page/section/card字号token（页面24～28px、分区18px、卡片16px），同字重/字距、自然换行；首页Hello继续Fredoka品牌字形但字号归一。清理首页h2、资料昵称、衣物详情/卡片与资讯局部字号覆盖；保留原导航、配色及动效。
- 资讯推荐依据移入既有ContentDetails，来源、日期、简述性质和外链保留；错误、加载、身份风险、表单提示与天气归因不得隐藏。没有数据/鉴权/供应商/权限变更。
- check/build/042/015/029/030/034/035/037/041通过。027离线通过、联网鉴权fetch失败，未标记全通过。实际标题/资讯卡的隔离浏览器样本320px深色、375px浅色、844px横屏无溢出，标题中心差0，详情可展开，error为空；不冒充完整账号端到端。真机最大字体及完整页面复验待补。
- ui-ux-pro-max/frontend-design用于保留品牌并统一标题层级、精简介绍；React复核无新增请求/effect。运行 `npm run verify:sdd-042`；视觉样本 `node --no-warnings scripts/verify-sdd-042.mjs --preview`（3042），不读账号。后续用户要求发布后已完成上述042生产部署；进度见progress.md。

## 最新Production：SDD-041（2026-09-09 13:17，覆盖下方旧发布记录）

- 项目 `yipai-jihe` / `prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team `jialin-d583`；源提交 `c2b85d1`，部署 `dpl_EEstrUkgAuhF8MbQFLLzPCMvQZAY`，部署URL `https://yipai-jihe-dwm5hdy8h-jialin-d583.vercel.app`，正式链接 `https://yipai-jihe.vercel.app`。衣服→E平滑开屏与加载已发布；inspect确认Ready/production/正式别名，云端Next.js16.3.1构建17秒通过。
- 本轮check/build/041通过，11项生产配置名称已核对，复用正确project.json，未pull、改密钥或权限；无关PRD/Logo草稿排除上传。发布 `npx vercel deploy --prod --yes --scope jialin-d583`；核验 `npx vercel inspect yipai-jihe-dwm5hdy8h-jialin-d583.vercel.app --scope jialin-d583`；日志 `npx vercel logs dpl_EEstrUkgAuhF8MbQFLLzPCMvQZAY --level error --since 30m --scope jialin-d583`。Context7 `/vercel/vercel`已复核。部署/CLI技能用于锁定项目、保留配置和发布后验收。
- Windows Invoke-WebRequest验证正式首页HTTP200且含最终动画引用，两份SVG均HTTP200并与本地提交内容完全一致；最近30分钟error日志无记录。Node fetch失败、内置浏览器打开77秒超时，线上实时播放和登录后交互尚未复验，不能以资源可用或Ready替代；手机减少动态、最大字体和弱网仍待补验。

## SDD-041已发布功能与边界

- 用户批准最终版：衣服平滑变成E，纯浅丁香/深夜紫背景，无泡泡、光晕和扫光。全程使用同一个SVG、固定丁香/青柠双色；外轮廓及两个色块同步插值，停留E时不换图。文字保留420ms/470ms时序，开屏约1.35秒退出；加载3.2秒往返，120ms后显示。
- 最终资产 `public/brand/ensemble-shirt-morph.svg` 与 `ensemble-shirt-morph-loop.svg` 已由共享BrandMotion接入根布局LaunchSplash、app/loading.tsx及会话返回等待。完整打开/刷新播放一次，站内导航不重复；覆盖层始终不接管指针。正式PNG仅用于减少动态静态降级，其他入口品牌图标不变。
- 六条端点轮廓使用64段连续三次B样条贝塞尔曲线，5位精度、geometricPrecision。12条资产轮廓接缝最大误差0.00002；禁止用模糊、新描边或收尾换图掩盖边缘。保留深浅、安全区、窄屏及减少动态/透明度降级，无新依赖、业务数据或权限变化。
- 验证：check/build/041及036/030回归通过；隔离预览实时形变与多尺寸日夜检查通过。本次生产构建在本地3016启动，首页HTTP200且含开屏和最终SVG引用，两份SVG均HTTP200。不将HTTP/隔离视觉检查写成登录业务端到端。
- 最终版已按用户后续“更新部署”要求发布，当前Production为SDD-041，进度见progress.md。手机系统减少动态、最大字体、弱网与线上首次播放待补验。Web开屏在根布局返回后播放，不覆盖首次网络连接等待，也不是原生系统启动页。

## 最新Production：SDD-040（2026-09-08 23:13，覆盖下方旧发布记录）

- 已发布项目 `yipai-jihe`（`prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team `jialin-d583`）；源提交 `c6c9e87`，部署 `dpl_54YV7QY1rYJHhiAgDxai5JmCb3tf`，部署URL `https://yipai-jihe-c3z8sd54m-jialin-d583.vercel.app`，正式链接 `https://yipai-jihe.vercel.app`。橡皮擦、四边拖裁、统一导出几何均已包含。inspect确认production/Ready/固定别名，云端构建22秒通过；最近30分钟error日志无记录。
- 本轮复跑check/build/040通过；11项Production环境变量名称已核实，既有project.json正确，未pull/更换密钥或修改访问策略。部署命令 `npx vercel deploy --prod --yes --scope jialin-d583`；核验 `npx vercel inspect yipai-jihe-c3z8sd54m-jialin-d583.vercel.app --scope jialin-d583`；日志 `npx vercel logs dpl_54YV7QY1rYJHhiAgDxai5JmCb3tf --level error --since 30m --scope jialin-d583`。Context7 `/vercel/vercel`已复核。测试fixture文件、无关PRD和品牌草稿排除上传。
- 本机正式域名HTTPS连接20秒超时，内置浏览器读取既有贴纸页52秒超时；没有取得本轮HTTP成功或线上点击证据，不能据此标记登录后编辑/下载/分享通过。待连接恢复后补验；无错误日志不替代真实功能复验。

- 贴纸画板选中就绪透明衣物后可打开人工橡皮擦：最长1280px编辑、8～64px笔刷、擦除/恢复本次透明源/最近6笔撤销/重置、脏稿退出确认、保存失败保留编辑。只修改当前单品透明贴纸，原照片不变；旧410抠图编辑路由继续停用。恢复不能带回原照片背景。
- 专用 `/api/stickers/items/[id]/refine` GET/POST：当前 `auth.getUser()`、活跃衣物归属和私有路径复验；GET返回私有PNG和ETag路径哈希，POST仅同源、3MiB PNG、1280²像素及有效透明通道、If-Match。双UUID工作图/展示图成功后才按id/user_id/status/旧cutout_path比较更新；版本冲突409。请求结果不确定时先复查指针，不得误删除可能已生效的新图；旧透明图和原照片保留，本期没有历史版本UI。没有新表、权限或供应商配置。
- 裁切模式在四边显示44px拖柄；旋转逆变换后按局部坐标裁切0～40%，pointercancel还原，键盘和「精确调整」滑杆保留。普通模式显示四角缩放/旋转，避免八柄相撞。裁切仍为v2本设备画板数据。`stickerRenderGeometry` 统一PNG的正方形裁切坐标与loose贴纸4%留白，禁止恢复按原图长宽裁切的旧导出差异。
- 验证：check/build、040/034/035/036/039/007通过；040联网双匿名会话真实保存、自身读取、跨账号拒绝、旧版本拒绝、原图与旧透明图保留通过。仅清理本轮合成衣物和4个私有PNG，不删除匿名Auth用户。实际React画板/橡皮擦在本地隔离HTTP样本完成390px旋转下边拖裁、擦除碎片/撤销/恢复/取消确认/保存回显，以及375px暗色、844px横屏无溢出、Escape焦点恢复、0浏览器error。样本HTTP保存不冒充登录浏览器端到端；本人照片、真机触控与分享仍待复验。
- 测试命令 `npm run verify:sdd-040`；联网 `node --env-file=.env.local --no-warnings scripts/verify-sdd-040.mjs --live`。`node scripts/serve-sticker-040-fixture.mjs` 在127.0.0.1:3040运行实际组件的合成内存样本（mock图片接口与next/image，仅用于交互，不连接账号或供应商）；浏览器通过CUA操作，不注入用户状态。
- 2026-09-08 Context7 `/supabase/supabase` 与Supabase changelog复核：私有Storage下载需用户鉴权或短期签名；沿用受RLS约束的用户客户端，不使用service_role。开发轮未部署，后续用户要求发布后已完成上述SDD-040生产部署；进度以progress.md的040节为准。

## 当前有效决策：SDD-030 至 SDD-039（2026-09-08）

- **最新Production发布：SDD-039（2026-09-08 21:53，覆盖下方未发布/旧部署记录）**：项目 `yipai-jihe` / `prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team `jialin-d583`；源提交 `13d2364`，部署 `dpl_7JhasNyXGMafiPNj2X3AHvdnhBcu`，部署URL `https://yipai-jihe-664w7bxry-jialin-d583.vercel.app`，正式别名 `https://yipai-jihe.vercel.app`。包含首页最多8件与六色实心描边。inspect确认Ready/production/别名，云端Next.js16.3.1构建14秒通过；首页、login、stickers、recommendations的无会话HTTP GET均200（不等于登录后功能验收），30分钟error日志无记录。内置浏览器重载超时，登录后真实照片/下载/分享未完成复验。
- 本次发布复用既有正确project.json，未pull、改密钥或访问策略；发布 `npx vercel deploy --prod --yes --scope jialin-d583`，核验 `npx vercel inspect yipai-jihe-664w7bxry-jialin-d583.vercel.app --scope jialin-d583`，日志 `npx vercel logs yipai-jihe-664w7bxry-jialin-d583.vercel.app --level error --since 30m --scope jialin-d583`。Context7 `/vercel/vercel`已复核prod/inspect命令；原有11项生产变量名称齐全，无关素材/PRD仍未追踪且未上传。

- **SDD-039 本地增量，尚未发布**：首页始终从当前可见衣橱就绪透明图选最多8件，按类别优先去重；拼图明确叫「衣橱拼图」，不是推荐中的一套，不改写真实推荐。无足够贴纸只展示实际数量。共享GarmentSticker用512px有界alpha圆盘膨胀产生实心轮廓，默认白色，禁止恢复放大白色副本或轮廓drop-shadow；cutout悬停不能单独缩放衣物使描边错位。首页「描边」折叠色点与贴纸画板可选白/丁香/青柠/珊瑚/天蓝/墨色，用设备localStorage记忆，不保存账号或原图；所有共享贴纸与PNG导出复用此颜色和轮廓算法。读取失败保留实拍，缓存上限64，不触发付费抠图。check/build与039/037/038/031/034/035/036/007通过，390/375px与横屏合成透明样本通过；真实照片和完整下载/真机分享尚待复验。详见progress及039/quickstart；本条覆盖下方白边阴影、有推荐时只展示3～7件的旧约定。

- **最新Production发布（2026-09-08 21:12，覆盖下方所有未部署历史记录）**：项目 `yipai-jihe`，源提交 `d2e4832`，部署 `dpl_CtCoGe4J7qHxdqQSYpZCizNQuMUo`，URL `https://yipai-jihe-7jvd4n3e5-jialin-d583.vercel.app`，正式别名 `https://yipai-jihe.vercel.app`。inspect确认Ready/production/正确别名；云端Next.js16.3.1构建通过（约15秒）。包含036导航/夜间模式、037居中问候/透明拼图/每日推送入口、038入库自动制贴。生产11项配置名称已核对，百度双Secret存在；不得推定真实抠图已通过。最近30分钟error日志无记录；本设备正式域名HTTP连接20秒超时，浏览器加载亦超时，线上交互/真实照片制贴仍待网络恢复验收。
- 本次复用已核对的 `.vercel/project.json`，未重新link或env pull，避免覆盖本地配置；发布指令 `npx vercel deploy --prod --yes --scope jialin-d583`，检查 `npx vercel inspect yipai-jihe-7jvd4n3e5-jialin-d583.vercel.app --scope jialin-d583`，日志 `npx vercel logs yipai-jihe-7jvd4n3e5-jialin-d583.vercel.app --level error --since 30m --scope jialin-d583`。Context7 `/websites/vercel` 复核当前deploy/inspect用法。未修改权限、域名或密钥；无关Logo备选与PRD保持未追踪，并通过.vercelignore排除部署。

- SDD-038 入库贴纸：单件/批量确认成功后，添加页自动调用现有 `/api/stickers/items/:id`，单并发且相邻请求间隔4秒，60秒客户端超时；已完成/处理中同ID不重复排队，失败仅显式重试。入库与贴纸状态独立，失败不回滚衣物或伪造透明图；只有真实就绪URL才复用GarmentSticker白边与阴影预览。页面卸载取消未开始任务，必须告知用户暂留或到贴纸页继续，不宣称持久后台队列。待制贴时不能清空满批次。无新表、无供应商/权限变更、无首页自动抠图。代码check/build与038/033/037/007通过；本地百度双密钥缺失，真实供应商联调和Production仍未完成。SDD-018历史城市文案断言失败单独保留，不修改天气来迎合测试。

- SDD-037 首页最新增量：五日手帐下增加「每日推送」轻量整行入口，进入 `/inspiration`。复用日夜主题、青柠图标与浅紫表面，不能恢复资讯大卡堆叠；关闭入口预取，不新增首页内容查询、未读计数、通知订阅或系统推送。check/build、037固定渲染、日夜截图与实际资讯页跳转已验证；仅本地，未部署。

- SDD-037 最新视觉覆盖下方气泡历史方案：问候居中，Hello复用 `brand-name-english` 的本地Fredoka与顶部粗体；日期天气维持小字行。主拼图仅展示 `cutoutUrl` 有值的当前账号衣物，用 `GarmentSticker surface="loose"` 白色轮廓与阴影组成无独立底板的整体；不得恢复拱形/圆形照片气泡。无推荐选最多8件就绪贴纸；有推荐只选本套就绪贴纸并显示完成数量；无就绪贴纸进入 `/stickers` 制作，不自动付费处理或伪造透明图。日记缩略图的原图降级不受影响。本人抠图状态由既有服务维护；此次没有写入衣橱或调用抠图。

- SDD-037 首页增量：主问候为 `Hello, <viewer.displayName>`，只使用个人资料昵称；空白昵称使用“朋友”，不得用邮箱或ID替代。日期与天气在同一12px辅助行，来源通过44px信息按钮展开；长值允许自然换行，不删除归因或真实失败/过期状态。无推荐时 `homePreviewItems` 按不同类别优先、去重选取最多8件当前可见衣物，已有推荐仍只展示该套3～7件。`homeLookPositions` 为1～8件提供非等大错落构图，原图完整contain于拱形/软矩形/不对称圆角底板，已有透明图保留纸贴，不复制衣物或自动调用AI。check/build及037/036/032/033/015/007通过；390px日夜、320px无溢出、来源展开已验收，天气日期行实测44px；仅本地未部署。

- SDD-037 首页改为每日穿搭手帐：仅保留今日穿搭与最近五日记录两个业务区，取消重复衣橱数量/资讯/账号大卡和功能说明。`components/home/daily-edit.tsx` 默认服务端展示，读取既有当前用户、当日、有效城市且已复验的推荐第一套；没有推荐仅显示明确标注的衣橱预览，空衣橱/读取失败不得混淆。手帐按账号日记时区连续五天，跨月复用两个月读取，代表单品仅从当前可见衣物选择且收藏优先；不生成或写入日记。
- 首页天气复用 `WeatherPanel compact` 的同一前端和风请求、5分钟失效与中止机制，失败/未选城/过期不展示猜测温度。日期与来源留轻量入口，完整推荐页天气不变。无会话首页继续使用原登录/注册/体验网关；体验身份只留“保存我的衣橱”。本阶段无数据库迁移、权限变更、新依赖或自动 AI/抠图调用。
- SDD-037 本地 check/build、037/036/032/033/015/007 验证通过；390px 日夜、真实天气/过期提示和往日编辑入口已复核。320px 修复历史 body 最小宽度叠加滚动条造成的溢出，实际 clientWidth/scrollWidth 均305px，日期点击区宽46px以上。数据读取边界复用原模块；有推荐/有日记/空衣橱/错误状态采用固定组件渲染测试，不宣称为本次真实模型端到端验收。Production 仍为 SDD-035，尚未部署036/037。

- 中央添加按钮最新造型为连续圆角矩形：`.dock-add` 最大 62×46px、18px 圆角，窄屏自适应；不得重新加入历史多边形切角。日夜悬停与按压使用同色系轻变化，按压缩放 0.97 并遵循减少动态设置。

- SDD-036 覆盖下文历史导航与强制浅色规则：底部固定为首页 `/`、推荐 `/recommendations`、中央添加 `/wardrobe/new`、贴纸 `/stickers`、资讯 `/inspiration`，只显示 Lucide 图标但必须保留 `aria-label`、title、当前页标记和至少 44px 点击区。顶部保留衣库与头像，增加收藏 `/diary?view=favorites` 和一键日夜开关；日记/收藏/利用率三页签继续保留。配置唯一来源为 `lib/ui/navigation.ts`。
- 全局日夜主题保存在本设备 `ensemble-theme-v1`，无值时首屏跟随系统；`lib/ui/theme.ts` 在首屏绘制前初始化 `.light/.dark`，存储受限时仍能切换。深色使用暖夜紫表层、低饱和青柠顶部和丁香底部，不得反转衣物图片、改变画板自选底色或把主题写入账号数据。复用本地 Fredoka/ZCOOL 授权字体，圆润 Latin/数字与原中文标题配对；禁止运行时依赖外部字体 CDN。
- 页面动效由 `PageMotion` 统一处理：主要入口根据导航顺序做 240ms 方向切换，查询页签只淡入；Pointer Events 支持首页→推荐→贴纸→资讯左右滑动，跳过添加表单。画板、按钮、输入、横向滚动区、弹窗及 28px 边缘保护区不得启动页面滑动；垂直移动、多指、pointercancel 必须安全取消。减少动态关闭位移。贴纸默认不选中，点击空白或 Escape 仅清除选中状态及四角工具，不修改草稿布局与衣物轮廓。
- SDD-036 已完成本地实现及核心浏览器验收，尚未部署。check/build 和 036/035/034/030 门禁通过，029 历史渲染回归通过。320/375/390px 与 812×390 横屏无水平溢出；主页→推荐左右拖动、画板拖动不翻页、空白取消选择、刷新保持夜间主题和顶部收藏入口均已实际复核。真机多指/系统边缘手势、系统减少动态及 Production 复验仍需后续集中验证，不等同于已通过。
- 2026-09-08 Context7 `/vercel/next.js`：静态预渲染中使用 `useSearchParams()` 的客户端组件必须在 Suspense 内；AppShell 的 PageMotion 保留原页面作为 fallback，避免切页动效使 404/静态构建失效。主题初始化是无外部请求的首屏内联脚本，不包含账号或密钥。

- SDD-035 修复 SDD-034 置顶/置底被旧 `zIndex` 排序抵消的问题：层级变化后必须按新的数组顺序直接重编号。贴纸草稿版本升级为 v2，并兼容读取 v1；每件贴纸保存上/右/下/左四边非破坏裁切比例，单边不超过 40%，相对两边总和不超过 72%，画板与 PNG 导出必须复用同一裁切、旋转、缩放和层级。选中贴纸的中央区域用于移动，四角 48px 控件分别用于缩小、顺时针旋转、逆时针旋转和放大；控件必须处于独立操作覆盖层，不能被更高层贴纸遮挡。顶部左侧固定进入衣库，底部固定为首页/日记/贴纸/收藏/推荐，贴纸为中央主入口。日记默认显示完整当月日历，空月不得隐藏日期；过去与当天可添加代表单品，未来只读。利用率贴纸墙只使用最近 30 天真实日记中的去重单品，最多 24 件，空状态不得造数据。本阶段已部署 Production；当前设备连接 Vercel 域名超时，线上客户端页面验收待补。

- SDD-034 覆盖 SDD-033 的固定自动排布限制，在独立 `/stickers` 页面恢复且仅恢复衣物贴纸创作：提供无格子、无吸附的 4:5 自由画板，当前账号当天选择的 1～8 张贴纸可用 Pointer Events 拖动、键盘或按钮微调、滑杆缩放/旋转、置顶置底并自由重叠。画板背景分为 5 个浅色与 4 个深色，深色必须使用高对比文字和亮色选中轮廓；屏幕与 PNG 导出复用同一配色。背景、变换与层级按账号短标识和自然日保存在当前设备，恢复时必须与服务端可见衣物取交集。只有所选衣物全部具有当前有效 `cutoutUrl` 时才能导出 1080×1350 PNG；系统文件分享不可用时降级为下载，图片不得包含账号、私有路径或内部字段。月历只查询当前用户当月 `outfit_diary_entries` 与单品收藏：当天收藏衣物优先，否则使用日记顺序第一件；不得补造空白日或新增“每日代表衣物”表。继续禁止 Grid/吸附、Reel、MP4、直播、转盘、烟花播放、自动轮播和公开社交发布。当前已部署 Production 并完成 390px 浅色/深色主题验收；本人真实透明贴纸下载/分享仍待集中复验。

- SDD-033 根据用户决定新增独立 `/stickers` 衣物贴纸册，这是 SDD-030“停用默认抠图入口”的唯一当前例外。用户可从当前账号活跃衣物或单品收藏选择当天 1～8 件；当天 ID 只按日期和当前身份短标识保存在本设备，并在恢复时与服务端可见衣物取交集。已有 `cutoutUrl` 直接使用 loose 白边纸贴，不得重复请求；只有原图时必须显示完整纸卡和“待生成”。专业去背只能由用户点击“生成贴纸”触发，专用 `POST /api/stickers/items/[id]` 只接受 UUID，必须同源、`auth.getUser()` 鉴权并复验当前用户活跃衣物归属，再复用 SDD-026 百度去背、Sharp 裁边与私有 Storage。503 后停止继续排队并保留原图。旧画布抠图 route 继续为 410；人工擦除/恢复和虚拟人物仍不得接回，画板与月历能力以 SDD-034 为准。Production 已完成 1 件隔离样本真实去背并部署。

- SDD-032 将 SDD-031 的衣物纸贴展示合同扩展至首页衣橱预览、衣物详情主图、日记选择与记录、收藏和利用率；各入口必须同时传入既有 `cutoutUrl` 与原图，透明图优先、普通照片完整降级、缺图保持原占位。图片层和装饰层必须 `pointer-events: none`，不得遮挡链接、收藏、复选框或保存操作。添加衣物/AI 识别工作区 MUST 保留原始照片核对，不得套用贴纸装饰。本阶段仅消费历史透明图，不新增网络请求、图片写入、数据库、Storage 或账号变更，也不得恢复 SDD-030 已停用的抠图、画布、分享或人物入口。当前仅本地完成，Production 仍为下述 SDD-030 部署。

- SDD-031 在不恢复抠图操作入口的前提下，为衣橱、推荐单品和换件候选统一增加衣物纸贴材质：已有 `cutoutUrl` 时优先显示透明图，并以独立白色轮廓层、丁香调轻阴影和底层纸纹增强层次；只有 `imageUrl` 时使用完整圆角纸卡，严禁给矩形原图伪造衣物外轮廓。材质不得改变衣物颜色或像素，不得新增网络请求、图片写入、数据库变更或账号权限。减少动态必须取消抬升/缩放，减少透明度必须关闭纸纹。当前仅本地完成，Production 仍为下述 SDD-030 部署。

- SDD-030 代码、品牌视觉、动态标题、反馈画像、每日可信趋势和最新导航均已发布 Production；当前部署源提交为 `275ef04`。真实千问联调仍因未配置百炼凭据而未完成。圆润粗体字标提交为 `5bb80e6`，用户选定的青柠/丁香折叠 `E` 主标提交为 `1e17950`。以 `progress.md` 的 SDD-030 清单为准。以下历史 SDD-024/026/029 中“画布、卡片分享、自动/专业/人工抠图及近期作品展示”约定已被本次用户决定覆盖，不得恢复默认入口。
- SDD-030 最新线上导航：顶部青柠栏为左侧圆形日记、居中品牌、右侧圆形头像，个人主页仍只通过头像进入；底部使用浅紫材质并固定为首页、衣橱、中央添加、推荐、资讯五项，所有可见标签统一两个汉字。日记页继续合并日记、收藏、利用率，旧 `/favorites` 重定向到收藏栏。
- 底部固定为 **首页 / 衣橱 / 添加 / 推荐 / 资讯**，添加在正中央且最突出，视觉控件使用四角切面的倒角矩形而不是圆形；底栏使用克制的浅紫材质。日记内合并收藏与利用率，并由顶部左侧圆形按钮进入。顶部青柠软渐变浮动圆角壳层保持日记/品牌/头像三点平衡，个人主页不得恢复独立文字入口。上下栏视觉高度差保持在约 8px 内，四周保留背景间距；滚动时保持 sticky/fixed 完整可达，不得被正文、头像或标题覆盖。应用外壳使用 `overflow-x-clip`，不得恢复会破坏 sticky 的 `overflow-x-hidden`。
- 当前底色使用灰调浅雾丁香 `#eee6f5 → #f5eff9 → #fcfafe`，中性交互紫为低饱和 `#745c8f`。页面主标题使用自托管 OFL 站酷快乐体，字号缩小居中；正文沿用系统字体。交互反馈 MUST 保留语义色：原本黑色或白色的紧凑控件可转为克制紫色；青柠、丁香、珊瑚、天空蓝、成功绿和危险红控件只能在自身色相上做明暗/饱和度变化，不得统一染紫。卡片、统计区、整行入口等大面积 UI 只允许极浅叠层、边框或景深变化，不得整块换色。底部 Dock 必须脱离通用按钮填充规则：导航项本体始终透明，普通项仅用浅紫气泡和轻微位移反馈，中央 56px 添加按钮单独使用灰调薰衣草色；不得整块反白、闪成深紫或恢复五项随机变色。禁用、键盘焦点和减少动态规则继续保留。
- 英文品牌名固定为 **Ensemble**，中文“衣拍即合”作为辅助签名，不改产品中文名称。顶部 Header、首次登录/注册入口、登录页和浏览器 Metadata 使用同一双语标识；英文只使用自托管圆润粗体 `Fredoka-Variable.ttf`，当前字重 640、紧凑负字距，中文与正文不得套用该拉丁展示字体。字体来自 Google Fonts 官方仓库并随 `OFL-Fredoka.txt` 保存 SIL OFL 1.1 许可证，运行时不得请求第三方字体 CDN。此前 Cormorant Garamond 已按用户反馈移除，不得恢复偏细的时装衬线字标。
- 推荐仅显示原图单品、换件、收藏、日记，不显示卡片编辑。`/outfits/new` 和 `/outfits/[id]` 跳转推荐；旧保存 actions 返回错误；抠图及精修 routes 返回 410/no-store；入库确认不再执行 `after()` 抠图，批量确认仍 2 路但取消抠图专用 4 秒等待。不删除任何历史数据库或 Storage 资产。
- 个人主页保留头像昵称编辑及衣物数、日记数、30 天利用率三项统计；`lib/profile/data.ts` 不再查询或签名画布。沿用当前账号 getUser 与 RLS，不增加公开主页或社交能力。
- 每日推荐改用 `lib/recommendations/qwen.ts` 北京百炼 Chat Completions，默认 `qwen3.8-max`。配置 `DASHSCOPE_API_KEY`、`DASHSCOPE_API_HOST`（仅北京工作空间域名）及可选 `QWEN_RECOMMENDATION_MODEL`，全部服务端变量，禁止 NEXT_PUBLIC_ 或日志泄露。严格 JSON Schema、非思考、4096 输出 token、25 秒整体请求截止、不自动重试；仍做天气/归属/场景/分层/不重复复验。旧 OpenAI 每日推荐调用不再使用；图片识别与资讯摘要仍沿用原有 OpenAI，不误报为全部 AI 已迁移。
- 每日推荐标题 MUST 为 4～16 个字符、批次内 3/3 唯一并命中首个 `styleTag` 的风格语义；拒绝“方案一/今日推荐/休闲搭配”等编号式或通用模板。AI 与规则后备共用 `lib/recommendations/outfit-title.ts` 复验，规则名称按主色、天气与风格变化，不能恢复固定前缀。
- 个性化“学习”是可解释的请求期画像，不训练用户专属基础模型：复用当前账号 `preferred_styles`、`preferred_occasions` 与反馈账本汇总的 `style_scores`，最多传 5 个非零风格分数；`fashion_personalized=false` 时 learnedStyles 必须为空。不得把用户 ID、邮箱、头像、原始事件或完整衣橱描述扩展到趋势服务。
- 动态趋势复用 SDD-027 的 Vogue/GQ 可信 RSS、24 小时服务端缓存、发布日期和有效期，只向模型传最多 4 条标题级元数据及来源 URL；未来、过期或非 HTTPS 来源不得进入。上游失败时使用空趋势上下文且不得声称参考了最新流行。排序优先级固定为场景/天气/衣物归属与完整性 > 用户明确选择与偏好 > 当日趋势。
- 失败分为配置缺失/配置无效/鉴权/限流/超时/供应商故障/响应截断/搭配校验不合格；日志只含受控类别、状态码、provider/model（成功时）和真实模型耗时。仅真实天气成功后允许一次规则后备。数据库 `generation_ms` 暂保留原表 15000 上限，不可当作完整请求耗时；25 秒模型预算覆盖旧推荐 15 秒目标，不影响天气失败必须停止的规则。
- 百炼凭据尚未配置，不得宣称真实模型已验收。Context7 已查询 `/dashscope/dashscope-sdk-python`，并核对百炼官方 `https://help.aliyun.com/zh/model-studio/qwen-structured-output`；本地 Next.js 字体指南确认 next/font/local 无浏览器 Google 请求。
- 验收命令 `npm run check`、`npm run build`、`npm run verify:sdd-030`；推荐个性化增量另回归 014、017、027。兼容门禁 007/024/025/026/029 已更新为新用户决定，同时保留历史算法与数据隔离检查。2026-09-06 用户明确要求后，动态标题、偏好/趋势上下文与青柠浮层已部署 Production。Production 未配置 `DASHSCOPE_*`，因此每日推荐继续以真实天气规则后备运行，不得把本次发布写成千问真实联调完成。

## 技术栈

- Next.js 16.3.1 App Router、React 19、TypeScript；Sharp 0.34 仅用于服务端透明图验证与裁边。
- Tailwind CSS 4、shadcn/ui（Base UI / Nova preset）、lucide-react。
- Biome 2.4.2；Husky 提交前自动执行格式化、安全 lint 修复和 TypeScript 检查。
- Spec Kit：`.specify/`；规范驱动开发文档以此目录为准。
- 项目章程：[`.specify/memory/constitution.md`](.specify/memory/constitution.md)。

## 项目速览

- `app/`：首页、衣橱列表与单品详情/编辑、AI 添加衣物工作区、推荐、时尚灵感、衣物贴纸册、历史自由穿搭画布、个人主页、穿搭日记/利用率、收藏、设置路由，以及匿名会话、衣物入库和贴纸生成 Route Handlers。
- `components/`：移动端应用外壳、统一品牌标志与开屏/加载动效、青柠日记/品牌/头像顶栏、浅紫五项底部导航、会话启动、衣橱筛选/纸贴卡片/表单、自由贴纸画板与月历、入库工作区、推荐换件、个人资料编辑、日记/收藏合并视图、偏好问卷和通用状态；`components/ui/` 保留 shadcn/ui 基础组件。
- `lib/auth/viewer.ts`：服务端当前用户最小读取；`lib/supabase/`：browser/server/proxy 客户端、公开配置检查和生成的数据库类型。
- `lib/openai/responses.ts`：Responses API 服务端传输；非 Windows 使用标准 `fetch`，Windows 本地使用 PowerShell 网络栈与 Base64 请求体，密钥只通过子进程环境传递。
- `lib/wardrobe/`：14 类衣物风格常量、品牌与字段校验、查询、衣橱组成判断、OpenAI 结构化识别和入库生命周期辅助；私有图片签名地址在服务端短期缓存并限制条目数。
- `lib/personalization/`：账号衣着偏好、衣物归属和共享可逆过滤规则。
- `lib/recommendations/`：账号城市、Vercel IP 城市建议与用户触发的设备城市解析、账号隔离的临时城市会话、有效位置选择、真实今日/明日天气快照、四场景共享画像与异场景硬边界、雨天防水角色、自动/指定风格方向、严格推荐契约、OpenAI 生成、差异化规则降级、分层角色派生、虚拟模特 Lookbook 提示与私有缓存、归属与搭配结构校验、来源化本季趋势快照，以及目标日期批次读取映射。
- `lib/recommendations/outfit-title.ts` 与 `personalization-context.ts`：动态风格标题契约、规则命名、反馈分数最小画像，以及 SDD-027 每日可信趋势的请求期筛选；无新增表或用户专属模型。
- `lib/feedback/`：同类合法候选、换件后完整复验、单品/整套收藏 Action、固定偏好权重、事件写入和风格分数重算。
- `lib/diary/`：日记输入校验、账号日期/月度读取、推荐/手工快照解析、30/90/全部范围的即时利用率聚合，以及最近 30 天真实穿着单品贴纸墙数据派生。
- `lib/stickers/`：1～8 件无格自由画板的初始布局、v1→v2 本地草稿迁移、非破坏裁切、变换限幅、稳定层级重排、本地状态清洗，以及 1080×1350 PNG 浏览器导出。
- `lib/outfits/`：穿搭画布主题、2～8 件初始布局、变换校验、浏览器本地纯色背景抠图、当前用户画布读取和 1080×1350 PNG 导出。
- `lib/profile/`：昵称、头像类型/大小/私有路径校验，以及个人主页当前账号统计与近期画布聚合。
- `lib/inspiration/`：Vogue/GQ 官方 RSS 白名单、每日来源/中文标题缓存、纯函数过滤与排序、稳定 URL ID 和 30 天账号主题展示记录；个性化复用临时城市优先、真实天气、近期场景和当前衣橱。未核实日期的编辑后备不得展示。
- `supabase/migrations/`：可复现数据库迁移；`scripts/verify-sdd-001.mjs` 至 `scripts/verify-sdd-007.mjs`、`scripts/verify-sdd-009.mjs`、`scripts/verify-sdd-012.mjs` 至 `scripts/verify-sdd-035.mjs`：双匿名会话、幂等、固定样本、推荐/日记/反馈隔离、天气/场景/风格、分层搭配、私有图片、个人主页、内容阅读状态与 UI 门禁。
- `specs/001-app-foundation/`、`specs/003-wardrobe-core/` 至 `specs/007-release-deploy/`、`specs/009-outfit-diary/`、`specs/011-global-motion/` 至 `specs/029-profile-style-refresh/` 已完成并发布；SDD-030 代码已发布但真实千问凭据联调仍未完成；SDD-031/032/033/034/035 已发布。`specs/002-account-binding/` 的无邮件注册与合成账号重登录已通过，本地历史账号设密与用户本人重登录仍等待集中调试。
- `README.md`：本地启动、环境变量、迁移、质量命令、5 分钟演示、部署和已知限制的交付入口。
- `public/brand/`：正式主标为 1024px 透明底青柠/丁香折叠 `E`（`ensemble-icon-a-folded-e.png`），旧主标与未选设计稿继续保留；页面统一通过 `components/brand-mark.tsx` 使用正式主标。
- `biome.json`：格式化与 lint 规则；`.husky/pre-commit`：提交卡控。
- 当前视觉基线：冷白画布和近黑文字为功能底层，青柠、丁香紫、珊瑚橙与天空蓝四个时尚 token 用于内容主题、导航选中态与个人主页；颜色 MUST 按固定角色复用，不得随机给所有容器上色。衣物图片按 SDD-031/032/033/034/035 使用纸贴规则：透明图为白色轮廓与丁香调轻阴影，原图为圆角纸卡，低对比纸纹只能位于衣物下方；首页、详情、日记、收藏、利用率、衣橱、推荐和贴纸册共用 `GarmentSticker`，上传识别核对除外。贴纸画板必须无格子、无吸附并允许重叠，可显式使用 `surface="loose"` 去掉矩形底板；其他入口默认保持 card。保留软圆角、Apple 式触感和固定底部玻璃 Dock。正式 Logo 继续复用 `BrandMark`。Liquid Glass 仅为 Web 材质近似，并提供减少动态与减少透明度降级。排版 MUST 复用六级语义 token；黑色按钮不得恢复高对比白色扫光。

## 注意事项

- **当前 Production（2026-09-08）**：`yipai-jihe` / `https://yipai-jihe.vercel.app`，部署 `dpl_Dt4pRMhEWrHg1ARqd22KRMy9k4NY`，源提交 `3b32a31`，Ready / production。SDD-027 至 SDD-035 当前代码、新版 `Ensemble` 主标、动态标题、偏好/趋势上下文、衣物贴纸册、四角自由画板、完整日记月历与最近 30 天贴纸墙均已上线；百炼凭据仍未配置，所以 SDD-030 继续为“部分完成”。Vercel 云端构建完整通过且最近 30 分钟无 error 日志；当前设备连接 `*.vercel.app:443` 超时，本次未取得新增功能的 Production 浏览器或核心路由 HTTP 证据，待网络恢复后补验。本人透明贴纸下载/分享、手机无代理/有代理、本人定位、真实千问和历史账号登录仍待集中验收。详见 progress.md。
- 本次发布：`npx vercel deploy --prod --yes --scope jialin-d583`；检视 `npx vercel inspect yipai-jihe-y1xg91tiq-jialin-d583.vercel.app --scope jialin-d583`。后续发布继续核对同项目、11 项生产配置名称及 Ready/production/固定域名，不得使用旧 ai-coding 项目。`vercel link --yes` 当前会刷新本地 OIDC；本次已核对既有 Supabase/OpenAI/百度/和风配置仍在，后续先保护本地配置，不得以完整 env pull 覆盖。

- 2026-09-06 发布配置：和风五项 `QWEATHER_*` 已安全保存为 `yipai-jihe` Production Secret，覆盖下文旧的“线上尚未配置”记录。`scripts/configure-qweather-production.mjs` 校验项目/团队与本机既有 Ed25519 密钥，默认 dry run，只有 `--apply` 经 stdin 写入、不覆盖已有变量、不输出私钥。Vercel Secret 导出只得到 `[SENSITIVE]`，不得作为有效本地凭据；部署与本机百度配置是不同任务，当前本机百度密钥仍缺失。

- SDD-029（2026-09-06）个人主页采用纯色丁香封面、突出头像昵称、横排真实统计与近期穿搭作品区；用户随后要求 App 底板采用浅紫到冷白的低对比渐变（#f0eaff → #f8f5ff → #fff），覆盖首版纯白决定，不恢复高饱和四色渐变。四色仍按固定角色用于内容与操作，正式 Logo、底部 Dock、原路由和私密边界不变。资料编辑默认为收起，原生 details 支持键盘；仅个人主页的 `OutfitCanvasPreview` 使用 `hideHeading` 将标题放到图外，不改原画布变换或分享图。减少常驻解释文案，生成快照在“生成信息”内按需展开，保留天气来源、权限隐私及真实错误。抠图失败提示简写，不代表专业服务已恢复。保留根节点既有固定浅色策略。验收为 `npm run verify:sdd-029`、check/build 和 390px/桌面浏览器；该阶段最初未单独部署，现已包含在当前 Production。

- SDD-028 和风天气（2026-09-06）：本地接入已实现，覆盖 SDD-012/013/018/020 中 Open-Meteo/BigDataCloud 供应商约定；位置主动确认、账号隔离和禁止模拟原则不变。服务端 QWEATHER_API_HOST、QWEATHER_DEVELOPER_ID、QWEATHER_PROJECT_ID、QWEATHER_CREDENTIAL_ID、QWEATHER_PRIVATE_KEY 签发 5 分钟 JWT；仅同源且 auth.getUser() 有效的 POST /api/weather/session 可取，返回 private,no-store，每账号每分钟 12 次进程级限频。浏览器天气和设备城市解析直连和风，私钥不得进入浏览器。推荐与灵感使用服务端独立真实天气，不能信任客户端温度。lib/weather/parse.ts 统一现象映射与日期解析，未知代码/异常单位/缺预报失败；明日最低气温必须注明 air_minimum，不得称体感。历史 Open-Meteo 快照保留原来源，不标为实时。
- 和风本机配置：setup-qweather-keys.mjs 必须复用 Git 忽略的 .env.qweather-private.pem，不轮换；准备文件 .env.qweather.local 不自动加载，configure-qweather-local.mjs 安全生成 .env.development.local，仅用于 dev，不覆盖 .env.local、不打印密钥。生产构建不加载 development 配置；Vercel 尚未配置和风五项环境或部署 SDD-027/028。生产前须复核供应商额度、浏览器凭据限制与国内手机无代理网络。验证：verify:sdd-028 固定解析/短 JWT，verify:sdd-013 真实和风两日与日期隔离；另回归 007/012/014/015/017/018/019/020，浏览器查真实直连、失败重试、跨城市与 390px。
- 2026-09-06 文档复核：Context7 `/websites/dev_qweather_en` 部分认证示例仍为旧版；以和风天气当前官方 `https://dev.qweather.com/docs/configuration/authentication/` 为准，JWT Header 为 `alg=EdDSA` 与 `kid`，Payload 同时包含 `iss`（开发者 ID）、`sub`（项目 ID）、`iat` 与 `exp`。测试使用 `/weather/v1/current/{latitude}/{longitude}` 与 `/weather/v1/daily/{latitude}/{longitude}` 新版接口，天气现象代码不能直接作为现有 WMO 代码使用。
- 优先复用 shadcn/ui 组件和主题 token，图标统一使用 lucide-react。
- 后续页面 MUST 延续当前视觉 token：卡片使用约 24px 软圆角，主要按钮使用胶囊或圆形，玻璃效果只用于导航和悬浮控件；丁香紫只作为四色体系的一部分，不得恢复单一紫色模板或在所有容器滥用毛玻璃。
- 修改后运行 `npm run check`；提交时 hook 会再次执行同一流程。
- 遵循 Server Component 默认边界，只有需要浏览器状态或事件时才使用 `use client`。
- 引入新库前先查本地 skill；缺少 skill 时使用 Context7，并把关键结论与 library id 记录在本文件。
- 当前 Context7 library id：`/biomejs/biome`、`/lucide-icons/lucide`、`/supabase/ssr`、`/supabase/supabase`、`/supabase/auth`、`/websites/developers_openai_api`、`/websites/vercel`、`/websites/ai_baidu_tech`、`/lovell/sharp`。
- 2026-08-25 复核 `/supabase/supabase`：匿名账号必须先用 `updateUser({ email })` 完成邮箱身份，再在同一有效会话用 `updateUser({ password })` 添加密码；关闭 Confirm email 后第一步应立即完成而无需邮件。无会话的历史账号只能由服务端密钥通过 `auth.admin.updateUserById` 处理，且不得暴露到浏览器。
- 2026-08-31 再次复核 `/supabase/supabase`：本次只通过可复现迁移扩展现有列与 CHECK 约束，不新增 Auth、Storage 或 RLS 模式；迁移后继续用生成类型、双账号真实写入和 Advisors 复核数据库边界。
- Supabase 项目：`next-app-supabase`（project ref：`gmjtzmxuveoaqcdmuifr`，区域：`ap-southeast-1`，状态：`ACTIVE_HEALTHY`）。
- 本地连接配置放在 `.env.local`，变量为 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；该文件已被 `.gitignore` 忽略。
- `SECRET_KEY` 仅保留模板，必须由开发者从 Supabase Dashboard > Settings > API Keys 手动填入，严禁写入浏览器代码、提交仓库或使用 `NEXT_PUBLIC_` 前缀。
- SDD-004 的 `OPENAI_API_KEY` 必须仅配置在 `.env.local` 和 Vercel 服务端环境；可选 `OPENAI_VISION_MODEL` 默认 `gpt-4o-mini`。浏览器不得读取这两个变量，OpenAI 请求必须使用 Responses API、`store: false` 和严格 JSON Schema。Windows 本地 Node.js 直连超时时统一经过 `lib/openai/responses.ts` 使用系统网络栈，密钥不得出现在命令参数、日志或响应中。
- SDD-022 的虚拟模特效果图为历史能力，当前默认 UI 已由 SDD-024 取消入口；若未来单独恢复，仍只能通过服务端 Image API 生成，密钥不得进入浏览器，生成图只能写入当前用户私有路径并先做归属校验。未经新的明确需求不得把历史 Lookbook 接回推荐页。
- SDD-024 已覆盖 SDD-022/023 的默认展示：推荐卡和穿搭编辑主路径 MUST 只展示当前推荐的真实衣物排布，不得出现固定人物、人物轮廓、虚拟模特或 AI 效果图入口。历史 Lookbook 与人物预览代码不得重新接回默认 UI。每张画布只能保存当前账号 2～8 件活跃衣物；服务端必须重新鉴权并复验衣物与来源推荐归属。浏览器本地抠图只作为近纯色背景备用，复杂背景必须保留原图。分享图为 1080×1350 PNG，不得包含邮箱、用户 ID、私有路径或原始推荐内部字段。
- SDD-025 起 `profiles.avatar_path` 只允许 `<auth.uid()>/profile/avatar-<uuid>.(jpg|png|webp)`；头像必须小于等于 5MB，读取只使用短期签名地址。浏览器上传后，Server Action 必须用 `auth.getUser()` 重新鉴权、验证对象实际存在并只更新当前账号；绑定成功后清理旧头像，失败时删除未绑定新对象。个人主页统计只聚合当前账号衣物、画布和日记；不得发展为公开主页、关注、评论或用户搜索。
- SDD-026 起专业去背采用百度智能云“智能抠图”API；用户于 2026-09-02 明确选择该国内方案，覆盖此前 PhotoRoom 决策。`BAIDU_API_KEY` 与 `BAIDU_SECRET_KEY` 只能配置在 `.env.local` 和 Vercel 服务端环境，不得使用 `NEXT_PUBLIC_` 前缀；Access Token 只能在服务端按 `expires_in` 缓存并提前 5 分钟失效。服务端先将当前账号原图规范化为百度尺寸与 Base64 上限，再固定请求 `method=auto`、`refine_mask=true`、`return_form=rgba`，Token 与抠图共享 20 秒超时；透明 PNG 保存为私有精修工作图，再由 Sharp 校验透明通道并自动裁边生成展示图。新版本展示图与工作图全部写入成功后才更新 `cutout_path`，失败必须继续使用旧透明图或原图。新衣确认通过 Next.js `after()` 在响应后异步处理，不得阻塞入库；客户端批量确认固定为 2 路并在每件后等待 4 秒，避免 10 件同时挤压第三方接口。画布 MUST 保持无格子、无吸附的自由移动/旋转/缩放；分类尺寸只影响新画布初始 scale，不改写历史画布或图片像素。人工精修必须同时提供擦除和从原图恢复，原图与工作图都必须通过同源、当前用户鉴权接口读取，取消或保存失败不得覆盖当前结果。
- SDD-005 推荐默认复用 `gpt-4o-mini`，可通过服务端 `OPENAI_RECOMMENDATION_MODEL` 单独覆盖；OpenAI 失败、超时或输出不合法时 MUST 在 15 秒目标内转为规则推荐。SDD-012 起天气位置只能来自当前账号保存的常用城市，由服务端通过 Open-Meteo 解析并获取天气；未设置时不得静默回退北京。SDD-013 起普通推荐只允许 `today | tomorrow`：今天取当前天气，明天按账号时区精确匹配日预报；天气失败 MUST 停止生成，不得返回或保存模拟天气。AI 失败仍可在真实天气成功后使用规则推荐。
- SDD-014 起 AI、规则降级和服务端校验 MUST 复用 `lib/recommendations/occasion-profile.ts` 的四场景画像；每套至少有两个独立场景信号，正式场景不得包含仅运动单品，可选配饰/外套不得使用场景明确不推荐的风格，热天不得使用非夏季外套，首个风格标签必须来自当前场景画像。语义相邻场合只提供弱信号，不得覆盖硬冲突。天气、衣着偏好、当前用户活跃衣物、完整性和跨套不重复优先于差异度；库存充足的固定样本六组场景核心单品 Jaccard MUST 不超过 0.5，小衣橱不得为追求差异伪造或错误搭配。AI 无效时沿用单次规则降级，不追加模型调用。
- SDD-017 起异场景标签是 AI、规则降级与最终复验共用的硬边界：衣物明确包含当前场景时可跨场景使用；否则休闲拒绝约会/正式/通勤标签，约会拒绝休闲标签，正式拒绝休闲/通勤标签，通勤不新增排斥。正式画像不得再把通勤作为弱关联或偏好风格。雨天只包含 WMO 51～67、80～82、95～99；雪天不得误判。防水能力只按明确名称语义与类别识别，普通 `synthetic` 不等于防水；若场景合法且季节适配的防水外层、下装与鞋三类候选完整，3 套中 MUST 至少 1 套使用完整组合，否则不得强行补齐。不得覆盖温度、衣着偏好、归属、完整性、跨套不重复或单次规则降级边界。
- SDD-018 起普通天气位置仍只来自当前账号主动保存的城市，不根据 IP、邮箱或浏览器位置静默变化；推荐页“选择城市”只接收城市名，Server Action 必须用 `auth.getUser()` 派生当前用户并复用城市解析，成功后更新城市五元组并删除当前用户全部旧推荐。失败不得覆盖原城市。入库工作区只有在单批 10 件全部 `confirmed` 后才显示“继续添加衣服”；该操作只释放浏览器预览 URL 并清空本地队列，严禁调用删除接口或修改已入库衣物。
- SDD-019 起可使用 Vercel 服务端可信请求头推导城市建议，但 IP 仍不得静默改变天气位置：仅中国大陆字段完整、坐标有效且与当前有效城市相距至少 50 公里时提示，浏览器只接收城市名，不得接收或持久化原始 IP、坐标、地区或时区。“本次使用”必须先复用城市解析，再写入绑定当前 `auth.getUser()` 账号的 HttpOnly、SameSite=Lax、无持久期限会话 Cookie；“设为常用城市”继续更新 Supabase 城市五元组并清除临时状态。推荐页日期、天气、批次校验和生成 MUST 统一使用临时城市优先、常用城市兜底的有效位置；切换或恢复后必须删除当前用户旧推荐。本地无 Vercel 请求头时安静降级到手动选城，不得设置默认武汉或北京。
- SDD-020 起设备定位只允许由用户点击“本次使用当前位置”或“设为常用城市”触发；页面加载、刷新和 Effect MUST NOT 请求权限，也不得使用 `watchPosition`。定位使用城市级低精度、10 秒超时和最多 5 分钟浏览器位置缓存。当前坐标只能由同一设备直接调用 BigDataCloud 免费客户端 Reverse Geocode to City API，并只接受 `lookupSource=coordinates`、`countryCode=CN` 的城市结果；衣拍即合 Server Action 只接收城市名和模式，MUST 用 `auth.getUser()` 重新鉴权并通过 `resolveChineseCity` 再次规范化，严禁接收或持久化设备经纬度。临时/常用城市继续复用 SDD-019 状态模型，切换后删除当前用户旧推荐；定位失败、非中国或第三方不可用时保留原城市和手动入口，不回退 IP、默认城市或模拟天气。
- SDD-021 起衣物风格规范固定为 `minimal/casual/commute/elegant/sporty/vintage/cleanfit/streetwear/cityboy/gorpcore/preppy/workwear/oldmoney/y2k` 14 类，入库、编辑、长期偏好、反馈账本、AI、规则降级与最终复验 MUST 共用该目录。`wardrobe_items.brand` 可空且最长 40 字符；品牌只有在图片存在清晰文字或标志证据时才能建议，否则 MUST 为 `brand=""`、`brand_confidence="unknown"`，最终值始终允许用户编辑确认。推荐页单次风格选择不写回长期偏好；自动模式在库存允许时分配三个不同兼容方向，指定模式保持同一方向，但天气、衣着归属、场景硬边界、完整性、雨天防水和跨套不重复始终优先。趋势灵感只允许使用包含来源 URL、发布日期和有效期的人工审核快照，过期条目不得继续标记为本季；不得在页面运行时抓取外站或复制外部图片。
- SDD-022 起推荐单套允许 3～7 件，角色由 `lib/recommendations/layers.ts` 统一派生并限制为最多 2 件上装、1 件下装/连衣裙、1 件外套、1 双鞋、2 件配饰。冷天可增加内搭，热天不得为追求复杂度强行叠穿。SDD-024 起角色只服务于衣物排布和实拍核对；换件仍须清空历史效果图元数据，防止旧缓存与新衣物错配。
- 2026-08-27 复核 `/websites/vercel` 与项目内 Next.js 16.3.1 文档：Vercel 地理请求头只应在服务端读取；App Router 的 `headers()` 与 `cookies()` 均按异步 API 使用，Cookie 写入只发生在 Server Action/Route Handler。
- SSR 客户端遵循 Supabase 官方模式：浏览器端使用 `createBrowserClient`，服务端使用 `createServerClient` + `next/headers` cookies，Next.js 16 使用根目录 `proxy.ts` 调用 `auth.getClaims()` 刷新会话。
- `lib/auth/viewer.ts` 的账号属性必须使用 `auth.getUser()` 获取 Auth 服务端最新记录；`getClaims()` 继续用于 Proxy 和轻量身份校验，但不得用于邮箱绑定后的即时匿名状态判断，因为当前 JWT 可能仍携带旧声明。
- SDD-001 数据底座为 `public.profiles` 和 `public.user_preferences`，均以 `auth.users.id` 为主键并启用 RLS；`authenticated` 仅有 `SELECT/INSERT/UPDATE`，`anon` 无表权限。
- SDD-003 衣橱底座为 `public.wardrobe_items`：记录绑定 `user_id`，`demo_key` 保证当前用户演示数据幂等，状态仅为 `active/archived`；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。
- SDD-004 入库底座为 `public.wardrobe_ingestions`：每张原图使用稳定请求 id、私有路径、处理状态与最长 24 小时有效期；`wardrobe_items.source_ingestion_id` 保证确认重试只创建一件衣物。表启用四类用户所有权 RLS，`anon` 无表权限。
- SDD-005 推荐底座为 `public.daily_recommendations`：每名用户每天最多一个批次，`outfits` 必须恰好 3 套，AI 来源必须记录模型；表启用四类用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。推荐结果 MUST 只引用当前用户活跃衣物，跨套不重复，且不得在同一套中混用连衣裙与上衣裤装。
- SDD-006 反馈底座为 `public.wardrobe_item_favorites`、`public.outfit_favorites` 和 `public.preference_feedback_events`；收藏使用唯一键幂等，整套收藏保存不可变 JSON 快照，反馈事件通过唯一 `event_key` 去重，三表均启用当前用户所有权 RLS。`user_preferences.style_scores` 必须由事件账本重算，不得让客户端直接写任意分数。
- SDD-009 日记底座为 `public.outfit_diary_entries`：每名用户每个自然日唯一，记录来源、场合、1～8 个当前用户活跃衣物 ID 与不可变文字快照；数据库触发器拒绝重复衣物和跨用户/已归档衣物引用，表启用四类当前用户所有权 RLS，`authenticated` 具有 CRUD，`anon` 无表权限。利用率从日记与当前可见日常衣橱即时计算，不单独持久化；未来日期不得写入，明日推荐不得提前计数。
- SDD-012 在 `public.user_preferences` 保存账号级 `clothing_preference` 与完整城市位置五元组，在 `public.wardrobe_items.audience` 保存男装/女装/中性归属。衣着过滤 MUST 可逆且不得删除记录；衣橱、首页预览和推荐候选 MUST 使用同一共享规则。
- Storage bucket `wardrobe-images` 必须保持私有，对象路径第一段固定为当前 `auth.uid()`；读取、插入、更新和删除均由同一路径规则限制。
- 当前 Supabase 项目已于 2026-08-21 开启 Anonymous Sign-Ins；`npm run verify:sdd-001` 已用两组真实匿名会话验证自身访问、跨用户 RLS 与 Storage 路径隔离。
- 当前 Supabase Auth 已开启 Email、Anonymous Sign-Ins 和 Manual Linking，并于 2026-08-25 经用户明确允许关闭 Confirm email；保存后重新加载页面复核仍为关闭。Site URL 为 `http://localhost:3000`，Redirect URL 包含 `http://localhost:3000/**` 与 `https://*-jialin-d583.vercel.app/**`，仅用于兼容旧链接和新增部署域名。
- 当前主 Vercel 项目为 `yipai-jihe`（project id：`prj_ocx4NiuPlME8hIW3Zosc76yCBz8n`，team：`jialin-d583`，框架预设：Next.js）；Production 固定域名为 `https://yipai-jihe.vercel.app`，2026-09-08 最新部署为 `dpl_Dt4pRMhEWrHg1ARqd22KRMy9k4NY`，对应部署源 Git 提交 `3b32a31`。Production 已配置两个 Supabase `NEXT_PUBLIC_` 变量、OpenAI、百度及和风所需服务端变量；尚未配置百炼 `DASHSCOPE_*`。旧 `ai-coding` 项目仅保留历史 Preview，不得再作为默认部署目标。
- Vercel Production 发布流程：先运行 `npx vercel link --yes --project yipai-jihe --scope jialin-d583`、`npx vercel project inspect yipai-jihe --scope jialin-d583` 与 `npx vercel env ls production --scope jialin-d583`，确认链接项目正确、框架预设为 Next.js 且变量名称齐全；再运行 `npm run check`、`npm run build`，最后执行 `npx vercel deploy --prod --yes --scope jialin-d583`。发布后使用 `npx vercel inspect <deployment-url> --scope jialin-d583` 核对 `target=production`、`status=Ready` 和固定别名，并检查核心页面 HTTP 状态及 `npx vercel logs <deployment-id> --level error --since 30m --scope jialin-d583`；不得把密钥放进命令参数、日志或仓库。
- SDD-001 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-001`；最后一项会创建两组非敏感匿名测试资料并验证跨用户访问被拒绝。
- SDD-003 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-003`；最后一项会创建两组安全合成 PNG 衣物，验证记录与 Storage 的自身 CRUD 和跨用户拒绝，然后自动清理。
- SDD-004 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-004`；最后一项验证 10 张固定 jpg、双会话隔离、确认幂等、取消/过期清理和 10 项批量边界。2026-08-23 真实 `gpt-4o-mini` 基准为 10/10、平均 3504ms；2026-08-25 Windows 本地传输修复后，当前页面 10 张真实图片全部识别成功。
- SDD-005 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-005`；最后一项创建两组非敏感匿名测试衣橱，验证三套契约、同日三次覆盖为一行和跨用户 RLS 后自动清理。390px 浏览器必须另测至少两种场合/天气组合与规则降级。
- SDD-006 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-006`；最后一项创建两组匿名测试衣物，验证单品/整套收藏和反馈幂等、跨用户读取/写入拒绝后自动清理。390px 浏览器必须另测合法替换持久化、无候选说明、收藏页和 3 题问卷来源说明。
- SDD-007 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-007`；最后一项为无网络静态门禁，核对 7 个核心页面、演示/测试素材、迁移、npm 脚本、README、环境模板和客户端密钥边界。远端隔离继续复跑 SDD-001、003、005、006；真实 AI 识别仅在模型、提示词或识别代码变化时复跑以避免无意义付费。
- SDD-009 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-009`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-012`、`npm run verify:sdd-015` 与 `npm run verify:sdd-016`；独立门禁覆盖固定利用率聚合、未来日期、同日 upsert、编辑删除、双账号 RLS、跨账号衣物拒绝和页面静态边界。390px 浏览器另验收日记、报告、手工记录与今日推荐入口无溢出、无残留遮罩和无控制台 error。
- SDD-012 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-012`；最后一项创建武汉男装与上海女装两组隔离账号，验证字段约束、跨用户 RLS、过滤不删除和按钮扫光静态边界。浏览器另验收账号摘要、当前 24 件男装/中性演示视图及武汉实时天气。
- SDD-013 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-013`；最后一项读取武汉真实两日天气、精确匹配明日日期，验证代码无模拟降级，并用匿名会话确认今天/明天分别保存且同日刷新不覆盖另一日期。390px 浏览器另验收日期切换、真实来源和无水平溢出。
- SDD-014 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-014`，并回归 `npm run verify:sdd-005`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖四场景 12 套、两个场景信号、正式雷区、六组核心单品重合度、当前 24 件男装/中性演示候选、冷热天气和最小衣橱边界。
- SDD-015 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-015`；独立门禁覆盖 8 个核心页面的语义排版接入、旧超大字号、极端负字距、前导零计数、模板式文案和长破折号边界。390px 浏览器另验收标题换行、横向溢出、AI 来源层级和控制台错误。
- SDD-016 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-016`，并回归 `npm run verify:sdd-002`；无会话首页 MUST 只显示登录、直接注册和显式体验身份入口，不得自动调用匿名登录或展示业务 App chrome。直接注册依赖 Supabase Confirm email 关闭并必须立即返回会话；登录后需幂等补齐资料与偏好。390px 浏览器另验收标签切换、字段留白、无横向溢出和无控制台 error。
- SDD-017 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-017`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-014`、`npm run verify:sdd-005`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 6 组异场景硬冲突、多场景基础款例外、雨/阵雨/雷雨与雪天边界、完整/不完整防水库存、热天冬季外层、28 件演示素材和 24 件男装/中性候选。
- SDD-018 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-018`，并回归 `npm run verify:sdd-007`、`npm run verify:sdd-015`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 10/10 满批重置、预览资源释放、无持久删除、推荐页城市选择、无 IP 定位、当前会话身份、偏好 RLS 和旧推荐失效。识别模型、提示词或 API 未变化时不得为本 UI 重置重复执行 10 张付费 AI 识别。
- SDD-019 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-019`，并回归 `npm run verify:sdd-018`、`npm run verify:sdd-007`、`npm run verify:sdd-015`、`npm run verify:sdd-012` 与 `npm run verify:sdd-013`；独立门禁覆盖 Vercel 请求头解码、非中国与缺失字段降级、50 公里提示门槛、账号绑定 HttpOnly 会话 Cookie、跨账号拒绝、服务端城市规范化、切换后旧推荐失效和浏览器不接收坐标。390px 浏览器必须另验收无 IP 安静降级、可控异地提示、双操作、无溢出和无控制台 error。
- SDD-020 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-020`，并回归 `npm run verify:sdd-018`、`npm run verify:sdd-019` 与 `npm run verify:sdd-013`；独立门禁覆盖非法坐标、只接受当前坐标城市、中国范围、无静默或持续定位、低精度与超时、应用服务器不接收设备经纬度、当前会话身份、城市二次规范化和旧推荐失效。390px 浏览器另验收双按钮至少 44px、高级动效延续、手动入口、无溢出和无控制台 error；真实设备权限只能由用户本人决定。
- SDD-021 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-021`，并回归 `npm run verify:sdd-004`、`npm run verify:sdd-005`、`npm run verify:sdd-014`、`npm run verify:sdd-017` 与 `npm run verify:sdd-007`；独立门禁覆盖 14 风格、品牌长度与防猜、双账号 RLS、自动/指定风格方向和来源化趋势有效期。识别提示或 Schema 变化时 MUST 复跑 10 张真实图片，要求类别至少 8/10 且无品牌固定样本不得猜品牌；390px 浏览器另验收偏好换行、风格选择、搭配要点、趋势来源和控制台 error。
- SDD-022 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-022`，并回归 `npm run verify:sdd-005`、`npm run verify:sdd-014`、`npm run verify:sdd-017` 与 `npm run verify:sdd-021`；独立门禁覆盖冷/温/热分层数量、角色顺序、类别上限、图像提示安全、私有 Storage 双账号隔离、占位素材和推荐卡静态边界。图像模型调用只做按需人工验收，不在自动测试中消耗额度；390px 浏览器另验收有图、无图、生成中、错误和换件失效状态。SDD-005/021 的联网回归若因环境审批未执行，必须在进度文档中保留未完成记录。
- SDD-023 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-023`；独立门禁覆盖真实图片地址复用、固定人物素材、角色标签、缺图占位、无模型/第三方请求、AI 可选增强边界和推荐卡实拍核对保留。390px 浏览器必须另验收精准预览的 3～7 件展示、长名称、缺图状态、无横向溢出和无控制台 error；本阶段不重复消耗图像模型额度。
- SDD-024 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-024`；独立门禁覆盖 2～8 件布局边界、纯色/透明/复杂背景固定像素样本、无人物默认路径、保存校验、双账号画布 RLS 和私有抠图签名隔离。390px 浏览器另验收衣物可移动、工具栏、五种底色、无溢出和无控制台 error。
- SDD-025 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-025`，并回归 SDD-024；独立门禁覆盖昵称标准化、头像 MIME/5MB/UUID 路径、四个时尚 token、当前账号统计、资料 RLS 和私有头像签名隔离。390px 浏览器另验收个人主页四项统计、头像昵称编辑、近期卡片、顶部入口、无溢出和无控制台 error。
- SDD-026 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-026`，并回归 `npm run verify:sdd-024` 与 `npm run verify:sdd-025`；独立门禁覆盖百度 OAuth Token 缓存、智能抠图参数、双密钥边界、Sharp 透明样本裁边、六类初始尺寸、无格子画布和人工擦除/恢复静态边界。2026-09-02 Production 隔离体验身份完成 10 张真实固定样本：首次后台并发 7/10，安全回退后单件顺序重试达到 10/10；所有透明图和工作图均位于当前账号私有路径。390px 已验证移动、旋转、专业重试、擦除/恢复和 0 console error。
- 开启匿名登录后，Supabase 安全顾问会对允许匿名身份使用的 `authenticated` 策略给出提醒；只有策略同时使用 `auth.uid()` 所有权或对象路径约束时才可接受。SDD-002 已启用邮箱密码能力并关闭 Confirm email，完成真实登录验收时必须同步复核泄露密码保护提示。
- SDD-027：只展示白名单 RSS 的标题级中文简述，不下载外图、全文或绕过付费墙。AI 仅接收公开标题和稳定 ID，复用服务端 Responses、`store:false` 与严格 JSON Schema，默认 `gpt-4o-mini`，可复用 `OPENAI_RECOMMENDATION_MODEL`。失败保留原题并标为阅读提示，不假装生成新闻事实。`unstable_cache` 只缓存公开内容，不能在缓存中读取用户 cookies/位置/衣橱；个人排序在缓存之外。
- SDD-027 数据：`fashion_content_reads` 和 `fashion_topic_impressions` 均启用当前账号四类所有权 RLS；`record_fashion_impression` 为 security invoker，仅当前用户、同主题 30 天内保留首次内容与时间，不得在普通已读操作中写提醒时间。关闭个性化不查询衣橱、日记或天气；关闭提示不显示徽标，也不删除历史记录。
- SDD-027 验证：`npm run check`、`npm run build`、`npm run verify:sdd-027`；离线运行可加 `node --no-warnings scripts/verify-sdd-027.mjs --offline`。脚本覆盖纯规则、SQL 幂等与双账号隔离；390px 另测全空主题、设置持久化、详情已读与无溢出。未知同义主题、真实跨日来源恢复与 Production 验收不得自动宣称完成。
- SDD-031 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-031`；独立门禁覆盖共享贴纸组件、透明/原图/缺图三态、衣橱与推荐入口、收藏/换件保留、无数据写入和减少动态/透明度边界。Production 部署前必须用有效会话复核推荐页实际数据态，不得只凭静态脚本宣称完整视觉验收。
- SDD-032 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-032`，并回归 `npm run verify:sdd-031`；独立门禁覆盖首页、详情、日记、收藏和利用率入口，`cutoutUrl`/原图双路径、指针穿透、上传工作区排除、无数据写入及退役功能不恢复。390px 浏览器至少使用隔离体验身份复核演示衣橱、详情、日记选择、收藏和利用率；普通演示照片不能冒充透明抠图验收。
- SDD-033 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-033`，并回归 `npm run verify:sdd-031`；独立门禁覆盖双来源、1～8 件当天本地选择、loose 白边贴纸、用户触发生成、同源鉴权、当前用户衣物归属、503 停止排队及旧 `/outfits` 退役边界。390px 浏览器另验首页/日记入口、无溢出和零 error；本机缺百度双密钥时只可记录安全失败，不得宣称真实去背成功。
- SDD-034 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-034`，并回归 `npm run verify:sdd-033` 与 `npm run verify:sdd-009`；独立门禁覆盖无格画板、浅色/深色主题、1～8 件布局、拖动/非拖动操作、变换限幅、重叠层级、本地状态清洗、1080×1350 PNG、原生分享降级、月历代表衣物和隐私字段排除。390px 浏览器必须另验浅色/深色色板、三件重叠、位置/层级变更、画板/月历切换、无横向溢出和零 error；真实透明图下载与系统分享需在具备有效 cutout 的会话中复验。
- SDD-035 质量命令：`npm run check`、`npm run build`、`npm run verify:sdd-035`，并回归 `npm run verify:sdd-034` 与 `npm run verify:sdd-009`；独立门禁覆盖 v1→v2 草稿兼容、四边裁切清洗、稳定层级重排、四角直接操作、裁切导出、顶部衣库、底部五项导航、空月完整日历和最近 30 天真实贴纸墙。390px 浏览器必须另验两件贴纸置顶/置底、四个 44px 以上手柄、四边裁切、空月日历与无溢出；横屏必须验收利用率空/有数据状态。不得把演示衣物交互验收写成真实专业去背验收。
- 本文件是后续开发的文档起点，必须根据实际开发进度实时更新，保持技术栈、目录和约定准确。

## 开发进度与 SDD 执行规则

- 当前阶段：SDD-041 品牌开屏与加载动效已完成本地开发、自动门禁和隔离浏览器视觉验收，尚未部署；Production 仍为 SDD-040 的 `dpl_54YV7QY1rYJHhiAgDxai5JmCb3tf` / `c6c9e87`。系统减少动态、最大字体、手机首次打开、弱网加载及前后台切换仍待真机/线上复验；本人既有透明贴纸的 1080×1350 下载和系统分享也仍待集中复验。SDD-030 真实百炼北京凭据联调仍未完成，因此该阶段保持“部分完成”。SDD-002 本人历史账号重登录、手机定位与联网仍待集中调试。不得代替用户输入或保存密码、擅改公开策略或保护绕过设置。每阶段开发后必须更新 progress.md，不得把固定测试、规则后备或本地成功标记为真实接口验收。

- 项目阶段进度唯一追踪入口为 [`progress.md`](progress.md)，该文件覆盖此前的路线图。每次开始 AI Coding 前 MUST 阅读当前阶段；规划发生变化时更新并覆盖旧计划，不得让多个路线图并行生效；完成阶段后 MUST 立即更新对应 TODO、状态、完成日期、验收结果、已知限制和提交记录。
- 每个阶段 MUST 作为独立 Spec Kit SDD 单元放在 `specs/<阶段编号>-<名称>/` 下，至少包含 `spec.md`、`plan.md` 和 `tasks.md`；涉及数据、接口或验证时同步维护 `data-model.md`、`contracts/` 和 `quickstart.md`。
- 实现顺序 MUST 遵循 `progress.md` 中的阶段依赖，先完成工程底座，再完成核心 P0 闭环，最后处理 P1/P2 扩展。
- 部署节奏 MUST 遵循 `progress.md`：基础设施阶段完成后验证 Preview，推荐阶段完成后验证核心体验，全部 P0 完成后再发布受控评审链接。
- 阶段未通过独立验收或 `npm run check` 时，不得在 `progress.md` 中标记为“已完成”，也不得开始依赖该阶段的后续阶段。
- 每个阶段的实现范围 MUST 以对应 SDD 为准；不得为了 P1/P2 需求提前引入当前 MVP 不需要的复杂抽象。
- 当前真实衣物原图始终是可信源；SDD-026 已在用户明确授权后接入百度智能云服务端专业去背。第三方只接收当前用户触发处理的单件原图；无密钥、超时、限额、非法响应、私有存储失败或数据库绑定失败时必须保留当前有效透明图或原图。穿搭新闻属于独立 SDD-027，不改动衣物去背或推荐生成主链路。
- SDD-002 已实现邮箱和密码一次提交的原地注册、直接登录、退出和跨设备恢复，但在用户完成真实账号验收前保持“验收中”，且仍不得作为 SDD-003 至 SDD-007 的依赖。匿名用户必须明确知道清除站点数据或换设备后无法恢复未注册身份；注册流程 MUST 保持同一 `auth_user_id` 和原匿名数据。登录与旧认证回调页面 MUST 跳过自动匿名初始化，只有用户主动选择时才创建新匿名身份。
- SDD-016 起首次访问不得自动创建匿名身份。无会话首页 MUST 先展示完整账号入口；新用户可直接邮箱密码注册，已有用户可登录，体验身份只允许由明确按钮触发。无会话深链接必须返回 `/`，不得在跳转前展示顶部状态或底部导航；已有会话继续进入原应用。
- SDD-002 不再发送注册确认或密码设置邮件。历史遗留的已绑定无密码账号只允许在本机运行 `npm run account:set-password-local`，通过 `.env.local` 的 `SECRET_KEY` 和 `auth.admin.updateUserById` 一次性设密；不得把该能力做成 Route Handler、Server Action 或 Vercel 环境能力。常规忘记密码仍不在当前范围。
- 全局动效以 `app/globals.css` 的品牌折叠 E 开屏/加载、气泡扩散、分层显现、导航选中气泡、按钮径向反馈和卡片景深为准；品牌高光只能限制在图标形状内，不得扩展为黑色按钮或全页面扫光。不得恢复所有控件统一上下弹跳。所有后续 UI MUST 支持 `prefers-reduced-motion` 和 `prefers-reduced-transparency`。
- 演示数据 MUST 按当前用户隔离加载，且入口只允许空衣橱体验身份使用：正式账号、已有任意真实衣物或内置演示衣橱已经完整时 MUST 隐藏入口；体验身份部分加载失败且没有真实衣物时只显示“继续加载演示衣橱”。`loadDemoWardrobe` Server Action MUST 使用 `auth.getUser()` 重新确认匿名身份并在服务端拒绝正式账号和已有真实衣物的账号，不能只依赖页面显隐。不得把真实个人敏感照片写入仓库或提交记录。
- 内置演示衣物共 28 件，图片位于 `public/demo-wardrobe/`，按 `demo_key` 使用同名 768px WebP 棚拍素材；其中 4 件 SDD-017 正式胶囊为无人物、无品牌的透明背景生成素材。仅演示数据使用公开静态图，真实用户上传仍 MUST 使用 `wardrobe-images` 私有 bucket 与签名 URL。
- SDD-004 固定识别样本位于 `public/test-wardrobe/`，期望值在 `specs/004-ai-item-ingestion/test-samples.json`；这些图片只用于测试，不得作为用户真实衣橱数据自动加载。

<!-- BEGIN:nextjs-agent-rules -->

# Next.js 代理规则

Next.js 版本可能包含与既有经验不同的 API、约定和文件结构。编写代码前，请阅读项目内 `node_modules/next/dist/docs/` 中对应的指南，并留意弃用提示。

该项目已关闭 Next.js 自动写入代理规则；如版本或配置变化，请手动更新本区块。

<!-- END:nextjs-agent-rules -->
