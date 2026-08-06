import { onRequest } from '../functions/api/[[route]].js';

globalThis.caches = {
  default: {
    match: async () => undefined,
    put: async () => {},
  },
};

const env = {
  SUPABASE_URL: 'https://npmfeeeyeuienekezmil.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SB_SERVICE_KEY || '',
  CONTENT_CACHE_TTL: '300',
};

const ctx = {
  env,
  executionCtx: { waitUntil: () => {} },
  request: new Request('http://localhost/api/v1/papers?pageSize=1'),
};

try {
  const res = await onRequest(ctx);
  const body = await res.text();
  console.log('STATUS', res.status);
  console.log('BODY', body);
} catch (e) {
  console.error('HANDLER_ERR', e);
  process.exit(1);
}