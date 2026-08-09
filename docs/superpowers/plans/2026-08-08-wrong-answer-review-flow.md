# 错题驱动的今日复习 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 让刷题后的每道错题必须填写可多选薄弱点，并把知识库改造成一键开始的今日复习入口。

**Architecture:** 在 wrong_book 增加 reasons TEXT[]；BFF 在判定错误时校验并保存它。答题结束后先展示错因表单，表单全部完成后才写入错题与刷题记录。首页以已排序的未掌握错题队列作为唯一主任务。

**Tech Stack:** Vite 原生 ES modules、Cloudflare Pages Functions（Hono）、Supabase PostgreSQL、Node.js 内置测试。

---

## File structure

- src/services/wrong-reasons.js：六个标签、数组标准化、完成检查与统计。
- bff/src/lib/wrong-reasons.ts：服务端 allow-list 与输入校验。
- scripts/migrations/002-wrong-book-reasons.sql：生产数据库迁移。
- scripts/schema-v2.sql：全新库的规范表结构。
- bff/src/routes/judge.ts、bff/src/routes/user.ts：错因写入与读取。
- src/services/review-engine.js：BFF 传参、回退写入及统计。
- src/views/practice/wrong-reason-summary.js：可复用总结表单。
- src/views/practice/practice-session.js、src/views/practice/review-session.js：会话完成门槛。
- src/views/knowledgeBase.js、src/style.css：今日复习首页。
- tests/wrong-reasons.test.js、tests/wrong-review-flow-contract.test.js：逻辑和流程测试。

functions/api/[[route]].js 是生成文件；只修改 BFF 源码，再使用 npm run build:bff 更新产物。

### Task 1: Define the multi-select wrong-reason contract

**Files:**
- Create: src/services/wrong-reasons.js
- Create: bff/src/lib/wrong-reasons.ts
- Create: tests/wrong-reasons.test.js

- [ ] **Step 1: Write the failing client-domain test**

    import test from 'node:test';
    import assert from 'node:assert/strict';
    import {
      WRONG_REASONS, normaliseReasons, isCompleteReasonSelection, countReasons,
    } from '../src/services/wrong-reasons.js';

    test('each wrong question needs one allowed reason', () => {
      const selections = { q1: ['概念 / 定义没掌握'], q2: [] };
      assert.equal(isCompleteReasonSelection(['q1', 'q2'], selections), false);
      selections.q2 = ['计算过程出错', '审题遗漏条件'];
      assert.equal(isCompleteReasonSelection(['q1', 'q2'], selections), true);
    });
    test('normalization removes duplicates and invalid labels', () => {
      assert.deepEqual(normaliseReasons(['题型不熟', '无效标签', '题型不熟']), ['题型不熟']);
    });
    test('all selections count toward ranking', () => {
      const counts = countReasons([{ reasons: ['题型不熟', '计算过程出错'] }]);
      assert.equal(counts['题型不熟'], 1);
      assert.equal(counts['计算过程出错'], 1);
      assert.equal(WRONG_REASONS.includes('就是错了'), false);
    });

- [ ] **Step 2: Run the test to verify it fails**

Run: node --test tests/wrong-reasons.test.js

Expected: failure because src/services/wrong-reasons.js does not exist.

- [ ] **Step 3: Implement the client and BFF contracts**

Create src/services/wrong-reasons.js with exactly these labels and helpers:

    export const WRONG_REASONS = Object.freeze([
      '概念 / 定义没掌握', '公式 / 定理记不住', '解题方法不会',
      '题型不熟', '计算过程出错', '审题遗漏条件',
    ]);
    export function normaliseReasons(reasons) {
      return [...new Set((Array.isArray(reasons) ? reasons : [])
        .filter((reason) => WRONG_REASONS.includes(reason)))];
    }
    export function isCompleteReasonSelection(questionIds, selections) {
      return questionIds.every((id) => normaliseReasons(selections[id]).length > 0);
    }
    export function countReasons(entries) {
      const counts = Object.fromEntries(WRONG_REASONS.map((reason) => [reason, 0]));
      for (const entry of entries) for (const reason of normaliseReasons(entry.reasons)) counts[reason] += 1;
      return counts;
    }

Create the TypeScript equivalent in bff/src/lib/wrong-reasons.ts. It exports the same labels, type WrongReason, and parseWrongReasons(value, required); it rejects non-arrays, duplicates, non-allow-listed labels, and an empty required array.

- [ ] **Step 4: Verify and commit**

Run: node --test tests/wrong-reasons.test.js && npm --prefix bff run typecheck

Expected: all tests pass and BFF type-check exits 0.

    git add src/services/wrong-reasons.js bff/src/lib/wrong-reasons.ts tests/wrong-reasons.test.js
    git commit -m "feat: define multi-select wrong reasons"

### Task 2: Persist reasons only after the required summary

**Files:**
- Create: scripts/migrations/002-wrong-book-reasons.sql
- Modify: scripts/schema-v2.sql
- Modify: bff/src/routes/judge.ts
- Modify: bff/src/routes/user.ts
- Modify: src/services/review-engine.js
- Modify: src/views/practice/practice-session.js
- Modify: src/views/practice/review-session.js
- Create: src/views/practice/wrong-reason-summary.js
- Modify: src/views/quizSession.js
- Create: tests/wrong-review-flow-contract.test.js

- [ ] **Step 1: Write failing persistence and gate contracts**

    import test from 'node:test';
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    const read = (file) => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

    test('BFF validates selected reasons before incorrect writes', () => {
      assert.match(read('bff/src/routes/judge.ts'), /parseWrongReasons\(reasons, !isCorrect\)/);
      assert.match(read('bff/src/routes/user.ts'), /reasons/);
    });
    test('schema and migration define a multi-select column', () => {
      assert.match(read('scripts/schema-v2.sql'), /reasons\s+TEXT\[\]\s+NOT NULL DEFAULT '\{\}'/);
      assert.match(read('scripts/migrations/002-wrong-book-reasons.sql'), /ADD COLUMN IF NOT EXISTS reasons TEXT\[\]/);
    });
    test('both session flows mount the required summary', () => {
      assert.match(read('src/views/practice/practice-session.js'), /mountWrongReasonSummary/);
      assert.match(read('src/views/practice/review-session.js'), /mountWrongReasonSummary/);
    });

- [ ] **Step 2: Run the test to verify it fails**

Run: node --test tests/wrong-review-flow-contract.test.js

Expected: failure because the migration, validator call, and summary component are absent.

- [ ] **Step 3: Add a safe migration**

Create scripts/migrations/002-wrong-book-reasons.sql:

    BEGIN;
    ALTER TABLE public.wrong_book
      ADD COLUMN IF NOT EXISTS reasons TEXT[] NOT NULL DEFAULT '{}'::TEXT[];
    ALTER TABLE public.wrong_book DROP CONSTRAINT IF EXISTS wrong_book_reasons_allowed;
    ALTER TABLE public.wrong_book ADD CONSTRAINT wrong_book_reasons_allowed CHECK (
      reasons <@ ARRAY[
        '概念 / 定义没掌握', '公式 / 定理记不住', '解题方法不会',
        '题型不熟', '计算过程出错', '审题遗漏条件'
      ]::TEXT[]
    );
    UPDATE public.wrong_book
    SET reasons = CASE reason
      WHEN '概念不清' THEN ARRAY['概念 / 定义没掌握']::TEXT[]
      WHEN '计算失误' THEN ARRAY['计算过程出错']::TEXT[]
      WHEN '审题错误' THEN ARRAY['审题遗漏条件']::TEXT[]
      WHEN '方法不熟' THEN ARRAY['解题方法不会']::TEXT[]
      ELSE reasons
    END
    WHERE cardinality(reasons) = 0;
    COMMIT;

Add the same reasons column and constraint to scripts/schema-v2.sql. Keep the legacy scalar reason column: historical 时间不够 remains unclassified rather than being incorrectly mapped.

- [ ] **Step 4: Update BFF, browser persistence, and the gate**

In judge.ts, destructure reasons, import parseWrongReasons, and after grading use:

    const parsedReasons = parseWrongReasons(reasons, !isCorrect);
    if (parsedReasons === null) {
      return jsonError(c, 400, 'VALIDATION_ERROR', 'valid reasons are required for an incorrect answer');
    }

Put reasons: parsedReasons in only wrong-answer INSERT and PATCH payloads. Correct answers retain prior reasons. In user.ts add reasons to WRONG_BOOK_FIELDS and validate optional reason writes.

Change judgeAnswer and processAnswer to accept a final reasons = [] parameter. Pass normalized reasons to the judge request and to fallbackAddWrong. Replace current single reason statistics with countReasons(entries); only migrate the four unambiguous historical labels shown above.

Implement mountWrongReasonSummary(container, wrongQuestions, onComplete). It renders each wrong question with six toggle chips, maintains aria-pressed, and uses this initially disabled button:

    <button type="button" class="btn-pill wrong-reason-complete" disabled>
      完成总结并生成复习计划
    </button>

Enable only after every wrong question has a selection. In both session modules, defer existing onFinish persistence as follows:

    const wrongQuestions = s.allQuestions.filter((q) => {
      const result = s.results[q.id];
      return result && !result.passed && !result.manual;
    });
    if (wrongQuestions.length === 0) {
      await persistFinishedSession(s, {});
      return;
    }
    mountWrongReasonSummary(container, wrongQuestions, async (selections) => {
      await persistFinishedSession(s, selections);
    });

persistFinishedSession calls processAnswer for every auto-graded question, passes selections[q.id] only for wrong results, then saves the practice record. Preserve wrong_review mode. On failure, leave the tags selected and expose a retry message. Replace the generic summary tip with “请标记每道错题的薄弱点，系统会据此生成复习计划。”

- [ ] **Step 5: Regenerate and verify**

Add “build:bff”: “node scripts/build-bff.js” to root package.json.

Run: node --test tests/wrong-reasons.test.js tests/wrong-review-flow-contract.test.js tests/practice-session-adapter.test.js && npm --prefix bff run typecheck && npm run build:bff

Expected: all tests pass, type-check exits 0, and the Pages function bundle is regenerated.

- [ ] **Step 6: Commit**

    git add scripts/migrations/002-wrong-book-reasons.sql scripts/schema-v2.sql bff/src src/services/review-engine.js src/views/practice src/views/quizSession.js package.json functions/api/[[route]].js tests
    git commit -m "feat: require and persist wrong reasons"

### Task 3: Make today review the one-click knowledge-base action

**Files:**
- Modify: src/views/knowledgeBase.js
- Modify: src/views/practice/review-session.js
- Modify: src/style.css
- Modify: tests/wrong-review-flow-contract.test.js

- [ ] **Step 1: Write failing homepage contracts**

    test('knowledge base starts today review directly', () => {
      const source = read('src/views/knowledgeBase.js');
      assert.match(source, /开始今日复习/);
      assert.match(source, /href="\/kb\/review"/);
      assert.doesNotMatch(source, /selected-count/);
      assert.doesNotMatch(source, /radar-chart/);
    });
    test('review defaults to the ordered wrong queue', () => {
      assert.match(read('src/views/practice/review-session.js'), /entries = await getReviewQueue\(userId\)/);
    });

- [ ] **Step 2: Run the test to verify it fails**

Run: node --test tests/wrong-review-flow-contract.test.js

Expected: failure because current UI requires checkbox selection and renders a radar chart.

- [ ] **Step 3: Implement the task-first page**

In knowledgeBase.js:

1. Remove the top statistic row, selection state, checkbox CTA, radar tabs, and radar rendering.
2. Render a 今日复习 hero with “复习内容来自你刷题时答错的题目”, the non-mastered queue count, and one strong link to /kb/review.
3. Keep course chips below the hero. They filter only the card grid, never the main action.
4. Render entries as grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3. Each card shows title, type, error count, status, and two cause chips plus +N when needed.
5. Render a compact 薄弱点排行 from non-zero descending stats.byReason. Do not use ECharts.
6. On no entries, show “还没有待复习错题，先去刷题建立你的复习计划” with one /practice/exams action.
7. Keep 收藏 below the hero as secondary content.

Use getReviewQueue(userId) for the hero and review session fallback. It is ordered by next_review_at and avoids an empty start action when no item is due.

- [ ] **Step 4: Align review empty state and styling**

Preserve sessionStorage only for a future explicit selected-question entry. Its default must be:

    entries = await getReviewQueue(userId);

Rename visible copy to 今日复习. The empty action is 去刷题 and points to /practice/exams.

Add only local classes near existing knowledge-base styles:

    .today-review-hero {}
    .today-review-grid {}
    .today-review-card {}
    .weakness-ranking {}
    .wrong-reason-summary {}
    .wrong-reason-chip[aria-pressed="true"] {}
    @media (max-width: 640px) { .today-review-grid { grid-template-columns: 1fr; } }

Use existing practice color variables; do not alter global cards, navigation, quiz, or ECharts.

- [ ] **Step 5: Verify and commit**

Run: node --test tests/wrong-review-flow-contract.test.js tests/service-boundary-contract.test.js && npm run build && npm run build:bff && npm --prefix bff run typecheck

Expected: all checks exit 0. Note any pre-existing Vite chunk-size warning separately.

    git add src/views/knowledgeBase.js src/views/practice/review-session.js src/style.css tests/wrong-review-flow-contract.test.js functions/api/[[route]].js
    git commit -m "feat: make today review the knowledge base entry"

### Task 4: Run acceptance and update project memory

**Files:**
- Modify: docs/superpowers/specs/2026-08-08-wrong-answer-review-design.md
- Modify: Memory/LOGS/2026-08.md
- Modify: Memory/DOMAINS/practice-session-sync.md

- [ ] **Step 1: Run the signed-in acceptance flow**

1. Complete a normal session with two automatic wrong answers.
2. Confirm each question allows multiple labels and the completion button stays disabled until every wrong question is labelled.
3. Submit, refresh /kb, and confirm labels persist and appear in the ranking.
4. Confirm /kb has one primary action, no duration estimate, no old metric row, and no radar chart.
5. Click the action and confirm the first non-mastered wrong question opens without prior selection.
6. Confirm course chips filter cards only.
7. Confirm an account with no wrong answers sees the specified empty state and /practice/exams link.

- [ ] **Step 2: Record evidence and commit**

Record actual test/build results in the log and update the sync domain note to state that initial wrong answers are saved after the required summary submission.

    git add docs/superpowers/specs/2026-08-08-wrong-answer-review-design.md Memory/LOGS/2026-08.md Memory/DOMAINS/practice-session-sync.md
    git commit -m "docs: record wrong-answer review verification"

## Plan self-review

- The plan covers the confirmed direct today review, no time estimate, per-question mandatory multi-select labels, compact grid, and ranking replacing the radar chart.
- It does not invent a new review algorithm; it uses the existing ordered non-mastered queue.
- reasons is consistently an array, and the six labels are identical in client and BFF validation.

