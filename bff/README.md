# CourseCore BFF / Content API

基于 **Hono + Cloudflare Pages Functions** 的无状态后端网关（Phase 1），与前端 SPA **同域部署**——`xxx.pages.dev` 同时托管页面与 `/api`，免去 CORS、一次部署前后端一起上线。同时保留「独立 Worker」模式作为可选项。

职责：把"业务权威"从浏览器收回服务端，替代前端用 `anon key` 直连 Supabase 的做法。本阶段只读 Content API（试卷 / 题目），默认**不返回答案与解析**，从根上堵住题库泄露。

## 部署形态（二选一，默认 Pages）

| 形态 | 入口 | 配置 | 说明 |
|---|---|---|---|
| **Pages Functions（默认/推荐）** | `functions/api/[[route]].ts` | 根 `wrangler.toml`（`pages_build_output_dir = "dist"`） | 同域、免 CORS、一次部署 |
| 独立 Worker（可选） | `bff/src/index.ts` | `bff/wrangler.toml` | 独立域名 `api.xxx.workers.dev`，需 CORS（已内置） |

两套形态**复用同一个 `bff/src/app.ts` 的 Hono 实例**，业务逻辑只写一份。

## 目录结构

```
CourseCore/
├── functions/
│   └── api/
│       └── [[route]].ts      # Pages Functions 入口（接管 /api/*）
├── wrangler.toml            # 根：Pages 部署配置（指向 dist）
├── .dev.vars.example        # 本地密钥样例（复制到 .dev.vars）
├── bff/
│   ├── src/
│   │   ├── app.ts           # 共享 Hono app（中间件 + 路由）
│   │   ├── index.ts         # 独立 Worker 入口（export default app）
│   │   ├── env.ts           # Bindings 类型
│   │   ├── lib/supabase.ts  # 极简 PostgREST 客户端（service_role 仅服务端）
│   │   ├── middleware/{security,cache,rateLimit}.ts
│   │   └── routes/{health,content}.ts
│   ├── wrangler.toml        # 可选：独立 Worker 配置
│   ├── package.json / tsconfig.json
└── dist/                    # 前端 Vite 构建产物（也是 Pages 静态目录）
```

## 本地开发

```bash
# 1. 在 bff 安装 Hono/wrangler/typescript（已在 bff 管理）
cd bff && npm install

# 2. 根目录放 .dev.vars（填 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）
cp .dev.vars.example .dev.vars

# 3. 启动 Pages 模式本地预览（同时起前端 dist + 函数，默认 http://localhost:8788）
npx wrangler pages dev dist
curl http://localhost:8788/api/v1/papers?pageSize=5

# 或仅起独立 Worker 模式本地预览（http://localhost:8787）
cd bff && npm run dev
```

## 部署（Pages，推荐）

```bash
npx wrangler login

# 密钥仅存 Cloudflare 侧，不进仓库
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY

# 可选：限流 KV（见根 wrangler.toml 注释）
npx wrangler kv namespace create RATE_LIMIT_KV

# 一次部署前后端（读取根 wrangler.toml）
npx wrangler pages deploy dist
```

部署后前端读取 `https://<your-site>.pages.dev/api/v1/...`（**同域，无需 CORS**）。

## 接入前端

把前端里 `supabase.from('exam_papers' | 'exam_sections' | 'exam_questions')` 的**读操作**改请求 `/api/v1/...`（同域相对路径即可）。迁移完成后，即可在 Supabase 收窄 `anon` 权限，彻底关闭浏览器直连。

## SPA 深链说明

`functions/api/[[route]].ts` 只接管 `/api/*`，其余路径走静态托管（dist）。若前端用 history 路由做深链（如 `/practice/123`）并需要回退 `index.html`，在 `public/_redirects` 加：

```
/* /index.html 200
```

`/api/*` 由函数优先处理，不会被该规则拦截。当前站点若用 hash 路由（`#/...`）则无需此文件。

## 下一步（Phase 2）

- 判分 / 答案 reveal 的 gated 接口（需用户鉴权）
- admin 写操作、错题本、同步、排行榜上移 BFF
- 用户鉴权（Supabase Auth JWT 校验中间件）
