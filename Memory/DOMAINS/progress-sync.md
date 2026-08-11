---
id: memory-20260811-progress-sync-pull
type: domain
status: active
confidence: verified
source: src/state.js; src/main.js; src/services/auth.js; src/services/sync.js; bff/src/routes/user.ts
updated: 2026-08-11
review_after: 2027-02-11
tags: [sync, progress, supabase, auth, cross-device]
---

# 刷题进度同步（只写不读教训）

- 刷题写侧：`state.js` 的 `markQuestion`/`syncItemProgress` 调 `sync.pushAnswer`/`pushItemProgress` 写 Supabase `answers`/`progress` 表。
- 读侧（曾缺失）：`sync.pullProgress`/`mergeAndPushLocal` 定义过但从未被调 → 登录/加载从不拉远程数据，跨浏览器/设备不同步。2026-08-11 已接入。
- 拉取入口：`state.js` 新增 `syncUserData(userId)`（pullProgress → mergeAndPushLocal → 写回 state → saveProgress）；`main.js` init 在 `initAuth` 后先 `syncUserData` 再 `restoreLocation`；`auth.js` 的 `SIGNED_IN` 事件里 `syncUserData` 并派发 `cc-data-change`，`main.js` 监听后 `restoreLocation` 重渲染当前视图。
- 约定：`/me/progress` GET 返回 `{ data: { answers, progress } }`，POST 接收 `{ answer_records, progress_updates }`，与 `mergeAndPushLocal` 期望一致。
- 仍不同步：`state.lastSession`（继续上次）与 theme 仅存 localStorage。