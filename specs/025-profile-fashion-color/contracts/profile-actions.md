# Contract: Profile Actions

## `updateProfile(input)`

输入：

- `displayName`: 1～20 个可见字符。
- `avatarPath`: 省略或严格匹配 `<current-user-id>/profile/avatar-<upload-id>.(jpg|png|webp)`。

服务端行为：

1. 使用 `auth.getUser()` 获取当前账号。
2. 校验昵称与头像路径，不信任客户端用户 ID。
3. 读取当前资料，只更新当前账号行。
4. 头像路径变化后删除当前账号旧头像对象。
5. 刷新 `/profile`、`/settings` 与根布局相关页面。

返回：`success | error`、用户可读消息和新的短期头像地址。

## 客户端头像上传

- 接受 `image/jpeg`、`image/png`、`image/webp`。
- 最大 5MB。
- 每次上传使用新的 UUID 路径，避免保存失败时覆盖原头像。
- 绑定 Action 失败时删除本次未绑定对象。
- 不将私有对象路径显示在界面、日志或分享图中。
