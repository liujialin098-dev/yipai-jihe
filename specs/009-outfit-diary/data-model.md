# Data Model: 穿搭日记与基础衣物利用率报告

## `public.outfit_diary_entries`

| 字段 | 类型 | 约束与用途 |
| --- | --- | --- |
| `id` | `uuid` | 主键，默认 `gen_random_uuid()` |
| `user_id` | `uuid` | 非空，关联 `auth.users(id)`，账号删除时级联 |
| `worn_on` | `date` | 非空；与 `user_id` 组合唯一 |
| `title` | `text` | 去空格后 1～40 字符 |
| `occasion` | `text` | `commute/casual/date/formal/sport` |
| `source` | `text` | `recommendation/manual` |
| `source_recommendation_id` | `uuid` | 可空；保存时的推荐弱引用，不设外键，推荐刷新或删除后日记仍独立保留 |
| `source_outfit_slot` | `smallint` | 可空；1～3，必须与推荐引用同时出现 |
| `item_ids` | `uuid[]` | 1～8 个、无空值、无重复、全部属于当前用户 |
| `outfit_snapshot` | `jsonb` | 非空对象；保存时衣物文字快照 |
| `note` | `text` | 非空默认空串，最多 160 字符 |
| `created_at` | `timestamptz` | 默认 `now()` |
| `updated_at` | `timestamptz` | 默认 `now()`，更新触发器维护 |

### 索引

- 唯一索引：`(user_id, worn_on)`，保证一天一条并支持 upsert。
- 读取索引：`(user_id, worn_on desc)`，支持月份和日期范围读取。
- `item_ids` 不单独建 GIN：报告先按高选择性的用户和日期读取少量行，再在应用层聚合。

### RLS 与授权

- `anon`：无表权限。
- `authenticated`：`select/insert/update/delete`。
- 四类策略均要求 `(select auth.uid()) = user_id`；update 同时包含 `using` 和 `with check`。
- insert/update 触发器再次确认数组中的每个衣物 ID 都属于 `NEW.user_id`，防止直接 Data API 写入跨用户引用。

### 快照格式

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "海军蓝衬衫",
      "category": "tops",
      "primaryColor": "navy",
      "style": "commute"
    }
  ]
}
```

快照不保存签名图片 URL、用户 ID、价格、天气或敏感数据。展示图片始终从当前用户仍存在的衣物记录获取；不存在时使用文字快照。

## 派生模型：利用率报告

报告不持久化，输入为目标范围日记与当前可见日常衣物。

- `recordedDays`: 目标范围日记行数。
- `itemWearEvents`: 所有日记 `item_ids` 长度之和。
- `usedItemCount`: 当前可见日常衣物中，目标范围至少出现一次的去重数量。
- `activeItemCount`: 当前可见日常衣物总数。
- `utilizationRate`: `activeItemCount = 0` 时为 0，否则四舍五入到整数百分比。
- 每件衣物：`wearCount`、`lastWornOn`、`status = frequent | worn | unused`。

## 状态与写入规则

1. 推荐写入：服务端读取推荐、验证日期不是未来、解析套装、查询当前衣物、生成快照、按 `(user_id,worn_on)` upsert。
2. 手工写入：服务端校验日期/字段、重查全部当前可见日常衣物、生成快照、upsert。
3. 编辑：复用手工写入，保留 `created_at`，更新来源为 `manual`。
4. 删除：只删除当前用户日记行；衣物和推荐不受影响。
