# 数据模型

## wardrobe_items 变更

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `brand` | `text nullable` | 去除首尾空格后 1～40 字符，或为空 | 用户最终确认的品牌；不是品牌真伪结论 |
| `style` | `text` | 14 个稳定枚举之一 | 保持单值主风格 |

现有 `user_id`、RLS、图片路径和生命周期不变。

## preference_feedback_events 变更

`style` 的允许值同步扩展到 14 个；事件账本和重算机制不变。

## user_preferences

不新增字段。`preferred_styles text[]` 与 `style_scores jsonb` 已能容纳新风格；服务端仍只接受统一风格目录中的 1～3 项。

## 推荐风格方向

非持久化输入：

- `auto`：根据场景兼容集合、长期偏好和库存生成三个方向。
- 指定风格：必须在当前场景兼容集合中。

输出仍存入 `daily_recommendations.outfits`，每套新增/规范：

- `styleTags`：1～3 个稳定风格，第一项为该套目标方向。
- `stylingPoint`：最多 60 个汉字的可执行搭配要点。

## 趋势灵感条目

代码内只读实体：`id`、`title`、`summary`、`style`、`occasions`、`publishedAt`、`validUntil`、`sourceName`、`sourceUrl`。过期条目不显示“本季”标记。

