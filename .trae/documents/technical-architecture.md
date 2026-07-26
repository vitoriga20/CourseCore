# 技术架构文档 - CourseCore 大学基础课学习平台

## 1. 技术栈

| 层级 | 技术 |
|------|------|
| 构建工具 | Vite 5 |
| 样式框架 | Tailwind CSS 3 (npm) + PostCSS + Autoprefixer |
| 脚本模块 | 原生 ES Modules |
| 数学公式 | MathJax 3 (tex-mml-chtml) |
| PDF 抽取 | MinerU（`pipeline` 后端，`MINERU_MODEL_SOURCE=modelscope`） |
| 动态背景 | HTML5 Canvas 2D 全局背景 + p5.js 测验几何背景（球面投影网格与三角分布十字星星） |
| 状态管理 | 中央 `state.js` + localStorage 持久化 |
| 路由 | HTML5 History API + 集中路由表（`src/config/routes.js`）+ 构建时预渲染 |
| 交互 | `data-action` 事件委托模式 + `<a>` 内部链接客户端拦截 |
| 部署目标 | Vercel / Netlify / GitHub Pages |

## 2. 项目目录说明

```
c:\Users\vitoriga\Downloads\物理试题\
├── .trae\documents\
│   ├── development-log.md              # 开发日志
│   ├── technical-architecture.md       # 本文件
│   ├── prd.md                          # 产品需求文档
│   ├── 刷题系统实现规范-freeCodeCamp借鉴.md  # 题型/验证/状态规范
│   └── coursecore-question-system-refactor-plan.md  # 刷题系统重构计划
├── .github\workflows\
│   └── deploy.yml                      # GitHub Pages 自动部署
├── coursecore\                         # CourseCore Vite 项目
│   ├── index.html                      # 应用入口
│   ├── package.json                    # 依赖与脚本
│   ├── vite.config.js                  # Vite 配置
│   ├── tailwind.config.js              # Tailwind 内容扫描路径
│   ├── postcss.config.js               # PostCSS 插件配置
│   ├── vercel.json                     # Vercel SPA 回写
│   ├── netlify.toml                    # Netlify 构建与重定向
│   ├── README.md                       # 项目说明与部署指南
│   ├── .env.example                    # 环境变量示例
│   ├── .gitignore
│   ├── public\favicon.svg
│   ├── builders\                       # 构建时脚本
│   │   ├── question-builder.js         # Markdown → src/data/*.js
│   │   ├── physics-quiz-builder.js     # 物理综合测验 JSON → Markdown（一次性/可复用）
│   │   ├── training-extract.py         # MinerU 抽取 PDF 训练题题干 → Markdown
│   │   └── training-builder.js         # Node.js 包装，prebuild 调用 Python 脚本
│   ├── scripts\                        # 辅助脚本
│   │   ├── migrate-legacy-data.js      # 旧 JSON → Markdown 迁移（已执行）
│   │   └── prerender.js                # 构建后为每条路由生成静态 index.html
│   ├── curriculum\                     # Markdown 源题库
│   │   └── raw\
│   │       ├── questions\              # 平台题目（按学科/模块组织）
│   │       │   ├── calculus-1\         # 高等数学（上）题目源文件
│   │       │   ├── calculus-2\         # 高等数学（下）题目源文件
│   │       │   └── physics-b-1\        # 大学物理B（上）理论占位 + 测验题目源文件
│   │       └── exams\                  # 期末试卷
│   ├── public\                         # 构建后原样复制的静态资源
│   │   └── physics\                    # 物理测验题图（qXXX.jpg）
│   └── src\
│       ├── main.js                     # 应用初始化、App 外壳、事件委托、锚点导航拦截
│       ├── router.js                   # History API 视图路由、答题处理、导航高亮
│       ├── state.js                    # 全局状态与 localStorage
│       ├── theme.js                    # 深色/浅色主题
│       ├── background.js               # Canvas 2D 全局几何背景
│       ├── quiz-background.js          # p5.js 测验专用几何背景（初始化/销毁/素白模式回退）
│       ├── utils.js                    # 通用工具函数
│       ├── style.css                   # Tailwind 指令 + CSS 变量主题
│       ├── config\                     # 全局配置
│       │   ├── routes.js               # 路由表、URL 匹配、链接生成、静态路径枚举
│       │   └── question-types.js       # 题型枚举与行为映射表
│       ├── data\                       # 数据模块（由构建脚本生成）
│       │   ├── platform.js             # 平台名称与标语
│       │   ├── labels.js               # 题型与内容类型标签
│       │   ├── courses.js              # 课程/模块/小节数据
│       │   ├── questions.js            # 平台题库
│       │   ├── theoryContents.js       # theory 小节占位内容
│       │   └── examPapers.js           # 期末试卷数据
│       ├── validators\                 # 独立答案验证器
│       │   ├── index.js                # validate(question, userAnswer) 入口
│       │   ├── exact.js                # 精确匹配
│       │   ├── normalized.js           # 归一化匹配
│       │   ├── tolerance.js            # 数值容差
│       │   ├── set.js                  # 集合匹配（多选）
│       │   ├── manual.js               # 人工/半自动（证明/简答）
│       │   ├── runner.js               # 代码题沙箱执行
│       │   └── mixed.js                # 综合混合题
│       ├── utils\                      # 业务工具
│       │   ├── answer-collector.js     # 根据题型收集用户输入
│       │   ├── question.js             # 题目查找与导航
│       │   └── progress.js             # localStorage 读写与迁移
│       └── views\                      # 页面视图组件
│           ├── landing.js              # 首页（学习/知识库双板块）
│           ├── course.js               # 课程详情
│           ├── practiceList.js         # 小节练习列表（支持 theory / quiz / practice / training）
│           ├── quizSession.js          # 通用测验视图（顺序/随机/字体/背景/导航/报告），被 quiz 与 training 复用
│           ├── practiceDetail.js       # 单题作答与解法（薄封装）
│           ├── practiceBank.js         # 刷题板块
│           ├── knowledgeBase.js        # 知识库
│           ├── examPapers.js           # 期末试卷列表
│           ├── examDetail.js           # 试卷详情
│           └── question\               # 题型模板
│               ├── index.js            # renderQuestion(question) 入口
│               ├── choice.js           # 单选/多选/判断
│               ├── fill.js             # 填空/简答
│               ├── calc.js             # 计算/证明
│               ├── code.js             # 代码题
│               ├── chrome.js           # 题目标题/反馈/解法/导航
│               └── preview.js          # 列表页题干预览
```

## 3. 数据流

```
Markdown 源文件（curriculum/raw/）
        │
        ▼
builders/question-builder.js（构建时）
  - 解析题目 Markdown：gray-matter 读取 YAML frontmatter + 正文分区（Content / Options / Answer / Solution）。
  - 解析试卷 Markdown：试卷由多个重复的 `## Section` 与 `### Question` 组成，使用 `parseRepeatedSections` 按出现顺序提取，避免按标题名去重导致只保留最后一节/最后一题。
  - 解析 theory 小节 Markdown（`type: theory`），生成 `src/data/theoryContents.js`。
  - 输出 ES Module 数据文件 `src/data/questions.js`、`src/data/theoryContents.js` 与 `src/data/examPapers.js`。
  - 物理综合测验题库由 `builders/physics-quiz-builder.js` 从 `index（综合混合）.html` 的 JSON 中提取，按力学/波动光学拆分后生成 Markdown 源文件；图片路径由 `assets/qXXX.jpg` 改写为 `/physics/qXXX.jpg`。
        │
        ▼
src/data/questions.js / src/data/theoryContents.js / src/data/examPapers.js
        │
        ▼
router.js 根据 URL（`window.location.pathname`）匹配路由并分发到对应视图函数
        │
        ▼
src/views/question/*.js 根据 questionType 渲染输入模板
        │
        ▼
MathJax.typesetPromise([main]) 渲染 LaTeX 公式
        │
        ▼
用户交互 → data-action 事件委托
        │
        ▼
answer-collector.js 收集答案 → validators/index.js 判定
        │
        ▼
state 更新 → saveProgress() → localStorage 持久化
```

## 4. 数据格式

### 4.1 课程

```js
{
  id: 'calculus',
  title: '高等数学',
  description: '...',
  requirements: [
    '完成每个理论小节配套的即时训练题',
    '完成每个模块末尾的综合练习',
    '完成每个模块末尾的测验'
  ],
  modules: [
    {
      id: 'm1',
      title: '极限与连续',
      items: [
        {
          id: 'i1',
          title: '数列极限',
          type: 'theory',
          content: '数列是按自然数编号的一列实数...'  // 可选：内联 Markdown + LaTeX 教学文本
        },
        { id: 'i2', title: '函数极限综合练习', type: 'practice' },
        { id: 'i3', title: '极限小测', type: 'quiz' }
      ]
    }
  ]
}
```

小节 `type` 支持 `theory` / `example` / `practice` / `project` / `quiz` / `review`。
`theory` 小节的正文可内联在 `courses.js` 的 `content` 字段，也可由 `src/data/theoryContents.js` 提供（用于占位或后续替换真实讲义）。
`quiz` 小节进入 `src/views/quizSession.js` 通用测验视图，题目顺序/随机切换（答题状态按题目 ID 跟随）、字体切换、几何/素白背景切换、题号导航、完成报告均在该视图内完成；几何背景由 `src/quiz-background.js` 通过 p5.js 渲染，并在离开测验视图时由 `router.js` 调用 `cleanupQuizSession` 清理。

### 4.2 题目

```js
{
  id: 'q001',
  itemId: 'i2',
  courseId: 'calculus',
  moduleId: 'm1',
  questionType: 0,       // questionTypes 枚举值
  title: '极限选择题',
  content: '题干，使用 \( ... \) 表示行内公式',
  options: ['0', '1', '∞'],   // 选择/判断题必填
  answer: '0',           // 单选/判断/填空/计算/代码标准答案
  answers: ['A', 'C'],   // 多选题标准答案集合
  blanks: 2,             // 填空题空位数量
  tolerance: 0.01,       // 计算题数值容差
  unit: 'm/s',           // 计算题单位要求
  solution: '解法说明',
  hint: '提示文本',
  testString: '',        // 代码题验证表达式
  image: '/physics/q006.jpg', // 题图，可选
  difficulty: 1,
  tags: ['极限', '无穷小'],
  source: '力学练习一第3题'
}
```

> **当前题库数据说明**：高等数学（上/下）的平台题库已统一为选择题类型（`singleChoice` / `multipleChoice` / `trueFalse`）。大学物理B（上）的综合测验保留原有填空题（`fillInBlank`）与证明/解答题（`proof`），以便学生输入表达式或对照参考答案自查；期末试卷（`curriculum/raw/exams/`）保持原题型不变。

题型枚举定义于 `src/config/question-types.js`：

| 枚举值 | 名称 | 含义 |
|--------|------|------|
| 0 | singleChoice | 单选题 |
| 1 | multipleChoice | 多选题 |
| 2 | fillInBlank | 填空题 |
| 3 | calculation | 计算/解答题 |
| 4 | proof | 证明题 |
| 5 | trueFalse | 判断题 |
| 6 | shortAnswer | 简答题 |
| 7 | code | 代码题 |
| 8 | composite | 综合混合题 |

三种行为映射表决定题型表现：

- `viewTypes`：渲染模板（choice / fill / calc / code / exam）。
- `validatorTypes`：验证方式（exact / normalized / tolerance / set / manual / runner / mixed）。
- `submitTypes`：提交方式（instant 点击选项即判定 / button 提交按钮判定）。

### 4.3 期末试卷

```js
{
  id: 'exam-csust-mechanics-2024',
  school: '长沙理工大学',
  college: '土木工程学院',
  subject: '大学物理（力学）',
  term: '2024-2025 第一学期',
  duration: '120分钟',
  sections: [
    {
      title: '一、选择题',
      questions: [ /* 同 4.2 题目格式 */ ]
    }
  ]
}
```

## 5. 前端运行时

### 5.1 初始化流程

1. `index.html` 加载 MathJax 配置与脚本。
2. `DOMContentLoaded` 触发 `src/main.js` 的 `init()`。
3. `loadProgress()` 从 `localStorage` 恢复学习进度。
4. `setTheme(state.theme)` 设置 CSS 变量与图标。
5. `renderAppShell()` 渲染 header / sidebar / main / footer，并在全局右上角渲染右侧折叠导航菜单（`.staggered-menu-wrapper`）。
6. `initEventDelegation()` 绑定 `data-action` 事件委托，包含菜单的 `toggle-menu` 与 `toggle-course-submenu` 交互。
7. `renderSidebarContent()` 渲染侧边栏课程列表。
8. `showLanding()` 渲染首页。
9. `initBackground(() => state.theme)` 启动 Canvas 几何背景。

### 5.2 路由与视图切换

- 路由配置集中在 `src/config/routes.js`，定义了全部 URL 模式与对应视图：
  - `/` → 首页（内部包含学习板块与知识库板块 tab 切换）
  - `/kb` → 知识库（首页"进入知识库"跳转的独立页面）
  - `/bank` → 刷题板块
  - `/exams` → 期末试卷列表
  - `/course/:courseId` → 课程详情
  - `/item/:itemId` → 小节练习列表
  - `/question/:qid` → 单题作答
  - `/exams/:examId` → 试卷详情
  - `/exams/:examId/questions/:qid` → 试卷逐题作答
- `router.js` 使用 `matchRoute(path)` 解析当前 URL，调用 `history.pushState/replaceState` 更新地址，再由 `applyRoute(route)` 调用对应视图函数；`navigateTo(path)` 是内部跳转的统一入口。
- 首页内的「学习板块」「知识库板块」通过 `state.landingTab` 控制，由 `showLanding(tab)` 直接切换视图，不修改 URL；`landingTab` 持久化到 `localStorage`。
- `main.js` 在全局点击事件中拦截 `<a href="/...">` 内部链接，阻止默认跳转并调用 `navigateTo`，实现无刷新客户端路由；外部链接不受影响。
- `renderMain()` 根据 `state.view` 调用对应视图函数，生成 HTML 后调用 `typeset(main)` 触发 MathJax 渲染。
- 导航高亮由 `setActiveNav(view)` 根据当前视图更新 `.nav-link.active`；当前顶部导航仅保留刷题相关入口，首页 tab 切换不依赖导航高亮。
- 构建时 `scripts/prerender.js` 读取 `dist/index.html` 模板，为 `getStaticPaths()` 返回的每条路由生成对应目录的 `index.html`，保证静态托管直接访问子路径不 404；`vercel.json` 与 `netlify.toml` 仍保留 SPA fallback 作为兜底。

### 5.3 小节完成状态

- `state.progress` 仍记录用户手动勾选的项目（项目/复习等无训练题小节）。
- `state.completedQuestions` 记录每道题的完成状态。
- `isItemCompleted(itemId)` 判断小节是否完成：
  - 若该小节关联训练题，则所有题目都完成后小节才算完成；
  - 否则回退到 `state.progress[itemId]` 的手动状态。
- `syncItemProgress(itemId)` 在小节练习页加载或题目提交后被调用，自动将"全部训练题已完成"的小节写入 `state.progress`。
- 课程详情页与侧边栏统一使用 `getStatus(itemId)` 渲染状态点，理论小节点击进入 `practice-list` 而非直接 toggle。

### 5.4 事件委托

`main.js` 在 `#app` 上统一监听 `click` / `input` / `change`：

- `click`：读取最近 `data-action` 祖先元素，分发到 `router.js` 的对应函数；同时处理全局右侧折叠菜单的 `toggle-menu` / `toggle-course-submenu`，并在点击菜单外部时自动关闭菜单。
- `<a href="/...">` 内部链接被拦截后，先关闭折叠菜单再调用 `navigateTo`，保证菜单关闭与 SPA 无刷新跳转同步。
- `input`：全局搜索、知识库搜索、刷题搜索。
- `change`：刷题筛选（题型、学科）。

优点：避免全局函数污染，便于 Vite tree-shaking，新增交互只需在 HTML 中添加 `data-action`。

### 5.5 答题流程

1. 用户在题目详情页选择选项或输入答案；`input` 事件实时更新 `state.userAnswer`。
2. 点击提交按钮触发 `handleSubmitAnswer(qid)`。
3. `answer-collector.js` 根据 `viewTypes` 收集当前输入（单选字符串 / 多选数组 / 填空字符串或数组 / 计算或代码字符串）。
4. `validators/index.js` 根据 `validatorTypes` 选择验证器并返回统一结果结构 `{ passed, userAnswer, correctAnswer, message, manual }`。
5. `state.validationResult` 保存结果；非人工题调用 `markQuestion(qid, result)` 更新 `state.completedQuestions` 并持久化。
6. 模板重新渲染反馈区与解法区，并触发 MathJax 重新排版。
7. 若 `submitTypes` 为 `instant` 且回答正确，自动跳转下一题。
8. `handleSubmitAnswer` 调用 `syncItemProgress(itemId)`：当某小节关联的全部训练题均已完成时，自动将该小节标记为完成并持久化到 `state.progress`。

### 5.6 测验视图（quizSession）

`src/views/quizSession.js` 为 `type: 'quiz'` 小节提供通用测验视图：

- 按 `itemId` 过滤题目，内部维护 `mode`（顺序/随机）、`font`（衬线/无衬线）、`bg`（几何/素白）、`currentIndex`、用户答案与判题结果等闭包状态，不污染全局 `state.inlineAnswers/inlineResults`。
- 顶部控制栏显示模式标签、小节标题、顺序/随机切换、字体切换、背景切换与进度条。
- 主体渲染当前题目；`renderQuestion` 已支持 `image` 字段，题图在输入区之前展示。
- 单选/判断题（`submitType: instant`）选择后立即判题，正确自动进入下一题；填空/证明题使用提交按钮，证明题走 `manual` 验证，仅显示参考答案。
- 桌面端右侧题号网格 + 移动端底部导航，支持点击跳转；底部提供上一题/下一题/完成练习。
- 全部题目作答后点击完成练习显示结果页（正确数/总题数/正确率），并调用 `syncItemProgress(itemId)` 标记小节完成。
- 测验状态不持久化，允许反复刷题；字体与背景偏好写入 `localStorage`（`quiz-font` / `quiz-bg`）。

### 5.7 主题与背景

- CSS 变量定义在 `src/style.css`，通过 `html[data-theme="dark"]` / `html[data-theme="light"]` 切换。
- `background.js` 使用 Canvas 2D 绘制球面投影网格与星芒，主题变化时重绘。
- 测验视图通过 `body[data-bg="geo"]` / `body[data-bg="plain"]` 临时覆盖几何背景显隐，离开测验页时恢复。

### 5.8 题型系统与验证器

题型行为由 `src/config/question-types.js` 中的三重映射表驱动，禁止在路由或视图中直接判断字符串 `kind`：

| questionType | viewType | validatorType | submitType |
|--------------|----------|---------------|------------|
| singleChoice (0) | choice | exact | instant |
| multipleChoice (1) | choice | set | button |
| fillInBlank (2) | fill | normalized | button |
| calculation (3) | calc | tolerance | button |
| proof (4) | calc | manual | button |
| trueFalse (5) | choice | exact | instant |
| shortAnswer (6) | fill | normalized | button |
| code (7) | code | runner | button |
| composite (8) | exam | mixed | button |

验证器位于 `src/validators/`，统一入口 `validate(question, userAnswer)`：

- `exact`：字符串精确匹配（单选、判断）。
- `normalized`：去空白、转小写、去全角标点、去 LaTeX 命令后匹配（填空、简答）。
- `tolerance`：`parseFloat` 后按 `tolerance` 容差比较，边界处加 `1e-9`  epsilon（计算题）。
- `set`：`Set` 比较用户选项与标准答案集合（多选）。
- `manual`：不自动判定，记录作答并显示参考答案（证明题）。
- `runner`：使用 `new Function()` 执行 `testString` 判定用户代码；当前仅用于内置代码题，未来必须迁移到 iframe 沙箱。
- `mixed`：综合混合题占位，按子题类型递归验证。

### 5.9 题目模板

`src/views/question/index.js` 提供统一入口 `renderQuestion(question)`，根据 `viewTypes` 分发到：

- `choice.js`：radio / checkbox 选项。
- `fill.js`：单空或多空 input。
- `calc.js`：输入框 + 解法区。
- `code.js`：textarea + 运行反馈。

`renderQuestion(question)` 在调用具体题型模板前先渲染 `question.image` 题图；`chrome.js` 渲染题目标题、题型标签、操作按钮、反馈区、解法区、上下题导航；`preview.js` 用于列表页只展示题干与标签。

## 6. 依赖

- 浏览器环境：现代 Chromium/Edge/Firefox/Safari（ES Modules、CSS 变量、Canvas 2D）。
- 网络：首次加载需要 MathJax CDN 与 Google Fonts（Inter）。
- 本地构建：Node.js >= 18，npm >= 9。
- 构建产物：`dist/` 目录，可直接作为静态站点部署。

## 7. 可复现构建步骤

```bash
cd coursecore
npm install
npm run build:data        # Markdown → src/data/*.js
npm run validate:data     # 校验题目 schema
npm run build             # Vite 生产构建
npm run preview           # 本地预览生产产物
```

`package.json` 已配置 `predev` 与 `prebuild` 钩子，开发或生产构建前会自动执行 `build:data`。

## 8. 部署配置

### Vercel

`vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify

`netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

`.github/workflows/deploy.yml` 已配置：push 到 `main` 自动构建并部署。

## 9. 已知技术限制

- 用户进度保存在浏览器 `localStorage`，跨设备/浏览器不互通；后续可通过接入后端或云存储解决。
- 填空/简答题答案匹配基于字符串归一化，不处理复杂等价变形；计算题使用数值容差，可接受近似值。
- 代码题 `runner` 验证器当前使用 `new Function()` 沙箱，仅用于内置代码题；涉及用户可输入代码时必须迁移到 iframe 隔离环境。
- 大学物理B（上）理论小节当前为占位内容，正式讲义待后续补充；物理综合测验的解答题按 `proof` 处理，学生需对照参考答案自查。
- MathJax 公式渲染依赖外部 CDN，离线环境需改为本地 MathJax 包。
