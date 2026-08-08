> 文档状态：历史计划，已被当前根目录结构和 Cloudflare Pages 部署方案取代。
>
> 本文中的嵌套 `coursecore/`、Vercel/Netlify 默认部署和未完成清单仅用于历史追溯。

# CourseCore 部署就绪文件结构完善计划

## 1. Summary

将 `coursecore/` 目录完善为可直接部署到静态托管平台（Vercel / Netlify）的完整前端项目结构。补充缺失的部署文档、环境配置示例、CI 工作流与 README，更新已有的技术架构与产品需求文档，使其与当前 Vite + ES Modules 实现保持一致。最终保证 `npm install && npm run build` 即可产出可部署的 `dist/` 产物。

## 2. Current State Analysis

已完成的 Vite 重构（基于 Phase 1 文件读取）：

- `coursecore/package.json`：已配置 Vite + Tailwind CSS + PostCSS + Autoprefixer，脚本含 `dev` / `build` / `preview`。
- `coursecore/vite.config.js`：基础配置完整，`base: '/'`，输出 `dist/`，sourcemap 开启。
- `coursecore/index.html`：MathJax 3 已引入，`/src/main.js` 作为模块入口，`/favicon.svg` 已引用。
- `coursecore/src/main.js`：App 外壳、事件委托、初始化流程完整。
- `coursecore/src/router.js`：视图路由、MathJax typeset、答案检查逻辑完整。
- `coursecore/src/views/`：首页、课程、知识库、刷题、试卷等 9 个视图组件已拆分。
- `coursecore/src/data/`：课程、题目、试卷、标签、平台元数据已模块化。
- `coursecore/src/style.css`：Tailwind 指令 + 自定义 CSS 变量主题已存在。
- `coursecore/public/favicon.svg`：已存在。
- `coursecore/vercel.json` 与 `netlify.toml`：SPA 回写配置已存在。
- `coursecore/.gitignore`：已排除 `node_modules/`、`dist/`、`.env.local`、`.DS_Store`。

仍缺失或滞后的部分：

- 无 `README.md`：协作者/部署者无法快速了解项目与部署步骤。
- 无 `.env.example`：虽然目前无环境变量，但后续可能扩展 API 端点、统计埋点等，需要模板。
- 文档滞后：`.trae/documents/technical-architecture.md` 与 `prd.md` 仍描述旧的单文件物理刷题页，未反映 CourseCore 平台。
- 无 CI/CD 配置：每次部署需手动构建上传。
- `package.json` 缺少 `engines` 字段，平台可能使用不兼容的 Node 版本。

## 3. Proposed Changes

### 3.1 新增 `coursecore/README.md`

**文件**：`coursecore/README.md`

**内容**：
- 项目简介（CourseCore 大学基础课学习平台）
- 技术栈（Vite + Tailwind CSS + ES Modules + MathJax 3 + Canvas 2D）
- 目录结构说明
- 本地开发命令
- 生产构建命令
- 部署到 Vercel / Netlify 的步骤
- 自定义课程内容的方法（替换 `src/data/courses.js`、`questions.js`、`examPapers.js`）

**原因**：让任何拿到项目的人都能独立运行、构建和部署。

### 3.2 新增 `coursecore/.env.example`

**文件**：`coursecore/.env.example`

**内容**：
```
# CourseCore 环境变量示例
# 当前项目纯静态，无需后端 API；此文件为后续扩展预留。
# VITE_API_BASE_URL=https://api.example.com
# VITE_GA_ID=
```

**原因**：即使当前无实际变量，也能让部署平台识别环境配置入口，并为后续扩展（如云同步进度、统计）做准备。

### 3.3 更新 `.trae/documents/technical-architecture.md`

**文件**：`.trae/documents/technical-architecture.md`

**修改点**：
- 技术栈更新为 CourseCore 实际使用的 Vite + Tailwind CSS (npm) + ES Modules + Canvas 2D + MathJax 3 + localStorage。
- 目录结构更新为 `coursecore/` 下的 `src/data/`、`src/views/`、`src/state.js`、`src/router.js` 等。
- 数据流更新为：JSON 数据模块 → JS 视图渲染 → MathJax typeset → localStorage 持久化。
- 新增 SPA 路由、事件委托、状态管理说明。
- 部署配置说明（`vercel.json`、`netlify.toml`、输出目录 `dist/`）。

**原因**：文档与代码保持一致，避免后续维护者被旧架构误导。

### 3.4 更新 `.trae/documents/prd.md`

**文件**：`.trae/documents/prd.md`

**修改点**：
- 产品目标更新为 CourseCore 大学课程学习平台。
- 核心功能：学习板块、知识库板块、刷题板块、期末试卷。
- 页面清单：首页、课程详情、练习列表、题目详情、知识库、刷题库、期末试卷列表、试卷详情。
- 数据结构：课程/模块/小节、题目（选择/填空/计算/证明/应用）、期末试卷。
- 非功能需求：Vite 构建、响应式、无后端、可部署。
- 验收标准更新为 Vite 项目的构建与功能验证。

**原因**：PRD 应描述当前正在实现的产品，而不是旧项目。

### 3.5 更新 `coursecore/package.json`

**文件**：`coursecore/package.json`

**修改点**：
- 添加 `engines` 字段：
  ```json
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
  ```
- 可选添加 `license` 字段（如 `"MIT"`）。

**原因**：避免部署平台使用过低 Node 版本导致构建失败。

### 3.6 新增 GitHub Actions 部署工作流

**文件**：`.github/workflows/deploy.yml`

**内容**：
- 触发条件：`push` 到 `main` 分支或 `workflow_dispatch`。
- 使用 `actions/checkout@v4`、`actions/setup-node@v4`。
- 运行 `npm ci && npm run build`。
- 使用 `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` 部署到 GitHub Pages（可选）。

**原因**：提供一条完整的自动化部署路径，降低未来部署成本。

**注意**：GitHub Pages 默认域名可能带仓库路径，需同步调整 `vite.config.js` 的 `base` 为仓库名，或在 README 中说明。

### 3.7 验证并更新 `coursecore/.gitignore`

**文件**：`coursecore/.gitignore`

**修改点**：
- 追加 `.vercel`、`.netlify`、`*.log`、`coverage/`。

**原因**：避免本地部署平台缓存或日志被提交。

### 3.8 验证 `coursecore/vercel.json` 与 `netlify.toml`

**操作**：确认现有配置有效，无需修改。若发现构建产物路径不一致再调整。

## 4. Assumptions & Decisions

- **部署目标**：用户已配置 Vercel / Netlify 静态托管，本次计划以完善文件结构为主，不引入后端服务。
- **GitHub Pages**：作为额外可选部署路径提供 Actions 工作流；若用户不需要，可忽略或后续删除。
- **数据内容**：当前仍使用示例课程/题目数据，后续替换真实教学内容时只需修改 `src/data/` 下文件，不改动架构。
- **环境变量**：当前项目无敏感配置，`.env.example` 仅作占位和文档说明。
- **Node 版本**：要求 Node >= 18，与 Vite 5 官方要求一致。

## 5. Verification Steps

1. 在 `coursecore/` 目录执行 `npm install` 确保依赖安装成功。
2. 执行 `npm run build`，确认 `dist/` 目录生成且包含 `index.html` 与 `assets/`。
3. 执行 `npm run preview`，本地访问 `http://localhost:4173`，验证首页、课程、知识库、刷题、试卷功能正常。
4. 检查 `README.md` 中的命令是否可复现。
5. 检查 `.trae/documents/technical-architecture.md` 与 `prd.md` 是否与当前代码结构一致。
6. （可选）推送至 GitHub 后检查 Actions 是否成功构建并部署。

## 6. 任务完成检查清单

- [ ] `coursecore/README.md` 已创建
- [ ] `coursecore/.env.example` 已创建
- [ ] `coursecore/package.json` 已添加 `engines`
- [ ] `.trae/documents/technical-architecture.md` 已更新为 CourseCore 架构
- [ ] `.trae/documents/prd.md` 已更新为 CourseCore 需求
- [ ] `.github/workflows/deploy.yml` 已创建（GitHub Pages 部署）
- [ ] `coursecore/.gitignore` 已补充部署相关忽略项
- [ ] `development-log.md` 已记录本次文件结构完善阶段
- [ ] `npm run build` 通过并生成正确产物
