# CourseCore 项目长期记忆索引

本目录是所有智能体平台共用的项目记忆目录，规范来源为项目根目录的 AGENTS.md。

## 目录约定

- PROJECT.md：项目稳定事实与全局约束
- ARCHITECTURE.md：架构、边界和数据流
- DECISIONS/：不可静默覆盖的技术决策
- DOMAINS/：按主题维护的领域知识
- LOGS/：按月的轻量工作日志
- ARCHIVE/：已过期或被替代的内容

## 兼容说明

历史记忆曾保存在某个平台私有目录。它仅作为迁移和追溯来源，新内容不得继续写入该目录。迁移时应先验证、去重，再合并到本目录。

## 当前状态

- 本索引已建立，后续长期记忆统一写入 Memory/。
- 试卷题目排序约定见 `DOMAINS/admin-exam-paper-ordering.md`。
- 数学公式与 Markdown 混排约定见 `DOMAINS/math-rendering.md`。
- 刷题中心交卷后错题/记录同步约定见 `DOMAINS/practice-session-sync.md`。
- 错题驱动的今日复习主线与错因标记约定见 `DECISIONS/2026-08-08-wrong-answer-review-mainline.md`。
- 最近更新：2026-08-08。
