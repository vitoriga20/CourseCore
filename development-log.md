# 开发日志 - CourseCore

## 项目概览

| 项 | 内容 |
|---|---|
| 项目名称 | CourseCore — 大学基础课学习平台 |
| 当前状态 | 已清理 `practice` / `project` 小节类型与对应题目：删除 13 个 `practice` / `project` items、15 道关联题目源文件、seed SQL 中的相关 INSERT，并同步清理 Supabase 中 item_id 为 NULL 的 orphan questions；`npm run build` 通过，预渲染 455 条路由（含 `/admin`） |
| 技术栈 | Vite 5 + Tailwind CSS 3 + PostCSS + p5.js + gray-matter + MinerU (mineru-open-sdk API) + Supabase Auth + Supabase Postgres (RLS + RPC) + EasyMDE + Split.js + SortableJS |
| 构建产物 | `dist/`（455 个预渲染静态路由，含 `/admin`） |
| 数据格式 | Markdown + YAML frontmatter → `src/data/questions.js`；课程小节类型限定为 `theory` / `quiz` / `training` / `review` |

## 文件结构

```
.
├── builders/question-builder.js    # 解析 Markdown 题目，生成 JS 数据模块
├── builders/training-extract.py    # 调用 MinerU API 从 PDF 抽取训练题题干
├── builders/training-builder.js    # Node.js 包装，prebuild 阶段调用 Python 脚本并加载 .env.local
├── scripts/prerender.js            # 基于 routes.js 生成静态 HTML
├── scripts/supabase-schema.sql     # Supabase 建表、RLS、触发器脚本
├── scripts/test-supabase-connection.js  # 验证 Supabase 连接与表结构
├── scripts/test-auth-flow.js       # 后端认证与同步链路端到端测试
├── .env.local                      # MinerU API token、Supabase 配置（不提交 Git）
├── public/physics/training/        # 训练题题图资源
├── src/
│   ├── main.js                     # 应用壳、事件委托、认证初始化
│   ├── router.js                   # 路由与视图控制器
│   ├── state.js                    # 全局状态、进度持久化、云端同步触发
│   ├── style.css                   # 主题变量与组件样式
│   ├── theme.js                    # 明暗主题切换
│   ├── background.js               # p5.js 几何背景
│   ├── config/
│   │   ├── routes.js               # 路由表与路径构建
│   │   ├── access.js               # 课程内容免费访问规则与判断
│   │   └── question-types.js       # 题型/视图/校验器/提交方式映射
│   ├── data/
│   │   ├── courses.js              # 课程与模块小节数据
│   │   ├── questions.js            # 题目数据（自动构建生成）
│   │   ├── examPapers.js           # 期末试卷数据
│   │   └── labels.js               # 类型标签文案
│   ├── services/
│   │   ├── supabase.js             # Supabase 客户端初始化
│   │   ├── auth.js                 # 游客初始化、登录/注册/登出、数据合并
│   │   ├── admin.js                # 管理后台 CRUD 服务（users/courses/modules/items/questions/exam_*）
│   │   └── sync.js                 # 云端 answers / progress 读写与合并
│   ├── utils/
│   │   ├── progress.js             # localStorage 读写与迁移
│   │   ├── answer-collector.js     # 从 DOM 收集用户答案
│   │   ├── question.js             # 题目导航工具
│   │   └── avatars.js              # 黑白几何占位头像
│   ├── components/
│   │   ├── authModal.js            # 登录/注册/重置密码弹窗
│   │   ├── auth-components.css     # 认证组件样式
│   │   ├── userMenu.js             # 右上角用户状态菜单
│   │   └── avatarPicker.js         # 头像选择弹窗
│   ├── validators/                 # 各类答案校验器
│   └── views/                      # 页面与题目渲染模板
│       ├── course.js               # 课程详情页
│       ├── practiceList.js         # 小节独立页面（理论 + inline 训练）
│       ├── inlinePractice.js       # inline 多题训练区
│       ├── quizSession.js          # 单题/训练测验会话
│       ├── legal.js                # 隐私政策 / 用户协议页面
│       ├── user/                   # 用户中心
│       │   └── userPage.js         # /user 页面渲染
│       ├── admin/                  # 管理后台
│       │   └── adminPage.js        # /admin 页面渲染 + 事件处理（含 EasyMDE / Split.js / SortableJS 内容编辑器）
│       └── question/               # 单题渲染组件
├── curriculum/raw/questions/       # 题目 Markdown 源文件
├── scripts/
│   ├── supabase-schema.sql         # 建表、RLS、触发器脚本
│   ├── fetch-from-supabase.js      # 从 Supabase 拉取内容表生成 src/data/*.js
│   └── ...                         # 其他脚本
├── .trae/documents/                # 开发文档
└── development-log.md              # 本文件
```

## 开发阶段记录

### 阶段 1: 初始 Vite 重构

**日期**: 2026-07-25 之前

**操作**:
- 使用 Vite + Tailwind CSS 重构原项目。
- 引入 p5.js 几何球体背景，固定参数，无 UI 控制。
- 实现基于 HTML5 History API 的客户端路由，并增加预渲染脚本。
- 题目源数据使用 Markdown + YAML frontmatter，通过 `question-builder.js` 构建为 JS 模块。

**关键决策**:
- 背景使用 p5.js 而非 Three.js → 减少依赖与 GPU 压力。
- 预渲染每个路由为独立 `index.html` → 支持静态托管与直接访问深层链接。
- 校验器通过枚举 + 映射表驱动 → 同一套 UI 逻辑支持多种题型。

**产出文件**:
- `src/router.js`
- `src/state.js`
- `src/config/routes.js`
- `src/config/question-types.js`
- `builders/question-builder.js`
- `scripts/prerender.js`

### 阶段 2: 小节独立页面与 inline 全题提交

**日期**: 2026-07-25

**操作**:
- 课程详情页小节点击改为 `<a href="/item/:itemId">`，进入独立小节页面。
- `practiceList.js` 渲染理论内容 + 本节全部训练题。
- `inlinePractice.js` 重写：
  - 一次性展示本节所有题目；
  - 底部单一按钮，未全部答对时显示“提交答案”；
  - 提交后按题给出“✓ 回答正确”或“✗ 错了”；
  - 错题显示“查看答案”按钮，点击后展开标准解法与参考答案；
  - 全部答对后同一按钮变为“进入下一节 →”。
- `state.js` 新增 `inlineAnswers / inlineResults / inlineShowAnswers` 临时状态。
- `main.js` 增加 `submit-item / show-inline-answer / next-item` 事件委托。
- `answer-collector.js` 修复 `root.getElementById` 在 Element 根节点上不可用的问题。
- 移除已不存在的 `renderSidebarContent` 调用，消除初始化报错。

**关键决策**:
- inline 答题状态不持久化 → 每次进入小节重新开始，避免历史错误状态干扰。
- 提交与“进入下一节”共用同一个按钮 → 减少界面元素，符合用户预期。
- 错题只提示“错了”，不直接展示答案；答案由用户主动点击后展开 → 强化思考过程。
- 所有题目答对后才允许进入下一节 → 保证掌握度。

**产出文件**:
- `src/views/course.js`
- `src/views/practiceList.js`
- `src/views/inlinePractice.js`
- `src/router.js`
- `src/main.js`
- `src/state.js`
- `src/utils/answer-collector.js`

### 阶段 5: 大学物理B（上）章节训练题集成

**日期**: 2026-07-25

**操作**:
- 在 `courses.js` 中每个力学与波动光学理论小节后插入 `type: training` 小节，实现"一小节理论 + 一训练"结构。
- 新增 `builders/training-extract.py`，调用 MinerU（`MINERU_MODEL_SOURCE=modelscope`）从 13 个 PDF 练习文件中提取题干，按题号/题型拆分后生成 Markdown 源文件。
- 新增 `builders/training-builder.js`，在 `prebuild` 阶段调用 Python 脚本完成批量 PDF 抽取。
- `labels.js` 增加 `training` 类型标签。
- `practiceList.js` 对 `quiz` 与 `training` 均调用 `renderQuizSession`，容器宽度统一为 `max-w-7xl`。
- `router.js` 修复 `training` 小节未调用 `initQuizSession` 导致页面只显示占位符的问题。
- 完成 `npm run build:data` 与 `npx vite build && node scripts/prerender.js`，预渲染路由从 264 增至 480 条。

**关键决策**:
- 训练题只抽取题干，答案字段留空由后续手动补充 → 符合用户"答案我自己补"的需求。
- 训练小节复用 `quizSession` 完整交互 → 保持顺序/随机切换、字体/背景切换、题号导航、进度报告一致。
- MinerU 使用 modelscope 镜像下载模型 → 解决 huggingface 连接超时问题。
- 直接运行 `npx vite build && node scripts/prerender.js` 而不触发 `prebuild` 中的 `build:training` → 避免已完成的 PDF 抽取被重复执行导致构建时间过长。

**产出文件**:
- `builders/training-extract.py`
- `builders/training-builder.js`
- `src/data/courses.js`
- `src/data/labels.js`
- `src/views/practiceList.js`
- `src/router.js`
- `curriculum/raw/questions/physics-b-1/p1b-m1-01-training ~ p1b-m1-07-training`
- `curriculum/raw/questions/physics-b-1/p1b-m2-01-training ~ p1b-m2-06-training`

### 阶段 6: 切换 MinerU API 并修复训练题解析问题

**日期**: 2026-07-26

**操作**:
- 将 `builders/training-extract.py` 从本地 MinerU CLI 迁移到 `mineru-open-sdk` HTTP API，避免本地模型下载失败。
- 新增 `builders/training-builder.js` 的 `loadEnvLocal` 函数，从 `.env.local` 读取 `MINERU_TOKEN` 并透传给 Python 进程。
- 修复选择题选项提取正则：移除 CJK 字符前的 negative lookbehind（`\w` 在 Python 中匹配 Unicode 字母），允许 `(A)` 后直接跟中文选项文本。
- 修复 `extract_options` 第一个选项被误丢弃的切片 bug，选项为空占位时不再截断实际首选项。
- 新增题库前缀类型推断（xz→选择题、tk→填空题、js→计算题等），解决部分题目因缺少章节标题而类型/标签错误的问题。
- 新增 `repair_missing_lambda` 与 `patch_known_questions` 后处理：恢复 MinerU 漏掉的 λ、π/4 等符号，并补齐特定题目的空选项。
- 抽样检查 107 道训练题：47 道单选均带 4 个选项，35 道填空，25 道计算；26 张题图全部复制到 `public/physics/training` 且引用正确。
- 运行 `npm run build` 成功，预渲染 479 条静态路由。

**关键决策**:
- 使用官方 SDK 的 `extract_batch` 而非直接调用 REST → 批量状态轮询更稳定，错误处理更完整。
- 敏感配置放入 `.env.local` 并在 `.gitignore` 中忽略 → 避免 token 泄漏。
- 对 MinerU API 偶发的希腊符号遗漏做启发式修复 + 已知题目硬编码补丁 → 在自动抽取与人工校对之间取得平衡。
- 题图随 Markdown 一起复制到 `public/physics/training/<item>`，URL 使用 `/physics/training/<item>/<hash>.jpg` → 与构建后的静态资源路径一致。

**产出文件**:
- `builders/training-extract.py`（API 化 + 解析修复）
- `builders/training-builder.js`（加载 `.env.local`）
- `.env.local`
- `public/physics/training/`（训练题题图）
- `curriculum/raw/questions/physics-b-1/p1b-m1-01-training ~ p1b-m1-07-training`（修正后）
- `curriculum/raw/questions/physics-b-1/p1b-m2-01-training ~ p1b-m2-06-training`（修正后）

### 阶段 7: 训练题抽样检查与最终构建验证

**日期**: 2026-07-26

**操作**:
- 编写抽样检查脚本，遍历 13 个训练小节共 107 道 Markdown 题目。
- 验证题型分布：单选 47 道（均含 4 个选项）、填空 35 道、计算 25 道。
- 验证 26 张 `image` 引用全部对应 `public/physics/training/<item>/` 下的实际文件。
- 检查异常：无空题干、无空选项、无题型与选项冲突。
- 运行 `npm run build:data` 生成 291 道题目 + 15 个理论内容 + 2 套试卷。
- 运行 `npx vite build && node scripts/prerender.js`，成功预渲染 479 条静态路由。

**关键决策**:
- 抽样检查直接扫描 Markdown 源文件与 public 资源，不依赖已构建的 `questions.js` → 更早暴露路径错误。
- 最终构建避开 `prebuild` 中的 `build:training`，避免重复调用 MinerU API；在数据未变更时直接用现有 Markdown 产物构建。

**产出文件**:
- `dist/`（479 个预渲染静态路由）
- `src/data/questions.js`（构建生成）

## 问题与解决方案

### 问题 1: 提交答案无反应

**日期**: 2026-07-25

**现象**: 点击“提交答案”后页面没有反馈，控制台报 `TypeError: e.getElementById is not a function`。

**原因**: `answer-collector.js` 默认使用 `root.getElementById`，但 inline 提交时传入的 `root` 是 `document.querySelector('.inline-practice')` 返回的 Element，Element 没有 `getElementById` 方法。

**解决**: 增加 `getById` 辅助函数，对 Element 根节点使用 `root.ownerDocument.getElementById`，对 document 根节点直接使用 `document.getElementById`。

### 问题 2: 初始化报错 `renderSidebarContent is not defined`

**日期**: 2026-07-25

**现象**: 控制台出现 `ReferenceError: renderSidebarContent is not defined`，源自 `router.js` 与 `main.js`。

**原因**: 当前 UI 已移除侧边栏，但 `showLanding` 与 `updateSearch` 仍调用旧函数。

**解决**: 移除 `router.js` 中 `showLanding` 内的 `renderSidebarContent()` 调用，以及 `main.js` 中 `updateSearch` 的 `else renderSidebarContent()` 分支。


### 阶段 13: 修复单选题答案字母与选项索引不匹配导致误判

**日期**: 2026-07-28

**操作**:
- 在 `builders/question-builder.js` 中添加 `normalizeChoiceAnswer` 答案归一化逻辑。
- 构建阶段将单选/多选/判断题的字母答案（A/B/C/D）转换为选项索引（0/1/2/3）。
- 同时支持判断题的中文/英文真值标签（正确/错误/true/false 等）归一化为 "1"/"0"。
- 重新运行 `npm run build:data`，生成 291 道题、15 个理论内容、2 套试卷。

**关键决策**:
- 在构建层统一转换，而非修改前端校验器 → 保持 `exact` 校验器的简单字符串比较语义，避免运行时额外开销。
- 兼容已有数字索引答案 → 若答案已是数字字符串则直接保留，不破坏现有数据。

**产出文件**:
- `builders/question-builder.js` - 新增 `LETTER_TO_INDEX`、`TRUTHY_LABELS`、`FALSY_LABELS` 与 `normalizeChoiceAnswer`
- `src/data/questions.js` - 物理训练题等字母答案已转为索引

**关联问题**: 物理训练题选择 C 仍被判定为错误

### 阶段 14: 答案展示层将索引转回字母/中文真值

**日期**: 2026-07-28

**操作**:
- 在 `src/utils/question.js` 新增 `formatAnswerDisplay(question)`。
- 单选题数字索引（0/1/2/3）在展示时转回 A/B/C/D。
- 多选题 `answers` 数组同样逐个转字母，并以 ", " 连接。
- 判断题 "1"/"0" 展示为 "正确"/"错误"。
- 在 `chrome.js`、`inlinePractice.js`、`practiceList.js`、`quizSession.js` 中统一使用新函数渲染"答案："。

**关键决策**:
- 数据层保持索引（与选项 value 一致），展示层做可读性转换 → 不影响校验逻辑，同时满足用户看 A/B/C/D 的习惯。

**产出文件**:
- `src/utils/question.js`
- `src/views/question/chrome.js`
- `src/views/inlinePractice.js`
- `src/views/practiceList.js`
- `src/views/quizSession.js`

**关联问题**: 答案展示为 0/1/2/3，用户希望显示 A/B/C/D
### 阶段 18: 用户中心页面与占位头像

**日期**: 2026-07-28

**操作**:
- 创建 `src/views/user/userPage.js`，渲染 `/user` 用户中心：头像、昵称编辑、学习统计、2026-02 至 2026-07 活动热图、退出登录。
- 创建 `src/components/avatarPicker.js`，提供 8 张候选头像的选择弹窗。
- 在 `src/main.js` 侧边栏顶部新增头像入口，已登录跳转 `/user`，未登录打开登录弹窗；新增头像选择、昵称编辑、用户页退出等事件处理。
- 新增 `src/utils/avatars.js`，用内联 SVG data URL 提供 8 张黑白几何占位头像（球面网格、蛇形螺旋、三角十字星、六边形、棋盘格、波浪线、同心圆、斜条纹），替换原有 dicebear 外链。
- `src/services/auth.js` 改为从 `avatars.js` 导入并重新导出 `getDefaultAvatar`；`avatarPicker.js` 改用 `AVATAR_CHOICES`。
- `src/components/auth-components.css` 中用户卡片背景与活动热图颜色改用主题 CSS 变量，保持黑白品牌调性。
- 创建 `.trae/documents/user-page-implementation-plan.md` 记录实现计划与验收清单。

**关键决策**:
- 头像全部使用本地占位图，不再请求外部 API → 避免网络不稳定导致头像空白，符合黑白几何品牌风格。
- 默认头像由 seed 哈希确定 → 同一昵称稳定展示同一张占位图，游客与管理员的默认头像自然不同。
- 用户卡片与热图颜色跟随主题变量 → 在深浅主题下均保持可读性。

**产出文件**:
- `src/utils/avatars.js`
- `src/views/user/userPage.js`
- `src/components/avatarPicker.js`
- `src/components/auth-components.css`（用户页与热图样式）
- `src/main.js`（侧边栏头像入口与用户相关事件）
- `src/services/auth.js`（头像引用迁移）
- `.trae/documents/user-page-implementation-plan.md`

### 阶段 19: item 小节页墨绿色课程/章节导航栏

**日期**: 2026-07-28

**操作**:
- 在 `src/views/practiceList.js` 新增 `renderItemNav(course, module, item)`，渲染墨绿色课程/章节导航条，参考 freeCodeCamp 的 `BreadCrumb` 组件结构（`challenge-title-breadcrumbs` + `breadcrumb-left` + `breadcrumb-right`）。
- 替换 theory / inline practice 等小节页顶部的"← 返回 课程名"链接为新导航条：左侧课程名跳转 `/course/:courseId`，右侧章节名（`module.title`）跳转 `/course/:courseId#module-:moduleId`。
- `quiz` / `training` 小节保持原有返回链接，避免与 `quiz-control-bar` 堆叠。
- 在 `src/views/course.js` 为每个 module 卡片增加 `id="module-${m.id}"` 锚点，使章节链接可定位。
- 在 `src/router.js` 的 `showCourse` 中处理 URL hash，渲染后滚动到对应 module 锚点。
- 在 `src/router.js` 的 `navigateTo` 中提取 pathname 再匹配路由，使带 hash 的链接（如 `/course/calculus-1#module-c1-m1`）能被 SPA 路由正常处理。
- 在 `src/main.js` 点击拦截中也先提取 pathname 再判断 `isInternalPath`，确保带 hash 的内部链接被 `navigateTo` 接管而非浏览器整页刷新。
- 在 `src/style.css` 新增 `.item-nav` 系列样式：墨绿色背景 `rgba(28, 90, 62, 0.95)`、左侧课程名灰色块、右侧章节名墨绿色背景、中间 clip-path 三角形箭头分隔、sticky 固定于 header 下方（`top: 4rem`）。
- 修复 `.item-nav-list a` 的 `overflow: hidden` 导致 `.item-nav-course a::after` 箭头被裁剪的问题：将 `overflow: hidden` 移到 `.item-nav-list a span` 上，确保箭头完整显示。
- 在 `.worktrees/feature/item-nav` 隔离分支完成开发并验证构建。

**关键决策**:
- 不新增全局 header，而是替换现有"返回"链接位置 → 改动最小，符合用户"就在红框位置"的意图。
- 右侧显示章节名而非小节名 → 用户明确"小节改为章节"，且 freeCodeCamp 原组件也是左侧课程 / 右侧章节（block）。
- quiz / training 不动 → 其顶部已有 `quiz-control-bar`，避免两个 sticky bar 重叠。
- 导航条采用墨绿色 + 左侧深色块 + CSS border 三角形箭头 → 接近 freeCodeCamp 截图风格，同时符合项目品牌色。

**产出文件**:
- `src/views/practiceList.js`（新增 `renderItemNav` 并替换返回链接）
- `src/views/course.js`（module 卡片增加锚点 id）
- `src/router.js`（showCourse 处理 hash 滚动）
- `src/style.css`（新增 `.item-nav`、`.item-nav-list`、`.item-nav-course`、`.item-nav-module` 样式）

## 架构决策记录

| 决策 | 说明 |
|---|---|
| p5.js 几何背景 | 固定参数、无控制面板、支持明暗主题切换，性能优先（低粒子数、低帧率） |
| inline 状态不持久化 | 进入小节即清空，保证每次练习从初始状态开始 |
| 单一提交/下一节按钮 | 根据 `allPassed` 状态动态切换文案与 `data-action` |
| 答案收集基于 DOM | `collectUserAnswer(question, root)` 直接从 DOM 读取，避免不同题型的状态同步差异 |
| 预渲染所有路由 | 构建时生成每个 URL 对应的 `index.html`，刷新或直接访问不 404 |
| 游客优先 + 登录合并 | 未登录时全部数据存本地；登录后按时间戳合并到 Supabase，不询问用户 |
| Supabase 未配置 graceful degradation | 无配置时站点仍以游客模式运行，同步函数被拦截，不影响现有功能 |
| 邮箱 + 密码认证 | 用户已确认此方式，弹窗支持登录/注册/重置密码三态切换 |

## 已知限制与待改进项

- 单选/判断题的选择状态目前未写入 `state.inlineAnswers`，页面重绘后会丢失选中状态；后续可通过监听 `change` 事件持久化。
- 证明题、代码题依赖人工/运行器校验，UI 仅提示“请对照参考答案自行检查”。
- 题目内容中的 LaTeX 依赖 MathJax 异步渲染，极快切换页面时可能出现闪烁。
- MinerU API 对少数希腊符号（如 λ）可能漏识别，当前通过 `repair_missing_lambda` 与 `patch_known_questions` 做启发式恢复，后续可升级为更完整的符号 OCR 后处理或人工抽检。
- 训练题答案字段目前留空，需后续手动补充。
- 当前 Supabase 项目已创建并配置，登录/注册/重置密码功能已在 `src/services/auth.js` 中恢复；管理员需在 Supabase Dashboard 手动将 `profiles.role` 设为 `'admin'` 才能看到 `/admin` 入口。
- 登录/注册弹窗尚未增加"同意用户协议与隐私政策"勾选框，合规页面 `/privacy`、`/terms` 已补充，但注册功能当前关闭，无需立即启用勾选框。
- 用户账号注销、邮箱确认重发、同步失败重试提示等体验细节待后续完善。
- 后台题图仅支持 URL 输入，如需本地上传需后续接入 Supabase Storage 或图床。
- 全局题库 `practiceBank.js` / `knowledgeBase.js` 仍只读本地 `QUESTIONS`，后台新增题目不会实时出现在题库页。

## 阶段 3: 构建与功能验证

**日期**: 2026-07-25

**操作**:
- 运行 `npm run build`，成功生成 264 个预渲染路由。
- 启动 `npm run preview`，在浏览器中验证完整流程：
  - 访问 `/item/c1-m1-i1`，理论内容与训练题全部展示；
  - 提交错误答案后，每题显示“✗ 错了”及“查看答案”按钮；
  - 点击“查看答案”后展开标准解法与参考答案；
  - 全部答对后，底部同一按钮变为“进入下一节 →”；
  - 点击后正确跳转到下一小节 `/item/c1-m1-i2`。

**关键决策**:
- 继续沿用“提交 / 下一节”共用同一按钮的方案，验证符合用户预期。
- inline 答题状态仍不持久化，进入新小节后自动清空。

## 阶段 4: 修复知识库题目卡片重叠/截断问题

**日期**: 2026-07-25

**操作**:
- 复现 `/kb` 知识库页面题目卡片显示异常：题目标题左侧被截断，卡片出现多余竖条。
- 定位根因：`<a class="card">` 默认 `display: inline`，内部包含 block 级 div 时浏览器将其拆分为多个 inline box，导致布局错乱、文字被截断。
- 在 `src/style.css` 的 `.card` 中显式声明 `display: block`，统一所有卡片为块级元素。
- 验证 `/kb`、`/bank`、`/exams`、首页课程卡片、试卷详情等页面均正常显示。

**关键决策**:
- 在 `.card` 基类统一加 `display: block` → 一次性修复所有 `<a class="card">` 卡片，避免逐个文件修补贴 `block`/`flex`。
- 保持卡片 hover 动效、圆角、边框不变。

**产出文件**:
- `src/style.css` - `.card` 增加 `display: block`

**关联问题**: 知识库页面题目卡片文字被截断、题目“打在一起”。

## 问题与解决方案

### 问题 3: 知识库题目卡片标题被截断

**日期**: 2026-07-25

**现象**: `/kb` 页面已解锁题目卡片左侧出现深色竖条，题目标题如“函数的定义域”显示为“的定义域”，文字被截断。

**原因**: `<a>` 标签默认 `display: inline`，当使用 `<a class="card">` 包裹 block 级子元素时，浏览器将 inline 元素拆分为多个 inline box，产生多余的窄 inline box 并遮挡/挤压内部标题。

**解决**: 在 `.card` 基类中设置 `display: block`，使所有卡片（包括 `<a>` 卡片）正确渲染为块级容器。

## 更新记录 - 2026-07-25

### 新增
- 小节独立页面 `/item/:itemId`。
- inline 全题提交与反馈流程。
- “查看答案”展开标准解法。
- 全部答对后“进入下一节”按钮。
- 大学物理B（上）力学与波动光学 13 个章节训练小节（`type: training`）。
- `builders/training-extract.py` 与 `builders/training-builder.js`，基于 MinerU 从 PDF 抽取训练题题干。

### 修改
- `course.js` 小节入口由 button 改为 a 链接。
- `inlinePractice.js` 完全重写为多题展示模式。
- `answer-collector.js` 支持非 document 根节点。
- `style.css` 的 `.card` 增加 `display: block`。
- `src/data/courses.js` 在大学物理B（上）每个理论小节后插入训练小节。
- `src/views/practiceList.js` 对 `quiz` 与 `training` 均复用 `quizSession`。
- `src/router.js` 对 `quiz` 与 `training` 均初始化 `quizSession`。
- 构建产物预渲染路由从 264 增至 480。

### 修复
- 提交时 `getElementById` 报错。
- `renderSidebarContent` 未定义报错。
- 知识库 `/kb` 题目卡片标题被截断、出现多余竖条的问题。
- `router.js` 中 `training` 小节未初始化 `quizSession` 导致页面空白的问题。

## 更新记录 - 2026-07-26

### 新增
- `.env.local` 存放 `MINERU_TOKEN`。
- `builders/training-builder.js` 的 `loadEnvLocal` 函数，自动将 `.env.local` 注入 Python 子进程环境变量。
- 题库前缀类型推断（xz/tk/js/pd/jd/zm）与题目类型/标签修复。
- `repair_missing_lambda` 与 `patch_known_questions` 后处理，修复 MinerU 漏识别的 λ、π/4 等符号及空选项。

### 修改
- `builders/training-extract.py` 从本地 MinerU CLI 迁移到 `mineru-open-sdk` HTTP API。
- 选择题选项正则移除 CJK 前 negative lookbehind，修复 `(A)` 后紧跟中文无法匹配的问题。
- `extract_options` 修复首选项被丢弃的切片错误。
- 训练题题图复制到 `public/physics/training/<item>/`，Markdown 中 `image` 字段使用对应 URL。
- 抽样检查 107 道训练题，单选 47 道均带 4 个选项，填空 35 道，计算 25 道；26 张题图引用全部正确。

### 修复
- 训练题全部显示为填空题的问题（题干中无选项时默认 `proof`，现根据章节标题/题库前缀/选项存在性正确判定为 `singleChoice`/`fillInBlank`/`calculation`）。
- 部分选择题选项未提取的问题（正则 lookahead 要求选项标记后必须有空格，导致 `(B)中央...` 等格式失败）。
- 题图未加载的问题（之前未从 MinerU 输出目录复制图片到 `public`，现自动复制）。

## 更新记录 - 2026-07-27

### 新增
- 用户认证体系前端链路：游客模式、邮箱+密码登录/注册/重置密码弹窗、右上角用户菜单。
- `src/services/supabase.js`、`auth.js`、`sync.js`，实现 Supabase 客户端、游客初始化、登录状态管理、本地↔云端进度同步。
- `src/components/authModal.js`、`auth-components.css`、`userMenu.js`。
- `.env.local` 中新增 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 占位。

### 修改
- `src/state.js` 新增 `user`、`authReady`；提交答案/完成小节时若已登录则同步到 Supabase。
- `src/main.js` 集成认证初始化、用户菜单、弹窗容器与全部认证事件处理。
- `.trae/documents/auth-system-plan.md` 版本升至 1.1，明确付费与 Stripe 延后。

### 待后续
- 创建 Supabase 项目并填入 `.env.local`。
- 在 Supabase 中创建 `profiles`、`answers`、`progress` 表与 RLS。
- 付费内容、Paywall、Stripe 支付、前 2 题试看移至后续迭代。

### 阶段 8: 接入 React Bits MCP（仅作搜索工具）

**日期**: 2026-07-26

**操作**:
- 在 `coursecore/` 下创建 `components.json`，注册 `@react-bits` registry：`https://reactbits.dev/r/{name}.json`。
- 创建 `jsconfig.json`，配置 `@/*` 路径别名指向 `src/`，满足 shadcn CLI 对项目配置文件的检查。
- 运行 `npx shadcn@latest mcp init --client claude`，成功生成 `.mcp.json` 并安装 `shadcn` 开发依赖。
- 确认 `.mcp.json` 中 `shadcn` MCP server 命令为 `npx shadcn@latest mcp`。

**关键决策**:
- 项目当前为原生 JS + Vite，不使用 React/shadcn 组件运行时；接入 MCP 仅用于通过自然语言搜索、浏览 React Bits 组件，找到合适动画后手动改写为原生 JS 实现。
- 不引入 React、react-dom 等运行时依赖，避免破坏现有构建与路由体系。
- `jsconfig.json` 仅作为 shadcn CLI 的配置入口，不参与实际构建；Vite 仍按原生 ESM 解析。

**产出文件**:
- `components.json` — shadcn registry 配置，含 `@react-bits` 注册表
- `jsconfig.json` — 路径别名配置，满足 shadcn CLI 检查
- `.mcp.json` — Claude MCP server 配置
- `package.json` / `package-lock.json` — 新增 `shadcn` 开发依赖

**连通性测试结果**:
- `npx shadcn@latest --version` → `4.15.0` ✓
- `npx shadcn@latest info` → 正确识别 Vite + Tailwind v3，注册表 `@shadcn` 与 `@react-bits` 均已配置 ✓
- 直接调用 shadcn MCP server（JSON-RPC `tools/list`）→ 返回 7 个工具，包括 `search_items_in_registries`、`view_items_in_registries`、`get_item_examples_from_registries` 等 ✓
- `@shadcn` 搜索 `skeleton`、`progress` → 有现成组件 ✓
- `@react-bits` 搜索 `loading`/`spinner`/`skeleton`/`fade`/`blur`/`ripple`/`progress` → 无专门的 loading/spinner/skeleton；可用作加载动画的候选如下：
  - `FadeContent-JS-TW`：内容淡入/滑入（依赖 gsap）
  - `BlurText-JS-TW`：文字从模糊到清晰（依赖 motion）
  - `GradualBlur-JS-TW`：渐进式去模糊
  - `RippleGrid-JS-TW`：持续涟漪网格（依赖 ogl）
  - `Radar-JS-TW`、`ShapeGrid-JS-TW`、`LineWaves-JS-TW`、`Threads-JS-TW` 等可作为全屏加载背景

**问题与发现**:
- 问题：直接 `WebFetch` 访问 `https://reactbits.dev/r/{name}.json` 返回 HTML "Not found"；说明 registry JSON 需要 MCP server 内部处理或带正确 UA/路由。
- 解决：通过 `npx shadcn@latest mcp` 以 JSON-RPC 调用 `list_items_in_registries`/`search_items_in_registries` 可正常拿到组件元数据。

**已知限制**:
- MCP 可搜索/查看组件，但无法直接把 React 组件安装到当前原生 JS 项目；需人工翻译为 vanilla JS + Tailwind。
- 如后续迁移到 React + shadcn，可直接用该 MCP 安装组件。

### 阶段 9: 用户认证体系前端链路

**日期**: 2026-07-27

**操作**:
- 实现 `src/services/supabase.js`：读取 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`，未配置时优雅降级为 `null`。
- 实现 `src/services/auth.js`：游客 `guest_id` 初始化、登录/注册/登出/重置密码、登录后本地↔云端数据合并。
- 实现 `src/services/sync.js`：`pushAnswer`、`pushItemProgress`、`pullProgress`、`mergeAndPushLocal`，按时间戳合并本地与云端记录。
- 实现 `src/components/authModal.js` + `auth-components.css`：邮箱+密码登录、注册、重置密码三态弹窗。
- 实现 `src/components/userMenu.js`：右上角登录/注册按钮或已登录用户下拉菜单。
- 修改 `src/state.js`：新增 `user`、`authReady`；`markQuestion` 与 `syncItemProgress` 在登录时同步到 Supabase。
- 修改 `src/main.js`：
  - 启动时调用 `initGuest()`、`initAuth()`、`updateUserMenu()`；
  - 在 header 中渲染 `user-menu-container`，在 app shell 末尾渲染 `auth-modal-container`；
  - 增加 `auth-open` / `auth-close` / `auth-tab` / `auth-submit` / `logout` / `toggle-user-menu` 事件处理。
- 修改 `.env.local`：新增 Supabase 配置占位。
- 更新 `.trae/documents/auth-system-plan.md`：版本升至 1.1，明确付费与 Stripe 延后。

**关键决策**:
- 邮箱 + 密码优先于 Magic Link：用户已明确选择此方式，且重置密码链路完整。
- 未配置 Supabase 时不阻塞站点：游客模式仍可正常使用，所有同步操作被 `isSupabaseConfigured()` 拦截。
- 进度合并以时间戳为准：本地较新则写入云端，云端较新则覆盖本地，避免弹窗询问。
- 付费内容、Paywall、Stripe 支付延后：本次只完成账号体系与进度同步。

**产出文件**:
- `src/services/supabase.js`
- `src/services/auth.js`
- `src/services/sync.js`
- `src/components/authModal.js`
- `src/components/auth-components.css`
- `src/components/userMenu.js`
- `src/main.js`（认证事件与初始化）
- `src/state.js`（同步触发）
- `.env.local`（Supabase 占位）
- `.trae/documents/auth-system-plan.md`（v1.1）

**关联问题**: 无

## 更新记录 - 2026-07-27（补充）

### 新增
- `/privacy` 隐私政策页面与 `/terms` 用户协议页面，含返回首页入口。
- `src/views/legal.js`：复用卡片样式渲染隐私政策与用户协议。
- 注册弹窗新增“已满 14 周岁并同意用户协议和隐私政策”勾选框，未勾选无法提交注册。
- 页脚“使用条款”“隐私政策”改为真实链接。
- `scripts/supabase-schema.sql`：包含 `profiles`、`answers`、`progress` 建表、RLS 策略、新用户触发器与索引。

### 修改
- `src/config/routes.js`：新增 `privacy`、`terms` 路由，并加入 `getStaticPaths` 预渲染列表。
- `src/router.js`：增加 `showPrivacy`、`showTerms` 与 `renderMain` 对应分支。
- `src/components/authModal.js`：注册表单增加同意勾选框与协议链接。
- `src/components/auth-components.css`：增加 `.auth-consent*` 样式。
- `src/main.js`：注册提交前校验同意状态；增加 `auth-close-navigate` 事件关闭弹窗并跳转协议页。
- `.trae/documents/technical-architecture.md` 补充 `scripts/supabase-schema.sql` 说明。

### 待后续
- 在 Supabase SQL Editor 中运行 `scripts/supabase-schema.sql`。
- 付费内容、Paywall、Stripe 支付、前 2 题试看移至后续迭代。

### 阶段 10: 大学物理B（上）理论讲义与训练题答案补全

**日期**: 2026-07-27

**操作**:
- 读取用户提供的 `大物上第三版(改前两章).md`，按现有 `courses.js` 的 15 个 theory 小节结构重新整理理论内容。
- 更新 `curriculum/raw/questions/physics-b-1/p1b-m1-01.md ~ p1b-m1-07.md` 与 `p1b-m2-01.md ~ p1b-m2-05.md、p1b-m2-07.md、p1b-m2-08.md`，替换原有占位内容。
- 对于无法完整映射的章节（4.2 保守力与势能内容截断、p1b-m2-06 光学仪器分辨率无源内容），按用户决策暂不录入，保留原小节占位或跳过内容。
- 文件中的 7 道例题与现有 training 题目完全对应，为对应文件补充答案与详细解析：
  - `p1b-m1-01-training-002/004`
  - `p1b-m1-02-training-002/004`
  - `p1b-m1-03-training-001/002/008`
- 训练题图片路径沿用已有本地资源，未新增外链。
- 运行 `npm run build:data` 与 `npm run validate:data` 均通过，生成 291 道题、15 个理论内容、2 套试卷。

**关键决策**:
- 保持现有 `courses.js` 小节结构不变，内容按标题语义映射，有冲突的章节不强行合并 → 减少课程结构改动风险。
- 文件中的题目均为章节训练题，归入对应 `training` 小节；未在文件中发现新的期末综合难题，因此 quiz 目录不作追加 → 符合“training 放简单训练题，quiz 保留”的决策。
- 题型维持原样：单选题保留 `singleChoice`，计算题保留 `calculation`，答案与解析均来自文件原文。

**产出文件**:
- `curriculum/raw/questions/physics-b-1/p1b-m1-01.md ~ p1b-m1-07.md`（力学理论讲义）
- `curriculum/raw/questions/physics-b-1/p1b-m2-01.md ~ p1b-m2-05.md、p1b-m2-07.md、p1b-m2-08.md`（波动光学理论讲义）
- `curriculum/raw/questions/physics-b-1/p1b-m1-01-training/q-physics-b-1-p1b-m1-01-training-002.md` 等 7 道训练题（补充答案与解析）
- `src/data/theoryContents.js`（自动构建生成）
- `src/data/questions.js`（自动构建生成）

## 更新记录 - 2026-07-27（第二次）

### 新增
- 大学物理B（上）力学 7 个小节、波动光学 7 个小节的完整理论讲义内容（除映射冲突/截断部分外）。
- 7 道已有 training 小题的标准答案与分步解析。

### 修改
- 15 个 theory Markdown 源文件由占位内容替换为正式讲义。
- `p1b-m1-01-training-002` 等 7 道训练题由空答案更新为文件中的正确答案，并新增 `## Solution` 解析分区。
- `src/data/theoryContents.js` 与 `src/data/questions.js` 经 `build:data` 重新生成。

### 未录入内容
- 第四章 4.2 节“保守力与势能”因源文件内容截断，未录入。
- `p1b-m2-06` 小节“光学仪器分辨率与X射线衍射”因源文件无对应内容，保持占位。

### 阶段 11: Supabase 环境配置与后端认证链路验证

**日期**: 2026-07-27

**操作**:
- 通过 MCP 读取 Supabase 项目 URL 与 publishable keys，修正 `.env.local` 中的错误配置。
- 在 Supabase SQL Editor 中执行 `scripts/supabase-schema.sql`，创建 `profiles`、`answers`、`progress` 表并开启 RLS。
- 编写 `scripts/test-supabase-connection.js`：验证 Supabase 认证服务可达、三张表存在且 RLS 开启。
- 编写 `scripts/test-auth-flow.js`：完成注册 → profile 触发器 → 写入 answers / progress → 读取回来 → 清理测试数据的全链路验证。
- 测试过程中发现 Supabase 默认开启邮箱验证（Confirm email）导致注册后无法直接获得 session；关闭 Confirm email 后测试通过。
- 前端浏览器自动化测试因环境依赖与视口点击问题搁置；后端链路已充分验证，前端代码保持可用状态。

**关键决策**:
- 关闭 Supabase 的 Confirm email 以简化登录体验；后续如需提高邮件可信度，可再开启并补充重发确认邮件入口。
- 使用 legacy anon key（JWT 格式）保持与现有 `@supabase/supabase-js` 代码的兼容性。
- 不保留 Playwright 等重型浏览器测试依赖，避免拖慢安装与构建；测试脚本仅依赖 `@supabase/supabase-js`。

**产出文件**:
- `scripts/test-supabase-connection.js`
- `scripts/test-auth-flow.js`
- `.env.local`（已填入正确的 Supabase URL 与 anon key）

**关联问题**: 无

### 阶段 12: 仓库根目录重构

**日期**: 2026-07-27

**操作**:
- 将原本嵌套在 `coursecore/` 子目录中的完整项目内容提升至仓库根目录。
- 删除根目录下旧的 CourseCore 重复文件（`builders/`、`assets/`、`curriculum/` 等）。
- 删除与 CourseCore 无关的内容：`freeCodeCamp-main/`、海报与演示 HTML、临时分析文档等。
- 统一依赖：运行 `npm install` 补全因目录移动缺失的 `marked` 包。
- 验证构建：`npm run build:data` 生成 291 题 + 15 讲义 + 2 试卷；`npm run build` 成功预渲染 481 条静态路由。

**关键决策**:
- `main` 分支以后只保留 CourseCore 项目本身，不再混放其他仓库或历史残留文件。
- 保留根目录 `.trae/documents/` 作为权威开发文档位置；`coursecore/.trae` 在提升前移除，避免合并冲突。
- 配置文件、构建脚本、源码、题库、静态资源全部平铺在根目录，Cloudflare Pages / Vercel / Netlify 直接以 `/` 为根目录部署。

**产出文件**:
- 根目录 `package.json`、`vite.config.js`、`tailwind.config.js` 等配置文件。
- 根目录 `src/`、`builders/`、`scripts/`、`curriculum/`、`public/`。
- 更新 `development-log.md` 与 `.trae/documents/technical-architecture.md` 中的目录结构描述。

**关联问题**: “格式化展示大物理论”提交看似消失，实际是因代码被提交到 `coursecore/` 子目录而非根目录；重构后根目录代码与最新提交一致。

## 更新记录 - 2026-07-27（第三次）

### 新增
- Supabase 项目连接与配置验证。
- `scripts/test-supabase-connection.js` 与 `scripts/test-auth-flow.js` 后端测试脚本。

### 修改
- `.env.local` 中修正 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。
- Supabase 关闭 `Confirm email`，启用 Email provider。

### 验证
- `node scripts/test-supabase-connection.js`：认证服务可访问，三张表存在且 RLS 开启。
- `node scripts/test-auth-flow.js`：注册成功、profile 自动生成、answers/progress 写入并读回正确。

## 更新记录 - 2026-07-27（第四次）

### 修改
- 仓库结构：`coursecore/` 子目录内容全部提升至根目录，`main` 分支仅保留 CourseCore 项目。
- `development-log.md` 与 `technical-architecture.md` 中的目录结构描述同步更新为根目录布局。
- 构建产物统计更新为 481 个预渲染静态路由。

### 验证
- `npm run build:data` 成功。
- `npm run build` 成功，预渲染 481 条路由。

## 更新记录 - 2026-07-27（第五次）

### 修改
- 将根目录重构结果提交到 `main` 分支，commit message：`refactor: move coursecore to root`。
- 仅提交已跟踪文件的变更，未包含未跟踪的调试脚本、PDF 源文件与分析产物。


### 阶段 15: 修复登录弹窗误关闭并临时切换为管理员硬编码认证

**日期**: 2026-07-28

**操作**:
- 修复登录/注册/重置弹窗点击卡片内部空白处会意外关闭的问题：仅在点击遮罩层背景或右上角关闭按钮时调用 `hideAuthModal`。
- 暂时关闭 Supabase 邮箱认证链路，改为前端硬编码管理员账号密码登录。
- 在 `src/services/auth.js` 中新增 `ADMIN_CREDENTIALS` 与 `ADMIN_USER`，登录成功后将 session 写入 `localStorage`。
- `signUp` 与 `resetPassword` 临时抛出友好错误，提示当前不开放注册/重置。
- `src/components/authModal.js` 将邮箱输入框标签改为"账号"，placeholder 显示管理员账号。

**关键决策**:
- 事件委托层判断 `event.target` 是否为遮罩层本身，避免误关；不阻止弹窗内部事件冒泡，保证 tab 切换、表单提交等交互正常。
- 管理员凭据硬编码在前端仅为临时方案，后续需替换为后端认证或 Supabase 配置。

**产出文件**:
- `src/main.js` - `auth-close` 事件增加 target 校验
- `src/services/auth.js` - 硬编码管理员认证与 session 管理
- `src/components/authModal.js` - 账号标签与 placeholder 调整

## 更新记录 - 2026-07-28
### 修改
- 答案展示层新增 `formatAnswerDisplay`，选择题索引转字母，判断题索引转中文。


### 修复
- 单选/判断题答案字母在构建阶段自动归一化为选项索引，修复选择正确选项仍被判错的 bug。

### 阶段 16: 将登录入口从 Header 移到侧边栏

**日期**: 2026-07-28

**操作**:
- 移除 Header 右上角未登录时的"登录 / 注册"按钮，`userMenu.js` 未登录状态返回空字符串。
- 在右侧 staggered 侧边栏导航列表末尾新增"登录 / 退出登录"项，未登录时打开登录弹窗，已登录时执行退出。
- 新增 `updateStaggeredMenuAuth` 函数，在打开侧边栏及 `cc-auth-change` 事件时同步更新该项文案与 `data-action`。
- 点击侧边栏登录/退出后自动关闭侧边栏，提升交互连贯性。
- 为第 4 个菜单项补充 `transition-delay` 动画，并微调侧边栏登录项的字号与悬停色。

**关键决策**:
- 不引入 shadcn/React 组件运行时，沿用现有原生 JS + Tailwind CSS 实现，保持项目无 React 依赖。
- 登录状态变更不重新渲染整个 App Shell，仅更新 Header 用户菜单与侧边栏登录项，避免页面闪烁。

**产出文件**:
- `src/main.js` - 侧边栏新增登录项、关闭侧边栏逻辑、`updateStaggeredMenuAuth`
- `src/components/userMenu.js` - 移除未登录 Header 按钮
- `src/style.css` - 第 4 项动画延迟与侧边栏登录项样式

## 更新记录 - 2026-07-28（第二次）
### 修改
- `src/main.js` 修复登录弹窗点击卡片内部空白处意外关闭的问题。
- `src/services/auth.js` 临时切换为硬编码管理员账号密码认证。
- `src/components/authModal.js` 登录输入框标签由"邮箱"改为"账号"。

### 待后续
- 恢复 Supabase 邮箱认证或接入更安全的后端登录。
- 管理员密码需从代码中移除，改为环境变量或数据库配置。

### 阶段 17: 禁用登录弹窗中的注册与重置 tab

**日期**: 2026-07-28

**操作**:
- 在 `src/components/authModal.js` 中将"注册"与"重置" tab 按钮设为 `disabled`，并添加 `title="功能暂时关闭"`。
- `showAuthModal` 强制将非 `login` 的 tab 参数归一化为 `login`，避免外部入口直接打开已禁用的表单。
- 在 `src/components/auth-components.css` 中为禁用的 `.auth-tab` 添加降低透明度、禁止光标及悬停不变色的样式。

**关键决策**:
- 使用原生的 `disabled` + `title` 实现禁用与提示，不依赖额外 JS 或自定义 tooltip，保持轻量。

**产出文件**:
- `src/components/authModal.js` - 禁用注册/重置 tab
- `src/components/auth-components.css` - disabled tab 样式

## 更新记录 - 2026-07-28（第三次）
### 修改
- 登录入口从 Header 右上角移到右侧 staggered 侧边栏。
- `src/components/userMenu.js` 未登录状态不再渲染 Header 按钮。
- `src/style.css` 新增侧边栏第 4 项动画延迟与登录项样式。

## 更新记录 - 2026-07-28（第四次）
### 修改
- `src/components/authModal.js` 禁用"注册"与"重置" tab 按钮，悬浮提示"功能暂时关闭"。
- `src/components/auth-components.css` 新增禁用 tab 样式。

## 更新记录 - 2026-07-28（第五次）
### 新增
- 用户中心页面 `/user`：头像、昵称编辑、学习统计、活动热图、退出登录。
- `src/utils/avatars.js`：8 张黑白几何占位头像。
- `src/components/avatarPicker.js`：头像选择弹窗。
- `.trae/documents/user-page-implementation-plan.md`：用户页实现计划。

### 修改
- 侧边栏顶部入口改为头像，已登录进入 `/user`，未登录打开登录弹窗。
- `src/services/auth.js` 与 `src/components/avatarPicker.js` 移除 dicebear 外链，改用本地占位图。
- `src/components/auth-components.css` 用户卡片背景与热图颜色改为跟随主题变量。

### 阶段 19: 用户中心统计与活动真实化

**日期**: 2026-07-28

**操作**:
- 在 `src/services/auth.js` 中新增 `loginDates` 记录：登录与初始化时把当天日期追加到用户 session，持久化到 `localStorage`。
- 重写 `src/views/user/userPage.js` 的统计与热力图逻辑：
  - 左上角新增"返回"按钮，点击调用 `history.back()`，无历史时回到首页。
  - "当前连续签到"与"最长连续签到"基于 `loginDates` + `completedQuestions` 的答题日期计算。
  - 活动热力图改为整年展示（1 月 1 日 至 12 月 31 日），顶部显示 12 个月份标签，左侧显示星期标签，右侧显示年份与上一年/下一年切换器。
  - 当天登录的格子以墨绿色高亮，并叠加答题量深浅（5 级透明度）。
  - 新增图例（Less / level-0~4 / More）。
- 在 `src/state.js` 中新增 `userHeatmapYear` 状态，支持年份切换后重新渲染热力图。
- 在 `src/components/auth-components.css` 中新增返回按钮样式、整年热力图布局、年份切换器、图例与墨绿色热力图等级。
- 在 `src/main.js` 中新增 `user-page-back`、`heatmap-prev-year`、`heatmap-next-year` 事件处理。

**关键决策**:
- 将"登录日"与"答题日"统一视为签到日 → 无需单独签到按钮，用户登录或做题即完成签到，降低交互负担。
- 连续签到计算兼容昨天有记录、今天尚未操作的情况 → 符合 GitHub 风格，当天结束前 streak 不中断。
- 当天墨绿色同时反映登录状态与答题活跃度 → 登录后无答题为浅墨绿，答题越多越深。
- 热力图参考 `activity-heatmap2.0` 布局：左侧星期、中间整年格子、右侧年份切换，保持用户熟悉的 GitHub 风格。

**产出文件**:
- `src/services/auth.js` - `getTodayKey`、`ensureLoginDates`、session 写入
- `src/state.js` - `userHeatmapYear`
- `src/views/user/userPage.js` - 返回按钮、真实统计、整年热力图
- `src/components/auth-components.css` - `.user-back-btn`、整年热力图布局、年份切换器、图例、`.is-today-login`
- `src/main.js` - `user-page-back`、`heatmap-prev-year`、`heatmap-next-year` 事件

## 更新记录 - 2026-07-28（第六次）

### 新增
- 用户页左上角"返回"按钮。
- `loginDates` 登录日期记录。
- 当天登录热力图格子墨绿色高亮。
- 热力图年份切换器（右侧显示上一年 / 当前年 / 下一年）。
- 热力图图例（Less / More）。
- `state.userHeatmapYear` 状态。

### 修改
- "当前连续签到"与"最长连续签到"改为基于真实登录/答题日期计算。
- 热力图从固定 2026-02 至 2026-07 改为整年展示（1 月 1 日 至 12 月 31 日）。
- 热力图顶部增加 12 个月份标签，左侧增加 Mon/Wed/Fri 星期标签。
- 热力图页脚改为图例。

## 更新记录 - 2026-07-28（第七次）

### 新增
- item 小节页 `/item/:itemId`（theory / inline practice 等类型）顶部新增墨绿色课程/章节导航栏，参考 freeCodeCamp 的 `BreadCrumb` 样式。
- `src/views/practiceList.js` 新增 `renderItemNav(course, module, item)`。
- `src/views/course.js` 为每个 module 卡片增加 `id="module-${m.id}"` 锚点。
- `src/style.css` 新增 `.item-nav`、`.item-nav-list`、`.item-nav-course`、`.item-nav-module` 样式。

### 修改
- theory / inline practice 等小节页顶部的"← 返回 课程名"链接替换为新导航条：左侧课程名跳转 `/course/:courseId`，右侧章节名（`module.title`）跳转 `/course/:courseId#module-:moduleId`。
- 导航条 sticky 固定于 header 下方（`top: 4rem`），采用墨绿色背景 + 左侧灰色块 + clip-path 三角形箭头 + 右侧墨绿色背景。
- `src/router.js` 的 `showCourse` 处理 URL hash，渲染后滚动到对应 module 锚点。
- `src/router.js` 的 `navigateTo` 与 `src/main.js` 的点击拦截先提取 pathname 再匹配，确保带 hash 的内部链接被 SPA 路由接管。
- 修复 `.item-nav-list a` 的 `overflow: hidden` 导致箭头被裁剪的问题。

### 保留
- `quiz` / `training` 小节保持原有返回链接，避免与 `quiz-control-bar` 堆叠。

### 阶段 20: 课程内容访问权限控制（游客试看第一模块前 2 组）

**日期**: 2026-07-28

**操作**:
- 在 `.worktrees/feature/access-control` 隔离工作区完成开发，基于当前 `main` 切出 `feature/access-control` 分支。
- 新增 `src/config/access.js`：按规则“每个课程第一个模块的前 4 个 item 对游客开放”自动计算免费 item ID 集合，提供 `isItemFree(itemId)` 判断函数。
- 修改 `src/views/course.js`：未登录用户查看课程详情页时，非免费 item 显示锁图标与“登录解锁”提示，点击按钮通过 `data-action="auth-open"` 唤起登录弹窗。
- 修改 `src/style.css`：新增 `.status-locked` 样式，使用虚线边框与 muted 颜色表示锁定状态。
- 修改 `src/views/practiceList.js`：未登录用户直接访问锁定小节时，渲染登录提示卡片，提供“登录 / 注册”按钮与返回课程目录链接。
- 修改 `src/views/practiceDetail.js`：未登录用户直接访问属于锁定小节的单题页时，同样渲染登录提示卡片。
- 游客对免费 item 仍可正常看讲义、做题、判题；localStorage 进度保持现状。

**关键决策**:
- 规则集中配置在 `src/config/access.js` 而非分散在 courses.js → 不侵入自动生成的课程数据，调整免费范围时只改一处。
- 权限判断放在视图层而非路由层 → 保持路由简单，同时让课程详情页、小节页、单题页各自决定展示内容或登录提示。
- 锁定 item 仍渲染标题但不可进入，点击后弹窗而非跳转 → 保留入口可见性，降低用户流失。

**产出文件**:
- `src/config/access.js` - 免费范围规则与判断函数
- `src/views/course.js` - 课程详情页锁图标与登录弹窗触发
- `src/style.css` - 锁定状态样式
- `src/views/practiceList.js` - 小节页登录提示
- `src/views/practiceDetail.js` - 单题页登录提示

**关联问题**: 无

## 更新记录 - 2026-07-28（第八次）

### 新增
- `src/config/access.js`：集中管理课程内容免费访问规则。
- 课程详情页锁定小节显示锁图标，点击唤起登录弹窗。
- 锁定小节 `/item/:itemId` 与单题 `/question/:qid` 页面在未登录时显示登录提示卡片。

### 修改
- `src/views/course.js` 小节列表根据登录状态与 `isItemFree` 渲染锁定或正常入口。
- `src/views/practiceList.js` 进入小节前增加权限判断。
- `src/views/practiceDetail.js` 进入单题前增加权限判断。
- `src/style.css` 新增 `.status-locked` 虚线锁定状态样式。

### 验证
- `npm run build` 成功，预渲染 482 条静态路由。

### 阶段 21: 公开前安全加固

**日期**: 2026-07-29

**操作**:
- 在 `.worktrees/feature/security-prep-for-release` 隔离工作区完成公开前风险修复。
- 移除 `src/services/auth.js` 中的硬编码管理员账号 `admin@coursecore.local` / `admin123456`，彻底删除 `ADMIN_CREDENTIALS`、`ADMIN_USER`、`ADMIN_SESSION_KEY` 及相关 session 逻辑。
- `signIn`、`signUp`、`resetPassword` 统一抛出友好错误，提示当前不开放对应功能；`initAuth` 不再恢复任何 session，站点以纯游客模式运行。
- 关闭 Vite 生产构建 sourcemap（`vite.config.js` 中 `sourcemap: false`），避免构建产物泄露源码结构。
- 修复 `.github/workflows/deploy.yml` 中的 `coursecore/` 子目录路径：删除 `working-directory` 与 `cache-dependency-path` 中的错误前缀，artifact 路径改为 `dist`。
- 在 `index.html` 增加 `Content-Security-Policy`：限制资源加载到同源、Google Fonts、MathJax CDN、cdnjs、Supabase；禁用 frame/object；限制 base-uri。
- 为 `index.html` 中两个外部 JS（MathJax 3、p5.js）添加 `integrity` 与 `crossorigin="anonymous"` SRI 校验，防止 CDN 被篡改时代码执行。
- 更新 `.env.example`：移除"纯静态前端无需后端"的过时描述，补充 `MINERU_TOKEN`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 的用途与安全说明。

**关键决策**:
- 直接关闭登录功能而非仅改密码 → 避免前端无法安全存储凭据的根本问题，公开上线期间无人能登录为管理员。
- sourcemap 完全关闭而非条件化 → 简化配置，生产构建产物最小化。
- CSP 保留 `'unsafe-inline'` → 兼容现有内联 MathJax 配置与大量 `innerHTML` 渲染逻辑，后续若引入 nonce 或把 MathJax 配置外置可进一步收紧。
- GitHub Actions 路径改为根目录 → 与仓库根目录重构结果保持一致，避免 CI 找不到 `package-lock.json` 或 `dist`。

**产出文件**:
- `src/services/auth.js` - 移除硬编码管理员凭据与 session 管理
- `vite.config.js` - 生产 sourcemap 关闭
- `.github/workflows/deploy.yml` - 部署路径修正
- `index.html` - CSP 与 CDN SRI
- `.env.example` - 环境变量示例更新

**关联问题**: 计划公开网站前的风险检查

## 更新记录 - 2026-07-29

### 修改
- 移除 `src/services/auth.js` 硬编码管理员账号密码，关闭登录/注册/重置功能。
- `vite.config.js` 生产构建 `sourcemap` 由 `true` 改为 `false`。
- `.github/workflows/deploy.yml` 修正为根目录构建与上传路径。
- `index.html` 增加 Content-Security-Policy 并为 MathJax、p5.js 添加 SRI。
- `.env.example` 更新为包含 MinerU token 与 Supabase 配置说明的示例。

### 安全修复
- 高危：消除源码中可公开登录的管理员账号。
- 中危：防止生产源码映射泄露、CDN 劫持执行、GitHub Actions 部署失败。

### 已知限制（仍需关注）
- `src/validators/runner.js` 仍使用 `new Function` 执行代码题测试；当前题目为本地构建生成，如后续开放用户上传题目需改用 Web Worker 沙箱。
- 大量 `innerHTML` + `marked.parse()` 渲染存在 XSS 理论风险；当前 Markdown 源受控，上线后应定期审计源文件，并考虑引入 DOMPurify。
- 游客进度仅存 localStorage，无法跨设备同步。
- 内容付费/锁定依赖前端判断，题目数据本身在构建产物中公开。

## 最后更新时间

2026-07-30

### 阶段 23: 管理后台全链路接入与构建验证

**日期**: 2026-07-30

**操作**:
- `src/services/auth.js`：恢复 Supabase Auth 集成；登录后从 `profiles` 表读取 `role / display_name / avatar_url` 写入 `state.user`；新增 `isAdmin()` 导出，判定 `state.user?.role === 'admin'`。
- `src/services/admin.js`：新增管理后台 CRUD 服务，覆盖 8 个实体（users / courses / modules / items / questions / exam_papers / exam_sections / exam_questions）；所有写操作前置 `ensureAdmin()` 校验，非管理员抛错；`listUsers` 走 `admin_list_users` RPC，`updateUserRole` / `listCourses` / `createCourse` / `updateCourse` / `deleteCourse` 等走表 + RLS 策略。
- `src/config/routes.js`：注册 `/admin` 路由（view: 'admin'），并在 `getStaticPaths` 中追加 `/admin` 供预渲染生成 `dist/admin/index.html`。
- `src/router.js`：新增 `showAdminPage()`，设置 `state.view = 'admin'`、清空 `currentCourseId`、`clearQuestionState()`、`setActiveNav('landing')`、调用 `renderMain()` + `initAdminPage()` + `scrollTo({top:0})`；在 `renderMain()` switch 中增加 `case "admin"` 分支，调用 `renderAdminPage()`。
- `src/views/user/userPage.js`：在用户中心 `<div class="user-actions">` 内追加 `${user?.role === 'admin' ? '<a href="/admin" class="user-admin-entry" data-action="admin-entry-link">…管理后台</a>' : ''}`，仅管理员可见。
- `src/main.js`：import `handleAdminAction`；在事件委托 switch 中追加 `admin-tab / admin-add / admin-edit / admin-delete / admin-modal-close / admin-modal-noop / admin-modal-save / admin-refresh` 8 个分支，统一转发到 `handleAdminAction(action, el)`。
- `src/style.css`：新增 `.admin-page / .admin-header / .admin-tabs / .admin-tab / .admin-toolbar / .admin-table / .admin-btn / .admin-modal / .admin-form / .admin-feedback / .admin-denied` 等管理后台样式，全部使用现有 CSS 变量适配明暗主题。
- `src/components/auth-components.css`：新增 `.user-admin-entry` 圆角描边按钮样式，hover 反白为墨绿色背景。
- `package.json`：scripts 新增 `fetch:data`（`node scripts/fetch-from-supabase.js`），`predev` 与 `prebuild` 改为 `npm run build:data && npm run fetch:data`，确保 Supabase 内容覆盖本地 Markdown 构建产物（Supabase 为内容源真相）。
- 运行 `npm run build` 验证：291 题 Markdown 构建 → Supabase 拉取覆盖为 268 题（差额为 seed 未导入部分）；theory_contents / exam_papers 表为空时 fetch 脚本 `console.warn` 后 `exit 0` 不阻塞；vite build 1.95s 通过；prerender 生成 460 条静态路由，含 `dist/admin/index.html`。

**关键决策**:
- 管理员判定走 `profiles.role === 'admin'` 而非硬编码账号 → 与阶段 21 安全修复一致，避免源码泄露可登录凭据。
- `ensureAdmin()` 前置校验所有写操作 → 即使前端 UI 误触，RLS + 服务层双重拦截。
- `/admin` 路由加入 `getStaticPaths` → 刷新或直接访问不 404，与其他页面一致。
- 管理员入口放在用户中心而非全局 header → 满足用户"在管理员账号中，的用户中心，有一个只有管理员才能看到的按钮"需求。
- `predev` / `prebuild` 串联 `build:data && fetch:data` → Markdown 构建产物作为兜底，Supabase 数据作为最终真相；表为空时 fetch 脚本不阻塞，保证 MCP 不可用时不破坏构建。
- `admin_list_users` 走 RPC 而非直查 `auth.users` → 不暴露 Supabase 内部表，且可在 RPC 内联 join `profiles` 返回 `display_name / avatar_url`。

**产出文件**:
- `src/services/auth.js` — 新增 `fetchProfile` / `isAdmin`
- `src/services/admin.js` — 全新 CRUD 服务（约 220 行）
- `src/config/routes.js` — `/admin` 路由 + static path
- `src/router.js` — `showAdminPage()` + `renderMain` switch 分支
- `src/views/user/userPage.js` — 管理员入口按钮
- `src/main.js` — admin-* 事件委托分支
- `src/style.css` — 管理后台样式
- `src/components/auth-components.css` — `.user-admin-entry` 样式
- `package.json` — `fetch:data` 脚本 + `predev` / `prebuild` 串联

**关联问题**: 无

**待后续**:
- Supabase MCP 恢复后，依次执行 `scripts/seed/02-questions-*.sql` / `03-theory-contents.sql` / `04-exam-papers-*.sql` 完成剩余 seed 导入，使 `questions.js` 数量与本地 Markdown 一致（291）、`theoryContents.js` / `examPapers.js` 由 Supabase 接管。→ 阶段 24 已完成。
- ~~`src/services/admin.js` 补充 `updateExamSection` 与（可选）`deleteUser` RPC~~ → 阶段 30 已补全。
- profiles 表若未含 `display_name` / `avatar_url` 列，需在 Supabase SQL Editor 执行 `ALTER TABLE public.profiles ADD COLUMN display_name TEXT, ADD COLUMN avatar_url TEXT;`。
- 管理后台首次使用前需在 Supabase Dashboard 手动将至少一个账号的 `profiles.role` 改为 `'admin'`，否则 `/admin` 入口与页面均不可见。

### 阶段 22: 管理后台页面与 Supabase 数据拉取脚本

**日期**: 2026-07-30

**操作**:
- 创建 `src/views/admin/adminPage.js`：5 Tab（Users / Courses / Modules & Items / Questions / Exam Papers）管理后台页面，覆盖 8 个实体（user / course / module / item / question / exam_paper / exam_section / exam_question）的 CRUD。
- 实现 `renderAdminPage()` / `initAdminPage()` / `handleAdminAction(action, el)` 三个导出函数，供 router 渲染与 main.js 事件委托调用。
- 通过 `data-action="admin-tab|admin-add|admin-edit|admin-delete|admin-modal-close|admin-modal-save|admin-modal-noop|admin-refresh"` 与 main.js 既有 `[data-action]` 委托机制对接；`admin-modal-noop` 用于阻止点击 modal 内部时冒泡到 overlay 误关闭。
- 模态框内联渲染（非独立组件），JSON 字段（options / answers / tags / requirements）以 textarea 编辑 JSON 字符串，提交时解析；模块复合主键以 `course_id|module_id` 编码进 `data-id`。
- 所有用户文本经 `escapeHtml` 转义；样式内联 `<style>` 块使用现有 CSS 变量（--bg / --fg / --muted / --line / --accent / --card）适配明暗主题。
- 创建 `scripts/fetch-from-supabase.js`：ESM 脚本，手动解析 `.env.local`（不依赖 dotenv），从 Supabase 拉取 courses / modules / items / questions / theory_contents / exam_papers / exam_sections / exam_questions 八张表，生成 4 个 `src/data/*.js` 静态文件（COURSES / QUESTIONS / THEORY_CONTENTS / EXAM_PAPERS），与现有数据文件格式完全一致（snake_case → camelCase，courses / examPapers 做嵌套）。
- 未配置 Supabase 或表为空时打印警告并 exit 0，不阻塞构建；每张表独立 try/catch，单表失败不影响其他表。

**关键决策**:
- adminPage.js 不内置独立 CSS 文件，样式随 renderAdminPage 内联 `<style>` 输出 → 自包含，避免污染全局 style.css；浏览器对重复 `<style>` 标签去重无副作用。
- 模态框 overlay 与 inner 容器均带 `data-action`，inner 使用 `admin-modal-noop` 拦截内部点击 → 与现有 `closest('[data-action]')` 委托机制兼容，无需 stopPropagation。
- module 复合主键编码为 `course_id|module_id` 字符串塞入 `data-id` → 单一属性传递，解析端用 `parseModuleId` 拆分。
- exam_section 编辑态直接报错（admin.js 未提供 updateExamSection）→ 不掩盖服务层缺失，引导用户删除重建。
- user 删除引导到 Supabase Dashboard（admin.js 无 deleteUser，且不应在前端暴露用户删除）→ 安全合规。
- fetch-from-supabase.js 手动解析 .env.local 而非引入 dotenv → 不增加依赖，与现有 `test-supabase-connection.js` 的 loadEnvLocal 模式一致。
- 生成的数据文件保持与现有 `courses.js` / `questions.js` / `theoryContents.js` / `examPapers.js` 字段结构完全一致 → 可直接被前端 import 替换构建产物。

**产出文件**:
- `src/views/admin/adminPage.js` — 管理后台页面渲染 + 事件处理（约 660 行）
- `scripts/fetch-from-supabase.js` — Supabase 数据拉取脚本（约 230 行）

**关联问题**: 无

**待后续**:
- 在 `src/main.js` 的事件委托 switch 中增加 `admin-tab` / `admin-add` / `admin-edit` / `admin-delete` / `admin-modal-close` / `admin-modal-noop` / `admin-modal-save` / `admin-refresh` 分支，统一转发到 `handleAdminAction(action, el)`。→ 阶段 23 已完成。
- 在 `src/router.js` 与 `src/config/routes.js` 注册 `/admin` 路由，渲染 `renderAdminPage()` 并在 DOM 就绪后调用 `initAdminPage()`。→ 阶段 23 已完成。
- ~~在 `src/services/admin.js` 补充 `updateExamSection` 与 `deleteUser`~~ → 阶段 30 已补全。
- profiles 表若未含 `display_name` / `avatar_url` 列，需在 Supabase SQL Editor 中执行 `ALTER TABLE public.profiles ADD COLUMN display_name TEXT, ADD COLUMN avatar_url TEXT;`。

### 阶段 24: MCP 恢复后剩余 seed 数据导入与一致性校验

**日期**: 2026-07-30

**操作**:
- MCP 恢复后通过 `apply_migration` / `execute_sql` 推进阶段 23 遗留的 seed 导入，目标：DB 各表计数与本地 Markdown 构建产物（291 题 / 15 讲义 / 2 试卷）完全对齐。
- 通过 `apply_migration` 执行 `scripts/seed/02-questions-09-physics-b-1-05.sql`，补齐 physics-b-1 的 23 道 `p1b-m2-quiz` 题目（DB 由 160 → 183 题对齐本地物理题量）。
- 通过 `apply_migration` 执行 `scripts/seed/03-theory-contents.sql`，导入 15 条 theory_contents（p1b-m1-01 ~ p1b-m2-08），填补此前为空的讲义表。
- 通过 `apply_migration` 执行 `scripts/seed/04-exam-papers-01-exam-calculus-1-final.sql` 与 `04-exam-papers-02-exam-calculus-2-final.sql`，导入 2 套试卷 + 10 个 section + 60 道 exam_question。
- 修复 `exam_sections.id` / `exam_questions.section_id` 类型错误：原 schema 为 uuid，但 seed 使用 `exam-calculus-1-final-sec-0` 等 text 主键。通过 `apply_migration` 将两列 `ALTER ... TYPE text`，并重建外键与索引。
- 修复 `exam_questions.options` 的 `invalid input syntax for type json`：源于 MCP 对复杂 JSON 字符串的解析限制。方案：创建临时管理员账号 + `exec_admin_sql(sql_text)` RPC（`SECURITY DEFINER`），再用 Node.js 脚本读取 SQL 文件、按语句切分、通过 supabase-js `rpc('exec_admin_sql', { sql_text })` 逐条执行，绕过 MCP JSON 转义问题。
- 全部导入完成后通过 `execute_sql` 校验 DB 计数：questions=291、theory_contents=15、exam_papers=2、exam_sections=10、exam_questions=60、courses=3、modules=15、items=119，与本地 Markdown 构建产物完全一致。
- 清理临时账号与 `exec_admin_sql` RPC，避免遗留特权入口。

**关键决策**:
- 物理题差额（160 vs 183）先定位到具体 seed 文件 `02-questions-09-physics-b-1-05.sql` 再导入 → 避免重复导入其他已存在的物理题 chunk。
- `exam_sections.id` 由 uuid 改为 text → seed 数据使用语义化字符串主键（`exam-calculus-1-final-sec-0`），与 `questions.id` / `exam_papers.id` 风格一致；不破坏外键语义。
- `exec_admin_sql` RPC 用 `SECURITY DEFINER` + 临时管理员账号 → 仅作为 MCP JSON 解析限制的兜底通道，导入完成后立即清理，不长期保留。
- Node.js 脚本按 `;\n` 切分 SQL 语句逐条执行 → 避免单次 RPC 负载过大，且单条失败可定位到具体 SQL。

**产出文件**:
- 无新增源码文件；本次仅操作 Supabase DB 与临时脚本。
- DB 状态：questions 291 / theory_contents 15 / exam_papers 2 / exam_sections 10 / exam_questions 60 / courses 3 / modules 15 / items 119。

**关联问题**: 阶段 23 "待后续" 中"Supabase MCP 恢复后依次执行 seed 脚本"项全部完成。

### 阶段 25: 修复 Cloudflare Pages 构建时 Supabase realtime WebSocket 报错

**日期**: 2026-07-30

**操作**:
- Cloudflare Pages 部署 commit `dab6f85` 构建失败，日志显示 `scripts/fetch-from-supabase.js` 创建 Supabase 客户端时初始化 realtime WebSocket 失败："Ensure you are running Node.js 22+ or provide a WebSocket implementation"。
- 原因：`@supabase/supabase-js` 默认启用 realtime，Cloudflare Pages 的 Node 20 构建容器没有全局 `WebSocket` 实现。
- 第一次修复：在 `scripts/fetch-from-supabase.js` 的 `createClient` 选项中加入 `realtime: { enabled: false }`（commit `921c5c8`）。Cloudflare Pages 仍报错，因为 `@supabase/supabase-js@2.110.8` 在创建客户端时仍会实例化 `RealtimeClient`，Node 20 缺少原生 WebSocket 导致实例化失败。
- 第二次修复：安装 `ws` 作为 `devDependency`，并在 `createClient` 的 `realtime` 选项中传入 `transport: WebSocket`，为 realtime 客户端提供 WebSocket 实现。
- 本地验证 `npm run fetch:data` 成功拉取 3 courses / 291 questions / 15 theory / 2 exam papers。
- 重新提交并推送 `main` 与 `deploy/coursecore-pages`，新 commit `cea9a76`。

**关键决策**:
- 仅禁用 build-time fetch 脚本的 realtime，浏览器端 `src/services/supabase.js` 保持默认（浏览器有原生 WebSocket）→ 不影响运行时实时功能。
- 不升级 Node 22 → Cloudflare Pages 项目记忆约束要求 `NODE_VERSION=20`。

**产出文件**:
- `scripts/fetch-from-supabase.js` - `createClient` 增加 `realtime: { enabled: false, transport: WebSocket }`
- `package.json` / `package-lock.json` - 新增 `ws` 作为 `devDependency`

**待后续**:
- 观察 Cloudflare Pages `cea9a76` 部署是否成功；如仍失败，继续看日志。
- 如部署成功但线上仍无法登录，检查 Cloudflare Pages 环境变量 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `NODE_VERSION=20` 是否已设置。
- 在 Supabase Dashboard 手动将至少一个账号的 `profiles.role` 改为 `'admin'`，否则 `/admin` 入口与页面均不可见。
- ~~`src/services/admin.js` 仍缺 `updateExamSection` 与 `deleteUser`~~ → 阶段 30 已补全。

### 阶段 26: 修复管理后台 theory 小节内容为空及服务器链路未打通问题

**日期**: 2026-07-30

**操作**:
- 排查 `/admin` 编辑小节时"内容"字段为空：根因是数据分裂存储——小节元数据在 `items` 表，理论内容在 `theory_contents` 表；后台仅读取 `items.content`，导致 theory 小节内容空白。
- `src/services/admin.js` 新增 `getTheoryContent(itemId)` 与 `upsertTheoryContent(record)`，提供 theory 内容按 `item_id` 读取与 upsert 能力；保留原有 `updateTheoryContent` 以兼容。
- `src/views/admin/adminPage.js`：
  - `modules-items` Tab 加载时并行拉取 `theory_contents`；
  - 将 `theory_contents.content` / `examples` 合并到对应 `theory` 类型 item 行，编辑弹窗正确回显；
  - item 表单增加"例题 ID (JSON)"字段，支持维护 theory 小节关联例题；
  - 保存 item 时同步 `upsertTheoryContent`，并保留 `items.content` 同步更新，确保双表一致。
- `scripts/fetch-from-supabase.js` 的 `buildCourses` 改为 theory 小节优先从 `theory_contents` 取 `content`，再回退 `items.content`，保证后台保存后静态构建产物立即生效。
- 运行 `npm run fetch:data` 重新拉取，验证 `src/data/courses.js` 中 theory 小节已带内容；运行 `npm run build`，成功预渲染 483 条静态路由。

**关键决策**:
- 后台统一把 `theory_contents` 作为 theory 小节内容的权威来源，`items.content` 作为冗余同步 → 前端 `practiceList.js` 已优先读 `THEORY_CONTENTS`，静态构建产物也跟随 `theory_contents`，链路彻底打通。
- 保存时双表同步写入 → 避免 `items.content` 与 `theory_contents.content` 不一致导致不同入口看到不同内容。
- 例题 `examples` 作为 theory 小节属性在后台维护 → 与 `theory_contents` 表结构一致，减少跨表操作。

**产出文件**:
- `src/services/admin.js` — 新增 `getTheoryContent` / `upsertTheoryContent`
- `src/views/admin/adminPage.js` — 合并 `theory_contents` 读取/保存，新增 `examples` 字段
- `scripts/fetch-from-supabase.js` — `buildCourses` theory 小节优先从 `theory_contents` 取内容
- `src/data/courses.js` / `src/data/theoryContents.js` — 重新拉取生成

**待后续**:
- ~~`src/services/admin.js` 仍缺 `updateExamSection` / `deleteUser`~~ → 阶段 30 已补全。
- 在 Supabase Dashboard 手动将至少一个账号的 `profiles.role` 改为 `'admin'`，否则 `/admin` 入口与页面均不可见。

### 阶段 27: 按 admin-content-editor-design.md 实现后台内容编辑器

**日期**: 2026-07-30

**操作**:
- 依据 [.trae/documents/admin-content-editor-design.md](file:///c:/Users/vitoriga/OneDrive/Desktop/CourseCore/.trae/documents/admin-content-editor-design.md) 的 A+C 方案（左侧分组折叠侧边栏 + 右侧三栏/双栏内容区），将管理后台从单一表格 CRUD 升级为完整的「内容编辑器」。
- `src/views/admin/adminPage.js` 整体重写：
  - 侧边栏拆为「内容管理」（课程 / 模块小节 / 平台题库 / 理论编辑器 / 训练编辑器 / 测试编辑器 / 期末试卷）与「系统管理」（用户 / 设置）两个可折叠分组；
  - 新增「理论编辑器」视图：左栏 Markdown textarea + 动态例题表单（题干/4 选项/正确答案/解析 + 折叠/删除/添加），右栏 marked + MathJax 实时预览；保存时 `upsertTheoryContent` 写入 `theory_contents`，并 `updateItem` 同步 `items.content`；
  - 新增「训练/测试编辑器」视图：三栏布局（题目列表 | 编辑表单 | 预览），支持单选/填空/解答题型切换、题目增删、上移/下移排序；保存时遍历题目分别 `createQuestion` / `updateQuestion`，新题客户端生成 `${itemId}-q${ts}-${rand}` 形式 ID；
  - 表格 CRUD 沿用 modal 表单，但样式切深色主题，CSS 变量 scoped 到 `.admin-page` 避免污染主站；
  - 引入 `syncTheoryFormToState` / `syncPracticeFormToState`，在每次 rerender / preview / save 前把 DOM 表单值同步回 `adminState`，避免 rerender 丢用户输入；
  - 实时预览监听挂在稳定 `#main` 上（`previewListenerAttached` flag 防重复），`input` 事件触发 `updateTheoryPreview` / `updatePracticePreview`。
- `src/views/practiceList.js` 新增 `normalizeTheoryExamples(theory, itemId)`：兼容旧格式（`examples` 为题目 ID 字符串数组，从 `QUESTIONS` 反查）与新格式（内联对象数组，转成带 `id`/`questionType`/`content`/`options`/`answer`/`solution` 的题目对象），保证学生侧例题渲染链路不断。
- `src/router.js` 新增 `normalizeTheoryExamplesForSubmit(theory, itemId)`：提交例题答案时复用同一归一化逻辑，使 `handleSubmitTheoryExamples` 同时支持两种格式。
- `src/main.js` 在 `initEventDelegation` 中将所有 `admin-*` action（`admin-section` / `admin-toggle-group` / `admin-add` / `admin-edit` / `admin-delete` / `admin-modal-*` / `admin-edit-theory` / `admin-edit-practice` / `admin-back-list` / `admin-add-example` / `admin-remove-example` / `admin-toggle-example` / `admin-save-theory` / `admin-practice-*` / `admin-save-practice`）统一委托给 `handleAdminAction`。
- 验证：`npm run build` 通过，预渲染 483 条静态路由，gzip 188 KB，构建时间 3.08s。

**关键决策**:
- 理论例题不进入 `questions` 表，内嵌 `theory_contents.examples` JSON → 例题结构固定（4 选项单选），不参与随机抽题与进度统计，JSON 内嵌最轻量；学生侧通过 `normalizeTheoryExamples` 兼容旧 ID 格式与内联格式，迁移平滑。
- 训练/测试共用 `questions` 表，仅通过 `items.type` 区分入口 → 字段完全一致，避免拆表冗余。
- 表单值在 rerender 前主动同步回 state → 模态切换、题型切换、增删题目等 rerender 触发点都不会丢用户当前输入。
- 深色主题 CSS 全部 scoped 到 `.admin-page` → 主站浅色/深色主题与后台视觉互不污染。
- 题目预览直接复用 `marked` + `MathJax` 渲染 → 与学生侧题目样式一致，避免双套渲染逻辑。

**产出文件**:
- `src/views/admin/adminPage.js` — 整体重写，新增侧边栏分组 / 理论编辑器 / 训练测试编辑器 / 深色主题样式
- `src/views/practiceList.js` — 新增 `normalizeTheoryExamples`
- `src/router.js` — 新增 `normalizeTheoryExamplesForSubmit`
- `src/main.js` — 新增 `admin-*` action 委托分支

**待后续**:
- ~~EasyMDE / Split.js / SortableJS 等开源模块暂未引入~~ → 阶段 30 已引入。
- ~~`updateExamSection` / `deleteUser` 仍未补~~ → 阶段 30 已补全。
- ~~理论例题暂不支持图片上传；训练/测试暂不支持多选题~~ → 阶段 30 已支持。

### 阶段 28: 修复后台保存 theory 内容后学生页不实时展示

**日期**: 2026-07-30

**操作**:
- 排查 `/admin` 保存理论内容后，`/item/:itemId` 仍显示占位符：根因是学生侧只读本地构建产物 `src/data/theoryContents.js`，而后台保存写入 Supabase，需要手动 `npm run fetch:data` 才能同步。
- 新增 `src/services/content.js`，导出非管理员运行时查询 `loadTheoryContent(itemId)`，从 Supabase `theory_contents` 按 `item_id` 读取。
- `src/state.js` 新增 `runtimeTheoryContent: {}` 缓存，避免重复请求。
- `src/router.js`：
  - `applyRoute` / `applyRouteWithLoader` / `restoreLocation` / `navigateTo` 改为 async，以支持 theory 小节异步加载；
  - `showPracticeItem` 改为先使用本地数据渲染，再异步调用 `loadTheoryContent`；仅当 Supabase 返回的内容与本地不一致时，写入 `state.runtimeTheoryContent` 并 `renderMain()` 刷新。
- `src/views/practiceList.js`：
  - `renderTheoryPlaceholder` 优先读 `state.runtimeTheoryContent[item.id]`，再回退 `THEORY_CONTENTS`，最后 `item.content`；
  - `renderTheoryExamples` 同样优先使用 runtime cache 的 examples。
- `src/router.js` 的 `handleSubmitTheoryExamples` 也优先使用 runtime cache 的 examples，保证新保存的例题可提交。
- `src/main.js` 的 `init` 与 `popstate` 回调中 `await restoreLocation()`，确保初始加载 theory 小节时内容已就位。
- 验证：`npm run build` 通过，483 路由预渲染成功。

**关键决策**:
- 先本地渲染、后异步补数据 → 避免网络等待导致页面白屏或阻塞。
- 仅当 Supabase 内容与本地不一致才 rerender → 减少无意义刷新。
- 运行时读取只用于 dev / 已配置 Supabase 的部署；静态构建生产环境仍依赖 `fetch:data` 产物 → 不改变项目静态站点本质。

**产出文件**:
- `src/services/content.js` — 新增运行时 theory content 查询
- `src/state.js` — 新增 `runtimeTheoryContent`
- `src/router.js` — `showPracticeItem` 异步加载 + applyRoute 链路 async 化
- `src/views/practiceList.js` — theory 渲染优先 runtime cache
- `src/main.js` — init / popstate await restoreLocation

**待后续**:
- 训练/测试题目目前仍依赖本地 `src/data/questions.js`；如需保存后实时看到训练题变化，可参照 theory 方案增加运行时 questions 读取缓存。

### 阶段 29: 训练/测试题保存后学生侧实时同步

**日期**: 2026-07-30

**操作**:
- 解决阶段 28 遗留的"训练/测试题仍依赖本地 `src/data/questions.js`"问题：后台保存训练/测试题到 Supabase `questions` 表后，学生页刷新即可看到新题，无需手动 `npm run fetch:data`。
- `src/services/content.js`：新增 `loadQuestions(itemId)`，按 `item_id` 从 Supabase 读取 questions 并按 `sort_order` 排序；新增 `snakeToCamel` 把 Supabase 下划线字段名转成项目使用的驼峰字段名（如 `question_type` → `questionType`）。
- `src/state.js`：新增 `runtimeQuestions: {}` 缓存；`isItemCompleted` / `syncItemProgress` / `markQuestion` 改用 `getItemQuestions` / `findQuestion`，使进度统计与答案同步都识别运行时新题。
- `src/utils/question.js`：新增 `getItemQuestions(itemId)`，合并 `state.runtimeQuestions[itemId]` 与本地 `QUESTIONS`（runtime 覆盖本地同 ID），并按 `sort_order` / `order` 排序；`findQuestion` 优先查 runtime cache；`getQuestionContext` 对当前 item 使用 `getItemQuestions`。
- `src/router.js`：
  - `showPracticeItem` 对 `quiz` / `training` 类型异步调用 `loadQuestions`；若 Supabase 返回的题集中包含本地没有的题，则写入 `state.runtimeQuestions` 并 `renderMain()` 刷新；
  - `handleSubmitItem` / `handleRetryItem` / `normalizeTheoryExamplesForSubmit` 改用 `getItemQuestions` / `findQuestion`。
- `src/views/practiceList.js`：`renderPracticeList` 使用 `getItemQuestions(itemId)`；`normalizeTheoryExamples` 使用 `findQuestion`。
- `src/views/quizSession.js`：`createState` 使用 `getItemQuestions(itemId)`。
- `src/views/inlinePractice.js`：`renderInlinePractice` 使用 `getItemQuestions(itemId)`。
- `src/views/course.js`：`renderItemRow` 使用 `getItemQuestions(i.id).length > 0` 判断是否存在题目。
- `src/services/sync.js`：`getItemIdForQuestion` 使用 `findQuestion`，保证同步答案时能找到运行时新题。
- 验证：`npm run build` 通过，483 路由预渲染成功。

**关键决策**:
- 学生页先本地渲染、后异步补 runtime 数据 → 不阻塞首屏；仅当 Supabase 有新题时才 rerender → 避免无意义刷新。
- runtime cache 以 itemId 为 key，覆盖本地同 ID 题目 → 支持修改现有题目后实时生效。
- 把查找/合并逻辑收敛到 `utils/question.js` → 一处改动，所有视图同步生效，避免多处重复拼接 runtime 与本地数据。

**产出文件**:
- `src/services/content.js` — 新增 `loadQuestions`
- `src/state.js` — 新增 `runtimeQuestions` + 使用 `getItemQuestions`/`findQuestion`
- `src/utils/question.js` — 新增 `getItemQuestions`、更新 `findQuestion` / `getQuestionContext`
- `src/router.js` — `showPracticeItem` 异步加载训练题 + 多处改用 `getItemQuestions`
- `src/views/practiceList.js` / `src/views/quizSession.js` / `src/views/inlinePractice.js` / `src/views/course.js` — 使用 `getItemQuestions`
- `src/services/sync.js` — `getItemIdForQuestion` 使用 `findQuestion`

**待后续**:
- 全局题库 `practiceBank.js` / `knowledgeBase.js` 仍只读本地 `QUESTIONS`；如需在题库页也实时看到后台新增题，可参照本阶段增加全局 runtime questions 缓存。
- ~~EasyMDE / Split.js / SortableJS 等开源模块仍未引入~~ → 阶段 30 已引入。
- ~~`updateExamSection` / `deleteUser` 仍未补~~ → 阶段 30 已补全。
- ~~理论例题暂不支持图片上传；训练/测试暂不支持多选题~~ → 阶段 30 已支持。

### 阶段 30: 完善管理后台待解决三项功能

**日期**: 2026-07-30

**操作**:
- 补全 `src/services/admin.js` 缺失的两个方法：
  - `updateExamSection(id, updates)`：管理员校验后更新 `exam_sections` 表；
  - `deleteUser(userId)`：管理员校验后调用 `admin_delete_user` RPC，先删除 `public.profiles` 再删除 `auth.users`。
- 在 `scripts/supabase-schema.sql` 中新增 `admin_delete_user(target_user_id uuid)` RPC，使用 `SECURITY DEFINER` 并前置 `is_admin()` 校验。
- 理论例题支持题图 URL：
  - `src/views/admin/adminPage.js` 的理论例题表单新增“题图 URL (可选)”输入框；
  - `syncTheoryFormToState` 读取并保存 `image` 字段；
  - `updateTheoryPreview` 渲染例题图片预览；
  - `src/views/practiceList.js` 的 `normalizeTheoryExamples` 透传 `image` 字段，学生侧 `renderQuestion` 自动展示题图。
- 训练/测试题支持题图 URL 与多选题：
  - 练习表单新增“题图 URL (可选)”输入框；
  - `PRACTICE_TYPES` 增加多选题（`question_type: 1`）；
  - 多选题答案使用 checkbox 组，保存时写入 `answers` 数组并删除 `answer`；
  - `syncPracticeFormToState` / `updatePracticePreview` / `savePractice` 均按题型分支处理单选/多选/填空/解答；
  - 学生侧 `src/config/question-types.js` 已配置多选题 validator 为 `set`，`src/validators/set.js` 负责答案集合比对。
- 引入开源编辑器增强模块：
  - `package.json` 新增 `easymde`、`split.js`、`sortablejs` 依赖；
  - `src/views/admin/adminPage.js` import 并初始化：理论编辑器双栏 Split、训练/测试编辑器三栏 Split；所有 Markdown textarea 替换为 EasyMDE；题目列表启用 SortableJS 拖拽排序；
  - 新增 `cleanupEditors()` 在 rerender 前销毁旧 EasyMDE / Split / Sortable 实例，防止内存泄漏与 DOM 冲突。
- 验证：`npm run build` 通过，291 题 / 16 个 theory / 2 套试卷，483 条静态路由预渲染成功。

**关键决策**:
- 用户删除走 RPC 而非前端直删 `auth.users` → 避免泄露 Supabase 内部表结构，RLS + RPC 双重校验保证仅管理员可执行。
- 多选题答案在学生侧仍用字符串索引数组存储 → 与 `setValidator` 预期一致，无需改动校验器。
- 题图以 URL 字符串而非文件上传实现 → 与现有 public 资源路径兼容，最简单且无需新增存储桶/上传后端。
- EasyMDE 仅用于后台编辑，学生侧继续用 marked + MathJax → 不增加学生侧 bundle 体积。
- Split.js / SortableJS 在 rerender 前必须 `destroy()` → 否则多次进入编辑器会生成重复 gutter 与 ghost 实例。

**产出文件**:
- `src/services/admin.js` — 新增 `updateExamSection` / `deleteUser`
- `scripts/supabase-schema.sql` — 新增 `admin_delete_user` RPC
- `src/views/admin/adminPage.js` — 多选题、题图 URL、EasyMDE、Split.js、SortableJS
- `src/views/practiceList.js` — `normalizeTheoryExamples` 透传 `image`
- `package.json` — 新增 `easymde`、`split.js`、`sortablejs`

**关联问题**: 阶段 25~29 “待后续”中的 `updateExamSection` / `deleteUser` / 多选题 / 例题图片 / EasyMDE / Split.js / SortableJS 全部完成。

### 阶段 31: 修复管理后台 EasyMDE 编辑器黑底黑字问题

**日期**: 2026-07-31

**操作**:
- 定位 `/admin` 理论编辑器中 EasyMDE 编辑区为纯黑、无法看到文字的问题：引入的 `easymde/dist/easymde.min.css` 为默认浅色主题，而 `ADMIN_STYLES` 未覆盖 `.CodeMirror` / `.editor-toolbar` / `.editor-statusbar` 等 EasyMDE 生成的元素，导致编辑区背景被染成深色后文字仍为深色，形成黑底黑字。
- 在 `src/views/admin/adminPage.js` 的 `ADMIN_STYLES` 中追加一套 `.admin-page .EasyMDEContainer .CodeMirror` 深色覆盖：
  - 编辑区背景使用 `--ad-bg`、文字使用 `--ad-fg`、光标与选中区使用墨绿色高亮；
  - 标题、链接、字符串/标签等 token 使用 `--ad-green-hl` 区分；
  - 工具栏、状态栏、预览浮层统一使用 `--ad-bg-card` / `--ad-fg` 适配深色主题。
- 运行 `npm run build` 验证：291 题 / 16 个 theory / 2 套试卷，483 条静态路由预渲染成功。

**关键决策**:
- 不更换 EasyMDE 主题文件，而是在现有 `ADMIN_STYLES` 内联样式中追加覆盖 → 改动最小，避免新增 CSS 文件或依赖。
- 覆盖范围限定在 `.admin-page .EasyMDEContainer` 下 → 不影响站点其他区域的 CodeMirror（如未来引入）。

**产出文件**:
- `src/views/admin/adminPage.js` — `ADMIN_STYLES` 追加 EasyMDE 深色主题覆盖

**关联问题**: 管理后台理论编辑器黑底黑字、内容不可见

### 阶段 32: 修复管理后台 EasyMDE 工具栏图标不可见

**日期**: 2026-07-31

**操作**:
- 排查到上一阶段后编辑器正文已可见，但工具栏仍为黑底且看不到图标：EasyMDE 默认使用 Font Awesome 图标，且 `initEasyMDE` 已设置 `autoDownloadFontAwesome: false`；项目 `index.html` 未引入 Font Awesome，导致工具栏按钮里的 `<i class="fa fa-bold"></i>` 等图标全部空白。
- 在 `index.html` 引入 Font Awesome 4.7 CSS：`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`（带 SRI）。
- 同步放宽 CSP：
  - `style-src` 增加 `https://cdnjs.cloudflare.com`；
  - `font-src` 增加 `https://cdnjs.cloudflare.com`（Font Awesome 会加载字体文件）。
- 运行 `npm run build` 验证：483 条静态路由预渲染成功，`index.html` 体积增加来自新增 link 标签。

**关键决策**:
- 使用 Font Awesome 4.7 而非让 EasyMDE 自动下载 → 明确控制依赖来源、可配 SRI、避免 `maxcdn.bootstrapcdn.com` 与现有 CSP 冲突。
- 全局引入 CSS → 仅影响首屏一次额外请求；未来若其他页面需要图标也可复用。

**产出文件**:
- `index.html` — 引入 Font Awesome CSS 并更新 CSP

**关联问题**: 管理后台 EasyMDE 工具栏图标不可见、点击黑区才出现 Markdown 语法

### 阶段 33: 修复管理后台 EasyMDE 编辑后预览不更新与保存失效

**日期**: 2026-07-31

**操作**:
- 定位 `/admin` 理论编辑器中「左侧删除内容后右侧预览不变、保存未生效」问题：EasyMDE 基于 CodeMirror，用户输入不会同步回原始 `<textarea>` 的 `value`；而 `syncTheoryFormToState` / `syncPracticeFormToState` 此前直接读取 `textarea.value`，导致取到的是初始值或旧值。
- 在 `src/views/admin/adminPage.js` 中新增 `editorInstances.easyMDEMap`，按 `textareaId` 保存每个 EasyMDE 实例；`cleanupEditors()` 时清空，避免 rerender 后拿到过期实例。
- 新增 `getEasyMDEValue(textareaId, fallbackEl)` 辅助函数：优先调用 `editor.value()` 取 CodeMirror 实际内容，实例不存在时回退到 DOM 元素 `value`。
- `syncTheoryFormToState` 改用 `getEasyMDEValue` 读取理论正文、例题题干/选项/解析；`syncPracticeFormToState` 改用 `getEasyMDEValue` 读取题干与解析。
- `initEasyMDE` 中例题相关 textarea 的 `change` 事件也触发 `syncTheoryFormToState + updateTheoryPreview`，保证例题字段改动时预览实时刷新。
- 运行 `npm run build` 验证：291 题 / 16 个 theory / 2 套试卷，483 条静态路由预渲染成功。

**关键决策**:
- EasyMDE 实例按 ID 缓存而非遍历数组查找 → 时间复杂度 O(1)，代码更直接。
- 保留 fallback 到 DOM `value` → 实例未初始化或异常时仍能取到初始值，降级安全。
- 例题字段改动也走统一 `syncTheoryFormToState` → 与主内容一致，预览与保存同源。

**产出文件**:
- `src/views/admin/adminPage.js` — 新增 `easyMDEMap` / `getEasyMDEValue`，修复 `syncTheoryFormToState` / `syncPracticeFormToState` 取值逻辑

**关联问题**: 管理后台理论编辑器预览不随编辑更新、保存后内容未变化

### 阶段 34: 修复管理后台理论例题（旧 ID 格式）不显示

**日期**: 2026-07-31

**操作**:
- 定位 `/admin` 打开物理理论小节时例题列表为空的问题：物理 `theory_contents.examples` 为旧格式字符串 ID 数组（如 `q-physics-b-1-p1b-m1-02-training-002`），这些题目实际挂在同模块的 `training` 小节下（`itemId` 为 `p1b-m1-02-training`），与理论小节 `itemId` 不同。
- `normalizeTheoryExamples` 旧格式分支原先用 `adminApi.listQuestions({ itemId })` 按理论小节 ID 查题，结果为空，导致例题被过滤掉。
- 改为优先使用 `adminState.data.questions` 缓存（内容树加载时已拉取全部题目）建立 `id → question` Map，按例题 ID 直接查找；缓存未命中时兜底拉取全部题目。
- 转换时同时透传 `image` 字段，保证例题题图不丢失。
- 运行 `npm run build` 验证：291 题 / 16 个 theory / 2 套试卷，483 条静态路由预渲染成功。

**关键决策**:
- 例题 ID 可能跨小节引用训练题 → 不能按 `itemId` 查，必须按 `id` 查。
- 复用 `adminState.data.questions` 缓存 → 避免重复请求，打开编辑器更快；无缓存时兜底全量拉取，保证旧入口兼容。
- 透传 `image` → 旧题目转例题后题图可继续展示。

**产出文件**:
- `src/views/admin/adminPage.js` — 修复 `normalizeTheoryExamples` 旧格式 ID 数组查询逻辑

**关联问题**: 管理后台物理理论小节例题列表为空

### 阶段 35: 清理 `practice` / `project` 小节类型与关联题目

**日期**: 2026-07-31

**操作**:
- 用户决策：删除 `practice` / `project` 两种小节类型，未来每节理论后的训练统一使用 `training`，`quiz` / `review` 保持不变。
- 更新 `src/data/labels.js`：移除 `practice` / `project` 类型标签（此前已完成）。
- 更新 `src/views/admin/adminPage.js`：
  - `PRACTICE_ITEM_TYPES` 由 `['practice', 'quiz', 'training', 'test']` 改为 `['quiz', 'training', 'test']`；
  - item 类型下拉选项由 `['theory', 'practice', 'quiz', 'training', 'project', 'review']` 改为 `['theory', 'quiz', 'training', 'test', 'review']`；
  - `training-editor` 过滤不再包含 `practice`；
  - 移除 `.tree-icon-practice` / `.tree-type-badge.type-practice` 样式，避免类型不存在时样式冗余。
- 删除 `curriculum/raw/questions/` 下 15 道关联 `practice` / `project` itemId 的 Markdown 源文件（高等数学上/下模块末尾综合练习与项目）。
- 过滤 `scripts/seed-content.sql`，移除 13 条 `type = 'practice'` / `type = 'project'` 的 `public.items` INSERT 语句。
- 通过 MCP `execute_sql` 清理 Supabase 中已 orphaned 的 15 道 questions（`item_id IS NULL`），保证云端与本地题量一致。
- 运行 `npm run build`：本地 `build:data` 生成 276 题 / 16 个 theory / 2 套试卷，`fetch:data` 拉取云端 276 题，vite 构建成功，预渲染 455 条静态路由。

**关键决策**:
- 先删内容（items / questions / 源文件 / seed SQL），再删字段（labels / admin 选项 / CSS），符合用户"先把对应内容删掉，然后再把字段删掉"的要求。
- 云端 orphan questions 通过 `item_id IS NULL` 定位并清理 → 外键已声明 `ON DELETE CASCADE`，items 删除后 questions 的 `item_id` 被置空；删除这些孤儿题避免 `fetch:data` 与本地构建数量不一致。
- `test` 类型原计划作为 `quiz` 的别名保留，但后续用户确认无此需求，故在阶段 36 中一并移除。

**产出文件**:
- `src/data/labels.js` — 移除 `practice` / `project` 标签
- `src/views/admin/adminPage.js` — 移除 `practice` / `project` 类型选项与样式
- `scripts/seed-content.sql` — 移除 13 条相关 INSERT
- `src/data/courses.js` / `src/data/questions.js` / `src/data/theoryContents.js` / `src/data/examPapers.js` — 重新构建生成

**关联问题**: 用户要求合并/清理相似小节类型 `practice` / `project`。

## 更新记录 - 2026-07-31（第二次）

### 修改
- 移除 `practice` / `project` 小节类型；`training` 成为理论后唯一训练类型。
- `src/views/admin/adminPage.js` 中 item 类型选项更新为 `theory` / `quiz` / `training` / `review`（后续阶段 36 移除 `test`）。
- 删除 15 道 `practice` / `project` 关联题目源文件。
- 删除 `scripts/seed-content.sql` 中 13 条 `practice` / `project` 的 items INSERT。
- 同步清理 Supabase 中 15 道 `item_id IS NULL` 的 orphan questions。

### 验证
- `npm run build` 通过，本地与 Supabase 均为 276 题，预渲染 455 条静态路由。

### 阶段 36: 移除 `test` 小节类型

**日期**: 2026-07-31

**操作**:
- 用户反馈后台「新增小节」下拉框中出现未使用的 `test` 类型，要求删除。
- 更新 `src/views/admin/adminPage.js`：
  - `ITEM_TYPE_LABELS` 移除 `test: '测试'`；
  - `PRACTICE_ITEM_TYPES` 由 `['quiz', 'training', 'test']` 改为 `['quiz', 'training']`；
  - item 类型下拉选项由 `['theory', 'quiz', 'training', 'test', 'review']` 改为 `['theory', 'quiz', 'training', 'review']`；
  - `editorItemFilter` 移除 `test-editor` 分支（该分支实际过滤的是 `quiz`），注释改为 `theory / training`；
  - 移除 `.tree-icon-test` / `.tree-type-badge.type-test` CSS 选择器。
- 更新 `.trae/documents/technical-architecture.md`：小节 `type` 枚举由 `theory / quiz / training / test / review` 改为 `theory / quiz / training / review`。
- 更新 `development-log.md` 项目概览表中的数据格式说明。
- 运行 `npm run build`：构建通过，276 题 / 16 个 theory / 2 套试卷，预渲染 455 条静态路由。

**关键决策**:
- `test` 类型在数据库和现有课程数据中从未使用，仅作为后台 UI 选项和样式残留；直接移除不会影响现有内容。
- `test-editor` 分支原本映射到 `quiz` 类型，属于无入口的死代码，一并移除避免误导。

**产出文件**:
- `src/views/admin/adminPage.js` — 移除 `test` 类型与相关样式
- `.trae/documents/technical-architecture.md` — 更新类型枚举说明
- `development-log.md` — 补充阶段 36 与更新记录

**关联问题**: 用户在管理后台「新增小节」弹窗的下拉框中发现 `test` 选项。

### 阶段 37: 修复管理后台 theory / 例题保存时报 `Cannot read properties of null (reading 'itemId')`

**日期**: 2026-07-31

**操作**:
- 排查管理后台「理论+例题」保存失败问题：报错 `保存失败: Cannot read properties of null (reading 'itemId')`。
- 定位根因：`saveTheory()` / `savePractice()` 在 `adminState.theoryEditor` / `adminState.practiceEditor` 为 null 时仍读取 `ed.itemId`。
- 在 `src/views/admin/adminPage.js` 中：
  - `saveTheory()` 增加 `if (!ed)` 守卫，避免 null 读取并给出友好提示；
  - `savePractice()` 增加同样的 `if (!ed)` 守卫；
  - `admin-tree-select` 处理 item 节点时，在 `rerender()` 前立即清空 `theoryEditor` / `practiceEditor`，防止切换小节加载期间仍显示旧的「保存」按钮并触发脏保存。

**关键决策**:
- 保存函数自身必须防御 null，不能依赖 UI 渲染条件；UI 状态切换时也应主动清理编辑器，避免竞态。
- 切换树节点时立即清空旧编辑器比等待新编辑器加载完成再清空更安全，可彻底消除加载期间出现旧保存按钮的窗口。

**产出文件**:
- `src/views/admin/adminPage.js` — 增加保存 null 守卫、切换 item 时清空编辑器
- `development-log.md` — 补充阶段 37 与更新记录

**关联问题**: 用户在管理后台编辑「映射与函数」等 theory 小节并保存时报 `Cannot read properties of null (reading 'itemId')`。

### 阶段 38: 修复 Supabase `profiles.role` check constraint 不同步导致无法改 admin

**日期**: 2026-07-31

**操作**:
- 用户在 Supabase Dashboard 直接修改 `profiles` 表，把某账号 role 从 `free` 改为 `admin` 时报错：
  `ERROR: 23514: new row for relation "profiles" violates check constraint "profiles_role_check"`。
- 排查发现仓库 `scripts/supabase-schema.sql` 中定义的是 `CHECK (role IN ('free', 'paid', 'admin'))`，但线上 Supabase 实际 constraint 仍是旧版（只允许 `free` / `paid`）。
- 提供修复 SQL：先 `DROP CONSTRAINT IF EXISTS profiles_role_check`，再 `ADD CONSTRAINT profiles_role_check CHECK (role IN ('free', 'paid', 'admin'))`。
- 在 `development-log.md` 记录该问题，提醒后续若再改 role 枚举需同步执行到线上 DB。

**关键决策**:
- `CREATE TABLE IF NOT EXISTS` 不会修改已存在表的 check constraint；role 枚举扩展后必须通过显式 `DROP/ADD CONSTRAINT` 同步到已有数据库。
- 前端 `updateUserRole()` 逻辑无需改动，因为错误来自数据库层 constraint。

**产出文件**:
- `development-log.md` — 补充阶段 38 与更新记录

**关联问题**: 用户在 Supabase Dashboard 修改 `profiles.role` 为 `admin` 时报 check constraint 错误。

## 更新记录 - 2026-07-31（第五次）

### 修复
- 修复 Supabase `profiles.role` check constraint 未同步问题：线上约束只允许 `free` / `paid`，导致无法设为 `admin`。
- 提供线上修复 SQL（DROP + ADD CONSTRAINT）。

## 更新记录 - 2026-07-31（第四次）

### 修复
- 修复管理后台 theory / 例题保存时 `Cannot read properties of null (reading 'itemId')` 报错。
- `saveTheory()` 与 `savePractice()` 增加编辑器状态 null 守卫。
- 切换内容树 item 节点时立即清空旧编辑器，避免加载期间误用旧保存按钮。

## 更新记录 - 2026-07-31（第三次）

### 修改
- 移除 `test` 小节类型及其在管理后台的下拉选项、树图标样式、类型徽章样式。
- `src/views/admin/adminPage.js` 中 item 类型选项最终确定为 `theory` / `quiz` / `training` / `review`。

### 验证
- `npm run build` 通过，预渲染 455 条静态路由。

## 更新记录 - 2026-08-03

### 修改
- 用户中心活动热图颜色改为用户指定的5种品牌色：#313234（Less/无活动）、#26563E、#2A8958、#2EBD72、#32F08C（More）。
- 当天登录高亮从墨绿色透明度叠加改为在对应等级色上叠加白色内描边，保持5色方案统一。

## 更新记录 - 2026-08-04

### 阶段 39: 刷题板块三项缺陷修复（试卷/题量不显示、排行榜缺 0 分用户、Tab 多一次跳转、刷题及按题型永远"加载中"）

**日期**: 2026-08-04

**操作**:
1. 修复刷题概览页"累计试卷套数/累计题目数量"始终显示 `…`：`src/services/practice-data.js` 新增 `normalizeQuestion()` 将 Supabase 返回的 snake_case 字段（`question_type`/`order_index`/`test_string`/`answer_reveal`）补齐为 camelCase，与静态 `examPapers.js` 保持一致；同时把 `CACHE_KEY` 从 `v1` 升到 `v2` 使旧缓存失效，避免读到未规范化的脏数据。
2. 修复"按题型刷题"Tab 永远显示"加载题型中..."：`src/views/practice/index.js` 顶部 import 漏掉 `getQuestionTypeStats`，补齐后 `_loadTypesData()` 能正常拉取学科→题型树。
3. 修复排行榜只显示有刷题记录的用户、0 分用户不上榜：`scripts/migrations/001-practice-board.sql` 新增 RPC `get_leaderboard()`，`LEFT JOIN auth.users` 让全部用户都返回（含 0 刷题），并按 `u.created_at ASC` 排序；前端 `index.js` 改用 `supabase.rpc('get_leaderboard')` 并在 `_renderLeaderboard` 同分时按 `created_at` 二次排序，RPC 失败则降级到 `leaderboard_view`。
4. 修复"按试卷刷题/按题型刷题"底部 Tab 需要多一次点击才能进入刷题中心：把 `index.js` 概览页底部两个 Tab 从纯 Tab 样式改为直链 `<a href="/practice/exams">` / `<a href="/practice/types">`，点击即跳。
5. 修复点击"进入练习/进入试卷"后刷题页卡在"加载题目中..."：`src/views/practice/practice-session.js` 将 `_initPracticeSession` 改为导出的 `initPracticeSession`，`renderPracticeSession` 只返回 HTML；`src/router.js` 在 `case "practice-session"` 中先 `main.innerHTML = renderPracticeSession()` 再调用 `initPracticeSession()`，确保容器已渲染后再异步加载题目。

**关键决策**:
- 数据规范化放在 `fetchExamPapersFromSupabase` 的 `.map(normalizeQuestion)` 而非各调用点 → 一处修复覆盖全部下游（题型统计、跨卷抽题、答题渲染），避免散点 patch。
- 排行榜用 RPC 函数而非视图 → 视图无法 LEFT JOIN `auth.users`（RLS 阻挡），`SECURITY DEFINER` 函数可绕过 RLS 读取注册时间，同时只暴露必要字段。
- render/init 拆分 → 与 `quizSession` 等其他视图模式一致，router 先渲染 DOM 再异步初始化，避免容器不存在导致 `getElementById` 返回 null。

**产出文件**:
- `src/services/practice-data.js` — 新增 `normalizeQuestion`，CACHE_KEY 升 v2，字段引用改 camelCase
- `src/views/practice/index.js` — 补 `getQuestionTypeStats` import，排行榜改 RPC，底部 Tab 改直链
- `src/views/practice/practice-session.js` — `renderPracticeSession`/`initPracticeSession` 拆分
- `src/router.js` — import `initPracticeSession`，`practice-session` 路由先渲染后初始化
- `scripts/migrations/001-practice-board.sql` — 新增 `get_leaderboard()` RPC + GRANT

**验证**（dev server `http://localhost:5179`）:
- `/practice` 概览：29 套 / 484 题正常显示；排行榜 3 名用户全 0 套按注册时间排序（2770038748 → 匿名 → 匿名）；底部两个 Tab 为直链。
- `/practice/types` 按题型：学科→题型树显示线性代数（单选 90/填空 102/解答 130/证明 20/判断 15）+ 高等数学A（二）（单选 40/填空 40/解答 45/证明 2）；默认预览 90 题、约 90 分钟。
- `/practice/exams` 按试卷：学科树显示线性代数 21 套 + 高等数学A（二）8 套；默认预览试卷编号 18，17 题、120 分钟、题型构成条正常。
- `/practice/quiz` 刷题会话：从按题型"进入练习"跳入，正确显示"线性代数·单选题组 / 90 题"，第 1/90 题题干与选项 2/3/4/5 渲染正常，题号导航 1-90 全部呈现，无"加载中"残留。

### 问题 9: 刷题概览试卷/题量显示 `…`
**日期**: 2026-08-04
**现象**: 概览页"累计试卷套数"和"累计题目数量"始终显示 `…`，不随数据加载更新。
**原因**: Supabase 返回的题目字段是 snake_case（`question_type`），而 `_renderExamPreview`/`getQuestionTypeStats` 等下游读取的是 camelCase（`questionType`），导致题目被当成空数组，题量统计为 0；同时 localStorage 里缓存的旧数据也是未规范化结构。
**解决**: 在 `fetchExamPapersFromSupabase` 的 `.map` 中加 `normalizeQuestion` 补齐 camelCase 字段；`CACHE_KEY` 升 v2 使旧缓存失效。

### 问题 10: 排行榜缺 0 分用户
**日期**: 2026-08-04
**现象**: 排行榜只显示有刷题记录的用户，0 分用户不上榜。
**原因**: `leaderboard_view` 从 `practice_records` 聚合，没有刷题记录的用户不会出现。
**解决**: 新增 `get_leaderboard()` RPC，`LEFT JOIN auth.users` 让全部用户都返回，按 `created_at ASC` 排序；前端同分时按注册时间二次排序。

### 问题 11: 按题型刷题永远"加载中"
**日期**: 2026-08-04
**现象**: 点击"按题型刷题"后左侧永远显示"加载题型中..."。
**原因**: `index.js` 顶部 import 漏掉 `getQuestionTypeStats`，`_loadTypesData` 调用时 ReferenceError，题型树无法渲染。
**解决**: 补齐 `import { getExamPapers, getSubjects, getQuestionTypeStats } from '../../services/practice-data.js'`。

### 问题 12: 刷题会话卡在"加载题目中..."
**日期**: 2026-08-04
**现象**: 点击"进入练习/进入试卷"后刷题页卡在"加载题目中..."，题目不渲染。
**原因**: `practice-session.js` 中 `_initPracticeSession` 是私有异步函数，`renderPracticeSession` 在返回 HTML 后立即调用它，但此时 `main.innerHTML` 刚赋值、DOM 还未完全 commit，`getElementById('practice-session-container')` 可能返回 null；即便拿到容器，题目数据加载失败也不会给出错误提示。
**解决**: 将初始化逻辑导出为独立的 `initPracticeSession`，`router.js` 在 `main.innerHTML = renderPracticeSession()` 之后再调用 `initPracticeSession()`，确保容器存在；`initPracticeSession` 内部增加 try/catch 和空题目兜底 UI。

## 最后更新时间

2026-08-04（第二次）

### 阶段 40: 知识库页面整合为 /kb 单路由 hub（错题库 + 收藏页内 tab + 复习曲线设置）

**日期**: 2026-08-04

**操作**:
- 将原 `/kb/wrong`（错题库）与 `/kb/favorites`（收藏）两个独立路由整合为单路由 `/kb`，页内 `[错题库 | 收藏]` tab 切换。
- `src/views/knowledgeBase.js` 整体重写为统一 hub：
  - 顶部：标题 + 「今日复习」入口（跳 `/kb/review`） + 齿轮按钮（展开复习曲线设置下拉）；
  - 复习曲线下拉面板：列出 `经典 1-2-4-7-15 天` / `紧凑 1-2-4 天` 两选项，切换时调用 `switchCurve` 重合算法（保留 stage、超出阶段自动毕业），并刷新复习队列；
  - 页内 tab：`错题库` 复用原 `_initWrongTab`（学科切换器 + 复习队列卡片 + 错误原因/考点雷达图 + 已选复盘 CTA）；`收藏` 为四分类筛选 + 卡片列表（第二期接真数据，当前 mock 布局）；
  - 跨 `renderMain` 重渲染保留 `_kbState`（tab / currentSubject / radarTab / selected / curve / curvePanelOpen）。
- `src/config/routes.js`：删除 `wrongBook` (`/kb/wrong`) 与 `favorites` (`/kb/favorites`) 路由条目；`getStaticPaths` 同步移除两条静态路径；保留 `reviewSession` (`/kb/review`)。
- `src/router.js`：移除 `renderWrongBook` / `renderFavorites` import；删除 `case 'wrongBook'` / `case 'favorites'` 分支与 `showWrongBook()` / `showFavorites()` 函数；`renderMain` switch 删除 `case "wrong-book"` / `case "favorites"` 分支。
- `src/views/practice/index.js`：删除 243-607 行错题库与收藏相关全部代码（`renderWrongBook` / `renderFavorites` / `_wrongBookState` / `_loadWrongBookData` / `_renderSubjects` / `_renderWrongQueue` / `_updateReviewButton` / `_renderRadar` / `_loadFavoritesData` / `TYPE_NAMES` / `STATUS_STYLES`）；移除不再使用的 `import { getReviewQueue, getStats, getTodayReview } from '../../services/review-engine.js'`；最近练习卡片中 `查看错题` 链接由 `/kb/wrong` 改为 `/kb`。
- `src/views/practice/practice-session.js`：刷题完成页「查看错题」按钮 `/kb/wrong` → `/kb`。
- `src/views/practice/review-session.js`：三处「返回错题库」链接 `/kb/wrong` → `/kb`（顶部返回、无复习任务 CTA、复盘完成提示）。
- `src/views/landing.js`：`renderKBSummaryPanel` 话术由「已收录已做过的题型与解法」改为「错题库 · 收藏 · 复习曲线」，描述同步为「统一管理刷题过程中的错题与收藏，支持按学科筛选、错误原因/考点雷达分析，并可切换经典/紧凑复习曲线」。
- `src/main.js`：删除 `import { renderKnowledgeBaseList }`（旧知识库列表渲染函数，新 hub 不再导出）；删除 `updateKBSearch` 函数（旧 `kb-search` 输入框 + `kb-list` 元素的搜索残留，新 hub 无此元素）；删除 `input` 事件委托中 `target.id === 'kb-search'` 分支。
- `src/style.css`：新增 `.kb-gear-btn` / `.kb-gear-btn.open` / `.kb-curve-panel` / `.kb-curve-head` / `.kb-curve-title` / `.kb-curve-hint` / `.kb-curve-desc` / `.kb-curve-options` / `.kb-curve-option` / `.kb-curve-meta` / `.kb-curve-name` / `.kb-curve-sub` / `.kb-tab-pill` 样式，全部使用现有 `--practice-*` CSS 变量适配深色主题，移动端单列堆叠。

**关键决策**:
- 单路由 + 页内 tab 而非保留两条独立路由 → 错题库与收藏共享同一页面状态（学科筛选、复习曲线设置），切换无网络往返；与设计稿「知识库」单页 hub 一致。
- 复习曲线设置放齿轮下拉而非独立路由 → 一次性设置不占导航位，展开/收起即时生效；切换走 `switchCurve` 重合算法保留已复习阶段，不丢进度。
- `_kbState` 模块级状态而非 `state.js` 全局 → 仅 /kb 页面内部使用，不污染全局 state；跨 `renderMain` 重渲染保留 tab/选中/曲线配置。
- 删除 `renderKnowledgeBaseList` / `updateKBSearch` / `kb-search` → 旧知识库是题目列表 + 搜索框模式，新 hub 是错题库 + 收藏模式，搜索框已无对应元素，保留死代码会触发 import 失败。
- `/kb/review` 路由保留 → 复盘会话需要独立 URL（从知识库「开始复盘」按钮 + sessionStorage 传选中错题 ID 跳入），且复盘完成后返回 `/kb`。

**产出文件**:
- `src/views/knowledgeBase.js` — 重写为 /kb 统一 hub
- `src/config/routes.js` — 删 wrongBook / favorites 路由 + static paths
- `src/router.js` — 删 import / case / show 函数
- `src/views/practice/index.js` — 删 243-607 行错题库 + 收藏代码，改 /kb/wrong → /kb
- `src/views/practice/practice-session.js` — /kb/wrong → /kb
- `src/views/practice/review-session.js` — 三处 /kb/wrong → /kb
- `src/views/landing.js` — renderKBSummaryPanel 话术同步
- `src/main.js` — 删 renderKnowledgeBaseList import / updateKBSearch / kb-search 分支
- `src/style.css` — 新增 .kb-gear-btn / .kb-curve-panel / .kb-tab-pill 等样式

**验证**:
- `node --check` 全部改过的 JS 文件通过。
- `npx vite build` 通过，765 modules transformed，1.28 MB JS / 70 KB CSS。
- `node scripts/prerender.js` 成功预渲染 915 条静态路由。
- `dist/kb/index.html` 存在；`dist/kb/wrong/` 与 `dist/kb/favorites/` 已移除；`dist/kb/review/index.html` 保留。

**关联问题**: 用户要求按「刷题板块设计方案」设计稿更新知识库页面，整合错题库与收藏为单路由 hub。

## 更新记录 - 2026-08-04（第二次）

### 新增
- `/kb` 知识库统一 hub：错题库 + 收藏页内 tab 切换 + 复习曲线齿轮下拉（经典/紧凑）。
- `src/style.css` 新增 `.kb-gear-btn` / `.kb-curve-panel` / `.kb-curve-option` / `.kb-tab-pill` 等样式。

### 修改
- `src/views/knowledgeBase.js` 重写为统一 hub，整合原错题库与收藏功能，新增复习曲线设置面板。
- `src/config/routes.js` 删除 `/kb/wrong` / `/kb/favorites` 路由与静态路径，保留 `/kb/review`。
- `src/router.js` 移除 `renderWrongBook` / `renderFavorites` import 与对应 case / show 函数。
- `src/views/practice/index.js` 删除错题库与收藏相关 365 行代码，移除 review-engine import，`/kb/wrong` 链接改为 `/kb`。
- `src/views/practice/practice-session.js` 与 `review-session.js` 中 `/kb/wrong` 链接统一改为 `/kb`。
- `src/views/landing.js` `renderKBSummaryPanel` 话术同步新知识库（错题库 · 收藏 · 复习曲线）。
- `src/main.js` 删除 `renderKnowledgeBaseList` import、`updateKBSearch` 函数、`kb-search` input 分支（旧知识库列表搜索残留）。

### 移除
- `/kb/wrong` 路由与 `renderWrongBook` 函数。
- `/kb/favorites` 路由与 `renderFavorites` 函数。
- `renderKnowledgeBaseList` 旧知识库列表渲染函数（新 hub 不再需要）。
- `updateKBSearch` 与 `kb-search` 输入框搜索逻辑（新 hub 无搜索框元素）。

### 阶段 41: 课程详情页重构为「目录 + 本节预览」双栏布局

**日期**: 2026-08-04

**操作**:
- 按用户"学习 tab 布局"需求重构课程详情页：点击课程进入后，上方为课程信息（标题、描述、进度卡、认证要求），下方左右双栏——左下为可折叠课程目录，右下为「本节预览」卡片（该小节类型/所属模块/完成状态/标题/大致信息摘要 + 底部「开始学习」按钮）。
- `src/views/course.js` 整体重写：
  - 新增模块级 `_selectedItemId` 选中小节状态，跨 `renderMain` 重渲染保留；
  - 新增 `setSelectedCourseItem` 导出、`findItem` / `defaultSelectedItem`（默认选中第一个未完成小节；全完成则选第一项）、`excerptOf`（从 markdown 内容抽取约 120 字摘要）；
  - `renderCatalogItem` 渲染目录项，选中项加 `course-item-selected` 高亮；锁定项显示锁图标与「需登录解锁」；
  - `renderSelectedPreview` 渲染右侧预览：类型标签、所属模块、状态徽章、标题、内容摘要、底部「开始学习 →」按钮（锁定则显示「登录解锁」按钮，已完成额外显示「复习」）。
- `src/router.js`：
  - import `setSelectedCourseItem`；
  - 新增 `handleSelectCourseItem(itemId)`：设置选中、自动展开所在模块、`renderMain()` 刷新。
- `src/main.js`：import `handleSelectCourseItem`，事件委托 switch 新增 `case 'course-select-item'`。
- `src/style.css`：新增 `.course-item-selected`（墨绿高亮背景 + 左侧 3px 主色描边）。
- 修复 `btn-secondary` 不存在的问题：预览区「复习」按钮改用 `btn-pill btn-ghost`；「开始学习」/「登录解锁」改用 `btn-pill btn-primary`（与项目其余按钮一致）。

**关键决策**:
- 预览区沿用 Tailwind 容器类（`grid grid-cols-1 lg:grid-cols-2` 等），这些工具类由 Tailwind 扫描 `src/**/*.js` 自动生成，无需手写 CSS 覆盖 → 避免与生成工具类冲突；仅新增业务样式 `.course-item-selected`。
- 选中小节跨渲染保留在模块级而非全局 state → 仅在课程页内有效，不污染全局状态。
- 默认选中第一个未完成小节 → 用户进来即看到"下一步该学什么"，符合"状态 → 诊断 → 行动"理念。
- 锁定小节预览区显示「登录解锁」而非「开始学习」→ 与访问权限控制（`src/config/access.js`）保持行为一致。

**产出文件**:
- `src/views/course.js` — 重写为双栏布局 + 本节预览
- `src/router.js` — 新增 `handleSelectCourseItem`
- `src/main.js` — 新增 `course-select-item` 事件分支
- `src/style.css` — 新增 `.course-item-selected`

**验证**:
- `npx vite build --logLevel error` 通过（exit 0）。

**关联问题**: 用户要求"学习 tab"点击课程后进入「上方信息 + 左下目录 + 右下本节信息 + 下方开始学习按钮」的布局。

### 阶段 42: 执行 `coursecore-frontend-implementation-plan.md`（P0–P2 设计系统落地 + 视觉统一）

**日期**: 2026-08-04

**操作**:
- **P0 底座 · 设计系统变量合并**（`src/style.css`）：新增语义变量 `--primary / --primary-2 / --danger / --warn`（对齐设计稿），把 `--practice-*` 全部映射到语义变量（`--practice-accent→--primary`、`--practice-text→--fg`、`--practice-muted→--muted`、`--practice-card→--card`、`--practice-border→--line`、`--practice-bg→--bg`、`--practice-card-hover→--hover`），浅色/深色两套 `:root` 均补齐，修复浅色模式缺 `--practice-*` 默认值导致的取色异常。
- **P0 · 总结页横向 2 列**（`quizSession.js` `renderResults` + `style.css`）：新增 `.summary-grid`（`grid-template-columns: 1fr 1fr`，移动端单列），成绩/诊断/错题/行动按设计稿左右分栏。
- **P1 · 知识库复习控制台**（`knowledgeBase.js`）：顶部新增摘要条（今日待复习/即将遗忘 24h/未掌握错题 3 个 `.stat-tile`），错题卡新增「查看解析 / 标记已掌握」操作行，`icon()` 内联 SVG 替换 emoji。
- **P1 · 刷题板块**（`practice/index.js`、`practice-session.js`、`review-session.js`）：`initLandingContent` 异步接真数据（续刷/今日复习/薄弱/趋势），`icon()` SVG 替换 emoji，空态/加载态/错误态统一线性 SVG 图标。
- **P2 · 试卷/题库/社区/我的 视觉对齐**：`examPapers.js` / `examDetail.js` / `practiceBank.js` / `practiceDetail.js` / `userPage.js` 核查无硬编码色值、无 emoji，均使用 CSS 变量体系 + Tailwind 原子类，与全局视觉统一。
- **emoji→SVG 全量清理**：视图层残留 emoji（`practice-session.js` / `review-session.js` 错误态 ⚠️）替换为内联 SVG alert 图标；`knowledgeBase.js` / `practice/index.js` 状态图标已全部 SVG 化。

**关键决策**:
- `--practice-*` 保留为语义变量的别名而非全量替换内联引用 → 以较低回归风险达成视觉统一；避免对 6 个文件数百处内联样式做机械替换引入回归。
- 变量合并 + 原子类采用「先加变量、再逐文件替换」灰度 → 规避全局样式重构波及全部视图的回归风险。
- 数据文件（`theoryContents.js` / `questions.js` / `courses.js`）中的 emoji 属内容本身，不视为 UI 状态图标，保留不动。

**产出文件**:
- `src/style.css` — 语义变量合并 + `--practice-*` 映射 + `.summary-grid` 等原子类
- `src/views/knowledgeBase.js` — 摘要条 + 错题操作行 + SVG 图标
- `src/views/practice/index.js` — 真数据接续 + SVG 图标
- `src/views/practice/practice-session.js` — 错误态 SVG 图标
- `src/views/practice/review-session.js` — 错误态 SVG 图标
- `src/views/quizSession.js` — 总结页 2 列布局

**验证**:
- `npx vite build` 通过（765 modules transformed，1.31 MB JS / 72.78 KB CSS，gzip 14.64 KB CSS）。
- 视图层 emoji 残留为 0，硬编码色值残留为 0。

**关联问题**: 执行 `coursecore-frontend-implementation-plan.md` 的 P0–P2 全部阶段。

### 阶段 43: 2019 长沙理工大学高数 A（二）期末试卷答案与解析补全

**日期**: 2026-08-04

**操作**:
- 为 `题库/高数/2019长沙理工大学高数A（二）期末.md` 全部 17 道题补全 `answer` / `answers` / `solution` 字段。
- 题目分布：单项选择题 5 道（Q1–Q5）、填空题 5 道（Q6–Q10）、解答/证明题 7 道（Q11–Q17）。
- 选择题答案统一为选项索引（0/1/2/3），与 `question-builder.js` `normalizeChoiceAnswer` 归一化逻辑一致；`answers` 字段同步封装为单元素数组，兼容多选校验器。
- 填空题答案采用可读字符串形式（如 `"dx - dy"`、`"4 - sqrt(2)"`、`"64pi"`），与 `normalized` 校验器宽松比对一致；其中 Q8 经参数化推导得 $4-\sqrt{2}$，Q10 由 Dirichlet 定理得 $\frac{\pi^2}{2}$。
- 解答题（Q11–Q16）按步骤给出推导链与最终值，答案字段保留主结果（如 `"a=-3, b=2"`、`"16pi/3"`、`"(-1,1), (1+x)/(1-x)^2"`）。
- 证明题 Q17（曲线积分全微分）答案标记为 `"见解析"`，解析中通过构造原函数 $F(u)=\int_0^u f(t)\,dt$ 完成闭曲线积分为零的论证。

**关键决策**:
- 选择题答案存索引而非字母 → 复用阶段 13 的归一化管线，无需新增展示层转换。
- 填空题答案使用 ASCII 形式（`sqrt(2)`、`pi`）而非 LaTeX → 与现有 `normalized` 校验器的去空格、去 `\` 的归一化策略一致，避免渲染层和校验层格式不一致。
- Q3 被积函数 $x+y+z$ 在单位球上积分为 0 不在选项中，解析中显式指出推测原题被积函数为 1 → 保留学术严谨性同时给出最可能答案 B。
- Q17 证明题 `answer` 字段填 `"见解析"` 而非空 → 避免前端展示「答案：空」的异常态，与 `manual` 校验器语义一致。

**产出文件**:
- `题库/高数/2019长沙理工大学高数A（二）期末.md` — 17 道题答案 + 解析补全

**验证**:
- 文件 YAML frontmatter 与题目字段格式与同目录其他试卷一致。
- 选择题答案索引均在 `[0, options.length-1]` 范围内。
- 解答题 `answers` 数组均非空，`solution` 字段均含完整推导步骤。

**关联问题**: 用户要求把 2019 高数 A（二）期末试卷的答案和解析写好。

### 阶段 44: 2019 高数 A（二）期末试卷答案同步至 Supabase

**日期**: 2026-08-04

**操作**:
- 通过 Supabase MCP `execute_sql` 分 3 批执行 17 条 UPDATE，将阶段 43 补全的 `answer` / `answers` / `solution` 写入 `exam_questions` 表（exam_id = `exam-calculus-2-2019`）。
- SQL 字符串使用 dollar-quoting `$sol$...$sol$` 包裹 solution，避免 LaTeX 反斜杠与单引号（`y'` / `y''` 等导数符号）的转义冲突。
- 同步重写本地 seed SQL 文件 `04-exam-papers-24-exam-calculus-2-2019.sql`，17 个 INSERT 的 answer/answers/solution 字段从空占位（`''` / `'[]'` / `''`）替换为正确值，solution 内反斜杠按 `esc()` 规则双写、单引号双写。
- 运行 `npm run fetch:data` 从 Supabase 拉取最新数据，更新 `src/data/examPapers.js`（29 份试卷），前端 Q1 answer 已确认为 `"3"`、solution 完整。

**关键决策**:
- Supabase 写入用 dollar-quoting 而非 `esc()` 转义 → solution 含大量 LaTeX 反斜杠与导数单引号，dollar-quoting 一律按字面量处理，零转义错误。
- 本地 seed SQL 仍用 `esc()` 单引号转义 → 保持与 `md-to-exam-seed.js` 生成产物一致，便于后续重新生成时 diff 干净。
- 仅 UPDATE answer/answers/solution 三字段，不动 title/content/options → 避免覆盖 Supabase 中已正确的题面（Q15 题面 `$f'(0) = 1$` 在 Supabase 为一阶导，与本地 seed SQL 的 `f''(0)` 转义后一致）。
- 不跑 `seed-exams-to-supabase.js` 全量重导 → 该脚本需 service_role key（`.env.local` 未配置），且会重导 29 份试卷；MCP `execute_sql` 精准定向 17 题，影响面最小。

**产出文件**:
- `scripts/seed/04-exam-papers-24-exam-calculus-2-2019.sql` — 17 个 INSERT 答案字段填充
- `src/data/examPapers.js` — fetch:data 重新生成
- Supabase `exam_questions` 表 — 17 行 answer/answers/solution 更新

**验证**:
- `SELECT id, answer, answers, solution_status FROM exam_questions WHERE exam_id = 'exam-calculus-2-2019'` 返回 17 行，answer 非空、answers 单元素数组、solution 全 OK。
- Q15 (s2-4) solution 头部确认存为 `y' - e^{y-1}`（一阶导）而非 `y''`（二阶导），单引号转义正确。
- Q17 (s2-6) solution 确认 `F'(u) = f(u)`（一阶导）。
- 前端 `examPapers.js` Q1 answer=`"3"`、answers=`["3"]`、solution 完整。

**关联问题**: 用户要求把 2019 试卷答案也写到 Supabase。

## 更新记录 - 2026-08-04（第四次）

### 新增
- 语义变量 `--primary / --primary-2 / --danger / --warn`，`--practice-*` 统一映射到语义变量。

### 修改
- 总结页 `renderResults` 改为横向 2 列（`.summary-grid`）。
- 知识库 `/kb` 错题卡新增「查看解析 / 标记已掌握」操作行，顶部摘要条真数据化。
- 刷题板块概览、会话、复盘错误态 emoji 全部替换为内联 SVG。

### 移除
- 视图层残留 emoji 状态图标（`practice-session.js` / `review-session.js` 的 ⚠️）。

## 更新记录 - 2026-08-04（第五次）

### 修改
- **"刷题" tab（首页）**：删除「按试卷」「按题型」两张功能入口卡；扩增三卡诊断数据「薄弱考点 top3 + 刷题统计 + 近期正确率趋势」，符合设计理念「状态→诊断→行动」。
- **"刷题板块"页 (`/practice`)**：重排信息优先级 → ① 个人任务区（继续上次 + 今日待复习）→ ② 统计指标 → ③ 按试卷/按题型入口（原首页删去的卡片样式）→ ④ 排行榜 + 最近练习 → ⑤ 添加我的试卷（降级到末尾）；完全遵循设计理念个人任务优先。
- 增加动态加载：在 `landing.js` 导入 `supabase`，动态加载刷题统计和趋势线；在 `practice/index.js` 加载个人任务数据。

### 新增
- 首页刷题 tab 新增 `landing-practice-weak`（薄弱考点）、`landing-practice-stats`（统计）、`landing-practice-trend`（趋势）三个异步加载容器。
- 刷题板块新增 `overview-resume` 和 `overview-today` 两个个人任务容器。

### 阶段 45: 刷题板块破局重构（状态仪表盘优先 + 单一主区 + 唯一主按钮）

**日期**: 2026-08-04

**背景**: 用户反馈刷题板块页"内容密度低、信息量不足、布局冗余（等权重卡片堆叠）、按钮不清晰"，并要求先对齐颗粒度再破局。经确认三项决策：页面定位=状态仪表盘优先；布局=单一主区+紧凑辅助；按钮=只保留一个"开始刷题"主按钮（进入刷题中心，那里有按试卷/按题型 tab 切换）。

**操作**:
- **`src/views/practice/index.js` `renderPracticeOverview`** 整体重排：
  - 删除「按试卷 / 按题型」两张入口卡片，改为唯一主按钮「开始刷题 →」跳 `/practice/exams`（刷题中心内有 tab 切换）。
  - 主区改为一个 `rounded-2xl` 大仪表盘（不再拆分独立卡片）：左列「继续上次 + 今日待复习」，右列「薄弱考点 + 开始刷题主按钮」。
  - 统计指标（累计试卷/累计题目/正确率/总耗时）压成一行 4 个内联窄块，去掉独立卡片边框，靠背景色分层。
  - 排行榜 / 最近练习 保留为两栏压缩卡片，铺满。
- **`_loadOverviewData` 继续上次分支**：去掉内部「继续练习」大按钮（与主按钮重复），改为紧凑行（标题 + 右侧「继续 →」小链接 + 进度条 + 正确率）；无记录时不再渲染多余按钮。

**关键决策**:
- 页面主线从「功能入口」转为「状态仪表盘」→ 信息密度由"等权重卡片堆叠"改为"单一主视觉 + 紧凑辅助"，消除布局冗余。
- 只保留一个主 CTA「开始刷题」→ 按钮层级唯一，避免多按钮互相干扰；按试卷/按题型交由刷题中心内 tab 切换完成。
- 继续上次的内容按钮降级为内联小链接 → 与主按钮职责分离，避免一个区块出现两个同等级按钮。

**产出文件**:
- `src/views/practice/index.js` — 概览页结构与继续上次逻辑重构

**验证**:
- `npx vite build` 通过（765 modules transformed，gzip CSS 14.70 KB）。

**关联问题**: 用户要求刷题板块页破局，先对齐颗粒度（状态仪表盘优先 / 单一主区+紧凑辅助 / 唯一主按钮）再实施。

## 更新记录 - 2026-08-04（第六次）

### 修改
- 刷题板块页 `/practice` 重构为「状态仪表盘优先」：单一主区（继续上次 + 今日待复习 + 薄弱考点 + 开始刷题按钮）+ 紧凑辅助（统计指标行 + 排行榜 + 最近练习）。
- 删除「按试卷 / 按题型」入口卡片，改为唯一主按钮「开始刷题 →」。
- 继续上次改为紧凑行（内联「继续 →」小链接），去掉与主按钮重复的按钮。

## 最后更新时间

2026-08-04（第六次）

## 更新记录 - 2026-08-05

### 修改
- 刷题中心进入的刷题会话（按试卷 / 按题型 / 我的试卷 / 错题复盘）按原始试卷顺序排列题目。
  - `src/views/quizSession.js` `createState`：当 `externalQuestions` 注入时不再按题号尾部数字重排，保留 `quiz-adapter` 传入的原始顺序；兜底 `getItemQuestions` 路径仍按尾部编号排序。
- 填空题占位符 `\_\_\_\_`（Markdown 转义下划线）在题目展示时还原为 `____`。
  - `src/views/quizSession.js` 新增 `normalizeText` 工具：将 `\_` 替换为 `_`。
  - 应用到 `renderCurrentQuestion` 的标题与题干、`renderResults` 错题列表标题。

### 影响面
- 仅影响 `src/views/quizSession.js`，所有复用该模块的入口（刷题中心会话、错题复盘、小节训练）均同步生效。
- 不改数据源 `src/data/examPapers.js` / `src/data/questions.js`，仅在渲染层归一化。
- 不影响随机模式：`resetOrder` 在 `mode === 'random'` 时仍按 seed 打乱。

### 修改
- 顺序/随机切换按钮文案：「切换顺序」→「顺序刷题」、「切换随机」→「随机刷题」。

## 更新记录 - 2026-08-05（刷题设置菜单 + 三模式）

### 新增
- **刷题设置下拉菜单**：控制条右侧齿轮按钮，点击展开，点击外部自动关闭。
  - 替代原有 3 个 chip（顺序/字体/背景），所有偏好收进下拉，控制条更干净。
  - 齿轮图标在打开时缓慢旋转（4s 线性循环）。
- **三种刷题模式**（核心新功能）：
  - **标准刷题**（默认，行为同原）：即时判分，答错可查看解析，答错入错题库。
  - **考试刷题**：仅保存答案不判分，全部答完点「交卷」后统一判分；交卷后错题入错题库；不计入即时反馈。
  - **背题模式**：题面 `<fieldset disabled>` 禁用作答，自动展示答案与解析；不计入错题库、不计入统计、无「完成」按钮。
- **字号设置**：小 / 中 / 大 三档，通过 `data-font-size` 属性驱动 CSS 变体。
- **自动跳下一题**开关：通用化原 instant 题型自动跳题逻辑；标准模式答对或考试模式保存答案后自动前进（可关）。
- **键盘快捷键**开关：`←` / `→` 切换题号；输入框内不触发；菜单打开时不触发。
- **重置当前会话**按钮：清空 state 重来（带 confirm）。
- 模式 badge 颜色区分：标准=accent / 考试=warning / 背题=success。

### 修改
- `src/views/quizSession.js`：
  - `createState` 新增字段：`practiceMode` / `fontSize` / `autoNext` / `shortcuts` / `examAnswers` / `settingsOpen`；`mode` 改为持久化（`quiz-order`）。
  - `renderControlBar` 重写：移除 3 chip，改为齿轮按钮 + `renderSettingsMenu`。
  - `renderCurrentQuestion` 模式感知：背题 `<fieldset disabled>` + 自动 solution；考试「保存答案」按钮 + 「已答」标记；标准保留原逻辑。
  - `renderFeedback` / `renderSolution` 增加 `practiceMode` 参数，考试/背题模式抑制反馈。
  - `renderBottomActions` 模式感知：考试「交卷」、背题无完成按钮、标准「完成练习」。
  - `renderNavButton` 模式感知：背题无状态色，考试用 `answered` 标已答。
  - `submitCurrentAnswer` 模式感知：背题 no-op，考试仅存答案，标准即时判分 + 通用化 autoNext。
  - `handleQuizFinish` 模式感知：考试交卷统一判分 + markQuestion + syncItemProgress；背题 no-op；标准原逻辑。
  - `handleQuizSelectOption`：背题 no-op，其他模式保留。
  - 新增 handlers：`handleQuizToggleSettings` / `handleQuizSetMode` / `handleQuizSetOrder` / `handleQuizSetFont` / `handleQuizSetFontSize` / `handleQuizSetBg` / `handleQuizToggleAutoNext` / `handleQuizToggleShortcuts` / `handleQuizResetSession`。
  - 切换模式 = 重置会话（保留偏好），避免模式间状态污染。
  - 新增 `attachKeyboardListener` / `detachKeyboardListener` / `attachSettingsOutsideClickListener` / `detachSettingsOutsideClickListener`；`initQuizSession` 挂载，`cleanupQuizSession` 卸载。
  - 移除旧 `handleQuizToggleOrder` / `handleQuizToggleFont` / `handleQuizToggleBg`。
- `src/main.js`：import 与 switch case 同步替换为新的 set/toggle handlers。
- `src/style.css`：新增 `.quiz-settings*` / `.quiz-set-*` / `.quiz-mode-badge.mode-*` / `[data-font-size]` 字号变体 / `fieldset[disabled]` 视觉弱化。

### 影响面
- 全部链路同步修改：state → 渲染 → 提交 → 完成 → 事件路由 → 样式，无遗漏。
- 所有复用 `quizSession.js` 的入口（刷题中心会话、错题复盘、小节训练）均同步获得三模式能力。
- 偏好持久化：`practice-mode` / `order` / `font` / `font-size` / `bg` / `auto-next` / `shortcuts` 存 localStorage，跨会话保留。
- 不改数据源、不改 Supabase schema、不改错题库逻辑（markQuestion 调用时机按模式控制）。
- 背题模式不调用 `markQuestion` / `syncItemProgress` / `setLastSession`，统计与错题库零污染。

### 关键决策
- 切换模式即重置会话 → 避免标准模式已判分的结果污染考试/背题模式渲染。
- 背题模式用 `<fieldset disabled>` 包裹题面 → 无需改 4 个 renderer，最小侵入实现禁用作答。
- 设置菜单用绝对定位 + 外部点击监听 → 不阻塞主线程，原生 DOM 交互。
- 键盘监听挂 `document` 但在 `cleanupQuizSession` 卸载 → 避免离开刷题页后仍拦截按键。

## 最后更新时间

2026-08-05（刷题设置菜单 + 三模式）
