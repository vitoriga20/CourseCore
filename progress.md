# 进度日志 - 力学/光学练习PDF接入训练小节

## 2026-07-26

### 已完成

- 读取现有详细计划 `.trae/documents/physics-training-integration-plan.md`。
- 读取关键源码：`labels.js`、`practiceList.js`、`question-builder.js`、`physics-quiz-builder.js`、`quizSession.js`、`package.json`。
- 扫描并确认 13 份练习 PDF 与 2 份综合测试 PDF 的位置。
- 验证 MinerU CLI 可用（version 3.0.4）。
- 确认 `courses.js` 中力学/波动光学小节结构，无 training 小节。
- 创建 `task_plan.md`、`findings.md`、`progress.md`。

### 待执行

- 阶段 1：扩展 `courses.js`、`labels.js`、`practiceList.js`。
- 阶段 2：创建 `builders/training-builder.js` 并更新 `package.json`。
- 阶段 3：运行 `npm run build:training`。
- 阶段 4：运行 `npm run build:data` 与 `npm run build` 验证。
- 阶段 5：同步更新开发文档三件套。

### 阻塞/风险

- 无。等待用户确认开始执行。
