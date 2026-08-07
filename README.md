# CourseCore

CourseCore 是面向大学生的基础课程学习与刷题平台。当前内置内容以高等数学和大学物理为主，产品包含课程学习、题目练习、期末试卷、知识库、错题复习、社区、用户记录和管理后台。

## 当前架构

项目根目录就是 CourseCore，不存在需要再进入的 `coursecore/` 子目录。

- 前端：Vite + 原生 JavaScript + Tailwind/PostCSS
- 公式与内容：MathJax、Markdown、Canvas/p5.js 背景
- 身份与数据：Supabase Auth + Postgres
- 应用服务：Hono BFF，部署在 Cloudflare Pages Functions
- 静态发布：Cloudflare Pages，前端与 `/api/*` 同域
- 本地状态：`localStorage`；登录后的部分进度、答案、错题和记录通过 BFF 同步

核心课程内容可以在静态数据 fallback 下浏览；认证、云同步、社区、管理后台和服务端判分依赖 Supabase/BFF。

## 目录结构

```text
CourseCore/
├── src/                         # 前端源码
│   ├── main.js                  # 应用初始化、全局事件与认证入口
│   ├── router.js                # History API 路由
│   ├── state.js                 # 前端状态与本地持久化
│   ├── config/                  # 路由、访问控制、题型映射
│   ├── data/                    # 构建生成的前端数据模块
│   ├── services/                # Auth、BFF client、同步、判分与管理服务
│   └── views/                   # 页面与练习视图
├── curriculum/raw/              # 课程、理论、题目的内容源
├── builders/                    # 内容构建与校验脚本
├── bff/src/                     # Hono BFF 源码
├── functions/api/[[route]].js   # Pages Function 生成产物，不手工编辑
├── scripts/                     # 数据抓取、BFF 打包、预渲染等脚本
├── public/                      # 静态资源与 Pages 重定向
├── wrangler.toml                # Cloudflare Pages 配置
└── .trae/documents/             # 产品、架构与历史计划文档
```

## 本地开发

需要 Node.js >= 18。

```bash
npm install
npm run dev
```

根目录开发脚本会在启动前执行数据构建与数据库数据抓取，因此需要配置项目所需的 Supabase 环境变量。只验证静态内容时，可以单独运行：

```bash
npm run build:data
npm run validate:data
```

物理训练题构建是独立且较重的流程：

```bash
npm run build:training
```

完整前端构建：

```bash
npm run build
npm run preview
```

## BFF 本地运行

BFF 的独立 Worker 开发环境位于 `bff/`：

```bash
cd bff
npm install
npm run typecheck
npm run dev
```

Pages Functions 模式使用根目录的构建产物和 `wrangler.toml`，部署说明见 [bff/README.md](bff/README.md)。密钥只放在 `.dev.vars` 或 Cloudflare Secrets 中，不能写入前端环境变量或提交到仓库。

## 数据维护

不要直接编辑 `src/data/*.js`。这些文件是构建产物：

- 课程、理论和题目内容：维护 `curriculum/raw/` 或对应的 Supabase 内容表
- 构建生成：`npm run build:data`
- 数据校验：`npm run validate:data`
- 期末试卷运行时读取：优先走 BFF，BFF 不可用时使用静态 `src/data/examPapers.js` fallback
- 平台文案和题型标签：维护 `src/data/platform.js`、`src/data/labels.js`

## 主要 API

当前 BFF 路由前缀为 `/api/v1`：

- 内容：`/papers`、`/papers/:id`、`/papers/:id/questions`、`/questions/:id`
- 判分与揭示：`POST /questions/:id/judge`、`POST /questions/:id/reveal`
- 用户数据：`/me/progress`、`/me/practice-records`、`/me/wrong-book`
- 排行榜：`/leaderboard`
- 健康检查：`/healthz`

公开内容接口默认裁剪答案和解析；`includeAnswer=true` 仍是过渡兼容参数，不能作为长期安全边界。服务端判分和 reveal 接口需要登录态。

## 文档约定

- 当前事实：`.trae/documents/technical-architecture.md`、`.trae/documents/prd.md`、`bff/README.md`
- 后端决策与交接：`backend-architecture-redesign.md`、`backend-redesign-handoff.md`
- 产品目标与视觉方案：`coursecore/docs/`
- 历史计划和开发日志：文件名带 `plan`、`integration` 或旧的 development log；不能直接当作当前实现依据
- 内容资料：`curriculum/`、`题库/`、PDF 和数据库实践资料；它们不是产品或架构规范

修改功能前，先确认文档中的“当前状态”和“目标状态”，并在实现完成后同步更新对应文档。

## 许可证

内容仅用于学习交流，具体课程数据和第三方资料按其来源许可使用。
