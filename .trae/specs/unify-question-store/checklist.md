# Checklist — 统一题库数据模型重构验收

## 验收纪律（必读，铁律）

> 每个验收点都必须能独立 git 回滚。做法：
>
> 1. **每完成一个 Task，就单独 commit 一次**，message 带 `（Task N）` 前缀，如 `feat(db): schema-v2 统一题库（Task 1）`。**禁止跨 Task 混提**。
> 2. **每打钩一个验收点前，先确认对应改动已 commit**。若验证发现 bug → 先修再补 commit，不破坏上一个 checkpoint。
> 3. **回滚方法**：`git revert <commit>` 或 `git checkout <commit> -- <路径>`。列表见下，每个 Task 一个锚点。
> 4. **杂项隔离**：与重构无关的改动（docs/tmp/diagrams 等）**不混入** Task commit，单独提交或暂不动，避免污染 checkpoint。

| Task | commit 锚点（回滚目标） | 状态 |
|------|------------------------|------|
| Task 1 schema | `a923c32` | Done |
| Task 2 migrate | `c749d62` | Done |
| Task 3 seed 策略 | `d1152f9` | Done |
| Task 4 BFF | *(待提交)* | Todo |
| Task 5 数据层 | *(待提交)* | Todo |
| Task 6 例题渲染 | *(待提交)* | Todo |
| Task 7 管理端 | *(待提交)* | Todo |
| Task 8 剩余引用 | *(待提交)* | Todo |
| Task 9 验收 | *(待提交)* | Todo |

## 数据库 Schema（Task 1）
- [ ] `questions` 表已删除 `item_id`/`course_id`/`module_id` 冗余列，只保留题目本体字段，`id TEXT PRIMARY KEY` 全局唯一
- [ ] `item_questions` 表已创建，含 `item_id → items.id`、`question_id → questions.id`、`role('practice'|'theory_example')`、`order_index`，并有唯一约束与索引
- [ ] `exam_paper_questions` 表已创建，含 `exam_id`、`section_id`、`question_id → questions.id`、`score`、`order_index` 及索引
- [ ] `question_kp` 已删除 `source` 列，`question_id` 为指向 `questions.id` 的外键，唯一索引/查询索引已去 source 维度
- [ ] `answers.question_id`、`progress.item_id` 已补真实外键
- [ ] `items.content` 已存在并可承接理论正文
- [ ] RLS 策略、索引、seed 已全量重写适配新结构
- [ ] `theory_contents`、`exam_questions` 两张旧表已删除

## 数据迁移（Task 2）
- [ ] `theory_contents.examples` 已逐行迁入 `questions`（沿用 `${itemId}-ex${idx}` id），正文已并入 `items.content`
- [ ] `exam_questions` 已迁入统一 `questions`（保留原 id），并写入 `exam_paper_questions` 关联
- [ ] `questions.item_id` 已迁入 `item_questions(role='practice')`
- [ ] `answers`/`progress` 悬空 id 已清洗后才建外键
- [ ] `question_kp` 已去 source 维度，id 冲突已重命名空间，`questions` 全局唯一

## 后端 BFF（Task 4）
- [ ] `content.ts` papers 内联题目经 `exam_paper_questions → questions` join，`/questions/:id` 查统一 `questions`
- [ ] `user.ts`、`judge.ts`、`functions/api/[[route]].js` 已无 `exam_questions`/`theory_contents` 引用

## 前端数据层（Task 5、6）
- [ ] `getItemQuestions` 经 `item_questions` 关联返回题目（含 theory_example 角色），顺序正确
- [ ] `findQuestion` 已去掉 `${itemId}-ex${idx}` 假 ID 分支
- [ ] `isItemCompleted(itemId)` 能把理论例题纳入完成判定 → 刷完小节进度正常更新
- [ ] `loadTheoryContent` 读 `items.content`；`loadQuestions` 经 `item_questions`；`loadQuestionKps` 去 source
- [ ] `normalizeTheoryExamplesForSubmit` 不再生成伪 id，改读真实题目 id
- [ ] `practiceList.js`、`quiz-adapter.js` 理论例题渲染/提交读真实题数据

## 管理端与静态数据（Task 7、8）
- [ ] `admin.js` 理论内容 CRUD 走 `items.content`；题目 CRUD 维护 `item_questions`；试卷题 CRUD 维护 `questions`+`exam_paper_questions`；`question_kp` 去 source；删题清理关联
- [ ] `adminPage.js`、`knowledgeBase.js` 编辑器与考点管理适配新模型
- [ ] `practice-data.js`、`review-engine.js`、`sync.js` 已适配统一题库
- [ ] `src/data/questions.js`、`examPapers.js` 静态数据双轨处理完成

## 全链路行为（Task 9）
- [ ] 带例题的理论小节刷完 → 进度正确更新（核心 bug 修复）
- [ ] 修改某题题干/答案/解析 → 练习、试卷等所有引用处同步生效
- [ ] 通过关联表查询小节题/试卷题，顺序与 role 正确；考点单一 FK 可查
- [ ] 管理端理论/训练/试卷编辑器、组卷/设分/发布全流程可用
- [ ] 迁移脚本在含旧数据/旧进度/旧答案的库上执行成功且无脏数据