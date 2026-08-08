> 文档状态：目标设计方案，部分视觉与信息架构已实现；不是当前功能验收清单。
>
> 当前页面状态以 `src/views/` 和 `.trae/documents/prd.md` 为准。

# CourseCore 前端重设计计划（组件级）

> 版本：V2.0
> 日期：2026-08-04
> 依据：`coursecore-design-philosophy.md`
> 原则：状态 → 诊断 → 行动；数据化为行动；保留 5 tab 骨架，只重做卡片
> 约定：每个组件条目给出「挂载点 / 现有类 / 新增类 / 数据源 / 交互」

---

## 〇、核心挂载点（全部改动的锚点）

| 位置 | 文件 | 函数 | 行号 |
| --- | --- | --- | --- |
| 首页内容容器 | `src/main.js` | `refreshLandingContent()` → `#landing-content` | [L170-L176](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/main.js#L170-L176) |
| 首页 tab 分发 | `src/views/landing.js` | `renderLandingContent()` | [L112-L121](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L112-L121) |
| 首页骨架 | `src/views/landing.js` | `renderLanding()` | [L123-L164](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L123-L164) |
| 刷题 tab | `src/views/landing.js` | `renderPracticePanel()` | [L59-L84](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L59-L84) |
| 学习 tab | `src/views/landing.js` | `renderLearnPanel()` | [L8-L43](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L8-L43) |
| 知识库 tab | `src/views/landing.js` | `renderKBSummaryPanel()` | [L45-L57](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L45-L57) |
| 总结页 | `src/views/quizSession.js` | `renderResults()` | [L282-L304](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/quizSession.js#L282-L304) |
| 知识库页 | `src/views/knowledgeBase.js` | `renderKnowledgeBase()` / `_renderWrongTabBody()` | [L46-L89](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L46-L89) / [L94-L129](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L94-L129) |
| 错题卡 | `src/views/knowledgeBase.js` | `_renderWrongQueue()` | [L216-L257](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L216-L257) |
| 收藏 tab | `src/views/knowledgeBase.js` | `_renderFavoritesTabBody()` | [L333-L404](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L333-L404) |
| 刷题题库页 | `src/views/practiceBank.js` | `renderPracticeBank()` | [L38-L115](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/practiceBank.js#L38-L115) |

> 现有可复用组件类（`src/style.css`）：`.card` L111、`.card-hover` L120、`.btn-pill` L84、`.btn-primary` L98、`.btn-ghost` L103、`.progress-bar` L301、`.progress-fill` L308、`.kind-tag` L177、`.type-tag` L165、`.status-dot` L152、`.search-input` L315、`.answer-input` L347、`.quiz-results` L1136、`.quiz-results-score` L1149、`.quiz-results-rate` L1156。

---

## 一、数据层前置（供所有组件使用）

### D1. 新增 `state.lastSession`（继续上次练习）
- **位置**：`src/state.js` 的 `state` 对象（[L14-L63](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/state.js#L14-L63)）新增字段；`saveProgress()`（L84）持久化。
- **结构**：`{ itemId, title, lastIndex, total, updatedAt }`。
- **写入点**：`quizSession.js` 完成练习时（`renderResults` 触发处）与他处结束时。
- **影响**：`loadProgress`/`migrateState` 需兼容旧数据。

### D2. 复习数据接口（已存在，复用）
- `review-engine.getTodayReview(userId)`、`getReviewQueue(userId)`、`getStats(userId)`、`getUserCurve(userId)`。
- `practice-data.getExamPapers()`、`getQuestionTypeStats()`。

### D3. 未登录态
- 所有统计组件在 `!state.user` 时渲染引导（登录/开始练习），**不显示 0**。

---

## 二、全局设计系统（P0）

### C1. 设计变量合并 → `:root`
- **位置**：`src/style.css` 顶部 `:root`。
- **动作**：新增语义变量 `--primary / --accent(紫) / --success / --warning / --danger`；将 `--practice-*` 全部映射/替换为统一变量（`knowledgeBase.js` 与 `style.css` 中 `--practice-*` 使用处）。
- **影响面**：`knowledgeBase.js` 全文件内联样式、`practiceBank.js`、`landing.js` 的 `--practice-accent`。

### C2. 组件化原子类
- **位置**：`src/style.css` 新增。
- **新增类**：`.status-tag`（文字+图标+可选进度）、`.empty-state`（图标+标题+说明+按钮）、`.task-card`（主任务卡）、`.progress-row`（进度行）、`.stat-tile`（统计小卡）、`.chip`（统一 chip，替代 `.kind-tag/.type-tag/.kp-chip` 三套）。
- **动作**：替换 emoji 图标（`knowledgeBase.js` 中 📕📝📄📰⏳🔐📋）为内联 SVG。

---

## 三、首页 5 tab 组件重做（P0）

> 不动 `renderLanding()` 骨架与 `renderPillNav()`；只改 `renderLandingContent()` 各分支模板。

### 3.1 刷题 tab（`renderPracticePanel()`，[L59-L84](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L59-L84)）

**现状**：4 个 `.card` 统计卡写死 0/—（[L62-L79](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L62-L79)）+ 进入按钮（L81）。

**新组件树**（自顶向下，替代现有 4 卡）：

```
┌─ ResumeCard 继续上次练习（主卡，最大视觉）
│   ├─ 标题：试卷名
│   ├─ 进度条：.progress-bar/.progress-fill
│   ├─ 说明：上次做到第 N 题 · 最近时间 · 预计剩余
│   └─ 按钮：.btn-pill .btn-primary [继续刷题]
├─ TodayReviewCard 今日待复习
│   ├─ 数字：N 题
│   └─ 按钮：.btn-ghost [开始复习]→/kb/review
├─ WeakPointsCard 薄弱知识点
│   ├─ 2~3 个 `.progress-row`（知识点名+掌握度条）
│   └─ 按钮：.btn-ghost [去复习]
├─ TrendCard 最近练习趋势（小）
│   └─ 近 7 天正确率 mini 条
└─ PaperEntry 我的试卷/按题型（次级入口，链接列表）
```

- **挂载点**：替换 `renderPracticePanel()` 的 `return` 模板字符串（L60-L83）。
- **数据源**：ResumeCard→`state.lastSession`+`getExamPaper`；TodayReviewCard→`getTodayReview`；WeakPointsCard→`getStats().byTag` 取最低；TrendCard→`getQuestionTypeStats()`。
- **交互**：ResumeCard 无记录时显示"开始第一次刷题"引导（EmptyState），不显示 0。
- **新增类**：`.resume-card`、`.task-card`、`.stat-tile`、`.progress-row`。

### 3.2 学习 tab（`renderLearnPanel()`，[L8-L43](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L8-L43)）

**保留**：课程卡网格（L13-L29）+ 学习路径卡（L31-L40）。
**微调**：
- 课程卡（L17-L27）进度条旁加"下一步动作"文字（如"继续第 3 节"），数据源 `state.progress`。
- 学习路径卡（L32-L40）按钮改"继续上次"（读 `state.lastSession`）。

### 3.3 知识库 tab（`renderKBSummaryPanel()`，[L45-L57](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/landing.js#L45-L57)）

**现状**：单统计卡（L49-L52）+ 进入按钮（L54）。
**新组件树**（替代单卡）：
```
┌─ 今日待复习 N 题
├─ 即将遗忘知识点（来自 getReviewQueue 中 next_review 临近）
├─ 最薄弱 3 章节（getStats().byTag 最低 3）
├─ 最近掌握度变化（mini）
└─ 按钮：.btn-primary [进入知识库]
```
- 数据源：`getTodayReview` / `getReviewQueue` / `getStats`。

### 3.4 社区 / 我的 tab（`renderCommunityPanel` L86 / `renderMePanel` L99）
- 保持单卡+按钮；补真实数据；未实现则放 EmptyState，不显示 0。

---

## 四、总结页四层结构（P0）

**位置**：`quizSession.js` `renderResults()`（[L282-L304](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/quizSession.js#L282-L304)），容器 `.quiz-results`（style.css L1136）。

**现状**：`.quiz-results-score`（正确/总数）+ `.quiz-results-rate`（正确率）+ 重新开始按钮。

**新组件树**（在现有 `.quiz-results` 容器内扩展，从整卡改成分区）：

```
.quiz-results
├─ 表现层
│   ├─ .quiz-results-score（保留，得分）
│   ├─ .quiz-results-rate（保留，正确率 + 动态状态标签：70%基础/82%良好/95%熟练）
│   └─ 较上次变化（+X 或 −X）
├─ 诊断层
│   ├─ 错误原因分布（.progress-row × 5 枚举）
│   └─ 薄弱知识点（.chip）
├─ 错题层
│   └─ 错题列表（题号/标题/原因/状态，复用 .wrong-item 样式）
└─ 行动层
    ├─ .btn-primary [复习错题]
    ├─ .btn-ghost [查看知识点]
    └─ .btn-ghost [练相似题] + [重新开始]
```

- **数据源**：表现层=`state` 当前 session + `lastSession`；诊断层=`getStats`；错题层=当前 session 内 `state.results` 中 failed 项。
- **落库**：`renderResults` 触发前调用 `processAnswer`（[review-engine.js L141](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/services/review-engine.js#L141)）落错题，并写 `state.lastSession`。
- **新增类**：`.quiz-results-section`、`.quiz-results-diag`、`.quiz-results-actions`、`.quiz-results-status`。

---

## 五、知识库改"复习控制台"（P1）

**位置**：`knowledgeBase.js` `_renderWrongTabBody()`（[L94-L129](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L94-L129)）。

**现状**：学科切换（L97）+ 两栏「复习队列(左)/雷达图(右)](L100-L120) + 底部开始复盘（L123-L127）。

**新组件树**：
```
┌─ 摘要条（新增，替代原雷达图为唯一主视觉）
│   ├─ 今日待复习 N 题（.stat-tile）
│   ├─ 即将遗忘知识点（.stat-tile）
│   └─ 最薄弱 3 章节（.stat-tile）
├─ 学科切换器（保留 L97）
├─ 复习进度表（新增，替代左栏队列）
│   └─ 每行：章节名 / 掌握度进度条 / 错题数 / 最近复习 / 下次复习 / 行动按钮
│       （可排序：掌握度升序优先）
└─ 雷达图（降级为辅助，保留 _renderRadar 但放右侧小面积）
```

- **数据源**：`getStats`（需补"掌握度变化/遗忘风险"字段，或本地由 `getReviewQueue` 计算）。
- **保留**：`_renderRadar`（L280）、`_bindRadarTabs`（L313）、学科切换（L180）、选批复盘（L269）。
- **新增类**：`.review-table`、`.review-row`、`.stat-tile`。

---

## 六、错题闭环（P1）

**位置**：`knowledgeBase.js` `_renderWrongQueue()`（[L216-L257](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L216-L257)）的错题卡片模板（L234-L247）。

**现状**：卡片含 题型tag/状态tag/原因tag + 标题 + "错 N 次 · 下次复习"（L238-L244）。

**新组件树**（每张错题卡扩展）：
```
.wrong-item
├─ 头部：题型 .chip + 状态 .status-tag + 原因 .chip
├─ 标题 + 题干摘要
├─ 元信息：错 N 次 · 下次复习
└─ 操作行（新增）
    ├─ [关联知识点] → 跳知识点
    ├─ [查看解析]
    ├─ [练相似题]
    └─ [标记已掌握] → markRight / removeMastered
```

- **数据依赖**：题目需带 `knowledgePointId`；复用 `markRight`（review-engine L97）/ `removeMastered`（L273）。
- **错误原因枚举**固定：概念不清/计算错误/审题错误/方法不熟/时间不足。
- **选项整行可点击**：涉及 `_renderWrongQueue` 卡片与错题复习页选项，明确区分"你的答案/正确答案"。

---

## 七、收藏真实数据（P2）

**位置**：`knowledgeBase.js` `_renderFavoritesTabBody()`（[L333-L404](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/src/views/knowledgeBase.js#L333-L404)）。

**现状**：4 张 mock 卡片（L346-L401），按钮无真实行为。

**动作**：
- 卡片数据源改为真实收藏表（需新增收藏 service/表）。
- 分类筛选（理论/题目/试卷/文章，L336-L341）接真实数据。
- 按钮接真实跳转（继续刷题/阅读）。

---

## 八、其余 P2 差异化

- **AI 解析**：`quiz-solution`（quizSession L197-L209）旁加 AI 生成入口。
- **专项练习**：`practiceBank` 按题型/知识点专项入口。
- **社区收藏**、**成就体系**：作为辅助激励，不抢占主任务视觉。

---

## 九、实施顺序与验收

按"先底座 → 再闭环 → 后差异化"：

1. **P0**：C1/C2 设计系统 → 3.1 刷题 tab 组件树 → 四 总结页四层。
2. **P1**：五 复习控制台 → 六 错题闭环。
3. **P2**：七 收藏真实数据 → 八 差异化。

**验收对照**（设计哲学第十一节）：
- [ ] 首页 3 秒内找到继续学习入口。
- [ ] 总结页首屏含成绩 + 诊断 + 行动。
- [ ] 任意错题可跳知识点。
- [ ] 任意知识点可看关联错题与相似题。
- [ ] 状态不单靠颜色/emoji，有文字/图标/按钮。
- [ ] 1280px 以上栅格稳定。
- [ ] 新功能不抢占主任务视觉优先级。

---

## 十、风险与影响面汇总

- **最大风险**：全局样式重构波及所有视图 → 分模块灰度（先 C1 变量，再逐文件替换内联）。
- **数据依赖**：D1 `lastSession` 需新增并做状态迁移；P1 需 `knowledgePointId` 与遗忘风险字段，评估 `review-engine`/`practice-data` 是否补字段。
- **未登录态**：所有统计组件在未登录时显示引导，不显示 0。
- **双变量体系**：`--practice-*` 与 `--fg/--accent` 混用，需统一映射，避免视觉回归。
- **emoji 依赖**：状态表达逐个替换为 SVG + 文字标签，避免只靠 emoji/颜色。
