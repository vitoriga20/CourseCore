// BFF API 客户端：统一封装 auth header + GET/POST/PATCH/DELETE
// 所有请求自动附带 Supabase session JWT（如果已登录）
// 返回 Promise，失败抛错（调用方自行 fallback）

import { supabase } from './supabase.js';
import { getAuthHeader } from './auth-header.js';

async function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const auth = await getAuthHeader(supabase?.auth);
  if (auth) headers['Authorization'] = auth;
  return headers;
}

async function request(path, options = {}) {
  const url = `/api/v1${path}`;
  const headers = await buildHeaders(options.headers || {});
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`API ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

export function apiGet(path, params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const query = qs.toString();
  return request(`${path}${query ? `?${query}` : ''}`);
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

export function apiFallbackOn401(promise, fallbackFn) {
  return promise.catch((e) => {
    if (e?.status === 401) return fallbackFn();
    throw e;
  });
}
