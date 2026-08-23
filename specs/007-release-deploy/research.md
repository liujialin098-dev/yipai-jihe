# Research: 全链路加固与受控上线

## 决策 1：Preview 作为受控评审环境

- **Decision**: 部署独立 Vercel Preview，保留现有 Vercel Authentication，不提升为 Production。
- **Rationale**: 能验证真实构建和服务端环境，同时不改变正式域名和访问边界。
- **Alternatives considered**: 直接生产发布、生成保护绕过链接。前者需要用户明确发布决策，后者会扩大访问授权，均不自动执行。

## 决策 2：迁移目录是唯一建表来源

- **Decision**: README 只说明迁移顺序，不复制第二份建表 SQL。
- **Rationale**: 避免文档 SQL 与已应用迁移漂移，满足可复现部署。
- **Alternatives considered**: 在 README 粘贴完整 SQL。后续极易过期。

## 决策 3：发布审计与远端业务验证分层

- **Decision**: `verify:sdd-007` 做快速、无网络、无秘密值的静态发布审计；远端 RLS 继续由各阶段验证命令覆盖。
- **Rationale**: 每次提交可快速运行，且不会重复创建大量测试数据或消耗 AI 额度。
- **Alternatives considered**: 一个脚本串行执行全部 SDD 和真实 AI。耗时、网络和成本波动会降低可重复性。

## 决策 4：真实 AI 证据不重复付费

- **Decision**: 复用 SDD-004 已记录的 10/10 真实识别证据；本轮重新验证配置边界、手工降级和规则推荐。
- **Rationale**: 真实模型能力已在相同 Vercel 项目与配置验收，重复 10 张识别不会增加发布信心。
- **Alternatives considered**: 每次发布跑 10 张真实识别。留作模型或提示词变化后的专项回归。
