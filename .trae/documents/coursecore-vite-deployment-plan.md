# CourseCore Vite 部署完善计划

## 1. 摘要

将 `coursecore/` 从当前“骨架 + 部分视图”状态补全为可构建、可部署到 Vercel / Netlify 的 Vite 单页应用。核心工作是补齐 `src/main.js` 与全部缺失视图组件，统一事件委托，接入 MathJax 公式渲染，并验证 `dev` / `build` / `preview` 全链路通过。

## 2. 当前状态分析

### 2.1 已存在且可用

| 文件 | 状态 |
|------|------|
| `coursecore/index.html` | 入口，已引用 `/src/main.js` 与 `/favicon.svg` |
| `coursecore/package.json` | Vite + Tailwind + PostCSS + Autoprefixer 依赖齐全 |
| `coursecore/vite.config.js` | 基础配置，输出 `dist`，sourcemap 开启 |
| `coursecore/tailwind.config.js` / `postcss.config.js` | 已配置 |
| `coursecore/netlify.toml` / `vercel.json` | SPA 回写与构建命令已配置 |
| `coursecore/src/style.css` | 全局样式、CSS 变量、主题切换已就绪 |
| `coursecore/src/state.js` | 状态、localStorage、进度工具函数 |
| `coursecore/src/theme.js` | 主题切换与图标 |
| `coursecore/src/background.js` | Canvas 2D 几何背景 |
| `coursecore/src/utils.js` | `escapeHtml` |
| `coursecore/src/router.js` | 路由与视图调度，但引用了大量不存在的视图 |
| `coursecore/src/data/{courses,questions,examPapers,labels,platform}.js` | 数据完整 |
| `coursecore/src/views/{landing,course,sidebar}.js` | 已使用 `data-action` 属性，可接入事件委托 |

### 2.2 关键缺失

1. **`coursecore/src/main.js` 不存在** — `index.html` 引用失败，应用无法启动。
2. **6 个视图组件不存在**：
   - `src/views/knowledgeBase.js`
   - `src/views/practiceBank.js`
   - `src/views/practiceList.js`
   - `src/views/practiceDetail.js`
   - `src/views/examPapers.js`
   - `src/views/examDetail.js`
3. **公式未渲染**：题目内容使用 `\( ... \)` LaTeX，但页面未引入 MathJax。
4. **事件模型不统一**：原单文件使用内联 `onclick`；新模块使用 `data-action` 委托，需补齐映射。
5. **未安装依赖**：`node_modules` 缺失，需先执行 `npm install`。

## 3. 拟修改内容

### 3.1 新增 `coursecore/src/main.js`（应用启动器）

**作用**：渲染 App 外壳（header / sidebar / main / footer），绑定全局事件委托，初始化主题、背景、进度。

**必须包含的结构**：
- `#app` 内注入 header、aside.sidebar、main#main、footer。
- header 中放置 `#menu-toggle`、导航链接 `#nav-learn` / `#nav-kb` / `#nav-bank`、`#global-search`、`#theme-toggle`。
- sidebar 中放置 `#sidebar-search`、`#course-list`。
- footer 复用原单文件中的课程/资源/关于链接。

**事件委托映射**（统一在 `#app` 上监听 `click`）：

| `data-action` | 处理函数 |
|---------------|----------|
| `landing` | `showLanding(tab)` |
| `course` | `showCourse(courseId)` |
| `kb` / `knowledge` | `showKnowledgeBase()` |
| `bank` | `showPracticeBank()` |
| `exam-papers` | `showExamPapers()` |
| `exam-paper` | `showExamPaper(examId)` |
| `practice` | `showPracticeDetail(qid)` |
| `practice-list` | `showPracticeItem(itemId)` |
| `toggle-item` | `handleToggleItem(itemId)` |
| `toggle-module` | `handleToggleModule(moduleId)` |
| `check-answer` | `checkAnswer(qid)` |
| `check-exam-answer` | `checkExamAnswer(examId, qid)` |
| `history-back` | `historyBack()` |
| `theme-toggle` | `toggleTheme()` |
| `menu-toggle` | 切换 `#sidebar.open` |

**输入事件**：
- `#global-search` / `#sidebar-search`：`state.search = value`；若当前视图是 `knowledge` 则 `renderKnowledgeBase()`，是 `bank` 则 `renderPracticeBank()`，否则 `renderSidebarContent()`。
- `#kb-search`：仅 `renderKnowledgeBase()`。
- `#bank-search` / `#bank-kind` / `#bank-course`：更新 `state.search` / `state.bankFilter`，调用 `renderPracticeBank()`。

**初始化流程**：
```js
loadProgress();
setTheme(state.theme);
renderAppShell();
initEventDelegation();
renderSidebarContent();
showLanding();
initBackground(() => state.theme);
```

### 3.2 新增缺失视图组件

全部使用纯字符串模板，依赖 `state` / `COURSES` / `QUESTIONS` / `EXAM_PAPERS` / `KIND_LABELS` / `escapeHtml` / `courseTitle` / `moduleTitle`，并通过 `data-action` 属性触发交互。

#### `src/views/knowledgeBase.js`

- 只显示 `state.completedQuestions` 中已完成的题目。
- 按 `KIND_LABELS[q.kind]` 分组。
- 顶部搜索框 `#kb-search`。
- 空状态提示“暂无已解锁的题型解法”，并提供进入刷题的入口。
- 每道题卡片 `data-action="practice" data-qid="..."`。

#### `src/views/practiceBank.js`

- 顶部统计卡片：平台题型库数量、期末试卷数量、已解锁解法数量，均带 `data-action`。
- 筛选栏：`#bank-search`、`#bank-kind`、`#bank-course`。
- 列表按搜索词 + 题型 + 学科过滤。
- 每道题卡片 `data-action="practice" data-qid="..."`，已完成的显示“已完成”。

#### `src/views/practiceList.js`

- 显示某 `itemId` 下的全部题目。
- 返回按钮 `data-action="course" data-course-id="..."`。
- 题目卡片 `data-action="practice" data-qid="..."`。

#### `src/views/practiceDetail.js`

- 显示题目内容、选项（如有）、答案输入框。
- 提交按钮 `data-action="check-answer" data-qid="..."`。
- 标准解法区 `#solution-box`，若已完成则默认展开，否则隐藏。
- 返回按钮 `data-action="history-back"`。

#### `src/views/examPapers.js`

- 列表展示 `EXAM_PAPERS`。
- 每张试卷卡片 `data-action="exam-paper" data-exam-id="..."`。

#### `src/views/examDetail.js`

- 展示试卷信息、分节、分题。
- 每道题卡片 `data-action="practice" data-qid="..."`（`showPracticeDetail` 内部会从 `EXAM_PAPERS` _flatMap 查找）。
- 返回按钮 `data-action="exam-papers"`。

### 3.3 调整 `src/router.js`

- 保持现有导出函数不变。
- 在 `renderMain()` 中，每次替换 `main.innerHTML` 后，若全局存在 `MathJax`，调用 `MathJax.typesetPromise?.([main])` 重新排版公式。
- `checkAnswer` / `checkExamAnswer` 提交后同样触发 `MathJax.typesetPromise?.()`（解法区可能含公式）。
- 确保 `setActiveNav` 在 `practice-list` 视图下正确点亮“学习”导航。

### 3.4 调整 `src/views/course.js` 与 `src/views/sidebar.js`

- 保持 `data-action` 模式；确认所有可交互元素不再残留 `onclick`。
- `course.js` 中练习类型按钮使用 `data-action="practice-list" data-item-id="..."`；其他类型使用 `data-action="toggle-item"`。

### 3.5 更新 `coursecore/index.html`

在 `<head>` 中加入 MathJax 3 配置与脚本：

```html
<script>
MathJax = {
  tex: { inlineMath: [['\\(', '\\)'], ['$', '$']] },
  svg: { fontCache: 'global' }
};
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
```

可选：添加 `<meta name="description">` 提升部署 SEO。

### 3.6 新增 `.gitignore`

```gitignore
node_modules/
dist/
.env.local
.DS_Store
```

## 4. 假设与决策

1. **事件模型**：统一使用 `data-action` 事件委托，避免全局函数污染，便于 Vite 打包 tree-shaking。
2. **MathJax CDN**：使用 jsDelivr CDN，无需 npm 依赖，减少构建包体积；题目内容使用 `\(...\)`，配置与之匹配。
3. **单入口 SPA**：所有路由由 `router.js` 在 `#main` 内渲染，配合 `netlify.toml` / `vercel.json` 的 `/* -> /index.html` 回写，支持直接刷新子路径。
4. **数据不动**：不改造 `COURSES` / `QUESTIONS` / `EXAM_PAPERS` 内容，后续替换真实教学数据即可上线。
5. **不引入后端**：继续用 `localStorage` 保存进度，保持静态部署特性。
6. **构建输出目录**：维持 `dist/`，`vite.config.js` 已配置；部署平台直接指向 `dist/`。

## 5. 验证步骤

1. **安装依赖**
   ```powershell
   cd c:\Users\vitoriga\Downloads\物理试题\coursecore
   npm install
   ```

2. **开发服务器验证**
   ```powershell
   npm run dev
   ```
   访问 `http://localhost:5173`，检查：
   - [ ] 页面正常加载，无 `main.js` 404。
   - [ ] 首页“学习板块 / 知识库板块”切换正常。
   - [ ] 课程卡片点击进入课程详情，模块可展开/收起。
   - [ ] 练习小节点击进入题目列表，题目点击进入作答页。
   - [ ] 提交答案后解锁解法，知识库出现对应题型。
   - [ ] 顶部“刷题”进入平台题型库，筛选与搜索生效。
   - [ ] “期末试卷”进入试卷列表，进入试卷后可做题。
   - [ ] 主题切换、移动端侧边栏展开/收起正常。
   - [ ] LaTeX 公式正常渲染。

3. **生产构建验证**
   ```powershell
   npm run build
   npm run preview
   ```
   访问 `http://localhost:4173`，重复上述关键路径检查，确认：
   - [ ] `dist/` 生成，无构建错误。
   - [ ] 刷新子路径（如直接访问 `/` 后再点击导航）无 404。
   - [ ] 资源路径正确，favicon 无 404。

4. **部署检查清单**
   - [ ] Vercel：导入 `coursecore` 目录，使用 `vercel.json` 配置。
   - [ ] Netlify：导入 `coursecore` 目录，使用 `netlify.toml` 配置。
   - [ ] 两者均设置发布目录为 `dist`，构建命令为 `npm run build`。

## 6. 产出文件清单

- 新增
  - `coursecore/src/main.js`
  - `coursecore/src/views/knowledgeBase.js`
  - `coursecore/src/views/practiceBank.js`
  - `coursecore/src/views/practiceList.js`
  - `coursecore/src/views/practiceDetail.js`
  - `coursecore/src/views/examPapers.js`
  - `coursecore/src/views/examDetail.js`
  - `coursecore/.gitignore`
- 修改
  - `coursecore/index.html`（加入 MathJax）
  - `coursecore/src/router.js`（接入 MathJax typeset）
  - `coursecore/src/views/course.js`（确认 data-action 一致）
  - `coursecore/src/views/sidebar.js`（确认 data-action 一致）
- 更新文档
  - `coursecore/.trae/documents/development-log.md`（记录本阶段）
  - `coursecore/.trae/documents/university-learning-platform-plan.md`（技术方案由单文件 HTML 更新为 Vite 项目）
