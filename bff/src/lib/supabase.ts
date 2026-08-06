// 极简 PostgREST 客户端封装（基于 fetch，兼容 Cloudflare Workers 边缘运行时）
// 仅使用 service_role key，在服务端调用，RLS 被绕过——字段裁剪由本 BFF 控制。

export type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is';

export interface QueryOptions {
  select?: string;
  filters?: Record<string, [FilterOp, string | number | boolean]>;
  order?: string; // 例如 'created_at.desc'
  limit?: number;
  offset?: number;
  single?: boolean; // 期望单条，Accept: application/vnd.pgrst.object+json
}

export interface QueryResult<T> {
  data: T | null;
  total: number | null; // 来自 content-range 头，用于分页
}

function parseTotal(contentRange?: string | null): number | null {
  if (!contentRange) return null;
  const last = contentRange.split('/').pop();
  if (!last || last === '*') return null;
  const n = parseInt(last, 10);
  return Number.isNaN(n) ? null : n;
}

export class SupabaseRest {
  constructor(
    private base: string,
    private key: string,
  ) {}

  private buildUrl(table: string, q: QueryOptions): string {
    const u = new URL(`${this.base.replace(/\/$/, '')}/rest/v1/${table}`);
    u.searchParams.set('select', q.select ?? '*');
    if (q.filters) {
      for (const [col, [op, val]] of Object.entries(q.filters)) {
        u.searchParams.set(col, `${op}.${val}`);
      }
    }
    if (q.order) u.searchParams.set('order', q.order);
    if (q.limit != null) u.searchParams.set('limit', String(q.limit));
    if (q.offset != null) u.searchParams.set('offset', String(q.offset));
    return u.toString();
  }

  async query<T = unknown>(table: string, q: QueryOptions): Promise<QueryResult<T>> {
    const url = this.buildUrl(table, q);
    const headers: Record<string, string> = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };
    if (q.single) headers['Accept'] = 'application/vnd.pgrst.object+json';

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${table} ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as T;
    return { data, total: parseTotal(res.headers.get('content-range')) };
  }
}
