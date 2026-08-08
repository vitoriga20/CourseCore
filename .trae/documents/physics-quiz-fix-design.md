> 文档状态：历史修复设计，主要问题已有实现；如需继续修改，先与 `quizSession.js` 和当前物理数据复核。

# 大物综合测验问题修复设计稿

## 目标
修复大学物理B（上）综合测验当前存在的三个问题：
1. 顺序 / 乱序状态错乱
2. 缺少几何背景
3. 布局不够平衡

## 根因分析

### 1. 顺序 / 乱序
- `quizSession.js` 中 `state.userAnswers` 和 `state.results` 按 `qid` 存储，本身能追踪原题。
- 但 `renderNav()` 直接遍历 `state.allQuestions`，按钮顺序始终是原始顺序；乱序模式下 `currentIndex` 对应的是 `state.order[currentIndex]`，导致题号导航的显示状态与当前题错位。
- `state.seed` 在 `createState()` 中固定为 `seedFromString(itemId)`，切换随机或重新开始不会产生新的乱序。

### 2. 几何背景
- 当前 `body[data-bg="geo"]` 仅控制全局 `#bg-canvas` 的透明度。
- 全局背景是 `background.js` 的 Canvas 2D 透视网格，与参考 `index（综合混合）.html` 的 p5.js 旋转球面网格 + 十字星效果差距较大。

### 3. 布局
- `practiceList.js` 对所有小节统一使用 `max-w-3xl mx-auto`，quiz 视图内部的 `max-w-7xl` 被父级压扁，sidebar 空间不足或换行。

## 改动方案

### `coursecore/src/views/quizSession.js`
1. 导航按 `state.order` 渲染：
   - 遍历 `state.order`，按钮显示的是显示序号（displayIdx + 1）。
   - 点击跳转时使用 `displayIdx` 设置 `state.currentIndex`。
   - 答题状态从 `state.allQuestions[state.order[displayIdx]].id` 取 `result`。
2. 切换为随机模式或重新开始时，使用 `Date.now()` 生成新 seed，让每次随机顺序不同。
3. 切换模式后 `currentIndex` 归零（与参考一致），答案状态随原题保留。
4. 按钮文案改为「切换随机 / 切换顺序」。

### `coursecore/src/views/practiceList.js`
- 当 `item.type === 'quiz'` 时，外层容器改为 `max-w-7xl mx-auto`；理论 / 普通练习仍保持 `max-w-3xl`。

### `coursecore/index.html`
- 在 MathJax 脚本后引入 p5.js CDN：`<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>`。

### 新增 `coursecore/src/quiz-background.js`
- 封装 `index（综合混合）.html` 中的 p5.js 球面网格背景逻辑。
- 提供 `initQuizBackground()` 与 `destroyQuizBackground()`。
- 监听 `body[data-bg]`：仅当值为 `geo` 时渲染；为 `plain` 时暂停绘制并清空画布。

### `coursecore/src/style.css`
1. 调整 quiz 布局：
   - `.quiz-layout` 大屏改为 `grid-template-columns: 1fr 17rem`（匹配参考）。
   - 主卡片内边距调整为 `p-6 md:p-8`。
   - sidebar 卡片使用 `sticky top-20`、圆角、边框、半透明背景。
2. 调整题号导航：
   - sidebar 内 nav 使用 `grid-cols-5`（参考样式）。
   - 底部移动端 nav 保持横向滚动。
3. 调整几何背景相关样式，确保 p5 画布层级、透明度与主题兼容。

## 验证步骤
1. 启动 dev server，进入 `/item/p1b-m1-quiz`。
2. 答第 1 题，切换为随机模式，确认原第 1 题在导航中仍显示为「已答对/已答错」状态（状态追踪原题）。
3. 多次切换随机 / 顺序，确认每次随机顺序不同。
4. 切换背景按钮，确认几何背景出现 / 消失；确认 p5.js 球面网格与十字星效果。
5. 大屏下确认主内容区与 sidebar 比例协调，无挤压换行；移动端确认底部导航可横向滚动。
6. 运行 `npm run build:data` 与 `npm run build` 通过。

## 影响面
- 仅影响 `type: 'quiz'` 的小节视图。
- 不改动题目数据、课程结构、普通练习 / 理论小节逻辑。
- 新增 p5.js CDN 依赖，仅用于 quiz 背景，失败时优雅降级为素白背景。

## 待更新文档
- `development-log.md`：新增修复阶段。
- `technical-architecture.md`：补充 quiz 背景组件说明。
