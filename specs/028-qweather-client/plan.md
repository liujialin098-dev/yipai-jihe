# Implementation Plan: SDD-028 国内天气前端直连

**Branch**: master / spec 028-qweather-client | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

## Summary

服务端签发 5 分钟 JWT，前端直接请求和风 weather/v1，服务端推荐再次独立获取可信天气。共用纯解析器及日期函数，保留账号位置与老快照兼容。不增加库、不迁移数据库、不部署。

## Technical Context

- Language/Version: TypeScript，Next.js 16.3.1、React 19。
- Dependencies: 现有 Supabase SSR；Node crypto Ed25519、fetch；Windows 服务端使用异步系统网络传输，密钥只走进程环境。
- Storage: 现有城市五元组/推荐 JSON；5 分钟进程内真实天气缓存，最多 128 项；签发限频最多 2048 个账号记录。无新增表。
- Testing: Node 固定解析样本、静态密钥与归属门禁、实际 API、浏览器与 check/build。
- Target Platform: 移动 Web/PWA，Vercel Node 服务端和本地 Windows。
- Performance Goals: 请求超时 8 秒，前端可取消；短令牌 300 秒；页面天气超过 5 分钟停止生成并要求刷新。
- Constraints: 不给客户端私钥；不相信客户端天气；失败停止生成；定位主动触发。
- Scope: 推荐页天气、城市查询、设备城市、推荐/灵感天气来源。

## Constitution Check

研究前与设计后均通过：独立 SDD、现有栈、Server Component 默认、私钥最小暴露、Auth 服务端复验、无业务数据迁移、失败显式。不增加通用供应商框架。

## Project Structure

- lib/weather/：纯解析、短 JWT、服务端传输、前端请求。
- lib/recommendations/date.ts：共用日期函数，data.ts 保留重导出。
- app/api/weather/session/：已登录同源凭据与有效位置。
- components/recommendations/：前端天气与生成准备状态。
- scripts/verify-sdd-028.mjs：无付费 AI 固定样本门禁。
- specs/028-qweather-client/：规格/研究/契约/数据/任务/验收。

## Complexity Tracking

无章程例外。明日 apparentTemperatureC 历史字段为兼容规则保留，但和风预报必须同时注明 temperatureBasis=air_minimum，用户文案按此显示。原始现象代码保留，WMO 仅作为粗粒度规则适配。
