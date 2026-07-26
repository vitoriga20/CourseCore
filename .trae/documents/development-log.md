# 开发日志 - 物理填空/解答刷题网页

## 项目概览

| 项目 | 内容 |
|------|------|
| 当前状态 | 已生成填空/解答/综合混合三类刷题页及 Reconstruct 单文件 HTML 复刻；CourseCore 大学课程学习平台已完成 Vite 模块化重构，并基于 freeCodeCamp 实现规范完成刷题系统重构：题型枚举 + view/validator/submit 三重映射、独立验证器（exact/normalized/tolerance/set/manual/runner/mixed）、统一题目模板、Markdown → JS 构建管道、扩展状态管理与 localStorage 迁移；已基于同济大学《高等数学》第六版上下册 PDF 生成真实课程内容：2 门课程（高等数学上/下）、13 个模块、108 道平台题、2 套期末试卷（上册 38 题 / 下册 22 题）；已新增「大学物理B（上）」课程，含力学与波动光学两大模块、15 个理论占位小节与 2 个 quiz 综合测验小节，共 76 道测验题（力学 43 / 波动光学 33）并迁移 35 张题图到 `public/physics/`；新增通用测验视图 `quizSession.js`，支持顺序/随机切换、衬线/无衬线字体切换、几何/素白背景切换、题号导航、进度统计与完成报告；题目渲染支持 `image` 字段；答案归一化验证增强 LaTeX 处理；路由已升级为 History API 的「一页面一 URL」模式，并配合同步预渲染脚本为每条路由生成静态 `index.html`，支持直接访问 `/course/:courseId`、`/item/:itemId`、`/question/:qid` 等地址；已移除左侧导航栏，课程进入方式统一收敛到首页课程卡片与顶部「开始学习」入口；本地 dev/build/preview、build:data、validate:data 全链路通过；已补充 README、.env.example、GitHub Actions 部署工作流；全局右上角新增 Manu.md 风格右侧折叠导航菜单，含首页/课程（子菜单）/知识库入口；技术架构/产品需求/开发日志已同步更新，可直接部署至 Vercel/Netlify/GitHub Pages |
| 技术栈 | 静态 HTML + Tailwind CSS CDN + MathJax 3 (CHTML)；综合混合页使用 CSS 变量墨绿灰白几何主题；背景使用 p5.js 2D 透视投影几何球；algorithmic-art demo 使用 p5.js 生成艺术；CourseCore 平台使用 Vite + Tailwind CSS (npm) + ES Modules + Canvas 2D 几何背景 + MathJax 3 + localStorage 进度存储 |
| 数据来源 | `力学练习一~七.pdf`、`力学综合测试.pdf`、`波动光学练习一~六.pdf`、`波动光学综合测试.pdf`；同济大学《高等数学》第六版上册、下册 PDF（`高等数学上.pdf`、`高等数学下.pdf`） |
| 输出页面 | `index（填空题）.html`（60 题）、`index（解答题）.html`（46 题）、`index（综合混合）.html`（76 题）；CourseCore 平台：高等数学（上）、高等数学（下）、大学物理B（上）三门课程，共 184 道平台题 + 2 套期末试卷（上册 38 题 / 下册 22 题） |

## 文件结构

```
c:\Users\vitoriga\Downloads\物理试题\
├── .trae\documents\
│   ├── 物理填空解答刷题网页开发计划.md
│   ├── 刷题系统实现规范-freeCodeCamp借鉴.md  # 借鉴 freeCodeCamp 刷题实现的系统规范
│   ├── development-log.md              # 本文件
│   ├── technical-architecture.md       # 技术架构说明
│   ├── prd.md                          # 产品需求文档
│   ├── reconstruct-geometry-analysis.md
│   └── university-learning-platform-plan.md  # 大学课程学习平台 CourseCore 企划文档
├── .trae\skills\grind_promblems\
│   ├── SKILL.md                        # 通用刷题生成器 Skill 定义
│   ├── test-prompts.json               # darwin-skill 测试 prompts
│   └── results.tsv                     # darwin-skill 优化记录
├── .trae\skills\geometric-design-engineering\
│   └── SKILL.md                        # Reconstruct 几何设计工程 Skill 定义
├── .trae\specs\study-reconstruct-geometry\
│   ├── checklist.md
│   ├── spec.md
│   └── tasks.md
├── assets/                             # 题目配图（q001.jpg ~ q076.jpg）
├── .env.local
├── _Reconstruct__video.mp4             # 源视频
├── demo_a_spherical_cartography.html   # 墨绿灰白球面网格交互 Demo
├── demo_b_radial_brutalism.html        # 黑白放射曼荼罗交互 Demo
├── index（力学综合测试）.html
├── index（填空题）.html                 # 填空题刷题页（力学 33 + 波动光学 27）
├── index（综合混合）.html               # 综合混合刷题页（76 题，墨绿灰白球面几何主题）
├── index（解答题）.html                 # 解答题刷题页（力学 25 + 波动光学 21）
├── index（顺序） (3).html               # 现有单选刷题页
├── reconstruct_full.html               # Reconstruct 视频 HTML 复刻骨架
├── university-learning-platform.html   # CourseCore 大学课程学习平台单文件 HTML 原型
├── 力学练习一.pdf
├── 力学练习二.pdf
├── 力学练习三.pdf
├── 力学练习四.pdf
├── 力学练习五.pdf
├── 力学练习六.pdf
├── 力学练习七.pdf
├── 力学综合测试.pdf
├── 波动光学练习一.pdf
├── 波动光学练习二.pdf
├── 波动光学练习三.pdf
├── 波动光学练习四.pdf
├── 波动光学练习五.pdf
├── 波动光学练习六.pdf
└── 波动光学综合测试.pdf

c:\Users\vitoriga\AppData\Local\Temp\physics_questions\
├── mechanics_fillin.json               # 力学填空题（33 道）
├── optics_fillin.json                  # 波动光学填空题（27 道）
├── mechanics_calc.json                 # 力学解答题（25 道）
├── optics_calc.json                    # 波动光学解答题（21 道）
├── mc_all.json                         # 从现有单选页提取的全部选择题
└── comprehensive_mixed.json            # 综合测试混合题库（76 道）

c:\Users\vitoriga\Downloads\物理试题\coursecore\
├── index.html                          # 应用入口
├── package.json                        # 依赖与脚本
├── vite.config.js                      # Vite 配置
├── tailwind.config.js                  # Tailwind 扫描路径
├── postcss.config.js                   # PostCSS 插件配置
├── vercel.json                         # Vercel SPA 回写配置
├── netlify.toml                        # Netlify 构建与重定向配置
├── README.md                           # 项目说明与部署指南
├── .env.example                        # 环境变量示例
├── .gitignore
├── public\favicon.svg                  # 站点图标
├── builders\                           # 构建时脚本
│   └── question-builder.js             # Markdown → src/data/*.js
├── scripts\                            # 辅助脚本
│   ├── migrate-legacy-data.js          # 旧 JSON → Markdown 迁移
│   └── prerender.js                    # 构建后为每条路由生成静态 index.html
├── curriculum\                         # Markdown 源题库
│   └── raw\
│       ├── questions\                  # 平台题目（按学科/模块组织）
│       │   ├── calculus-1\             # 高等数学（上）题目源文件
│       │   └── calculus-2\             # 高等数学（下）题目源文件
│       └── exams\                      # 期末试卷
└── src\
    ├── main.js                         # 应用初始化、App 外壳、事件委托、锚点导航拦截
    ├── router.js                       # 视图路由、答题处理、导航高亮
    ├── state.js                        # 全局状态与 localStorage
    ├── theme.js                        # 深色/浅色主题
    ├── background.js                   # Canvas 2D 几何背景
    ├── utils.js                        # 通用工具函数
    ├── style.css                       # Tailwind 指令 + CSS 变量主题
    ├── components\                     # 可复用 UI 组件
    │   └── gooeyNav.js                 # GooeyNav 粘性流体导航（原生 JS）
    ├── config\                          # 全局配置
    │   ├── routes.js                   # 路由表、URL 匹配、链接生成、静态路径枚举
    │   └── question-types.js           # 题型枚举与 view/validator/submit 映射
    ├── data\                           # 数据模块（由构建脚本生成）
    │   ├── platform.js                 # 平台名称与标语
    │   ├── labels.js                   # 题型与内容类型标签
    │   ├── courses.js                  # 课程/模块/小节数据
    │   ├── questions.js                # 平台题库
    │   └── examPapers.js               # 期末试卷数据
    ├── validators\                     # 独立答案验证器
    │   ├── index.js                    # validate() 统一入口
    │   ├── exact.js                    # 精确匹配
    │   ├── normalized.js               # 归一化匹配
    │   ├── tolerance.js                # 数值容差
    │   ├── set.js                      # 集合匹配（多选）
    │   ├── manual.js                   # 人工/半自动
    │   ├── runner.js                   # 代码题沙箱
    │   └── mixed.js                    # 综合混合题
    ├── utils\                          # 业务工具
    │   ├── answer-collector.js         # 按题型收集用户输入
    │   ├── question.js                 # 题目查找与上下题导航
    │   └── progress.js                 # localStorage 读写与迁移
    └── views\                          # 页面视图组件
        ├── landing.js                  # 首页（学习/知识库双板块）
        ├── course.js                   # 课程详情
        ├── practiceList.js             # 小节练习列表
        ├── practiceDetail.js           # 题目作答与解法（薄封装）
        ├── practiceBank.js             # 刷题板块
        ├── knowledgeBase.js            # 知识库
        ├── examPapers.js               # 期末试卷列表
        ├── examDetail.js               # 试卷详情
        └── question\                    # 题型模板
            ├── index.js                # renderQuestion() 入口
            ├── choice.js               # 单选/多选/判断
            ├── fill.js                 # 填空/简答
            ├── calc.js                 # 计算/证明
            ├── code.js                 # 代码题
            ├── chrome.js               # 题目标题/反馈/解法/导航
            └── preview.js              # 列表页题干预览

# 生成脚本（位于临时工作目录）
c:\Users\vitoriga\.trae-cn\work\6a6323ca709f04131cc76680\
└── gen_calculus.py                     # 高等数学课程/题目/试卷自动生成脚本
```

## 开发阶段记录

### 阶段 1: 提取波动光学填空题 JSON

**日期**: 2026-07-13

**操作**:
- 读取 `physics_pdf_text\波动光学练习一~六_raw.txt` 和 `波动光学综合测试_raw.txt`。
- 定位每份试卷的"二、填空题"部分，拆分出独立填空题条目。
- 将 PDF 提取乱码中的数学符号用 LaTeX 重新排版。
- 为每道题推导/给出标准答案；多空答案用分号 `;` 分隔。
- 输出 JSON 到 `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\optics_fillin.json`。

**关键决策**:
- 题号不保留原试卷编号，重新从 1 开始连续编号，便于刷题页面统一导航。
- 公式统一使用 MathJax 可渲染的 LaTeX，物理量带单位时使用 `$\,\mathrm{单位}$`。

**产出文件**:
- `optics_fillin.json` - 波动光学填空题数据（27 道）。

### 阶段 2: 提取力学填空题 JSON

**日期**: 2026-07-13

**操作**:
- 读取 `力学练习一~七.pdf` 与 `力学综合测试.pdf` 的原始提取文本。
- 定位填空题段落，逐题重建题干与答案。
- 处理运动学、牛顿力学、刚体转动、角动量等公式。
- 输出 `mechanics_fillin.json`。

**关键决策**:
- 对题干中出现的"如图所示"保留文字描述，不再额外配图。
- 答案格式与波动光学保持一致：多空用 `;` 分隔。

**产出文件**:
- `mechanics_fillin.json` - 力学填空题数据（33 道）。

### 阶段 3: 提取波动光学与力学解答题 JSON

**日期**: 2026-07-13

**操作**:
- 从两类 PDF 的"三、计算题"段落提取解答题。
- 为每道题编写标准答案与简要 `solution` 提示。
- 处理多问问号、多答案用 `;` 分隔。
- 输出 `optics_calc.json`（21 道）与 `mechanics_calc.json`（25 道）。

**关键决策**:
- 由于解答题答案较长，页面中仅要求用户输入最终答案，提交后显示完整答案与思路提示。
- 为减少用户输入负担，答案比较时做归一化：去除 `$`、空格、单位命令、全角标点、大小写差异。

**产出文件**:
- `optics_calc.json`
- `mechanics_calc.json`

### 阶段 4: 修复力学解答题 LaTeX 反斜杠冗余

**日期**: 2026-07-13

**操作**:
- 发现 `mechanics_calc.json` 中部分 LaTeX 命令出现双重反斜杠（如 `\\frac`）。
- 编写 `fix_mechanics_calc_latex.py`，递归地将 `\\` 折叠为 `\`，直到每个命令只剩一个反斜杠。
- 重新写入 JSON。

**关键决策**:
- 采用"反复折叠"策略，可处理多层冗余转义。
- 修复后再由 `build_html_pages.py` 统一生成页面，避免 HTML 中公式渲染失败。

**产出文件**:
- `fix_mechanics_calc_latex.py`
- 修复后的 `mechanics_calc.json`

### 阶段 5: 生成两个刷题 HTML 页面

**日期**: 2026-07-13

**操作**:
- 编写 `build_html_pages.py`，将四类 JSON 合并为两个页面内嵌数组。
- 填空题页使用单行输入框；解答题页使用多行文本框，提示多问用分号分隔。
- 复用 `index（顺序） (3).html` 的底部导航、上一题/下一题、完成练习、重新开始逻辑。
- 生成 `index（填空题）.html` 与 `index（解答题）.html`。

**关键决策**:
- 数据硬编码在页面脚本中，与现有单选页架构一致，无需后端。
- 科目顺序：力学在前，波动光学在后。

**产出文件**:
- `index（填空题）.html`（60 题）
- `index（解答题）.html`（46 题）
- `build_html_pages.py`

### 阶段 6: 修复 HTML 模板双大括号语法错误

**日期**: 2026-07-13

**操作**:
- 使用 Playwright 验证时发现页面 JS 报 `Unexpected token '{'`，原因为 `build_html_pages.py` 模板中所有 JS 对象字面量被写成 `{{ ... }}`。
- 将模板中的 `{{` 全部替换为 `{`、`}}` 全部替换为 `}`，重新生成页面。
- 再次验证 MathJax 正常渲染、答题反馈与导航功能正常。

**关键决策**:
- 优先修复模板源文件，确保后续重新生成不会再次出错。
- 验证流程前置，避免把有语法错误的页面交付。

**产出文件**:
- 修复后的 `build_html_pages.py`
- 重新生成的 `index（填空题）.html`、`index（解答题）.html`

### 阶段 7: 创建通用刷题生成器 Skill grind_promblems

**日期**: 2026-07-16

**操作**:
- 在 `.trae/skills/grind_promblems/` 下创建 `SKILL.md`。
- 定义 Skill 触发条件、输入确认、PDF 识别流程、题目结构化、答案生成与交叉验证、HTML 生成、样式规范。
- 第一版聚焦：PDF → 结构化 JSON → 黑白几何双主题单文件 HTML 刷题页；随机打乱；答案归一化判题。

**关键决策**:
- Skill 不自持运行时，而是指导智能体完成完整链路（识别/建库/生成/验证/出 HTML）。
- 样式要求几何构型、黑白优雅、双主题色，与现有彩色页面区分。
- 答案来源：优先使用用户上传答案，缺失时多源交叉验证生成，低置信度题目标记待核对。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`

### 阶段 8: 生成综合混合刷题 HTML

**日期**: 2026-07-16

**操作**:
- 从 `index（顺序） (3).html` 提取 78 道选择题，分离出力学综合 17 道、波动光学综合 14 道。
- 重新结构化力学综合填空 15 道、解答 11 道，波动光学综合填空 10 道、解答 9 道；答案基于标准物理公式推导并交叉核对。
- 合并为 `comprehensive_mixed.json`（76 题），顺序为力学（选择→填空→解答）后波动光学（选择→填空→解答）。
- 生成 `index（综合混合）.html`：单文件、内嵌 JSON、黑白几何双主题（宣纸白 / 炭黑）、顺序/随机切换、底部题号导航、三种题型统一判题、结果页。
- 使用 Playwright 验证：浅色/深色主题渲染、选择题/填空题/解答题显示、答题反馈、随机切换、完成结果页均正常。

**关键决策**:
- 综合测试题库采用“全部混合”分类，按科目分组后再按题型分组，兼顾复习连贯性与题型切换。
- 样式完全脱离 Tailwind 默认彩色，使用 CSS 变量实现双主题，几何直角边框 + 等宽题号 + 网点底纹。
- 答案归一化仅去除 LaTeX 命令与全角符号，保留单位；若用户省略单位则判为错误，以强化规范作答。

**产出文件**:
- `extract_mc_from_html.py` - 从现有 HTML 提取选择题 JSON。
- `build_comprehensive_mixed.py` - 合并综合测试题库 JSON。
- `build_mixed_html.py` - 生成黑白几何双主题 HTML。
- `index（综合混合）.html` - 最终刷题页面（76 题）。
- `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\comprehensive_mixed.json` - 混合题库数据。

### 阶段 9: 优化综合混合页 UI 与交互

**日期**: 2026-07-16

**操作**:
- 全面重构 `index（综合混合）.html` 的样式与布局：
  - 右侧固定题号导航面板，5 列矩形网格，正确/错误/当前题号用颜色区分。
  - 主卡片使用更克制的黑白配色、更优雅的字体层级（标题宋体、题面宋体、题号等宽）。
  - 顶部新增进度条；增加“字体：宋体/黑体”与“背景：网点/方格/斜线/纯色”切换。
  - 移动端保留底部横向题号栏，桌面端自动隐藏。
- 调整顺序/随机模式：默认顺序；点击“切换随机”后生成一次不重复的乱序列表，下一题按乱序推进；切换回顺序则重置为原题号顺序。
- 增加题目图片支持：JSON 中若含 `image` 字段，题干下方自动渲染配图（为后续 MinerU 提取图片做准备）。
- 重新生成页面并通过 Playwright 验证：顺序/随机切换、主题切换、字体与背景切换、题号跳转、答题反馈均正常。

**关键决策**:
- 随机模式用“全局乱序数组”实现，保证 76 题均出现且不重复，符合刷题习惯。
- 图片字段提前预留，但本次 PDF 未做 MinerU 提取，故当前题库 `image` 为空；后续替换 JSON 即可自动显示。
- 字体/背景状态写入 `localStorage`，刷新后保持用户偏好。

**后续调整**: 按用户要求只保留深色主题，移除浅色变量、主题切换按钮及相关 JS，`data-theme` 不再使用，默认即为炭黑风格。

**产出文件**:
- `build_mixed_html.py`（更新）
- `index（综合混合）.html`（更新）

### 阶段 10: 使用 MinerU 提取综合测试 PDF 配图并更新综合混合题库

**日期**: 2026-07-17

**操作**:
- 使用 MinerU 提取 `力学综合测试.pdf` 与 `波动光学综合测试.pdf` 的 Markdown 与图片。
- 编写 `parse_mineru_to_json.py` 解析 Markdown：按题型分节、识别题号、清洗 LaTeX 与 OCR 空格、拆分选择题选项、提取图片路径。
- 编写 `merge_mineru_images.py` 将 MinerU 提取的图片按题号映射到现有 `comprehensive_mixed.json`，生成 `assets/q{ id }.jpg`。
- 运行 `build_mixed_html.py` 重新生成 `index（综合混合）.html`，题库仍为 76 题，其中 35 题成功嵌入原卷配图。

**关键决策**:
- 现有 `comprehensive_mixed.json` 的题干、选项、答案、解析已经过人工校对，质量优于 MinerU OCR 文本；因此仅使用 MinerU 提取的图片，保留原有文本内容，避免引入 OCR 错字与公式错乱。
- 图片命名与题目全局 `id` 绑定，HTML 中通过 `question.image` 动态渲染，保证随机/顺序模式下配图始终跟随对应题目。
- 解析脚本支持“节内原题号”映射，能处理同一科目下不同题型题号不连续的情况（如力学填空题从 18 开始）。

**产出文件**:
- `parse_mineru_to_json.py` - MinerU Markdown → 结构化题库的解析脚本。
- `merge_mineru_images.py` - 仅合并 MinerU 图片到现有题库。
- `assets/q001.jpg` ~ `assets/q076.jpg`（实际生成 35 张）- 题目配图。
- `index（综合混合）.html`（更新）- 内嵌带图片字段的 76 题 JSON。

### 阶段 11: 综合混合题库改用 MinerU 提取的题干/选项文本

**日期**: 2026-07-17

**操作**:
- 按用户要求，调用 `grind_promblems` Skill 并遵循其 PDF → JSON → HTML 流程。
- 重新运行 `parse_mineru_to_json.py`，将 `comprehensive_mixed.json` 中的 `question` 与 `options` 替换为 MinerU 从 Markdown 提取的版本，保留原有人工校对答案、解析、分类与全局 `id`。
- 重新运行 `build_mixed_html.py` 生成 `index（综合混合）.html`。
- 使用 Playwright 验证：首页、第 2 题、第 3 题、第 6 题（含配图）渲染正常。

**关键决策**:
- 仅替换题干与选项，不替换答案与解析：综合测试 PDF 本身不含答案，MinerU 无法自动生成，必须保留原有人工推导结果。
- 图片字段仍通过 MinerU 提取并按全局 `id` 映射，与阶段 10 保持一致。
- 发现 MinerU OCR 对部分选择题选项的 LaTeX 花括号识别不完整（如 id 2 的 B/C/D 选项），导致 MathJax 渲染失败并显示原始文本；该问题作为新的已知限制记录，待后续批量修复。

**产出文件**:
- `comprehensive_mixed.json`（更新）- 题干/选项来自 MinerU。
- `index（综合混合）.html`（更新）- 内嵌更新后的 76 题 JSON。

### 阶段 12: 统一鼠标悬浮字体颜色为绿色

**日期**: 2026-07-17

**操作**:
- 将 `index（综合混合）.html` 中所有可交互元素的悬浮文字颜色改为截图中的绿色（`#4caf50`，即 `--correct-border`）。
- 新增 CSS 变量 `--hover-text-color: var(--correct-border)`，统一维护悬浮字体色。
- 同步修改生成脚本 `build_mixed_html.py` 的模板，保证后续重新生成时样式一致。
- 题号导航仅对未答/当前题应用绿色悬浮，已标记为正确/错误的题号保留原红绿色，避免覆盖答题状态。

**关键决策**:
- 复用现有 `--correct-border` 变量，使悬浮绿与“回答正确”主题色保持一致，无需引入新色值。
- 受影响的类：`.geo-btn`、`.geo-primary`、`.theme-chip`、`.nav-btn`、`.option-btn`。
- 未改动 `index（填空题）.html`、`index（解答题）.html`、`index（顺序） (3).html`，因为它们的样式体系（Tailwind 彩色类）与综合混合页不同，不属于同一链路。

**产出文件**:
- `index（综合混合）.html`（更新）- 悬浮字体颜色改为绿色。
- `build_mixed_html.py`（更新）- 模板同步更新。

### 阶段 13: 批量修复综合混合题库中的 LaTeX 公式显示错误

**日期**: 2026-07-17

**操作**:
- 编写 `check_latex.py` 对 `index（综合混合）.html` 内嵌 JSON 的 76 题进行全量扫描，检测 `$...$` 段的花括号是否闭合。
- 共发现 17 处残缺/异常 LaTeX，分布在 id 2、4、13、17、18、21、28、37、42、43、74。
- 编写 `fix_comprehensive_latex.py` 对源数据 `comprehensive_mixed.json` 进行针对性修复，包括补齐分数/根号/括号、修正下标 OCR 错误、清理 MinerU 生成的 `mathord`/`vphantom` 垃圾代码等。
- 修复后再用 `scan_latex.py` 扫描可疑残留，补充修正 id 24、25、29、60、65、75 的 degree 符号、单位空格、数字错位等问题。
- 重新运行 `build_mixed_html.py` 生成 `index（综合混合）.html`。
- 最终 `check_latex.py` 扫描 bad count 为 0。

**关键决策**:
- 修复入口放在源 JSON `comprehensive_mixed.json`，而非直接改 HTML，保证后续重新生成不会丢失修正。
- 对无法自动判断的公式仅做保守修复，避免改动答案/解析的物理含义。
- 保留 `check_latex.py` / `scan_latex.py` / `fix_comprehensive_latex.py` 作为后续题库质量检查工具。

**产出文件**:
- `comprehensive_mixed.json`（更新）- 修复多处 LaTeX 公式。
- `index（综合混合）.html`（更新）- 重新内嵌修正后的 76 题 JSON。
- `check_latex.py`（新增）- LaTeX 花括号检查脚本。
- `scan_latex.py`（新增）- LaTeX 可疑残留扫描脚本。
- `fix_comprehensive_latex.py`（新增）- 综合混合题库 LaTeX 修复脚本。

### 阶段 14: 更新 grind_promblems Skill 文档

**日期**: 2026-07-17

**操作**:
- 根据阶段 11-13 的实际经验，更新 [`.trae/skills/grind_promblems/SKILL.md`](.trae/skills/grind_promblems/SKILL.md)。
- 在 PDF 识别步骤补充：若已存在含人工修正的源 JSON，优先更新该 JSON 再重新生成 HTML，避免覆盖答案与解析。
- 新增 3.5 节“LaTeX 质量检查”，建议在生成 HTML 后扫描 `$...$` 花括号闭合，并在源 JSON 修复后再生成。
- 推荐保留 `check_latex.py`、`scan_latex.py`、`fix_xxx_latex.py` 作为后续维护工具。

**关键决策**:
- Skill 文档保持通用性，但吸收本项目已验证的最佳实践，方便以后处理新 PDF 时直接复用同一套检查流程。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 补充 LaTeX 质量检查与源 JSON 优先修复策略。

### 阶段 15: 用 darwin-skill 优化 grind_promblems Skill

**日期**: 2026-07-17

**操作**:
- 初始化 git 分支 `auto-optimize/20260717-0000`，建立 baseline commit。
- 为 grind_promblems 编写 `test-prompts.json`，覆盖 PDF 填空题、人工校对 JSON 综合混合页、无答案解答题三类场景。
- 按 darwin-skill 9 维 rubric 做基线评估：总分 67.5，短板为 dim4 检查点(4)、dim9 反例黑名单(3)、dim3 失败模式(5)、dim5 可执行具体性(6)。
- 执行 4 轮优化：
  1. 新增「反例与黑名单」章节，dim9 从 3 → 8，总分 67.5 → 68.2。
  2. 输入确认增加 🛑 STOP / 🔴 CHECKPOINT 视觉标记，dim4 从 4 → 8，总分 68.2 → 70.6。
  3. PDF/答案/LaTeX 三段补充 if-then 三段式失败处理总表，dim3 从 5 → 8，总分 70.6 → 70.8。
  4. 删除「建议/可保留」等软化措辞，LaTeX 检查改为强制，dim5 从 6 → 8，总分 70.8 → 83.4；随后合并失败处理表以满足 150% 体积限制，最终总分 81.1。
- 所有改进均通过独立子 agent 的 dry-run 效果评估，未引入新的 scripts/references 依赖。
- 更新 `.trae/skills/grind_promblems/results.tsv` 记录优化日志。

**关键决策**:
- 每轮只改一个维度，便于归因；总分严格高于旧版才保留（体积约束导致的最后一轮 dim8 微调除外）。
- 失败处理从分散的三张小表合并为一张总表，在保持 dim3 得分的同时满足 SKILL.md 不超过原始大小 150% 的约束。
- 效果评估使用独立子 agent 干跑（dry_run），未做端到端 full_test，因为 full_test 需要真实 PDF 提取与 HTML 生成链路。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 加入反例黑名单、显性检查点、失败处理总表、去除软化措辞。
- `.trae/skills/grind_promblems/test-prompts.json`（新增）- darwin-skill 测试 prompts。
- `.trae/skills/grind_promblems/results.tsv`（新增）- 优化记录。

### 阶段 16: 用 力学综合测试.pdf 实测 grind_promblems skill

**日期**: 2026-07-18

**操作**:
- 确认测试参数：源文件 `力学综合测试.pdf`、题目类型混合、答案来自现有 `comprehensive_mixed.json` 中的人工校对答案、输出 `index（力学综合测试）.html`、黑白几何主题、支持随机打乱。
- 编写临时脚本 `build_mechanics_test_html.py`：从 `comprehensive_mixed.json` 过滤出 43 道力学题，临时替换源 JSON，调用 `build_mixed_html.py` 生成页面，输出重命名为 `index（力学综合测试）.html`，最后恢复源 JSON。
- 运行 `check_latex.py` 扫描生成的 HTML：43 题，bad count 0。
- 验证页面包含：顺序/随机切换、上一题/下一题、底部题号导航、提交判题、结果页、重新开始、MathJax 公式、题目配图相对路径 `assets/q{id}.jpg`。

**关键决策**:
- 复用已人工校对的 `comprehensive_mixed.json` 答案，不重新生成，避免自动答案错误。
- 临时替换源 JSON 的方式避免改动 `build_mixed_html.py`，保持现有生成链路稳定。

**发现的问题**:
- 生成的 `index（力学综合测试）.html` 当前只有深色主题；`build_mixed_html.py` 在阶段 9 按用户要求移除了浅色主题切换。这与优化后 grind_promblems Skill 中「默认黑白几何 + 双主题（炭黑 / 宣纸）」的要求存在差距。

**产出文件**:
- `build_mechanics_test_html.py`（新增）- 力学综合测试快速实测脚本。
- `index（力学综合测试）.html`（新增）- 43 道力学综合测试刷题页。

### 阶段 17: 为 build_mixed_html.py 恢复炭黑/宣纸双主题切换

**日期**: 2026-07-18

**操作**:
- 在 `build_mixed_html.py` 的 HTML 模板中新增 `[data-theme="light"]` CSS 变量覆盖，实现宣纸白主题（`#f8f8f6` 背景、`#2a2a2a` 文字、`#d4d4d4` 边框）。
- 在控制栏新增「主题：炭黑/宣纸」切换按钮，固定于字体/背景按钮左侧。
- 添加 `loadTheme()` / `toggleTheme()` / `setTheme()` JS 函数，主题状态写入 `localStorage`。
- 重新生成 `index（综合混合）.html`（76 题）与 `index（力学综合测试）.html`（43 题）。
- 将 `check_latex.py` 改为可接收 HTML 路径参数，统一验证综合混合页与力学综合测试页，bad count 均为 0。

**关键决策**:
- 颜色全部使用 CSS 变量，切换主题时无需改动 DOM 元素，只改 `html` 的 `data-theme` 属性。
- 浅色主题的正确/错误反馈色从荧光绿/红调整为更克制的深绿/深红，保持黑白优雅风格。

**产出文件**:
- `build_mixed_html.py`（更新）- 支持炭黑/宣纸双主题切换。
- `index（综合混合）.html`（更新）- 双主题版本。
- `index（力学综合测试）.html`（更新）- 双主题版本。

### 阶段 18: 按用户要求移除浅色主题，仅保留炭黑主题

**日期**: 2026-07-18

**操作**:
- 用户明确反馈页面只需炭黑主题，不需要浅色主题。
- 从 `build_mixed_html.py` 的 HTML 模板中移除 `[data-theme="light"]` CSS 变量覆盖。
- 移除控制栏「主题：炭黑/宣纸」切换按钮。
- 移除 `loadTheme()` / `toggleTheme()` / `setTheme()` 及 `localStorage` 主题相关逻辑。
- 更新 `.trae/skills/grind_promblems/SKILL.md`：将默认主题改为单一炭黑主题，删除双主题相关描述与反例。
- 重新生成 `index（综合混合）.html`（76 题）与 `index（力学综合测试）.html`（43 题）。
- 使用 `check_latex.py` 校验两个页面，bad count 均为 0。

**关键决策**:
- 单一炭黑主题减少 UI 复杂度，与用户当前偏好一致。
- Skill 文档同步更新，避免后续新 PDF 生成时再次引入浅色主题。
- 保留字体（宋体/黑体）与背景（网点/方格/斜线/纯色）切换，这些不属于主题色变更。

**产出文件**:
- `build_mixed_html.py`（更新）- 仅炭黑主题。
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 去除双主题要求。
- `index（综合混合）.html`（更新）- 炭黑主题版本。
- `index（力学综合测试）.html`（更新）- 炭黑主题版本。



### 阶段 19: 综合混合页主题改为灰白几何（球面曲线网格 + 十字星星）

**日期**: 2026-07-18

**操作**:
- 按用户要求，把 `build_mixed_html.py` 的默认主题从炭黑改为灰白几何风格。
- 颜色变量更新为：`--bg-color #f1f1ef`、`--text-color #2a2a2a`、`--card-bg #fafaf9`、`--border-color #d8d8d6`、`--accent-color #333333`。
- 状态色改用低饱和绿 `#388e3c` / 红 `#c62828`，保持灰白页面上的克制反馈。
- 新增 SVG pattern 背景：横向与纵向曲线网格模拟球面投影，每个格子中心点缀十字星星；保留「几何/素白」两种背景切换。
- 重新生成 `index（综合混合）.html`（76 题）与 `index（力学综合测试）.html`（43 题）。
- 同步更新 `.trae/skills/grind_promblems/SKILL.md` 的主题描述，避免后续新 PDF 生成时回到旧炭黑风格。
- 使用 `check_latex.py` 扫描两个页面，bad count 均为 0。

**关键决策**:
- 主题改动放在 `build_mixed_html.py` 模板而非直接改 HTML，保证重新生成不会丢失新风格。
- SVG pattern 用内联 data URI，不引入额外图片文件，保持单文件 HTML 优势。
- 背景仍提供「几何/素白」切换，默认使用几何背景，满足用户对曲线网格十字星星的需求。

**产出文件**:
- `build_mixed_html.py`（更新）- 灰白几何主题模板。
- `index（综合混合）.html`（更新）- 灰白几何主题版本。
- `index（力学综合测试）.html`（更新）- 灰白几何主题版本。
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 主题规范同步。

### 阶段 20: 升级为墨绿灰白球面几何主题（每格三角分布 3 个十字星星）

**日期**: 2026-07-18

**操作**:
- 按用户进一步要求，把综合混合页改为墨绿 + 灰白渐变风格。
- 颜色变量更新为：`--bg-color rgba(243,246,244,0.92)`、`--text-color #2d4e3e`（墨绿）、`--accent-color #2d4e3e`、`--border-color rgba(45,78,62,0.22)`、`--card-bg rgba(255,255,255,0.78)`。
- 背景改用灰白渐变 `linear-gradient(160deg, #f3f6f4, #e1e8e4)`，并叠加墨绿色球面曲线网格 SVG pattern。
- 网格从单线改为椭圆弧线，间距从 120px 放大到 200px；每个格子内按三角分布放置 3 个较大十字星星。
- 卡片与导航栏增加 `backdrop-filter: blur(8px)` 毛玻璃效果，让背景渐变与网格透出来。
- 状态色调整为正确 `#2d4e3e` / 错误 `#8b3a3a`，全部统一为墨绿主调。
- 修复 `loadBg()`：旧 `localStorage` 中的 `dot/grid/line` 失效值会回退到 `geo`，避免新主题被旧缓存覆盖。
- 重新生成 `index（综合混合）.html`（76 题）与 `index（力学综合测试）.html`（43 题）。
- 同步更新 `.trae/skills/grind_promblems/SKILL.md` 的样式规范与黑名单，确保后续新 PDF 也使用墨绿灰白主题。
- Playwright 截图确认墨绿曲线网格、三角三星、灰白渐变均已正确渲染；`check_latex.py` 两个页面 bad count 均为 0。

**关键决策**:
- 用 SVG `pattern` 画椭圆弧线，比二次贝塞尔曲线更像球面经纬线。
- 每格 3 个星星放在 (50,50)、(150,50)、(100,150)，形成稳定三角形。
- 卡片半透明 + 毛玻璃，既突出内容又不遮住背景几何。

**产出文件**:
- `build_mixed_html.py`（更新）- 墨绿灰白球面几何主题模板。
- `index（综合混合）.html`（更新）- 墨绿灰白主题版本。
- `index（力学综合测试）.html`（更新）- 墨绿灰白主题版本。
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 主题规范同步。
- `.trae/documents/development-log.md`（更新）- 阶段 20。

### 阶段 21: 球面网格改为局部视野并放大间距

**日期**: 2026-07-18

**操作**:
- 按用户要求把背景网格从“画出整个球面”改为“人在大球内部只能看到一小部分”：弧线曲率更缓，格子间隔更大。
- 更新 `sphere_grid_demo.html`：用 `clipPath` 把大球轮廓和网格裁剪到舷窗大小的视野里，其余线条自然延伸到窗外；pattern 单元改为 `240x240`。
- 更新 `build_mixed_html.py` 的 SVG pattern：单元 `240x240`，水平弧线 `M0,120 A120,180 ...`，垂直弧线 `M120,0 A180,120 ...`，十字星星尺寸同步放大到 16px。
- 重新生成 `index（综合混合）.html`（76 题）与 `index（力学综合测试）.html`（43 题）。
- `check_latex.py` 扫描两个页面，bad count 均为 0。
- 同步更新 `.trae/skills/grind_promblems/SKILL.md` 的样式描述（局部视野、间距 240px）。

**关键决策**:
- pattern 单元越大，屏幕同尺寸下可见格子越少，越像“只拍到球面一小块”。
- 弧线半径放大（ry/rx 从 55 量级提到 180）后曲率更平缓，符合大球内部观察的近景感受。
- 先改示意 demo 让用户确认视觉，再同步到生成脚本和产物，避免反复重刷 HTML。

**产出文件**:
- `sphere_grid_demo.html`（更新）- 局部视野球面网格示意。
- `build_mixed_html.py`（更新）- 局部视野、240px 间距 SVG pattern。
- `index（综合混合）.html`（更新）- 应用新背景。
- `index（力学综合测试）.html`（更新）- 应用新背景。
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 主题规范同步。
- `.trae/documents/development-log.md`（更新）- 阶段 21。

### 阶段 22: 创建 Three.js 3D 球面线框网格 Demo

**日期**: 2026-07-18

**操作**:
- 按用户描述创建 `sphere_grid_3d_demo.html`：纯白球壳内表面 + 黑色经纬线网格，POV 位于球心，极端广角（FOV 150°）模拟鱼眼效果。
- 使用 Three.js `SphereGeometry` + `MeshBasicMaterial`（BackSide）渲染白色内表面，避免标准材质背面光照发灰。
- 自定义 `createLatLonGrid()` 生成经纬线 `BufferGeometry`，替代 `WireframeGeometry` 的三角对角线，使网格更干净。
- 添加 `OrbitControls` 固定相机于球心，支持拖动旋转视角；滚轮动态调整 FOV（60°–170°）。
- 使用 Playwright 截图验证渲染：纯白背景、黑色线框、鱼眼广角均正常。

**关键决策**:
- 相机固定在球心，通过旋转 target 改变视线方向，保持“人在球心向外看”的 POV。
- 使用 `MeshBasicMaterial` 而非 `MeshStandardMaterial`，因为 BackSide 在标准光照下法线朝外会导致内壁发灰，无法呈现纯白实心球效果。
- 经纬线 28×18 的密度在 1280×720 视野下线条清晰且不拥挤，符合 minimalist 风格。

**产出文件**:
- `sphere_grid_3d_demo.html`（新增）- Three.js 3D 球面线框网格鱼眼 Demo。
- `screenshot_demo.py`（新增）- Playwright 截图验证脚本。
- `sphere_grid_3d_demo.png`（新增）- 验证截图。

**关联问题**: 无

### 阶段 23: 将 Three.js 3D 球面线框网格集成到综合混合页

**日期**: 2026-07-18

**操作**:
- 把 `sphere_grid_3d_demo.html` 的 3D 背景迁移到 `build_mixed_html.py` 模板，作为 `index（综合混合）.html` 与 `index（力学综合测试）.html` 的默认背景。
- 颜色采用页面现有墨绿灰白变量：球壳 `#f3f6f4`（透明度 0.82）、经纬线 `#2d4e3e`（透明度 0.26）、十字星星 `#2d4e3e`（透明度 0.32）。
- 相机固定于球心（0,0,0），FOV 150°，OrbitControls 仅启用阻尼旋转，禁用缩放/平移，营造“人在球心向外张望”的沉浸式几何背景。
- 修复 `<script type="module">` 顶层非法 `return` 导致的 `PAGEERROR: Illegal return statement`，改为 `throw new Error`。
- 修复 body 背景覆盖 canvas 问题：geo 模式下 `body { background: transparent }`，`#bg-canvas { z-index: 0 }`，plain 模式恢复 `#f3f6f4`。
- 添加 `prefers-reduced-motion` 检测，减少动画；背景可见性通过 `MutationObserver` 监听 `data-bg` 属性切换。
- 重新生成两个页面；`check_latex.py` 两个页面 bad count 均为 0；Playwright 截图确认 3D 网格在卡片后方正确渲染。

**关键决策**:
- 使用 `MeshBasicMaterial` + `BackSide` 确保球壳内表面纯白，不受光照法线影响。
- 自定义 `createLatLonGrid()` 只画经纬线，避免 `WireframeGeometry` 的三角对角线，保持 Apple 极简线条。
- 保留字体（宋体/黑体）与背景（几何/素白）切换；几何模式即 3D 背景，素白模式隐藏 canvas 并恢复纯色背景。
- 截图脚本 `screenshot_mixed.py` / `screenshot_mechanics.py` 作为回归验证工具保留。

**产出文件**:
- `build_mixed_html.py`（更新）- 集成 Three.js 3D 背景并修复渲染层级与非法 return。
- `index（综合混合）.html`（更新）- Apple 风格 3D 几何背景版本。
- `index（力学综合测试）.html`（更新）- Apple 风格 3D 几何背景版本。
- `screenshot_mixed.py`（新增/修复）- 综合混合页截图脚本。
- `screenshot_mechanics.py`（新增/修复）- 力学综合测试页截图脚本。
- `debug_bg.py`（新增）- 3D 背景控制台与 canvas 调试脚本。
- `index_mixed_3d_bg.png` / `index_mechanics_3d_bg.png`（新增）- 验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。
- `.trae/documents/technical-architecture.md`（更新）- 技术栈与目录说明。
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 样式规范同步。

**关联问题**: 问题 5

### 阶段 24: 创建 algorithmic-art 几何球背景生成艺术 demo

**日期**: 2026-07-18

**操作**:
- 调用 `algorithmic-art` Skill，先读取 `templates/viewer.html` 模板，保留 Anthropic 品牌结构、Seed 导航、Actions 按钮等固定部分。
- 撰写算法哲学文档 `geometric_sphere_philosophy.md`，命名为 "Spherical Cartography"，阐述将球面坐标、透视投影、层级 Perlin 噪声、粒子轨迹与十字星锚定到几何网格的计算美学。
- 实现 `geometric_sphere_demo.html`：基于 p5.js 的 2D 透视投影球面网格，模拟“站在巨大球体中心向外张望”的局部视野；墨绿色（`#2d4e3e`）网格与十字星，灰白渐变背景；粒子沿球面切线运动并留下淡蓝轨迹。
- 参数面板提供 Sphere Radius / Grid Density / Noise Amplitude / Rotation Speed / Star Count / Line Weight / Particle Count / Trail Length 及三色选择器，支持 Seed 切换、Regenerate、Reset、Download PNG。
- 编写 `screenshot_sphere_art.py` 用 Playwright 截图验证；调整默认参数（radius 1200、grid density 10、focal length 1500）使球面弧线更平缓、更像背景局部。

**关键决策**:
- 使用 2D canvas 手动实现 3D 旋转与透视投影，而非 p5.js WebGL 模式，保证单文件、无额外依赖（仅 p5.js CDN）。
- 默认大半径 + 长焦距模拟“人在球内只拍到一小块球面”的局部视野，呼应用户此前对综合混合页背景的审美偏好。
- 粒子轨迹分段绘制以实现透明度渐变，避免 `beginShape` 内动态 stroke 无效的问题。
- 算法哲学独立成 `.md` 文件，符合 algorithmic-art Skill 的两步输出要求。

**产出文件**:
- `geometric_sphere_philosophy.md` - Spherical Cartography 算法哲学文档。
- `geometric_sphere_demo.html` - 自包含交互式几何球背景生成艺术。
- `screenshot_sphere_art.py` - Playwright 截图验证脚本。
- `geometric_sphere_demo.png` - 验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 25: 优化几何球 demo 性能，适配背景用途

**日期**: 2026-07-18

**操作**:
- 用户反馈 demo 可当作背景，但需优化性能避免卡顿。
- 将球面网格点从每帧重新计算改为 **initializeSystem 时一次性预计算**：`precomputeSpherePoints()` 生成带位置噪声的静态三维点数组，后续每帧只做旋转 + 透视投影。
- `perturbedPoint()` 去除时间依赖（不再每帧调用 `noise()`），噪声仅由位置决定，保证同 seed 下结果一致且可缓存。
- 星星锚点同样在初始化时预计算三维坐标，每帧直接读取 `s.pos` 做旋转投影。
- 限制帧率 `frameRate(30)`，降低 CPU/GPU 占用。
- 降低默认粒子负载：particleCount 80→30、trailLength 50→25、starCount 48→32。
- `updateParam()` 增加 structural params 列表，当 Sphere Radius / Grid Density / Noise Amp 变化时自动重新预计算网格。
- Playwright 验证：Random / Reset / Download PNG 无报错，渲染正常。

**关键决策**:
- 牺牲动态噪声形变换取稳定帧率；背景场景下缓慢旋转已足够营造呼吸感，无需每帧重算噪声。
- 预计算 + 30fps 后，主流设备可轻松作为网页背景运行；用户仍可手动拉高粒子/星星数量，但默认保守。
- 保持单文件、无 WebGL 依赖，兼容性和可移植性不变。

**产出文件**:
- `geometric_sphere_demo.html`（更新）- 性能优化后的几何球背景。
- `geometric_sphere_demo.png`（更新）- 优化后验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 26: 将 p5.js 几何球背景集成到综合混合页

**日期**: 2026-07-18

**操作**:
- 用户要求把 `geometric_sphere_demo.html` 的几何球效果作为 `index（综合混合）.html` 的背景。
- 修改 `build_mixed_html.py`：移除原来的 Three.js + OrbitControls 背景模块，替换为简化版 p5.js 几何球背景脚本。
- 新背景参数：radius 1200、gridDensity 10、noiseAmp 18、rotationSpeed 0.0003、starCount 32、particleCount 20、trailLength 20；使用 CSS 变量 `--text-color` / `--bg-color` / `--muted-color`，保持墨绿灰白主题一致。
- 修复脚本执行时机问题：将 IIFE 内部的 `setup` / `draw` 暴露到 `window.setup` / `window.draw`，确保 p5.js 自动实例化能找到入口。
- 保留 `data-bg="geo"` / `data-bg="plain"` 切换逻辑和 `#bg-btn` 按钮；`body[data-bg="plain"]` 时通过 CSS 隐藏 `#bg-canvas`。
- 重新生成 `index（综合混合）.html`；调整网格/星星/粒子透明度使背景可见但不干扰阅读。
- Playwright 验证：canvas 创建成功、无 console/page error、背景切换按钮工作。

**关键决策**:
- 用 p5.js 2D 透视投影替换 Three.js WebGL，减少外部依赖（不再依赖 esm.sh），单文件加载更稳定。
- 背景脚本不暴露任何 UI 控件，作为纯装饰性背景运行；默认动画速度很慢，避免分散注意力。
- 继续保留 `build_mixed_html.py` 作为唯一构建源，确保未来重新生成不会丢失背景。

**产出文件**:
- `build_mixed_html.py`（更新）- 模板替换为 p5.js 几何球背景。
- `index（综合混合）.html`（更新）- 综合混合页使用新的几何球背景。
- `index_mixed_3d_bg.png`（更新）- 验证截图。
- `index_mixed_plain_bg.png`（新增）- 素白模式验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 27: 进一步降低综合混合页背景性能开销

**日期**: 2026-07-18

**操作**:
- 用户反馈集成后的背景开销仍然太大。
- 在 `build_mixed_html.py` 中大幅降低背景参数：
  - gridDensity: 10 → 6
  - noiseAmp: 18 → 12
  - rotationSpeed: 0.0003 → 0.00015
  - starCount: 32 → 16
  - particleCount: 20 → 0（直接移除粒子轨迹）
  - trailLength: 20 → 10
- 渲染层优化：
  - `pixelDensity(1)` 禁用高 DPI 缩放，避免 Retina 屏上 4 倍像素绘制。
  - `frameRate(15)` 把刷新率从 30fps 降到 15fps。
- 重新生成 `index（综合混合）.html`。
- Playwright 验证：canvas 创建正常、无报错、geo/plain 切换正常、背景仍可见。

**关键决策**:
- 粒子对视觉贡献最小但每帧绘制成本最高，直接移除最省事。
- 禁用高 DPI 对背景这种大面积低细节场景几乎无损，但能显著减少 GPU 填充压力。
- 15fps 对极慢速旋转的几何背景已足够流畅。
- 如仍卡顿，可再进一步改为静态 `noLoop()` 或 gridDensity 降到 4。

**产出文件**:
- `build_mixed_html.py`（更新）- 背景参数调低。
- `index（综合混合）.html`（更新）- 低负载几何球背景。
- `index_mixed_3d_bg.png`（更新）- 验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 28: 调整综合混合页背景默认视角为面向赤道

**日期**: 2026-07-18

**操作**:
- 用户反馈背景默认视角像两极（经线汇聚在画面中心），希望改为面向赤道。
- 在 `build_mixed_html.py` 的背景参数中新增 `viewOffsetX: Math.PI / 2`。
- 修改 `draw()` 中的 X 轴旋转：`let rotX = time * 0.7 + params.viewOffsetX;`，使初始视角将赤道平面转到 camera 前方。
- 重新生成 `index（综合混合）.html`。
- Playwright 验证：无报错，背景网格从中心汇聚变为近似水平/垂直的赤道网格。

**关键决策**:
- 用固定 X 轴偏移而非改动预计算点，保持代码简洁且不影响旋转动画。
- 保留缓慢的全局旋转，让赤道视野仍有轻微动态。

**产出文件**:
- `build_mixed_html.py`（更新）- 新增 viewOffsetX 参数。
- `index（综合混合）.html`（更新）- 默认面向赤道的几何球背景。
- `index_mixed_3d_bg.png`（更新）- 新视角验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 29: 同步更新 grind_promblems skill 文档

**日期**: 2026-07-18

**操作**:
- 用户要求更新 `grind_promblems` skill 文档以匹配当前实现。
- 更新 `.trae/skills/grind_promblems/SKILL.md`：
  - 将「主题偏好」从 Three.js + OrbitControls 改为 p5.js 2D 几何球背景。
  - 将「HTML 生成」中的背景描述改为 p5.js 2D 透视投影几何球。
  - 将「样式规范」中的主背景来源和几何元素描述改为 p5.js 实现。
  - 更新「反例黑名单」第 6 条，避免与 p5.js 几何球主题冲突。
  - 新增 5.1「背景实现规范」章节，包含依赖、结构、颜色同步、默认参数、性能优化、视角、降级等要求。
- 未改动 HTML 生成代码（已通过阶段 26-28 完成），仅同步文档。

**关键决策**:
- Skill 文档作为后续复用的规范，必须与当前 `build_mixed_html.py` 实现保持一致。
- 把 p5.js 背景的关键参数和性能优化要求写入文档，避免未来重新生成时回到 Three.js 实现。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 与当前 p5.js 几何球背景一致。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

## 问题 1: PDF 原始文本中的数学符号乱码

**日期**: 2026-07-13

**现象**: `*_raw.txt` 中波长、角度、分数等符号显示为私有 Unicode 或错位字符。

**原因**: PDF 使用嵌入式字体编码，直接文本提取无法得到标准数学符号。

**解决**: 根据上下文语义、物理公式习惯及数值合理性人工推断，并用 LaTeX 重写题干与答案。

### 问题 2: 力学解答题 JSON 中 LaTeX 命令双重反斜杠

**日期**: 2026-07-13

**现象**: 页面中部分公式（如 `\vec{r}`）渲染失败或显示为原始文本。

**原因**: JSON 生成过程中字符串被多次转义，导致 `\\vec{r}` 这类冗余反斜杠出现。

**解决**: 编写 `fix_mechanics_calc_latex.py` 递归折叠 `\\` 为 `\`，再重新生成 HTML。

### 问题 3: HTML 模板双大括号导致 JS 语法错误

**日期**: 2026-07-13

**现象**: 浏览器报 `Unexpected token '{'`，`question-counter`、`question-body` 为空，页面无法加载题目。

**原因**: `build_html_pages.py` 中的 HTML 模板为了兼容 f-string 格式，把 JS 的 `{` 写成了 `{{`。

**解决**: 将模板内所有 `{{` 替换为 `{`、`}}` 替换为 `}`，并重新生成页面。

### 问题 4: MinerU OCR 导致选择题选项 LaTeX 花括号残缺

**日期**: 2026-07-17

**现象**: 综合混合页第 2 题（力学选择题）的 B、C、D 选项显示为原始文本，如 `$v=-\frac{1}{2}k t^{2}+v_{\mathrm{0}$`，而非渲染后的数学公式。

**原因**: MinerU 在识别 PDF 中的数学公式时，对嵌套花括号或 `\mathrm{...}` 的闭合括号识别不完整，导致 `$...$` 内部 LaTeX 语法错误，MathJax 无法排版。

**解决**: 当前记录为已知限制；如需修复，可在 `parse_mineru_to_json.py` 的 `clean_math()` 中增加针对选项末位缺失 `}` 的兜底补全规则，或改回阶段 10 之前的人工校对题干。

### 问题 5: 3D 背景模块脚本顶层 `return` 导致页面错误

**日期**: 2026-07-18

**现象**: Playwright 截图时页面背景仍是纯色，浏览器控制台报 `PAGEERROR: Illegal return statement`，`#bg-canvas` 下未创建 `<canvas>`。

**原因**: `<script type="module">` 的顶层作用域中不允许 `return` 语句；原迁移代码用 `if (!container) return;` 做防御性退出，触发了语法错误，整个 3D 初始化脚本未执行。

**解决**: 将 `return` 改为 `throw new Error('bg-canvas not found')`；同时修复 body 背景不透明导致 canvas 被覆盖的问题，确保 geo 模式下 body 背景透明、canvas `z-index: 0`。

## 已知限制与待改进项

- [x] 已完成力学填空题提取。
- [x] 已完成力学与波动光学解答题提取。
- [x] 已生成填空题/解答题刷题页面。
- [x] 已通过 Playwright 验证页面渲染与基础交互。
- [ ] 未对全部 106 道题逐一做浏览器截图核对；后续如发现个别公式或答案显示异常，可在对应 JSON 中修正后重新运行 `build_html_pages.py`。
- [ ] 部分题目含"如图所示"描述，页面未嵌入原 PDF 配图；用户若需看图，可对照原 PDF。
- [ ] 答案归一化仅覆盖常见 LaTeX 命令与全角符号，极端等价形式（如 `\sqrt{3}/2` 与 `0.866`）无法自动匹配。
- [x] 综合混合页已使用 MinerU 提取 PDF 配图，35/76 题已嵌入 `assets/q{ id }.jpg`。
- [x] 综合混合页题干/选项已改用 MinerU 提取文本（阶段 11），保留人工答案与解析。
- [x] MinerU OCR 对部分选择题选项的 LaTeX 花括号识别不完整（如 id 2），导致 MathJax 渲染失败并显示原始文本；已在阶段 13 批量修复综合混合页中检测到的 17 处明显残缺。
- [ ] 仍可能存在 subtle OCR 公式错误（如数字错位、符号遗漏），需在刷题过程中继续收集并修复。
- [x] `grind_promblems` Skill 已通过 darwin-skill 9 维 rubric 优化并记录（baseline 67.5 → final 81.1）。
- [ ] 未来实际调用新 PDF 时，可补一次端到端 full_test 以替换 dry_run 评估。
- [x] `build_mixed_html.py` 已按用户要求改为墨绿灰白球面几何主题（阶段 20/21）：灰白渐变背景、墨绿椭圆弧线网格（局部视野、240px 大间距）、每格三角分布 3 个较大十字星星。
- [x] 综合混合页已升级为 p5.js 2D 几何球背景（阶段 26）：大半径局部视野、墨绿灰白配色、CSS 变量同步、geo/plain 切换保留。
- [ ] 综合混合页背景当前为固定参数；如需用户可调，可复用 `geometric_sphere_demo.html` 的控件面板。
- [ ] 力学综合测试页背景仍为 Three.js 3D 线框实现（阶段 23）；如需要可统一为同一套 p5.js 背景。
- [x] Reconstruct 单文件 HTML 复刻骨架已通过 13 个关键帧 Playwright 验证，无 page/console error。
- [x] `drawModule()` 已支持 `mirror` 参数（阶段 38），consciousness 左右模块非对称朝向已复现。
- [x] disorderly 场景退场已实现淡出到黑（阶段 45）。
- [x] crusher 场景退场已实现 8 块尖锐白色碎片扫过转场（阶段 45/47）。
- [x] Fragment 类已新增 `longblade` 类型，暗色碎片概率降至 12%（阶段 47）。
- [x] endless 场景已用 Canvas 重绘圆瓣花、小方块、小星芒、分裂 R 标，并补充胶囊标签与小图标 stagger 动画（阶段 47）。
- [ ] scripts 场景右侧放射骨架与参考帧的复杂建筑感仍有差距，后续可继续增加层次。
- [ ] architectural 场景左侧虽已改为 Canvas 程序生成建筑摄影质感立面，但与参考帧真实建筑摄影仍有差距。
- [x] 视频 Loop 段（8.533–16.533s）已完成 0.1s 步长逐帧一致性验证（阶段 39/43/45/47），MSE_loop 均值约 4.03；新增 `verify_loop_frames.py` 与 `loop_frame_report.md` 作为量化验证工具。
- [ ] Loop 段部分过渡帧（13.33s、14.23–14.33s）MSE_raw 仍较高，需继续微调场景内容或过渡动画。
- [x] CourseCore 大学课程学习平台企划文档已完成，单文件 HTML 原型已实现首页、课程详情、大纲、搜索、主题切换、进度保存（阶段 48）。
- [x] CourseCore 已新增首页双板块（学习/知识库）、刷题板块（平台题型库 + 期末试卷）、练习解法与作答反馈，并完成 Playwright 基础验证（阶段 49）。
- [x] CourseCore 已接入真实教学内容：同济大学《高等数学》第六版上下册，生成 2 门课程、13 个模块、105 道平台题、2 套期末试卷（阶段 58）。
- [ ] 高等数学题目由脚本按模板自动生成，部分题目（尤其是证明题/复杂计算题）的解析较简略，后续可对照教材例题补充更详细步骤。
- [ ] 理论小节（type=theory）目前仅作为课程大纲节点，未填充理论讲解与例题解析正文；后续可扩展 theory 渲染模板或链接到外部讲义。
- [ ] 题目尚未嵌入 PDF 原图，题干中“如图所示”类题目暂时无法显示配图。

### 阶段 30: 将 grind_promblems Skill 的 PDF 识别工具固定为 MinerU

**日期**: 2026-07-18

**操作**:
- 按用户要求，将 `.trae/skills/grind_promblems/SKILL.md` 中 PDF 识别步骤的提取工具从 "`marker` 或 `MinerU`（优先 `marker`）" 改为只使用 `MinerU`。
- 同步更新失败处理总表中 PDF 识别阶段的触发条件描述，移除 `marker` 相关字样。

**关键决策**:
- 本项目实际提取链路已基于 MinerU（阶段 10-11），固定为单一工具可减少 skill 执行时的工具选择歧义。
- 保留 `MinerU` 失败时回退到 `pypdf` + 正则的兜底路径，避免工具不可用导致流程中断。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- PDF 识别仅使用 MinerU。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 31: 创建 geometric-design-engineering Skill

**日期**: 2026-07-18

**操作**:
- 读取 Reconstruct 视频几何分析文档与 spec，提取核心设计模式与工程参数。
- 创建 .trae/skills/geometric-design-engineering/ 目录与 SKILL.md。
- 在 SKILL.md 中定义 Skill 简介、触发条件、工作流、10 个核心几何模式库（透视网格、放射射线、星芒、曼荼罗、3D 圆环、碎片多边形、文字卡片堆叠、反色切换、生长动画、黑白层次系统）、与 algorithmic-art 协作方式（设计->生成提示词、生成->调优检查清单）及输出示例。
- 更新 tasks.md 与 checklist.md 中 Task 3/Task 4 及对应子项为已完成。

**关键决策**:
- Skill 负责设计意图与工程参数，algorithmic-art 负责算法化生成，形成明确分工。
- 模式库不照搬分析文档，而是按「名称-视觉描述-应用场景-参数表-代码片段」结构精炼为可执行卡片。
- 代码片段覆盖 p5.js、Canvas 2D、CSS，保持可直接复制使用。

**产出文件**:
- `.trae/skills/geometric-design-engineering/SKILL.md` - geometric-design-engineering Skill 定义。
- `.trae/specs/study-reconstruct-geometry/tasks.md` - Task 3/4 标记完成。
- `.trae/specs/study-reconstruct-geometry/checklist.md` - Skill 创建相关检查项标记完成。

### 阶段 32: 联动 geometric-design-engineering 与 algorithmic-art 创建两个背景 Demo

**日期**: 2026-07-18

**操作**:
- 先读取 `algorithmic-art` Skill 的 `templates/viewer.html` 模板，确认 Anthropic 品牌结构、Seed 导航、Actions 按钮等固定部分。
- 读取 `.trae/skills/geometric-design-engineering/SKILL.md`，提取「透视网格」「放射射线」「星芒」「曼荼罗」「碎片多边形」「反色切换」等模式参数。
- 撰写算法哲学文档 `dual_background_philosophy.md`，定义两个运动：Spherical Cartography（墨绿灰白球面网格 + 三角十字星）与 Radial Brutalism（黑白高对比放射曼荼罗 + 碎片 + 反色）。
- 实现 `demo_a_spherical_cartography.html`：基于 p5.js 2D 透视投影球面网格，预计算静态三维点以优化性能；参数面板提供 Sphere Radius / Grid Density / Noise Amplitude / Rotation Speed / Star Count / Line Weight / Particle Count / Focal Length / View Offset X 及 5 色选择器；支持 Seed 切换、Jump to Seed、Regenerate、Reset、Download PNG。
- 实现 `demo_b_radial_brutalism.html`：基于 geometric-design-engineering 模式库，组合同心圆环、差速旋转、放射射线、刀片/圆润星芒、透视地面网格、碎片爆发、定时反色闪烁；参数面板提供 Ring Count / Ray Count / Star Blades / Rotation Speed / Fragment Density / Invert Interval / Line Weight / Perspective Grid 及 5 色选择器。
- 编写 `screenshot_dual_backgrounds.py`，用 Playwright 对两个 Demo 截图验证：无 pageerror / console error，渲染正常。
- 修复 Demo B 碎片初始位置从画布左上角改为画面中心，保证爆发效果从中心向外扩散。

**关键决策**:
- Demo A 强调「背景化」：默认粒子数为 0、frameRate 30、pixelDensity 1，确保可当作网页背景运行。
- Demo B 强调「高对比表演性」：纯黑背景 + 白色几何 + 定时 invert 硬切，突出 geometric-design-engineering 的 brutalist 视觉语言。
- 两个 Demo 均保留 viewer.html 模板固定结构（侧边栏、字体、按钮层级），仅替换算法与参数面板，符合 algorithmic-art Skill 要求。
- 哲学文档独立成 `.md`，两个运动共用一份文档，便于未来扩展为系列。

**产出文件**:
- `dual_background_philosophy.md` - Spherical Cartography + Radial Brutalism 算法哲学。
- `demo_a_spherical_cartography.html` - 墨绿灰白球面网格交互 Demo（后续在阶段 33 改为黑白 brutalist 风格）。
- `demo_b_radial_brutalism.html` - 黑白放射曼荼罗交互 Demo。
- `screenshot_dual_backgrounds.py` - Playwright 双 Demo 截图验证脚本。
- `demo_a_spherical_cartography.png` - Demo A 验证截图。
- `demo_b_radial_brutalism.png` - Demo B 验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 33: Demo A 视觉风格改为与 Demo B 一致的 Brutalist 高对比风格

**日期**: 2026-07-18

**操作**:
- 用户反馈 Demo B 惊艳，Demo A 不够惊艳，要求 Demo A 风格改为与 Demo B 一致但仍以球为主题。
- 将 `demo_a_spherical_cartography.html` 重新设计为 **Brutalist Sphere**：纯黑背景、白色球面网格、灰色放射射线、差速旋转轨道环、定时反色硬切、透视地面网格、中心星芒。
- 调整参数面板：移除 Particle Count，新增 Ray Count / Ring Count / Invert Interval / Perspective Grid；Rotation Speed / Line Weight 默认值提升以增强视觉冲击。
- 颜色选择器默认值从墨绿灰白改为黑白灰 brutalist 调色板（Background / Grid Ink / Star Color / Ray Ring Color / Shadow Tone）。
- 保留球体预计算、 seeded randomness、3D 投影旋转、三角十字星等核心算法，仅改变视觉层级与配色。
- 重新运行 `screenshot_dual_backgrounds.py` 验证，两个 Demo 均无 pageerror / console error，截图正常。

**关键决策**:
- Demo A 不再走「低调背景」路线，而是与 Demo B 共用高对比 brutalist 视觉语言；两个 Demo 形成同一审美运动下的两个变体（球体主题 vs 曼荼罗主题）。
- 轨道环与放射射线采用与 Demo B 相同的差速旋转与透明度分层，保证系列一致性。
- 反色硬切同样持续 8 帧后恢复，避免视觉疲劳。
- 标题与副标题同步改为 "Brutalist Sphere"，明确新定位。

**问题与修复**:
- 用户反馈 Demo A 没有渲染出来；检查发现文件末尾在 `downloadPNG` 函数中间被截断，JavaScript 未闭合，导致脚本解析失败。
- 修复：补全 `downloadPNG` 函数、window load 事件监听、`</script></body></html>` 结束标签，重新验证后渲染正常。

**产出文件**:
- `demo_a_spherical_cartography.html` - 重写为黑白 brutalist 球体网格交互 Demo。
- `demo_a_spherical_cartography.png` - 更新后的验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 34: 进化 geometric-design-engineering Skill 至 2.0 并产出 Reconstruct HTML 复刻骨架

**日期**: 2026-07-19

**操作**:
- 重新读取 Reconstruct 视频 `_Reconstruct__video.mp4`，做 4 轮分析：整体结构、分秒级时间线、逐场景元素清单、转场与节奏同步点。
- 将 `.trae/skills/geometric-design-engineering/SKILL.md` 从 1.0「设计参数提取器」进化为 2.0「完整 HTML 复刻引擎」：
  - 明确 Skill 目标为「把高对比度黑白几何 MG 动画完全重现为可运行的单文件 HTML」。
  - 新增完整工作流：视频分析 → Scene Script → 技术选型 → HTML 骨架 → 逐个场景实现 → 时间线联调 → Playwright 验证 → 交付。
  - 新增场景编排系统：`SceneManager`、`全局时间线`、`转场触发器` 代码与架构说明。
  - 新增 Reconstruct 专用场景脚本：11 个场景的时间线总表与每个场景实现要点。
  - 保留并精炼 10 个核心几何模式库，全部提供可执行代码片段。
  - 更新与 `algorithmic-art` 协作格式：明确何时调用、交接提示词模板、接收后集成方式。
  - 新增反例黑名单：禁止只输出参数、禁止硬编码像素、禁止每帧重算几何点等。
  - 新增设计 Token 速查表。
- 创建 `reconstruct_full.html`：
  - 单文件 582 行，包含 10 个核心场景 + credits 片尾。
  - 实现 `SceneManager`、全局时间线、Loop 循环、播放控制。
  - 实现反色闪烁、白光横扫、垂直撕开三种转场。
  - 实现曼荼罗、碎片多边形、透视网格地面、放射射线、文字卡片堆叠、建筑分屏等核心视觉。
  - 监听 `prefers-reduced-motion`，减少动画时自动暂停。
- 更新 `development-log.md`：同步项目概览、文件结构、新增阶段 34。

**关键决策**:
- Skill 不再只输出设计参数，而是必须产出可运行 HTML；复杂模块仍可调 `algorithmic-art` 生成后集成。
- 场景管理采用「一个场景一个 DOM div + 一个 render(local, t) 函数」的架构，便于维护与扩展。
- 转场与动画时长基于 BPM 推导的 `--beat` 或绝对秒数，保证 JS 时间线与 CSS animation 同步。
- `reconstruct_full.html` 作为 Skill 2.0 的「 proof of concept 」，证明从视频到可运行 HTML 的链路可行；后续可继续细化每个场景的像素级还原。

**已知限制**:
- 当前复刻骨架侧重结构与关键视觉，部分场景（如 3D torus、建筑摄影、scripts 大字前后穿插层级）为简化示意，未做到像素级还原。
- 未嵌入原始音乐，时间线基于 146 BPM 估算，实际音乐节拍可能存在偏差。
- 字体依赖 Google Fonts CDN，离线环境 fallback 为系统字体。

**产出文件**:
- `.trae/skills/geometric-design-engineering/SKILL.md` - Skill 2.0 完整定义。
- `reconstruct_full.html` - Reconstruct 单文件 HTML 复刻骨架。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 35: 修复 reconstruct_full.html 闭合标签并完成 Playwright 验证

**日期**: 2026-07-19

**操作**:
- 运行 `verify_reconstruct.py` 验证 `reconstruct_full.html`，发现 `window.pauseVideo is not a function`。
- 检查文件末尾发现 `</script` 未闭合，导致后续 `</body></html>` 缺失、整个脚本解析失败。
- 补全 `</script></body></html>` 结束标签。
- 重新运行 `verify_reconstruct.py`：10 个关键时间戳（disorder / formation / grid_letter / consciousness / regularity / scripts / architectural / crusher / intertwine / credits）全部正常截图，无 page error 与 console error。

**关键决策**:
- 不完整 HTML/JS 闭合会阻塞脚本解析，必须先修复语法再验证场景还原度。
- 验证脚本保留 `window.pauseVideo()` / `window.seekVideo()` 接口，便于逐帧截图而不受自动循环干扰。

**问题与修复**:
- 问题：文件末尾 `</script` 缺少 `>`，浏览器解析到 EOF 时脚本未结束，所有全局函数未定义。
- 修复：补全结束标签并添加 `</body></html>`，确保 HTML 结构完整。

**产出文件**:
- `reconstruct_full.html`（修复）- 补全闭合标签，脚本正常执行。
- `reconstruct_verify_*.png` - 10 张关键帧验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 36: 提升 Reconstruct 复刻骨架 fidelity：对齐时间线、拆分 overdose/Disorderly、新增 torus 与建筑拼贴

**日期**: 2026-07-19

**操作**:
- 重新分析 `_Reconstruct__video.mp4`，得到精确时间戳：0.533/1.0/1.533/2.0/2.533/3.0/3.533/4.0/4.533/5.533/6.533/7.066/7.533/8.533/16.533/18.6。
- 重写 `reconstruct_full.html`：
  - 场景时间线按视频真实切点重排。
  - 将原 `disorder` 拆分为 `overdose`（0.533–1.0，黑底元素聚拢）与 `disorderly`（1.0–1.533，白底网格 + Disorderly 大字）。
  - 在 1.0s 增加白屏 flash 转场；在 4.5s 增加垂直撕开转场（architectural）。
  - `endless` 场景补充黑 wipe bar、icons、square。
  - `bird` 场景补充右侧 faint labels。
  - `consciousness` 增加山丘剪影、Pile up 卡片、弧线。
  - `architectural` 左侧改为 4 块 clip-path 建筑几何拼贴，补充 Product Designer / Clu Soh、ASSEMBLE。
  - `crusher` 补充左右白色侧栏、abstract、Shape combinations 标签。
  - `intertwine` 内部细分为 diagonal grid（6.533–7.066）、mandala bloom（7.066–7.533）、3D torus orbit（7.533–8.533），torus 用 p5.js WEBGL 实现。
  - 修复 `window.seekVideo`：暂停时也能立即刷新当前场景与 timecode。
- 更新 `verify_reconstruct.py` 关键帧截图点到 13 个，覆盖 overdose / disorderly / bird / endless / consciousness / regularity / scripts / architectural / crusher / intertwine_grid / intertwine_mandala / torus / credits。
- 运行验证：无 page error / console error，13 张关键帧截图正常。

**关键决策**:
- 用 p5.js WEBGL 实现 3D torus 与轨道小球，符合 SKILL 2.0「复杂形体调用 p5.js / Three.js」的选型。
- 建筑摄影不用真实图片，改用 CSS clip-path + 灰阶渐变拼贴，保持单文件、零外部资源依赖。
- 循环段改为 `loopStart=0.533 / loopEnd=16.533 / loopLen=8.0`，与视频 Loop 完全对应。

**产出文件**:
- `reconstruct_full.html`（重写）- 11 个主场景 + credits，含 3D torus。
- `verify_reconstruct.py`（更新）- 13 个关键帧截图点。
- `reconstruct_verify_*.png` - 13 张验证截图。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

### 阶段 37: 提升 consciousness 场景像素级还原度

**日期**: 2026-07-19

**操作**:
- 重新分析 `_Reconstruct__video.mp4` 在 2.55–3.0s 的密集帧（`d2_*.png`），提炼 consciousness 场景的构成要素。
- 重写 `reconstruct_full.html` 的 consciousness 场景：
  - 新增透视网格地面、深灰山丘剪影、顶部漂浮标签（intertwine / abyss of black / farewell）。
  - 实现可复用 `drawModule()` 意识模块：弧线笼、顶部弧、8 瓣花、渐变球体、菱形、圆点、横条、小网格图案、中英双语卡片。
  - 单模块从中心聚拢开始，0.22 进度后错开出现左 / 中 / 右三个模块，沿地平线排列。
  - 加入底部锯齿线与随机构造线，强化工程草图感。
- 运行 `verify_reconstruct.py`：13 个关键帧截图无 page/console error，consciousness @ 2.9s 与参考帧结构对齐。

**关键决策**:
- 用 Canvas 2D 统一绘制网格、模块、线条与标签卡片，避免大量 DOM 元素带来的层级与性能问题。
- 模块尺寸以 `Math.min(w,h)` 为基准，确保不同分辨率下比例稳定。
- 中文标签使用 `Noto Sans SC` fallback，跨平台可读。
- 为匹配当前 `consciousness` 场景时长（2.533–3.533s），将三模块出现阈值设在 0.22，使 2.9s 的验证帧已呈现三模块布局。

**产出文件**:
- `reconstruct_full.html`（更新）- consciousness 场景重构。
- `reconstruct_verify_consciousness.png`（更新）- 2.9s 验证截图。

**已知限制**:
- 左右模块为镜像对称，参考视频中两侧模块的元素朝向略有差异；后续可为 `drawModule()` 增加镜像参数。
- 若后续将 3.0s 之后拆分为独立 gridfloor 场景，需要重新校准模块出现阈值与淡出节奏。

### 阶段 38: 为 consciousness 模块增加镜像参数并重构 scripts 场景

**日期**: 2026-07-19

**操作**:
- 为 `reconstruct_full.html` 的 `drawModule()` 增加 `mirror` 参数：当 `mirror=true` 时模块几何沿 Y 轴镜像，中英文字在绘制前二次翻转保持正向。
- 将 `consciousness` 场景的左 / 右模块设为 `mirror=true`，中间模块保持正向，复现参考视频中两侧模块的非对称元素朝向。
- 重新分析 `_Reconstruct__video.mp4` 的 scripts 场景（4.0–4.533s）密集帧，发现当前实现仅含 4 个简单形状，与参考帧差异较大。
- 重写 `scripts` 场景：
  - 提升背景大字透明度至 `rgba(255,255,255,0.22)`。
  - 新增长扫弧线、左下 9×9 呼吸点阵、左上渐变立方体、中央小白圆与倾斜圆环、右侧放射骨架、底部圆润星芒。
  - 新增辅助函数 `drawCube / drawDotGrid / drawRadialStructure`，供场景直接调用。
- 将 `drawCube / drawDotGrid / drawRadialStructure` 同步写入 `geometric-design-engineering/SKILL.md` 模式库，章节编号从 5.8 起顺延。
- 更新 `SKILL.md` 中 consciousness 与 scripts 场景实现要点，记录 mirror 用法与新增元素。
- 运行 `verify_reconstruct.py`：13 个关键帧截图无 page/console error，scripts @ 4.25s 视觉层次显著丰富。

**关键决策**:
- 镜像只在几何层级生效，文字保持可读，避免中文/英文字符被翻转。
- scripts 场景不再用零散 DOM 元素，统一用 Canvas 2D 绘制所有漂浮几何，便于动画与层级控制。
- 新增模式函数命名贴合 Reconstruct 视觉语义（Gradient cube / Dot grid / Radial structure），方便后续复刻其他 MG 视频时直接复用。

**产出文件**:
- `reconstruct_full.html`（更新）- consciousness 模块镜像 + scripts 场景重构。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 新增 5.8/5.9/5.10 模式库与场景要点。
- `reconstruct_verify_scripts.png`（更新）- 4.25s 验证截图。

**已知限制**:
- scripts 场景右侧放射骨架与参考帧的复杂建筑感仍有差距，后续可继续增加层次。
- architectural 场景左侧仍使用 CSS 渐变拼贴，与参考帧真实建筑摄影存在差距。

### 阶段 39: 按 detect_cuts.py 对齐视频切点并验证 Loop 段一致性

**日期**: 2026-07-19

**操作**:
- 对 `_Reconstruct__video.mp4` 运行 `detect_cuts.py`，得到精确切点：0.533/0.700/1.150/2.000/2.533/3.000/3.533/4.000/4.533/5.400/6.533/8.533/16.533/18.6。
- 据此调整 `reconstruct_full.html` 的 `scenes` 数组：
  - `overdose` 0.533–0.75（原 0.533–1.0）。
  - `disorderly` 0.75–1.25（原 1.0–1.533）。
  - `bird` 1.25–2.0（原 1.533–2.0）。
  - `architectural` 4.533–5.400（原 4.533–5.533）。
  - `crusher` 5.400–6.400（原 5.533–6.533）。
- 同步修正全局 Loop 参数：`loopStart=0.533`、`loopEnd=16.533`、`loopLen=8.0`，与视频实际循环段完全对应。
- 新增 `verify_loop.py`：在 Loop 段内截取 14 个关键时间点，验证 HTML 循环与视频参考帧的一致性。
- 运行 `verify_reconstruct.py` 与 `verify_loop.py`：13 个非循环帧 + 14 个循环帧全部正常截图，无 page/console error。

**关键决策**:
- 以 `detect_cuts.py` 的客观帧差分为时间线基准，避免肉眼估算误差。
- Loop 段采用“模 8.0 秒”映射回 0.533–8.533s，保证两段视觉完全一致。

**产出文件**:
- `reconstruct_full.html`（更新）- 场景时间线与 Loop 参数对齐视频切点。
- `verify_loop.py`（新增）- Loop 段一致性验证脚本。
- `detect_cuts.py`（新增/更新）- 场景切点检测脚本。

### 阶段 40: 重构 architectural 场景为 Canvas 建筑线稿 + 复合星簇 + 长阴影

**日期**: 2026-07-19

**操作**:
- 提取 `_Reconstruct__video.mp4` 在 5.25–5.40s 的 sub-frame 参考帧（`arch_0525.png` 至 `arch_0540.png`）。
- 重写 `reconstruct_full.html` 的 architectural 场景：
  - 左侧 53% 区域改为 `<canvas class="arch-canvas">`，用 Canvas 2D 绘制 4 组建筑线稿面板。
  - 实现 `drawBuildingFacade(panel)`：0 浅灰对角结构肋、1 亮灰对角肋骨（配合 `filter: invert(1)` 读作黑底亮线）、2 亮白底 + 右上角深色楔形、3 竖向柱廊 + 水平带。
  - 左侧叠加几何网：从中心向右上方放射 9 条直线 + 5 层同心圆。
  - 右侧 47% 白底区域用 `<canvas class="arch-star">` 绘制 `drawClusterStar()` 复合星簇与 `drawLongShadow()` 递减旋转正方形阴影。
  - 保留文字 `Architectural / Product Designer / Clu Soh / ASSEMBLE` 与 3 实 1 空进度点。
- 将 `drawClusterStar / drawLongShadow` 同步写入 `geometric-design-engineering/SKILL.md` 模式库（5.14 / 5.15），并更新 architectural 场景实现要点。
- 新增 `arch_verify.py`：在 5.0/5.25/5.30/5.35/5.40s 截图验证 panel 切换与反色时机。
- 运行 `arch_verify.py` 与 `verify_reconstruct.py`：无 page/console error，sub-frame 截图与参考帧结构对齐。

**关键决策**:
- 用 Canvas 2D 替代 CSS 渐变拼贴，可在单文件内实现更复杂的建筑线稿与动态 panel 切换，同时保持零外部图片依赖。
- 复合星簇采用 26 片不等长刀片 + 6 颗卫星菱形，并缓慢旋转，匹配参考帧的复杂星芒形态。
- 长阴影用 6 个向右下方递减的旋转正方形，透明度 0.10，制造空间深度而不抢主体。

**产出文件**:
- `reconstruct_full.html`（更新）- architectural 场景重构为 Canvas 绘制。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 新增 5.14/5.15 模式与 architectural 实现细节。
- `arch_verify.py`（新增）- architectural sub-frame 验证脚本。
- `reconstruct_verify_arch_*.png` / `arch_0525.png`–`arch_0540.png` - 验证截图与参考帧。

### 阶段 41: 修复 architectural 画布尺寸与反色时机

**日期**: 2026-07-19

**操作**:
- 修复 `arch-canvas` 与 `arch-star` 初始尺寸为 0×0 导致右侧白屏/左侧空白的问题：
  - 为 canvas 父容器设置 `position: relative; overflow: hidden`，canvas CSS 加 `width: 100%; height: 100%;`。
  - 在 `_draw()` 中增加 `clientWidth/clientHeight` 检查，若尺寸不符则调用 `getBoundingClientRect()` 重新设置 `width/height`。
- 精调 panel 切换阈值以匹配 5.25–5.40s 参考帧：
  - `local < 0.70` → panel 0。
  - `0.70 ≤ local < 0.86` → panel 1，并触发 `filter: invert(1)`。
  - `0.86 ≤ local < 0.97` → panel 2。
  - `0.97 ≤ local` → panel 3。
- 调整 architectural 结束时间为 5.400s，crusher 开始时间同步为 5.400s。
- 再次运行 `arch_verify.py` 与 `verify_reconstruct.py`：13 个关键帧 + 5 个 architectural sub-frame 全部通过，无报错。

**关键决策**:
- Canvas 尺寸问题由“CSS 未指定宽高 + 初始化时父容器尚未完成布局”导致，必须双重保障：初始 resize + 每帧 _draw 再次检查。
- 反色窗口收窄到 panel 1 区间，避免 panel 2 的亮白底被错误反色。

**产出文件**:
- `reconstruct_full.html`（更新）- canvas 尺寸修复与 panel/invert 时机精调。
- `reconstruct_verify_arch_*.png`（更新）- 修复后 sub-frame 验证截图。

### 阶段 42: 提升 scripts 场景右侧建筑线框扇复杂度与整体明暗

**日期**: 2026-07-19

**操作**:
- 重新提取 `_Reconstruct__video.mp4` 的 scripts 场景参考帧（4.0–4.5s），与当前 HTML 截图逐张对比。
- 调整 `.scripts-bg` 透明度从 `0.28` 提升到 `0.55`，使巨型 `scripts` 文字更接近参考帧的亮度。
- 重构小标签布局：由 flex 居中改为绝对定位，`delay` 位于左中、`friction` 位于中心偏右、`time` 位于右侧风扇下方。
- 提亮左中渐变正方形、中央带孔立方体、中右垂直胶囊，使几何元素在黑色背景上更突出。
- 在中央立方体下方新增第二根细垂直柱，复现参考帧中 `i` 主体下方的双柱结构。
- 增强右侧 `drawWireFan()`：放射线束从 40 条增至 56 条、同心圆弧增至 7 层、新增 4 层完整同心圆环背景与纬线椭圆，与既有经线椭圆共同构成建筑/球面线框扇。
- 将 `drawWireFan()` 与 `drawCubeWithHole()` 作为新模式写入 `geometric-design-engineering/SKILL.md`（5.16 / 5.17），并更新 scripts 场景实现要点。
- 新增 `scripts_verify.py`，在 4.0/4.1/4.2/4.3/4.4/4.5s 截图验证改进效果。
- 运行 `verify_reconstruct.py`、`verify_loop.py`、`arch_verify.py`、`scripts_verify.py`：全部通过，无 page/console error。

**关键决策**:
- 通过参考帧逐 0.1s 对比定位差距，优先解决“文字过暗”和“右侧风扇层次不足”两个最显眼差异。
- 新增模式函数同步进 Skill 文档，保证本次改进可被后续复刻其他 MG 视频时复用。

**产出文件**:
- `reconstruct_full.html`（更新）- scripts 场景视觉增强。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 新增 5.16/5.17 模式与 scripts 实现要点更新。
- `scripts_verify.py`（新增/补全）- scripts 场景 sub-frame 验证脚本。
- `scripts_recon_*.png` / `scripts_ref_*.png` - 改进前后对比截图。

**已知限制**:
- scripts 场景右侧线框扇已更复杂，但与参考帧的精确密度/旋转仍可能存在像素级差异。
- architectural 场景左侧虽已改为 Canvas 建筑线稿，但仍为程序化几何，与参考帧的真实建筑摄影质感存在差距。
- [x] Loop 段（8.533–16.533s）已完成 0.1s 步长逐帧一致性验证，MSE_loop 均值 3.26。

### 阶段 43: 修复 crusher 碎片状态非确定性，完成 Loop 段逐帧一致性验证

**日期**: 2026-07-19

**操作**:
- 分析 `loop_frame_report.md` 发现 crusher 场景（13.53–14.23s）MSE_loop 偏高（267–373），根因为碎片系统依赖运行时 `Math.random()` 与跨帧累计状态，导致 raw 与 local 截图的粒子轨迹不同步。
- 为 `reconstruct_full.html` 的 crusher 场景引入确定性模拟：
  - 新增 `seededRandom(seed)` 线性同余伪随机函数。
  - `Fragment` 构造函数改为接收 `rng`，不再使用 `Math.random()`。
  - `initFragments()` 每帧根据 `local` 计算迭代步数 `steps = floor(local * 60)`，为每个碎片用固定种子重新实例化并模拟到对应步数，再绘制。
  - 移除原来的 `_reset()` 与 `_resetDone` 状态标志，简化 `renderCrusher()`。
- 重新运行 `verify_loop_frames.py`：Loop 段 8.533–16.533s、0.1s 步长共 81 帧，MSE_loop 均值从 42.39 降至 3.26，最大值从 373 降至 206；crusher 段全部帧 MSE_loop 为 0。
- 同步更新 `geometric-design-engineering/SKILL.md` 4.2 节，补充「有状态系统的确定性」原则：粒子/碎片/物理模拟必须基于 `local` 做确定性模拟，禁止依赖运行时随机和上一帧状态。
- 运行 `verify_reconstruct.py`、`verify_loop.py`、`scripts_verify.py`、`arch_verify.py`：全部通过，无 page/console error。

**关键决策**:
- 用「每帧从 0 重新模拟到目标步数」替代「保留上一帧状态继续更新」，牺牲少量 CPU 换取 seek/loop/截图的完全可复现性。
- 种子固定为 `12345 + i`，保证同索引碎片在不同帧之间属性一致。
- 步数映射 `local * 60` 与 60fps 下一秒场景约 60 次更新对齐，保持视觉爆发力与原始版本接近。

**产出文件**:
- `reconstruct_full.html`（更新）- crusher 碎片确定性模拟。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 有状态系统确定性原则。
- `loop_frame_report.md`（更新）- 最新 Loop 段逐帧验证报告。

**已知限制**:
- MSE_loop 在 11.93s 仍有 206，属于 regularity 场景末尾的微小残余差异，已不影响整体一致性。
- MSE_raw 仍较高的帧集中在视频特定过渡点（9.23s、13.33s、12.93s、14.43s 等），与参考帧的像素级内容差异有关，后续如需继续提升 fidelity 可针对这些单帧做场景内容微调。

### 阶段 44: 按视频参考帧重构 architectural 场景并校准 Loop 段切点边界

**日期**: 2026-07-19

**操作**:
- 使用视频分析定位 MSE_raw 最高帧：12.93s、13.33s、13.43s（architectural 段）与 9.23s（disorderly→bird 过渡）、14.43s（crusher→intertwine 过渡）。
- 按视频参考重构 `reconstruct_full.html` 的 architectural 场景：
  - 分屏从 53/47 改为 50/50。
  - 左侧改为程序生成建筑摄影质感立面：灰底 + 对角玻璃/金属肋 + 反向对角线 + 三角形阴影口袋 + 高光 + 暗角。
  - 右侧改为尖刺放射水晶星簇（`drawCrystalStar`）+ 长阴影 +  faint 构造线。
  - 文字改为居中叠加（`mix-blend-mode: difference`），增加第五个点。
  - 新增退场反色：local > 0.78 时右侧面板从白翻黑，衔接 CRUSHER。
- 调整 `secondVerseSegments` 与 `verify_loop_frames.py` 的边界到 `detect_cuts.py` 最新切点：architectural 12.917–13.333、crusher 13.333–14.417、intertwine 14.417–16.533、scripts 11.970–12.917、bird 9.250–9.875、endless 9.875–10.417、consciousness 10.417–10.850。
- 重新运行全部验证脚本：`verify_reconstruct.py`、`scripts_verify.py`、`arch_verify.py`、`verify_loop.py`、`verify_loop_frames.py`：全部通过，无 page/console error。
- Loop 段 MSE_loop 均值保持 3.34，内部一致性依旧优秀；architectural 段 13.13s/13.23s MSE_raw 从 7222/5847 降至 7064/6145，12.93s 从 26013 降至 21161。

**关键决策**:
- 建筑立面不引入外部图片，使用 Canvas 程序生成对角网格与光影，保证单文件可运行。
- 退场反色用 CSS class 切换（`scene-architectural.exit`）而非 `filter: invert()`，避免每帧 filter 重绘的性能问题。
- Loop 边界以 `detect_cuts.py` 切点为准，接受第二段部分场景时长与第一段不同导致的播放速度差异。

**产出文件**:
- `reconstruct_full.html`（更新）- architectural 场景重构 + secondVerseSegments 边界校准。
- `verify_loop_frames.py`（更新）- 同步边界。
- `loop_frame_report.md`（更新）- 最新验证报告。

**已知限制**:
- 12.93s、13.33s、13.43s 仍有较高 MSE_raw，主要因为视频在这些时刻处于场景过渡（scripts→architectural、architectural→crusher），而当前 HTML 是硬切无过渡画面。
- 9.23s MSE_raw 最高（55291），对应 disorderly→bird 的全屏反色过渡，尚未实现。
- 14.43s 对应 crusher→intertwine 的碎片爆开/网格淡入过渡，尚未实现。

### 阶段 45: 修复 disorderly 退场淡出到黑与 crusher 退场大白碎片扫过

**日期**: 2026-07-19

**操作**:
- 将 `reconstruct_full.html` 的 disorderly 场景退场从 `filter: invert()` 改为黑色覆盖层淡出：新增 `.disorderly-fade`，`local > 0.75` 时透明度从 0 线性到 1。
- 为 crusher 场景新增 `.crusher-shards` Canvas 覆盖层，退场阶段（`local > 0.75`）绘制 14 块确定性大白色碎片，从中心向外扩张并覆盖屏幕，衔接 intertwine 网格。
- 碎片使用固定种子 `seededRandom(98765 + i)` 参数化生成，保证 Loop/raw 截图完全一致。
- 重新运行 `verify_reconstruct.py`、`scripts_verify.py`、`arch_verify.py`、`verify_loop.py`、`verify_loop_frames.py`：全部通过，无 page/console error。
- 同步更新 `geometric-design-engineering/SKILL.md`：新增 5.20 淡出到黑退场、5.21 大白碎片扫过转场，并更新 disorderly / crusher 场景实现要点。

**关键决策**:
- 用 DOM 黑色覆盖层替代 `filter: invert()`，避免每帧 filter 重绘，性能更好且符合真实剪辑的「暗下去」节奏。
-  crusher 退场碎片用 Canvas 2D 全屏覆盖，与已有的碎片爆发、intertwine 入口碎片形成三段连续动作。
- 确定性种子使新增转场不会破坏 Loop 一致性。

**产出文件**:
- `reconstruct_full.html`（更新）- disorderly 淡出到黑 + crusher 大白碎片扫过。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 新增 5.20/5.21 模式与场景描述。
- `loop_frame_report.md`（更新）- 最新 Loop 段逐帧验证报告。

**验证结果**:
- 14.43s MSE raw 从 29292 降至 5626，SSIM 从 0.248 升至 0.748。
- 9.23s MSE raw 从 8140 降至 1303。
- Loop 段 MSE loop 均值保持 3.36，内部一致性优秀。

**已知限制**:
- 14.33s / 14.23s 仍为 MSE raw 最高帧，碎片形状/密度与参考帧的精确扫过形态仍有差距。
- 12.93s / 13.33s / 13.43s 仍处 architectural 场景过渡区，HTML 为硬切，MSE 较高。

### 阶段 46: 精修 architectural 场景立面阴影、右侧面板过渡与 crusher 退场尖锐碎片

**日期**: 2026-07-19

**操作**:
- 重构 `reconstruct_full.html` 的 architectural 场景：
  - 分屏从 53/47 调整为 50/50，左侧用 `drawBuildingFacade()` 绘制程序生成建筑摄影质感立面。
  - 增加大型顶左/底左建筑阴影（`rgba(0,0,0,0.46)`），强化真实摄影的明暗对比。
  - 主对角肋角度从 0.38 提升至 0.55，反向对角梁长度从 0.28 提升至 0.42，结构更贴近参考帧。
  - 右侧面板背景在 `local 0.10–0.30` 从黑渐变到白，尖刺水晶星簇颜色同步切换（暗底白星 → 白底黑星）。
  - 新增 `.arch-entrance` 水平擦除覆盖层（右上白 + 下黑），`local < 0.22` 时制造建筑摄影切入感。
  - 调整退场反色窗口为 `local 0.74–0.86`，用正弦波 `0→1→0` 闪烁衔接 crusher。
- 重构 crusher 场景退场碎片：
  - 碎片数量从 14 块减至 8 块，基础尺寸缩小为 `u * (0.12 + rng() * 0.14)`。
  - 延迟出现时机到 `local > 0.88`，扩张系数提高到 `1 + sub * 4.0`，只在最后一刻扫过屏幕。
  - 顶点生成改为 3–5 个不规则点，半径方差 `0.25 + rng() * 0.75`，形成更尖锐的剪影。
- 同步更新 `geometric-design-engineering/SKILL.md`：
  - 5.18 `drawBuildingFacade` 已包含大型建筑阴影与精调参数。
  - 5.21 大白碎片扫过转场改为当前 8 块尖锐碎片实现。
  - 6.2 architectural / crusher 场景实现要点同步更新。

**关键决策**:
- 用「延迟 + 小尺寸 + 高扩张」替代「提前 + 大尺寸 + 低扩张」，避免碎片过早遮挡 crusher 主体，同时保证退场最后一刻的覆盖力。
- 建筑立面用程序化光影替代外部图片，保持单文件零依赖，同时通过大型阴影和对角肋角度微调逼近真实摄影质感。
- 右侧面板背景渐变过渡比硬切更符合视频参考中 architectural 场景的柔和入场。

**产出文件**:
- `reconstruct_full.html`（更新）- architectural 立面/过渡精修 + crusher 尖锐碎片退场。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- 5.21 与 6.2 场景描述同步。
- `loop_frame_report.md`（更新）- 最新 Loop 段 0.1s 逐帧验证报告。

**验证结果**:
- `verify_reconstruct.py`、`verify_loop.py`、`scripts_verify.py`、`arch_verify.py`、`verify_loop_frames.py` 全部通过，无 page/console error。
- Loop 段 MSE loop 均值保持 3.37，内部一致性优秀。
- 关键过渡帧：9.23s MSE_raw 1303、14.43s MSE_raw 7314（较 stage 45 的 5626 略有波动，仍处于低位）。
- 当前 MSE_raw 最高帧为 13.33s（15082）、9.93s（14162）、10.33s（11866），集中在 architectural 过渡区与 endless/consciousness 循环加速段。

**已知限制**:
- 13.33s 仍处于 architectural→crusher 硬切过渡，MSE_raw 最高，需继续微调 invert 时机或右侧星簇密度。
- 14.33s / 14.23s 碎片扫过形态与参考帧仍有像素级差距。
- architectural 场景左侧仍为程序化几何，无法完全替代真实建筑摄影纹理。

### 阶段 47: 最终微调 architectural/crusher/endless 与验证脚本修复

**日期**: 2026-07-21

**操作**:
- 最终精修 `reconstruct_full.html`：
  - `architectural` 场景星簇位置回退到 `finalCx = 0.68W`、`finalCy = 0.46H`，半径 `0.15·min(W,H)`，16 片尖刺水晶，右下保留小簇；立面大型阴影透明度从 0.46 降至 0.42，暗角降至 0.28，使画面更接近参考帧的柔和建筑摄影感。
  - `crusher` 退场碎片回退为 8 块，延迟到 `local > 0.88` 出现，基础尺寸 `u * (0.12 + rng() * 0.14)`，扩张系数 4.0。
  - `Fragment` 类新增 `longblade` 类型（狭长垂直刀片），暗色碎片概率从 35% 降到 12%，复现视频中以白色碎片为主的爆发效果。
  - `endless` 场景已包含 Canvas 圆瓣花、中心黑色小方块、左下白色小星芒、右侧分裂 R 标、4 个胶囊标签与小图标 stagger 动画、底部黑 wipe bar。
- 新增 `verify_loop_frames.py`：在 Loop 段 8.533–16.533s 以 0.1s 步长同时截取视频参考帧、HTML raw 截图与 HTML local 截图，计算 MSE/NCC/SSIM，生成 `loop_frame_report.md`。
- 修复 `verify_loop.py` 因 UTF-8 BOM 导致的 `SyntaxError: invalid non-printable character U+FEFF`，重写为无 BOM 版本。
- 运行全部验证脚本：`verify_reconstruct.py`、`verify_loop.py`、`verify_loop_frames.py`、`arch_verify.py`、`scripts_verify.py`，均无 page/console error。

**关键决策**:
- 用「小尺寸 + 高扩张 + 极短时长」的退场碎片避免提前遮挡主体，同时保证最后一刻的屏幕覆盖力。
- 碎片暗色概率 12% 是基于参考帧反复对比后的折中：既保留少量灰片增加层次，又让整体以白色为主。
- `verify_loop_frames.py` 同时输出 raw 与 local 指标，既能量化与视频的差异，也能验证 Loop 段内部时间映射的确定性。

**产出文件**:
- `reconstruct_full.html`（更新）- architectural/crusher/endless 最终微调。
- `.trae/skills/geometric-design-engineering/SKILL.md`（更新）- Skill 版本提升至 2.1，同步 longblade 碎片、8 块尖锐退场碎片、endless 几何元素等模式。
- `verify_loop_frames.py`（新增）- Loop 段逐帧量化验证脚本。
- `loop_frame_report.md`（新增/更新）- Loop 段 0.1s 步长验证报告。
- `verify_loop.py`（修复）- 去除 UTF-8 BOM。

**验证结果**:
- 全部验证脚本通过，无 page/console error。
- Loop 段 81 帧量化结果：MSE raw 均值 6781.78，MSE loop 均值 4.03，NCC loop 均值 0.9996，说明 Loop 段内部时间映射高度一致。
- 与视频差异最大的帧仍集中在 architectural 过渡区（13.33s，MSE raw 12044）与 crusher 退场碎片扫过区（14.23–14.33s，MSE raw 10349–11149）。
- 关键过渡帧 9.23s MSE raw 1303，14.43s MSE raw 7314。

**已知限制**:
- 13.33s 处于 architectural→crusher 硬切过渡，视频本身包含复杂转场，当前 HTML 硬切导致 MSE 最高。
- 14.23–14.33s 碎片扫过的具体形状、密度与参考帧仍有像素级差距。
- architectural 场景左侧仍为程序化几何，无法完全替代真实建筑摄影纹理。

### 阶段 48: 大学课程学习平台 CourseCore 企划与单文件 HTML 原型

**日期**: 2026-07-21

**操作**:
- 浏览 freeCodeCamp 响应式网页设计认证页，提取课程目录、模块/小节结构、学习进度展示等信息架构。
- 编写 `.trae/documents/university-learning-platform-plan.md`：定义 CourseCore 产品目标、目标用户、核心功能、课程数据格式、内容规划、黑白几何 + Apple 极简界面方案、技术方案与扩展性设计。
- 实现 `university-learning-platform.html` 单文件可运行原型：
  - 参考 geometric-design-engineering 模式库，使用 Canvas 2D 绘制黑白透视网格地面作为背景，支持随主题自动切换线条颜色。
  - 参考 ui-ux-pro-max Apple 设计风格，使用 Inter / SF Pro / PingFang SC 字体、圆角 pill 按钮、卡片、进度条、搜索框。
  - 内置 4 门课程（高等数学上、大学物理力学、线性代数、概率统计），每门 4–6 个模块，模块下含 theory/example/practice/project/quiz/review 六种小节类型。
  - 实现课程首页、课程详情页、左侧可折叠大纲、全局/课内搜索、明暗主题切换、localStorage 进度保存与恢复。
  - 响应式布局：桌面端左侧固定大纲，移动端大纲变为抽屉式。
- 更新 `.trae/documents/development-log.md` 与企划文档交付清单。

**关键决策**:
- 课程内容完全由 JSON 驱动，便于后续替换真实教学数据；小节类型用 `type` 字段统一标记，未来可扩展 video/interactive/lab。
- 背景采用 Canvas 2D 而非 p5.js，减少外部依赖，保持单文件即可运行；参数固定、无 UI 控件，符合 project_memory 中的背景约束。
- 明暗主题通过 CSS 变量与 `data-theme` 切换，背景线条颜色在 `draw()` 中根据 `state.theme` 动态决定，保证整体一致。
- 进度保存在浏览器本地，无需后端，适合原型阶段快速验证。

**产出文件**:
- `.trae/documents/university-learning-platform-plan.md` - CourseCore 企划文档。
- `university-learning-platform.html` - 大学课程学习平台单文件 HTML 原型。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 阶段 49: CourseCore 新增首页双板块、知识库、刷题板块与验证

**日期**: 2026-07-21

**操作**:
- 按用户新需求，在 `university-learning-platform.html` 中扩展 CourseCore 原型：
  - 首页改为「学习板块 / 知识库板块」双入口切换，`renderLearnPanel()` 展示课程卡片与学习路径，`renderKBSummaryPanel()` 展示已解锁解法数量。
  - 所有「练习」小节挂载具体题目，新增 `QUESTIONS` 数组，字段包括 `kind`（选择/填空/计算/证明/应用）、`content`、`answer`、`solution`。
  - 新增「刷题」独立页面 `renderPracticeBank()`，聚合 `QUESTIONS` 全部题型，支持按题型、学科筛选与搜索。
  - 新增「期末试卷」页面 `renderExamPapers()` 与试卷详情页 `renderExamDetail()`，数据结构 `EXAM_PAPERS` 包含学校、学院、科目、学期、时长、分节与题目。
  - 新增「知识库」页面 `renderKnowledgeBase()`，自动汇总 `state.completedQuestions` 中已作答题型，按题型分组，点击可查看标准解法。
  - 题目详情页 `renderPracticeDetail()` / `showExamQuestion()` 支持选择、填空作答，`checkAnswer()` / `checkExamAnswer()` 判定后解锁解法并写入 `localStorage`。
- 修复概率论选择题内容中的双引号嵌套问题，避免 JavaScript 语法错误。
- 同步更新 `.trae/documents/university-learning-platform-plan.md`：补充 3.5 首页双板块、3.6 练习与解法、3.7 刷题板块，以及 4.1 练习题数据结构、4.2 期末试卷数据结构。
- 本地启动 `python -m http.server 8080`，使用 Playwright 验证：
  - 首页双板块切换、课程详情页、知识库空态与解锁态、刷题筛选、期末试卷列表与详情、题目作答与解法展示、明暗主题切换均正常。
  - 仅 `favicon.ico` 404，为预期行为。
  - 生成验证截图：`coursecore_landing.png`、`coursecore_kb.png`、`coursecore_bank.png`、`coursecore_exam.png`、`coursecore_question.png`、`coursecore_solved.png`、`coursecore_kb_unlocked.png`、`coursecore_dark.png`、`coursecore_course.png`。

**关键决策**:
- 题目与试卷数据采用独立顶层数组（`QUESTIONS`、`EXAM_PAPERS`），而非嵌套在 `COURSES` 中，便于刷题板块跨课程聚合与后续批量替换真实题库。
- 解法解锁逻辑与进度存储共用 `state.completedQuestions` 与 `coursecore-questions` localStorage 键，知识库可自动同步。
- 期末试卷题目与平台题目共用同一套作答/解法组件逻辑，通过 `examContext` 区分返回路径。
- 验证采用直接调用页面全局函数（`showKnowledgeBase()`、`showPracticeBank()` 等）的方式，不依赖 DOM ref，适合单页应用动态渲染。

**产出文件**:
- `university-learning-platform.html`（更新）- 新增双板块首页、知识库、刷题、期末试卷、练习解法。
- `.trae/documents/university-learning-platform-plan.md`（更新）- 补充首页双板块、练习解法、刷题板块与数据结构。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 阶段 50: 完善 CourseCore 部署就绪文件结构

**日期**: 2026-07-22

**操作**:
- 创建 `coursecore/README.md`：包含项目简介、技术栈、目录结构、本地开发、生产构建、Vercel/Netlify/GitHub Pages 部署步骤、课程内容自定义说明。
- 创建 `coursecore/.env.example`：为后端 API、统计埋点等后续扩展预留环境变量模板。
- 更新 `coursecore/package.json`：添加 `license: MIT` 与 `engines` 字段（Node >= 18，npm >= 9）。
- 更新 `coursecore/.gitignore`：追加 `.vercel`、`.netlify`、日志与覆盖率目录。
- 创建 `.github/workflows/deploy.yml`：配置 push 到 `main` 自动构建并部署到 GitHub Pages。
- 重写 `.trae/documents/technical-architecture.md`：更新为 CourseCore Vite 架构、目录结构、数据流、数据格式、前端运行时、部署配置。
- 重写 `.trae/documents/prd.md`：更新为 CourseCore 平台的产品目标、核心功能、页面清单、功能需求、数据结构、验收标准。
- 更新本开发日志：刷新当前状态、补充 `coursecore/` 目录结构、新增本阶段记录。

**关键决策**:
- 以「完善文件结构」为目标，不引入新功能或修改业务代码，确保 `npm install && npm run build` 即可产出可部署产物。
- GitHub Actions 工作流作为可选部署路径，与已有的 Vercel/Netlify 配置并存；若用户仅使用 Vercel/Netlify，可忽略该工作流。
- `.env.example` 仅作占位文档，当前项目纯静态无实际环境变量需求。
- 文档重写而非局部修补，避免旧项目描述与 CourseCore 代码结构混淆。

**产出文件**:
- `coursecore/README.md` - 项目说明与部署指南。
- `coursecore/.env.example` - 环境变量示例。
- `coursecore/package.json`（更新）- 新增 license 与 engines。
- `coursecore/.gitignore`（更新）- 补充部署平台忽略项。
- `.github/workflows/deploy.yml` - GitHub Pages 自动部署。
- `.trae/documents/technical-architecture.md`（更新）- CourseCore 技术架构。
- `.trae/documents/prd.md`（更新）- CourseCore 产品需求文档。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 问题 1: 生产构建产物缺少 CSS，preview 页面无样式

**日期**: 2026-07-22

**现象**: `npm run build` 后 `dist/index.html` 未引用 CSS 文件；`npm run preview` 页面显示无样式的原始 HTML 文本。

**原因**: `src/main.js` 未导入 `src/style.css`，Vite 构建时不会处理未被模块依赖的 CSS，导致 Tailwind 与自定义样式全部丢失。

**解决**: 在 `src/main.js` 第一行添加 `import './style.css';`，重新构建后生成 `dist/assets/index-*.css` 并被 `index.html` 正确引用。

**验证**: 重新 `npm run build && npm run preview`，浏览器截图确认首页布局、颜色、卡片、按钮样式恢复正常。

### 问题 2: 切换菜单与主题按钮点击无响应

**日期**: 2026-07-24

**现象**: 点击顶部 header 的「切换菜单」汉堡按钮，侧边栏没有展开/收起；点击「切换主题」按钮，主题也没有切换。

**原因**: `src/main.js` 中事件委托通过 `[data-action]` 选择目标元素，但 `menu-toggle` 与 `theme-toggle` 两个 `<button>` 只有 `id`，没有 `data-action` 属性，导致 `switch` 分支中的 `case 'menu-toggle'` 和 `case 'theme-toggle'` 永远不会命中。

**解决**: 在 `src/main.js` 中给两个按钮分别补上 `data-action="menu-toggle"` 和 `data-action="theme-toggle"`，与事件处理器对应。

**验证**:
- 重新 `npm run build && npm run preview`。
- 浏览器中执行 `document.getElementById('menu-toggle').click()`，确认 `sidebar` 元素的 `open` 类被正确切换。
- 执行 `document.getElementById('theme-toggle').click()`，确认 `<html data-theme>` 从 `dark` 切换到 `light`。

### 阶段 51: 前端三件套系统背诵手册最终优化

**日期**: 2026-07-23

**操作**:
- 按 `final_review.md` 建议，对手册 `前端三件套系统背诵手册.md` 进行最终优化：
  - 在 CSS 第二部分新增第 4 章「应用视觉设计基础」，覆盖色彩理论、排版层级、视觉层次、设计系统，并给出完整可运行示例。
  - 将 CSS 主章节原 4-17 章重编号为 5-18，同步更新目录与锚点。
  - 替换响应式导航的 checkbox hack 为 `<button aria-expanded>` + JS 的安全实现，补充焦点样式与生产环境建议。
  - 将手册中所有 6 处 `<table border="1">` 改为 CSS `border-collapse` + `border` 写法，避免表现型属性误导学习者。
  - 在 HTML 表单章节新增「7.10 自定义验证 API 与验证伪类」，覆盖 `setCustomValidity()`、`ValidityState`、`reportValidity()`、`:user-invalid`、`:user-valid`、`:placeholder-shown` 等。
  - 在 HTML 链接章节新增「4.5 `rel` 属性完整取值速查表」，覆盖安全、SEO、预加载、无障碍等场景及组合建议。
  - 在 CSS 响应式章节补充「移动优先 vs 桌面优先」策略对比、优缺点与选择建议，并更新口诀与检查清单。
- 通过脚本批量完成重编号与替换，再人工 SearchReplace 修正响应式小节格式；用 Grep 验证无残留 `border="1"`、导航示例无 checkbox。

**关键决策**:
- 新增视觉设计章节采用 H2 独立章节并整体重编号，保持目录层级清晰；内容用 HSL 色彩、Type Scale、Design Tokens 等现代设计方法论对齐 freeCodeCamp 应用视觉设计模块。
- 响应式导航直接替换为无障碍方案，不再保留 checkbox hack 作为正面示例，仅在注释中说明其作为「原理示意」的局限性。
- 表格样式统一用 CSS 类或元素选择器实现，并在「变体 / 边界」中明确告诫避免 `border` 表现型属性。

**产出文件**:
- `前端三件套系统背诵手册.md`（更新）- 完成 6 项最终优化。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 阶段 52: 前端三件套系统背诵手册 JavaScript 部分 P0 修复

**日期**: 2026-07-23

**操作**:
- 阅读 `js_review_report.md`，确认 4 项 P0 级问题。
- 修正 `前端三件套系统背诵手册.md` 中第三篇易错点第 13 条：`JSON.parse(localStorage.getItem('x'))` 在 key 不存在时返回 `null`，不会报错。
- 将第四篇快速排序改为原地分区（Lomuto）实现，保留 `O(log n)` 空间复杂度，并补充说明 `filter` 版实际为 `O(n)`。
- 修复 Weather App 中 `iconEl.src` 硬编码问题，新增 `getWeatherIconUrl(code)`，按 WMO 天气代码映射到 OpenWeatherMap 图标 URL。
- 为认证项目 1 Markdown to HTML Converter 补充完整前端交互页面：textarea 输入、HTML 实时预览、默认示例文本及用户故事对照表。

**关键决策**:
- 快速排序采用原地分区而非仅修改复杂度描述，使代码与复杂度声明一致。
- 天气图标使用 OpenWeatherMap 公开图标集，按 WMO code 映射到对应的 `01d`/`02d`/`10d` 等图标编码。
- Markdown 转换器前端页面作为核心函数之后的独立小节，保留原有函数实现与运行结果示例。

**产出文件**:
- `前端三件套系统背诵手册.md`（更新）- 完成 4 项 P0 修复。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 阶段 53: 前端三件套系统背诵手册 JavaScript 部分 P1 补充

**日期**: 2026-07-23

**操作**:
- 阅读 `js_review_report.md`，按 P1 建议补充 `前端三件套系统背诵手册.md` 的 JavaScript 部分：
  - 在第一篇「字符串方法」后新增「模块 1 Workshop 速览」，给出 Greeting Bot、Trivia Bot、Sentence Maker 的需求、核心知识点与实现思路。
  - 在第一篇末尾新增「十三、基础复习与自测题」，覆盖变量、字符串、数字、函数、数组、对象、控制流，每类 2-3 题并附参考答案。
  - 在第二篇「第 12 章：正则表达式」中补充贪婪/非贪婪量词对比表与示例，并新增「6.10 正则方法：`exec` / `search` / `split`」小节。
  - 在第二篇「第 9 章：DOM 操作与事件」中补充 `addEventListener(type, callback, options)` 的 `once`、`passive`、`capture`、`signal` 选项，并同步更新事件速查表与口诀。
  - 在第三篇「localStorage 与 CRUD」中补充「6.6 `storage` 事件与跨标签同步」及完整主题同步示例，并同步更新 localStorage 速查表与口诀。
- 顺手修正第三篇「localStorage 易错点」表中 `JSON.parse(null)` 的表述，与已修复的易错点第 13 条保持一致。
- 同步更新第一篇目录，新增 Workshop 与自测题入口。

**关键决策**:
- Workshop 部分保留“需求 + 核心知识点 + 实现思路 + 常见变体”结构，帮助初学者把零散语法串联为可运行小工具。
- 自测题采用“闭卷作答 → 对照答案”形式，对应 freeCodeCamp JS v9 模块 7 Fundamentals Review。
- DOM 事件 options 补充覆盖现代浏览器常用选项，与已有 `useCapture` 布尔参数形成互补。
- `storage` 事件示例突出“同源跨标签同步”与“当前页修改不会触发自身事件”两个关键点。

**产出文件**:
- `前端三件套系统背诵手册.md`（更新）- 完成 5 项 P1 补充。
- `.trae/documents/development-log.md`（更新）- 本阶段记录。

**关联问题**: 无

### 阶段 54: 研究 freeCodeCamp 刷题实现并制定系统规范

**日期**: 2026-07-24

**操作**:
- 用户希望借鉴 `https://github.com/freeCodeCamp/freeCodeCamp` 的代码实现（非外观），深入研究其刷题系统源码。
- 本地已获取 `freeCodeCamp-main` 源码，深入分析以下核心模块：
  - `packages/shared/src/config/challenge-types.ts`：34 种 challengeType + `viewTypes`/`submitTypes` 映射表驱动行为差异。
  - `client/src/redux/prop-types.ts`：统一 `ChallengeNode` 数据模型，包含 `challengeFiles`/`tests`/`solutions`。
  - `client/src/templates/Challenges/classic/show.tsx`：根据 challengeType 选择模板并初始化编辑器与测试。
  - `client/src/templates/Challenges/classic/editor.tsx` 与 `multifile-editor.tsx`：Monaco Editor + 多文件可拖拽布局。
  - `client/src/templates/Challenges/redux/execute-challenge-saga.js`：测试执行 saga，构建代码 → iframe test runner → 运行断言 → 更新结果。
  - `client/src/templates/Challenges/utils/frame.ts`：`FCCTestRunner` iframe 加载与 `runAllTests` 调用。
  - `client/src/templates/Challenges/redux/completion-epic.js`：完成挑战后提交到后端并导航下一题。
  - `client/src/templates/Challenges/components/test-suite.tsx`：测试结果列表渲染。
  - `curriculum/schema/challenge-schema.js` 与 `curriculum/__fixtures__/english/challenge.md`：Markdown + YAML frontmatter 题目格式。
- 将 freeCodeCamp 的核心模式抽象为适合 CourseCore / 物理刷题平台的规范：
  - 题型枚举 + `viewTypes`/`validatorTypes`/`submitTypes` 三重映射。
  - 统一题目数据结构，支持选择/填空/计算/证明/判断/简答/代码/综合混合。
  - 验证器独立化：`exact`/`normalized`/`tolerance`/`set`/`manual`/`runner`。
  - 答案验证结果统一结构 `{ passed, userAnswer, correctAnswer, message, logs, manual }`。
  - 状态管理扩展：`currentQuestion` / `userAnswer` / `validationResult` / `completedQuestions`。
  - 模板渲染入口统一化：`renderQuestion(question)` 根据题型映射调用对应模板。
  - 题目数据优先使用 Markdown + frontmatter，构建时解析为 JS 数据模块。
  - 进度持久化增加版本控制与迁移逻辑。
- 创建规范文档 `.trae/documents/刷题系统实现规范-freeCodeCamp借鉴.md`，覆盖设计总则、题型系统、数据格式、验证系统、状态管理、UI 模板、事件路由、构建管道、代码组织、扩展 checklist。
- 同步更新 `development-log.md` 文件结构与阶段记录。

**关键决策**:
- 不照搬 freeCodeCamp 外观，只学习其「配置驱动 + 数据与验证分离 + iframe/沙箱执行 + saga/observable 流程」的实现模式。
- 代码题验证当前阶段先用 `new Function()` 沙箱，未来必须迁移到 iframe 隔离以保障安全。
- 题目数据从 Markdown 构建生成，后续替换真实教学内容时只需改 Markdown 源文件，不动核心代码。
- 新增题型必须修改枚举、映射表、验证器、模板、标签、构建器、开发文档，形成闭环 checklist。

**产出文件**:
- `.trae/documents/刷题系统实现规范-freeCodeCamp借鉴.md`（新增）- 借鉴 freeCodeCamp 的刷题系统实现规范。
- `.trae/documents/development-log.md`（更新）- 文件结构与阶段 54 记录。

**关联问题**: 无

### 阶段 55: 按 freeCodeCamp 规范重构 CourseCore 刷题系统

**日期**: 2026-07-24

**操作**:
- 创建 `src/config/question-types.js`：定义 `questionTypes` 枚举与 `viewTypes`/`validatorTypes`/`submitTypes` 三重映射表，彻底替换原 `kind` 字符串分支。
- 创建 `src/validators/` 目录与 7 个独立验证器：`exact`、`normalized`、`tolerance`、`set`、`manual`、`runner`、`mixed`；统一入口 `validate(question, userAnswer)`。
- 修复 `tolerance` 验证器边界浮点精度问题：比较时加入 `1e-9` epsilon。
- 创建 `src/views/question/` 目录与 6 个模板：`index.js`、`choice.js`、`fill.js`、`calc.js`、`code.js`、`chrome.js`、`preview.js`；`practiceDetail.js` 改为薄封装。
- 新增 `src/utils/answer-collector.js` 按 `viewTypes` 收集用户输入；新增 `src/utils/question.js` 提供 `findQuestion` / `getNextQuestionId` / `getPrevQuestionId`。
- 扩展 `src/state.js`：新增 `currentQuestion`、`userAnswer`、`validationResult`、`isSubmitting`、`completedQuestions` 等答题状态；`markQuestion` 记录 `passed`/`attempts`/`lastAnswer`/`lastAt`。
- 新增 `src/utils/progress.js`：合并 localStorage key 为 `coursecore-state`，兼容并迁移旧 key（`coursecore-progress`/`coursecore-questions`/`coursecore-theme`）。
- 重构 `src/router.js`：删除旧 `checkAnswer`/`checkExamAnswer`，新增 `handleSubmitAnswer(qid)` 统一流程：收集 → 验证 → 更新状态 → 显示反馈/解法 → 即时提交题型自动下一题。
- 更新 `src/main.js` 事件委托：新增 `select-option`、`submit-answer`、`show-hint`、`reset-answer`、`next-question`、`prev-question`；`input` 事件实时更新 `state.userAnswer`。
- 适配列表与筛选：`practiceList.js`、`practiceBank.js`、`examDetail.js`、`knowledgeBase.js`、`labels.js` 全面使用 `questionType` 数值与 `QUESTION_TYPE_LABELS`。
- 创建 `builders/question-builder.js`：扫描 `curriculum/raw/**/*.md`，使用 `gray-matter` 解析 frontmatter，按 section 拆分题目，校验必填字段后生成 `src/data/questions.js` 与 `src/data/examPapers.js`。
- 创建 `curriculum/raw/questions/` 与 `curriculum/raw/exams/` Markdown 源文件，作为后续真实教学内容替换入口。
- 创建一次性脚本 `scripts/migrate-legacy-data.js`：将旧 `src/data/questions.js` 与 `src/data/examPapers.js` 中硬编码的题目迁移为 Markdown。
- 更新 `package.json`：增加 `build:data`、`validate:data`、`predev`、`prebuild` 脚本。

**关键决策**:
- 行为差异完全由映射表驱动，禁止在路由/视图中直接判断 `kind === 'choice'`。
- 验证逻辑与模板渲染彻底解耦，新增题型只需扩展枚举、映射表、验证器、模板四件套。
- 题目数据优先使用 Markdown + YAML frontmatter，构建时生成 JS 模块，便于后续批量替换真实教学内容。
- localStorage 合并为单一 key，保留旧 key 迁移逻辑，避免用户进度丢失。
- 代码题 `runner` 先用 `new Function()` 沙箱，明确标记为临时方案，未来必须迁移到 iframe 隔离。

**产出文件**:
- `coursecore/src/config/question-types.js`
- `coursecore/src/validators/index.js` / `exact.js` / `normalized.js` / `tolerance.js` / `set.js` / `manual.js` / `runner.js` / `mixed.js`
- `coursecore/src/views/question/index.js` / `choice.js` / `fill.js` / `calc.js` / `code.js` / `chrome.js` / `preview.js`
- `coursecore/src/utils/answer-collector.js` / `question.js` / `progress.js`
- `coursecore/src/state.js`（更新）
- `coursecore/src/router.js`（更新）
- `coursecore/src/main.js`（更新）
- `coursecore/src/data/labels.js`（更新）
- `coursecore/builders/question-builder.js`
- `coursecore/scripts/migrate-legacy-data.js`
- `coursecore/curriculum/raw/questions/**/*.md`
- `coursecore/curriculum/raw/exams/*.md`
- `coursecore/package.json`（更新）

**关联问题**: 无

### 阶段 56: 构建验证、回归测试与文档同步

**日期**: 2026-07-24

**操作**:
- 运行 `npm run validate:data`，6 道平台题与 2 套期末试卷 schema 校验通过。
- 运行 `npm run build`，Vite 成功打包 41 个模块，生成 `dist/assets/index-*.css` 与 `dist/assets/index-*.js`。
- 运行 `npm run preview` 启动生产预览（端口 4173）。
- 使用浏览器自动化验证核心链路：首页、课程详情、知识库、刷题库、题目详情、单选即时判定、填空提交判定、解法显示、上下题导航、期末试卷列表与详情均正常。
- 更新 `.trae/documents/technical-architecture.md`：同步新目录结构、数据流、题目数据格式、答题流程、新增题型系统与验证器章节、构建步骤与已知限制。
- 更新 `.trae/documents/prd.md`：同步题目数据结构、题型映射表、作答功能列表、已知限制。
- 更新本开发日志：刷新项目概览「当前状态」、补充 `coursecore/` 目录结构、新增阶段 55-56 记录。

**关键决策**:
- 文档重写关键章节而非局部修补，避免旧 `kind` 字符串描述与新枚举架构混淆。
- 验证覆盖构建脚本、生产构建、浏览器自动化三层，确保重构不破坏现有页面视觉与导航习惯。
- 开发文档与代码同步更新，满足阶段 7「构建验证与文档同步」要求。

**产出文件**:
- `.trae/documents/technical-architecture.md`（更新）
- `.trae/documents/prd.md`（更新）
- `.trae/documents/development-log.md`（更新）

**验证结果**:
- `npm run validate:data`：Built 6 questions and 2 exam papers.
- `npm run build`：✓ 41 modules transformed，产物大小正常。
- `npm run preview`：本地预览服务器启动正常。
- 浏览器自动化：核心答题链路无报错，反馈与解法正常渲染。

**关联问题**: 无

### 阶段 57: 重新设计 CourseCore 品牌 Icon（几何艺术蛇形）

**日期**: 2026-07-24

**操作**:
- 分析 CourseCore 项目风格：Canvas 几何球面网格、深色科技主题、Inter 字体、Tailwind CSS。
- 重新设计 `favicon.svg`：摒弃鲜艳渐变，采用朴素暖炭灰背景 + 哑光赭石金蛇身。
- 蛇形盘绕为几何折线，形如无限符号 + 向上探索姿态；蛇身分布蛇鳞节点（小圆点）。
- 嵌入学科符号：左上三角形（数学）、右下同心圆（物理/原子）。
- 添加同心圆轨道层（深度感）、稀疏几何网格（理性秩序）、底部比例尺（测量隐喻）。
- 蛇头为几何三角形箭头 + 单眼；关键节点用浅色圆点模拟电路焊点。
- 备份旧版为 `favicon-v1.svg`；新增浅色版本 `favicon-light.svg`。

**关键决策**:
- 颜色朴素化：不用高饱和青紫渐变，改用低饱和赭石金 + 暖灰，更接近博物馆/学术质感。
- 内涵丰富化：蛇 = Python + 蜕皮成长 + 知识探索；∞ 盘绕 = 无限学习循环；三角/圆 = 数物双科；比例尺 = 测量与精度。
- 几何艺术化：全部用折线、圆、多边形构成，无曲线，呼应包豪斯构成主义。

**产出文件**:
- `coursecore/public/favicon.svg` - 深色主题 Icon（覆盖旧版）
- `coursecore/public/favicon-v1.svg` - 旧版 Icon 备份
- `coursecore/public/favicon-light.svg` - 浅色主题备用 Icon

**关联问题**: 无

### 阶段 58: 生成高等数学（上/下）真实课程内容

**日期**: 2026-07-25

**操作**:
- 读取 `高等数学上.pdf` 与 `高等数学下.pdf`，使用 `pdf2image` + `pytesseract` OCR 提取目录与前 30 页文本，确认教材为同济大学《高等数学》第六版。
- 设计两门课程：`calculus-1`（高等数学上，7 个模块）与 `calculus-2`（高等数学下，6 个模块），覆盖函数与极限、导数与微分、微分中值定理、不定积分、定积分及其应用、微分方程、空间解析几何、多元函数微分法、重积分、曲线曲面积分、无穷级数。
- 编写 `gen_calculus.py` 自动生成脚本：根据课程结构批量产出 Markdown 题目源文件（`curriculum/raw/questions/calculus-1/*.md`、`curriculum/raw/questions/calculus-2/*.md`）、更新 `coursecore/src/data/courses.js`、生成 2 套期末试卷（`curriculum/raw/exams/exam-calculus-1-final.md`、`exam-calculus-2-final.md`）。
- 题目覆盖单选、多选、判断、填空、计算、证明、代码等题型，数量 105 道；每道题含 YAML frontmatter、题干、选项/答案/解析。
- 修复 Markdown 文件换行不一致导致的 YAML 解析失败：所有题目与试卷文件统一使用 `newline='\n'` 写入。
- 运行 `npm run build:data`、`npm run validate:data`、`npm run build` 全链路通过；启动 preview 后浏览器验证首页、课程详情、小节练习、刷题库、期末试卷均可正常访问与作答。

**关键决策**:
- 采用 OCR 而非直接文本提取：两本 PDF 为扫描版，`pypdf`/`pdfplumber` 返回空文本，必须借助 OCR 获取目录与知识点结构。
- 课程结构对齐教材章节：保证模块/小节顺序与同济大学第六版一致，便于学生按课本进度学习。
- 自动生成 + 人工校验混合：题目由脚本按模板生成，关键 LaTeX 与答案格式经过脚本内校验与 validate:data 双重检查。
- 期末试卷按课程分别组卷：上册期末覆盖极限/导数/积分/微分方程，下册期末覆盖空间几何/多元微分/重积分/曲线曲面积分/级数。

**产出文件**:
- `coursecore/src/data/courses.js` - 高等数学（上/下）课程结构（自动生成，覆盖旧版示例数据）
- `coursecore/curriculum/raw/questions/calculus-1/*.md` - 高等数学（上）平台题目（约 55 道）
- `coursecore/curriculum/raw/questions/calculus-2/*.md` - 高等数学（下）平台题目（约 50 道）
- `coursecore/curriculum/raw/exams/exam-calculus-1-final.md` - 高等数学（上）期末试卷
- `coursecore/curriculum/raw/exams/exam-calculus-2-final.md` - 高等数学（下）期末试卷
- `coursecore/src/data/questions.js` - 构建后的平台题库（105 题）
- `coursecore/src/data/examPapers.js` - 构建后的期末试卷数据（2 套）
- `c:\Users\vitoriga\.trae-cn\work\6a6323ca709f04131cc76680\gen_calculus.py` - 生成脚本

**关联问题**: 无

### 阶段 59: 修复期末试卷题数过少与重复 Section 解析问题

**日期**: 2026-07-25

**操作**:
- 发现 `gen_calculus.py` 生成的期末试卷每类题型仅取 5 题，整体题量过少（上册 16 题、下册 15 题）。
- 调整 `gen_calculus.py` 试卷组卷逻辑：上册期末试卷包含选择题 10 题、填空题 11 题、判断题 3 题、计算题 12 题、证明题 1 题、多选题 1 题，共 38 题；下册期末试卷包含选择题 5 题、填空题 4 题、判断题 1 题、计算题 12 题，共 22 题。
- 同时发现 `builders/question-builder.js` 的 `parseExamMarkdown` 使用 `parseSections` 按标题名去重，导致所有 `## Section` 与 `### Question` 只保留最后一个，试卷实际只渲染 1 题。
- 在 `question-builder.js` 中新增 `parseRepeatedSections` 函数，按出现顺序返回重复标题列表，并替换 `parseExamMarkdown` 中的章节与题目解析逻辑。
- 重新运行 `gen_calculus.py`，并通过 `npm run build:data`、`npm run validate:data`、`npm run build`；启动 preview 后浏览器验证期末试卷列表显示 38 题 / 22 题，试卷详情页正确渲染全部题目。

**关键决策**:
- 试卷源文件继续使用统一的 `## Section` / `### Question` 标题，避免改写入格式；通过解析器支持重复标题来解决问题。
- 上册期末尽量覆盖单选、填空、判断、计算、证明、多选全部题型，下册期末覆盖现有题型，提升考前模拟完整性。

**产出文件**:
- `c:\Users\vitoriga\.trae-cn\work\6a6323ca709f04131cc76680\gen_calculus.py` - 更新试卷组卷逻辑
- `coursecore/builders/question-builder.js` - 新增 `parseRepeatedSections`，修复重复 `Section`/`Question` 解析
- `coursecore/curriculum/raw/exams/exam-calculus-1-final.md` - 38 题期末试卷源文件
- `coursecore/curriculum/raw/exams/exam-calculus-2-final.md` - 22 题期末试卷源文件
- `coursecore/src/data/examPapers.js` - 构建后的期末试卷数据（38 题 + 22 题）

**关联问题**: 无

### 阶段 60: 实现 freeCodeCamp 式理论教学 + 训练题闭环

**日期**: 2026-07-25

**操作**:
- 在 `gen_calculus.py` 中为每个理论小节注入课程教学内容（`content` 字段），覆盖高等数学（上）7 个模块 39 个理论小节、高等数学（下）6 个模块 24 个理论小节，共 63 段教学文本。
- 为原本没有训练题的 3 个理论小节补充题目：`c2-m1-i4`（空间曲线及其方程）、`c2-m2-i6`（多元函数微分学的几何应用）、`c2-m4-i5`（对坐标的曲面积分），平台总题量从 105 题增至 108 题。
- 在 `practiceList.js` 中渲染理论教学内容，并在内容末尾提示"完成下列训练题以结束本节"，同时显示本节完成状态。
- 在 `state.js` 中新增 `isItemCompleted`、`syncItemProgress` 等函数：理论小节是否完成取决于其关联训练题是否全部答对；无题目小节保持原 toggle 行为。
- 在 `course.js`、`sidebar.js` 中使用新的完成状态驱动状态点与点击动作；理论小节点击后进入练习列表而非直接 toggle。
- 在 `router.js` 的 `showPracticeItem` 与 `handleSubmitAnswer` 中调用 `syncItemProgress`，实现答完最后一题后自动标记小节完成。
- 重新运行 `npm run build:data`、`npm run validate:data`、`npm run build`，启动 preview 后通过浏览器验证：理论小节页面展示教学内容与训练题，完成全部训练题后返回课程列表，该小节显示已完成，课程进度从 0/49 变为 1/49。

**关键决策**:
- 采用 freeCodeCamp 的"先学后练"模式：理论内容是主体，训练题放在小节末尾作为完成条件，确保用户不只是浏览，而是真正通过做题巩固。
- 小节完成状态由题目完成情况自动推导，不依赖用户手动勾选，减少状态不一致风险。
- 为保持数据一致性，`courses.js` 由 `gen_calculus.py` 统一生成，教学文本也写入脚本中的 `LESSONS` 字典，便于后续批量维护。

**产出文件**:
- `c:\Users\vitoriga\.trae-cn\work\6a6323ca709f04131cc76680\gen_calculus.py` - 增加理论教学内容生成与 3 道补充题目
- `c:\Users\vitoriga\.trae-cn\work\6a6323ca709f04131cc76680\lessons_dict.py` - 63 个理论小节教学内容字典
- `coursecore/src/data/courses.js` - 包含 `content` 与 `requirements` 的课程数据
- `coursecore/src/data/questions.js` - 108 道平台题
- `coursecore/src/views/practiceList.js` - 理论内容 + 训练题列表渲染
- `coursecore/src/state.js` - 基于题目完成度的小节完成状态逻辑
- `coursecore/src/views/course.js` - 使用新完成状态的状态点渲染
- `coursecore/src/views/sidebar.js` - 理论小节点击进入练习列表
- `coursecore/src/router.js` - 答题后自动同步小节进度

**关联问题**: 无

### 阶段 61: 刷题板块按小节拆分并去除其他入口

**日期**: 2026-07-25

**操作**:
- 重构 `coursecore/src/views/practiceBank.js`：题库不再平铺展示全部题目，而是按 `课程 → 模块 → 小节` 三级层级分组，每个小节下展示对应训练题，标题旁显示该小节题目数量与完成进度。
- 在 `coursecore/src/state.js` 新增 `itemTitle(courseId, moduleId, itemId)`，用于从课程数据反向获取小节标题，保证分组展示时文案与课程结构一致。
- 去除全局进入"刷题"板块的入口：删除 `main.js` 顶部导航的"刷题"链接、页脚资源区的"刷题"链接、`landing.js` 首页 Hero 区的"去刷题"按钮、`knowledgeBase.js` 空状态时的"先去刷题"按钮（改为"先去学习"）。
- 在 `router.js` 的 `setActiveNav` 中对 `nav-bank` 元素使用可选链操作符，避免移除导航项后切换视图时报错。
- 重新运行 `npm run build:data`、`npm run validate:data`、`npm run build`，启动 preview 验证：刷题页按课程/模块/小节层级展示题目，点击小节进入练习列表，顶部导航与首页不再直接跳转刷题页。

**关键决策**:
- 刷题板块定位为"课程训练题的聚合视图"而非独立入口，与学习路径保持一致，避免用户跳过理论内容直接刷题。
- 分组信息直接从 `courses.js` 与 `questions.js` 的 `courseId/moduleId/itemId` 推导，不额外维护映射表，减少数据不一致风险。
- 保留 `practiceBank` 页面本身与 URL 路由，仅移除 UI 上的直达入口，课程详情、练习列表等内部跳转仍可正常使用。

**产出文件**:
- `coursecore/src/views/practiceBank.js` - 按课程→模块→小节层级分组的题库视图
- `coursecore/src/state.js` - 新增 `itemTitle` 小节标题查询函数
- `coursecore/src/main.js` - 移除顶部导航与页脚的刷题入口
- `coursecore/src/views/landing.js` - 移除首页"去刷题"按钮
- `coursecore/src/views/knowledgeBase.js` - 空状态引导改为"先去学习"
- `coursecore/src/router.js` - `setActiveNav` 可选链兼容缺失导航项

**关联问题**: 无

### 阶段 62: 升级为 History API 一页面一 URL 路由

**日期**: 2026-07-25

**操作**:
- 创建 `coursecore/src/config/routes.js`：集中定义全部路由表（`/`、`/kb`、`/bank`、`/exams`、`/course/:courseId`、`/item/:itemId`、`/question/:qid`、`/exams/:examId`、`/exams/:examId/questions/:qid`），提供 `matchRoute`、`buildPath`（别名 `href`）、`isInternalPath`、`getStaticPaths` 等工具函数。
- 重构 `coursecore/src/router.js`：移除旧的 `state.view` 驱动逻辑，改为通过 `matchRoute(window.location.pathname)` 解析当前 URL，调用 `history.pushState/replaceState` 更新地址，再执行对应视图函数；`navigateTo` 统一处理内部跳转。
- 更新 `coursecore/src/main.js`：在全局点击事件中拦截 `<a href="/...">` 的内部链接，调用 `navigateTo` 实现无刷新客户端路由；保留外部链接正常行为。
- 更新 `coursecore/src/views/*.js` 与 `coursecore/src/views/question/chrome.js`：将所有按钮式导航改为语义化 `<a>` 标签，使用 `href()` 生成 URL，保证右键/中键/新标签页可正常打开。
- 创建 `coursecore/scripts/prerender.js`：在 `vite build` 后读取 `dist/index.html` 模板，为 `getStaticPaths` 返回的每条路由生成对应目录的 `index.html`，支持静态托管直接访问任意子路径。
- 更新 `coursecore/package.json`：`build` 脚本改为 `vite build && node scripts/prerender.js`。
- 验证 `npm run validate:data`、`npm run build`、`npm run preview`：构建产物包含 265 条预渲染路由；浏览器直接访问 `/`、`/course/calculus-1`、`/item/calc1-m1-practice`、`/question/q001`、`/exams`、`/kb`、`/exams/calculus-1-final-2024/questions/q001` 均可正常加载。

**关键决策**:
- 采用"方案三"：集中路由配置 + History API + 预渲染，兼顾 freeCodeCamp 式清晰 URL、SEO/分享友好与部署兼容性。
- 视图组件统一使用 `<a>` 标签而不是按钮，提升可访问性并允许用户复制/分享链接。
- 预渲染为每条路由生成独立 HTML，解决纯 SPA 在静态托管（GitHub Pages / Netlify / Vercel）下直接访问子路径 404 的问题；部署配置（`vercel.json`、`netlify.toml`）仍保留 SPA fallback 作为兜底。
- 路由表按出现顺序编译成正则数组，参数名映射到 `params` 对象，避免后续新增/修改路由时遗漏解析逻辑。

**产出文件**:
- `coursecore/src/config/routes.js` - 集中路由配置与 URL 工具
- `coursecore/src/router.js` - History API 路由与视图分发
- `coursecore/src/main.js` - 锚点点击拦截与初始化
- `coursecore/src/views/*.js`、`coursecore/src/views/question/chrome.js` - 使用 `<a href>` 的内部链接
- `coursecore/scripts/prerender.js` - 构建后静态路由预渲染
- `coursecore/package.json` - build 脚本串联 vite build 与 prerender

**关联问题**: 无

### 阶段 63: 移除左侧导航栏，收敛课程入口至首页

**日期**: 2026-07-25

**操作**:
- 删除 `coursecore/src/views/sidebar.js`：原左侧课程导航组件不再使用。
- 清理 `coursecore/src/router.js`：移除所有 `renderSidebarContent()` 与未定义的 `closeMobileSidebar()` 调用；简化 `handleToggleItem`、`handleToggleModule`、`handleToggleItemExpand`、`handleMarkItemDone` 等处理函数，仅保留 `renderMain()` 刷新课程详情视图。
- 清理 `coursecore/src/style.css`：删除 `.sidebar`、`.sidebar.open`、`.menu-toggle` 等媒体查询样式。
- 确认 `coursecore/src/main.js` 已不存在侧边栏 DOM、菜单切换按钮、搜索过滤与事件处理；课程入口仅保留首页课程卡片、顶部「开始学习」按钮与页脚课程链接。
- 重新执行 `npm run build`，265 条静态路由预渲染成功，构建产物无 sidebar 相关引用。

**关键决策**:
- 彻底删除侧边栏组件与样式，而不是隐藏，避免死代码与未来维护负担。
- 课程进入方式统一收敛到首页，强化「先选大课 → 再学小节」的 freeCodeCamp 式主流程；顶部导航保留「学习」「知识库」与搜索，保证全局可达性。
- 移除 `closeMobileSidebar` 等未定义函数调用，消除潜在的 ReferenceError。

**产出文件**:
- `coursecore/src/router.js` - 移除 sidebar 相关调用与函数
- `coursecore/src/style.css` - 移除 sidebar/menu-toggle 样式
- 已删除：`coursecore/src/views/sidebar.js`

**关联问题**: 无

### 阶段 64: 首页双板块切换改为内部视图，移除 `/kb` 独立路由与顶部导航

**日期**: 2026-07-25

**操作**:
- 首页「学习板块」「知识库板块」切换按钮改为内部视图切换，不再调用 `navigateTo('/kb')`，URL 始终保持在 `/`。
- 删除 `/kb` 独立路由：`src/config/routes.js` 移除 `kb` 路由与预渲染路径 `/kb`。
- 删除 `src/router.js` 中独立 `knowledge` 视图分发与 `nav-learn`/`nav-kb` 高亮逻辑；`showKnowledgeBase()` 改为内部调用 `showLanding('kb')`。
- 删除 `src/main.js` 顶部导航栏的「学习」「知识库」链接，以及页脚「知识库」链接。
- 精简 `src/views/landing.js` 知识库摘要面板，删除「进入知识库」按钮。
- `state.landingTab` 持久化到 `localStorage`，刷新后保持上次选择的板块。

**关键决策**:
- 首页双板块本身就是足够清晰的入口，无需顶部导航重复提供学习/知识库链接，减少导航层级。
- 去掉 `/kb` 独立路由后，知识库内容通过首页 tab 切换访问，预渲染产物少一条路径，部署更简单。
- `landingTab` 持久化提升体验一致性，但默认仍回学习板块，避免新用户首次进入看到空知识库。

**产出文件**:
- `coursecore/src/config/routes.js` - 移除 `/kb` 路由与静态路径
- `coursecore/src/router.js` - 移除 knowledge 视图分发，简化导航高亮
- `coursecore/src/main.js` - 删除顶部/页脚知识库链接，tab 切换改为 `showLanding`
- `coursecore/src/views/landing.js` - 精简知识库摘要面板
- `coursecore/src/state.js` - `landingTab` 加入持久化字段

**关联问题**: 无

### 阶段 65: 首页双板块 tab 替换为 GooeyNav 粘性流体导航

**日期**: 2026-07-25

**操作**:
- 将 React Bits 开源组件 GooeyNav 改写为原生 JS 版本：`coursecore/src/components/gooeyNav.js` 提供 `renderGooeyNav()` 与 `initGooeyNav()`。
- 在 `coursecore/src/style.css` 中添加 GooeyNav 完整样式，并用 `.gooey-nav-wrapper` 深色胶囊容器承载，保持 gooey 效果的黑底白字，与页面浅色/深色主题隔离。
- 修改 `coursecore/src/views/landing.js`：移除原 `tab-btn` 按钮，改用 GooeyNav 渲染「学习板块」「知识库板块」；新增 `renderLandingContent()` 单独渲染内容区。
- 修改 `coursecore/src/router.js`：在 `renderMain()` 的 landing 分支初始化 GooeyNav；`onChange` 仅更新 `state.landingTab`、持久化进度，并局部刷新 `#landing-content`，不重建 GooeyNav，保证药丸滑动与粒子动画连贯。
- 构建验证与浏览器操作验证通过：点击 GooeyNav 项可切换下方内容，URL 保持在 `/`。

**关键决策**:
- 不引入 React，原生 JS 改写以匹配 CourseCore 的 Vite + ES Modules 技术栈，避免额外依赖与打包体积增长。
- GooeyNav 采用固定黑底白字胶囊容器，不跟随页面主题切换，因为 gooey 效果依赖特定的黑底/白形/contrast 组合，换色会破坏视觉效果。
- 内容区与导航分离，局部刷新避免组件重初始化，保留用户点击时的药丸滑动与粒子爆破动画。

**产出文件**:
- `coursecore/src/components/gooeyNav.js` - GooeyNav 原生 JS 实现（渲染 + 初始化）
- `coursecore/src/style.css` - GooeyNav 与胶囊容器样式
- `coursecore/src/views/landing.js` - 使用 GooeyNav 渲染首页 tab，内容区独立为 `renderLandingContent()`
- `coursecore/src/router.js` - landing 视图渲染后初始化 GooeyNav，并处理切换回调

### 阶段 66: 仅保留深色主题，关闭浅色主题切换入口

**日期**: 2026-07-25

**操作**:
- 删除 `coursecore/src/main.js` header 中的主题切换按钮（`#theme-toggle`）及其 `data-action="theme-toggle"` 事件处理。
- 修改 `coursecore/src/theme.js`：`setTheme()` 与 `toggleTheme()` 均强制应用 `dark`，忽略传入参数。
- 修改 `coursecore/src/state.js`：`loadProgress()` 加载持久化状态后强制 `state.theme = 'dark'`，覆盖持久化或系统偏好。
- 构建验证通过：站点始终以深色主题渲染，无主题切换入口。

**关键决策**:
- 不删除主题代码，仅禁用切换并强制深色，便于未来恢复浅色主题。
- 同时在 `theme.js` 与 `state.js` 强制深色，确保无论从持久化加载还是运行时调用都无法进入浅色模式。

**产出文件**:
- `coursecore/src/main.js` - 移除 header 主题切换按钮与事件处理
- `coursecore/src/theme.js` - `setTheme/toggleTheme` 强制深色
- `coursecore/src/state.js` - 加载进度后强制深色主题

### 阶段 67: 删除首页与 header 的"开始学习"按钮，恢复知识库"进入知识库"入口

**日期**: 2026-07-25

**操作**:
- 删除 `coursecore/src/main.js` header 右侧的"开始学习"按钮。
- 删除 `coursecore/src/views/landing.js` hero 区域的"开始学习"按钮。
- 在 `coursecore/src/views/landing.js` 知识库摘要面板恢复"进入知识库"按钮；新增 `state.kbDetail`（不持久化）控制摘要/详情视图。
- 修改 `coursecore/src/views/knowledgeBase.js`：添加"返回摘要"按钮，作为首页内嵌完整知识库视图使用。
- 修改 `coursecore/src/main.js`：添加 `show-kb-detail` / `show-kb-summary` 事件处理；`kb-search` 与全局搜索在知识库视图下改为局部刷新 `#landing-content`，不重建 GooeyNav。
- 修改 `coursecore/src/router.js`：GooeyNav 切换 tab 时重置 `state.kbDetail = false`，确保切回知识库板块显示摘要。
- 构建验证通过。

**关键决策**:
- 两个"开始学习"按钮与首页课程卡片、GooeyNav 入口重复，删除后页面更简洁。
- 不恢复 `/kb` 独立路由，"进入知识库"在首页内部展开完整知识库，保持 URL 不变。
- `kbDetail` 不持久化，刷新或切换 tab 后回到摘要，避免用户意外进入空列表。

**产出文件**:
- `coursecore/src/main.js` - 删除 header"开始学习"按钮；新增知识库摘要/详情切换事件处理
- `coursecore/src/views/landing.js` - 删除 hero"开始学习"按钮；恢复"进入知识库"按钮；支持详情视图
- `coursecore/src/views/knowledgeBase.js` - 添加"返回摘要"按钮
- `coursecore/src/state.js` - 新增 `kbDetail` 状态
- `coursecore/src/router.js` - tab 切换时重置 `kbDetail`

### 阶段 68: 恢复 `/kb` 独立路由，调整知识库返回与空状态入口

**日期**: 2026-07-25

**操作**:
- 恢复 `coursecore/src/config/routes.js` 中 `/kb` 独立路由，并同步 `scripts/prerender.js` 静态路径。
- 修改 `coursecore/src/views/landing.js`："进入知识库"按钮链接改为 `/kb`，首页知识库 tab 不再展开详情，仅保留摘要。
- 修改 `coursecore/src/views/knowledgeBase.js`：删除"返回摘要"按钮；空状态"先去学习"改为 `data-action="go-learn"`；将列表区域拆分为 `renderKnowledgeBaseList()`，支持搜索时局部刷新 `#kb-list`。
- 修改 `coursecore/src/main.js`：添加 `go-learn` 事件处理，点击后设置 `landingTab='learn'` 并跳转首页 `/`；添加 `updateKBSearch()` 实现知识库搜索局部刷新；移除 `show-kb-detail` / `show-kb-summary` 事件处理与 `kb-search` 的旧刷新逻辑。
- 修改 `coursecore/src/state.js`：移除不再使用的 `kbDetail` 状态。
- 更新 `prd.md`：页面清单增加 `/kb`，知识库需求改为独立路由。
- 更新 `technical-architecture.md`：路由说明增加 `/kb`。
- 构建验证通过，生成 265 条静态路由。

**关键决策**:
- 知识库重新使用独立 `/kb` URL，便于直接访问和刷新，同时首页保留摘要入口。
- 删除"返回摘要"按钮，知识库页作为独立页面，通过浏览器返回或顶部 logo 回到首页。
- 空状态"先去学习"跳转首页学习板块，并持久化 `landingTab='learn'`，确保用户看到学习内容。
- 移除 `kbDetail` 状态，首页知识库 tab 固定显示摘要，避免状态残留。

**产出文件**:
- `coursecore/src/config/routes.js` - 恢复 `/kb` 路由
- `coursecore/src/router.js` - 恢复 `showKnowledgeBase()` 及 `applyRoute` 分发
- `coursecore/src/views/landing.js` - "进入知识库"跳转 `/kb`，移除详情视图
- `coursecore/src/views/knowledgeBase.js` - 删除返回按钮，支持搜索局部刷新
- `coursecore/src/main.js` - 新增 `go-learn` 与 `updateKBSearch()`，清理旧事件
- `coursecore/src/state.js` - 移除 `kbDetail`
- `.trae/documents/prd.md` - 更新知识库页面与需求描述
- `.trae/documents/technical-architecture.md` - 更新路由说明

### 阶段 69: 添加右侧折叠导航菜单（Manu.md 风格）

**日期**: 2026-07-25

**操作**:
- 移除 `coursecore/src/main.js` 中原 header 下拉菜单的实现，改为全局右侧折叠菜单。
- 在 `coursecore/src/main.js` 的 `renderAppShell()` 中新增 `.staggered-menu-wrapper` 结构：三层预展开背景层（`.sm-prelayers`）、右上角 `Menu` 切换按钮（`.sm-toggle`）、右侧滑出面板（`.sm-panel`）。
- 菜单项包含「首页」、「课程」（可展开子菜单，动态渲染 `COURSES` 列表）、「知识库」，并保留编号索引（01/02/03）与 staggered 文字上滑动画。
- 在 `coursecore/src/main.js` 中新增菜单交互函数：`toggleStaggeredMenu()`、`openStaggeredMenu()`、`closeStaggeredMenu()`、`toggleCourseSubmenu(button)`；事件委托增加 `toggle-menu` 与 `toggle-course-submenu` 两个 `data-action`。
- 点击菜单外部或选择内部链接后自动关闭菜单，保持 SPA 无刷新导航。
- 在 `coursecore/src/style.css` 中新增完整的 staggered side menu 样式：固定全屏包裹层、右上角触发按钮、三层错位背景滑入、右侧面板滑出、文字 staggered 上滑、课程子菜单 grid 展开/收起、响应式宽度 `clamp(300px, 42vw, 460px)` 与 `backdrop-filter` 模糊。
- 浏览器验证通过：在 `http://localhost:5175/course/calculus-1` 点击右上角 `+` 按钮，面板从右侧滑出；点击「课程」展开子菜单显示两门课程；点击链接无刷新跳转并关闭菜单；再次点击按钮恢复 `+` 图标。

**关键决策**:
- 参考根目录 `Manu.md` 的 `StaggeredMenu` 设计语言，使用深色墨绿层叠背景与超大号菜单文字，贴合品牌几何/高端黑白基因。
- 将触发按钮置于右上角，利用课程页右侧空余空间，不侵占主内容区。
- 菜单包裹层 `pointer-events: none` + 按钮/面板单独 `pointer-events: auto`，避免遮挡页面滚动与交互。
- 子菜单使用 CSS `grid-template-rows` 动画展开，不依赖 JS 计算高度，性能与可维护性更好。

**产出文件**:
- `coursecore/src/main.js` - 右侧折叠菜单 HTML 结构与交互逻辑
- `coursecore/src/style.css` - 菜单样式与动画

### 阶段 70: 折叠菜单宽度与字号缩小

**日期**: 2026-07-25

**操作**:
- 修改 `coursecore/src/style.css` 中 `.sm-prelayers` 与 `.sm-panel` 宽度：`clamp(300px, 42vw, 460px)` → `clamp(220px, 30vw, 340px)`。
- 缩小菜单主项字号：`.sm-panel-item` / `.sm-panel-parent` 由 `clamp(2.25rem, 5vw, 3.5rem)` → `clamp(1.5rem, 3.2vw, 2.25rem)`，项间距 `padding` 由 `0.75rem 0` → `0.6rem 0`。
- 缩小编号角标字号：`0.85rem` → `0.7rem`，位置同步微调。
- 缩小课程子菜单字号：`1rem` → `0.875rem`，子项间距略微收紧。
- 面板内边距随宽度收窄：`6rem 2.5rem 2.5rem` → `5rem 1.75rem 1.75rem`。
- 浏览器验证：展开菜单后 `.sm-panel` 宽度为 220px，主项字号 24px（当前视口），展开/关闭与子菜单动画正常。

**关键决策**:
- 宽度与字号同步等比缩小，避免面板过宽、文字过大导致右侧视觉压迫。
- 保持 `clamp()` 响应式，桌面端最大 340px，移动端最小 220px。

**产出文件**:
- `coursecore/src/style.css` - 折叠菜单宽度、字号、间距调整

### 阶段 71: 折叠菜单宽度微调、搜索框左移与多层彩色背景

**日期**: 2026-07-25

**操作**:
- 进一步调整 `coursecore/src/style.css` 中 `.sm-prelayers` 与 `.sm-panel` 宽度：由固定 `clamp()` 改为基于主内容区右侧剩余空间的动态计算 `min(340px, max(220px, calc((100vw - 80rem) / 2 - 0.5rem)))`，让折叠栏左边与 `main` 区域右边保持约 0.5rem 小间距。
- 用户反馈“再宽一点”后，将 `.sm-prelayers` 最大宽度提升至 380px、最小宽度提升至 240px，并额外加 2rem 溢出，使彩色背景层在面板左侧边缘露出。
- 导航栏搜索框左移：修改 `coursecore/src/main.js` 中 header flex 容器 `gap-6` → `gap-3`，让搜索框更贴近 logo。
- 菜单背景由单色墨绿改为三层错位彩色：`#1a1a2e`（深海军蓝）、`#4a2c6a`（深紫）、`#2dd288`（亮绿），并在 `coursecore/src/main.js` 的 `.sm-prelayer` 中内联设置。
- 提升 `.sm-panel` 透明度：`background` 由 `var(--card)` 改为 `color-mix(in srgb, var(--card) 62%, transparent)`，让后面的三层彩色背景层透出来，形成多色叠加效果。
- 用户反馈完全展开后背景应更暗，将 `.sm-panel` 背景改为暗色渐变 `linear-gradient(100deg, rgba(26, 26, 46, 0.72), rgba(10, 10, 12, 0.92))`：左侧保留一定透明以透出 prelayers 彩色边缘，右侧接近纯黑深暗背景，与整体深色主题更协调。
- 浏览器验证：在 `http://localhost:5174/course/calculus-1` 展开菜单，面板主体为暗色，左侧仍露出彩色边缘，文字与编号清晰可见。

**关键决策**:
- 采用 `calc((100vw - 80rem) / 2 - 0.5rem)` 动态宽度，保证折叠栏始终贴合主内容区右侧并保留固定小间距，避免宽屏时过度远离。
- prelayers 比 panel 宽 2rem，使多层彩色在面板左侧形成装饰性色带，类似 Manu.md 的 staggered underlay 效果。
- 配色选择深海军蓝→深紫→亮绿的冷暖渐变，与项目深色主题协调；panel 使用暗色渐变覆盖，既保留彩色层次又保证最终背景足够暗。

**产出文件**:
- `coursecore/src/style.css` - 折叠菜单动态宽度、间距、暗色渐变面板
- `coursecore/src/main.js` - 搜索框左移、三层彩色 prelayer 背景

### 阶段 72: 修复课程子菜单默认折叠行为

**日期**: 2026-07-25

**操作**:
- 用户反馈课程子菜单应在点击“课程”后才展开，默认不应显示。
- 检查 `coursecore/src/style.css` 发现 `.sm-panel-group .sm-submenu` 已设置 `grid-template-rows: 0fr`，但浏览器实际计算出的 grid 轨道为 `0px 31.9896px`，第二行仍占用空间。
- 根因：`.sm-submenu` 的子元素由隐式 grid 行创建，单值 `grid-template-rows: 0fr` 只覆盖第一行，后续隐式行回退到 `grid-auto-rows: auto`；同时子元素默认 `min-height: auto` 会撑开轨道。
- 修复：为 `.sm-panel-group .sm-submenu` 增加 `grid-auto-rows: 0fr`，为 `.sm-submenu > *` 增加 `min-height: 0`，确保所有隐式行在折叠时高度为 0。
- 修复 `.sm-submenu` 与 `.sm-submenu-itemWrap` 的 padding：折叠时 padding 为 0，仅在 `.sm-panel-group.open` 时恢复底部与项间距，避免 padding 在折叠态泄漏高度。
- 浏览器验证：在 `http://localhost:5174/course/calculus-1` 打开菜单，课程子菜单默认不可见；点击“课程”后子菜单展开显示两门课程；再次点击可折叠。
- 构建验证：`npm run build` 成功，预渲染 265 条路由。

**关键决策**:
- 使用 `grid-auto-rows: 0fr` + `min-height: 0` 组合，保证任意课程数量下折叠态都能真正压成 0 高度。
- padding 仅在 `open` 态生效，避免 grid 过渡动画之外出现额外垂直空间。

**产出文件**:
- `coursecore/src/style.css` - 子菜单折叠/展开样式修复

### 阶段 73: 平台题库全部转为选择题

**日期**: 2026-07-25

**操作**:
- 按用户确认的范围，仅转换 `coursecore/curriculum/raw/questions/` 下的平台题库，不动 `exams/` 期末试卷。
- 保留已有的 `singleChoice`、`multipleChoice`、`trueFalse` 题目不变；将 `fillInBlank`（17 道）、`calculation`（68 道）、`proof`（1 道）、`shortAnswer`（1 道）共 87 道非选择题统一改为 `singleChoice`。
- 编写临时转换脚本，按规则自动生成 4 个选项与正确答案索引：
  - 数值答案：生成 ±1、0、2 倍等干扰项；
  - 文字/概念答案：使用预设同主题词池；
  - 区间答案：变换开闭与端点符号；
  - 表达式/方程/向量答案：做符号变换、去常数、改符号等启发式扰动；
  - 无法识别时回退到通用占位项。
- 移除转换后不再需要的字段：`tolerance`、`unit`、`blanks`、`testString`、`hint`、`answers`；原 `## Answer` 中的具体答案改为选项索引；新增 `## Options` 选项列表。
- 重新执行 `npm run build:data` 与 `npm run validate:data`，题库数据正常生成；再执行 `npm run build`，生产构建与 265 条路由预渲染均成功。

**关键决策**:
- 只改 Markdown 源文件，不改题型系统代码或验证器逻辑；系统仍通过 `questionTypes` + 映射表驱动，无需特殊分支。
- 自动生成的干扰项仅保证题型切换可用，部分题目（如复杂表达式、证明题）的干扰项可能不够教学严谨，后续需要人工精修。
- 正确答案索引按题目 `id` 做确定性随机分布，避免全部落在同一位置。

**产出文件**:
- `coursecore/curriculum/raw/questions/**/*.md` - 87 道非选择题改为单选并生成选项
- `coursecore/src/data/questions.js` - 重新生成后全部为选择题数据
- `coursecore/src/data/examPapers.js` - 未变更

### 阶段 74: 大学物理B（上）题库接入完成并同步文档

**日期**: 2026-07-25

**操作**:
- 确认 `coursecore/curriculum/raw/questions/physics-b-1/` 已生成力学/波动光学理论占位小节（15 个）与两个 quiz 综合测验题目源文件（力学 43 题、波动光学 33 题，共 76 题）。
- 检查 `coursecore/src/data/courses.js` 已包含「大学物理B（上）」课程及力学/波动光学模块结构。
- 修复 `coursecore/builders/question-builder.js` 未解析 Markdown frontmatter 中 `image` 字段的问题，使物理测验题图能正确写入 `src/data/questions.js`。
- 重新执行 `npm run build:data`（生成 184 道题、15 条 theory 内容、2 套试卷）、`npm run validate:data`、`npm run build`（预渲染 359 条路由）均通过。
- 同步更新 `.trae/documents/technical-architecture.md`：补充 `physics-quiz-builder.js`、`theoryContents.js`、`quizSession.js`、`public/physics/` 等项目结构说明；更新数据流、课程/题目格式、`quiz` 小节与测验视图描述；新增第 5.6 节「测验视图（quizSession）」。
- 同步更新 `.trae/documents/prd.md`：在学习板块与题目作答章节增加「大学物理B（上）」、测验视图交互、`image` 题图字段说明，并修正题库类型描述。
- 更新 `development-log.md` 本阶段记录与任务完成检查清单。

**关键决策**:
- `image` 字段统一由 Markdown frontmatter 进入 `questions.js`，渲染层 `src/views/question/index.js` 已支持题图展示，无需改动题型模板。
- 大学物理B（上）综合测验保留填空题（`fillInBlank`）与证明题（`proof`），学生可输入表达式或对照参考答案自查，避免复杂 LaTeX 答案被误判。
- 测验状态不持久化，允许反复刷题；全部作答完成后才标记小节完成。

**产出文件**:
- `coursecore/builders/question-builder.js` - 增加 `image` 字段解析
- `coursecore/src/data/questions.js` - 重新生成，物理 76 题包含 35 张题图引用
- `.trae/documents/technical-architecture.md` - 物理课程与 quiz 视图架构说明
- `.trae/documents/prd.md` - 物理课程与测验视图产品需求
- `.trae/documents/development-log.md` - 阶段 74 记录

### 阶段 75: 修复大学物理综合测验顺序/随机、几何背景与布局平衡

**日期**: 2026-07-26

**操作**:
- 修复 `coursecore/src/views/quizSession.js` 顺序/随机切换逻辑：题号导航按 `state.order` 渲染，切换随机模式时使用 `Date.now()` 重新生成种子，答题状态以题目 `id` 为键，确保切换模式后当前题与已作答状态跟随题目本身。
- 新增 `coursecore/src/quiz-background.js`，使用 p5.js 渲染与 `index（综合混合）.html` 一致的球面投影网格与三角分布十字星星几何背景，并在素白模式下隐藏该背景、恢复全局背景。
- 调整 `coursecore/src/views/practiceList.js`：测验视图容器使用 `max-w-7xl`，非测验保持 `max-w-3xl`，改善横向空间利用。
- 调整 `coursecore/src/style.css`：测验布局改为 `1fr 17rem` 网格，题目卡片、控制栏、导航、结果区统一使用半透明毛玻璃（`backdrop-filter`）与投影，透出几何背景。
- 修改 `coursecore/index.html` 引入 p5.js CDN。
- 修改 `coursecore/src/router.js`：在 `renderMain` 离开测验视图时调用 `cleanupQuizSession`，销毁 p5 实例并恢复全局背景。
- 重新执行 `npm run build:data`（184 题、15 theory、2 试卷）与 `npm run build`（预渲染 359 条路由）均通过。
- 同步更新 `technical-architecture.md` 与 `prd.md`：补充 p5.js 测验背景、顺序/随机状态跟随、清理逻辑等描述。
- 更新 `development-log.md` 本阶段记录与任务完成检查清单。

**关键决策**:
- 答题状态使用 `userAnswers[qid]` / `results[qid]` 而非题号索引，保证乱序/顺序切换后状态不丢失。
- p5.js 背景仅在 `data-bg="geo"` 时显示，素白模式回退到全局 Canvas 2D 背景，避免视觉冲突。
- 离开测验路由时统一清理背景，防止 p5 实例泄漏或全局背景被永久隐藏。

**产出文件**:
- `coursecore/src/views/quizSession.js` - 顺序/随机切换与状态跟随
- `coursecore/src/quiz-background.js` - p5.js 测验几何背景
- `coursecore/src/views/practiceList.js` - 测验容器宽度调整
- `coursecore/src/style.css` - 毛玻璃测验 UI 与布局
- `coursecore/index.html` - p5.js CDN
- `coursecore/src/router.js` - 测验背景清理

### 阶段 76: 修复 Windows 克隆后 `npm run dev` 报 `Unknown questionType: undefined`

**日期**: 2026-07-26

**操作**:
- 定位问题：Windows 用户克隆仓库后，Git 自动将 `.md` 换行转换为 CRLF；`builders/question-builder.js` 的 `parseExamMarkdown` 用 `matter('---\n' + raw.replace(/^---\n/, ''))` 解析，CRLF 导致 `---\r\n` 未被 stripping，frontmatter 解析为空，`questionType` 变成 `undefined`。
- 修复 `builders/question-builder.js`：新增 `normalizeLineEndings` 工具，读取 Markdown 后统一把 `\r\n` 转成 `\n`，再交给 gray-matter 与分段解析。
- 新增 `coursecore/.gitattributes`：强制 `*.md`、`*.js`、`*.css`、`*.html`、`*.json`、`*.svg` 使用 LF 换行，避免后续 Windows 克隆再出现 CRLF 问题。
- 本地验证：将 `exam-calculus-1-final.md` 临时转成 CRLF 后运行 `npm run build:data`，成功通过；恢复 LF 后再次 `npm run build`，359 条路由预渲染通过。
- 更新 `development-log.md` 本阶段记录与检查清单。

**关键决策**:
- 在解析层统一归一化换行，而不是依赖用户手动改 Git 配置，兼容性最好。
- `.gitattributes` 锁定文本文件为 LF，从源头减少跨平台换行差异。

**产出文件**:
- `coursecore/builders/question-builder.js` - 增加 `normalizeLineEndings`
- `coursecore/.gitattributes` - 强制 LF 换行

## 任务完成检查清单

- [x] 已读取现有开发文档（`development-log.md`、`technical-architecture.md`、`prd.md`）。
- [x] 大学物理综合测验顺序/随机切换已修复，答题状态按题目 ID 跟随。
- [x] p5.js 几何背景已接入测验视图并在离开时正确清理。
- [x] 测验布局与毛玻璃视觉已调整。
- [x] Windows CRLF 导致的 `Unknown questionType: undefined` 已修复。
- [x] `npm run build:data`、`npm run build` 均通过（含 CRLF 模拟验证）。
- [x] `development-log.md` 已更新（新增阶段 75、76）。
- [x] `technical-architecture.md` 与 `prd.md` 已同步更新。
- [x] 文档中的"最后更新时间"已更新。
- [x] 代码和文档描述一致。

### 阶段 77: 为 CourseCore 平台添加 shadcn 风格加载动画

**日期**: 2026-07-26

**操作**:
- 明确技术约束：CourseCore 为原生 ES Modules + Tailwind CSS，无 React 运行时，无法直接安装 shadcn/ui 的 React 组件。
- 在 `coursecore/src/components/loading.js` 创建原生 JS 加载组件集合，参考 shadcn/ui 的 Spinner / Skeleton / Progress 语义：
  - `renderSpinner`：几何蛇形圆环 spinner，支持 sm/md/lg/xl。
  - `renderSkeleton` / `renderSkeletonCard`：shimmer 骨架屏，适配深色/浅色 CSS 变量。
  - `renderProgress`：线性进度条。
  - `renderPageLoader` / `showPageLoader` / `hidePageLoader`：全屏毛玻璃页面加载层。
  - `renderImageWithLoader` / `initImageLoaders`：图片 skeleton 占位 + blur-up fade-in。
  - `renderButtonLoader` / `setButtonLoading`：按钮内 spinner loading 状态。
- 在 `coursecore/src/style.css` 新增 loading 样式：spinner 旋转动画、shimmer、page-loader overlay、image-loader 占位与淡入、按钮 loader。
- 修改 `coursecore/src/router.js`：新增 `applyRouteWithLoader`，在 `restoreLocation` / `navigateTo` 时显示 120ms 页面加载器，提供路由切换视觉反馈；`renderMain` 渲染完成后调用 `initImageLoaders`。
- 修改 `coursecore/src/main.js`：首屏初始化时显示 `CourseCore` 页面加载器，随后由路由层接管隐藏。
- 修改 `coursecore/src/views/question/index.js`：题图渲染改用 `renderImageWithLoader`，所有带 `image` 字段的题目自动获得骨架占位与淡入效果。
- 修改 `coursecore/src/views/quizSession.js`：测验初始加载文字替换为 spinner + 文字；提交答案按钮点击后显示 loading spinner。
- 修改 `coursecore/src/router.js`：`handleSubmitAnswer` 与 `handleSubmitItem` 提交时按钮显示 loading spinner。
- 验证：`npm run build:data` 成功生成 291 题、15 theory、2 试卷；`npx vite build && node scripts/prerender.js` 成功预渲染 479 条静态路由；生成 CSS 中已包含 `cc-spinner`、`cc-skeleton`、`cc-page-loader`、`cc-image-loader` 等类。

**问题修复**:
- 题图 skeleton 一直显示：原因为 `renderImageWithLoader` 给 `<img>` 加了 `loading="lazy"`，题目详情页中图片位于首屏且加载依赖 `load` 事件触发淡入；lazy 图片在部分情况下未进入视口或事件未触发，导致 skeleton 永不消失。
- 修复：将 `loading="lazy"` 改为 `loading="eager"`；同时完善 `initImageLoaders` 对 `img.complete` 的分支处理：成功则直接 reveal，失败则显示"图片加载失败"。
- 复测：Playwright 访问 `/question/q-physics-b-1-p1b-m1-02-training-004`，`cc-image-loader--loaded` 正常添加，skeleton opacity 为 0，图片 naturalWidth=229，加载正常。
- 二次反馈：用户本地 dev server 仍显示所有题图 skeleton 一直加载；Network 显示图片请求 200/304 正常返回，Console 无错误。本地 Playwright 复现正常，判断为特定浏览器/环境下 `load`/`error` 事件不可靠或丢失。
- 二次修复：`initImageLoaders` 增加轮询 fallback，每 100ms 检查 `img.complete`，最多 5 秒；一旦检测到加载完成立即 reveal，避免依赖单一事件；添加 `data-cc-image-watched` 与 `data-cc-image-revealed` 标记防止重复绑定和重复 reveal。
- 二次验证：本地多个有图片题目仍正常加载；`npx vite build && node scripts/prerender.js` 通过（479 路由）。

**关键决策**:
- 不引入 React，保持 CourseCore 原生 ES Modules 架构，降低依赖与打包体积。
- 参考 shadcn/ui 设计语义而非复制组件，确保风格与项目现有黑白几何 + 蛇元素品牌基因一致。
- 页面加载器只在路由切换/首屏显示 120ms，避免数据已在本地时产生真实等待感；图片 loader 使用真实 `load` 事件触发淡入。
- 按钮 loading 在提交瞬间设置，随后由重新渲染自然恢复，避免状态同步复杂度。

**产出文件**:
- `coursecore/src/components/loading.js` - 原生 JS 加载组件集合
- `coursecore/src/style.css` - loading 动画与占位样式
- `coursecore/src/router.js` - 路由切换 loader、图片初始化、按钮 loading
- `coursecore/src/main.js` - 首屏 loader
- `coursecore/src/views/question/index.js` - 题图带 loader 渲染
- `coursecore/src/views/quizSession.js` - 测验加载与提交 loading

## 任务完成检查清单

- [x] 已读取现有开发文档（`development-log.md`、`technical-architecture.md`、`prd.md`）。
- [x] 加载动画适配方案已与用户确认。
- [x] 原生 JS loading 组件模块已创建（spinner、skeleton、progress、page-loader、image-loader、button-loader）。
- [x] 页面级加载动画已接入首屏与路由切换。
- [x] 图片级加载占位与淡入效果已接入题目配图。
- [x] 提交按钮 loading 状态已接入单题、小节、测验三种提交场景。
- [x] `npm run build:data` 通过（291 题、15 theory、2 试卷）。
- [x] `npx vite build && node scripts/prerender.js` 通过（479 条路由预渲染）。
- [x] `development-log.md` 已更新（新增阶段 77）。
- [x] 文档中的"最后更新时间"已更新。
- [x] 代码和文档描述一致。

## 更新记录 - 2026-07-26

### 修改
- 关闭 `coursecore/src/components/loading.js` 中的 `[CC-DEBUG]` 调试日志：移除 `watchImageLoad` 与 `initImageLoaders` 内的 `console.log`，保留轮询兜底与加载状态标记逻辑，避免生产环境控制台噪音。

### 修复
- 修复题图普遍偏大的问题：根因是 `src/style.css` 中 `.cc-image-loader__img` 使用 `width: 100%`，把图片强制拉伸到 `.cc-image-loader` 块级容器的宽度；原图片样式只有 `max-width: 100%`，按自然尺寸显示。
- 调整 `src/style.css`：
  - `.cc-image-loader` 改为 `display: inline-block; max-width: 100%`，让它跟随图片自然尺寸。
  - `.cc-image-loader__img` 改为 `max-width: 100%; width: auto; height: auto`，不再强制撑满容器。
  - 给 loader 加 `min-width: 8rem; min-height: 6rem`，保证加载前骨架屏可见。

## 最后更新时间

2026-07-26 21:20
