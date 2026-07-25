# 开发日志 - CourseCore

## 项目概览

| 项 | 内容 |
|---|---|
| 项目名称 | CourseCore — 大学基础课学习平台 |
| 当前状态 | 已完成小节独立页面、inline 全题提交、错题查看答案、全部答对进入下一节 |
| 技术栈 | Vite 5 + Tailwind CSS 3 + PostCSS + p5.js + gray-matter |
| 构建产物 | `dist/`（264 个预渲染静态路由） |
| 数据格式 | Markdown + YAML frontmatter → `src/data/questions.js` |

## 文件结构

```
coursecore/
├── builders/question-builder.js    # 解析 Markdown 题目，生成 JS 数据模块
├── scripts/prerender.js            # 基于 routes.js 生成静态 HTML
├── src/
│   ├── main.js                     # 应用壳、事件委托、初始化
│   ├── router.js                   # 路由与视图控制器
│   ├── state.js                    # 全局状态与进度持久化
│   ├── style.css                   # 主题变量与组件样式
│   ├── theme.js                    # 明暗主题切换
│   ├── background.js               # p5.js 几何背景
│   ├── config/
│   │   ├── routes.js               # 路由表与路径构建
│   │   └── question-types.js       # 题型/视图/校验器/提交方式映射
│   ├── data/
│   │   ├── courses.js              # 课程与模块小节数据
│   │   ├── questions.js            # 题目数据（自动构建生成）
│   │   ├── examPapers.js           # 期末试卷数据
│   │   └── labels.js               # 类型标签文案
│   ├── utils/
│   │   ├── progress.js             # localStorage 读写与迁移
│   │   ├── answer-collector.js     # 从 DOM 收集用户答案
│   │   └── question.js             # 题目导航工具
│   ├── validators/                 # 各类答案校验器
│   └── views/                      # 页面与题目渲染模板
│       ├── course.js               # 课程详情页
│       ├── practiceList.js         # 小节独立页面（理论 + inline 训练）
│       ├── inlinePractice.js       # inline 多题训练区
│       └── question/               # 单题渲染组件
├── curriculum/raw/questions/       # 题目 Markdown 源文件
└── development-log.md              # 本文件
```

## 开发阶段记录

### 阶段 1: 初始 Vite 重构

**日期**: 2026-07-25 之前

**操作**:
- 使用 Vite + Tailwind CSS 重构原项目。
- 引入 p5.js 几何球体背景，固定参数，无 UI 控制。
- 实现基于 HTML5 History API 的客户端路由，并增加预渲染脚本。
- 题目源数据使用 Markdown + YAML frontmatter，通过 `question-builder.js` 构建为 JS 模块。

**关键决策**:
- 背景使用 p5.js 而非 Three.js → 减少依赖与 GPU 压力。
- 预渲染每个路由为独立 `index.html` → 支持静态托管与直接访问深层链接。
- 校验器通过枚举 + 映射表驱动 → 同一套 UI 逻辑支持多种题型。

**产出文件**:
- `src/router.js`
- `src/state.js`
- `src/config/routes.js`
- `src/config/question-types.js`
- `builders/question-builder.js`
- `scripts/prerender.js`

### 阶段 2: 小节独立页面与 inline 全题提交

**日期**: 2026-07-25

**操作**:
- 课程详情页小节点击改为 `<a href="/item/:itemId">`，进入独立小节页面。
- `practiceList.js` 渲染理论内容 + 本节全部训练题。
- `inlinePractice.js` 重写：
  - 一次性展示本节所有题目；
  - 底部单一按钮，未全部答对时显示“提交答案”；
  - 提交后按题给出“✓ 回答正确”或“✗ 错了”；
  - 错题显示“查看答案”按钮，点击后展开标准解法与参考答案；
  - 全部答对后同一按钮变为“进入下一节 →”。
- `state.js` 新增 `inlineAnswers / inlineResults / inlineShowAnswers` 临时状态。
- `main.js` 增加 `submit-item / show-inline-answer / next-item` 事件委托。
- `answer-collector.js` 修复 `root.getElementById` 在 Element 根节点上不可用的问题。
- 移除已不存在的 `renderSidebarContent` 调用，消除初始化报错。

**关键决策**:
- inline 答题状态不持久化 → 每次进入小节重新开始，避免历史错误状态干扰。
- 提交与“进入下一节”共用同一个按钮 → 减少界面元素，符合用户预期。
- 错题只提示“错了”，不直接展示答案；答案由用户主动点击后展开 → 强化思考过程。
- 所有题目答对后才允许进入下一节 → 保证掌握度。

**产出文件**:
- `src/views/course.js`
- `src/views/practiceList.js`
- `src/views/inlinePractice.js`
- `src/router.js`
- `src/main.js`
- `src/state.js`
- `src/utils/answer-collector.js`
- `src/views/question/choice.js`
- `src/views/question/fill.js`
- `src/views/question/calc.js`
- `src/views/question/code.js`

## 问题与解决方案

### 问题 1: 提交答案无反应

**日期**: 2026-07-25

**现象**: 点击“提交答案”后页面没有反馈，控制台报 `TypeError: e.getElementById is not a function`。

**原因**: `answer-collector.js` 默认使用 `root.getElementById`，但 inline 提交时传入的 `root` 是 `document.querySelector('.inline-practice')` 返回的 Element，Element 没有 `getElementById` 方法。

**解决**: 增加 `getById` 辅助函数，对 Element 根节点使用 `root.ownerDocument.getElementById`，对 document 根节点直接使用 `document.getElementById`。

### 问题 2: 初始化报错 `renderSidebarContent is not defined`

**日期**: 2026-07-25

**现象**: 控制台出现 `ReferenceError: renderSidebarContent is not defined`，源自 `router.js` 与 `main.js`。

**原因**: 当前 UI 已移除侧边栏，但 `showLanding` 与 `updateSearch` 仍调用旧函数。

**解决**: 移除 `router.js` 中 `showLanding` 内的 `renderSidebarContent()` 调用，以及 `main.js` 中 `updateSearch` 的 `else renderSidebarContent()` 分支。

## 架构决策记录

| 决策 | 说明 |
|---|---|
| p5.js 几何背景 | 固定参数、无控制面板、支持明暗主题切换，性能优先（低粒子数、低帧率） |
| inline 状态不持久化 | 进入小节即清空，保证每次练习从初始状态开始 |
| 单一提交/下一节按钮 | 根据 `allPassed` 状态动态切换文案与 `data-action` |
| 答案收集基于 DOM | `collectUserAnswer(question, root)` 直接从 DOM 读取，避免不同题型的状态同步差异 |
| 预渲染所有路由 | 构建时生成每个 URL 对应的 `index.html`，刷新或直接访问不 404 |

## 已知限制与待改进项

- 单选/判断题的选择状态目前未写入 `state.inlineAnswers`，页面重绘后会丢失选中状态；后续可通过监听 `change` 事件持久化。
- 证明题、代码题依赖人工/运行器校验，UI 仅提示“请对照参考答案自行检查”。
- 题目内容中的 LaTeX 依赖 MathJax 异步渲染，极快切换页面时可能出现闪烁。

## 阶段 3: 构建与功能验证

**日期**: 2026-07-25

**操作**:
- 运行 `npm run build`，成功生成 264 个预渲染路由。
- 启动 `npm run preview`，在浏览器中验证完整流程：
  - 访问 `/item/c1-m1-i1`，理论内容与训练题全部展示；
  - 提交错误答案后，每题显示“✗ 错了”及“查看答案”按钮；
  - 点击“查看答案”后展开标准解法与参考答案；
  - 全部答对后，底部同一按钮变为“进入下一节 →”；
  - 点击后正确跳转到下一小节 `/item/c1-m1-i2`。

**关键决策**:
- 继续沿用“提交 / 下一节”共用同一按钮的方案，验证符合用户预期。
- inline 答题状态仍不持久化，进入新小节后自动清空。

## 更新记录 - 2026-07-25

### 新增
- 小节独立页面 `/item/:itemId`。
- inline 全题提交与反馈流程。
- “查看答案”展开标准解法。
- 全部答对后“进入下一节”按钮。

### 修改
- `course.js` 小节入口由 button 改为 a 链接。
- `inlinePractice.js` 完全重写为多题展示模式。
- `answer-collector.js` 支持非 document 根节点。

### 修复
- 提交时 `getElementById` 报错。
- `renderSidebarContent` 未定义报错。

## 最后更新时间

2026-07-25
