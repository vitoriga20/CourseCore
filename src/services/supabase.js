import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL || '';
// 兼容两种前端公开 Key 命名：Supabase 旧文档叫 anon key，新控制台叫 publishable key。
// 两者等价（都是浏览器公开的 RLS 受限 key），任意一个配置了都能 work。
const key =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export function isSupabaseConfigured() {
  return Boolean(url && key);
}

export const supabase = isSupabaseConfigured()
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cc-supabase-auth',
        storage: localStorage
      }
    })
  : null;
