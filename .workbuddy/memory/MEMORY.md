# CourseCore 项目长程记忆


## 试卷/MinerU 工作流

- 本项目用 MinerU PDF 解析 (skill: mineru-skill-evolved/scripts/mineru.py, zero deps).
- 高数/线代试卷→题库 md 的转换器: scripts/parse-mineru-to-exams.py
- 带嵌入字体/PUA 的中文数学 PDF 必须用 --ocr (Standard API token 模式), 否则会丢失粗体向量等符号
- 题目结构映射数据库 (Supabase):
  - exam_papers (id/school/college/subject/term/duration)
  - exam_sections (id/exam_id/title/order_index)
  - exam_questions (id/exam_id/section_id/question_type/title/content/options JSONB/answer/answers/blanks/tolerance/unit/solution/hint/test_string/image/difficulty/tags JSONB/source/order_index)
  - question_type: 0=单选 1=多选 2=填空 3=计算/解答/应用 4=证明 5=判断
  - 数据源: src/data/examPapers.js (JS 数组) → scripts/generate-seed-sql.js → scripts/seed/04-exam-papers-*.sql


## 项目约定（必守）

- **设计稿是布局的唯一依据**，实现前必须先精确渲染设计稿看清布局再写代码，不要自由发挥。
  用户原话："如果不按设计图的布局来，那我做设计图的意义在哪里？"
- **路由定义顺序**: `src/config/routes.js` 的 ROUTES 里，静态路径必须排在同前缀动态路径之前
  （`matchRoute` 按 `Object.entries` 顺序遍历，先匹配先赢）。
  例: `/community/post` 必须在 `/community/:postId` 之前，否则发帖页打不开。
- **改完 JS 必须验证**: `node --check <file>`，改动多个文件后跑 `npx vite build`。
  用 Edit 替换长模板字符串块时特别容易留下半截重复代码块。
- **echarts 6.x**: 没有 `DataLabel` 组件导出；label 是内置能力，布局用 `import { LabelLayout } from 'echarts/features'`。


## 刷题板块架构（v1.0 已完成，5 期）

- 视图: `src/views/practice/index.js`（概览/错题库/收藏/按试卷/按题型/社区/记录）
  + `add-my-paper.js`（组卷 Slider）+ `practice-session.js` + `review-session.js` + `quiz-adapter.js`
- 服务: `src/services/review-engine.js`（艾宾浩斯，曲线 经典[1,2,4,7,15] / 紧凑[1,2,4]，重合算法）
  + `src/services/charts.js`（ECharts 绿色主题 #16A34A：radar/line/bar/donut）
- quizSession 复用方式: 给 `createState/getState/initQuizSession` 加可选 `externalQuestions`
  + `handleQuizFinish` 加 `onFinish` 回调（最小侵入，不破坏原有调用）
- 主题变量: `--practice-accent`(#16A34A) `--practice-card` `--practice-border` `--practice-text` `--practice-muted`
- 闭环: 选试卷 → 答题 → processAnswer 写 wrong_book + savePracticeRecord → 错题库 → 复盘 → 掌握度雷达图 → 排行榜
