# Tasks — 统一题库数据模型重构

实施前提：本重构为破坏性变更（删 `theory_contents`、`exam_questions`，改 `question_kp`/`questions` 结构）。一次性完成，先做 schema + 迁移脚本，再改后端 BFF，最后改前端数据层与视图，收尾做验收。

## 阶段 A：数据库 Schema 与迁移

- [ ] Task 1: 编写新 schema 脚本 `scripts/schema-v2.sql`
  - [ ] 1.1 `questions` 表：删除 `item_id`/`course_id`/`module_id` 冗余列，保留题目本体字段（question_type/title/content/options/answers/answer/blanks/tolerance/unit/solution/hint/test_string/image/difficulty/tags/source），`id TEXT PRIMARY KEY` 全局唯一
  - [ ] 1.2 新增 `item_questions(id, item_id → items.id, question_id → questions.id, role CHECK IN ('practice','theory_example'), order_index)`，建 `UNIQUE(item_id, question_id, role)` 与索引
  - [ ] 1.3 新增 `exam_paper_questions(id, exam_id → exam_papers.id, section_id → exam_sections.id, question_id → questions.id, score, order_index)`，建索引（exam_id / section_id / question_id）
  - [ ] 1.4 `question_kp`：删除 `source` 列，`question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE`，唯一索引 `uq_qk_primary_once`、`idx_qk_question` 去掉 `source` 维度
  - [ ] 1.5 `answers.question_id → questions.id`、`progress.item_id → items.id` 补真实外键
  - [ ] 1.6 `items` 表新增/保障 `content TEXT`（承接原 theory_contents.content）
  - [ ] 1.7 全量重写 RLS 策略（公开可读 + admin 可写）、索引、seed 适配
  - [ ] 1.8 删除 `theory_contents`、`exam_questions` 两张旧表

- [ ] Task 2: 编写数据迁移脚本 `scripts/migrate-v2.sql`（在旧库上原地迁移）
  - [ ] 2.1 把每个 `theory_contents.examples` JSONB 数组逐行拆成 `questions` 真实行（沿用 `${itemId}-ex${idx}` id），并写入 `items.content` 承接正文
  - [ ] 2.2 把 `exam_questions` 每行迁入统一 `questions`（保留原 id），并写 `exam_paper_questions` 关联（exam_id/section_id/score/order_index）
  - [ ] 2.3 把 `questions.item_id` 迁移到 `item_questions(role='practice')`
  - [ ] 2.4 清洗 `answers`/`progress` 悬空 id 后补外键
  - [ ] 2.5 迁移 `question_kp`：去掉 source 维度，id 冲突时重命名空间，保证 `questions` 全局唯一

- [x] Task 3: 确认 seed 策略（用户定：数据迁移保留）
  - 决策：**迁移保留** → 现有 `scripts/seed/*.sql`、`scripts/seed-*.js`、`generate-seed-sql.js`、`md-to-exam-seed.js` **保持旧格式不变**（用于初始化旧库依赖），生产升级走 `migrate-v2.sql` 原地迁移，无需重写 seed 文件。
  - 说明：全新部署才需要 schema-v2 + 新 seed；本路径不走全新部署，故 seed 不改。
  - 3.x 已确认：`src/data/*.js` 仍作为 seed 数据源（灌旧库用），但前端运行时不再依赖（见 Task 8 切 Supabase）。

## 阶段 B：后端 BFF

- [x] Task 4: 适配 BFF 路由
  - [x] 4.1 `bff/src/routes/content.ts`：papers 内联题目改经 `exam_paper_questions → questions` join；`/questions/:id` 改查统一 `questions`
  - [x] 4.2 `bff/src/routes/user.ts`、`bff/src/routes/judge.ts`：所有 `exam_questions`/`theory_contents` 引用改统一 `questions`
  - [x] 4.3 `functions/api/[[route]].js`：同步旧直连逻辑（改源码后 `node scripts/build-bff.js` 重新打包）

## 阶段 C：前端数据层

- [ ] Task 5: 适配题目查询与进度判定
  - [ ] 5.1 `src/utils/question.js`：`getItemQuestions` 改经 `item_questions` join（含 theory_example 角色）；`findQuestion` 去掉假 ID 分支；`getQuestionContext` 适配统一题库
  - [ ] 5.2 `src/state.js`：确认 `isItemCompleted` 能正确把理论例题（经 item_questions）纳入完成判定
  - [ ] 5.3 `src/services/content.js`：`loadTheoryContent` 改读 `items.content`；`loadQuestions` 改经 `item_questions`；`loadQuestionKps` 去掉 source

- [ ] Task 6: 适配理论例题渲染与提交
  - [ ] 6.1 `src/router.js`：`normalizeTheoryExamplesForSubmit` 改读真实题目 id，不再生成 `${itemId}-ex${idx}` 伪 id
  - [ ] 6.2 `src/views/practiceList.js`、`src/views/practice/quiz-adapter.js`：理论例题渲染/提交改读真实题数据

## 阶段 D：前端管理端与静态数据

- [x] Task 7: 适配管理端 CRUD
  - [x] 7.1 `src/services/admin.js`：`listTheoryContents`/`updateTheoryContent`/`upsertTheoryContent` 改 items.content；题目 CRUD 去 `item_id`，改维护 `item_questions`；`exam_questions` CRUD 改维护 `questions` + `exam_paper_questions`；`question_kp` 去 source；删题时清理 `question_kp`+关联表
  - [x] 7.2 `src/views/admin/adminPage.js`、`src/views/knowledgeBase.js`：理论编辑器/训练编辑器/期末试卷编辑器/考点管理适配新数据模型

- [x] Task 8: 适配剩余引用与静态数据
  - [x] 8.1 `src/services/practice-data.js`（试卷题读 `sec.questions`）、`src/services/review-engine.js`（wrong_book join 改 `questions`）、`src/services/sync.js`（仅操作 answers/progress/wrong_book，无需改）；连带 consumer `knowledgeBase.js`/`quiz-adapter.js` 读 `e.questions`、我的试卷从统一 `questions` 取题
  - [x] 8.2 静态数据 `src/data/questions.js`、`src/data/examPapers.js`、`src/data/theoryContents.js` 双轨保留（作为 seed 源 + 运行时 fallback，不迁移到关联表结构）

## 阶段 E：验收

- [ ] Task 9: 全链路验收（对照 checklist.md 逐项验证）
  - [ ] 9.1 理论例题刷完 → 进度正确更新（核心 bug 修复验证）
  - [ ] 9.2 平台题/例题/试卷题共用同一 questions，改一处处处生效
  - [ ] 9.3 通过关联表查询顺序/角色正确，考点单一 FK 可查
  - [ ] 9.4 管理端 CRUD、试卷组卷/设分/发布全流程可用
  - [ ] 9.5 迁移脚本在含旧数据/旧进度/旧答案的库上可成功执行且无脏数据

# Task Dependencies

- Task 1 ← Task 3（seed 依赖新 schema）
- Task 2 依赖 Task 1（迁移目标结构）
- Task 4 依赖 Task 1、Task 2
- Task 5、Task 6 依赖 Task 2（数据层读新结构）
- Task 7 依赖 Task 1、Task 5
- Task 8 依赖 Task 5、Task 6、Task 7
- Task 9 依赖全部
- Task 1/2/3 可先于前端执行；Task 5/6 相互独立可并行；Task 7 与 Task 8 部分并行