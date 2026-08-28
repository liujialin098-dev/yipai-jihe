---

description: "SDD-003 我的衣橱与演示数据实施任务"
---

# 任务：我的衣橱与演示数据

**输入**：`specs/003-wardrobe-core/` 下的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/` 和 `quickstart.md`

**组织方式**：先完成阻塞所有故事的数据底座，再按 P1 演示衣橱、P2 查找衣物、P3 维护单品的顺序实现；每个故事结束时都保留可独立验收的检查点。

## 格式：`[ID] [P?] [Story] 任务说明`

- **[P]**：可与同阶段其他不同文件任务并行。
- **[US1/US2/US3]**：对应 `spec.md` 的用户故事。
- 每项都包含明确文件路径和完成结果。

## Phase 1：准备与边界确认

**目的**：锁定当前 SDD 范围和既有技术边界。

- [x] T001 确认 SDD-003 规格、研究、数据模型、操作契约与验收方案完整，并更新 `.specify/feature.json`
- [x] T002 检查 `.gitignore`、`package.json`、现有 Supabase 客户端与应用外壳，确认无需新增运行时依赖

---

## Phase 2：共享数据底座（阻塞）

**目的**：所有用户故事开始前完成衣物模型、安全策略和类型。

- [x] T003 按 `data-model.md` 创建 `supabase/migrations/<timestamp>_wardrobe_core.sql`，包含约束、索引、updated_at 触发器、显式 GRANT 与四类 RLS 策略
- [x] T004 将最终迁移应用到 Supabase 项目 `gmjtzmxuveoaqcdmuifr`，复核表、RLS、授权和私有 bucket 状态
- [x] T005 重新生成并写入 `lib/supabase/database.types.ts`，确保 `wardrobe_items` 类型与远端一致
- [x] T006 [P] 在 `lib/wardrobe/constants.ts` 和 `lib/wardrobe/validation.ts` 建立属性白名单、中文标签、查询参数与表单校验
- [x] T007 [P] 在 `lib/wardrobe/data.ts` 建立当前用户列表、计数、详情和短期签名 URL 读取函数

**检查点**：衣物记录和图片路径具备可复现的当前用户隔离边界。

---

## Phase 3：用户故事 1——一键建立演示衣橱（P1）🎯

**目标**：空匿名用户一次操作获得 24 件完整、私有、可重复补齐的演示衣物。

**独立验收**：新会话加载后恰好 24 件；连续执行 3 次仍为 24；部分缺失时只补齐缺失项。

- [x] T008 [P] [US1] 在 `lib/wardrobe/catalog.ts` 定义 24 个稳定 `demo_key` 和覆盖 6 类的完整演示属性
- [x] T009 [P] [US1] 在 `lib/wardrobe/demo-image.ts` 实现按类别与颜色生成安全合成 PNG
- [x] T010 [US1] 在 `app/wardrobe/actions.ts` 实现逐次鉴权、缺失检测、私有图片上传和唯一约束兜底的 `loadDemoWardrobe`
- [x] T011 [US1] 在 `components/wardrobe/demo-loader.tsx` 实现加载中、成功、部分失败和重试反馈
- [x] T012 [US1] 在 `app/wardrobe/page.tsx` 接入空衣橱入口与加载后基础卡片结果，确认 24 件原图均可显示
- [x] T013 [US1] 用新匿名会话执行 1 次加载、3 次重复加载和 1 次删除后补齐验收，记录实际数量与耗时

**检查点**：不依赖 AI 或上传功能即可稳定建立推荐可用的衣橱数据。

---

## Phase 4：用户故事 2——快速找到衣物（P2）

**目标**：支持分类、关键词及颜色/季节/场合/状态组合查找。

**独立验收**：任意查询结果满足所有已选条件，清除条件恢复完整未归档列表，已归档列表独立可见。

- [x] T014 [US2] 在 `lib/wardrobe/data.ts` 完成白名单 URL 参数解析和 Supabase AND 组合查询
- [x] T015 [P] [US2] 在 `components/wardrobe/filter-panel.tsx` 实现 GET 搜索、多条件筛选、结果数量和一键清除
- [x] T016 [P] [US2] 在 `components/wardrobe/item-card.tsx` 实现移动端原图卡片、属性摘要、归档标识和详情入口
- [x] T017 [US2] 完成 `app/wardrobe/page.tsx` 的分类导航、正常列表、空衣橱和筛选无结果三种状态
- [x] T018 [US2] 更新 `app/page.tsx` 展示当前衣物数量与衣橱入口，不提前引入推荐逻辑
- [x] T019 [US2] 使用 24 件演示数据验收关键词、单类别、三维组合、空结果、清除条件和已归档筛选，记录返回正确性与耗时

**检查点**：用户无需滚动全部数据即可定位目标衣物。

---

## Phase 5：用户故事 3——维护单件衣物（P3）

**目标**：完成详情、编辑、归档、恢复和确认永久删除闭环。

**独立验收**：一件衣物可在 2 分钟内完成查看、修改、归档、恢复和删除，记录与原图状态一致。

- [x] T020 [US3] 在 `app/wardrobe/actions.ts` 实现更新、归档、恢复和永久删除，所有操作重新鉴权并返回可重试反馈
- [x] T021 [P] [US3] 在 `components/wardrobe/action-button.tsx` 实现 pending 状态与永久删除确认
- [x] T022 [P] [US3] 在 `components/wardrobe/item-form.tsx` 实现属性编辑、客户端基础约束和服务端字段错误展示
- [x] T023 [US3] 创建 `app/wardrobe/[id]/page.tsx`，展示原图、全部属性、固定收藏状态和固定推荐使用情况
- [x] T024 [US3] 创建 `app/wardrobe/[id]/edit/page.tsx` 并接入保存后详情刷新与跳转
- [x] T025 [US3] 创建 `app/wardrobe/[id]/not-found.tsx`，统一不存在、已删除和无权访问结果
- [x] T026 [US3] 验收有效编辑、无效字段、归档、恢复、确认取消删除、永久删除和直接访问已删除详情

**检查点**：三个用户故事均可独立演示，且后续推荐能够信任衣橱状态。

---

## Phase 6：跨故事安全、质量与交付

**目的**：用可重复证据确认安全、移动端体验和阶段完成状态。

- [x] T027 在 `scripts/verify-sdd-003.mjs` 实现双匿名会话的自身访问、交叉读取/修改/删除与 Storage 下载/删除隔离检查，并清理测试数据
- [x] T028 在 `package.json` 增加 `verify:sdd-003`，运行并通过 `npm run check`、`npm run build`、`npm run verify:sdd-003`
- [x] T029 运行 Supabase Security 与 Performance Advisors，处理新增问题或把可接受提示和理由记录到 `specs/003-wardrobe-core/quickstart.md`
- [x] T030 使用 390px 浏览器按 `specs/003-wardrobe-core/quickstart.md` 验收完整核心流程、加载状态、图片和水平溢出
- [x] T031 将全部完成项勾选并把验收证据写入 `specs/003-wardrobe-core/tasks.md` 与 `specs/003-wardrobe-core/quickstart.md`
- [x] T032 更新 `progress.md` 的 SDD-003 状态、日期、数量、验收、限制、下一步和提交记录
- [x] T033 更新 `AGENTS.md` 的项目速览、数据模型、质量命令和当前阶段，确保后续每阶段完成后继续维护 `progress.md`
- [x] T034 检查 Git diff 仅包含 SDD-003 范围且不包含用户未跟踪文件，然后创建阶段完成提交
- [x] T035 [US1] 2026-08-28 收敛演示入口：按体验身份、真实衣物和内置目录完整度显隐，部分失败提供继续加载，Action 内重新鉴权并阻止绕过

---

## 依赖与执行顺序

1. Phase 1 → Phase 2：数据模型与类型阻塞所有故事。
2. Phase 3（US1）→ Phase 4（US2）：筛选验收依赖稳定的 24 件演示数据。
3. Phase 4（US2）→ Phase 5（US3）：详情入口复用列表卡片，但维护操作仍可通过直接 URL 独立验收。
4. Phase 6 依赖 US1～US3 全部完成；任何质量门禁失败都不得更新为“已完成”。

## 可并行项

- T006 与 T007 可在迁移 SQL 确定后并行。
- T008 与 T009、T015 与 T016、T021 与 T022 分别修改不同文件，可并行。
- Supabase Advisors 与本地静态检查可在功能冻结后并行，但浏览器验收必须使用最终实现。

## 实施策略

1. 先让新用户可稳定获得 24 件私有演示衣物，形成最小可演示增量。
2. 再完善查找能力，确认 20 件以上衣橱仍可高效使用。
3. 最后补齐单品维护和跨用户安全验收。
4. 完成后立即更新 `progress.md`；该文件继续作为唯一进度追踪入口。

## 完成验收记录（2026-08-21）

- 空匿名会话一次加载得到 24 件合成衣物；连续补齐 3 次均返回“已经齐全”，精确衣物链接仍为 24 个；编辑后的演示名称在再次补齐后保持不变。
- 关键词“针织”返回 3 件；上装返回 4 件；黑色 + 冬季 + 通勤返回 3 件；空结果、清除条件、归档列表均正确。真实交互预热后 3 次采样中，关键词和三维组合筛选中位响应分别为 1.707 秒与 1.847 秒。
- 有效编辑和缺少季节的服务端字段错误通过；归档后日常列表从 24 件降为 23 件，已归档列表显示 1 件，恢复后状态正确；取消永久删除后记录仍存在。
- 经用户确认，永久删除合成测试衣物“深夜针织上衣·已验收”及对应图片；原详情显示“没有找到这件衣物”。补齐入口随后只创建 1 件新的默认“深夜针织上衣”，总数恢复为 24。
- 390px 视口 `innerWidth=390`、内容宽度 375，无水平溢出；24 张列表图片无加载失败，浏览器控制台无错误。
- `npm run check`、`npm run build`、`npm run verify:sdd-003` 通过；视觉重构后的最终隔离会话为 A `21678F4C`、B `D7900399`。
- 远端复核：RLS 已开启、4 条策略、`authenticated` 四类 CRUD、`anon` 无 SELECT、`wardrobe-images` 私有。安全顾问仅有匿名体验策略提醒和 P1 密码保护提醒；性能顾问仅提示两个新 GIN 索引尚无累计使用记录。
- 完成后视觉增补：全局改为冷白黑高对比、统一软圆角与固定玻璃 Dock；390px 下全部已完成路由无水平溢出，图片无损坏，控制台无错误，业务功能和数据边界保持不变。
- 完成后素材增补：24 件演示衣物升级为 768px WebP 无人物棚拍图，总大小约 0.63MB；演示图按 `demo_key` 直接使用静态资源，真实用户图片继续使用私有 Storage 签名 URL。最终隔离会话 A `BE081706`、B `35DFDAD5` 通过。
- 2026-08-28 后续优化：正式账号、已有真实衣物或完整演示衣橱不再出现加载入口；体验身份部分失败时显示“继续加载演示衣橱”。`npm run check`、`npm run build`、`npm run verify:sdd-007`、`npm run verify:sdd-018` 通过，本地 68 件衣橱无入口、无旧技术文案和浏览器 error；实现提交为 `0838ef0`。
