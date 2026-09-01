# Feature Specification: 精准搭配预览

**Feature Branch**: `023-precision-outfit-preview`

**Created**: 2026-08-31

**Status**: 本地开发完成，待用户调试

**Input**: User description: 使用真实衣物图片生成快速且准确的固定虚拟人物搭配预览，不依赖通用文生图猜测衣服

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 查看不改款的精准搭配预览 (Priority: P1)

用户在推荐页查看一套搭配时，首先看到固定无身份虚拟人物作为比例参照，同时看到这套搭配中真实衣物原图按穿搭角色排列。预览不重新绘制服装，不把衣物原图伪装成已经准确穿到人物身上。

**Why this priority**: 这是解决当前“AI 生成图改款、改色、漏配饰”问题的最短路径，先保证衣物信息可信，再考虑更真实的虚拟试穿。

**Independent Test**: 在推荐页打开已有三套方案，逐套核对预览中的衣物图片与下方实拍清单完全一致，并确认页面加载不触发新的图像模型请求。

**Acceptance Scenarios**:

1. **Given** 一套包含内搭、主上装、外套、下装、鞋履和配饰的推荐，**When** 用户打开推荐页，**Then** 虚拟人物和真实衣物分层板同时出现，角色顺序稳定。
2. **Given** 某件衣物没有图片，**When** 预览加载，**Then** 该位置显示衣物名称和角色，不影响其他衣物显示。

---

### User Story 2 - 保留现有 AI 效果图作为可选增强 (Priority: P2)

用户仍可主动点击原有“生成虚拟模特效果图”按钮获得更真实的氛围参考，但系统明确标注该图可能存在偏差，真实衣物原图和精准搭配预览始终保留。

**Why this priority**: 真实感有价值，但不能覆盖准确性；将 AI 图降级为可选增强可以避免不准确图片破坏核心推荐。

**Independent Test**: 在不点击生成按钮的情况下，精准预览可独立工作；点击按钮后，AI 图出现时仍能看到真实衣物清单和准确预览。

**Acceptance Scenarios**:

1. **Given** AI 图生成失败或用户未生成，**When** 用户查看推荐，**Then** 页面仍显示精准搭配预览，不显示错误遮罩。

---

### User Story 3 - 移动端清晰核对 (Priority: P3)

用户在 390px 手机宽度下可以快速识别人物参照、衣物角色和原图，不需要横向滚动或依赖复杂操作。

**Why this priority**: 项目主要使用移动端，清晰核对是准确性方案能否被实际使用的必要条件。

**Independent Test**: 在 390px 视口打开推荐页，确认预览、角色标签、空图占位和下方实拍清单均可见且无横向溢出。

**Acceptance Scenarios**:

1. **Given** 3～7 件衣物的推荐，**When** 用户在手机上浏览，**Then** 所有角色标签和图片卡片均保持在视口内，人物参照不会遮挡衣物原图。

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- 推荐少于 3 件或衣橱缺少完整角色时，仍显示已有衣物，不虚构缺少的衣物。
- 单品图片地址失效时，只替换为名称占位，不阻塞整套预览。
- 一套有 7 件衣物时，预览区域可滚动查看全部角色，但页面整体不横向溢出。
- 用户未生成 AI 效果图时，不自动调用第三方图像服务。

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: 系统 MUST 使用当前推荐中的真实衣物图片地址展示精准搭配预览，不根据衣物名称重新生成替代服装。
- **FR-002**: 系统 MUST 复用现有分层角色规则，按内搭、主上装、外套、下装/连衣裙、鞋履、配饰的顺序展示。
- **FR-003**: 系统 MUST 同时展示固定无身份虚拟人物作为比例参照，并明确说明人物不是实际试穿结果。
- **FR-004**: 系统 MUST 在图片缺失或加载失败时显示衣物名称和角色占位，不隐藏整套推荐。
- **FR-005**: 系统 MUST 不因精准预览而新增第三方网络请求、AI 图像调用、数据库写入或衣物数据修改。
- **FR-006**: 系统 MUST 保留现有 AI 效果图入口，但将其标记为可选增强，并继续展示真实衣物核对清单。
- **FR-007**: 系统 MUST 在 390px 视口下无水平溢出，角色标签、衣物原图和说明可读。

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **推荐搭配**：当前日期、场合和天气下的一套 3～7 件衣物组合。
- **搭配层次**：由衣物类别稳定推导出的内搭、主上装、外套、下装、鞋履和配饰角色。
- **精准预览板**：固定人物比例参照与真实衣物原图组成的只读展示，不改变原始衣物。

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 推荐页已有数据到精准预览板出现不新增模型等待，固定素材和衣物卡片随页面一次渲染完成。
- **SC-002**: 预览板中的每件衣物图片与推荐下方实拍清单使用同一件衣物，准确率达到 100%。
- **SC-003**: 390px 视口下核心推荐页 `scrollWidth` 不超过 `innerWidth`，且人物参照不遮挡衣物原图。
- **SC-004**: AI 图未生成、生成失败和衣物图片缺失时，用户仍能完成整套衣物核对，不出现全页错误状态。

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- 现有推荐页已经提供当前用户可访问的衣物签名地址，精准预览只消费这些地址。
- 固定虚拟人物只用于比例参照，不承诺衣物已经准确套在人物身上。
- 当前不做自动抠图；含背景的衣物原图以原图卡片方式展示，避免错误去背。
- 现有 AI 效果图和私有 Storage 能力保持不变，后续是否接入专业 VTON 另行建立 SDD。
