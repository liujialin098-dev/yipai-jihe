# Data Model: 穿搭画布与分享卡片

## wardrobe_items 扩展

新增字段：

- `cutout_path text null`：透明派生 PNG 的私有 Storage 路径。
- 约束：为空，或以当前行 `user_id/cutouts/` 开头。
- 原有 `image_path` 保持不变，是不可替代的真实性来源。

读取模型新增 `cutoutUrl`。页面优先显示 `cutoutUrl`，缺失或失败时回退 `imageUrl`。

## outfit_canvases

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | uuid | 主键，自动生成 |
| `user_id` | uuid | 当前 Auth 用户，删除账号时级联 |
| `title` | text | 1-30 字符 |
| `background_theme` | text | `lime`、`lilac`、`sky`、`coral`、`paper` |
| `source_recommendation_id` | uuid null | 来源推荐，删除推荐时置空 |
| `source_slot` | smallint null | 1-3 |
| `items` | jsonb | 2-8 个画布衣物对象 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 最近保存时间 |

索引：

- `outfit_canvases_user_updated_idx (user_id, updated_at desc)`：个人主页和列表读取。
- `outfit_canvases_source_recommendation_idx (source_recommendation_id)`：外键与来源查询。

权限：

- `anon` 无表权限。
- `authenticated` 仅有 `SELECT/INSERT/UPDATE/DELETE`。
- 四类 RLS 均以 `(select auth.uid()) = user_id` 限制；UPDATE 同时使用 `USING` 和 `WITH CHECK`。

## CanvasItem JSON

```text
{
  wardrobeItemId: uuid,
  x: number,          // 0.08-0.92，中心点相对坐标
  y: number,          // 0.10-0.88，中心点相对坐标
  scale: number,      // 0.55-1.8
  rotation: number,   // -30 到 30 度
  zIndex: integer     // 1-8，当前画布内唯一
}
```

服务端保存前重新读取当前用户活跃衣物，拒绝重复 ID、跨用户 ID、已归档衣物、非有限数值和越界变换。

## State Transitions

```text
推荐搭配 → 未保存草稿 → 已保存画布 → 再编辑覆盖同一画布
衣物原图 → 本地处理中 → 已保存抠图
                     ↘ 失败，继续使用原图
```

删除或归档衣物时，历史画布记录暂不物理删除；读取时过滤不可用衣物并提示用户重新保存。首版不提供公开链接和协同编辑。

