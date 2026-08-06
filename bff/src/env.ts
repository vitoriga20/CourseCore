// Cloudflare Workers 绑定 / 环境变量类型定义
// 与 wrangler.toml 中的 [vars] / 密钥 / kv_namespaces 保持一致

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CONTENT_CACHE_TTL?: string;
  RATE_LIMIT_KV?: KVNamespace;
};

// 统一的 API 响应外壳
export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};
