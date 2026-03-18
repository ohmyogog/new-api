# web-next UIKIT 对齐待办

> 目标：在不改业务逻辑、不改页面内容语义的前提下，让 `web-next` 更贴近 `web/ref` 下的 UIKIT / UIKIT Extension 参考样式。

## 参考基线

- `web/ref/dropdown.html`
- `web/ref/personal.html`
- `web/ref/dashboard.html`
- `web/ref/UIKIT/code.html`
- `web/ref/UIKIT-Extension/code.html`

## 本轮已完成

- [x] 共享 `Select` 已切到 shadcn/base 组件实现，并关闭 `alignItemWithTrigger`，避免选中项位置影响下拉弹层位置。
- [x] 页面内残留的原生 `<select>` 已替换为共享 `Select`。
- [x] 共享 `Input` 已统一为暖橘白底输入框风格，边框、聚焦态、悬浮态与当前 UIKIT 主色保持一致。
- [x] 共享 `DropdownMenu` 已改为更接近 `dropdown.html` 的面板样式：
  - 顶部间距统一为 `8px`
  - 面板改为 `py-2`，去掉厚重的内层胶囊感
  - 菜单项改为整行 hover/focus，高亮方式更接近 ref
- [x] 共享 `DialogFooter` 已去掉灰色底条，改为更干净的一体式白底分隔。
- [x] `UserMenu` 与 `admin/User` 中的 `DropdownMenu` 用法已补齐 `DropdownMenuGroup`，更贴近 shadcn/base 组合方式。
- [x] `PersonalSettings` 右侧“通知与高级设置”已完成第一轮 UI 对齐：
  - tabs 改为分段按钮样式
  - 内容模块统一为白色卡片面板
  - 通知方式改为卡片式单选项
  - 边栏设置卡片与说明块同步统一
- [x] 侧边栏 active / hover 已完成第一轮 UI 对齐：
  - 整体底色调整为暖白 peach 背景
  - 激活项改为品牌橘色实心高亮
  - hover 项改为 peach hover 背景
  - 图标颜色跟随 active / hover 状态同步变化
- [x] `TopUp` 页面已完成第一轮 UI 对齐：
  - 余额卡改为暖白主卡 + coral 强调信息
  - 兑换码与邀请奖励卡统一为同一套卡片壳层
  - 邀请统计小卡改为 warm coral 辅助卡
  - 充值记录表头、hover、分页按钮同步统一
- [x] 管理台列表页已完成第一轮 UI 对齐：
  - `Channel` / `User` / `Model` / `Subscription` 的表格壳层已统一
  - 表头底色、行 hover、标签 chip、分页按钮已统一为 warm coral 语言
  - `Channel` 的筛选分段按钮与批量操作条已同步统一
- [x] `PersonalSettings` 顶部资料卡与语言偏好区已完成第一轮 UI 对齐：
  - 顶部余额条改为更贴近 `personal.html` 的轻量 badge + 暖色统计容器
  - 保留原有文案与跳转逻辑，仅收敛视觉样式
  - 语言偏好块已切到暖灰底卡片 + 轻量选择器样式
  - 同页左侧表单与弹窗中的旧 `slate` 覆盖已清理，统一回 warm coral 控件风格

## 下一批优先级

### P1

- [ ] `PersonalSettings` 右侧区块做第二轮细节抛光
  - 目标文件：`src/pages/PersonalSettings.tsx`
  - 重点：switch 对齐节奏、卡片间距、移动端密度
- [ ] `PersonalSettings` 顶部资料卡与语言偏好区做第二轮细节抛光
  - 目标文件：`src/pages/PersonalSettings.tsx`
  - 重点：顶部底栏在超窄屏下的统计密度、语言选择器的尺寸与 ref 进一步收口
- [ ] 侧边栏做第二轮细节抛光
  - 目标文件：`src/components/layout/Sidebar.tsx`
  - 重点：底部用户卡片与导航区衔接、分组留白、移动端收缩态
- [ ] `TopUp` 做第二轮细节抛光
  - 目标文件：`src/pages/TopUp.tsx`
  - 重点：余额主卡的信息密度、空状态、移动端按钮堆叠节奏
- [ ] 管理台列表页做第二轮细节抛光
  - 目标文件：`src/pages/admin/Channel.tsx`
  - 目标文件：`src/pages/admin/User.tsx`
  - 目标文件：`src/pages/admin/Model.tsx`
  - 目标文件：`src/pages/admin/Subscription.tsx`
  - 重点：空状态、弹窗表单局部覆盖、批量操作与按钮密度

### P2

- [ ] 检查所有页面里仍然强制写死的 `bg-slate-*` / `border-slate-*` 局部覆盖
  - 说明：很多页面已经吃到共享组件更新，但局部 class 覆盖还会把风格拉回旧样式
- [ ] 统一表单控件的圆角层级
  - 说明：当前页面中同时存在 `rounded-lg`、`rounded-xl`、`rounded-2xl`，需要按组件层级收敛
- [ ] 统一弹窗内容区与按钮区的留白节奏
  - 说明：当前各页面 `DialogContent` 自定义 padding 仍有差异

## 暂不处理

- [ ] 不做内容文案调整
- [ ] 不改页面信息层级和功能逻辑
- [ ] 不重构 API 调用或状态管理

## 使用方式

- 每完成一批 UI 对齐，就更新“本轮已完成”
- 每发现新的视觉不一致点，就补到对应优先级
- 下次继续时，优先从 `P0` 开始，不重新全量巡检
