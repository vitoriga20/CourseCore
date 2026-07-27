# CourseCore 用户登录与付费体系实现方案

> 版本: 1.1  
> 日期: 2026-07-27  
> 适用项目: `coursecore/`（Vite 静态站点）

---

## 1. 目标与范围

### 1.1 目标
- 在现有 Web/H5 站点上接入用户账号体系。
- 支持“游客进入 → 登录/注册 → 数据合并”的流畅体验。
- 登录后同步学习进度、做题记录到云端。
- 本次先不上线付费与付费内容保护，仅完成账号、游客、进度同步链路。

### 1.2 不在本次范围
- 微信小程序登录（可后续扩展）。
- 付费内容、付费购买与 Stripe 支付（已明确延后）。
- 复杂的内容 DRM（付费内容仍可能被截屏/抓包）。

---

## 2. 前置条件

1. 注册 [Supabase](https://supabase.com) 项目，开启 **Email** 认证。
2. 在 `coursecore/.env.local` 中新增以下配置（不提交 Git）：

```bash
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

> 付费相关配置（Stripe、`SUPABASE_SERVICE_ROLE_KEY` 等）本次暂不接入。

---

## 3. 架构总览

```text
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vite SPA)                       │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ 游客本地存储  │  │ Supabase Auth │                         │
│  └──────────────┘  └──────────────┘                          │
└────────────────────┬────────────────────────────────────────┘
                     │ JWT / API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                          Supabase                            │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ Auth (users) │  │ Postgres DB  │                         │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 关键原则
- **静态构建继续保留**：首页、课程列表、理论页、所有题目仍走 `vite build + prerender.js`。
- **游客优先**：未登录用户也能看免费内容、做题；登录后把本地数据合并到云端。
- **付费内容延后**：本次不剥离付费小节、不上传私有 Storage、不接 Edge Function。

---

## 4. 数据模型

### 4.1 表结构

```sql
-- 用户扩展资料（创建触发器自动插入）
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text default 'free' check (role in ('free','paid','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 做题记录（每提交一次生成一条）
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id text not null,
  question_id text not null,
  answer jsonb,
  is_correct boolean,
  created_at timestamptz default now()
);

-- 小节学习进度（每个 user + item 一条）
create table public.progress (
  user_id uuid not null references auth.users on delete cascade,
  item_id text not null,
  status text default 'not_started' check (status in ('not_started','in_progress','completed')),
  score numeric,
  updated_at timestamptz default now(),
  primary key (user_id, item_id)
);
```

### 4.2 Row Level Security（RLS）

```sql
alter table public.profiles enable row level security;
alter table public.answers enable row level security;
alter table public.progress enable row level security;

-- profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- answers
create policy "Users can CRUD own answers"
  on public.answers for all
  using (auth.uid() = user_id);

-- progress
create policy "Users can CRUD own progress"
  on public.progress for all
  using (auth.uid() = user_id);
```

### 4.3 新用户初始化

通过数据库函数或 Edge Function 在 `auth.users` 插入后自动执行：

```sql
-- 触发器函数：创建 profile 与默认 free 权限
-- 初始阶段所有 item 默认 free，付费 item 在 products 中标记，购买后写入 paid 权限
```

---

## 5. 认证与游客流程

### 5.1 游客状态

- 首次访问生成 `guest_id`（UUID v4），存 `localStorage.cc_guest_id`。
- 游客数据全部存本地：
  - `cc_guest_progress`: `{ [itemId]: { status, score, updatedAt } }`
  - `cc_guest_answers`: `{ [itemId]: { [questionId]: { answer, isCorrect, createdAt } } }`

### 5.2 登录 / 注册

- 使用 **Magic Link（邮箱一键登录）** 或 **邮箱 + 密码**。
- 推荐先上 Magic Link：无需前端处理密码复杂度、忘记密码等链路，体验也更好。
- 登录成功后触发 `SIGNED_IN` 事件，执行 **数据合并**。

### 5.3 数据合并策略

```text
1. 读取本地游客数据。
2. 读取云端该用户的 answers / progress。
3. 对每一条记录按 updatedAt 比较：
   - 本地较新 → 写入云端。
   - 云端较新或相等 → 保留云端。
4. 合并完成后清空本地游客数据，或保留一份本地备份（建议清空，避免后续混乱）。
5. 如果云端已有数据且本地也有，以时间戳为准，避免询问用户。
```

---

## 6. 进度同步策略

### 6.1 写入时机

| 场景 | 游客 | 已登录 |
|---|---|---|
| 做题提交 | 写 localStorage | 写 localStorage + upsert 到 Supabase |
| 离开小节 | 保存 progress | 保存 progress 并同步 |
| 切换页面 | 不阻塞 | 后台同步 |

### 6.2 读取时机

- 应用初始化时检测登录状态：
  - 已登录：拉取云端 progress，与本地合并（同 5.3 逻辑）。
  - 游客：直接读本地。

### 6.3 数据结构示例

```js
// progress
{
  "p1b-m1-01-training": {
    status: "completed",
    score: 0.85,
    updatedAt: "2026-07-27T08:00:00Z"
  }
}

// answers
{
  "p1b-m1-01-training": {
    "q-physics-b-1-p1b-m1-01-training-001": {
      answer: "B",
      isCorrect: true,
      createdAt: "2026-07-27T08:00:00Z"
    }
  }
}
```

---

## 7. 付费内容保护（已延后）

> 按最新决策，付费内容、Paywall、Stripe 支付本次均不上线。本节保留作为后续扩展参考。

### 7.1 内容分级

在 `src/data/courses.js` 中为每个小节增加 `access` 字段：

```js
{
  id: 'p1b-m1-01-training',
  type: 'training',
  access: 'free',   // free | paid
  // ...
}
```

### 7.2 免费内容

- 继续走现有静态构建流程，存在于 `src/data/questions.js` 和预渲染页面中。

### 7.3 付费内容

- 构建时把 `access: 'paid'` 的小节题目从 `questions.js` 中剥离。
- 剥离后的 JSON 上传到 Supabase **Private Storage Bucket**（例如 `paid-content`）。
- 前端访问付费小节时，调用 Edge Function `get-content` 获取题目数据。

### 7.4 访问控制流程

```text
用户进入 /item/:paidItemId
  ├─ 未登录 → 显示登录弹窗 + “登录后购买”提示
  ├─ 已登录但未购买 → 显示 Paywall（价格 + 购买按钮）
  └─ 已登录且已购买 → 调用 get-content，渲染题目
```

### 7.5 安全边界说明

- 付费内容 JSON 不进入前端构建产物，不能直接通过 URL 访问。
- Edge Function 验证 JWT 和 `content_access` 后才返回内容。
- 这能阻止普通用户直接下载，但无法阻止已购买用户截屏或二次分发。

---

## 8. Edge Functions 设计（已延后）

> 付费内容相关的 `get-content`、`create-checkout-session`、`stripe-webhook` 本次不实现。后续接入付费体系时再补充。

---

## 9. 前端改动清单

### 9.1 新增文件

| 文件 | 说明 |
|---|---|
| `src/services/supabase.js` | Supabase 客户端初始化 |
| `src/services/auth.js` | 登录/注册/登出/游客初始化/数据合并 |
| `src/services/sync.js` | 本地进度与 Supabase 双向同步 |
| `src/components/authModal.js` | 登录/注册/重置密码弹窗 |
| `src/components/auth-components.css` | 认证组件样式 |
| `src/components/userMenu.js` | 右上角用户状态菜单 |

### 9.2 修改文件

| 文件 | 修改点 |
|---|---|
| `src/main.js` | 应用启动时初始化游客状态、初始化认证、渲染用户菜单与弹窗容器、处理认证事件 |
| `src/state.js` | 接入 `user`、`authReady` 状态；提交答案/完成小节时同步到 Supabase |
| `src/utils/progress.js` | 保持本地持久化，作为游客与登录用户的数据基础 |
| `package.json` | 新增 `@supabase/supabase-js` 依赖 |
| `.env.local` | 新增 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 占位 |

---

## 10. 构建流程调整

当前构建流程保持不变：

```bash
npm run build:training   # PDF 抽取
npm run build:data       # Markdown → questions.js
vite build               # 构建
node scripts/prerender.js # 预渲染
```

> 付费内容上传步骤（`upload:paid-content`）本次不接入，后续与 Stripe 支付一起补充。

---

## 11. 安全 checklist

- [ ] 所有 DB 表开启 RLS，并只授权用户访问自己的行。
- [ ] 前端只暴露 `VITE_SUPABASE_ANON_KEY`，不暴露 service role key。
- [ ] 游客 `guest_id` 仅用于本地区分，不上传服务器。
- [ ] 登录/注册表单项使用原生 autocomplete，降低密码管理器冲突。

---

## 12. 合规与隐私

- [ ] 新增 `/privacy` 隐私政策页面。
- [ ] 新增 `/terms` 用户协议页面。
- [ ] 注册/登录弹窗中增加“已满 14 周岁并同意用户协议和隐私政策”勾选框。
- [ ] 不收集用户真实姓名、手机号、身份证号等敏感信息（如后续需要，单独加 PIPL/GDPR 评估）。
- [ ] 用户可删除账号及关联数据（提供“注销账号”入口，删除 `profiles/answers/progress`）。

---

## 13. 风险与回退方案

| 风险 | 影响 | 回退方案 |
|---|---|---|
| Supabase 服务不可用 | 登录、同步失败 | 游客模式仍可浏览免费内容；登录同步静默降级 |
| 游客数据合并冲突 | 进度丢失或重复 | 合并前备份本地数据；冲突时按时间戳取最新 |
| 用户未收到确认邮件 | 无法完成注册 | Supabase 后台可关闭邮箱确认，或提供重发入口 |

---

## 14. 实施阶段计划

### Phase 1：Supabase 环境与数据库（1 天）
- 创建 Supabase 项目，启用 Email Auth。
- 执行第 4 节 SQL，创建 `profiles`、`answers`、`progress` 表与 RLS。
- 可选：创建 `handle_new_user()` 触发器，新用户注册时自动写入 `profiles`。

### Phase 2：游客与认证（2 天）
- 前端接入 `@supabase/supabase-js`。
- 实现游客 `guest_id` 与本地 progress/answers 存储。
- 实现邮箱 + 密码的 Auth Modal（登录 / 注册 / 重置密码）。
- 实现登录后的本地 → 云端数据合并。
- 添加用户菜单与登出。

### Phase 3：进度同步与测试（1 天）
- 已登录用户提交答案时实时写入 Supabase。
- 应用启动时拉取云端进度并合并。
- 全链路测试：游客 → 注册 → 做题 → 换设备登录同步。
- 更新 `development-log.md` 与 `technical-architecture.md`。

### Phase 4：付费内容与 Stripe（后续迭代）
- 在 `courses.js` 中标记 `access: 'paid'` 小节。
- 实现 `upload:paid-content` 脚本与 Private Storage。
- 实现 `get-content` / `create-checkout-session` / `stripe-webhook` Edge Functions。
- 前端付费小节动态加载，未购买显示 Paywall，支持前 2 题试看。

---

## 15. 已确认决策

| 决策项 | 选择 |
|---|---|
| 登录方式 | 邮箱 + 密码（注册 / 登录 / 重置密码完整链路） |
| 游客权限 | 保留游客访问免费内容 |
| 付费与试看 | 延后：先完成账号体系与进度同步，再接入 Stripe / Paywall |

> 本次先落地：游客模式、邮箱密码登录弹窗、用户菜单、本地↔云端进度同步。付费内容、Stripe、Paywall、前 2 题试看移至后续迭代。

---

## 16. 参考资料

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Stripe Checkout](https://stripe.com/docs/checkout/quickstart)
- [Stripe Webhooks](https://stripe.com/docs/webhooks/quickstart)
