# 精准搭配预览契约

## 输入

```ts
type PrecisionOutfitPreviewProps = {
  title: string;
  items: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    roleLabel: string;
  }>;
};
```

## 输出行为

- 不产生网络请求或副作用。
- 依据输入顺序显示层次角色和真实图片。
- `imageUrl` 为空时显示 `name`，并保留 `roleLabel`。
- 人物素材只作比例参照，界面必须显示“不是真实试穿”的说明。

