# CourseCore BFF

> 文档状态：当前开发说明
>
> 更新时间：2026-08-07

CourseCore BFF 基于 Hono，默认以 Cloudflare Pages Functions 形式与前端同域部署。它负责把需要业务授权、字段裁剪、服务端判分和用户归属校验的逻辑从浏览器收回到服务端。

## 部署形态

| 形态 | 源码入口 | 用途 |
|---|---|---|
| Cloudflare Pages Functions（默认） | `bff/src/pages-entry.ts` | 与根目录 `dist/` 同域部署 |
| 独立 Worker（可选） | `bff/src/index.ts` | 独立 API 域名或本地 Worker 开发 |

Pages Function 的生成文件是 `functions/api/[[route]].js`，由构建脚本生成，不要手工编辑。根目录 `wrangler.toml` 是 Pages 部署配置；`bff/wrangler.toml` 只用于独立 Worker 模式。

## 当前能力

所有接口挂在 `/api/v1` 下：

- `GET /healthz`：健康检查
- `GET /papers`、`GET /papers/:id`：试卷读取
- `GET /papers/:id/questions`：试卷题目分页读取
- `GET /questions/:id`：单题读取
- `POST /questions/:id/judge`：登录后服务端判分，并写入答题记录/错题本
- `POST /questions/:id/reveal`：登录后按提交记录和 `answer_reveal` 控制答案揭示
- `/me/progress`：用户进度
- `/me/practice-records`：用户刷题记录
- `/me/wrong-book`：用户错题本和复习状态
- `/leaderboard`：排行榜

内容接口默认不返回 `answer`、`answers`、`solution`、`test_string` 等敏感字段。`includeAnswer=true` 仍保留为迁移兼容参数，不能当作长期安全边界；新功能应使用服务端判分或 reveal 接口。

## 目录

```text
bff/
├── src/
│   ├── app.ts                 # Hono app、中间件和路由挂载
│   ├── pages-entry.ts         # Pages Functions 适配器
│   ├── index.ts               # 独立 Worker 入口
│   ├── env.ts                 # Cloudflare bindings 类型
│   ├── lib/supabase.ts        # 服务端 Supabase REST 客户端
│   ├── middleware/            # auth、cache、rateLimit、security
│   └── routes/                # health、content、user、judge、leaderboard
├── package.json
├── tsconfig.json
└── wrangler.toml              # 独立 Worker 配置
```

## 本地开发

独立 Worker 模式：

```bash
cd bff
npm install
npm run typecheck
npm run dev
```

Pages Functions 模式需要根目录已有 `dist/`，并从项目根目录运行：

```bash
npm run build
npx wrangler pages dev dist
```

本地密钥放在根目录 `.dev.vars`，至少包含：

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

service role 只能用于 BFF 服务端。不要使用 `VITE_SUPABASE_SERVICE_ROLE_KEY`，也不要把它写入静态资源。

## 部署

```bash
npx wrangler login
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler pages deploy dist
```

完整前端构建会先生成内容数据并抓取构建所需数据。部署前应确认 `functions/api/[[route]].js` 已由当前 BFF 源码重新生成。

## 前端接入约定

前端通过 `src/services/apiClient.js` 调用同域 `/api/v1`。内容读取由 `src/services/practice-data.js` 优先走 BFF；判分、错题和同步也优先走 BFF，并在部分历史路径保留 fallback。

当前仍有直接访问 Supabase 的业务：管理后台、社区、部分练习记录、我的试卷和部分 fallback。迁移没有完成前，不得全面收窄浏览器端 Supabase 权限。

## 验证清单

- `npm run typecheck` 通过。
- `/api/v1/healthz` 返回 200。
- 未登录访问 `/api/v1/me/*`、`/api/v1/questions/:id/judge` 返回 401。
- 公开内容默认不含答案/解析。
- 登录后判分返回结果，并写入答题记录与错题本。
- 线上部署的 Pages Function 与当前源码一致。
- 管理后台、社区和 fallback 路径仍可用。

## 关联文档

- [后端当前架构](../backend-architecture-redesign.md)
- [后端交接基线](../backend-redesign-handoff.md)
- [技术架构事实](../.trae/documents/technical-architecture.md)
