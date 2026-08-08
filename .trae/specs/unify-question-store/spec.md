# 统一题库数据模型重构 Spec

## Why
当前库把"题目"拆成三套割裂系统：平台题 `questions`、试卷题 `exam_questions`（字段整表重复）、理论例题 `theory_contents.examples`（存 JSONB，运行时前端拼假 ID `${itemId}-ex${idx}`）。三套之间无真外键、跨库多态关联 `question_kp.source`，导致：
- 理论例题刷完进度不更新（`isItemCompleted` 查 questions 表，例题假 ID 对不上）。
- 同一道题改一处忘另一处，可维护性差。
- `answers`/`progress` 的 id 是裸 TEXT 无外键，脏数据无法约束。

本重构把题目统一为一张 `questions` 表，用关联表表达"谁用题"，全链路修好。

## What Changes
- **统一题库**：`questions` 只存题目本体（题干/选项/答案/解析/难度/标签），删除 `item_id`/`course_id`/`module_id` 冗余列。ID **保持 TEXT、全局唯一**（平台题保持 `q-*`，理论例题沿用 `${itemId}-ex${idx}`，试卷题沿用原 id，冲突时重命名空间）。
- **删 `theory_contents`**：正文并入 `items.content`；理论例题落真实 `questions` 行。
- **新增 `item_questions(item_id, question_id, role, order_index)`**：role ∈ `practice | theory_example`，表达"某小节用了哪些题、是练习还是例题、顺序"。
- **`exam_questions` 改关联表 `exam_paper_questions(exam_id, section_id, question_id, score, order_index)`**：试卷不再复制题，复用统一题库。
- **`question_kp` 去 `source`**：直接 FK `question_id → questions.id`；同步改唯一索引 `uq_qk_primary_once`、`idx_qk_question`，去掉 `source` 维度。
- **补真外键**：`answers.question_id → questions.id`、`progress.item_id → items.id`。
- **前端数据层迁移**：`getItemQuestions` 改经 `item_questions` 关联（含 theory_example 角色）；理论例题渲染/提交改读真实题；`findQuestion` 去掉假 ID 分支；admin 端 CRUD 与 BFF 同步改。
- **迁移脚本**：`scripts/schema-v2.sql`（新 schema）+ `scripts/migrate-v2.sql`（旧数据迁行：examples JSONB 拆行、exam_questions 落 questions、answers/progress 补 id 映射、历史假 ID 尽量反推）。
- **BREAKING**：删 `theory_contents`、`exam_questions` 两表；`question_kp` 结构变化；`questions` 列变化；RLS/索引/seed 全量重写。

## Impact
- Affected specs: 课程内容树、练习/刷题进度追踪、期末试卷编辑器、考点系统、作答记录与学习进度。
- Affected code:
  - `scripts/supabase-schema.sql`、`scripts/migrations/*.sql`、`scripts/seed/*.sql`
  - `src/utils/question.js`、`src/state.js`
  - `src/views/practiceList.js`、`src/router.js`
  - `src/services/content.js`、`src/services/admin.js`、`src/services/sync.js`
  - `src/services/practice-data.js`、`src/services/review-engine.js`
  - `src/views/practice/quiz-adapter.js`、`src/views/knowledgeBase.js`
  - `src/views/admin/adminPage.js`
  - `bff/src/routes/content.ts`、`bff/src/routes/user.ts`
  - 静态数据 `src/data/*.js`（双轨处理）

## ADDED Requirements

### Requirement: 例题真实落库并纳入进度
系统 SHALL 把理论例题存为 `questions` 真实行，并通过 `item_questions(role='theory_example')` 关联到小节。
- **WHEN** 用户刷完某小节全部例题（含练习题）
- **THEN** `isItemCompleted(itemId)` 判定该小节完成，进度正常更新

### Requirement: 统一题目来源
系统 SHALL 让平台题、理论例题、试卷题共用同一 `questions` 表，来源差异用关联表表达，不再复制题目字段。
- **WHEN** 修改某题题干/选项/答案/解析
- **THEN** 练习、试卷等所有引用处同步生效，无需多处修改

### Requirement: 关联表承载"谁用题"
系统 SHALL 用 `item_questions` 与 `exam_paper_questions` 表达题目的上下文（小节/角色/顺序、试卷/大题/分值/顺序）。
- **WHEN** 查询某小节的题或某试卷的题
- **THEN** 通过关联表 join 统一 questions，顺序与角色正确

### Requirement: 移除多态考点关联
系统 SHALL 让 `question_kp` 只通过 `question_id → questions.id` 关联考点，不再有 `source` 分支。
- **WHEN** 查询某题的考点
- **THEN** 单一 FK 即可，无需区分平台/试卷题源

## MODIFIED Requirements

### Requirement: 数据完整性约束
`answers.question_id` 与 `progress.item_id` 改为真实外键，禁止悬空引用。
**Reason**: 裸 TEXT 无完整性，脏数据无法预防。
**Migration**: 迁移脚本先清洗悬空 id 再建外键。

### Requirement: 题库字段
`questions` 表删除 `item_id/course_id/module_id` 冗余列，只保留题目本体字段。
**Reason**: 上下文改由关联表表达，避免与 items 重复。
**Migration**: 迁移脚本把 `item_id` 移到 `item_questions`。

## REMOVED Requirements

### Requirement: theory_contents 表
**Reason**: 正文并入 `items.content`，例题落 `questions` 真实行。
**Migration**: 正文迁移到 `items.content(该 item)`；`examples` 逐行拆成 `questions` + `item_questions(role='theory_example')`。

### Requirement: exam_questions 表
**Reason**: 试卷题合并进统一 `questions`，避免字段重复。
**Migration**: 每行落 `questions`（保留原 id），再写 `exam_paper_questions` 关联试卷/大题/分值/顺序。

### Requirement: question_kp.source 字段
**Reason**: 题目统一后无需区分题源。
**Migration**: 删除 `source`；唯一索引改 `(question_id)` 维度。