# Tasks: 时尚个人主页与彩色视觉层

## Phase 1: 数据与资料基础

- [x] T001 创建 SDD-025 规格、计划、研究、模型、契约、快速验收和清单
- [x] T002 在迁移中增加 `profiles.avatar_path` 路径约束，并更新数据库类型
- [x] T003 在 `lib/profile/validation.ts` 建立昵称、头像格式、大小和路径校验
- [x] T004 在 `lib/auth/viewer.ts` 读取头像短期签名地址并提供首字回退

## Phase 2: 个人主页与资料编辑

- [x] T005 [US1] 在 `lib/profile/data.ts` 聚合当前账号衣橱、画布、日记、30 天利用率与近期卡片
- [x] T006 [US1] 建立 `/profile` 页面和近期无人物穿搭卡片网格
- [x] T007 [US2] 在 `app/profile/actions.ts` 实现当前账号昵称和头像路径更新、旧对象清理与重新验证
- [x] T008 [US2] 在 `components/profile/profile-editor.tsx` 实现头像预检、私有上传、昵称保存、回退和状态反馈
- [x] T009 [US1] 将顶部设置按钮替换为头像个人主页入口，并在个人主页保留设置入口

## Phase 3: 时尚多彩视觉层

- [x] T010 [US3] 在 `app/globals.css` 增加青柠、丁香紫、珊瑚橙、天空蓝 token 与可访问降级
- [x] T011 [US3] 更新应用背景、首页重点卡、导航状态、推荐与个人主页的统一色彩使用
- [x] T012 [US3] 保持 `BrandMark`、原有导航结构、语义排版和减少动态/透明度边界

## Phase 4: 验收与交付

- [x] T013 建立 `scripts/verify-sdd-025.mjs`，覆盖输入、静态视觉、双账号 RLS 和 Storage 隔离
- [x] T014 运行 check、build、SDD-025、SDD-024 及 390px 浏览器验收
- [x] T015 应用迁移并检查 Supabase 安全/性能顾问
- [x] T016 更新 `progress.md`、`AGENTS.md` 和两个阶段的完成记录
- [x] T017 提交本轮代码与文档，不包含用户未追踪文件

## Dependencies

T001 → T002～T004 → T005～T009 → T010～T012 → T013～T017。

## Implementation Strategy

先让个人资料和统计在现有私有数据边界内成立，再加入视觉表达。颜色必须来自固定 token，不能随机污染功能层级；头像上传失败不能影响昵称和原头像。
