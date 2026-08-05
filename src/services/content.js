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

// 运行时读取题的考点列表 (公开可读, 学生侧展示)
// source: 'platform' | 'exam'
// 返回: [{ id, role, weight, kp: { id, code, name, courseId, itemId, source } }]
export async function loadQuestionKps(source, questionId) {
  if (!supabase || !questionId) return [];
  const { data, error } = await supabase
    .from('question_kp')
    .select('id, role, weight, knowledge_points(id, code, name, course_id, item_id, source)')
    .eq('source', source)
    .eq('question_id', questionId);
  if (error) {
    console.error('loadQuestionKps failed', error);
    return [];
  }
  return (data || []).map(row => {
    const kp = Array.isArray(row.knowledge_points) ? row.knowledge_points[0] : row.knowledge_points;
    return {
      id: row.id,
      role: row.role,
      weight: row.weight,
      kp: kp ? snakeToCamel(kp) : null
    };
  });
}
