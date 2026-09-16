# 实施计划：SDD-050 上架准备第一批

## 后续增量计划（2026-09-14）

沿用050，先交付邮件数字码恢复及公开帮助/数据说明，不启动051或切换分支。恢复独立 server-only 服务与 Server Actions；公开密钥临时客户端，不读写浏览器cookies，不使用admin。ACCOUNT_EMAIL_RECOVERY_ENABLED 必须严格为 true 才允许发送/验证；未配置或异常均关闭。

服务先验证邮箱格式、6～10位数字码（兼容平台配置的码长）、8字符且72字节以内的新密码。verifyOtp 的 type 固定 recovery，返回会话用户与返回用户必须同一ID且邮箱与请求一致，非匿名；更新仅通过该临时会话进行。成功后尝试global登出以撤销刷新会话；不承诺已有JWT立即失效。错误或未改密时只清理临时local会话；不导出任何token。

UI分两步，同一邮箱贯穿；失败保留邮箱、清空密码/验证码，错误摘要可聚焦，粘贴与密码管理器可用。支持仅在用户点击后打开邮件客户端。/auth/recover、/support、/privacy 为公开页面，白名单不影响服务端授权。

依赖为零新增；保留圆润布局、品牌配色、语义文字色。不改正式环境、发送模板、RLS或删除真实数据。其余删除/AI授权任务按门禁继续，不能借此增量标为完成。

日期：2026-09-14；规格：[spec.md](spec.md)；沿用当前分支。

## 概要

只实施已登录用户原密码改密，并收敛旧设密入口；内部上架准备资料和发布门禁同步落盘。不启用注销、找回邮件、不部署、不改生产配置。

## 技术上下文

- TypeScript 5、Next.js 16.3.1、React 19、Supabase JS 2.112.3；零新增依赖。
- 复用 Server Action、现有表单状态和语义主题。不新增页面或改变导航。
- 新 server-only 改密服务通过 getUser 确认当前身份，以不持久化的公开密钥客户端验证原密码；校验同一 UUID 后用临时会话 updateUser，并传 current_password。临时客户端终于流程只退出自己的 local 会话。
- 不依赖生产“require current password”开关，避免开关未启用时只传字段但未验证。上线前仍应人工核实认证服务直接 API 的密码策略；应用层验证不等于供应商全局策略。
- 旧 setAccountPassword 委托相同服务；不以 user_metadata/account_password_configured 授权。正式账号一律展示改密入口，标志仅影响历史提示。
- 体验注册使用单次 updateUser({email,password,data})，注册失败保留原会话与数据；最终结果仍检查非匿名、邮箱和同一 UUID。
- 固定服务假体和实际 Action/组件渲染测试；不读 .env、不创建真实账号、不发邮件、不请求付费供应商。
- 375px、横屏、日夜与减少动态隔离交互检查；不称为 iPhone 真机验收。

## 章程检查

范围对应明确核心安全路径，保持既有技术与最小模块拆分；中文文档；check/build为门禁；管理员权限不进入生产。规划前后均无章程例外。已存在的资讯改动与无关文件保留。

## 文件结构

- lib/auth/password-change.ts：输入、身份、原密码验证与安全返回。
- lib/auth/actions.ts：旧入口委托、体验注册单次写入。
- lib/auth/errors.ts：原密码字段类型。
- components/auth/account-forms.tsx、app/settings/page.tsx：改密表单与入口。
- scripts/verify-sdd-050.mjs：隔离安全/集成测试。
- specs/050-release-readiness/：规格、研究、数据流、接口、验证说明、发布门禁。
- progress.md：唯一阶段状态；AGENTS.md：当前安全边界覆盖说明。

## 交付顺序

规格 → 当前官方认证文档 → 固定回归用例 → 服务与旧入口收敛 → UI → 内部合规资料 → 检查和构建 → 保存进度并确认主体。

## 复杂度与风险

不用新增管理后台、数据库表或授权机制。临时校验会话清理失败不能把已成功改密报成失败；网络中断期间更新结果可能未知，提示核对新密码，不假称未修改。真实供应商和多设备令牌策略留作发布阻断项。
