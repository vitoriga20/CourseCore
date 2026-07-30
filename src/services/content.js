import { supabase } from './supabase.js';

// 运行时内容读取（非管理员，仅查询）
// 用于开发环境或已接入 Supabase 的部署中，学生页能实时看到后台保存的最新内容

function snakeToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
    out[key] = snakeToCamel(v);
  }
  return out;
}

export async function loadTheoryContent(itemId) {
  if (!supabase || !itemId) return null;
  const { data, error } = await supabase
    .from('theory_contents')
    .select('*')
    .eq('item_id', itemId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('loadTheoryContent failed', error);
    return null;
  }
  return data ? snakeToCamel(data) : null;
}

export async function loadQuestions(itemId) {
  if (!supabase || !itemId) return [];
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('loadQuestions failed', error);
    return [];
  }
  return snakeToCamel(data || []);
}
