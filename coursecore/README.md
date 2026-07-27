# CourseCore — 大学基础课学习平台

面向大学生的大学基础课（高等数学、大学物理、线性代数、概率统计等）学习平台。课程、练习、知识库与期末试卷刷题功能全部集成在单页应用（SPA）中，无需后端即可运行。

## 技术栈

- **构建工具**：Vite 5
- **样式框架**：Tailwind CSS 3 + PostCSS + Autoprefixer
- **脚本模块**：原生 ES Modules
- **数学公式**：MathJax 3 (tex-mml-chtml)
- **动态背景**：HTML5 Canvas 2D 几何球面网格
- **状态持久化**：localStorage
- **部署目标**：Vercel / Netlify / GitHub Pages

## 目录结构

```
coursecore/
├── index.html                 # 应用入口
├── package.json               # 依赖与脚本
├── vite.config.js             # Vite 配置
├── tailwind.config.js         # Tailwind 扫描路径
├── postcss.config.js          # PostCSS 插件
├── vercel.json                # Vercel SPA 回写配置
├── netlify.toml               # Netlify 构建与重定向配置
├── public/
│   └── favicon.svg            # 站点图标
├── src/
│   ├── main.js                # 应用初始化、App 外壳、事件委托
│   ├── router.js              # 视图路由与核心交互
│   ├── state.js               # 全局状态与 localStorage 持久化
│   ├── theme.js               # 深色/浅色主题切换
│   ├── background.js          # Canvas 几何背景
│   ├── utils.js               # 工具函数
│   ├── style.css              # Tailwind 指令 + 自定义 CSS 变量主题
│   ├── data/                  # 数据模块（便于后续替换真实教学内容）
│   │   ├── platform.js        # 平台名称与标语
│   │   ├── labels.js          # 题型与内容类型标签
│   │   ├── courses.js         # 课程/模块/小节数据
│   │   ├── questions.js       # 平台题库
│   │   └── examPapers.js      # 期末试卷数据
│   └── views/                 # 页面视图组件
│       ├── landing.js         # 首页（学习/知识库双板块）
│       ├── course.js          # 课程详情
│       ├── sidebar.js         # 侧边栏课程列表
│       ├── practiceList.js    # 小节练习列表
│       ├── practiceDetail.js  # 题目作答与解法
│       ├── practiceBank.js    # 刷题板块
│       ├── knowledgeBase.js   # 知识库（已完成题型与解法）
│       ├── examPapers.js      # 期末试卷列表
│       └── examDetail.js      # 试卷详情
└── dist/                      # 生产构建产物（gitignored）
```

## 本地开发

需要 Node.js >= 18。

```bash
# 进入项目目录
cd coursecore

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接上传到任意静态托管服务。

## 部署

### Vercel

1. 在 Vercel Dashboard 导入本仓库。
2. 项目根目录选择 `coursecore/`。
3. 框架预设选择 **Vite**。
4. 构建命令保持 `npm run build`，输出目录保持 `dist`。
5. `vercel.json` 已配置 SPA 路由回写，无需额外设置。

### Netlify

1. 在 Netlify 添加新站点并连接仓库。
2. 构建命令：`npm run build`
3. 发布目录：`dist`
4. `netlify.toml` 已包含重定向规则，所有路由回退到 `index.html`。

### GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`：

1. 进入仓库 **Settings > Pages**。
2. Source 选择 **GitHub Actions**。
3. 每次推送 `main` 分支会自动构建并部署。
4. 若仓库名不是 `username.github.io`，需修改 `vite.config.js` 中的 `base` 为仓库名（如 `/coursecore/`）。

## 自定义课程内容

所有教学内容集中在 `src/data/` 目录：

- 修改课程结构：编辑 `src/data/courses.js`
- 修改平台题库：编辑 `src/data/questions.js`
- 修改期末试卷：编辑 `src/data/examPapers.js`
- 修改平台名称/标语：编辑 `src/data/platform.js`
- 修改题型标签文案：编辑 `src/data/labels.js`

题目中的数学公式使用 LaTeX 语法，MathJax 会自动渲染。推荐在 `questions.js` 与 `examPapers.js` 中保持以下字段：

```js
{
  id: 'q001',
  itemId: 'calc-lim-1',
  courseId: 'calculus',
  kind: 'choice',        // choice | fill | calc | proof | apply
  title: '极限选择题',
  content: '求 \\( \\lim_{n \\to \\infty} \\frac{1}{n} \\)。',
  options: ['0', '1', '∞', '不存在'],
  answer: '0',
  solution: '当 n 趋向无穷大时，分母趋向无穷，因此分式趋向 0。'
}
```

## 注意事项

- 项目纯静态，用户学习进度保存在浏览器 `localStorage` 中。
- 首次加载需要联网获取 MathJax 与 Google Fonts（Inter）。
- 几何背景在低配设备上会自动降级性能参数，可在代码中调整 `background.js`。

## 许可证

内容仅供学习交流，课程数据可自由改造。
