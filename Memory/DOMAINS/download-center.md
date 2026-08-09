# 下载中心 / PDF 导出约定

id: memory-20260809-download-center
type: domain
status: active
confidence: verified
source: development-log.md 2026-08-09
updated: 2026-08-09
tags: [download, pdf, export, download-center]

## 结论
- 下载中心入口在右上角错落菜单第 `04` 行（`/download`，view `download`）；覆盖五类内容：理论 / 训练题 / 综合测试 / 期末试卷 / 复习错题。
- 核心文件：`src/services/download.js`（聚合 + 主题化导出 DOM + MathJax 等待 + html2canvas→jsPDF 分页导出）、`src/services/download-queue.js`（localStorage `cc-download-queue-v1` 队列）、`src/views/downloadCenter.js`（5 tab + 学科/题型/含答案筛选 + 队列栏）。
- 导出策略：**不在线上多页截图**，把选中内容聚合到隐藏容器 `#cc-export-container`（视口内、低 z-index、`pointer-events:none`，off-screen 会让 html2canvas 挂起）→ 套主题 CSS 变量 → 等 MathJax → 整份 html2canvas 分页切片。
- PDF 导出恒用打印友好的浅色墨绿底（`--cc-primary:#2d6a4f`），不随应用明暗主题变；新增主题只需扩展 `THEME_VARS`。
- 单份入口：刷题中心/试卷列表按钮 `data-action=dl-single-question` / `dl-single-exam`，复用同一导出服务。

## 2026-08-09 更新：内容口径与交互
- **综合测试 vs 期末试卷口径（用户澄清）**：综合测试 = 课程内 `type:"quiz"` 小节（`collectQuiz`，存 `loaded.exam`，tab id `exam`）；期末试卷 = 刷题中心 `getExamPapers`（`collectExams`，存 `loaded.final`，tab id `final`）。**综合测试在课程里，不在刷题中心**；期末试卷在刷题中心 `/exams`。二者不同源。
- **文档树形式（用户要求）**：5 个 tab 全部树形。理论/训练题/综合测试 → 课程→模块→叶子（三级）；期末试卷/复习 → 课程→叶子（二级）。默认只展开「课程」级，模块/叶子收起。渲染函数：`buildTree`/`renderTreeCourse`/`renderTreeNode`/`renderLeafRow`。
- **整组勾选**：课程/模块级 checkbox（`dl-toggle-group`，`data-keys` 逗号分隔叶子 key）全选/全不选子叶；部分选中显示「部分」标记；叶子单独勾选保留。
- **数据项分组字段**：`collectTheory`/`collectItemQuestions`/`collectExams`/`collectReview` 均补 `courseId/moduleId`（前端按此分组）。
- **理论计数** `countLabel`：不再只看 `examples.length`；有正文+例题→「N 道例题」、仅正文→「含正文」、空→「无内容」。修复「有内容却显示 0」。
- **导出链路**：`buildQueueHtml`/`exportQueue` 按 `item.type` 分派：theory→`buildTheoryHtml`，training/quiz(综合测试)→`buildQuestionSetHtml`，exam(期末)→`buildExamHtml([item.paper])`，review→`buildReviewHtml`。历史 bug：`filter(it => it.sourceTab || ...)` 会把所有项误判为理论，已改为按 type 精确分派。队列项自包含（含 paper/questions），导出不再依赖 `loaded` 懒加载。
- **`exportSingleExam`** 从 `loaded.final` 找试卷（勿写 `loaded.exam`）。

## 关键坑
- 按钮嵌在 `<a>` 内会误触发链接导航 → 事件委托单点修复：`if (el.tagName==='BUTTON' && el.closest('a[href]')) e.preventDefault()`。
- 路由尾斜杠：`matchRoute` 入口统一去尾斜杠（Cloudflare 会把 `/admin` 重定向为 `/admin/` 失配）。
- 复习导出依赖登录（`state.user.id`），未登录复习 tab 显示空态。
- html2canvas 导出 PDF 是位图分页，非矢量文字；超大集合整份截图可能耗时/内存高。
- 队列项导出时判断类型必须用 `item.type`（theory/training/quiz/exam/review），不要用 `sourceTab`（它恒有值，会误分派）。