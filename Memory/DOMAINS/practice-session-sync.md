---
id: memory-20260808-practice-session-finish-sync
type: domain
status: active
confidence: verified
source: src/views/practice/quiz-adapter.js; tests/practice-session-adapter.test.js
updated: 2026-08-08
review_after: 2027-02-08
tags: [practice, quiz-session, wrong-book, sync]
---

# 刷题会话完成回调

- 刷题中心通过 `initQuizAdapter()` 初始化 `quizSession`，调用方依赖其返回的状态对象来设置 `onFinish`。
- `onFinish` 负责在交卷后写入错题本和刷题记录；适配器必须直接返回 `initQuizSession()` 的返回值。
- 回归测试：`node --test tests/practice-session-adapter.test.js`。

## Wrong-answer reason summary (2026-08-08)

- Both normal practice and wrong-answer review defer wrong-book persistence when a session contains wrong answers until `wrong-reason-summary.js` records at least one of the six allowed reasons for every wrong question.
- Correct-only sessions persist immediately; success actions render only after the practice record and wrong-book writes complete.
- The client normalizes reason arrays before writes, while the BFF validates the same frozen six-label catalog and keeps legacy scalar reasons as a read fallback.
- Verification: `node --test tests/*.test.js`, `npm --prefix bff run typecheck`, `npm run build:bff`, and `npm run build`.
