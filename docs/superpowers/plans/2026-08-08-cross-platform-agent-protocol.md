# 跨平台智能体规则与共享记忆协议实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 建立“用户级全局规则 + 项目级特化规则 + 平台薄适配器 + 项目共享 Memory”的协议，使多个智能体能遵循同一套规则和记忆写入流程。

**Architecture:** 规则采用由宽到窄的分层加载：用户级规则定义跨项目基线，项目根规则定义项目约束，模块规则只补充局部限制。各平台的私有规则文件只负责加载/注入，不能复制规则正文。项目记忆唯一写入 Memory/，与平台私有工作目录隔离。

**Tech Stack:** Markdown、Git、PowerShell（仅用于校验/适配器检查）、各智能体平台的规则加载设置。

---

## 一、目标、边界与非目标

### 目标

- 让用户级全局规则可在多个项目和多个智能体平台中复用。
- 让每个项目通过根目录 AGENTS.md 增加或覆盖项目专属约束。
- 让项目记忆统一写入项目根目录 Memory/。
- 让平台私有目录只承担适配作用，不成为第二份规则或记忆来源。
- 使规则冲突、并发写入、历史记忆迁移和回滚都有明确流程。

### 非目标

- 不假设任意智能体会自动发现某个文件名。
- 不把机密、令牌、完整环境变量或个人隐私写入规则和记忆。
- 不在第一阶段为每个平台开发复杂的自动 Hook。
- 不删除现有平台私有历史记忆；先保留追溯能力，再逐步提炼迁移。

## 二、最终目录与优先级

### 用户级目录：不提交到项目仓库

Windows 用户级规范源：

    %USERPROFILE%\.agents\
    ├── AGENTS.md             # 用户级规范源
    ├── AGENT.md              # 单数命名兼容入口
    └── CHANGELOG.md          # 全局规则版本变更记录

AGENTS.md 是规范正文。AGENT.md 只写“读取同目录 AGENTS.md”，不得复制正文。

### 项目级目录：提交到项目仓库

    <repo>\
    ├── AGENTS.md                         # 项目规范源
    ├── AGENT.md                          # 单数命名兼容入口
    ├── Memory\                           # 所有平台唯一记忆写入目录
    │   ├── MEMORY.md
    │   ├── PROJECT.md
    │   ├── ARCHITECTURE.md
    │   ├── DECISIONS\
    │   ├── DOMAINS\
    │   ├── LOGS\
    │   ├── ARCHIVE\
    │   └── .locks\
    └── .trae\rules\
        └── 00-agent-protocol.md          # Trae 项目适配入口

### 规则优先级

    宿主平台安全限制与系统规则
    > 用户当前明确指令
    > 模块级 AGENTS.md
    > 项目根 AGENTS.md
    > 用户级 .agents\AGENTS.md
    > 默认行为

合并规则：

- 安全禁令、隐私约束和权限限制取并集，下层规则不得放宽。
- 项目默认值可以覆盖全局默认值，例如语言、测试命令、Memory 路径。
- 模块规则仅能补充本模块的边界、数据约束和验证要求。
- 任何覆盖必须显式声明“覆盖 GLOBAL-xx”，不要依赖自然语言猜测。
- Memory 是事实与索引，不是规则层；它不能覆盖用户、项目或平台规则。

## 三、阶段 0：范围盘点与决策冻结

**目的：** 不在不了解平台加载入口的情况下创建无效规则文件。

**涉及文件：**

- Create: docs/superpowers/decisions/agent-platform-inventory.md
- Read: AGENTS.md, AGENT.md, .trae/rules/, Memory/, .workbuddy/

- [ ] 列出目标平台：Codex、Trae、WorkBuddy，以及未来要接入的平台。
- [ ] 对每个平台确认三件事：用户级规则入口、项目级规则入口、是否支持任务完成 Hook。
- [ ] 记录平台是否会自动发现 AGENTS.md、AGENT.md，还是需要私有适配文件。
- [ ] 为每个平台标记状态：已验证、待验证、不可支持。
- [ ] 确认项目中现有规则和记忆文件的所有者，禁止覆盖用户未提交的改动。
- [ ] 写入 docs/superpowers/decisions/agent-platform-inventory.md，表格字段为：平台、版本、全局入口、项目入口、Hook、验证日期、备注。
- [ ] 验收：任何计划接入的平台都有明确状态；未知能力不能被写成“自动支持”。

**回滚：** 此阶段只创建清单文档，可直接删除该文档，不影响现有平台。

## 四、阶段 1：定义跨平台协议

**目的：** 将规则层级、覆盖语义、记忆语义写成独立于任一平台的协议。

**涉及文件：**

- Create: docs/superpowers/decisions/agent-rule-protocol.md
- Create: %USERPROFILE%/.agents/AGENTS.md
- Create: %USERPROFILE%/.agents/AGENT.md

- [ ] 为协议赋予版本号，例如 protocol_version: 1。
- [ ] 定义稳定章节 ID：GLOBAL-01（优先级）、GLOBAL-02（安全）、GLOBAL-03（规则发现）、MEMORY-01（读取）、MEMORY-02（写入）、MEMORY-03（冲突）、MEMORY-04（敏感信息）。
- [ ] 写入全局 AGENTS.md：仅包含跨项目的协作、安全、验证和记忆提炼规则。
- [ ] 明确全局规则不得指定某个项目的路径、架构、数据模型、命令或 Memory 内容。
- [ ] 写入单数兼容入口 AGENT.md，其正文仅包含规范源的位置和禁止复制的说明。
- [ ] 在 agent-rule-protocol.md 写入覆盖合同：项目规则使用“Overrides: [GLOBAL-xx]”声明替代关系，并说明替代范围。
- [ ] 验收：全局规则脱离任何项目都仍然成立；没有项目专属路径和私人信息。

**全局 AGENT.md 兼容入口示例：**

    # Compatibility entrypoint

    Read the canonical rules in AGENTS.md in this directory.
    Do not maintain a second copy of the rule body.

**回滚：** 删除用户级 .agents 中新建的两个文件即可；项目文件未受影响。

## 五、阶段 2：重构项目级规则

**目的：** 让项目根规则成为该项目的唯一特化层，而不是复制全局正文。

**涉及文件：**

- Modify: AGENTS.md
- Modify: AGENT.md
- Modify: Memory/MEMORY.md

- [ ] 将当前 AGENTS.md 分成两类内容：保留 CourseCore 专属内容；删除与全局规则完全重复的内容。
- [ ] 在 AGENTS.md 文件头声明 scope: project、protocol_version: 1、overrides，并列出覆盖的章节 ID。
- [ ] 在项目规则中明确：所有新项目记忆只写入 Memory/；平台私有目录不能作为新写入目标。
- [ ] 在项目规则中保留 CourseCore 的构建、测试、设计稿、数据和部署约束。
- [ ] 将根 AGENT.md 改成兼容入口，只要求读取同级 AGENTS.md；它不保存项目规则正文。
- [ ] 更新 Memory/MEMORY.md 的“规则加载顺序”，说明先读项目规则，再读 Memory 索引。
- [ ] 验收：根目录只存在一份项目规则正文；从 AGENT.md 和 AGENTS.md 任一入口都能定位到同一正文。

**项目 AGENTS.md 文件头示例：**

    ---
    scope: project
    protocol_version: 1
    overrides: [MEMORY-01, MEMORY-02]
    ---

**回滚：** 从 Git 恢复 AGENTS.md、AGENT.md 和 Memory/MEMORY.md；用户级规则不随项目回滚。

## 六、阶段 3：接入平台薄适配器

**目的：** 让每个平台在自己的规则槽中加载统一协议，而不是复制协议。

**涉及文件：**

- Modify: .trae/rules/00-agent-protocol.md
- Create or modify: 各平台的用户级规则入口
- Create or modify: 各平台的项目级规则入口
- Create: docs/superpowers/decisions/agent-platform-inventory.md（更新验证状态）

- [ ] Codex：确认用户级规则加载路径；在该入口放置一段短适配说明，要求加载 %USERPROFILE%/.agents/AGENTS.md。项目侧保持根 AGENTS.md。
- [ ] Trae：在 Trae 全局规则设置中写入全局薄适配器；在 .trae/rules/00-agent-protocol.md 设置 alwaysApply，并要求读取根 AGENTS.md。
- [ ] WorkBuddy：先根据其文档或设置验证项目规则加载槽；若不支持 AGENTS.md，创建只包含“读取根 AGENTS.md”的适配入口。
- [ ] 其他平台：仅在确认其 Global Instructions 与 Project Instructions 入口后接入，不能猜测目录名。
- [ ] 所有适配器最多包含：协议版本、规范源路径、加载顺序、Memory/ 写入位置、禁止复制正文。
- [ ] 在平台清单中记录一条人工验收结果：该平台回答“规则来源是什么”和“记忆写到哪里”均正确。
- [ ] 验收：平台私有规则不超过约 20 行；不存在第二份完整规则正文。

**适配器最小内容示例：**

    Protocol version: 1
    Read the project root AGENTS.md before starting work.
    Use Memory/ as the only new project-memory write location.
    Do not duplicate or override the canonical rule body here.

**回滚：** 删除或禁用某平台的适配器；不影响其他平台和项目根规则。

## 七、阶段 4：建立共享 Memory 的运行机制

**目的：** 定义所有智能体都可执行的读写、冲突和并发策略。

**涉及文件：**

- Modify: AGENTS.md
- Modify: Memory/MEMORY.md
- Create: Memory/PROJECT.md
- Create: Memory/ARCHITECTURE.md
- Create: Memory/LOGS/2026-08.md
- Create when needed: Memory/DOMAINS/*.md
- Create when needed: Memory/DECISIONS/*.md
- Create when needed: Memory/.locks/<topic>.lock

- [ ] 任务启动：读取项目 AGENTS.md、Memory/MEMORY.md，再按任务关键词读取相关主题文档。
- [ ] 任务完成：基于实际 diff、测试、构建结果和用户确认生成摘要；未经验证的推断不能升级为事实。
- [ ] 将稳定事实写入 PROJECT.md 或 ARCHITECTURE.md；不可静默覆盖的选择写入 DECISIONS；模块知识写入 DOMAINS；时间线写入月度 LOGS。
- [ ] 规定写前重读：写入前重新读取目标文件，发现变化时先合并而不是覆盖。
- [ ] 规定乐观并发：小文件、主题拆分、短索引；锁为可选能力，写前重读为强制能力。
- [ ] 对支持锁的平台，在 Memory/.locks/ 创建主题锁。锁文件必须包含 task_id、owner、created_at、expires_at；有效期为 30 分钟。
- [ ] 无法获得锁或发现冲突时，不修改目标主题文件；把候选摘要写入当月日志，并标记需要合并。
- [ ] 规定敏感信息检查：密钥、令牌、完整环境变量、个人数据不得写入 Memory。
- [ ] 验收：两个不同智能体同时写不同主题不会碰撞；同主题发生冲突时不会静默丢失内容。

**锁文件示例：**

    topic: frontend-conventions
    task_id: task-20260808-001
    owner: platform-agent-name
    created_at: 2026-08-08T12:00:00Z
    expires_at: 2026-08-08T12:30:00Z

**回滚：** 删除过期锁文件；Memory 文档通过 Git 历史恢复。不得用删除整个 Memory 目录的方式回滚。

## 八、阶段 5：迁移历史记忆

**目的：** 将真正可复用的历史知识从平台私有目录提炼到 Memory/，不复制流水账。

**涉及文件：**

- Read: .workbuddy/memory/MEMORY.md
- Read: .workbuddy/memory/*.md
- Create: Memory/DOMAINS/exam-papers.md
- Create: Memory/DOMAINS/practice.md
- Create: Memory/DOMAINS/frontend-conventions.md
- Modify: Memory/MEMORY.md
- Modify: Memory/LOGS/2026-08.md

- [ ] 为历史条目按“稳定事实、决策、领域知识、日志、临时信息”分类。
- [ ] 只迁移有来源、可验证、未来任务可能复用的内容。
- [ ] 将题库解析、考试数据结构和种子流程提炼到 DOMAINS/exam-papers.md。
- [ ] 将刷题模块状态机、复习引擎和会话复用约定提炼到 DOMAINS/practice.md。
- [ ] 将设计稿优先级、路由顺序、JavaScript 验证和图表依赖约定提炼到 DOMAINS/frontend-conventions.md。
- [ ] 每一条迁移内容注明 source、updated、confidence 和 status。
- [ ] 在 Memory/MEMORY.md 增加三个主题索引和最近更新时间。
- [ ] 在 Memory/LOGS/2026-08.md 记录迁移批次、来源范围和未迁移原因。
- [ ] 不删除 .workbuddy/memory/；将其视为只读历史追溯来源。
- [ ] 验收：Memory/ 能独立回答当前项目的关键事实；历史目录不再收到新写入。

**迁移条目示例：**

    id: memory-20260808-route-order
    type: domain
    status: active
    confidence: verified
    source: src/config/routes.js and verified route test
    updated: 2026-08-08
    tags: [frontend, routing]

    静态路由必须位于同前缀动态路由之前，因为匹配器按声明顺序返回第一个命中项。

**回滚：** 删除新增的规范化条目并从 Git 恢复；历史平台目录保持原样。

## 九、阶段 6：自动化与校验

**目的：** 用低风险检查降低规则分叉和错误写入概率；自动 Hook 在基础协议稳定后再启用。

**涉及文件：**

- Create: scripts/check-agent-protocol.ps1
- Create: tests/agent-protocol.test.ps1
- Modify: package.json（仅在决定接入 npm 脚本时）
- Modify: docs/superpowers/decisions/agent-platform-inventory.md

- [ ] 编写 check-agent-protocol.ps1，检查项目根 AGENTS.md、AGENT.md、Memory/MEMORY.md 和 Trae 适配文件是否存在。
- [ ] 检查活跃规则中是否错误指定平台私有目录为记忆写入目标。
- [ ] 检查 AGENT.md 是否包含完整规则正文；若超过约 30 行则失败，防止重复维护。
- [ ] 检查 Memory/MEMORY.md 是否存在并包含项目记忆目录说明。
- [ ] 检查 Memory/ 中是否出现疑似密钥字段名；命中后只报告文件和字段名，不输出值。
- [ ] 编写 tests/agent-protocol.test.ps1，分别构造缺失入口、错误 Memory 路径、重复规则正文和正确结构的临时样例。
- [ ] 先运行测试确认脚本尚未实现时会失败；再实现最小检查并确认通过。
- [ ] 只有确认平台具备可靠完成事件后，才增加“任务完成摘要建议”Hook。Hook 失败时必须降级为提示，不得阻塞交付。
- [ ] 验收：校验脚本能发现错误目录、缺失入口和重复规则；不会读取或打印密钥值。

**回滚：** 删除校验脚本和 npm 入口；规则和 Memory 目录仍可人工维护。

## 十、阶段 7：试运行、发布与维护

**目的：** 先在 CourseCore 上验证，再扩展到其他项目。

**涉及文件：**

- Modify: Memory/LOGS/2026-08.md
- Modify: docs/superpowers/decisions/agent-platform-inventory.md
- Modify: %USERPROFILE%/.agents/CHANGELOG.md

- [ ] 选择两个不同类型任务试运行：一个代码修改任务、一个文档/分析任务。
- [ ] 分别用至少两个平台执行，记录是否读到全局规则、项目规则和正确的 Memory 路径。
- [ ] 检查任务完成后写入是否只产生必要结论，且没有重复或敏感内容。
- [ ] 对冲突写入做一次受控演练：两个任务尝试更新同一主题，验证写前重读和候选日志降级。
- [ ] 将发现的问题归类为：协议问题、平台适配问题、自动化问题、项目规则问题。
- [ ] 修订协议版本并在全局 CHANGELOG.md 中写入变更、日期和兼容性说明。
- [ ] 每月执行一次记忆压缩：将重复日志提炼为主题结论，归档过期条目。
- [ ] 每季度审查一次平台清单，确认规则入口与 Hook 能力没有变化。
- [ ] 验收：两个平台对规则来源和 Memory 路径的回答一致；项目可在没有平台私有记忆的情况下恢复核心上下文。

## 十一、发布顺序与提交建议

建议按以下提交边界实施：

1. docs: add platform inventory and protocol decision
2. chore: add global and project rule hierarchy
3. chore: add platform adapters
4. docs: initialize shared Memory structure
5. docs: migrate durable historical memory
6. test: add protocol validation
7. chore: enable verified platform automation

用户级 %USERPROFILE%/.agents/ 文件不提交到项目仓库。项目 AGENTS.md、AGENT.md、Memory/、项目适配器、协议文档和校验脚本应提交。

## 十二、最终验收清单

- [ ] 用户级 AGENTS.md 不含项目专属信息。
- [ ] 项目 AGENTS.md 明确包含 CourseCore 专属覆盖项。
- [ ] AGENT.md 只作为兼容入口，不复制正文。
- [ ] 每个接入平台都在盘点表中标记为已验证。
- [ ] 所有新项目记忆只写入 Memory/。
- [ ] 平台私有目录没有新的记忆写入。
- [ ] 同主题并发写入不会静默覆盖。
- [ ] Memory/ 不含密钥、令牌、完整环境变量或个人隐私。
- [ ] 校验脚本能发现关键结构错误。
- [ ] 回滚任一阶段不需要删除历史记忆或修改不相关项目文件。

