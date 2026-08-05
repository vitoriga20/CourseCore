# CourseCore 前端重设计 · 适配实施方案

> 版本：V1.0
> 日期：2026-08-04
> 上游：`coursecore-frontend-redesign-plan.md`（组件级设计计划）+ `frontend-redesign-mockups.html`（设计稿）
> 依据代码：`src/router.js`、`src/config/routes.js`、`src/views/**`、`src/state.js`
> 原则：状态 → 诊断 → 行动；数据化为行动；保留既有路由与 5 tab 骨架，只做视觉与信息层级重排

---

## 〇、设计稿 vs 实际路由 覆盖矩阵（核心结论）

设计稿 `frontend-redesign-mockups.html` 只做了 **6 个页面**，而项目实际有 **24 个路由**。缺口与错位如下：

| 设计稿页面 | 对应实际路由 | 对应视图文件 | 现状 | 缺口 |
| --- | --- | --- | --- | --- |
| page-learn 学习 | `/`（landing learn tab） | `views/landing.js` `renderLearnPanel()` | 课程卡网格 + 学习路径 | **错位**：设计稿是"章节树+理论内容"，实际是"课程卡列表"，需对齐为"学习=理论学习"定位 |
| page-practice 刷题 | `/`（landing practice tab） | `views/landing.js` `renderPracticePanel()` | 4 个写死 0 的统计卡 | 需接真数据（续刷/今日复习/薄弱/趋势） |
| page-summary 总结页 | 练习完成（`/item/:id` quiz、`/practice/quiz`、`/kb/review`） | `views/quizSession.js` `renderResults()` | 得分+正确率+重开 | 需扩展为"成绩→诊断→错题→行动"横向 2 列 |
| page-kb 知识库 | `/kb`（错题库 tab） | `views/knowledgeBase.js` `_renderWrongTabBody()` | 学科切换+队列+雷达 | 需加摘要条+复习进度表 |
| page-wrong 错题闭环 | `/kb`（错题卡） | `views/knowledgeBase.js` `_renderWrongQueue()` | 卡片 3 tag+标题+元信息 | 需加操作行（关联知识点/解析/相似题/标记掌握） |
| page-fav 收藏 | `/kb`（收藏 tab） | `views/knowledgeBase.js` `_renderFavoritesTabBody()` | 4 张 mock 卡 | 需接真数据 |

### 未覆盖路由（设计稿遗漏，需补充方案）

| 路由 | 视图文件 | 交付内容 | 优先级 |
| --- | --- | --- | --- |
| `/course/:courseId` | `views/course.js` | 课程详情：进度 + 认证要求 + 章节树 | P1 |
| `/item/:itemId` | `views/practiceList.js` | 理论页 / 训练 / 测验（含 `renderTheoryExamples`、`renderQuizSession`） | P1 |
| `/bank` | `views/practiceBank.js` | 题库：搜索 + 题型/学科筛选 + 分组题目 | P1 |
| `/question/:qid` | `views/practiceDetail.js` | 单题：题干 + 作答 + 反馈 + 解析 + 考点 | P1 |
| `/exams` | `views/examPapers.js` | 期末试卷列表（按学科分组） | P1 |
| `/exams/:examId` | `views/examDetail.js` | 试卷详情：分节题目列表 | P1 |
| `/exams/:examId/questions/:qid` | `views/practiceDetail.js`（examContext） | 试卷内单题 | P1 |
| `/practice` | `views/practice/index.js` `renderPracticeOverview()` | 刷题概览：指标 + 排行榜 + 最近练习 + 入口 | P1 |
| `/practice/exams` | `views/practice/index.js` `renderPracticeExams()` | 按试卷刷题（学科树 + 试卷预览） | P1 |
| `/practice/types` | `views/practice/index.js` `renderPracticeTypes()` | 按题型刷题（学科树 + 题型预览） | P1 |
| `/practice/quiz` | `views/practice/practice-session.js` | 刷题会话（复用 quizSession 适配层） | P1 |
| `/practice/add` | `views/practice/add-my-paper.js` | 添加我的试卷（三栏选卷弹窗） | P1 |
| `/kb/review` | `views/practice/review-session.js` | 错题复盘会话 | P1 |
| `/community` | `views/practice/index.js` `renderCommunity()` | 社区列表 + 分类筛选 | P2 |
| `/community/:postId` | `views/practice/index.js` `renderCommunityDetail()` | 帖子详情（Markdown + 收藏） | P2 |
| `/community/post` | `views/practice/index.js` `renderPostForm()` | 发帖编辑器 | P2 |
| `/user/records` | `views/practice/index.js` `renderUserRecords()` | 我的刷题记录：统计 + 筛选 + 雷达 | P2 |
| `/user` | `views/user/userPage.js` | 用户中心：资料 + 统计 + 热力图 | P2 |
| `/privacy` `/terms` | `views/legal.js` | 法律页 | P3 |
| `/admin` | `views/admin/adminPage.js` | 管理后台 | P3 |

---

## 一、全局设计系统落地（前置，所有页面共用）

### 1.1 设计变量合并 → `:root`（`src/style.css`）
- 现有双体系：`--fg/--muted/--accent/--success/--warning/--error`（主色）与 `--practice-text/--practice-muted/--practice-accent/--practice-card/--practice-border/--practice-bg`（刷题），**混用**。
- 动作：新增语义变量 `--primary / --primary-2 / --danger / --warn`（对齐设计稿），把 `--practice-*` 全部映射到统一变量，删除 `--practice-*` 使用点。
- **影响面**：`knowledgeBase.js`、`practice/index.js`、`practice-session.js`、`review-session.js`、`add-my-paper.js`、`landing.js` 内联样式。
- **风险**：全局替换触发视觉回归 → 分模块灰度，先加变量再逐文件替换。

### 1.2 组件化原子类（`src/style.css` 新增）
- 对齐设计稿样式：`.chip`（统一色块标签，替代 `.kind-tag/.type-tag/.kp-chip`）、`.status-tag`、`.progress-row`（进度行）、`.stat-tile`（统计小卡）、`.task-card`、`.resume-card`、`.mini-card`、`.empty-state`、`.review-table`、`.wrong-item`、`.fav-card`、`.summary-grid`、`.btn-primary/.btn-ghost/.btn-sm`。
- 把所有 emoji 状态图标（📕📝📄📰⏳🔐📋📚🏆⭐）替换为内联 SVG。

---

## 二、数据层前置（D1–D3）

### D1. `state.lastSession`（继续上次练习）
- `src/state.js` 的 `state`（[L14-L63](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/state.js#L14-L63)）新增字段 `{ itemId, title, lastIndex, total, updatedAt }`；`saveProgress()`（L84）持久化。
- 写入点：`quizSession.js` 完成练习时、`practice-session.js`/`review-session.js` 的 `onFinish` 回调。
- 兼容：`loadProgress()`/`migrateState()`（L79）补默认值。

### D2. 复用现有数据接口
- `review-engine.js`：`getTodayReview`（L207）、`getReviewQueue`（L187）、`getStats`（L227）、`getUserCurve`（L260）、`processAnswer`（L141）、`markRight`（L97）、`removeMastered`（L273）。
- `practice-data.js`：`getExamPapers`、`getSubjects`、`getQuestionTypeStats`、`getQuestionsByType`。
- 薄弱知识点：`getStats().byTag` 取最低 3 项；错误原因：`getStats().byReason`。

### D3. 未登录态
- 所有统计组件在 `!state.user` 时渲染引导（登录/开始练习），**不显示 0**（对齐现 `_renderWrongQueue` L220 的空态模式）。

---

## 三、首页 5 tab 落地（`views/landing.js`）

> 不动 `renderLanding()` 骨架（L123-L164）与 `renderPillNav()`，只改 `renderLandingContent()` 各分支（L112-L121）。

### 3.1 学习 tab（`renderLearnPanel` L8-L43）—— 对齐"学习=理论学习"
- **现状**：课程卡网格 + 学习路径卡。
- **适配**：保留课程卡网格作为"课程入口"；在卡上补"下一步动作"（如"继续第 3 节"），数据源 `state.progress` + `state.lastSession`。学习路径卡按钮改"继续上次"（读 `state.lastSession`）。
- 设计稿 page-learn 的"章节树+理论内容"细节页移植到 `/course/:id` 与 `/item/:id`（见 §4），不在首页平铺，避免首页超载。

### 3.2 刷题 tab（`renderPracticePanel` L59-L84）—— 接真数据
- 替换 4 个写死 0 的统计卡（L62-L79）为设计稿 page-practice 组件树：
  - ResumeCard 继续上次（`state.lastSession`，无记录显示 EmptyState）
  - TodayReviewCard 今日待复习（`getTodayReview`）
  - WeakPointsCard 薄弱知识点（`getStats().byTag` 最低 3）
  - TrendCard 近 7 天正确率（`getQuestionTypeStats`）
  - PaperEntry 我的试卷/按题型入口
- 新增类：`.resume-card`、`.mini-card`、`.progress-row`、`.stat-tile`。

### 3.3 知识库 tab（`renderKBSummaryPanel` L45-L57）
- 单卡改 4 摘要：今日待复习 / 即将遗忘 / 最薄弱 3 章节 / 最近掌握度变化 + 进入按钮。

### 3.4 社区 / 我的 tab（L86-L110）
- 保持单卡+按钮；补真实数据；未实现放 EmptyState。

---

## 四、课程学习链路（`course.js` / `practiceList.js`）—— 设计稿未覆盖，补充

### 4.1 课程详情 `/course/:courseId`（`views/course.js`）
- 保留：进度卡（L57-L63）、认证要求（L65-L75）、章节树（L77-L103）。
- 适配：章节树节点加"状态提示"（已完成/进行中/未开始），对齐设计稿 page-learn 的 `tree-module`/`tree-item` 视觉；模块展开行加"当前进行中"高亮（`state.progress`）。

### 4.2 理论页 `/item/:itemId`（`views/practiceList.js`）
- `renderTheoryPlaceholder`（L38-L53）+ `renderTheoryExamples`（L151-L183）已实现理论+例题。
- 适配：理论正文用设计稿 `.theory-body`/`.theory-formula` 排版（KaTeX 公式）；例题区加"完成 N/N"进度与"做这道题/已完成"标签（对齐 mockup page-learn 的 `ex-card`）。

### 4.3 测验/训练 `/item/:itemId`（`renderQuizSession`）
- 复用 §五 总结页改造，`renderResults` 全局生效（含 `/practice/quiz`、`/kb/review`）。

---

## 五、总结页（`views/quizSession.js` `renderResults` L282-L304）—— 横向 2 列

- 容器 `.quiz-results`（style.css L1136）从整卡改分区，对齐 mockup page-summary：
  - **左列**：`.summary-hero`（得分/正确率/状态标签/较上次变化）+ 错误原因分布（`.progress-row`×5）+ 薄弱知识点（`.chip`）。
  - **右列**：错题列表（题号/标题/原因，来源 `state.results` failed 项）+ 下一步行动（复习错题/查看知识点/练相似题/重新开始）。
- **落库**：`renderResults` 触发前调 `processAnswer` 落错题 + 写 `state.lastSession`（对齐 `practice-session.js` L74-L116 的 `onFinish` 模式）。
- 新增类：`.summary-grid`、`.summary-hero`、`.summary-actions`、`.reason-row`、`.wrong-list`。

---

## 六、知识库改"复习控制台"（`views/knowledgeBase.js`）

### 6.1 错题库 tab（`_renderWrongTabBody` L94-L129）
- 顶部加摘要条（`.stat-tile`×3：今日待复习/即将遗忘/最薄弱掌握度），数据源 `getTodayReview`/`getReviewQueue`/`getStats`。
- 主体改"复习进度表"（`.review-table`，按掌握度升序，章节/掌握度/错题/最近复习/下次复习/复习按钮），替代左栏队列为主视觉；雷达图降级为右侧辅助（`_renderRadar` L280 保留）。
- 保留：学科切换（L180）、雷达 tab（L313）、选批复盘（L269）。

### 6.2 错题卡闭环（`_renderWrongQueue` L216-L257）
- 每卡加操作行（对齐 page-wrong）：关联知识点 / 查看解析 / 练相似题 / 标记已掌握。
- 依赖：题目需带 `tags`/知识点；复用 `markRight`（L97）、`removeMastered`（L273）。
- 错误原因枚举固定：概念不清/计算失误/审题错误/方法不熟/时间不够。

### 6.3 收藏 tab（`_renderFavoritesTabBody` L333-L404）
- 4 张 mock 卡改真数据（新增收藏 service/表）；分类筛选（理论/题目/试卷/文章）接真跳转；emoji 图标改 SVG。

---

## 七、刷题板块（`views/practice/index.js`）—— 设计稿未覆盖，统一变量 + 视觉对齐

- 5 个视图（概览/按试卷/按题型/会话/添加试卷）已在 `index.js` `practice-session.js` `add-my-paper.js` 实现，核心是**变量统一**（`--practice-*` → 语义变量）与卡片视觉对齐。
- 概览 `renderPracticeOverview`（L40-L108）：指标卡 + 排行榜 + 最近练习已接真数据，含大量 emoji（🏆📋📚）改 SVG。
- 按试卷 `renderPracticeExams`（L245）/ 按题型 `renderPracticeTypes`（L415）：学科树 + 预览，视觉对齐 `.card` 体系。
- 会话 `practice-session.js`：`onFinish` 已写错题本+记录，加"成绩→诊断→错题→行动"总结抽离（复用 §五）。
- 添加试卷 `add-my-paper.js`：三栏弹窗保留，统一配色。

---

## 八、试卷链路（`examPapers.js` / `examDetail.js`）

- `/exams` 列表（L20-L47）：保留按学科分组卡片，视觉对齐 `.card`。
- `/exams/:examId` 详情（L7-L35）：分节题目列表，保留 `kind-tag` + 已完成标记。
- 无功能缺口，仅变量统一与视觉对齐。

---

## 九、题库链路（`practiceBank.js` / `practiceDetail.js`）

- `/bank`（`practiceBank.js` L9-L115）：搜索 + 题型/学科筛选 + 分组题目已实现，保留。
- `/question/:qid`（`practiceDetail.js` L16-L66）：单题 + 考点 hydration（`hydrateQuestionKps` L69），保留。
- 无功能缺口，仅视觉对齐。

---

## 十、社区 / 我的 / 复盘（P2）

- 社区三页（`index.js` `renderCommunity` L547 / `renderCommunityDetail` L670 / `renderPostForm` L783）：已实现，emoji 改 SVG，变量统一。
- 我的刷题记录 `/user/records`（`renderUserRecords` L885）：统计 + 筛选 + 雷达已实现，视觉对齐。
- 用户中心 `/user`（`userPage.js` L217）：资料 + 统计 + 热力图已实现，视觉对齐。
- 复盘 `/kb/review`（`review-session.js`）：复用 quizSession 适配层，总结页改造自动生效。

---

## 十一、实施顺序与验收

按"先底座 → 再闭环 → 后补充"：

1. **P0 底座**：§一 设计系统（变量合并 + 原子类）→ §二 数据层（`lastSession`）→ §三 首页 3 tab → §五 总结页。
2. **P1 闭环**：§四 课程链路 → §六 知识库复习控制台 + 错题闭环 → §七 刷题板块。
3. **P2 补充**：§八 试卷 → §九 题库 → §十 社区/我的/复盘。

**验收对照**（设计哲学）：
- [ ] 首页 3 秒内找到继续学习入口。
- [ ] 总结页首屏含成绩 + 诊断 + 行动。
- [ ] 任意错题可跳知识点、看解析、练相似题、标记掌握。
- [ ] 任意知识点可看关联错题与相似题。
- [ ] 状态不单靠颜色/emoji，有文字/图标/按钮。
- [ ] 24 路由全部为统一视觉体系（无 `--practice-*` 残留）。
- [ ] 1280px 以上栅格稳定。
- [ ] 新功能不抢占主任务视觉优先级。

---

## 十二、风险与影响面汇总

- **最大风险**：全局样式重构波及全部视图 → 分模块灰度（先变量，再逐文件替换内联）。
- **数据依赖**：D1 `lastSession` 需新增并做状态迁移；§6.2 需题目 `tags`/知识点字段，评估 `review-engine`/`practice-data` 是否补。
- **双变量体系**：`--practice-*` 与 `--fg/--accent` 混用，需统一映射，避免视觉回归。
- **emoji 依赖**：状态表达逐个替换为 SVG + 文字标签。
- **未登录态**：所有统计组件在未登录时显示引导，不显示 0。
- **设计稿错位**：首页 learn 设计稿"章节树+理论"与现状"课程卡"定位不同，已按"学习=理论学习、刷题=刷题"拆分，细节页下沉到 `/course` `/item`。