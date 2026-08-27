# 任务：首次账号入口

**输入**：`specs/016-auth-entry-gateway/` 下的规格与设计文档
**前置**：`spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/auth-entry.md`

## 阶段 1：准备

- [x] T001 核对现有认证入口、自动匿名初始化与应用外壳边界，记录到 `specs/016-auth-entry-gateway/research.md`
- [x] T002 [P] 建立 SDD-016 静态和远端认证门禁骨架 `scripts/verify-sdd-016.mjs`
- [x] T003 [P] 在 `package.json` 增加 `verify:sdd-016` 命令

## 阶段 2：共享认证底座

- [x] T004 扩展 `lib/auth/actions.ts`，让同一注册动作支持无会话直接邮箱密码注册和体验账号原地升级
- [x] T005 [P] 补齐 `lib/auth/errors.ts` 的账号已存在、无即时会话和服务失败中文反馈
- [x] T006 移除 `components/session-bootstrap.tsx` 的自动匿名创建，改为无会话深链接返回统一入口

**检查点**：未主动点击体验前不会创建匿名身份，直接注册具备服务端完成门禁。

## 阶段 3：用户故事 1——进入应用前先选择身份（P1）

**目标**：无会话首页只显示完整账号入口，已有会话继续进入原首页。

**独立测试**：全新会话打开和刷新 `/` 三次，均没有应用 chrome 或自动体验身份；已有会话打开 `/` 显示原首页。

- [x] T007 [US1] 创建统一账号入口组件 `components/auth/auth-entry-gateway.tsx`
- [x] T008 [US1] 重构 `app/page.tsx`，先按 `getViewer()` 分流且无会话不读取衣橱数据
- [x] T009 [US1] 更新 `components/app-shell.tsx`，无会话时隐藏状态栏、底部 Dock 和业务页底部留白
- [x] T010 [US1] 在 `app/globals.css` 增加入口布局和分段选择样式，并覆盖 390px、减少动态和减少透明度

## 阶段 4：用户故事 2——邮箱密码直接注册（P1）

**目标**：新用户无需邮箱链接即可注册并立即进入应用。

**独立测试**：合成邮箱提交后立即得到会话；退出并重新登录仍是同一用户。

- [x] T011 [US2] 将直接注册表单提取并复用到 `components/auth/account-forms.tsx` 与 `components/auth/auth-entry-gateway.tsx`
- [x] T012 [US2] 验证账号已存在、字段不合法和 Confirm email 误开时的失败状态 `scripts/verify-sdd-016.mjs`

## 阶段 5：用户故事 3——登录或明确体验后进入应用（P2）

**目标**：登录和体验均由用户明确触发，退出返回统一入口。

**独立测试**：已有账号登录恢复；新上下文点击体验后才创建匿名身份；退出后回到入口。

- [x] T013 [US3] 复用并调整 `components/auth/login-form.tsx`，让统一入口可只渲染登录表单且保留旧登录页兼容
- [x] T014 [US3] 更新 `lib/auth/actions.ts` 与 `app/login/page.tsx` 的体验失败和退出目标，统一回到 `/`

## 阶段 6：验收与交付

- [x] T015 运行 `npm run check`、`npm run build`、`npm run verify:sdd-016` 和 SDD-002 回归
- [x] T016 在 390px 浏览器完成首次入口、直接注册、退出重登、显式体验和无控制台错误验收，记录到 `specs/016-auth-entry-gateway/quickstart.md`
- [x] T017 更新 `progress.md` 与 `AGENTS.md` 的阶段状态、行为边界、验收、部署和提交记录
- [x] T018 发布既有 `yipai-jihe` Production，检查固定域名核心页面与最近错误日志

## 依赖与执行顺序

- 阶段 1 → 阶段 2 → 用户故事 1 → 用户故事 2 → 用户故事 3 → 验收交付。
- T002 与 T003 可并行；T005 可与 T004 的主逻辑准备并行。
- 用户故事 1 是可发布的最小增量；用户故事 2 和 3 完成完整身份闭环。
- T018 仅在 T015、T016 全部通过后执行。

## AI Coding 实施策略

本 SDD 作为一段中等复杂度 AI Coding 对话完成。优先切断自动匿名副作用，再完成入口 UI，最后接入直接注册和登录；不在本阶段扩展忘记密码、社交登录或数据库结构。
