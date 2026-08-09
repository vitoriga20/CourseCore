# 项目稳定事实与全局约束

updated: 2026-08-09

## 项目定位

CourseCore：大学基础课学习平台（高数/线代/大学物理），Vite 重构版。核心闭环：选试卷 → 答题 → 判分 → 错题本 → 复盘 → 掌握度 → 排行榜。

## 技术栈

- 前端：Vite 5 + 原生 JS（ESM）+ Tailwind 3 + ECharts 5 + marked 18 + sortablejs + easymde + html2canvas/jspdf。
- 后端：Cloudflare Pages（前端 SPA）+ BFF Hono（Pages Function 同域 `/api/*`）。
- 数据/身份：Supabase（Postgres + Auth + PostgREST）。
- 构建脚本：`builders/*.js`（question/training/physics-quiz）+ `scripts/fetch-from-supabase.js`。

## 目录职责

- `src/`：前端源码（views/routes/router/services/utils）。
- `bff/`：Hono BFF 源码（`bff/src/*.ts`），业务逻辑只写一份。
- `functions/api/[[route]].js`：Pages Function 打包产物（不手工编辑，`npm run build:bff` 生成）。
- `curriculum/raw/`：课程题库 md 源（exams/questions）。
- `builders/` + `scripts/`：数据构建与迁移工具。
- `Memory/`：项目长期记忆（本目录，规范来源见根 AGENTS.md）。

## 数据模型（Supabase）

- `exam_papers` / `exam_sections` / `exam_questions`：试卷三级结构。
- `question_type`：0=单选 1=多选 2=填空 3=计算/解答 4=证明 5=判断。
- `exam_questions.answer_reveal`：题目级控制答案是否揭示。
- 业务表：`wrong_book`、`practice_records`、`favorites`、`posts`、`post_favorites`、`my_papers`、`leaderboard_view`。
- 题目主键形如 `q-exam-calculus-1-c1-m1-001`；大题关联顺序靠 `-s<大题>-<题号>` 后缀。

## 全局约束（必守）

- 设计稿是布局唯一依据，实现前先精确渲染设计稿；不得凭"应该差不多"自由发挥。
- `src/config/routes.js` 静态路径必须排在同前缀动态路径之前（`matchRoute` 先匹配先赢）。
- 改完 JS 必须 `node --check <file>`；改多文件后跑 `node --test tests/*.test.js` 与 `npm run build`。
- Vite 环境变量须 `VITE_` 前缀，作 Cloudflare Pages「Environment variables」（构建期注入），非 Secrets。
- 前端 Supabase 客户端用 anon key（`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`），service_role 仅存 BFF 服务端。
- BFF 所有内容查询默认裁剪 `answer/answers/solution/test_string`，堵答案泄露。
- echarts 5.x 无 `DataLabel` 导出；label 是内置能力，布局用 `LabelLayout`。
- Git：每 Task 一 commit，前缀 `（Task N）`；记忆变更与对应任务同提交；`.trae/documents/*.md` 杂项变更独立提交。

## 用户偏好（产品/交互）

- 中文交流；回答用 caveman 精简风格；禁 Emoji，可用颜文字。
- 设计走黑白/墨绿高端配色、几何/球形网格背景、反 AI slop、以用户为中心。
- 状态→诊断→行动 的信息优先级；功能=需求输入，排版=创意输出。
- 前端偏好深灰输入框 + 墨绿 focus 光晕；管理员后台全屏模式。