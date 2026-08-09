# 架构、边界和数据流

updated: 2026-08-09

## 总体形态

Vite SPA（Cloudflare Pages）+ 同域 Pages Function（BFF Hono）+ Supabase（Auth + Postgres）。混合架构：既有构建期写死的内容 bundle，又有运行时 BFF。

## 调用边界

- 浏览器 → 前端 SPA → BFF `/api/*`（同域，免 CORS）→ Supabase（service_role 仅 BFF）。
- 前端内容读取 BFF 优先，失败 fallback 静态 bundle / 直连 Supabase anon。
- 管理后台、社区、部分练习记录当前仍直连 Supabase（BFF 化未完成）。

## BFF 路由（`bff/src/app.ts`）

- `GET /api/v1/healthz` 健康检查。
- `GET /api/v1/papers*` 试卷/题目读取（分页、筛选，默认裁剪敏感字段）。
- `GET /api/v1/questions/:id` 单题，默认隐藏答案。
- `POST /api/v1/questions/:id/judge` JWT 鉴权，服务端判分并写答题/错题记录。
- `POST /api/v1/questions/:id/reveal` JWT，按 `answer_reveal` 与提交记录授权。
- `/api/v1/me/progress`、`/api/v1/me/practice-records`、`/api/v1/me/wrong-book` 用户状态。
- `/api/v1/leaderboard` 排行榜。

## 前端服务层（`src/services/`）

- `apiClient.js`：封装 `/api/v1` + JWT。
- `practice-data.js`：试卷读取，优先级 内存→localStorage→BFF→静态 bundle。
- `review-engine.js`：判分/错题。
- `sync.js`：进度/答案同步（BFF 优先，失败 fallback Supabase anon）。
- `admin.js`：管理后台数据层（当前直连 Supabase）。

## 判分与答案

- 判分在 BFF 服务端完成；内容默认不返回答案。
- 答案揭示经 `/reveal` 按 `answer_reveal` 与提交记录授权。
- Content API 暂保留 `includeAnswer=true` 过渡参数，新代码不依赖它长期。

## 安全约束

- service_role key 只存 BFF（wrangler secret / `.dev.vars`），浏览器不持有。
- 未完成全部业务域迁移前，不得全面 `REVOKE SELECT` 内容表/答案列、删除 RLS policy、删除静态 bundle。
- 键位：`wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY`。

## 部署

- 前端 SPA 默认部署 Cloudflare Pages；`wrangler.toml` 配置 `pages_build_output_dir = "dist"`。
- BFF 随 Pages Function 同一次部署。
- 验证：`cd bff && npm run typecheck`；根目录 `npm run build` + `npm run preview`。

## 约定

- 业务逻辑只写一份在 `bff/`，Worker 与 Pages Function 双形态共用 `bff/src/app.ts`。
- `hono` 装在根目录（Pages 函数向上解析 node_modules）。
- 时序图：`diagrams/architecture.svg`、`sequence-answer-sync.svg`、`sequence-content-load.svg`。