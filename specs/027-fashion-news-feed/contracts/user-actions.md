# 用户操作契约

## `saveFashionPreferences`

- 仅接受六类主题枚举、`personalized` 与 `unreadEnabled` 布尔值。
- 服务端用 `auth.getUser()` 派生用户 ID，不接受客户端 userId。
- 成功后刷新 `/inspiration`；失败不覆盖原偏好。
- 返回 `{ok, message}`，表单显示保存中、成功或失败；主题全取消时拒绝保存并解释原因。

## `setFashionContentRead`

- 接受服务端当前内容流中存在的稳定 `contentId` 和目标 `read` 状态。
- 已读使用 upsert；未读删除当前账号对应行；重复操作幂等。
- 不允许读取、修改或删除其他账号记录。
- 展开详情、打开原文或按已读按钮可触发；原文仍可正常打开，即使记录失败也需反馈，不把失败当成功。

## `recordFashionImpression`

- 仅在卡片进入视口后提交内容 ID；主题键只能由服务端有效内容派生。
- 通过当前会话调用幂等 RPC，30 天内不可用第二条同主题覆盖首次展示记录。
- 不申请系统通知权限、不弹窗；提醒关闭时不得更新最近提示时间。
