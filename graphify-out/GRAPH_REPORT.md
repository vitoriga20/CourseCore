# Graph Report - .  (2026-07-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 250 nodes · 748 edges · 14 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a708c8e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- router.js
- state.js
- chrome.js
- package.json
- escapeHtml
- validators/index.js
- question-builder.js
- landing.js
- migrate-legacy-data.js
- progress.js
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 34 edges
2. `renderMain()` - 32 edges
3. `initEventDelegation()` - 28 edges
4. `COURSES` - 20 edges
5. `href` - 16 edges
6. `handleSubmitAnswer()` - 13 edges
7. `state` - 13 edges
8. `QUESTIONS` - 12 edges
9. `applyRoute()` - 12 edges
10. `renderPracticeDetail()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `navigateTo()` --calls--> `matchRoute()`  [EXTRACTED]
  src/router.js → src/config/routes.js
- `restoreLocation()` --calls--> `matchRoute()`  [EXTRACTED]
  src/router.js → src/config/routes.js
- `initEventDelegation()` --calls--> `isInternalPath()`  [EXTRACTED]
  src/main.js → src/config/routes.js
- `findNextPracticeItem()` --references--> `COURSES`  [EXTRACTED]
  src/router.js → src/data/courses.js
- `handleNextItem()` --references--> `COURSES`  [EXTRACTED]
  src/router.js → src/data/courses.js

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "router.js"
Cohesion: 0.11
Nodes (58): initBackground(), initGooeyNav(), buildPath(), init(), initEventDelegation(), refreshLandingContent(), renderAppShell(), typeset() (+50 more)

### Community 1 - "state.js"
Cohesion: 0.13
Nodes (32): COURSES, KIND_LABELS, QUESTION_TYPE_LABELS, TYPE_LABELS, QUESTIONS, courseTitle(), getCompletedCount(), getStatus() (+24 more)

### Community 2 - "chrome.js"
Cohesion: 0.14
Nodes (23): __dirname, dist, indexPath, paths, template, compiled, getStaticPaths(), href (+15 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (27): autoprefixer, gray-matter, description, devDependencies, autoprefixer, gray-matter, postcss, tailwindcss (+19 more)

### Community 4 - "escapeHtml"
Cohesion: 0.21
Nodes (9): questionTypes, submitTypes, viewTypes, escapeHtml(), renderCalc(), renderChoice(), renderCode(), renderFill() (+1 more)

### Community 5 - "validators/index.js"
Cohesion: 0.17
Nodes (10): validatorTypes, exactValidator(), validate(), validators, manualValidator(), mixedValidator(), normalizedValidator(), runnerValidator() (+2 more)

### Community 6 - "question-builder.js"
Cohesion: 0.26
Nodes (14): buildQuestion(), __dirname, main(), parseExamMarkdown(), parseOptions(), parseQuestionMarkdown(), parseRepeatedSections(), parseSections() (+6 more)

### Community 7 - "landing.js"
Cohesion: 0.39
Nodes (6): renderGooeyNav(), PLATFORM, renderKBSummaryPanel(), renderLanding(), renderLandingContent(), renderLearnPanel()

### Community 8 - "migrate-legacy-data.js"
Cohesion: 0.36
Nodes (7): __dirname, examToMarkdown(), kindToType, main(), questionToMarkdown(), root, slugify()

### Community 9 - "progress.js"
Cohesion: 0.43
Nodes (7): clearLegacyKeys(), getStoredState(), LEGACY_KEYS, loadPersistedData(), migrateCompletedQuestions(), migrateLegacyState(), storeState()

### Community 10 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

## Knowledge Gaps
- **40 isolated node(s):** `__dirname`, `root`, `questionTypeByName`, `name`, `version` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `escapeHtml()` connect `escapeHtml` to `router.js`, `state.js`, `chrome.js`, `landing.js`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `main()` connect `migrate-legacy-data.js` to `state.js`, `chrome.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `COURSES` connect `state.js` to `router.js`, `chrome.js`, `landing.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `__dirname`, `root`, `questionTypeByName` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `router.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1110523532522475 - nodes in this community are weakly interconnected._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12846068660022147 - nodes in this community are weakly interconnected._
- **Should `chrome.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._