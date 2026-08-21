# SDD-003 独立验收：我的衣橱与演示数据

## 前置条件

1. `.env.local` 已配置当前 Supabase 项目的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
2. Supabase 已开启 Anonymous Sign-Ins。
3. `wardrobe_core` 迁移已应用，`wardrobe-images` 保持私有。

## 启动与质量门禁

```powershell
npm run check
npm run build
npm run dev
```

预期：静态检查和构建均成功，本地应用可以创建或恢复匿名会话。

## 核心流程验收

使用 390px 宽的全新浏览器会话：

1. 打开 `/wardrobe`，确认空衣橱提示与“加载演示衣橱”入口不同于筛选无结果提示。
2. 点击加载，确认按钮展示进行中状态，完成后恰好显示 24 件衣物和 6 个类别。
3. 连续再加载 3 次，确认总数仍为 24，已编辑项目不会被还原。
4. 使用名称关键词、类别，以及颜色 + 季节 + 场合组合筛选；确认所有结果均满足条件，清除后恢复 24 件未归档衣物。
5. 打开一件衣物，确认原图、全部基础属性、“未收藏”和“尚未用于推荐”可见。
6. 修改名称及多个属性并保存，确认列表与详情立即更新。
7. 归档该衣物，确认默认列表减少 1 件；切换已归档后可找到并恢复。
8. 再次进入详情并确认永久删除，确认记录消失且直接访问原详情显示未找到。
9. 确认全过程无水平溢出、死链接或无法结束的加载状态。

## 隔离验收

```powershell
npm run verify:sdd-003
```

预期：

- 两个独立匿名会话都能创建、读取、修改和删除自己的测试衣物与私有图片。
- 会话 A 无法读取、修改、删除会话 B 的衣物记录。
- 会话 A 无法下载或删除会话 B 的图片对象，反向检查同样成立。
- 脚本仅使用合成 SVG，完成后清理本次测试记录和图片。

## Supabase 复核

1. 确认 `public.wardrobe_items` 已启用 RLS，四类用户所有权策略存在。
2. 确认 `authenticated` 只有 `SELECT/INSERT/UPDATE/DELETE`，`anon` 无表权限。
3. 确认 `wardrobe-images` 仍为私有，路径第一段为当前 `auth.uid()`。
4. 运行 Security 与 Performance Advisors，记录所有新增提示及处理结果。

## 通过标准

- `spec.md` 中 SC-001 至 SC-007 均有实际证据。
- `tasks.md` 所有任务已勾选。
- `npm run check`、`npm run build`、`npm run verify:sdd-003` 全部通过。
- `progress.md` 与 `AGENTS.md` 已更新完成日期、测试数据、限制、下一步和提交记录。
