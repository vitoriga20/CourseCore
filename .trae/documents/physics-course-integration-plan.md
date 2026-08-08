> 文档状态：历史计划，核心课程接入已实现；保留用于追溯物理课程数据来源和决策。
>
> 当前代码和数据以 `curriculum/raw/questions/physics-b-1/`、`src/data/courses.js` 和 `src/views/` 为准。

# 大学物理B（上）题库接入 CourseCore 执行计划（更新版）

## 1. 概要（Summary）

将 `index（综合混合）.html` 中的题库以新课程 **大学物理B（上）** 接入 coursecore，完全对齐教学日历目录结构。

- **课程名**：由“大学物理（一）”改为 **大学物理B（上）**。
- **课程结构**：按教学日历分为 **力学**、**波动光学** 两大模块；每模块先以目录章节建立 `theory` 小节占位，末尾放置 `quiz` 综合测验小节。
- **题库拆分**：把 `index（综合混合）.html` 中的 76 道题按类别拆成两份：
  - 力学综合测验：前 43 道（`category === '力学'`）
  - 波动光学综合测验：后 33 道（`category === '波动光学'`）
- **不按题型分**：每个测验文件内题目按自然顺序排列，选择题、填空题、解答题统一展示，不额外按题型分组。
- **模板样式**：复刻 `index（综合混合）.html` 的样式与交互（顺序/随机切换、字体切换、几何/素白背景切换、题号导航、进度统计、完成报告），但适配 coursecore 的 CSS 变量和主题系统。
- **路由**：点击课程详情页中的“力学期末综合测验”或“波动光学期末综合测验”，进入对应测验页面。
- **练习 PDF**：力学练习一~七、波动光学练习一~六 **暂不接入**，仅作为后续 MinerU 抽取更多题库的来源；本次只接入两个综合测试。

## 2. 当前状态分析（Current State Analysis）

基于实际代码探索：

- **课程数据**：`src/data/courses.js` 当前只有高数上下两门课，使用 `module → item` 层级。
- **题目源文件**：`curriculum/raw/questions/{courseId}/` 下存放 Markdown 题目，`builders/question-builder.js` 构建为 `src/data/questions.js`。
- **题目渲染**：`src/views/question/index.js` 按 `viewTypes` 分发到 `choice / fill / calc / code`，目前未处理 `image` 字段。
- **小节视图**：`src/views/practiceList.js` 渲染某个 item 下的题目列表；`src/views/inlinePractice.js` 提供“全部提交”式练习流程；**缺少通用测验视图**。
- **题型系统**：`src/config/question-types.js` 定义 `questionTypes / viewTypes / validatorTypes / submitTypes`。
- **答案校验**：`src/validators/normalized.js` 归一化逻辑较简单，未处理物理答案中的 LaTeX 格式。
- **事件委托**：`src/main.js` 通过 `data-action` 分发到 `src/router.js` 的 handler；新增 quiz 交互需要补充 handler。
- **图片资源**：模板引用 `assets/qXXX.jpg`，根目录 `assets/` 已存在 36 张图片；需要迁移到 `coursecore/public/physics/`。

## 3. 具体改动方案（Proposed Changes）

### 3.1 新增构建脚本：`builders/physics-quiz-builder.js`

**What**：读取 `index（综合混合）.html` 中的 `questionBankData` JSON，按力学/光学拆分后转换为 Markdown 源文件。

**Why**：
- 力学、光学各生成独立题目集，对应两个测验小节。
- 与现有 `question-builder.js` 流程保持一致，源文件仍是 Markdown + YAML frontmatter。

**How**：
- 使用正则或字符串截取提取 `const questionBankData = [...];` 中的 JSON。
- 按 `category` 拆分：
  - `category === '力学'` → `itemId: p1b-m1-quiz`
  - `category === '波动光学'` → `itemId: p1b-m2-quiz`
- 题型映射：
  - `multipleChoice` → `questionType: 0`（singleChoice），答案从字母转 0-based 索引。
  - `fillInTheBlank` → `questionType: 2`（fillInBlank），多答案用 `;` 分隔。
  - `problemSolving` → 若答案能解析出第一个有效数字则 `questionType: 3`（calculation）+ `tolerance: 0.05`；否则 `questionType: 4`（proof）。
- 图片路径改写：`assets/qXXX.jpg` → `/physics/qXXX.jpg`。
- 输出目录：
  - 力学：`curriculum/raw/questions/physics-b-1/p1b-m1-quiz/`
  - 光学：`curriculum/raw/questions/physics-b-1/p1b-m2-quiz/`
- 命名规则：
  - 力学：`q-physics-b-1-p1b-m1-quiz-001.md` ～ `q-physics-b-1-p1b-m1-quiz-043.md`
  - 光学：`q-physics-b-1-p1b-m2-quiz-001.md` ～ `q-physics-b-1-p1b-m2-quiz-033.md`
- 每道题 frontmatter 至少包含：`id`、`courseId: physics-b-1`、`moduleId`、`itemId`、`questionType`、`answer`、`tags`、`category`、`source`；可选 `image`、`tolerance`、`solution`。
- Markdown 正文分区：`## Content`、`## Options`（选择题）、`## Solution`。

### 3.2 新增课程：`src/data/courses.js`

替换原“大学物理（一）”方案，改为 **大学物理B（上）**，课程 id 为 `physics-b-1`。

模块与 item 结构对齐教学日历：

```js
{
  id: "physics-b-1",
  title: "大学物理B（上）",
  description: "涵盖质点力学、刚体转动、机械振动与波动、波动光学等大学物理B（上）核心内容。",
  requirements: [
    "完成各章节理论学习",
    "完成力学期末综合测验",
    "完成波动光学期末综合测验"
  ],
  modules: [
    {
      id: "p1b-m1",
      title: "力学",
      items: [
        { id: "p1b-m1-01", type: "theory", title: "质点运动学基础" },
        { id: "p1b-m1-02", type: "theory", title: "质点运动学与相对运动" },
        { id: "p1b-m1-03", type: "theory", title: "牛顿运动定律与非惯性系" },
        { id: "p1b-m1-04", type: "theory", title: "动量与动量守恒定律" },
        { id: "p1b-m1-05", type: "theory", title: "功和能与机械能守恒定律" },
        { id: "p1b-m1-06", type: "theory", title: "角动量与角动量守恒定律" },
        { id: "p1b-m1-07", type: "theory", title: "刚体的定轴转动" },
        { id: "p1b-m1-quiz", type: "quiz", title: "力学期末综合测验" }
      ]
    },
    {
      id: "p1b-m2",
      title: "波动光学",
      items: [
        { id: "p1b-m2-01", type: "theory", title: "光的干涉基础" },
        { id: "p1b-m2-02", type: "theory", title: "光程差与薄膜干涉" },
        { id: "p1b-m2-03", type: "theory", title: "薄膜干涉与迈克耳逊干涉仪" },
        { id: "p1b-m2-04", type: "theory", title: "光的衍射与单缝衍射" },
        { id: "p1b-m2-05", type: "theory", title: "光栅衍射" },
        { id: "p1b-m2-06", type: "theory", title: "光学仪器分辨率与X射线衍射" },
        { id: "p1b-m2-07", type: "theory", title: "光的偏振" },
        { id: "p1b-m2-08", type: "theory", title: "反射折射偏振与双折射" },
        { id: "p1b-m2-quiz", type: "quiz", title: "波动光学期末综合测验" }
      ]
    }
  ]
}
```

> **说明**：理论小节数量与标题可根据教学日历精确调整；content 用目录名称生成简介占位。

### 3.3 理论小节占位内容

**What**：为每个 `type: theory` 小节生成 Markdown 源文件，内容根据目录名称生成简介。

**Why**：
- 保持课程结构完整，与高数课程一致。
- 未来可直接替换为真实理论内容。

**How**：
- 每个 theory 小节对应一个 Markdown 文件：`curriculum/raw/questions/physics-b-1/{itemId}.md`。
- frontmatter：`id`、`courseId`、`moduleId`、`itemId`、`type: theory`、`title`。
- 正文：根据标题自动生成一段简单介绍，例如：

```markdown
## 本节简介
本节介绍刚体的定轴转动，包括转动惯量、转动定律、角动量守恒在刚体转动中的应用等内容。

> 理论内容待补充，目前为占位小节。
```

### 3.4 迁移图片资源：`coursecore/public/physics/`

**What**：将根目录 `assets/` 下的 36 张 `qXXX.jpg` 复制到 `coursecore/public/physics/`。

**Why**：Vite 构建后 `public/` 下文件原样输出到 `dist/`，Markdown 中以 `/physics/qXXX.jpg` 引用即可访问。

### 3.5 题目渲染支持图片

**What**：修改 `src/views/question/index.js`，在调用具体题型模板前，若 `question.image` 存在则先渲染图片容器。

**Why**：物理题库中选择题、填空题、解答题都可能配图。

**How**：
- 在 `src/views/question/index.js` 新增：

```js
import { escapeHtml } from '../../utils.js';

function renderQuestionImage(question) {
  if (!question.image) return '';
  return `
    <div class="question-figure mb-4">
      <img src="${escapeHtml(question.image)}" alt="题图" class="rounded-xl max-w-full h-auto">
    </div>
  `;
}
```

- 修改 `renderQuestion`：先返回 `renderQuestionImage(question) + renderer(question, options)`。

### 3.6 新增通用测验视图：`src/views/quizSession.js`

**What**：专门渲染 `type: quiz` 小节，把 `index（综合混合）.html` 的样式与交互迁移到 coursecore。

**Why**：
- 力学、光学各一个独立测验页面，不按题型分组。
- 用户明确“以后高数的'测验'也会按照这种样式改造”，因此需要通用组件。

**How**：
- 导出 `renderQuizSession(itemId)` 与 `initQuizSession(itemId)`。
- 根据 `itemId` 过滤 `QUESTIONS` 拿到该测验所有题目。
- 组件内部状态（局部闭包，不污染全局 `state`）：
  - `allQuestions`、`order`、`userAnswers`、`currentIndex`
  - `mode`（sequential / random）、`seed`
  - `font`（serif / sans）、`bg`（geo / plain）
- 顶部控制栏：标题、模式标签、顺序/随机切换、字体切换、背景切换、进度条。
- 主体：当前题目（支持图片）、答案输入/选项、提交/查看答案、反馈、解析。
- 导航：桌面端右侧题号网格；移动端底部横向导航条；上一题/下一题按钮。
- 结果页：完成练习后显示答对题数/总题数、正确率、重新开始按钮。
- 全部答对后调用 `syncItemProgress(itemId)` 标记小节完成。
- 顺序/随机切换会重新洗牌并回到第 1 题。
- 字体切换通过 CSS 变量 `--question-font` 控制。
- 背景切换通过 `body[data-bg]` 控制几何背景显隐（复用/暂停 `background.js`）。

### 3.7 调整小节练习入口：`src/views/practiceList.js`

**What**：当 `item.type === 'quiz'` 时渲染 `quizSession(itemId)`，其他类型保持现有流程。

**Why**：让 quiz 类型小节走新的测验视图，同时保持 theory / exercise 小节不变。

**How**：
- 引入 `renderQuizSession`。
- 在 `renderPracticeList` 中：

```js
${item.type === 'quiz'
  ? renderQuizSession(itemId)
  : (questions.length > 0 ? renderInlinePractice(itemId) : renderTheoryPlaceholder(item))
}
```

- 新增 `renderTheoryPlaceholder(item)` 用于渲染理论小节占位内容。

### 3.8 增强答案校验：`src/validators/normalized.js`

**What**：参考模板 `normalizeAnswer` 增强归一化逻辑，处理 LaTeX 格式答案。

**Why**：物理填空/简答答案大量使用 LaTeX（如 `$\frac{1}{v}=...$`）。

**How**：

```js
function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\,/g, '')
    .replace(/\\;/g, '')
    .replace(/[\u3000\s]+/g, '')
    .replace(/；/g, ';')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\\/g, '');
}
```

### 3.9 事件委托与路由接入：`src/main.js` + `src/router.js`

**What**：新增 quiz 相关 `data-action` 的 handler。

**Why**：`quizSession.js` 的按钮必须使用事件委托。

**How**：
- `src/views/quizSession.js` 内部按钮使用 `data-action`：
  - `quiz-prev`、`quiz-next`、`quiz-finish`、`quiz-restart`
  - `quiz-toggle-order`、`quiz-toggle-font`、`quiz-toggle-bg`
  - `quiz-goto`
- `src/main.js` 的 `switch (action)` 中新增分支，调用 `src/router.js` 暴露的 handler。
- `src/router.js` 导出这些 handler，直接操作 DOM 上的 quiz 状态。
- 在 `renderMain()` 的 `case "practice-list"` 后，调用 `initQuizSession(state.currentPracticeItem)`（如果当前小节是 quiz）。

### 3.10 可选：为 quiz 视图补充样式

**What**：在 `src/style.css` 增加 quiz 专用类。

**Why**：保持组件样式与 coursecore 主题一致，同时复刻模板视觉。

**How**：
- `.quiz-control-bar`、`.quiz-nav-btn`、`.quiz-option-btn`、`.quiz-figure` 等类使用 `var(--fg)`、`var(--bg)`、`var(--accent)`、`var(--line)`、`var(--muted)`、`var(--success)`、`var(--error)`。
- 字体切换通过 CSS 变量 `--question-font` 控制。
- 背景切换通过 `body[data-bg]` 控制几何背景显隐。

### 3.11 更新开发文档

**必须更新**：
- `coursecore/development-log.md`：新增阶段记录，说明接入大学物理B（上）、拆分力学/光学测验、理论小节占位、新增 quiz 视图等。
- `.trae/documents/technical-architecture.md`：更新课程/题目数据说明，增加 quiz 小节与测验视图描述；更新文件结构。
- `.trae/documents/prd.md`：更新课程列表，将“大学物理B（上）”加入学习板块；更新题目作答章节，说明 quiz 视图。

## 4. 假设与决策（Assumptions & Decisions）

| 决策 | 说明 |
|---|---|
| 课程名改为 `大学物理B（上）` | 课程 id 使用 `physics-b-1`，slug 兼容。 |
| 力学/光学各一个 quiz 小节 | 分别对应 `p1b-m1-quiz` 和 `p1b-m2-quiz`。 |
| 力学题库 43 题，光学题库 33 题 | 按 `index（综合混合）.html` 中 `category` 字段拆分。 |
| 不按题型分组 | 每个测验内题目顺序排列，视图根据每道题自身类型渲染输入。 |
| 练习 PDF 暂不接入 | 力学练习一~七、波动光学练习一~六只作为后续 MinerU 抽题来源。 |
| 理论小节用目录生成简介 | content 占位，未来替换为真实讲义。 |
| 图片放到 `public/physics/` | 与数学资源隔离，路径清晰。 |
| 测验状态不持久化 | 允许反复刷题；全部答对后仅标记小节完成。 |
| problemSolving 按答案内容区分 calculation/proof | 数值题自动判定，文字/向量题展示答案由用户自查。 |
| quiz 视图内部状态独立 | 不写入 `state.inlineAnswers/inlineResults`，避免与现有 inline 练习冲突。 |

## 5. 验证步骤（Verification Steps）

1. 运行 `npm run build:data`，确认 `src/data/questions.js` 中生成了 `physics-b-1` 相关题目。
2. 检查 `src/data/courses.js` 已包含 `大学物理B（上）` 课程、力学/光学模块、理论小节 + quiz 小节。
3. 确认 `coursecore/public/physics/` 下存在所有 36 张题目图片。
4. 确认 `curriculum/raw/questions/physics-b-1/` 下按 itemId 分组生成 Markdown 文件。
5. 运行 `npm run build` 成功完成 Vite 构建与预渲染。
6. 运行 `npm run preview` 预览：
   - 访问 `/`，确认“大学物理B（上）”课程卡片出现。
   - 访问 `/course/physics-b-1`，确认力学、光学模块及其小节列表。
   - 点击“力学期末综合测验”，确认跳转 `/item/p1b-m1-quiz`，力学 43 题正常加载，顺序/随机切换、字体切换、背景切换、题号导航、上一题/下一题/完成练习/重新开始均可用。
   - 点击“波动光学期末综合测验”，确认跳转 `/item/p1b-m2-quiz`，光学 33 题正常加载。
   - 验证含图片题目（如 q006、q044 等）图片正确显示。
   - 验证单选题即时判定、填空/计算题提交后显示答案与解析。
   - 验证全部答对后小节状态标记为完成。
7. 检查开发文档三件套已同步更新。

## 6. 待执行动作清单

- [ ] 更新 `builders/physics-quiz-builder.js`（按力学/光学拆分，生成 theory 占位）
- [ ] 运行构建脚本生成 `curriculum/raw/questions/physics-b-1/**/*.md`
- [ ] 复制图片到 `coursecore/public/physics/`
- [ ] 更新 `src/data/courses.js` 新增 `physics-b-1` 课程
- [ ] 修改 `src/views/question/index.js` 支持图片渲染
- [ ] 创建 `src/views/quizSession.js` 测验视图
- [ ] 修改 `src/views/practiceList.js` 对 quiz 类型调用 quizSession，对 theory 显示占位
- [ ] 增强 `src/validators/normalized.js`
- [ ] 在 `src/main.js` / `src/router.js` 中接入 quiz 事件处理
- [ ] 补充 `src/style.css` quiz 相关样式
- [ ] 运行 `npm run build:data` 与 `npm run build` 验证
- [ ] 更新 `development-log.md`、`technical-architecture.md`、`prd.md`
