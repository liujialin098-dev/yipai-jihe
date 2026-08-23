# Implementation Plan: 换一件、收藏与偏好反馈

**Branch**: `006-outfit-feedback` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-outfit-feedback/spec.md`

## Summary

在 SDD-005 当日推荐快照上增加服务端换件校验，建立单品收藏、整套快照收藏和可解释反馈事件数据；新增 3 题偏好页，让问卷、收藏和换件以固定权重更新现有 `user_preferences`，并让下一次推荐使用排序后的前 3 项风格。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1  
**Primary Dependencies**: App Router、Server Actions、Supabase SSR、lucide-react、现有 Tailwind 4 token  
**Storage**: Supabase Postgres 新增 3 张 RLS 表并扩展 `user_preferences`；衣物图片继续使用现有私有 Storage 签名地址或公开演示图  
**Testing**: Biome、TypeScript、Next 生产构建、双匿名会话远端脚本、390px 浏览器交互  
**Target Platform**: Vercel Node.js Functions + 移动端优先 Web  
**Project Type**: 单体 Next.js App Router  
**Performance Goals**: 候选展开不发起外部请求；替换与收藏服务端操作目标 2 秒内完成，外部 AI 不得阻塞换件  
**Constraints**: 不新增运行时依赖；所有写入使用当前用户会话；收藏快照不泄露其他用户数据；密码调试不作为依赖  
**Scale/Scope**: 单用户约 20～200 件衣物、当日 3 套、收藏几十条、反馈事件数百条

## Constitution Check

- 当前 SDD 独立边界：PASS。只处理换件、收藏、问卷和反馈，不进入穿搭日记或抠图。
- 服务端安全边界：PASS。候选和所有写入均以 Auth 用户与 RLS 双重约束。
- 可降级核心流程：PASS。候选由本地规则完整生成，AI 仅作为可选重排，不可阻塞。
- 可验证交付：PASS。迁移、脚本、移动端流程和进度文档均有独立任务。
- 现有技术栈复用：PASS。不引入状态库、表单库或新 UI 依赖。

## Project Structure

### Documentation

```text
specs/006-outfit-feedback/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/feedback-actions.md
└── tasks.md
```

### Source Code

```text
app/
├── recommendations/actions.ts
├── recommendations/page.tsx
├── favorites/page.tsx
└── settings/preferences/
    ├── actions.ts
    └── page.tsx

components/
├── recommendations/
│   ├── recommendation-card.tsx
│   └── replace-item-panel.tsx
├── favorites/
└── preferences/

lib/
├── feedback/
│   ├── actions.ts
│   ├── data.ts
│   └── preferences.ts
└── recommendations/
    ├── data.ts
    └── validation.ts

scripts/verify-sdd-006.mjs
supabase/migrations/*_outfit_feedback.sql
```

**Structure Decision**: 延续 Server Component 默认边界。页面读取与候选准备放在服务端；仅替换面板、收藏按钮和问卷交互使用 Client Component；所有授权、二次校验、快照更新和偏好重算集中到 Server Actions 与 `lib/feedback/`。

## Complexity Tracking

无需章程例外。三类新表分别承担关系、快照和审计职责，避免把长期收藏或反馈历史塞入当日推荐 JSONB。
