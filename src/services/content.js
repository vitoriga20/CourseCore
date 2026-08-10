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

// v2: 理论正文并入 items.content，例题为 questions 真实行（经 item_questions role='theory_example' 关联）
// 返回: { content, examples: Question[] } | null
export async function loadTheoryContent(itemId) {
  if (!supabase || !itemId) return null;
  const { data, error } = await supabase
    .from('items')
    .select('content')
    .eq('id', itemId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('loadTheoryContent failed', error);
    return null;
  }
  const content = data?.content ?? null;

  // v2: 例题经 item_questions(role='theory_example') join questions
  const { data: exLinks, error: exErr } = await supabase
    .from('item_questions')
    .select('order_index, questions(*)')
    .eq('item_id', itemId)
    .eq('role', 'theory_example')
    .order('order_index', { ascending: true });
  if (exErr) {
    console.error('loadTheoryExamples failed', exErr);
  }
  const examples = (exLinks || []).map(l => ({
    ...l.questions,
    order_index: l.order_index ?? 0,
    item_id: itemId,
  }));

  // v2: 图/表占位符内容（content_figures），前端按 [图N:名称]/[表N:名称] 替换展示（兼容旧数据）
  const { data: figures, error: figErr } = await supabase
    .from('content_figures')
    .select('placeholder, kind, alt, content')
    .eq('item_id', itemId);
  if (figErr) {
    console.error('loadContentFigures failed', figErr);
  }

  // 方案3: 全局资源库 content_assets，前端按 [图:asset_id]/[表:asset_id] 替换展示
  const { data: assets, error: assetErr } = await supabase
    .from('content_assets')
    .select('id, name, kind, alt, content')
    .order('name');
  if (assetErr) {
    console.error('loadContentAssets failed', assetErr);
  }

  return snakeToCamel({ content, examples, figures: figures || [], assets: assets || [] });
}

// v2: 训练题经 item_questions(role='practice') join questions
export async function loadQuestions(itemId) {
  if (!supabase || !itemId) return [];
  const { data, error } = await supabase
    .from('item_questions')
    .select('order_index, role, questions(*)')
    .eq('item_id', itemId)
    .order('order_index', { ascending: true });
  if (error) {
    console.error('loadQuestions failed', error);
    return [];
  }
  return snakeToCamel((data || []).map(l => ({
    ...l.questions,
    order_index: l.order_index ?? 0,
    role: l.role ?? 'practice',
    item_id: itemId,
  })));
}

// 运行时读取题的考点列表 (公开可读, 学生侧展示)
// v2: question_kp 已去 source 多态列, 单一 FK → questions.id
// 返回: [{ id, role, weight, kp: { id, code, name, courseId, itemId, source } }]
export async function loadQuestionKps(questionId) {
  if (!supabase || !questionId) return [];
  const { data, error } = await supabase
    .from('question_kp')
    .select('id, role, weight, knowledge_points(id, code, name, course_id, item_id, source)')
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
