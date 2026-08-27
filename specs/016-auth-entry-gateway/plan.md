# 实施计划：首次账号入口

**功能目录**：`016-auth-entry-gateway` ｜ **日期**：2026-08-27 ｜ **规格**：[spec.md](spec.md)

## 摘要

将 `/` 变为按服务端当前身份分流的固定入口：没有会话时展示登录、注册和体验使用三种明确选择；有会话时继续展示现有应用首页。移除首次访问自动匿名初始化，只有点击体验按钮才创建匿名身份。直接注册复用现有 Supabase Auth，通过服务端 Action 调用邮箱密码注册；只有立即返回有效会话才算成功，因远端误开邮件确认而只返回用户不返回会话时明确失败。

## 技术上下文

**语言/版本**：TypeScript 5、React 19.2.8、Next.js 16.3.1 App Router
**主要依赖**：`@supabase/ssr` 0.12.4、`@supabase/supabase-js` 2.112.3、Tailwind CSS 4、lucide-react
**存储**：Supabase Auth 与现有 `profiles`、`user_preferences`；无数据库迁移
**测试**：Biome/TypeScript 静态检查、Next.js production build、SDD-016 静态与远端认证脚本、390px 浏览器验收
**目标平台**：移动端优先 Web，Vercel Production
**项目类型**：Next.js 全栈 Web 应用
**性能目标**：入口首屏不等待业务数据；身份成功后一次刷新进入 App；重复提交为 0
**约束**：不发送注册确认邮件；不公开管理员设密；未主动体验前不得创建匿名身份；保持原用户 ID 数据隔离
**规模/范围**：1 个统一入口、2 个邮箱密码表单、1 个显式体验动作、现有 8 个核心路由的未登录保护

## 章程检查

- **MVP 结果优先**：通过一个入口打通登录、注册、体验三条核心路径，不扩展忘记密码、短信或第三方登录，符合。
- **核心路径正确**：身份选择在业务内容之前完成，注册只有有效会话才成功，符合。
- **直接而简洁**：复用现有 Server Action、Supabase SSR 客户端和 UI token，不新增依赖或数据库抽象，符合。
- **静态质量门禁**：计划运行 `npm run check`、`npm run build` 和独立验证脚本，符合。
- **清晰交付与安全**：中文文档；密码只交给 Auth 服务；服务端无管理员密钥能力，符合。

阶段 1 设计后复核：无章程偏离，无需复杂度例外。

## 项目结构

### 本功能文档

```text
specs/016-auth-entry-gateway/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-entry.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md
```

### 源代码

```text
app/
├── page.tsx
├── login/page.tsx
└── globals.css
components/
├── app-shell.tsx
├── session-bootstrap.tsx
└── auth/
    ├── auth-entry-gateway.tsx
    ├── login-form.tsx
    └── account-forms.tsx
lib/auth/
├── actions.ts
├── errors.ts
└── viewer.ts
scripts/
└── verify-sdd-016.mjs
```

**结构决策**：保持单个 Next.js App Router 项目。服务端页面先读取 `getViewer()`，未登录时不查询衣橱数据；交互表单使用 Client Component 与 Server Action，敏感凭据不进入 URL、日志或项目数据库。

## 复杂度追踪

无章程违规，不需要复杂度例外。
