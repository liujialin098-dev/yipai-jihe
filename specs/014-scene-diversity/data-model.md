# Data Model: 场景差异化推荐

本阶段不新增数据库表、字段或迁移。以下均为服务端内存模型或独立验收数据。

## OccasionProfile（场景画像）

- `occasion`: `commute | casual | date | formal`，唯一键。
- `label`: 用户可读场景名称。
- `summary`: 供模型与理由使用的整体气质说明。
- `preferredStyles`: 能提供场景正向信号的衣物风格集合。
- `discouragedStyles`: 候选排序时需要降低优先级的风格集合。
- `forbidSportOnly`: 是否禁止仅适合运动场合的单品；正式场景为真。
- `selectionGuidance`: 对核心单品、鞋、外套和配饰选择的简洁指导。

### Validation Rules

- 四个场景必须全部存在且不可重复。
- 正向与冲突风格只能来自现有衣物风格枚举。
- 场景画像不得包含性别限定或强制裙装。

## OccasionFit（场景匹配结果）

- `matchedItemIds`: 提供正向场景信号的不同衣物 ID。
- `signalCount`: `matchedItemIds` 的数量。
- `conflictingItemIds`: 触发硬冲突的衣物 ID。
- `passes`: `signalCount >= 2` 且没有硬冲突。

### Signal Rules

- 衣物 `occasions` 包含目标场景，计一个正向信号。
- 衣物风格属于画像的 `preferredStyles`，也可计一个正向信号。
- 同一衣物无论同时命中多少条件，只计一个信号。
- 正式场景中 `occasions` 只有 `sport` 的衣物计为硬冲突。

## CoreItemSet（核心单品集合）

- 包含类别：上装、下装、连衣裙、鞋、外套。
- 排除类别：配饰。
- 用于固定样本中比较两个场景三套方案的实际重合度。

## SceneDiversityReport（场景差异报告）

- `occasionResults`: 四个场景各自三套结果与匹配状态。
- `pairwiseOverlap`: 六组场景两两比较的 Jaccard 值。
- `maxOverlap`: 六组中的最大值。
- `passes`: 四场景全部匹配、无硬冲突，且充足衣橱下 `maxOverlap <= 0.5`。

该报告只由独立验收生成，不写入业务数据库。
