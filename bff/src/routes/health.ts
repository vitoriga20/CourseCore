import { Hono } from 'hono';

const health = new Hono();

health.get('/healthz', (c) => {
  return c.json({ status: 'ok', ts: new Date().toISOString() });
});

export { health };
