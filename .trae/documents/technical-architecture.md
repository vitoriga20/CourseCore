# CourseCore 技术架构

> 文档状态：当前事实基线
>
> 更新时间：2026-08-07
>
> 本文以当前仓库源码、构建脚本、BFF 路由和部署配置为准。设计提案、旧开发日志和历史计划不覆盖本文的当前状态。

## 1. 架构总览

CourseCore 是 Vite 前端、Supabase 数据底座和 Hono BFF 组成的混合架构：

```text
浏览器
  ├─ Vite SPA / 静态预渲染页面
  ├─ localStorage 本地状态
  ├─ Supabase Auth 浏览器会话
  └─ /api/v1 → Cloudflare Pages Function → Hono BFF
                                      └─ Supabase Postgres/Auth 数据
```

核心课程可通过构建生成的静态数据和 fallback 浏览；登录、云同步、服务端判分、错题本、社区和管理后台依赖运行时服务。

## 2. 技术栈

| 层级 | 技术 |
|---|---|
| 前端构建 | Vite 5 |
| 前端代码 | 原生 JavaScript ES Modules |
| 样式 | Tailwind CSS 3 + PostCSS + 自定义 CSS |
| 公式 | MathJax 3，部分页面使用 CDN |
| Markdown | `marked`；后台编辑使用 EasyMDE |
| 图表/交互 | ECharts、SortableJS、Split.js、Canvas、p5.js |
| 身份与数据库 | Supabase Auth + Postgres + RLS/RPC |
| 应用服务 | Hono + Cloudflare Pages Functions |
| 内容构建 | `gray-matter`、Node builders、Markdown |
| 部署 | Cloudflare Pages（默认）；独立 Worker 为可选模式 |

## 3. 目录与职责

仓库根目录即 CourseCore，不存在需要进入的嵌套 `coursecore/` 项目目录。

```text
CourseCore/
├── index.html
├── package.json
├── vite.config.js
├── wrangler.toml                  # Cloudflare Pages 配置
├── src/
│   ├── main.js                    # 初始化、全局事件、认证入口
│   ├── router.js                  # History API 路由与页面分发
│   ├── state.js                   # 应用状态与 localStorage
│   ├── config/                    # routes/access/question-types
│   ├── data/                      # 构建生成或静态 fallback 数据
│   ├── components/                # Auth、用户菜单、加载等组件
│   ├── services/                  # Auth、BFF client、内容、同步、管理
│   ├── validators/                # 题型验证器
│   └── views/                     # 页面、练习、题型渲染器
├── curriculum/raw/                # 课程、理论、题目和试卷源文件
├── builders/                      # Markdown/训练题构建器
├── scripts/                       # 数据抓取、BFF 打包、预渲染
├── bff/src/                       # Hono BFF 源码
├── functions/api/[[route]].js     # BFF Pages Function 生成物
└── public/                        # 静态资源与重定向
```

`functions/api/[[route]].js` 不应手工编辑；它由 `scripts/build-bff.js` 从 `bff/src/pages-entry.ts` 生成。

## 4. 内容与数据流

### 4.1 构建期内容

```text
curriculum/raw/ 或数据库内容
        │
        ├─ builders/question-builder.js
        ├─ builders/training-builder.js（独立的物理训练构建）
        └─ scripts/fetch-from-supabase.js
                │
                └─ src/data/*.js
```

`src/data/*.js` 是构建产物或静态快照，不是人工维护的唯一源文件。内容变更应维护 Markdown/源数据，再运行构建和校验脚本。

当前数据基线：

- `calculus-1`：7 个模块、41 个小节
- `calculus-2`：6 个模块、35 个小节
- `physics-b-1`：2 个模块、30 个小节
- 题目总量约 276 道；期末试卷 2 套
- 小节类型：`theory`、`quiz`、`training`、`review`

### 4.2 运行时内容

试卷和期末题目由 `src/services/practice-data.js` 优先通过 `/api/v1/papers` 读取；BFF 不可用时才使用静态 `src/data/examPapers.js`。

BFF 默认裁剪 `answer`、`answers`、`solution`、`test_string` 等字段。`includeAnswer=true` 是旧客户端迁移的临时兼容参数，不能视为长期的答案安全边界。

理论内容和部分平台题目仍有 `src/services/content.js` 的直接 Supabase 读取；这是待收敛的边界，不应写成“所有内容都经过 BFF”。

### 4.3 用户数据

登录后，前端通过 Supabase Auth 持有会话；`apiClient.js` 将请求发送到 BFF。BFF 使用 JWT 确认用户身份，再访问进度、答案、错题本和排行榜数据。

当前 `admin.js`、社区页面、我的试卷、部分练习记录以及若干 fallback 仍直接使用 Supabase。权限迁移必须逐业务域完成，不能按“BFF 已存在”整体收权。

## 5. 前端运行时

### 5.1 初始化

`src/main.js` 初始化状态、认证监听、背景、页面容器和全局事件。`src/state.js` 保存用户、完成小节、当前练习会话、主题和本地进度；`lastSession` 用于恢复最近一次练习入口。

### 5.2 路由

路由定义在 `src/config/routes.js`，使用 HTML5 History API：

```text
/                         首页
/kb                       知识库
/bank                     题库
/exams                    期末试卷
/practice                 刷题中心
/practice/exams           按试卷刷题
/practice/types           按题型刷题
/practice/quiz            刷题会话
/practice/add             我的试卷
/kb/review                错题复习
/community                社区
/community/post           发布文章
/community/:postId        文章详情
/user                     用户中心
/user/records             刷题记录
/admin                    管理后台
/privacy                  隐私政策
/terms                    用户协议
/course/:courseId         课程详情
/item/:itemId             小节详情
/question/:qid            单题详情
/exams/:examId            试卷详情
/exams/:examId/questions/:qid 试卷题目详情
```

构建后 `scripts/prerender.js` 为静态路径生成深链页面；开发和运行时仍由 SPA router 接管导航。

### 5.3 题型系统

题型枚举位于 `src/config/question-types.js`：

| 值 | 名称 | 渲染/校验 |
|---:|---|---|
| 0 | `singleChoice` | choice / exact |
| 1 | `multipleChoice` | choice / set |
| 2 | `fillInBlank` | fill / normalized |
| 3 | `calculation` | calc / tolerance |
| 4 | `proof` | calc / manual |
| 5 | `trueFalse` | choice / exact |
| 6 | `shortAnswer` | fill / normalized |
| 7 | `code` | code / runner，预留能力 |
| 8 | `composite` | exam / mixed |

输入收集由 `src/utils/answer-collector.js` 负责，验证器位于 `src/validators/`。题型新增时必须同时更新枚举、行为映射、渲染器、验证器和测试数据。

### 5.4 答题与复习

- 练习会话由 `src/views/quizSession.js` 统一渲染，支持顺序/随机、字体、背景、题号导航和提交报告。
- 服务端判分通过 `POST /api/v1/questions/:id/judge`；失败时部分历史路径仍有本地或 Supabase fallback。
- 错题复习由 `review-engine.js` 和 BFF 用户路由共同承担，包含错题状态、复习间隔、掌握状态和错题记录。
- `answer_reveal` 控制即时揭示或提交后揭示；新的调用应优先使用 `/judge`/`/reveal`，不要扩散 `includeAnswer=true`。

## 6. 认证与访问控制

- Supabase Auth 负责邮箱密码登录、会话和登出。
- `profiles.role` 用于管理员判断；后台页面仍由前端权限与 Supabase RLS 共同保护。
- 注册和重置密码入口当前在 UI 中暂时关闭，不能在 PRD 中标记为完整可用。
- 课程访问控制由 `src/config/access.js` 与 `isItemFree` 负责；登录用户和游客的可访问范围必须与产品文档同步。
- BFF 用户路由使用 JWT middleware；未登录访问用户数据和判分接口应返回 401。

## 7. 构建、验证与部署

```bash
npm run build:data
npm run validate:data
npm run build
npm run preview

cd bff
npm run typecheck
```

根目录 `package.json` 的 `predev`/`prebuild` 会运行 `build:data` 和 `fetch:data`。`build:training` 是独立的重流程，不应假设每次普通前端构建都会自动执行它。

生产默认使用：

```text
Cloudflare Pages
  ├─ dist/                         静态前端
  └─ functions/api/[[route]].js   Hono BFF
```

service role 只配置在 Cloudflare Secret 或本地 `.dev.vars`，不可放入 `VITE_*` 或静态 bundle。

## 8. 依赖与安全边界

浏览器仍然使用 Supabase anon key 完成 Auth 和部分历史业务读取；BFF 使用 service role 访问服务端业务数据。当前尚未完成全部业务域迁移，因此不能直接撤销所有浏览器端业务表权限。

`src/services/apiClient.js` 的注释要求自动附带 JWT，但该行为需要通过登录态请求验证；不要仅依据注释假设鉴权链路正确。

## 9. 已知限制与后续工作

1. 管理后台 CRUD 尚未迁移到 `/api/v1/admin/*`。
2. 社区、我的试卷和部分练习记录仍存在直接 Supabase 访问。
3. 静态题库和试卷快照仍可能包含答案，构建 bundle 不是完整的答案防泄露方案。
4. `includeAnswer=true` 需要在服务端判分链稳定后移除。
5. JWT 注入、错误 fallback 和各业务域的权限策略需要持续回归。
6. 主题设计和部分学习优化仍属于产品/视觉目标，不应自动视为已实现能力。

本文是技术事实基线；后端迁移细节见根目录 `backend-architecture-redesign.md` 与 `backend-redesign-handoff.md`。
