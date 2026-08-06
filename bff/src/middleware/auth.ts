import type { Context, Next } from 'hono';
import type { Bindings } from '../env';

export interface AuthedUser {
  id: string;
  email?: string;
  role?: string;
}

export type AuthedContext = Context<{ Bindings: Bindings; Variables: { user: AuthedUser } }>;

export async function verifyAuth(c: AuthedContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header', code: 'UNAUTHENTICATED' }, 401);
  }

  const token = authHeader.slice(7);
  const sbUrl = c.env.SUPABASE_URL.replace(/\/$/, '');

  const res = await fetch(`${sbUrl}/auth/v1/user`, {
    headers: {
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return c.json({ error: 'Invalid or expired token', detail: body.slice(0, 200), code: 'UNAUTHENTICATED' }, 401);
  }

  const userData = (await res.json()) as any;
  const user: AuthedUser = {
    id: userData.id as string,
    email: userData.email as string | undefined,
    role: userData.role as string | undefined,
  };

  c.set('user', user);
  await next();
}

export function optionalAuth(c: AuthedContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyAuth(c, next);
  }
  c.set('user', { id: '', role: 'anon' });
  return next();
}

export function requireRole(role: string) {
  return async (c: AuthedContext, next: Next) => {
    const user = c.get('user');
    if (!user?.id) return c.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, 401);
    if (user.role !== role) return c.json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    await next();
  };
}