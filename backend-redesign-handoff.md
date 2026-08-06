# CourseCore 后端重构 — AI 交接文档

> **读者**：接手本项目的 AI Agent，你拥有 **Supabase MCP** 权限，可直接读写数据库 / 执行 SQL / 改 RLS。
> **目标**：让你在读完本文件后能直接继续 Phase 0（安全止血）与 Phase 2（业务权威上移）的数据库侧工作。
> **更新时间**：2026-08-05
> **关联文档**：`backend-architecture-redesign.md`（完整方案，含诊断表、API 示例、SQL 补丁、阶段计划）

---

## 0. 30 秒速览

- **CourseCore** 是一个 **Vite 静态前端 SPA**（刷题/课程资料平台），题库来自大量 PDF（高数/线代/大物等）。
- **当前"后端"= Supabase（PostgREST）**，前端用 `@supabase/supabase-js` + **浏览器里的 anon key 直接读写数据库**。没有独立应用服务层。
- **已落地 Phase 1**：在 Cloudflare **Pages Functions** 上做了一层 **Hono BFF**（无状态 API 网关），只读 Content API 已写好、类型检查与打包均通过。
- **你的核心任务**：用 Supabase MCP 做**安全止血（收窄 RLS / 收回答案列权限）** + 为 Phase 2 准备表与策略。⚠️ 收权动作**必须排在"前端切到 BFF"之后**，否则线上页面会读不到数据。

---

## 1. 当前架构（事实，含代码证据）

| 维度 | 现状 | 证据 |
|---|---|---|
| 前端 | Vite SPA，构建产物 `dist/` | `vite.config.*`、`package.json` scripts |
| 数据层 | Supabase Postgres + PostgREST | `src/services/supabase.js` |
| 前端访问方式 | **浏览器内直连**，持有 anon key | `src/services/admin.js`、`sync.js`、`review-engine.js`、`practice-data.js` 内 `supabase.from(...)` |
| 题库数据 | **整库打包进前端 JS bundle** | `src/data/examPapers.js`(404KB)、`questions.js`(211KB)、`courses.js`(44KB)，由 `scripts/fetch-from-supabase.js` 构建期全量拉取写死 |
| 缓存 | 仅内存 + localStorage(TTL 1h) | `src/services/practice-data.js` |
| 部署 | 前端已在 **Cloudflare Pages** | 用户确认已部署到 Pages |
| 鉴权 | Supabase Auth（用户私有表 RLS 行级隔离） | `scripts/supabase-schema.sql`、迁移 `scripts/migrations/001-practice-board.sql` |

### 已识别的 4 个硬伤
1. **整库题库进 bundle**：首屏体积巨大、内容改了必须全量重建重部署、无法热更新。
2. **答案对匿名完全可读（安全红线）**：`supabase-schema.sql` 题目/试卷表 RLS 为 `USING (true)`，`answer`/`solution` 随题目一起返回 —— 任何人（含未登录）能拉走全部题目+答案+解析。
3. **业务逻辑全在浏览器**：admin CRUD、错题状态机、sync 合并都在前端；anon key 进浏览器，整个数据模型经 PostgREST 暴露，无审计/限流/版本化。
4. **无服务端缓存**：每次热启动拉 `exam_papers→sections→questions` 大 join 直打 Supabase，排行榜全表聚合无缓存。

> ✅ 保留项：Supabase RLS 行级隔离方向正确、DB 触发器/部分唯一索引/级联删除都在、`answer_reveal` 字段已建模判分时机。

---

## 2. 目标架构（已锁定决策）

**保留 Supabase 作数据 + 身份底座，新增一层无状态 BFF/API 网关**，把业务权威从浏览器收回到服务端。

- **Hono + Cloudflare Pages Functions**（同域部署，免 CORS，一次 `wrangler pages deploy dist` 前后端一起上线）。
- **Content API**（读多·分页·字段裁剪·答案默认不返回）+ **User/Write API**（Phase 2：鉴权·限流·错题机/同步/排行）。
- **Cloudflare Cache API 边缘缓存** + SWR 卸载读压力；内容变更主动 purge 实现热更新、免重建。
- 答案只在 **gated 接口**（提交判分 / 已发布解析，复用 `answer_reveal`）按需返回。
- `service_role` key **仅存服务端**（CF secret），前端不再直连业务表。

### 已落地文件树（Phase 1 脚手架，可直接运行）
```
CourseCore/
├── functions/api/[[route]].ts     # Pages Functions 入口, hono/cloudflare-pages 的 handle(app) 接管 /api/*
├── wrangler.toml                  # 根: Pages 部署, pages_build_output_dir = "dist"
├── .dev.vars.example              # 本地密钥样例 (SUPABASE_SERVICE_ROLE_KEY)
├── .gitignore                     # 已追加 .dev.vars
├── bff/
│   ├── src/app.ts                 # 共享 Hono app(中间件+路由), Worker 与 Pages 共用
│   ├── src/index.ts               # 纯 Worker 入口(export default app), 可选
│   ├── src/env.ts                 # 绑定类型(env + 可选 KV)
│   ├── src/lib/supabase.ts        # 极简 PostgREST 客户端(fetch), service_role 仅存服务端, 无外部依赖
│   ├── src/middleware/security.ts # 安全响应头(HSTS/CSP default-src 'none'/X-Frame-Options...)
│   ├── src/middleware/cache.ts    # Cloudflare Cache API 边缘缓存(默认 300s + SWR)
│   ├── src/middleware/rateLimit.ts# KV 滑动窗口限流(120/60s, 未绑 KV 优雅降级)
│   ├── src/routes/content.ts      # Content API: 试卷列表/详情/题目分页, 默认不返回答案
│   ├── src/routes/health.ts       # 健康检查
│   ├── wrangler.toml              # 标注为「可选独立 Worker」配置
│   ├── package.json / tsconfig.json
│   └── README.md                  # Pages 优先部署说明
└── backend-architecture-redesign.md  # 完整方案文档(诊断+API示例+SQL安全补丁+阶段计划)
```
**Content API 路由（Phase 1 只读）**：
- `GET /api/v1/papers` 列表（分页 + `subject/school/term` 过滤）
- `GET /api/v1/papers/:id` 详情（嵌套 sections + 题目）
- `GET /api/v1/papers/:id/questions` 题目分页
- `GET /api/v1/questions/:id` 单题
- `POST /api/v1/questions/:id/reveal` → 501 占位（答案揭示留到 Phase 2 判分接口）
- 所有查询默认字段投影**剔除 `answer/answers/solution/test_string`**

---

## 3. 阶段计划与状态

| 阶段 | 内容 | 状态 |
|---|---|---|
| **Phase 0** | 安全止血：答案列视图剥离 + 收窄 anon 权限 | ⏳ 待做（**你来做**，见 §5） |
| **Phase 1** | 引入 BFF + Content API（脚手架已落地，见 §2） | ✅ 代码完成，待部署 + 前端切换 |
| **Phase 2** | 业务权威上移：判分/reveal gated、admin 写操作、错题本/同步/排行上移、用户 JWT 校验中间件 | ⏳ 待做 |
| **Phase 3** | 弹性与可观测：CDN/缓存调优、自动扩缩、指标告警、10x 压测 | ⏳ 待做 |

**严格顺序**：`A 部署 BFF` → `B 验证 BFF 活着` → `C 前端读操作切到 BFF` → `D 用 Supabase MCP 收窄 anon 权限（即 Phase 0）`。
> **D 必须晚于 C**：否则前端还没切过来、anon 又被收权，页面会读不到数据。

---

## 4. 前端切换清单（Phase 1 → C，给前端 AI 同事，非你）

前端把 `src` 下 `supabase.from('exam_papers'|'exam_sections'|'exam_questions')` 的**读操作**改调同域 `/api/v1/...`（新增 `src/services/apiClient.js` 包装 `fetch('/api/v1'+path)`）。**写操作（错题本/同步/排行）先别动**，那是 Phase 2。

---

## 5. ⭐ 你的工作：用 Supabase MCP 做数据库侧改造

### 5.1 前置：先核对真实 schema

> **核查记录（2026-08-05，Supabase MCP 实测，只读）**
> - `categories` 表**不存在**（public 下无此表）→ §5.2 SQL 里的 `REVOKE ... ON categories` 必须删掉，否则报错。
> - `wrong_book` / `practice_records` 的 owner RLS **已存在**（`users_crud_own_wrong_book` / `users_crud_own_practice_records`，`auth.uid()=user_id`）→ §5.2-2 无需新建，只核验即可。
> - 内容表 RLS：`exam_papers/exam_sections/exam_questions` 各有 `*_read_all` + `*_readable_by_everyone` 两条 SELECT、`qual=true`（匿名可读）→ 确认红线存在。
> - `exam_questions` 敏感列俱全：`answer(text)` / `answers(jsonb)` / `solution(text)` / `test_string(text)` / `blanks(integer)`；`exam_questions.answer`、`answers.answer` 已授 SELECT 给 anon+authenticated → 确认答案暴露。
> - `answer_reveal` 列存在，类型 **text**（非 boolean），当前全量取值 `after_submit`（=提交后揭示）→ §5.3 机制已就绪，无需补列。
> - **收权前置（铁律）**：`src/services/` 尚无 `apiClient.js`，前端**未切 BFF（C 未完成）**。§5.2 的 REVOKE **禁止现在执行**，否则破坏线上（admin 内容编辑 + sync/practice 直连全断）。等 C 完成后再跑下方修正版 SQL。
用 MCP 读取实际表结构，确认下列对象存在、字段名无误（不要凭记忆执行 SQL）：
- 表：`exam_papers`、`exam_sections`、`exam_questions`、`categories`、`wrong_book`、`practice_records`（及迁移 `001-practice-board.sql` 里的其他表）
- 字段：`exam_questions.answer` / `answers` / `solution` / `test_string` / `blanks` / `answer_reveal`
- 现有 RLS 策略：`supabase-schema.sql` 中题目/试卷表应为 `USING (true)`（匿名可读）——这是要修的

### 5.2 Phase 0 / D：收窄匿名访问（⚠️ 确认 C 完成后才执行）
**原则**：浏览器不再直连 Supabase，业务表只对 `service_role`（由 BFF 持有）开放；BFF 负责鉴权/限流并决定是否返回答案。

```sql
-- 1) 收回浏览器端两个角色对业务表的所有权限
--    ⚠️ 核对修正：categories 表不存在，已移除；wrong_book/practice_records 的 owner RLS 已存在，见下方 2) 说明
REVOKE ALL ON exam_papers    FROM anon, authenticated;
REVOKE ALL ON exam_sections  FROM anon, authenticated;
REVOKE ALL ON exam_questions FROM anon, authenticated;

-- 2) 用户私有表: 确保 RLS 用 auth.uid() 隔离
--    ✅ 已实测：wrong_book/practice_records 的 owner 策略已存在
--    (users_crud_own_wrong_book / users_crud_own_practice_records)，无需重复创建。
--    仅当确缺某个用户表时才补建，形如：
-- ALTER TABLE wrong_book ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "wrong_book_owner" ON wrong_book;
-- CREATE POLICY "wrong_book_owner" ON wrong_book
--   FOR ALL
--   USING     (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- 3) 列级兜底: 即使漏配 RLS, 敏感列也不对匿名暴露
REVOKE SELECT (answer, answers, solution, test_string, blanks)
  ON exam_questions FROM anon, authenticated;

-- 4) service_role 保持全权(BFF 使用), Supabase 默认已授予, 一般无需改动
--    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

> 说明：BFF 用 `service_role` key 读写，RLS 对其自动 bypass，因此上述收权不影响 BFF 正常工作；前端迁移后浏览器端不再用 anon/authenticated 碰业务表，泄露面关闭。

### 5.3 验证 `answer_reveal` 机制（Phase 2 依赖）
- ✅ **已实测**：`exam_questions.answer_reveal` 存在，类型 **text**，当前全量取值 `after_submit`（= 提交后才揭示答案/解析）。BFF 的 `/reveal` 与判分接口（Phase 2 写）按此语义：无 `after_submit` 授权态不返回答案。
- 因列已存在且取值明确，**无需补列、无需默认布尔值**。若内容侧要支持"已发布解析即揭示"，可接受 `answer_reveal IN ('after_submit','immediate')` 等枚举，后续在 admin 开关处扩展。

### 5.4 Phase 2 准备（表/RLS，待前端同事确认接口契约后做）
- 为写接口准备 RLS：错题本/练习记录/同步/排行依赖 `auth.uid()`，确保每张用户表都有 5.2-2 形式的 owner 策略。
- 若要做"判分后写回掌握度/排行榜"，确认是否有对应表（如 `mastery` / `leaderboard`），无则设计建表 SQL（可参考迁移文件风格）。
- 建议新增 DB 函数（`SECURITY DEFINER`）承载排行榜聚合，避免 BFF 多次查询；用 MCP 创建并授 `service_role` 执行。

---

## 6. 已锁定的决策（不要再质疑）
1. **BFF 技术栈 = Hono**（原生为边缘运行时设计）。
2. **部署 = Cloudflare Pages Functions 同域**（非独立 Worker；Worker 入口保留为可选项）。
3. **数据/身份底座 = Supabase 保留**，不换数据库。
4. **答案默认不返回**，仅经 gated 接口按需返回（复用 `answer_reveal`）。
5. **service_role 仅存 CF secret**，不进仓库、不进前端。

---

## 7. 验证清单（你或前端同事执行）
- [ ] `curl "https://<站>.pages.dev/api/v1/papers?pageSize=2"` 返回**无 `answer`/`solution` 字段**
- [ ] 响应头出现 `X-Cache: MISS`，二次请求变 `HIT`（边缘缓存生效）
- [ ] 前端切 BFF 后页面正常读取试卷/题目
- [ ] **C 完成后**执行 §5.2 收权，再用 anon key 直连 Supabase 验证业务表已不可读
- [ ] `answer_reveal` 机制核对/补齐完成（§5.3）

---

## 8. 关键文件索引
| 文件 | 用途 |
|---|---|
| `backend-architecture-redesign.md` | 完整重构方案（你要先读这个了解全貌） |
| `functions/api/[[route]].ts` | Pages Functions 入口 |
| `bff/src/app.ts` | 共享 Hono 实例（中间件+路由） |
| `bff/src/routes/content.ts` | Content API，默认不返回答案 |
| `bff/src/lib/supabase.ts` | 服务端 PostgREST 客户端 |
| `bff/README.md` | 部署说明 |
| `scripts/supabase-schema.sql` | 原始 schema（含要修的 `USING (true)` RLS） |
| `scripts/migrations/001-practice-board.sql` | 刷题板块表（wrong_book/practice_records 等） |

---

## 9. 给接手者的提醒
- 不要动前端 `src/data/*.js` 的题库 bundle 直到 BFF 接管内容读取，否则会破坏线上。
- 所有对 Supabase 的 **破坏性 SQL（REVOKE / DROP POLICY）先 dry-run 或在事务里确认**，收权前务必确认前端已不再用 anon 直连业务表。
- 若需新建表/函数，沿用 `scripts/migrations/` 的编号与风格，并补充到 seed/迁移体系中。
