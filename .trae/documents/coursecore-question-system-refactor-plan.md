> 文档状态：历史计划，核心内容已落地；当前题型、构建和验证事实以 `technical-architecture.md` 与源码为准。
>
> 本文保留为设计来源，不再作为逐项执行清单。

# CourseCore 刷题系统重构实施计划

## Context

用户已制定 `.trae/rules/刷题系统实现规范-freeCodeCamp借鉴.md`，要求将 freeCodeCamp 的刷题实现模式（配置驱动题型、独立验证器、统一题目结构、Markdown 数据源、状态管理扩展）全面落地到 CourseCore 项目中。当前 CourseCore 使用字符串 `kind` 区分题型、答案验证硬编码在 `router.js`、题目数据直接写死在 `src/data/questions.js` 与 `src/data/examPapers.js` 中，已无法满足后续扩展多题型与批量替换真实教学内容的需求。

本计划目标：在不破坏现有页面视觉与导航习惯的前提下，将 CourseCore 重构为「题型枚举 + 验证器 + 统一模板 + Markdown 构建」的刷题系统。

***

## 推荐方案

### 阶段 1：题型与验证基础设施（无依赖，最先做）

1. 新增 `src/config/question-types.js`：

   * 定义 `questionTypes` 枚举（singleChoice/multipleChoice/fillInBlank/calculation/proof/trueFalse/shortAnswer/code/composite）。

   * 定义 `viewTypes`、`validatorTypes`、`submitTypes` 三个映射表。
2. 新增 `src/validators/` 目录：

   * `index.js`：统一入口 `validate(question, userAnswer)`。

   * `exact.js` / `normalized.js` / `tolerance.js` / `set.js` / `manual.js` / `runner.js` / `mixed.js`。
3. 更新 `src/data/labels.js`：

   * 新增 `QUESTION_TYPE_LABELS` 数值→中文标签映射，保留旧 `KIND_LABELS` 做兼容直到阶段 6 完成替换。

### 阶段 2：数据迁移与构建管道

1. 新增 `coursecore/curriculum/raw/` 目录：

   * `questions/`：按学科存放平台题库 Markdown。

   * `exams/`：存放期末试卷 Markdown。
2. 新增 `coursecore/builders/question-builder.js`：

   * 扫描 `curriculum/raw/**/*.md`。

   * 使用 `gray-matter` 解析 frontmatter，按 section 拆分题目。

   * 校验必填字段：`id`、`questionType`、`content`、`answer`（或 `answers`）。

   * 输出 `src/data/questions.js` 与 `src/data/examPapers.js`。
3. 新增一次性脚本 `coursecore/scripts/migrate-legacy-data.js`：

   * 读取当前 `src/data/questions.js` 与 `src/data/examPapers.js`，自动生成 Markdown。

   * 旧 `kind` 映射：`choice`→`singleChoice`、`fill`→`fillInBlank`、`calc`/`apply`→`calculation`、`proof`→`proof`。
4. 更新 `coursecore/package.json`：

   * 增加 `build:data`、`predev`、`prebuild`、`validate:data` 脚本。

### 阶段 3：状态管理重构

1. 重构 `src/state.js`：

   * 扩展状态：`currentQuestion`、`userAnswer`、`validationResult`、`isSubmitting`、`completedQuestions`、`version`。

   * 合并 localStorage key 为 `coursecore-state`。

   * `loadProgress()` 兼容旧 key（`coursecore-progress`、`coursecore-questions`、`coursecore-theme`）并迁移。

   * `markQuestion(qid, result)` 记录 `passed`/`attempts`/`lastAnswer`/`lastAt`。
2. 新增 `src/utils/progress.js`：

   * 版本迁移辅助函数。

   * 旧 `completedQuestions` 结构 `{ correct, at }` → 新 `{ passed, attempts, lastAnswer, lastAt }`。

### 阶段 4：题目模板渲染层

1. 新增 `src/views/question/` 目录：

   * `index.js`：`renderQuestion(question)` 根据 `viewTypes` 分发。

   * `choice.js`：单选/多选/判断（radio/checkbox）。

   * `fill.js`：填空/简答（input，支持多 blank）。

   * `calc.js`：计算/证明（input + 解法区）。

   * `code.js`：代码题（textarea + runner）。

   * `chrome.js`：题目标题、标签、操作按钮、反馈区、解法区、上下题导航。
2. 改造 `src/views/practiceDetail.js`：

   * 改为薄封装，调用 `renderQuestion()` + `chrome` 组件。
3. 新增 `src/views/question/preview.js`：

   * 用于列表页只展示题干+标签，不含输入。

### 阶段 5：事件与答案处理重构

1. 更新 `src/main.js` 事件委托：

   * 新增 `select-option`、`submit-answer`、`show-hint`、`reset-answer`、`next-question`、`prev-question`。

   * `input` 事件监听 `.question-input-field`，实时更新 `state.userAnswer`。
2. 重构 `src/router.js`：

   * 删除 `checkAnswer` / `checkExamAnswer`。

   * 新增 `handleSubmitAnswer(qid)`：收集答案 → `validate()` → 更新状态 → 显示反馈/解法 → 即时提交题型自动下一题。

   * 新增 `handleNextQuestion()` / `handlePrevQuestion()`。
3. 新增 `src/utils/answer-collector.js`：

   * 根据 `viewTypes` 收集用户输入（单选/多选/填空/计算/代码）。
4. 新增 `src/utils/question.js`：

   * `findQuestion(qid)`：在 QUESTIONS 与 EXAM\_PAPERS 中查找。

   * `getQuestionContext(question)`：返回当前题目在练习/试卷/全局中的上下文，用于导航。

### 阶段 6：列表与筛选适配

1. 更新 `src/views/practiceList.js`、`practiceBank.js`、`examDetail.js`、`knowledgeBase.js`：

   * `kind` 字符串 → `questionType` 数值。

   * 使用 `QUESTION_TYPE_LABELS` 显示题型标签。

   * `practiceBank.js` 筛选器值改为数值字符串（如 `"0"` 对应 singleChoice）。
2. `practiceBank.js` 搜索过滤兼容 `questionType`。

### 阶段 7：构建验证与文档同步

1. 本地验证：

   * `npm run build:data` 成功生成数据。

   * `npm run build` 无错误。

   * `npm run preview` 检查首页、课程、知识库、刷题库、题目详情、试卷详情、上下题导航、进度持久化。
2. 更新文档：

   * `technical-architecture.md`：数据格式、目录结构、验证系统。

   * `prd.md`：题型范围、答题流程。

   * `development-log.md`：新增阶段记录。

***

## 关键文件

### 新增

* `coursecore/src/config/question-types.js`

* `coursecore/src/validators/index.js`

* `coursecore/src/validators/exact.js`

* `coursecore/src/validators/normalized.js`

* `coursecore/src/validators/tolerance.js`

* `coursecore/src/validators/set.js`

* `coursecore/src/validators/manual.js`

* `coursecore/src/validators/runner.js`

* `coursecore/src/validators/mixed.js`

* `coursecore/src/utils/progress.js`

* `coursecore/src/utils/question.js`

* `coursecore/src/utils/answer-collector.js`

* `coursecore/src/views/question/index.js`

* `coursecore/src/views/question/choice.js`

* `coursecore/src/views/question/fill.js`

* `coursecore/src/views/question/calc.js`

* `coursecore/src/views/question/code.js`

* `coursecore/src/views/question/chrome.js`

* `coursecore/src/views/question/preview.js`

* `coursecore/builders/question-builder.js`

* `coursecore/scripts/migrate-legacy-data.js`

* `coursecore/curriculum/raw/questions/**/*.md`

* `coursecore/curriculum/raw/exams/*.md`

### 修改

* `coursecore/src/main.js`

* `coursecore/src/router.js`

* `coursecore/src/state.js`

* `coursecore/src/utils.js`（可选，增加通用辅助）

* `coursecore/src/data/labels.js`

* `coursecore/src/data/questions.js`（由构建脚本生成）

* `coursecore/src/data/examPapers.js`（由构建脚本生成）

* `coursecore/src/views/practiceDetail.js`

* `coursecore/src/views/practiceList.js`

* `coursecore/src/views/practiceBank.js`

* `coursecore/src/views/examDetail.js`

* `coursecore/src/views/knowledgeBase.js`

* `coursecore/package.json`

* `.trae/documents/technical-architecture.md`

* `.trae/documents/prd.md`

* `.trae/documents/development-log.md`

***

## 验证方案

1. **构建验证**：

   ```bash
   cd coursecore
   npm run build:data
   npm run build
   npm run preview
   ```
2. **功能验证清单**：

   * 首页渲染正常。

   * 课程详情 → 小节 → 练习列表 → 题目详情链路正常。

   * 单选题点击选项即时判定并显示解法。

   * 填空题/计算题输入答案提交后正确/错误反馈正常。

   * 证明题提交后显示「人工核对」与参考答案。

   * 题目详情页上下题导航可用。

   * 刷题库按题型、学科筛选正常。

   * 知识库按已完成题目分组正常。

   * 刷新页面后主题、完成进度保持。
3. **数据验证**：

   * `localStorage` 中只存在 `coursecore-state`。

   * 旧 `coursecore-progress` / `coursecore-questions` / `coursecore-theme` 被自动迁移并删除。
4. **回归验证**：

   * 无 console error。

   * 所有现有题目在迁移后仍能正常作答。

***

## 风险与回退

| 风险                      | 回退/缓解                                                           |
| ----------------------- | --------------------------------------------------------------- |
| localStorage 合并导致旧进度丢失  | `loadProgress()` 先读取旧 key 迁移，再删除旧 key；异常时保留旧 key 不删除            |
| Markdown 构建脚本失败         | 保留原 `src/data/questions.js` 作为备份，失败时回滚                          |
| 数据字段不兼容                 | 构建脚本做 `kind` → `questionType` 映射，所有视图统一走 `QUESTION_TYPE_LABELS` |
| 证明题失去自动判定               | `manual` 验证器提交后立即显示参考答案，并标记为「已作答」                               |
| 代码题 `new Function` 安全风险 | 当前仅用于内置代码题；后续必须迁移到 iframe runner，并在文档中标记为已知限制                   |

***

## 实施建议

建议按阶段顺序执行，每个阶段完成后运行 `npm run build && npm run preview` 做回归验证。阶段 2 的数据迁移脚本运行后需人工校对 `apply` 题与 `tags`/`source` 字段。阶段 4-5 是核心重构，改动面最大，应优先保证单选/填空/计算三种现有题型正常，再扩展多选/判断/简答/代码题型。

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />
