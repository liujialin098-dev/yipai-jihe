# Tasks: SDD-028 国内天气

Input: spec.md、plan.md、research.md、data-model.md、contracts/weather.md、quickstart.md。

## Setup / Foundation

- [x] T001 完成 specs/028-qweather-client/ 规格质量评审与设计；复核 .gitignore。
- [x] T002 在 scripts/verify-sdd-028.mjs 先编写日期、代码、缺失字段及短令牌安全测试并确认失败。
- [x] T003 在 lib/weather/ 增加纯解析与认证/传输底座，lib/recommendations/date.ts 提取共用日期。

## US1 — 生成前看天气（P1）

- [x] T004 [US1] 在 app/api/weather/session/route.ts 实现已登录同源短令牌、账号位置与限频。
- [x] T005 [US1] 在 lib/weather/client.ts 和 components/recommendations/weather-panel.tsx 实现前端直连、取消、错误/过期/重试、归因。
- [x] T006 [US1] 在 app/recommendations/page.tsx、recommendation-controls.tsx 接入状态与日期/城市约束，保留旧快照来源。

## US2 — 当前城市（P1）

- [x] T007 [US2] 在 lib/recommendations/location.ts、device-location.ts 迁移城市解析；weather-city-selector.tsx 更新来源，保留明确定位触发和隐私边界。

## US3 — 推荐一致性（P1）

- [x] T008 [US3] 在 lib/recommendations/weather.ts、validation.ts、constants.ts 接入可信天气与扩展快照兼容。
- [x] T009 [US3] 在 app/recommendations/actions.ts、lib/recommendations/generator.ts 检查位置日期漂移，按真实温度依据生成，不信任客户端温度。

## 验收 / 交付

- [x] T010 运行 check/build、verify:sdd-028 及相关回归；按实际 provider 契约更新旧天气测试，不删除隔离断言。
- [x] T011 浏览器验收 today/tomorrow 直连、错误状态、接口授权与 390px 布局；记录真实天气来源，不消耗 AI 图像额度。
- [x] T012 更新 README.md、AGENTS.md、progress.md 和 quickstart.md；明确本机/手机/Production 各自已验与未验项目。

## Dependencies & Strategy

T001→T002→T003→T004→T005→T006；T007 依赖 T003/T004；T008/T009 依赖解析和城市底座；T010/T011 完成后 T012。先底座后 UI，US1 可单独验证前端请求，US2 可验证城市隔离，US3 可固定样本验证推荐数据源；共享文件顺序修改，不并行覆盖。本阶段不部署。
