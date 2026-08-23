# Server Action Contract: 换件、收藏与偏好

## `replaceRecommendationItem`

输入：`recommendationId`、`slot`、`currentItemId`、`replacementItemId`。

- 验证当前用户、当日批次、目标位置、候选归属/状态/类别和全批次未占用。
- 用现有推荐验证器校验替换后的三套；失败不写入。
- 成功更新 JSONB、记录 `replace` 事件、重算偏好并重验证推荐页。

## `toggleItemFavorite`

输入：`wardrobeItemId`、`intent=add|remove`。

- add 使用唯一约束幂等插入；remove 只删除当前用户关系。
- 仅在状态真正变化时记录对应 ±1 风格事件并重算偏好。

## `toggleOutfitFavorite`

输入：`recommendationId`、`slot`、`sourceKey`、`intent=add|remove`。

- add 必须从服务端当前推荐重建可信快照，不接受客户端自报标题、图片或衣物列表。
- 每个风格记录 ±0.5 事件；remove 不删除原推荐。

## `savePreferenceQuestionnaire`

输入：`styles[]`、`occasions[]`、`focus`、`intent=save|skip`。

- save 要求 1～3 个合法风格和 1～3 个合法场合；按顺序写入 3/2/1 分与侧重点映射。
- skip 写入默认风格、场合、侧重点与 `skipped` 状态。
- 重复提交覆盖问卷来源事件，不重复叠加。

## 统一结果

```ts
type FeedbackActionState = {
  status: "idle" | "success" | "error";
  message: string;
};
```

- 所有 Action 必须返回用户可理解的中文结果，不返回内部 SQL、密钥或原始模型输出。
