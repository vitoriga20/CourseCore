# CourseCore 后端架构重构方案（Backend Architecture Redesign）

> 角色：后端架构师（Backend Architect）
> 目标：可扩展（scale horizontally）、稳定（99.9%+ 可用）、安全（考试数据防泄漏）的后端
> 现状诊断基于 `src/services/*`、`scripts/supabase-schema.sql`、`scripts/migrations/001-practice-board.sql`、`package.json` 实测代码

---

## 一、现状诊断（As-Is）

当前是 **Vite 静态 SPA + Supabase（PostgREST）** 的极简结构，前端用 `@supabase/supabase-js` + 浏览器 anon key 直接读写数据库，**没有独立的应用服务层（BFF/API Server）**。

### 1.1 现状拓扑
```
浏览器 (Vite SPA)
  ├─ import.meta.env.VITE_SUPABASE_ANON_KEY  ← 公钥直接进前端
  ├─ src/services/supabase.js → @supabase/supabase-js
  ├─ src/data/questions.js(211KB) / examPapers.js(404KB) / courses.js(44KB) / theoryContents.js(30KB)
  │     ← 构建期由 scripts/fetch-from-supabase.js 从 Supabase 拉全量内容，写死进前端 bundle
  └─ 直接调用 supabase.from(...).select/insert/update/delete (auth.js / sync.js / admin.js / review-engine.js / practice-data.js)
                         │
                         ▼
                 Supabase (Postgres + Auth + RLS)
                   ├─ 内容表: courses/modules/items/questions/theory_contents/exam_papers/exam_sections/exam_questions/knowledge_points/question_kp
                   ├─ 用户表: profiles/answers/progress/favorites/wrong_book/posts/post_favorites/my_papers/practice_records
                   └─ RLS 策略 + SECURITY DEFINER 函数 (is_admin / admin_list_users / admin_delete_user / get_leaderboard)
```

### 1.2 可扩展性 / 稳定性痛点（带代码证据）

| # | 问题 | 证据 | 影响 |
|---|------|------|------|
| P1 | **整库题库/试卷打包进前端 bundle** | `src/data/examPapers.js` 404KB、`questions.js` 211KB；`practice-data.js` 默认 fallback 用 `EXAM_PAPERS`；`fetch-from-supabase.js` 构建期写死 | 首屏 JS 体积巨大（>650KB 纯数据），TTI 差、移动端体验差；**内容变更必须全量重建+重部署**，无法热更新 |
| P2 | **无应用服务层，前端即唯一 API 客户端** | `src/services/*.js` 全部直接 `supabase.from(...)`；`admin.js` 浏览器内 CRUD | 无服务端限流/校验/版本化/集中错误处理；业务逻辑（错题状态机、sync 合并、admin CRUD）散在浏览器，难测试、难演进 |
| P3 | **RLS 是唯一安全边界，且内容表对匿名完全可读** | `supabase-schema.sql` 第 260-283 行 `questions/exam_questions ... USING (true)`；`answer/solution` 字段随题目一起 SELECT | **考试数据泄露风险**：任何人（含未登录）可拉走全部题目+答案+解析。对考试/题库平台是学术诚信硬伤 |
| P4 | **anon key 进浏览器，数据模型完全暴露** | `src/services/supabase.js` 第 3-4 行；`package.json` 暴露 `VITE_SUPABASE_*` | 所有防护仅靠 RLS；PostgREST 全表可探；无法做审计、限流、WAF |
| P5 | **无缓存层（Redis/KV）** | `practice-data.js` 仅 memCache + localStorage(TTL 1h)；每次热启动拉 `exam_papers→sections→questions` 大 join | 高频读放大到 PostgREST；Supabase 读额度/连接受限；排行榜 `get_leaderboard` 全表聚合无缓存 |
| P6 | **无法水平扩展 / 无服务拆分** | 仅单 Supabase 项目；无自建服务 | 扩展上限=Supabase 套餐 + PostgREST；业务增长撞墙 |
| P7 | **无可观测性 / 容灾** | 仅 `console.warn`/`console.error`；`practice-data.js` Supabase 失败→fallback 静态 | 无指标/告警/熔断；构建期 Supabase 不可用→`exit 0` 静默用陈旧数据 |
| P8 | **客户端合并逻辑（sync.js）无服务端权威** | `sync.js` `mergeAndPushLocal` 按时间戳 last-write-wins | 多端并发时出现数据丢失/不一致风险 |

### 1.3 现状中"做得对"的部分（保留）
- Supabase 的 **RLS 行级安全模型** 方向正确（用户隔离靠 `auth.uid()`）。
- DB 层已有 **触发器**（`handle_new_user` 自动建 profile）、**部分唯一索引**（`uq_qk_primary_once`）、**级联删除**、**`answer_reveal` 字段**已建模"即时/提交后判分"。
- `wrong_book` 状态机（`review-engine.js`）逻辑清晰，只是位置错了（应在服务端）。

---

## 二、目标架构（To-Be）

**核心思路**：保留 Supabase 作为「数据与身份认证底座」（Postgres + Auth + RLS 很成熟，不必重造），但**新增一层无状态应用服务（BFF / API Gateway）**，把"业务权威逻辑"从浏览器收回到服务端，并补齐缓存、安全、可观测性三件套。

### 2.1 架构分层
```
┌─────────────────────────────────────────────────────────────┐
│  客户端 (Vite SPA，体积骤减)                                   │
│   - 不再打包题库；只持有 UI 代码                                │
│   - 所有数据走 /api/v1/* ；认证走 BFF 转发 Supabase Auth       │
└───────────┬───────────────────────────────┬─────────────────┘
            │ 静态资源 / 缓存内容            │ 动态 API
            ▼                                ▼
┌──────────────────────┐        ┌──────────────────────────────────────────┐
│ Edge / CDN            │        │ API Gateway (BFF, 无状态, 可水平扩)        │
│ (CloudBase/EdgeOne)   │        │  - helmet / 限流 / JWT 校验 / 参数校验     │
│  - 缓存内容 API 响应  │        │  - 审计日志 / 错误处理 / 版本化 (/api/v1)  │
│  - 静态 SPA 托管       │        │  - service_role key 仅存服务端，绝不进前端  │
└──────────────────────┘        └───┬───────────────┬──────────────────────┘
                                     │               │
                          ┌──────────▼───┐   ┌───────▼──────────┐
                          │ Content API  │   │ User/Write API    │
                          │ (读多, 强缓存)│   │ (写多, 限流, 鉴权) │
                          │ 分页/字段裁剪 │   │ 错题机/同步/排行   │
                          └──────┬───────┘   └───────┬──────────┘
                                 │                    │
                          ┌──────▼───────┐    ┌───────▼──────────┐
                          │ Redis / KV   │    │ Supabase          │
                          │ 内容+排行榜缓存│    │ Postgres + Auth   │
                          │ (TTL 5~15min) │    │ RLS (用户隔离)    │
                          └──────────────┘    └───────────────────┘
```

### 2.2 关键设计决策

**D1 — 引入无状态 BFF / API 服务（解决 P2/P4/P6）**
- 技术选型：Node + **Hono**（轻量、边缘友好）或 **Fastify/Express**；部署到 CloudBase 云函数 / 容器，按流量自动扩缩（scale-to-zero / HPA）。
- 前端**不再直接持 anon key 读写业务表**；仅保留 Supabase Auth 的浏览器会话（或 BFF 代理 auth）。admin 写操作、错题状态机、sync 合并、排行榜聚合全部移到 BFF，服务端成为"数据权威"。
- BFF 持有 `service_role`（仅服务端），但仍**保留 RLS** 作纵深防御；BFF 在写前做应用层校验与授权。

**D2 — 内容配送与用户数据分离（解决 P1/P5）**
- 内容（课程/题目/试卷/解析）改为 **Content API 服务端按分页返回 + 字段裁剪**，前端按需加载，彻底移除 `src/data/*.js` 大 bundle。
- 内容 API 响应在 **Edge/CDN + Redis 双缓存**（TTL 5~15min）；题库变更由 admin 操作后主动失效缓存（cache purge），实现热更新、免重建。
- 用户数据（answers/progress/wrong_book/practice_records/favorites/my_papers）走 **User API**，必经鉴权 + 限流，不进 CDN 缓存。

**D3 — 考试安全加固（解决 P3，最高优先级）**
- 公开内容 API **默认不返回 `answer`/`solution`/`answers`**；列表/详情接口只给题目题干+选项。
- 答案仅在「提交判分后」或「已掌握/已发布解析」场景下，由**独立 gated 接口**按 `answer_reveal` 规则返回（复用已有 `answer_reveal` 字段）。
- RLS 调整：内容表从 `USING (true)` 改为 `USING (true)` 但 **通过列级策略/视图隐藏答案列**（见 §2.4）。

**D4 — 服务端成为错题/同步权威（解决 P8）**
- `wrong_book` 状态机、`sync.js` 合并逻辑迁到 BFF 事务内执行，消除客户端 last-write-wins 冲突。
- `practice_records` 提交走单个幂等写接口（`idempotency-key`），避免重复提交。

**D5 — 可观测性 + 容灾（解决 P7）**
- 结构化日志 + 指标（P95 延迟、错误率、DB 查询耗时、缓存命中率）+ 健康检查 `/healthz`。
- Supabase 已具备 PITR 备份；BFF 侧配置熔断 + 优雅降级（内容 API 降级读缓存/静态快照）。

### 2.3 API 设计规范（示例：Hono，/api/v1）

```typescript
// api/src/index.ts — BFF 入口（节选）
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from './middleware/rate-limit';
import { requireAuth } from './middleware/auth';   // 校验 Supabase JWT
import { requireRole } from './middleware/role';    // admin 校验（服务端）
import { contentRoutes } from './routes/content';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';

const app = new Hono().basePath('/api/v1');

app.use('*', secureHeaders());
app.use('*', cors({ origin: ['https://your-domain'], credentials: true }));
app.use('*', logger());

// 内容：读多、强缓存、无需登录，但隐藏答案
app.route('/content', contentRoutes);

// 用户数据：必登录 + 限流
app.route('/me', userRoutes);

// 管理：必 admin
app.route('/admin', adminRoutes);

// 健康检查
app.get('/healthz', (c) => c.json({ status: 'ok', ts: Date.now() }));

export default app;
```

```typescript
// api/src/routes/content.ts — 内容接口（分页 + 字段裁剪 + 缓存 + 隐藏答案）
app.get('/exams/:id', rateLimiter({ window: 60, max: 120 }), async (c) => {
  const id = c.req.param('id');
  const cacheKey = `exam:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  const paper = await contentService.getExamPaper(id, {
    // 关键：不 select answer/solution，除非调用方拥有解锁态
    fields: ['id','title','content','options','hint','difficulty','tags'],
    includeAnswer: false,
  });
  if (!paper) return c.json({ error: 'NOT_FOUND', code: 'EXAM_NOT_FOUND' }, 404);

  await redis.set(cacheKey, JSON.stringify(paper), 'EX', 900); // 15min
  return c.json({ data: paper });
});
```

### 2.4 数据库安全加固（SQL 补丁示例）

```sql
-- 用视图+列裁剪替代 "内容表 USING(true) 且返回答案"
-- 1) 公开只读视图：剔除 answer/solution/answers
CREATE OR REPLACE VIEW public.v_questions_public AS
SELECT id, course_id, module_id, item_id, question_type, title, content,
       options, hint, difficulty, tags, source, image, test_string,
       blanks, tolerance, unit, order_index, created_at
FROM public.questions;

-- 2) 原 questions 表 RLS 仍保留 admin 可写；公开读改为走视图
DROP POLICY IF EXISTS "questions_readable_by_everyone" ON public.questions;
-- 答案仅在"提交后判分"或"已发布解析"接口经 BFF 用 service_role 读取

-- 3) 同理 exam_questions 建 v_exam_questions_public
```

### 2.5 部署形态

| 层 | 选型 | 扩展方式 |
|----|------|---------|
| 静态 SPA | CloudBase 静态托管 / EdgeOne | CDN 边缘缓存 |
| BFF 服务 | CloudBase 云函数 或 容器（Hono/Fastify） | 按 QPS 自动扩缩 |
| 缓存 | Redis（云数据库 Redis）/ CloudBase KV | 内存级，TTL 失效 |
| 数据与身份 | Supabase（保留） | 读副本 + PITR |
| 可观测 | 自建日志/指标 + 告警 | —— |

---

## 三、分阶段迁移计划（不中断现有运行）

**Phase 0 — 安全止血（半天~1天，零架构改动）**
- 内容表答案列改为视图剥离（§2.4），前端经 BFF 才见答案。
- 确认 RLS 备份/PITR 开启。
- 给 Supabase anon key 加 **表级/列级最小权限**（即使前端仍用 anon，也收窄可访问面）。

**Phase 1 — 引入 BFF + Content API（先解决 P1/P5，最大收益）**
- 新建 BFF 服务，实现 `/api/v1/content/*`（分页+缓存+隐藏答案）。
- 前端把 `practice-data.js` 的数据源从"bundle + Supabase 直连"切到 Content API；`src/data/examPapers.js` 等逐步废弃。
- 结果：首屏体积骤降、内容可热更新、读压力卸载到缓存。

**Phase 2 — 业务权威上移（解决 P2/P4/P8）**
- 把 admin CRUD、wrong_book 状态机、sync 合并、排行榜聚合并入 BFF；前端只调 `/api/v1/me/*` 与 `/api/v1/admin/*`。
- 移除浏览器内 `service_role`/直连写表的代码路径；anon key 仅用于 Auth 会话。
- 加限流、校验、审计、幂等。

**Phase 3 — 弹性与可观测（解决 P6/P7）**
- Redis 缓存 + CDN 缓存策略调优；BFF 自动扩缩容压测。
- 接入指标/告警/熔断；10x 流量演练。

---

## 四、需要你确认的方向

1. **BFF 技术栈**：Hono（边缘/云函数友好，推荐）还是 Fastify/Express（生态熟）？
2. **部署目标**：继续用腾讯云 CloudBase（函数/容器）还是自建容器（K8s/轻量）？
3. **Phase 0 安全止血**是否现在就做（建议立即，涉及考试数据防泄露）？
4. 是否要我把 **Phase 1 的 BFF 脚手架 + Content API** 直接落地成可运行代码？

> 下一步建议：先拍板 Phase 0 安全项 + BFF 技术栈，我即可开始写代码。
