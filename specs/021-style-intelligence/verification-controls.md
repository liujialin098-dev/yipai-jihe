# 推荐控件与上传提示增量验收

日期：2026-09-16。属于021临时风格选择的交互修复，并联修036手势冲突及004上传提示；不新增数据模型、服务端接口或推荐规则。

## 本次验收约定

1. 四场景可通过鼠标文字、触屏和键盘选择；只改变待生成条件，不点击场景就自动花费AI调用。
2. 风格从底部面板选择，保持原兼容矩阵。切场景时兼容风格保留、不兼容回到自动；选择后回填，关闭/Esc/遮罩不会触发生成，焦点回到触发器。
3. 箭头在卡片右侧，与整行垂直居中；六皮肤与日夜保持原色语义。窄屏可两列场景；点击区域至少44px，放大字号无水平溢出。
4. 生成沿用原场景、日期、风格、天气位置和日期字段。等待期间禁用重复提交；成功、业务错误和网络异常均不让选择与显示分离。真实天气未就绪仍禁止生成。
5. 上传图片处展示背景干净/衣物完整清晰的建议，关闭后同设备刷新不再展开，用户可恢复查看。存储被禁用时只保留本次状态，不影响上传。

## 实施与结果

- 原PageMotion未排除label，pointerdown立即setPointerCapture：基线浏览器测试中触屏选休闲通过、鼠标点约会文字失败（false !== true）。修复后相同测试通过；延迟捕获至意图明确的水平移动，排除label/form/语义控件。
- 原生radio保留键盘语义，勾选图标不只依赖颜色。原生dialog隔离背景焦点；圆角场景卡片、风格摘要卡片与选项面板使用现有皮肤token，不新增依赖。
- 手动FormData + startTransition/useActionState保留受控选择并处理网络异常，不改变服务端校验；上传建议组件仅保存非敏感设备布尔偏好。

## 检查记录

- `npm run build`、`npm run lint`、`npm run typecheck`通过；007、029、036、053回归通过。
- `node scripts/verify-recommendation-controls-ui.mjs`通过。可用`UI_PLAYWRIGHT_PACKAGE`指定已安装Playwright路径，浏览器为本机Chrome；环境无agent-browser时的等价实际组件验证。fixture与验证脚本已在.vercelignore排除。
- 真实组件测试覆盖PageMotion+RecommendationControls+StylePicker+UploadPhotoHint；Action/天气明确为离线假体，不访问账号或AI服务。
- 四场景文字鼠标/触屏、radio键盘、兼容风格回填/不兼容回退、风格面板关闭三条路径及焦点归还；生成的场景/风格/目标日/天气字段、等待锁定、成功/业务失败/网络异常保留；天气失败禁生成；旧label点击、空白滑动及transform清理通过。
- 六皮肤×浅/深对比检查均>=4.5，箭头中心偏差<1px。375px手机、320px/24px根字号、844×390横屏/20px字号、768×1024、减少动态均无水平溢出，场景触控尺寸>=44px。
- 提示关闭→刷新仍关闭→恢复→刷新仍展开；localStorage读写均抛错时仍能开关；console.error/pageerror为空。
- 已目视原色浅/深面板与推荐卡片截图。测试字体回退，不代表iPhone原生字体或VoiceOver验收。
- `npm run verify:sdd-021`的前置静态/纯逻辑检查执行后，在Supabase匿名认证阶段`AuthRetryableFetchError: fetch failed`终止；没有获取成功会话的证据，不计为完整通过，不继续重试生产写入。

## 未完成边界

真实账号AI生成与上传、iPhone/Safari/VoiceOver、真实持久化及线上验收待执行。没有数据库/权限/密钥/供应商变化，没有提交、GitHub上传或Vercel部署。本地050注销增量保持独立未发布。
