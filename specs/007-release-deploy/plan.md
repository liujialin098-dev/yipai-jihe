# Implementation Plan: 全链路加固与受控上线

**Branch**: `007-release-deploy` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

## Summary

冻结 P0 功能范围，补齐仓库级发布审计、环境变量模板和面向评审者的 README；复跑已有 SDD 隔离命令与 390px 核心路径，修复阻塞演示的问题，最后部署一个受保护 Vercel Preview 并记录完整证据。

## Technical Context

**Language/Version**: TypeScript 5、React 19、Next.js 16.3.1；发布审计使用 Node.js ESM  
**Primary Dependencies**: 现有 App Router、Supabase SSR、Vercel CLI、Biome；不新增运行时依赖  
**Storage**: 不新增表；以 `supabase/migrations/` 为唯一数据库重放源  
**Testing**: Biome、TypeScript、Next 生产构建、现有 SDD 验证脚本、静态发布审计、390px 浏览器  
**Target Platform**: 受 Vercel Authentication 保护的 Preview  
**Performance Goals**: 评审者 5 分钟内走完核心演示；核心页面不出现无限加载或无说明阻塞  
**Constraints**: 不发布 Production、不改域名/保护策略、不处理密码、不重复消耗 10 张真实 AI 识别额度  
**Scale/Scope**: 单体应用 14 个构建路由、6 个已完成 P0 SDD 的回归与交付文档

## Constitution Check

- 阶段边界：PASS。只做发布加固和交付，不增加业务模块。
- 安全边界：PASS。不公开服务端密钥，不创建保护绕过凭据。
- 可降级核心流程：PASS。AI/天气失败仍有手工或规则路径。
- 可验证交付：PASS。审计脚本、既有隔离脚本、浏览器清单和部署状态均留证。
- 用户决策边界：PASS。正式发布与密码验收均不自动代替用户决定。

## Project Structure

```text
README.md
.env.example
scripts/verify-sdd-007.mjs
specs/007-release-deploy/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── checklists/requirements.md
├── contracts/release-gate.md
└── tasks.md
```

## Implementation Strategy

1. 静态发布审计先检查必需路由、迁移、质量脚本、环境变量命名和文档关键词，快速阻止漏交付。
2. 复用 SDD-001/003/005/006 的远端脚本覆盖身份、Storage、衣橱、推荐与反馈隔离；SDD-004 使用已记录真实 AI 基准并手工验证降级，不重复计费调用。
3. 390px 浏览器依次核对七个核心页面、图片、水平溢出和关键操作；清除站点数据属于破坏当前浏览器会话的测试，使用独立临时会话或自动脚本证据，不破坏用户当前会话。
4. 更新 README、quickstart、progress 和 AGENTS 后部署 Preview；仅在 READY 后标记完成。

## Complexity Tracking

无需章程例外。发布审计只读仓库文件，数据库与部署继续复用现有项目。
