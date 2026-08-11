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
- 项目稳定事实与全局约束见 `PROJECT.md`。
- 架构、边界和数据流见 `ARCHITECTURE.md`。
- 下载中心与 PDF 导出约定（导出容器/主题/队列/嵌入链接坑）见 `DOMAINS/download-center.md`。
- 试卷题目排序约定见 `DOMAINS/admin-exam-paper-ordering.md`。
- 数学公式与 Markdown 混排约定见 `DOMAINS/math-rendering.md`。
- 刷题中心交卷后错题/记录同步约定（含错题薄弱点总结门槛）见 `DOMAINS/practice-session-sync.md`。
- 错题复习会话加载链路（render/init 时序 + snake_case 归一化 + BFF 答案字段）见 `DOMAINS/review-session-loading.md`。
- 理论正文图/表占位符机制（方案3 content_assets 全局资源库 + [图:asset_id] 替换链路 + 旧 content_figures 兼容）见 `DOMAINS/content-figures.md`。
- 刷题进度跨设备同步链路（只写不读教训 + syncUserData 拉取入口）见 `DOMAINS/progress-sync.md`。
- 错题驱动的今日复习主线与错因标记约定见 `DECISIONS/2026-08-08-wrong-answer-review-mainline.md`。
- 历史平台私有记忆（`.workbuddy/memory/`）仅作迁移/追溯来源，新内容一律写入 Memory/。
- 最近更新：2026-08-11。
