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
│   ├── main.js                # 应用壳、事件委托、认证初始化
│   ├── router.js              # 路由与视图控制器
│   ├── state.js               # 全局状态、localStorage 持久化、云端同步触发
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
│   ├── services/
│   │   ├── supabase.js        # Supabase 客户端初始化
│   │   ├── auth.js            # 游客初始化、登录/注册/登出、数据合并
│   │   └── sync.js            # 云端 answers / progress 读写与合并
│   ├── utils/
│   │   ├── progress.js        # localStorage 读写与迁移
│   │   ├── answer-collector.js# 从 DOM 收集用户答案
│   │   └── question.js        # 题目导航工具
│   ├── validators/            # 各类答案校验器
│   ├── components/            # UI 组件
│   │   ├── authModal.js       # 登录/注册/重置密码弹窗
│   │   ├── auth-components.css# 认证组件样式
│   │   ├── userMenu.js        # 右上角用户状态菜单
│   │   └── loading.js         # 页面与图片加载动画
│   └── views/                 # 页面与题目渲染模板
│       ├── course.js
│       ├── practiceList.js
│       ├── inlinePractice.js
│       ├── quizSession.js
│       ├── legal.js           # 隐私政策 / 用户协议页面
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

## 8. 用户认证与进度同步

### 8.1 认证服务

- `src/services/supabase.js`：读取 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 创建 Supabase 客户端；未配置时返回 `null`。
- `src/services/auth.js`：
  - `initGuest()`：首次访问生成 `cc-guest-id` 存 `localStorage`。
  - `initAuth()`：启动时恢复会话、监听 `onAuthStateChange`、触发登录后本地↔云端数据合并。
  - `signUp` / `signIn` / `signOut` / `resetPassword`：邮箱+密码标准链路。
- `src/components/authModal.js`：登录/注册/重置密码弹窗，通过 `data-action` 与 `src/main.js` 事件委托交互。
- `src/components/userMenu.js`：header 右上角用户状态菜单。

### 8.2 进度同步

- `src/services/sync.js`：
  - `pushAnswer(userId, questionId, itemId, answer, isCorrect)`：每次提交答案后写入 `answers` 表。
  - `pushItemProgress(userId, itemId, status, score)`：小节全部完成后 upsert `progress` 表。
  - `pullProgress(userId)`：拉取云端 `answers` 与 `progress`。
  - `mergeAndPushLocal(userId, localProgress, localCompleted, remoteAnswers, remoteProgress)`：按 `lastAt` / `created_at` 时间戳合并，本地较新则插入云端，云端较新则覆盖本地。
- `src/state.js`：
  - 新增 `user`、`authReady`。
  - `markQuestion()` 与 `syncItemProgress()` 在已登录且 Supabase 已配置时异步触发同步；失败仅打印日志，不阻塞本地体验。

### 8.3 数据表（Supabase）

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text default 'free' check (role in ('free','paid','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id text not null,
  question_id text not null,
  answer jsonb,
  is_correct boolean,
  created_at timestamptz default now()
);

create table public.progress (
  user_id uuid not null references auth.users on delete cascade,
  item_id text not null,
  status text default 'not_started' check (status in ('not_started','in_progress','completed')),
  score numeric,
  updated_at timestamptz default now(),
  primary key (user_id, item_id)
);
```

所有表开启 RLS，仅允许用户访问自己的行。

完整建表、RLS、触发器、索引脚本见 `scripts/supabase-schema.sql`，可在 Supabase SQL Editor 中直接运行。

### 8.4 当前状态

- 前端认证与同步链路已实现；`scripts/supabase-schema.sql` 提供完整建表脚本。
- 填入 `.env.local` 并执行 SQL 后即可启用登录与云端同步。
- 付费内容、Paywall、Stripe 支付按产品决策延后。

## 9. 关键设计决策

- **训练小节复用 `quizSession` 交互**：保持顺序/随机、字体/背景切换、题号导航、进度报告一致。
- **inline 答题状态不持久化**：进入小节即清空，避免历史错误状态干扰。
- **答案收集基于 DOM**：`answer-collector.js` 直接从 DOM 读取，避免不同题型状态同步差异。
- **敏感配置隔离**：MinerU token 与 Supabase key 放入 `.env.local`，不进入代码仓库。
- **游客优先 + 登录合并**：未登录时全部数据存本地；登录后按时间戳合并到 Supabase，不询问用户。
- **Supabase 未配置 graceful degradation**：无配置时站点仍以游客模式运行，不影响现有功能。
- **邮箱 + 密码认证**：用户已确认此方式，弹窗支持登录/注册/重置密码三态切换。
