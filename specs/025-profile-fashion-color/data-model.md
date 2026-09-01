# Data Model: 时尚个人主页与彩色视觉层

## `public.profiles` 扩展

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `avatar_path` | `text null` | 必须以 `<user_id>/profile/` 开头；仅存私有对象路径 |

`display_name` 沿用现有字段。应用层限制昵称为 1～20 个可见字符；数据库原有 1～40 约束保持向后兼容。

## 个人主页派生数据

- 衣橱件数：当前用户 `wardrobe_items.status = active`。
- 穿搭卡片数：当前用户 `outfit_canvases` 总数。
- 日记天数：当前用户截至今天的 `outfit_diary_entries` 数量。
- 30 天利用率：复用现有日记报告聚合，不新增持久化字段。
- 近期作品：当前用户 `outfit_canvases` 按 `updated_at desc` 最多 4 条。

## Storage 路径

```text
wardrobe-images/<auth.uid()>/profile/avatar-<upload-id>.jpg
wardrobe-images/<auth.uid()>/profile/avatar-<upload-id>.png
wardrobe-images/<auth.uid()>/profile/avatar-<upload-id>.webp
```

任一时刻资料只绑定一个路径；新版本保存成功后清理旧对象，绑定失败时删除未使用的新对象并保留旧头像。
