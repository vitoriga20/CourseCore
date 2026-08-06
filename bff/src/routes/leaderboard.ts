import { Hono } from 'hono';
import type { Bindings } from '../env';

const leaderboard = new Hono<{ Bindings: Bindings }>();

// GET /api/v1/leaderboard — 排行榜（调用现有 RPC）
leaderboard.get('/', async (c) => {
  try {
    const sbUrl = c.env.SUPABASE_URL.replace(/\/$/, '');
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '10', 10) || 10));

    // 现有 RPC `get_leaderboard` 为无参函数，返回整表，服务端按 limit 截取。
    const res = await fetch(`${sbUrl}/rest/v1/rpc/get_leaderboard`, {
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return c.json({ error: 'leaderboard rpc failed', detail: body.slice(0, 300), code: 'UPSTREAM_ERROR' }, 502);
    }
    const data = await res.json();
    return c.json({ data: Array.isArray(data) ? data.slice(0, limit) : [] });
  } catch (e: any) {
    return c.json({ error: e?.message || 'leaderboard failed', code: 'UPSTREAM_ERROR' }, 502);
  }
});

export { leaderboard };