---
id: memory-20260810-review-session-loading
type: domain
status: active
confidence: verified
source: src/views/practice/review-session.js; src/views/practice/quiz-adapter.js; src/router.js; functions/api/[[route]].js
updated: 2026-08-10
review_after: 2027-02-10
tags: [knowledge-base, review, wrong-book, init, normalization]
---

# 错题复习会话的加载链路

- 视图渲染约定：render 函数只返回 HTML，init 必须在 `main.innerHTML = renderXxx()` 之后单独调用（参考 `practice-session` 的 `renderPracticeSession` + `initPracticeSession`）。若在 render 内部同步 init，会先于 DOM 写入执行，`getElementById` 拿到 null → 早退 → 界面永远停在初始加载态。现象即"加载复盘题目中..."卡死。
- wrong_book 联表返回的 questions 是 Supabase 原始 snake_case（`question_type`），而 `quizSession`/`renderQuestion` 读 camelCase（`questionType`）。进入刷题会话前必须在 `quiz-adapter.js` 统一转换，否则报 `No renderer for view type "undefined"`。
- BFF `/me/wrong-book` 的 questions select 必须包含 `answer,answers,solution`，否则复习"查看答案"无内容。
- 验证：`npm run build`。