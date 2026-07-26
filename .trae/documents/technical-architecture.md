# 技术架构 - CourseCore

## 1. 技术栈

| 层级 | 技术 |
|---|---|
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 + PostCSS |
| 组件搜索 MCP | shadcn MCP server + React Bits registry（仅搜索，不引入 React 运行时） |
| 几何背景 | p5.js |
| 路由 | HTML5 History API（客户端路由） |
| 预渲染 | 自定义 `scripts/prerender.js` |
| 题目源数据 | Markdown + YAML frontmatter |
| 构建数据 | `builders/question-builder.js`（Node.js） |
| PDF 抽取 | `builders/training-extract.py` + `mineru-open-sdk` |
| 包管理 | npm |

## 2. 数据流

```text
PDF (力学/光学练习)
  ↓ mineru-open-sdk API (training-extract.py)
content_list.json + images
  ↓ parse / split / repair
curriculum/raw/questions/physics-b-1/<item>/q-*.md
  ↓ question-builder.js
src/data/questions.js (JS module)
  ↓ Vite build + prerender.js
dist/ (静态站点，每个路由一个 index.html)
```

## 3. 项目目录结构

```
coursecore/
├── builders/
│   ├── question-builder.js    # Markdown → JS 数据模块
│   ├── training-extract.py    # MinerU API PDF 抽取
│   └── training-builder.js    # Node.js 包装，加载 .env.local
├── scripts/
│   └── prerender.js           # 基于 routes.js 生成静态 HTML
├── src/
│   ├── main.js                # 应用壳、事件委托
│   ├── router.js              # 路由与视图控制器
│   ├── state.js               # 全局状态与 localStorage 持久化
│   ├── style.css              # 主题变量与组件样式
│   ├── theme.js               # 明暗主题切换
│   ├── background.js          # p5.js 几何背景
│   ├── config/
│   │   ├── routes.js          # 路由表与路径构建
│   │   └── question-types.js  # 题型/视图/校验器/提交方式映射
│   ├── data/
│   │   ├── courses.js         # 课程与模块小节数据
│   │   ├── questions.js       # 题目数据（构建生成）
│   │   ├── examPapers.js      # 期末试卷数据
│   │   └── labels.js          # 类型标签文案
│   ├── utils/
│   │   ├── progress.js        # localStorage 读写与迁移
│   │   ├── answer-collector.js# 从 DOM 收集用户答案
│   │   └── question.js        # 题目导航工具
│   ├── validators/            # 各类答案校验器
│   └── views/                 # 页面与题目渲染模板
│       ├── course.js
│       ├── practiceList.js
│       ├── inlinePractice.js
│       ├── quizSession.js
│       └── question/          # 单题渲染组件
├── curriculum/raw/questions/  # 题目 Markdown 源文件
├── public/physics/training/   # 训练题题图
├── .env.local                 # MinerU API token（不提交 Git）
└── development-log.md         # 开发日志
```

## 4. 题目数据模型

Markdown 文件示例：

```markdown
---
id: "q-physics-b-1-p1b-m1-01-training-001"
courseId: "physics-b-1"
moduleId: "p1b-m1"
itemId: "p1b-m1-01-training"
questionType: singleChoice
title: "第 1 题"
answer: ""
tags: ["选择题"]
source: "力学练习一.pdf 第1题"
---

## Content
题干内容...

## Options
- 选项 A
- 选项 B
- 选项 C
- 选项 D
```

字段说明：

| 字段 | 说明 |
|---|---|
| `id` | 全局唯一题号 |
| `courseId` / `moduleId` / `itemId` | 课程-模块-小节层级 |
| `questionType` | `singleChoice` / `fillInBlank` / `calculation` / `proof` 等 |
| `title` | 题目标题 |
| `answer` | 标准答案（训练题留空，后续手动补充） |
| `tags` | 题型标签 |
| `source` | 来源 PDF 与题号 |
| `image` | 可选题图 URL |

## 5. 题型映射

`src/config/question-types.js` 定义：

| questionType | viewType | validatorType | submitType |
|---|---|---|---|
| singleChoice | choice | exact | instant |
| multipleChoice | choice | set | button |
| fillInBlank | fill | normalized | button |
| calculation | calc | tolerance | button |
| proof | calc | manual | button |
| trueFalse | choice | exact | instant |
| shortAnswer | fill | normalized | button |
| code | code | runner | button |
| composite | exam | mixed | button |

## 6. 路由与预渲染

- 客户端路由表位于 `src/config/routes.js`。
- 预渲染脚本遍历所有路由，为每个 URL 生成 `dist/<path>/index.html`。
- 当前预渲染 479 条静态路由。

## 7. 训练题构建流程

1. `npm run build` 触发 `prebuild`。
2. `prebuild` 先执行 `npm run build:training`：
   - `training-builder.js` 从 `.env.local` 读取 `MINERU_TOKEN`。
   - 调用 `training-extract.py`，传入项目根目录。
   - Python 脚本使用 `mineru-open-sdk` 批量提交 13 个 PDF。
   - 解析返回的 `content_list.json`，按题号拆分，提取题干与选项。
   - 修复选项正则、λ/π 符号遗漏、空选项等已知问题。
   - 生成 Markdown 到 `curriculum/raw/questions/physics-b-1/<item>-training/`。
   - 复制题图到 `public/physics/training/<item>/`。
3. `prebuild` 再执行 `npm run build:data`：
   - `question-builder.js` 读取所有 Markdown，生成 `src/data/questions.js`。
4. Vite 构建并预渲染。

> 最近一次全量验证（2026-07-26）：107 道训练题 Markdown 源文件通过抽样检查，26 张题图引用全部命中 `public/physics/training`；`npm run build:data` 产出 291 道题 + 15 个理论内容 + 2 套试卷；`vite build + prerender.js` 预渲染 479 条静态路由。

## 8. 关键设计决策

- **训练小节复用 `quizSession` 交互**：保持顺序/随机、字体/背景切换、题号导航、进度报告一致。
- **inline 答题状态不持久化**：进入小节即清空，避免历史错误状态干扰。
- **答案收集基于 DOM**：`answer-collector.js` 直接从 DOM 读取，避免不同题型状态同步差异。
- **敏感配置隔离**：MinerU token 放入 `.env.local`，由 `training-builder.js` 加载，不进入代码仓库。
