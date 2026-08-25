# Implementation Plan: 邮箱绑定与会话恢复

**Branch**: `002-account-binding` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

## Summary

复用 Supabase Auth 将匿名用户原地升级为邮箱身份：主页提供注册/登录入口，设置页一次提交邮箱和密码直接注册，登录页只负责邮箱密码恢复与主动新建匿名体验。历史遗留的已绑定无密码账号通过仅限本地的管理员脚本恢复。业务表继续以不变的 `auth.uid()` 隔离，无需迁移数据。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1  
**Primary Dependencies**: Supabase JS 2.112.3、Supabase SSR 0.12.4、现有 shadcn/Base UI  
**Storage**: 现有 Supabase Auth、Postgres 与私有 Storage；无新表  
**Testing**: Biome、TypeScript、Next build、脚本级双会话校验、浏览器完整流程  
**Target Platform**: Vercel Web，移动端优先  
**Performance Goals**: 本地表单反馈即时；远端认证请求有明确等待和失败状态  
**Constraints**: 保持用户 ID；关闭 Confirm email；登录页不得自动创建匿名身份；密码与密钥不得记录；管理员密钥不得进入 Vercel 或浏览器
**Scale/Scope**: 主页、设置、登录三个页面，一组服务端认证动作和一个本地恢复脚本

## Constitution Check

- 直接复用现有 Auth 和用户 ID，不新增账号抽象：PASS
- Server Component 默认，表单交互才使用 Client Component：PASS
- 账号动作重新校验会话并返回最小状态：PASS
- 不建立线上找回密码、OAuth 或账号切换：PASS
- 文档、独立验收、`npm run check` 和提交门禁：PASS

## Project Structure

```text
app/
├── auth/confirm/route.ts
├── page.tsx
├── login/page.tsx
└── settings/page.tsx
components/auth/
├── account-forms.tsx
└── login-form.tsx
lib/auth/
├── actions.ts
├── errors.ts
└── viewer.ts
scripts/
├── set-local-account-password.mjs
└── verify-sdd-002.mjs
```

**Structure Decision**: 普通认证变更集中在 `lib/auth/` 服务端动作；页面只负责状态与交互。服务端密钥只允许本地脚本读取，不创建可从 Web 调用的管理员密码接口。
