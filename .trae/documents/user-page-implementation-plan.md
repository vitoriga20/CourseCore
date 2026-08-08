> 文档状态：历史实施计划，用户中心基础能力已实现；未勾选项不自动代表当前缺陷。
>
> 当前入口、路由和行为以 `src/views/user/userPage.js`、`src/config/routes.js` 和 `src/main.js` 为准。

# 用户中心页面实现计划

## 1. 目标

实现 `/user` 用户中心页面：

- 点击侧边栏头像可进入（已登录）或打开登录弹窗（未登录）。
- 页面展示头像、昵称、用户 ID。
- 点击头像弹出选择器，可更换头像。
- 昵称旁提供编辑按钮，可在线修改。
- 展示学习统计（当前连续签到 / 总积分 / 最长连续签到）。
- 展示 2026-02 至 2026-07 的活动热图。
- 提供退出登录按钮。
- 头像全部使用本地占位图，不再请求 dicebear 外链。

## 2. 影响面

| 链路 | 说明 |
|---|---|
| 路由 | `/user` 已在 `src/config/routes.js` 注册并加入预渲染列表。 |
| 入口 | 侧边栏头像按钮（`src/main.js`）。 |
| 认证 | `src/services/auth.js` 的 `updateUserProfile` 负责持久化头像/昵称。 |
| 页面渲染 | `src/views/user/userPage.js` 渲染用户中心。 |
| 头像选择器 | `src/components/avatarPicker.js` 提供候选头像网格。 |
| 样式 | `src/components/auth-components.css` 已有用户卡片、热图、头像选择器样式。 |
| 事件 | `src/main.js` 已处理 `user-entry / open-avatar-picker / select-avatar / close-avatar-picker / edit-user-name / logout-from-user-page`。 |

## 3. 头像占位图方案

不再依赖 `api.dicebear.com`，改为内联 SVG data URL，统一放入 `src/utils/avatars.js`：

- 提供 8 张黑白几何风格占位图（球面网格、蛇形螺旋、三角十字星、六边形、棋盘格、波浪线、同心圆、斜条纹）。
- `getDefaultAvatar(seed)` 根据 seed 哈希返回一张默认占位图。
- `AVATAR_CHOICES` 作为头像选择器的候选列表。
- 所有原先使用 dicebear 的地方改为引用该模块，保证登录态/游客态/用户页/选择器头像同源。

## 4. 实现步骤

1. 新建 `src/utils/avatars.js`，导出占位图数组与 `getDefaultAvatar`。
2. `src/services/auth.js` 移除 dicebear 相关 `getDefaultAvatar`，改为从 `avatars.js` 导入并重新导出。
3. `src/components/avatarPicker.js` 移除 dicebear，改为从 `avatars.js` 导入 `AVATAR_CHOICES`。
4. `src/views/user/userPage.js` 头像为空时 fallback 到 `getDefaultAvatar(name)`。
5. 调整 `auth-components.css` 中用户卡片背景与热图颜色，改用主题 CSS 变量，保持黑白品牌调性。
6. 验证 `npm run build` 通过，预渲染 `/user`。

## 5. 数据与持久化

- 头像 URL、昵称保存在 `localStorage`（key: `cc-admin-session`）。
- 修改后通过 `cc-auth-change` 事件同步更新侧边栏头像与 Header 用户菜单。
- 学习统计从 `state.completedQuestions` 读取，暂不新增独立签到表。

## 6. 验收清单

- [ ] `/user` 可直接访问，未登录时侧边栏头像点击进入登录弹窗。
- [ ] 登录后侧边栏与 `/user` 页面显示同一头像。
- [ ] 点击 `/user` 头像弹出选择器，8 张占位图正常显示。
- [ ] 选择新头像后，`/user` 与侧边栏同步更新。
- [ ] 点击昵称编辑按钮可修改昵称，失焦或按回车保存。
- [ ] 活动热图按日期着色，无活动时显示空色块。
- [ ] 点击退出登录后回到首页，头像恢复游客占位图。
- [ ] 构建成功，`dist/user/index.html` 存在。
