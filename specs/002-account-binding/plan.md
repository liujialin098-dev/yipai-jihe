# Implementation Plan: 邮箱绑定与会话恢复

**Branch**: `002-account-binding` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

## Summary

复用 Supabase Auth 将匿名用户原地升级为邮箱身份：设置页发起邮箱验证，确认回调建立会话并进入密码设置，登录页负责邮箱密码恢复与主动新建匿名体验。业务表继续以不变的 `auth.uid()` 隔离，无需迁移数据。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1  
**Primary Dependencies**: Supabase JS 2.112.3、Supabase SSR 0.12.4、现有 shadcn/Base UI  
**Storage**: 现有 Supabase Auth、Postgres 与私有 Storage；无新表  
**Testing**: Biome、TypeScript、Next build、脚本级双会话校验、浏览器完整流程  
**Target Platform**: Vercel Web，移动端优先  
**Performance Goals**: 本地表单反馈即时；远端认证请求有明确等待和失败状态  
**Constraints**: 保持用户 ID；登录页不得自动创建匿名身份；密码与密钥不得记录  
**Scale/Scope**: 设置、确认、登录三个页面和一组服务端认证动作

## Constitution Check

- 直接复用现有 Auth 和用户 ID，不新增账号抽象：PASS
- Server Component 默认，表单交互才使用 Client Component：PASS
- 账号动作重新校验会话并返回最小状态：PASS
- 不提前实现找回密码、OAuth 或账号切换：PASS
- 文档、独立验收、`npm run check` 和提交门禁：PASS

## Project Structure

```text
app/
├── auth/confirm/route.ts
├── login/page.tsx
└── settings/page.tsx
components/auth/
├── account-forms.tsx
└── login-form.tsx
lib/auth/
├── actions.ts
├── errors.ts
└── viewer.ts
scripts/verify-sdd-002.mjs
```

**Structure Decision**: 认证变更集中在 `lib/auth/` 服务端动作；页面只负责状态与交互，继续复用现有 Supabase SSR Cookie 客户端。

