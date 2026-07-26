---
alwaysApply: false
---
# 刷题系统实现规范 —— freeCodeCamp 借鉴版

> 本文档总结 freeCodeCamp 主仓库（`freeCodeCamp-main`）刷题系统的核心实现模式，作为 CourseCore / 物理刷题平台后续功能开发的自动借鉴规范。
> 重点学习其**代码实现、数据模型、验证机制、状态管理**，不复制其外观。

---

## 1. 设计总则

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **配置驱动行为差异** | 不同题型（选择/填空/计算/证明）的行为差异，由「题型枚举 + 映射表」驱动，不写大量 if-else。 |
| **数据与表现分离** | 题目内容、答案、验证逻辑、模板渲染四者解耦，便于后续批量替换真实教学内容。 |
| **本地优先、可离线** | 验证逻辑优先在浏览器端完成，减少后端依赖；进度持久化到 `localStorage`，后续可扩展云端同步。 |
| **即时反馈** | 用户提交答案后，立即显示判定结果、解析、下一题入口，形成「做题→反馈→学习」闭环。 |
| **可扩展的题型系统** | 新增题型时，只需增加枚举值 + 映射表项 + 对应渲染/验证器，不改动核心流程。 |

### 1.2 本文档适用范围

- CourseCore Vite 项目（`coursecore/`）
- 单文件 HTML 刷题页（填空/解答/综合混合）
- 后续所有新增题型、验证器、页面模板

---

## 2. 题型类型系统（借鉴 `challenge-types.ts`）

### 2.1 题型枚举

所有题型必须收敛到一个中心枚举中，禁止在业务代码里散写字符串判断。

```js
// src/config/question-types.js
export const questionTypes = {
  singleChoice: 0,    // 单选题
  multipleChoice: 1,  // 多选题
  fillInBlank: 2,     // 填空题
  calculation: 3,     // 计算/解答题（需展示完整步骤）
  proof: 4,           // 证明题
  trueFalse: 5,       // 判断题
  shortAnswer: 6,     // 简答题
  code: 7,            // 编程/脚本题（未来扩展）
  composite: 8        // 综合混合题（一份试卷里多题型）
};
```

### 2.2 行为映射表

每种题型通过三个映射表决定其行为：

```js
// src/config/question-types.js

// 1. 渲染模板映射
export const viewTypes = {
  [questionTypes.singleChoice]:   'choice',
  [questionTypes.multipleChoice]: 'choice',
  [questionTypes.fillInBlank]:    'fill',
  [questionTypes.calculation]:    'calc',
  [questionTypes.proof]:          'calc',
  [questionTypes.trueFalse]:      'choice',
  [questionTypes.shortAnswer]:    'fill',
  [questionTypes.code]:           'code',
  [questionTypes.composite]:      'exam'
};

// 2. 验证方式映射
export const validatorTypes = {
  [questionTypes.singleChoice]:   'exact',
  [questionTypes.multipleChoice]: 'set',
  [questionTypes.fillInBlank]:    'normalized',
  [questionTypes.calculation]:    'tolerance',   // 数值容差
  [questionTypes.proof]:          'manual',      // 人工/半自动，显示参考答案
  [questionTypes.trueFalse]:      'exact',
  [questionTypes.shortAnswer]:    'normalized',
  [questionTypes.code]:           'runner',      // 在隔离环境执行测试
  [questionTypes.composite]:      'mixed'
};

// 3. 提交/完成方式映射
export const submitTypes = {
  [questionTypes.singleChoice]:   'instant',     // 点击选项立即判定
  [questionTypes.multipleChoice]: 'button',      // 点击提交按钮判定
  [questionTypes.fillInBlank]:    'button',
  [questionTypes.calculation]:    'button',
  [questionTypes.proof]:          'button',
  [questionTypes.trueFalse]:      'instant',
  [questionTypes.shortAnswer]:    'button',
  [questionTypes.code]:           'button',
  [questionTypes.composite]:      'button'
};
```

### 2.3 禁止事项

- 禁止在 `router.js` / 视图函数中直接判断 `kind === 'choice'` 来分支。
- 禁止新增题型时不更新 `question-types.js` 枚举和映射表。
- 禁止把「题型判断」和「答案验证」写在同一处。

---

## 3. 题目数据格式规范

### 3.1 统一题目结构

借鉴 freeCodeCamp 的 `ChallengeNode` + `ChallengeFile` 思想，每道题使用统一结构：

```js
{
  id: 'q001',
  itemId: 'i2',                 // 关联课程小节
  courseId: 'calculus',
  questionType: 0,              // questionTypes 枚举值
  title: '极限选择题',
  content: '题干，使用 \\( ... \\) 表示行内公式',
  options: ['0', '1', '∞'],     // 选择/判断题必填
  blanks: 2,                    // 填空题：空位数量
  answer: '0',                  // 标准答案（单选/判断/填空）
  answers: ['A', 'C'],          // 多选题：标准答案集合
  tolerance: 0.01,              // 计算题：数值容差
  unit: 'm/s',                  // 计算题：单位要求
  solution: '解法说明',          // 完整解析
  hint: '提示文本',              // 首次错误时显示
  testString: '',               // 代码题/复杂验证：验证表达式字符串
  difficulty: 1,                // 难度 1-5
  tags: ['极限', '无穷小'],
  source: '力学练习一第3题'      // 来源追溯
}
```

### 3.2 数据存储格式

借鉴 freeCodeCamp 的 Markdown + YAML frontmatter 模式：

- **优先使用 Markdown 文件**存储题目内容。
- 构建时（Vite 插件或 Node 脚本）将 Markdown 解析为 `src/data/*.js` 的 JSON 数据。
- 人工编辑题目时，直接改 Markdown，不要改 JSON。

示例 Markdown：

```markdown
---
id: q001
itemId: i2
courseId: calculus
questionType: 0
title: 极限选择题
difficulty: 1
tags: ['极限', '无穷小']
source: 力学练习一第3题
---

## Content
求 \( \lim_{x \to 0} \frac{\sin x}{x} \) 的值。

## Options
- 0
- 1
- ∞
- 不存在

## Answer
1

## Solution
由重要极限可知...
```

### 3.3 数据文件组织

```
coursecore/src/data/
├── platform.js          # 平台元数据
├── labels.js            # 题型/学科标签
├── question-types.js    # 题型枚举与映射表（新增）
├── courses.js           # 课程结构
├── questions.js         # 平台题库（由 Markdown 构建生成）
├── examPapers.js        # 期末试卷（由 Markdown 构建生成）
└── raw/                 # 原始 Markdown 题目（新增）
    ├── mechanics/
    │   ├── choice/
    │   ├── fill/
    │   └── calc/
    └── optics/
        └── ...
```

---

## 4. 答案验证系统规范

### 4.1 验证器设计

借鉴 freeCodeCamp 的 `executeChallengeSaga` + `FCCTestRunner` 模式：

```js
// src/validators/index.js
export const validators = {
  exact:        exactValidator,
  set:          setValidator,
  normalized:   normalizedValidator,
  tolerance:    toleranceValidator,
  manual:       manualValidator,
  runner:       codeRunnerValidator,
  mixed:        mixedValidator
};

export function validate(question, userAnswer) {
  const validatorType = validatorTypes[question.questionType];
  const validator = validators[validatorType];
  if (!validator) throw new Error(`No validator for type ${validatorType}`);
  return validator(question, userAnswer);
}
```

### 4.2 具体验证器实现

#### 4.2.1 exact（精确匹配）

```js
function exactValidator(question, userAnswer) {
  return String(userAnswer).trim() === String(question.answer).trim();
}
```

#### 4.2.2 normalized（归一化匹配）

```js
function normalizedValidator(question, userAnswer) {
  const normalize = s => String(s).toLowerCase().replace(/\s+/g, '').replace(/，/g, ',');
  return normalize(userAnswer) === normalize(question.answer);
}
```

#### 4.2.3 tolerance（数值容差）

```js
function toleranceValidator(question, userAnswer) {
  const userNum = parseFloat(userAnswer);
  const answerNum = parseFloat(question.answer);
  if (Number.isNaN(userNum)) return false;
  return Math.abs(userNum - answerNum) <= (question.tolerance || 1e-6);
}
```

#### 4.2.4 set（集合匹配，多选题）

```js
function setValidator(question, userAnswer) {
  const userSet = new Set(userAnswer);
  const answerSet = new Set(question.answers);
  return userSet.size === answerSet.size &&
         [...userSet].every(x => answerSet.has(x));
}
```

#### 4.2.5 manual（人工题，证明/简答）

```js
function manualValidator(question, userAnswer) {
  // 不自动判定，记录用户作答，显示参考答案
  return { manual: true, passed: null, userAnswer };
}
```

#### 4.2.6 runner（代码题，在隔离环境运行）

借鉴 freeCodeCamp 的 iframe test runner：

```js
async function codeRunnerValidator(question, userAnswer) {
  const iframe = document.getElementById('code-runner-frame');
  const runner = iframe.contentWindow.getRunner('javascript');
  const results = await runner.runAllTests([question.testString], 5000);
  return results.every(r => r.pass);
}
```

CourseCore 当前阶段可先用 `new Function()` 沙箱替代 iframe：

```js
function codeRunnerValidator(question, userAnswer) {
  try {
    const fn = new Function('return ' + question.testString);
    return fn(userAnswer);
  } catch (e) {
    return false;
  }
}
```

> 安全提示：未来涉及用户可输入代码时，必须迁移到 iframe + 沙箱，禁止长期依赖 `new Function()`。

### 4.3 验证结果结构

```js
{
  passed: boolean,
  userAnswer: any,
  correctAnswer: any,
  message: string,      // 失败原因，支持 HTML
  logs: string[],       // 运行日志（代码题）
  manual: boolean       // 是否人工题
}
```

---

## 5. 状态管理规范

### 5.1 全局状态结构

借鉴 freeCodeCamp 的 Challenge Redux 设计，CourseCore 的 `state.js` 应扩展为：

```js
export const defaultState = {
  // 视图与导航
  view: 'landing',
  params: {},

  // 当前题目
  currentQuestion: null,      // { id, questionType, ... }
  userAnswer: null,           // 当前用户答案
  validationResult: null,     // 验证结果对象
  isSubmitting: false,

  // 进度
  completedQuestions: {},     // { qid: { passed, attempts, lastAnswer } }
  currentCourse: null,
  currentModule: null,

  // UI
  theme: 'dark',
  showSolution: false,
  activeModals: {},

  // 本地存储版本控制
  version: 1
};
```

### 5.2 进度持久化

```js
export function saveProgress(state) {
  localStorage.setItem('coursecore-progress', JSON.stringify({
    completedQuestions: state.completedQuestions,
    currentCourse: state.currentCourse,
    currentModule: state.currentModule,
    version: state.version
  }));
}

export function loadProgress() {
  const raw = localStorage.getItem('coursecore-progress');
  if (!raw) return null;
  const data = JSON.parse(raw);
  // 版本迁移逻辑
  if (data.version !== defaultState.version) {
    return migrateProgress(data);
  }
  return data;
}
```

### 5.3 答题流程状态转换

```
用户输入 → updateUserAnswer(qid, answer)
  ↓
点击提交 → validateQuestion(qid)
  ↓
验证器执行 → validationResult = { passed, message, ... }
  ↓
更新 completedQuestions[qid] = { passed, attempts++, lastAnswer }
  ↓
显示结果 + 解法 + 下一题入口
  ↓
全部通过/到达末尾 → 显示完成模态框
```

---

## 6. UI / 页面模板规范

### 6.1 模板映射

```js
// src/views/question-templates.js
export const questionTemplates = {
  choice: renderChoiceQuestion,
  fill:   renderFillQuestion,
  calc:   renderCalcQuestion,
  code:   renderCodeQuestion,
  exam:   renderExamPaper
};

export function renderQuestion(question) {
  const viewType = viewTypes[question.questionType];
  const template = questionTemplates[viewType];
  return template(question);
}
```

### 6.2 统一题目页面结构

每个模板渲染出的 DOM 必须包含以下区域：

```html
<article class="question-card" data-qid="q001" data-type="0">
  <header class="question-header">
    <span class="question-type-badge">单选题</span>
    <h2 class="question-title">题目标题</h2>
  </header>

  <section class="question-content">题干内容</section>

  <section class="question-input">
    <!-- 不同题型输入区：选项 / 输入框 / 编辑器 -->
  </section>

  <section class="question-actions">
    <button data-action="submit-answer">提交</button>
    <button data-action="show-hint">提示</button>
    <button data-action="reset-answer">重置</button>
  </section>

  <section class="question-feedback" hidden>
    <!-- 判定结果 -->
  </section>

  <section class="question-solution" hidden>
    <!-- 完整解析 -->
  </section>
</article>
```

### 6.3 测试结果列表

借鉴 freeCodeCamp 的 `test-suite.tsx`：

- 每道题若有多个判定点（如多填空、多步骤），显示为测试项列表。
- 每项显示：状态图标 + 序号 + 描述。
- 状态：等待 / 运行中 / 通过 / 失败。

```html
<ul class="test-suite">
  <li class="test-result test-pass">
    <span class="test-icon">✓</span>
    <span>第1空正确</span>
  </li>
  <li class="test-result test-fail">
    <span class="test-icon">✗</span>
    <span>第2空错误：期望 9.8，实际 10</span>
  </li>
</ul>
```

---

## 7. 事件与路由规范

### 7.1 data-action 事件委托

保持 CourseCore 现有 `data-action` 模式，但新增统一答题处理器：

```js
// router.js 或 question-handler.js
const actionHandlers = {
  'select-option': handleSelectOption,
  'submit-answer': handleSubmitAnswer,
  'show-hint':     handleShowHint,
  'reset-answer':  handleResetAnswer,
  'next-question': handleNextQuestion,
  'prev-question': handlePrevQuestion
};
```

### 7.2 路由参数

```js
// 题目详情
state.view = 'practice';
state.params = { courseId: 'calculus', itemId: 'i2', qid: 'q001' };

// 试卷
state.view = 'exam-detail';
state.params = { examId: 'exam-csust-mechanics-2024' };
```

---

## 8. 构建与数据管道

### 8.1 Markdown → JS 构建流程

```
curriculum/raw/*.md
        │
        ▼
build/questions-builder.js (Node 脚本)
        │
        ▼
coursecore/src/data/questions.js
        │
        ▼
Vite build → dist/
```

### 8.2 构建脚本职责

1. 扫描 `curriculum/raw/` 下的 Markdown。
2. 解析 frontmatter + `## Content/## Options/## Answer/## Solution` 等 section。
3. 校验题目 schema（id/answer/questionType 必填）。
4. 输出 ES Module 到 `src/data/questions.js`。

---

## 9. 代码组织规范

### 9.1 新增文件/目录

```
coursecore/src/
├── config/
│   └── question-types.js      # 题型枚举 + 映射表
├── validators/
│   ├── index.js               # validate() 主入口
│   ├── exact.js
│   ├── normalized.js
│   ├── tolerance.js
│   ├── set.js
│   ├── manual.js
│   └── runner.js
├── views/
│   └── question/
│       ├── index.js           # renderQuestion() 入口
│       ├── choice.js
│       ├── fill.js
│       ├── calc.js
│       └── code.js
├── builders/
│   └── question-builder.js    # Markdown → JS（构建时）
└── utils/
    └── progress.js            # localStorage 进度读写迁移
```

### 9.2 禁止的代码结构

- 禁止在视图文件里直接写答案比较逻辑。
- 禁止在路由文件里根据 `kind` 字符串分发题型渲染。
- 禁止把题目数据、解法、验证逻辑耦合在一个对象里。
- 禁止使用全局函数处理答题事件。

---

## 10. 扩展 checklist

新增题型时，必须修改/新增以下文件：

- [ ] `src/config/question-types.js`：新增枚举值 + 三个映射表项。
- [ ] `src/validators/`：新增验证器（如需要）。
- [ ] `src/views/question/`：新增渲染模板。
- [ ] `src/data/labels.js`：新增题型标签文案。
- [ ] `builders/question-builder.js`：新增 Markdown section 解析（如需要）。
- [ ] `technical-architecture.md`：更新数据格式说明。
- [ ] `prd.md`：更新功能范围。
- [ ] `development-log.md`：记录新增阶段。

---

## 11. 与 freeCodeCamp 的对应关系

| freeCodeCamp 实现 | CourseCore 借鉴方案 |
|-------------------|---------------------|
| `challengeTypes` + `viewTypes`/`submitTypes` | `questionTypes` + `viewTypes`/`validatorTypes`/`submitTypes` |
| `ChallengeNode` + `ChallengeFile` | 统一题目结构 + 多文件/多空位扩展 |
| Markdown + YAML frontmatter 题目 | `curriculum/raw/*.md` + 构建脚本 |
| `executeChallengeSaga` | `validate(question, userAnswer)` + 异步验证器 |
| `FCCTestRunner` iframe | 先 `new Function()` 沙箱，未来迁移 iframe |
| `TestSuite` 测试列表 | 多判定点的测试结果列表 |
| `completionEpic` | 提交完成后更新进度 + 导航下一题 |
| Redux `challenge` slice | `state.js` 扩展当前题目与验证状态 |

---

## 12. 最后更新时间

2026-07-24
