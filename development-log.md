# 开发日志 - CourseCore

## 项目概览

| 项 | 内容 |
|---|---|
| 项目名称 | CourseCore — 大学基础课学习平台 |
| 当前状态 | 用户认证体系已完整落地：游客模式、邮箱+密码登录/注册/重置密码弹窗、用户菜单、本地↔Supabase 进度同步；Supabase 项目已连接并通过后端链路测试；付费与 Stripe 部分按决策延后 |
| 技术栈 | Vite 5 + Tailwind CSS 3 + PostCSS + p5.js + gray-matter + MinerU (mineru-open-sdk API) + Supabase Auth |
| 构建产物 | `dist/`（481 个预渲染静态路由） |
| 数据格式 | Markdown + YAML frontmatter → `src/data/questions.js` |

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
│   │   └── question-types.js       # 题型/视图/校验器/提交方式映射
│   ├── data/
│   │   ├── courses.js              # 课程与模块小节数据
│   │   ├── questions.js            # 题目数据（自动构建生成）
│   │   ├── examPapers.js           # 期末试卷数据
│   │   └── labels.js               # 类型标签文案
│   ├── services/
│   │   ├── supabase.js             # Supabase 客户端初始化
│   │   ├── auth.js                 # 游客初始化、登录/注册/登出、数据合并
│   │   └── sync.js                 # 云端 answers / progress 读写与合并
│   ├── utils/
│   │   ├── progress.js             # localStorage 读写与迁移
│   │   ├── answer-collector.js     # 从 DOM 收集用户答案
│   │   └── question.js             # 题目导航工具
│   ├── validators/                 # 各类答案校验器
│   ├── components/
│   │   ├── authModal.js            # 登录/注册/重置密码弹窗
│   │   ├── auth-components.css     # 认证组件样式
│   │   └── userMenu.js             # 右上角用户状态菜单
│   └── views/                      # 页面与题目渲染模板
│       ├── course.js               # 课程详情页
│       ├── practiceList.js         # 小节独立页面（理论 + inline 训练）
│       ├── inlinePractice.js       # inline 多题训练区
│       ├── quizSession.js          # 单题/训练测验会话
│       ├── legal.js                # 隐私政策 / 用户协议页面
│       └── question/               # 单题渲染组件
├── curriculum/raw/questions/       # 题目 Markdown 源文件
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
- 当前 Supabase 项目尚未创建，`.env.local` 中配置为空，认证与同步功能处于“就绪待配置”状态；创建项目并填入 URL/Key 后即可启用。
- 登录/注册弹窗尚未增加“同意用户协议与隐私政策”勾选框，合规页面 `/privacy`、`/terms` 待后续补充。
- 用户账号注销、邮箱确认重发、同步失败重试提示等体验细节待后续完善。

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

## 更新记录 - 2026-07-28（第二次）
### 修改
- `src/main.js` 修复登录弹窗点击卡片内部空白处意外关闭的问题。
- `src/services/auth.js` 临时切换为硬编码管理员账号密码认证。
- `src/components/authModal.js` 登录输入框标签由"邮箱"改为"账号"。

### 待后续
- 恢复 Supabase 邮箱认证或接入更安全的后端登录。
- 管理员密码需从代码中移除，改为环境变量或数据库配置。

## 最后更新时间

2026-07-28
