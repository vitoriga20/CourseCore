import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './env';
import { securityHeaders } from './middleware/security';
import { cacheMiddleware } from './middleware/cache';
import { rateLimit } from './middleware/rateLimit';
import { health } from './routes/health';
import { content } from './routes/content';
import { user } from './routes/user';
import { judge } from './routes/judge';
import { leaderboard } from './routes/leaderboard';

// 共享 Hono app：同时供两种部署形态复用
//   - Cloudflare Workers：bff/src/index.ts 直接 export default app
//   - Cloudflare Pages Functions：functions/api/[[route]].ts 用 handle(app) 包裹
// 业务逻辑只写一份，不在两处重复。
const app = new Hono<{ Bindings: Bindings }>();

// 1) 全局安全头（JSON API 可用极严格 CSP）
app.use('*', securityHeaders());

// 2) CORS：独立 Worker 跨域部署下必需；同域 Pages 部署下无害，浏览器忽略多余头
app.use(
  '/api/*',
  cors({
    origin: '*', // 生产可收紧为具体域名
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// 3) 限流（依赖 KV，未绑定则优雅降级，由边缘 WAF 兜底）
app.use('/api/v1/*', rateLimit({ limit: 120, windowSec: 60 }));

// 4) 边缘缓存（只读 Content API，TTL 取自环境变量，默认 300s）
app.use('/api/v1/*', async (c, next) => {
  const ttl = parseInt(c.env.CONTENT_CACHE_TTL || '300', 10) || 300;
  return cacheMiddleware({ ttl })(c, next);
});

// 5) 路由
app.route('/api/v1', health);
app.route('/api/v1', content);
app.route('/api/v1/me', user);
app.route('/api/v1', judge);
app.route('/api/v1/leaderboard', leaderboard);

// 兜底 404
app.notFound((c) => c.json({ error: 'Not Found', code: 'NOT_FOUND' }, 404));

// 兜底错误
app.onError((err, c) => {
  console.error('[bff] unhandled', err);
  return c.json({ error: 'Internal Server Error', code: 'INTERNAL' }, 500);
});

export { app };
