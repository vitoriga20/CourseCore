# 后台试卷题目排序

id: memory-20260808-admin-exam-paper-ordering
type: domain
status: active
confidence: verified
source: src/services/admin.js, tests/admin-exam-order.test.js
updated: 2026-08-08
review_after: 2027-02-08
tags: [admin, exam-paper, ordering]

后台试卷编辑器读取 `exam_paper_questions` 时，须按“`exam_sections.order_index` → 关联记录 `order_index`”排序，以复原原试卷的大题与题号顺序。
若旧迁移数据缺少可用的大题关联，则从题目 ID 的 `-s<大题序号>-<题号>` 后缀恢复顺序；无该后缀的新式扁平题目只按自身 `order_index` 排列。
实现集中在 `sortExamQuestionLinks`，避免页面层各自排序而产生不一致。
