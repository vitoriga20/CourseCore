# CourseCore 后端交接文档

> 文档状态：当前交接基线
>
> 更新时间：2026-08-07
>
> 读者：接手本项目的开发者或 AI Agent。
>
> 重要：本文只描述已验证的当前状态和安全的下一步，不授权任何数据库权限变更。执行 SQL 前必须重新读取线上 schema、RLS、权限和部署版本。

## 1. 30 秒速览

- 前端是根目录 Vite SPA，生产默认部署在 Cloudflare Pages。
- BFF 使用 Hono，源码在 `bff/src/`，Pages Function 生成产物为 `functions/api/[[route]].js`。
- Supabase 继续承担 Auth + Postgres；service role 只允许在 BFF 服务端使用。
- Content API、JWT 鉴权、服务端判分、答案揭示、用户进度、错题本和排行榜已经有实现。
- 前端内容读取已经 BFF 优先，但管理后台、社区、部分练习记录和部分 fallback 仍直接访问 Supabase。
- 不要因为 Content API 已切换，就假设所有浏览器 Supabase 访问都已经消失。

## 2. 当前文件关系

```text
CourseCore/
├── src/services/apiClient.js       # 前端 BFF client
├── src/services/practice-data.js   # 试卷读取：BFF 优先，静态数据 fallback
├── src/services/review-engine.js   # 判分/错题：BFF 优先，部分 Supabase fallback
├── src/services/sync.js             # 进度/答案同步：BFF 优先，部分 fallback
├── bff/src/app.ts                   # Hono 路由总入口
├── bff/src/pages-entry.ts           # Pages Function 入口
├── bff/src/routes/                  # health/content/user/judge/leaderboard
├── functions/api/[[route]].js       # 打包生成物，不手工编辑
└── wrangler.toml                    # Pages 部署配置
```

## 3. 当前 API 能力

| API | 状态 | 说明 |
|---|---|---|
| `GET /api/v1/healthz` | 已实现 | BFF 和上游健康检查 |
| `GET /api/v1/papers*` | 已实现 | 分页、筛选、试卷/题目读取，默认隐藏敏感字段 |
| `GET /api/v1/questions/:id` | 已实现 | 单题读取，默认隐藏答案 |
| `POST /api/v1/questions/:id/judge` | 已实现 | 需要 JWT；服务端判分并写答题/错题记录 |
| `POST /api/v1/questions/:id/reveal` | 已实现 | 需要 JWT；按 `answer_reveal` 和提交记录授权 |
| `/api/v1/me/progress` | 已实现 | 用户进度读写 |
| `/api/v1/me/practice-records` | 已实现 | 用户刷题记录 |
| `/api/v1/me/wrong-book` | 已实现 | 用户错题本与复习状态机 |
| `/api/v1/leaderboard` | 已实现 | 排行榜读取 |

Content API 仍支持 `includeAnswer=true` 过渡参数。新代码不得依赖它作为长期接口；新功能优先使用 `/judge` 或 `/reveal`。

## 4. 阶段状态

| 阶段 | 当前状态 | 备注 |
|---|---|---|
| BFF 基础设施 | 已完成 | Hono、Pages entry、service-role 客户端、中间件和部署配置已存在 |
| Content API | 已完成 | 前端试卷读取已切换为 BFF 优先 |
| 用户与判分链路 | 已完成基础能力 | JWT、判分、错题、进度、排行榜已有实现，仍需持续回归 |
| 管理后台 BFF 化 | 未完成 | 当前仍依赖 `src/services/admin.js` 直连 Supabase |
| 社区与我的试卷 BFF 化 | 未完成 | 页面仍有直接 Supabase 读写 |
| 全面收窄浏览器数据库权限 | 未开始 | 不能仅凭 Content API 完成就执行 |
| 移除静态答案 bundle | 未完成 | 仍有构建数据和 fallback |

## 5. 安全操作规则

### 禁止直接执行的操作

在没有完成业务域迁移、线上验证和回滚方案前，不得：

- 全面 `REVOKE SELECT` 内容表或答案列权限。
- 删除现有 RLS policy。
- 假设 `service_role` 已覆盖管理后台、社区和所有同步路径。
- 删除静态 `src/data/*.js` 或静态 fallback。
- 把 `SUPABASE_SERVICE_ROLE_KEY` 写入前端环境变量。

### 允许的只读核查

可以先核对：

- `exam_papers`、`exam_sections`、`exam_questions` 的字段和 RLS policy。
- `answers`、`progress`、`wrong_book`、`practice_records` 的用户归属约束。
- 线上 BFF 是否运行当前 `functions/api/[[route]].js` 产物。
- BFF 公开响应是否默认裁剪 `answer`、`answers`、`solution`、`test_string`。
- 登录请求是否真的把 Supabase JWT 传给 BFF。

## 6. 下一位接手者的工作顺序

1. 运行 `cd bff && npm run typecheck`。
2. 读取 `bff/src/app.ts` 与各路由，确认部署产物与源码一致。
3. 复核 `src/services/apiClient.js` 的 JWT 注入和错误处理。
4. 盘点仍直连 Supabase 的业务域，形成迁移清单。
5. 为管理后台、社区、我的试卷和练习记录补齐 BFF 契约。
6. 每迁移一个业务域，分别做匿名、登录、管理员和失败 fallback 回归。
7. 只有全部浏览器读写路径有证据后，才讨论逐表收权。

## 7. 当前验证命令

```bash
cd bff
npm run typecheck

# 根目录构建与预览
cd ..
npm run build
npm run preview
```

线上验证至少覆盖：

- `/api/v1/healthz` 返回 200。
- 未登录访问 `/api/v1/me/*` 和 `/api/v1/questions/:id/judge` 返回 401。
- 内容读取默认没有答案和解析。
- 登录后判分能返回判定结果，并写入答题记录/错题本。
- 管理后台和社区仍然可用。

## 8. 关联文档

- 当前架构：[backend-architecture-redesign.md](backend-architecture-redesign.md)
- 技术事实：[.trae/documents/technical-architecture.md](.trae/documents/technical-architecture.md)
- 产品范围：[.trae/documents/prd.md](.trae/documents/prd.md)
- BFF 开发说明：[bff/README.md](bff/README.md)

旧版交接文档中的 Phase 1/Phase 2 状态、`functions/api/[[route]].ts` 路径和“前端尚未切换 BFF”的描述均已废弃。
