# Phase 1 数据模型：我的衣橱与演示数据

## `public.wardrobe_items`

每行表示当前用户衣橱中的一件单品。

| 字段 | 类型 | 规则 | 用途 |
| --- | --- | --- | --- |
| `id` | `uuid` | 主键，默认随机生成 | 衣物稳定标识 |
| `user_id` | `uuid` | 必填，外键 `auth.users(id)`，用户删除时级联 | 数据归属与 RLS |
| `demo_key` | `text` | 可空，与 `user_id` 联合唯一 | 24 件演示数据幂等标识 |
| `name` | `text` | 1～60 字符 | 展示与搜索名称 |
| `category` | `text` | 白名单 | 上装、下装、连衣裙、外套、鞋、配饰 |
| `primary_color` | `text` | 白名单 | 主色筛选 |
| `material` | `text` | 白名单 | 材质属性 |
| `style` | `text` | 白名单 | 风格属性 |
| `seasons` | `text[]` | 至少一项且均在白名单 | 春、夏、秋、冬，多选 |
| `occasions` | `text[]` | 至少一项且均在白名单 | 通勤、休闲、约会、正式、运动，多选 |
| `image_path` | `text` | 必填，首段必须等于 `user_id`，同用户唯一 | 私有原图对象路径 |
| `status` | `text` | `active` 或 `archived` | 日常展示与归档恢复 |
| `created_at` | `timestamptz` | 默认当前时间 | 创建时间 |
| `updated_at` | `timestamptz` | 默认当前时间，更新触发器维护 | 最近修改时间 |

## 约束与索引

- `unique (user_id, demo_key)`：同一用户的非空演示标识最多一条；空标识允许多条未来手动衣物。
- `unique (user_id, image_path)`：一件衣物独占一个原图路径，支持明确的永久删除语义。
- `(user_id, status, category)` B-tree：覆盖默认列表和类别浏览。
- 名称包含搜索在当前 MVP 规模使用 RLS 约束后的顺序扫描；不为 24 件演示数据提前引入全文检索扩展。
- `seasons`、`occasions` GIN：覆盖数组包含筛选。
- `updated_at` 触发器：任何更新自动刷新时间。

## 枚举白名单

- `category`：`tops`、`bottoms`、`dresses`、`outerwear`、`shoes`、`accessories`
- `primary_color`：`black`、`white`、`gray`、`navy`、`blue`、`green`、`beige`、`brown`、`red`、`pink`、`purple`、`yellow`
- `material`：`cotton`、`linen`、`denim`、`knit`、`wool`、`silk`、`leather`、`synthetic`
- `style`：`minimal`、`casual`、`commute`、`elegant`、`sporty`、`vintage`
- `seasons`：`spring`、`summer`、`autumn`、`winter`
- `occasions`：`commute`、`casual`、`date`、`formal`、`sport`

## 权限模型

### 表授权

- `authenticated`：允许 `SELECT`、`INSERT`、`UPDATE`、`DELETE`。
- `anon`：无表权限。
- 不向浏览器使用 `service_role`。

### RLS

- `SELECT`：`auth.uid() = user_id`
- `INSERT`：`auth.uid() = user_id`
- `UPDATE`：旧行和新行均要求 `auth.uid() = user_id`
- `DELETE`：`auth.uid() = user_id`

### Storage

- 复用私有 bucket `wardrobe-images`。
- 对象路径固定为 `<auth.uid()>/demo/<demo_key>.png`。
- 复用 SDD-001 的读、写、更新和删除策略：`storage.foldername(name)[1] = auth.uid()::text`。
- 列表和详情仅返回短期签名 URL，不把 `image_path` 输出到 UI。

## 状态转换

```text
active --归档--> archived --恢复--> active
   \________________ 永久删除 ________________/
```

- 归档只修改 `status`，不移动或删除图片。
- 恢复只修改 `status`。
- 永久删除先删除独占图片，再删除行；失败时返回明确的可重试结果。

## 演示目录

- 固定 24 项，每类 4 项，共 6 类。
- 每项具有稳定 `demo_key`、完整属性和一张代码生成的合成 PNG。
- 同一用户只补齐缺少的 `demo_key`；已编辑的演示衣物不被重复加载覆盖。
- 不在数据库创建跨用户共享的演示模板表，目录直接随应用版本管理。
