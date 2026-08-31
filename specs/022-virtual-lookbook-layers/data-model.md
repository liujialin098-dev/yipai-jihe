# 数据模型：虚拟模特与分层穿搭

## 分层穿搭（现有 JSON 扩展）

- `slot`：1～3，套装位置。
- `title`、`reason`、`stylingPoint`、`styleTags`：沿用现有字段。
- `itemIds`：3～7 个当前用户活跃衣物 ID，套内和跨套均不得重复。
- `lookbookImagePath`：可空私有对象路径。
- `lookbookModel`：可空图像模型标识。
- `lookbookGeneratedAt`：可空 ISO 时间。

### 状态转换

1. 新推荐：三个 Lookbook 字段均为空。
2. 图像生成成功：同一事务顺序内先上传图片，再写回三个字段。
3. 图像生成失败：字段不变，推荐仍可用。
4. 该套换件：三个字段归零，旧对象可由相同路径后续覆盖。

## 衣物角色（派生视图）

- `base`：两件上装中更适合作内搭的一件。
- `main`：单件上装，或两件上装中的主上装。
- `outerwear`：外套。
- `bottom`：下装。
- `dress`：连衣裙，与上装/下装互斥。
- `shoes`：鞋。
- `accessory`：配饰，最多 2 件。

派生角色不持久化；同一套装与同一衣物目录必须得到稳定结果。

## Lookbook 私有对象

- Bucket：`wardrobe-images`（现有私有空间）。
- Path：`<user-id>/lookbooks/<recommendation-id>/<slot>.png`。
- Content-Type：`image/png`。
- 写入：当前会话用户，仅允许自身路径。
- 读取：服务端验证路径前缀后生成短期签名地址。

