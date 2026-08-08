# CourseCore 后端架构：当前基线与迁移路线

> 文档状态：当前架构基线
>
> 更新时间：2026-08-07
>
> 本文描述已经存在的代码与部署事实；历史方案和未完成事项会明确标注为“目标”或“待办”。任何数据库权限变更前，必须先核对线上前端、BFF 和 Supabase schema 的实际状态。

## 1. 当前结论

CourseCore 当前不是“纯静态 SPA + 前端直连 Supabase”的单一架构，而是一个正在收敛的混合架构：

```text
浏览器
  ├─ Vite 静态前端
  │   ├─ 课程/题目静态构建数据（离线与降级使用）
  │   ├─ Supabase Auth 浏览器会话
  │   └─ apiClient → 同域 /api/v1
  │
  ├─ Cloudflare Pages
  │   ├─ dist/ 静态资源
  │   └─ Pages Function → Hono BFF
  │
  └─ Supabase
      ├─ Auth
      ├─ Postgres
      └─ BFF 使用的 service_role（仅服务端）
```

默认部署入口是根目录 `wrangler.toml` 指定的 Cloudflare Pages。BFF 源码位于 `bff/src/`，`functions/api/[[route]].js` 是打包生成的 Pages Function，不是手工维护的 TypeScript 源文件。

## 2. 已实现的 BFF 能力

BFF 在 `bff/src/app.ts` 注册了以下路由：

| 能力 | 路径 | 鉴权 | 当前状态 |
|---|---|---:|---|
| 健康检查 | `GET /api/v1/healthz` | 否 | 已实现 |
| 内容读取 | `GET /api/v1/papers*`、`/questions/:id` | 否 | 已实现，默认隐藏答案 |
| 服务端判分 | `POST /api/v1/questions/:id/judge` | 是 | 已实现，并写入答题记录/错题本 |
| 答案揭示 | `POST /api/v1/questions/:id/reveal` | 是 | 已实现，按 `answer_reveal` 与提交记录控制 |
| 用户进度与记录 | `/api/v1/me/progress`、`/me/practice-records` | 是 | 已实现，前端优先使用 |
| 错题本 | `/api/v1/me/wrong-book`、`/wrong-book` | 是 | 已实现，保留 Supabase fallback |
| 排行榜 | `/api/v1/leaderboard` | 视接口而定 | 已实现 |

前端 `practice-data.js` 已优先通过 BFF 加载试卷；`review-engine.js` 与 `sync.js` 也已优先使用 BFF，但部分流程仍保留直接 Supabase fallback。

## 3. 当前边界与未完成迁移

以下内容仍不能表述为“全部经 BFF”：

- 管理后台 CRUD 仍主要通过 `src/services/admin.js` 直接访问 Supabase。
- 社区、部分练习记录、我的试卷等页面仍有直接 Supabase 查询。
- `src/services/content.js` 仍保留运行时 Supabase 内容读取。
- 部分同步和错题流程在 BFF 失败时会 fallback 到 Supabase。
- 内容 API 仍支持过渡参数 `includeAnswer=true`；该参数应在服务端判分链稳定后移除。
- 静态 `src/data/questions.js`、`examPapers.js` 仍包含构建期数据，不能把“默认不返回答案”误写成“前端 bundle 完全没有答案”。

因此，当前不能直接执行“全面撤销 anon/authenticated 对业务表的 SELECT 权限”。必须先完成各业务域迁移、线上验证和回滚方案。

## 4. 数据流与数据权威

### 4.1 构建期内容

`curriculum/raw/`、题库 Markdown 或数据库内容经 `builders/question-builder.js`、`scripts/fetch-from-supabase.js` 生成或拉取到 `src/data/*.js`。这些文件是前端构建输入/降级快照，不应人工直接编辑。

### 4.2 运行时内容

试卷和题目读取优先走 BFF。BFF 使用服务端 Supabase 客户端读取 Postgres，并通过字段投影隐藏 `answer`、`answers`、`solution`、`test_string` 等敏感字段。

当前 `includeAnswer=true` 是迁移兼容机制，不是安全模型。长期目标是：浏览器只提交答案给服务端，服务端判分后按规则返回结果和解析。

### 4.3 用户数据

登录用户通过 Supabase Auth 获取会话；BFF 使用 JWT 鉴权并以用户 ID 约束进度、答案、错题本等读写。前端本地状态仍承担游客体验和临时缓存职责。

## 5. 安全边界

- `SUPABASE_SERVICE_ROLE_KEY` 只能存在 Cloudflare Secret 或本地 `.dev.vars`，不能进入 `VITE_*`、静态 bundle 或仓库。
- BFF 负责鉴权、字段裁剪、服务端判分、用户归属校验、限流、缓存和安全响应头。
- Supabase RLS 仍是纵深防御，不因为 BFF 存在就可以删除。
- 任何 `REVOKE`、RLS 收紧或表权限调整，都必须满足：对应前端读写已经迁移、BFF 线上验证通过、管理员写入路径已确认、存在回滚 SQL。

## 6. 部署与开发

### 根目录前端与 Pages

```bash
npm run build
npx wrangler pages deploy dist
```

根目录 `wrangler.toml` 使用 `pages_build_output_dir = "dist"`。Pages Function 产物由 `scripts/build-bff.js` 从 `bff/src/pages-entry.ts` 打包到 `functions/api/[[route]].js`。

### 独立 Worker 开发

```bash
cd bff
npm install
npm run typecheck
npm run dev
```

独立 Worker 是可选运行方式；生产默认是 Pages 同域模式。

## 7. 迁移路线

### 已完成：BFF 基础设施与主要用户链路

- Hono app、Cloudflare Pages entry、Supabase service-role 客户端
- Content API、缓存、限流、安全头
- 前端内容读取切换为 BFF 优先
- JWT 中间件、服务端判分、答案揭示、错题本、进度、排行榜
- 线上健康检查、内容读取、无 token 拒绝等基础验证

### 下一阶段：收敛直接 Supabase 访问

1. 为管理后台建立明确的 `/api/v1/admin/*` 契约，并迁移 CRUD。
2. 迁移社区、我的试卷、练习记录和剩余同步读写。
3. 修复并验证前端 JWT 注入、错误处理和 fallback 边界。
4. 移除 `includeAnswer=true` 过渡逻辑和静态答案依赖，或明确其发布范围。
5. 完成线上回归后，逐表收窄 anon/authenticated 权限。

## 8. 诊断与验证清单

每次后端变更至少验证：

- `cd bff && npm run typecheck`
- `GET /api/v1/healthz` 返回 200
- 未登录访问用户和判分接口返回 401
- 内容默认响应不含答案/解析字段
- 登录后判分能返回结果并写入答题记录/错题本
- 前端内容 API 失败时 fallback 行为符合预期
- 管理后台和社区等仍直连 Supabase 的功能未被权限调整破坏

本文件现在是后端事实基线；旧的架构讨论、迁移草案和执行日志只用于追溯，不应覆盖本文的当前状态。
