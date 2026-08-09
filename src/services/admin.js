import { supabase } from './supabase.js';
import { isAdmin } from './auth.js';

function ensureAdmin() {
  if (!supabase) throw new Error('Supabase 未配置');
  if (!isAdmin()) throw new Error('无管理员权限');
}

// ─── Users ───

export async function listUsers() {
  ensureAdmin();
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(userId, role) {
  ensureAdmin();
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateUserProfileAdmin(userId, updates) {
  ensureAdmin();
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// ─── Courses ───

export async function listCourses() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function createCourse(course) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCourse(id) {
  ensureAdmin();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

// 注：DB 外键 ON DELETE CASCADE 会自动清理 modules/items/questions
// 见 scripts/supabase-schema.sql 第 13 节说明。

// ─── Modules ───

export async function listModules(courseId) {
  if (!supabase) return [];
  let q = supabase.from('modules').select('*').order('order_index');
  if (courseId) q = q.eq('course_id', courseId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createModule(mod) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('modules')
    .insert(mod)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateModule(courseId, moduleId, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('course_id', courseId)
    .eq('module_id', moduleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteModule(courseId, moduleId) {
  ensureAdmin();
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('course_id', courseId)
    .eq('module_id', moduleId);
  if (error) throw error;
}

// 注：DB 外键 ON DELETE CASCADE 会自动清理 items/questions

// ─── Items ───

export async function listItems(courseId) {
  if (!supabase) return [];
  let q = supabase.from('items').select('*').order('order_index');
  if (courseId) q = q.eq('course_id', courseId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createItem(item) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  ensureAdmin();
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

// 注：DB 外键 ON DELETE CASCADE 会自动清理 questions

// ─── Questions ───

// 统一题库：questions 只存题目本体，上下文由关联表表达
// filters.itemId → 经 item_questions(role='practice') 关联取某小节的训练题
export async function listQuestions(filters = {}) {
  if (!supabase) return [];
  let q;
  if (filters.itemId) {
    q = supabase
      .from('item_questions')
      .select('questions(*)')
      .eq('item_id', filters.itemId)
      .eq('role', 'practice')
      .order('order_index');
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(l => l.questions).filter(Boolean);
  }
  q = supabase.from('questions').select('*').order('id');
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// 只建题目本体；如需挂到小节，请另行调用 linkItemQuestion
export async function createQuestion(question) {
  ensureAdmin();
  const { item_id, course_id, module_id, ...body } = question;
  const { data, error } = await supabase
    .from('questions')
    .insert(body)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, updates) {
  ensureAdmin();
  const { item_id, course_id, module_id, ...body } = updates;
  const { data, error } = await supabase
    .from('questions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 删除题目：question_kp / item_questions / exam_paper_questions 均由 DB 外键级联清理
export async function deleteQuestion(id) {
  ensureAdmin();
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// 解除题目与某小节的关联（不删 questions 本体，题目可能被试卷/他小节复用）
export async function removeItemQuestion(itemId, questionId, role) {
  ensureAdmin();
  const { error } = await supabase
    .from('item_questions')
    .delete()
    .eq('item_id', itemId)
    .eq('question_id', questionId)
    .eq('role', role);
  if (error) throw error;
}

// 建立题目与某小节的关联（role: 'practice' | 'theory_example'）
export async function linkItemQuestion(itemId, questionId, role, orderIndex = 0) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('item_questions')
    .upsert({ item_id: itemId, question_id: questionId, role, order_index: orderIndex }, { onConflict: 'item_id,question_id,role' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Theory Contents（并入 items.content + item_questions(role='theory_example')）───

// 旧数据兼容：把内联例题对象转成 questions 行字段
function exampleToQuestion(itemId, idx, ex) {
  return {
    id: ex.id || `${itemId}-ex${idx}`,
    question_type: 0, // 例题统一单选
    content: ex.text || '',
    image: ex.image || '',
    options: ex.options && Array.isArray(ex.options) ? ex.options.slice(0, 4) : ['', '', '', ''],
    answer: ex.answer != null ? String(ex.answer) : '0',
    solution: ex.solution || '',
    difficulty: 1
  };
}

// 读小节理论内容 + 例题（例题为真实 questions 行，带 id）
export async function getItemContent(itemId) {
  if (!supabase) return null;
  const itemRes = await supabase.from('items').select('*').eq('id', itemId).single();
  if (itemRes.error && itemRes.error.code !== 'PGRST116') throw itemRes.error;
  const item = itemRes.data || null;
  const linkRes = await supabase
    .from('item_questions')
    .select('questions(*)')
    .eq('item_id', itemId)
    .eq('role', 'theory_example')
    .order('order_index');
  if (linkRes.error) throw linkRes.error;
  const examples = (linkRes.data || []).map(l => l.questions).filter(Boolean);
  return { content: item ? (item.content || '') : '', examples };
}

// 批量读全部小节的 theory_example 关联，供内容树一次性展示例题数
// 返回 Map: itemId -> [question, ...]
export async function listItemTheoryExamples() {
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from('item_questions')
    .select('item_id, questions(*)')
    .eq('role', 'theory_example')
    .order('order_index');
  if (error) throw error;
  const map = new Map();
  (data || []).forEach(l => {
    if (!l.questions) return;
    if (!map.has(l.item_id)) map.set(l.item_id, []);
    map.get(l.item_id).push(l.questions);
  });
  return map;
}

// 保存小节理论内容 + 例题（差量同步 questions 与 item_questions 关联）
export async function saveTheoryContent({ itemId, content, examples }) {
  ensureAdmin();
  // 1. 正文写入 items.content
  await supabase.from('items').update({ content: content || '' }).eq('id', itemId);
  // 2. 读现有 theory_example 关联
  const linkRes = await supabase
    .from('item_questions')
    .select('question_id')
    .eq('item_id', itemId)
    .eq('role', 'theory_example');
  if (linkRes.error) throw linkRes.error;
  const existingIds = (linkRes.data || []).map(l => l.question_id);
  const keepIds = new Set();
  const list = Array.isArray(examples) ? examples : [];
  for (let i = 0; i < list.length; i++) {
    const ex = list[i] || {};
    const qid = ex.id;
    if (qid) {
      // 更新已有例题
      const { label, ...body } = exampleToQuestion(itemId, i, ex);
      await supabase.from('questions').update({ ...body, updated_at: new Date().toISOString() }).eq('id', qid);
      keepIds.add(qid);
    } else {
      // 新建例题题行 + 关联
      const row = exampleToQuestion(itemId, i, ex);
      const ins = await supabase.from('questions').insert(row).select().single();
      if (ins.error) throw ins.error;
      keepIds.add(ins.data.id);
      await supabase
        .from('item_questions')
        .upsert({ item_id: itemId, question_id: ins.data.id, role: 'theory_example', order_index: i }, { onConflict: 'item_id,question_id,role' });
    }
  }
  // 3. 删除不再使用的例题关联（不删 questions，可能被复用）
  for (const qid of existingIds) {
    if (!keepIds.has(qid)) {
      await supabase
        .from('item_questions')
        .delete()
        .eq('item_id', itemId)
        .eq('question_id', qid)
        .eq('role', 'theory_example');
    }
  }
}

// ─── Exam Papers ───

export async function listExamPapers() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exam_papers')
    .select('*')
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function createExamPaper(paper) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_papers')
    .insert(paper)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExamPaper(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_papers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExamPaper(id) {
  ensureAdmin();
  const { error } = await supabase.from('exam_papers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Exam Sections ───

export async function listExamSections(examId) {
  if (!supabase) return [];
  let q = supabase.from('exam_sections').select('*').order('order_index');
  if (examId) q = q.eq('exam_id', examId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createExamSection(section) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_sections')
    .insert(section)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExamSection(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_sections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExamSection(id) {
  ensureAdmin();
  const { error } = await supabase.from('exam_sections').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteUser(userId) {
  ensureAdmin();
  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
  if (error) throw error;
}

// ─── Exam Questions（复用统一题库，经 exam_paper_questions 关联）───

// 试卷题的顺序由「大题顺序 + 大题内题目顺序」共同决定。新编辑器创建的无大题题目
// 则仅按自身 order_index 排列；两种数据混用时，保留有大题归属的原试卷题目在前。
export function sortExamQuestionLinks(links) {
  const indexOf = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const orderKeyOf = link => {
    const section = link.exam_sections;
    if (section && Number.isFinite(Number(section.order_index))) {
      return { group: 0, section: Number(section.order_index), question: indexOf(link.order_index) };
    }

    // 旧试卷题目的 ID 形如 q-<paper>-s<大题序号>-<题号>。当迁移数据缺少
    // section 关联时，仍可据此恢复原试卷顺序，避免各大题的第 1 题交错显示。
    const legacyMatch = String(link.question_id || '').match(/-s(\d+)-(\d+)$/);
    if (legacyMatch) {
      return { group: 0, section: Number(legacyMatch[1]), question: Number(legacyMatch[2]) };
    }

    return { group: 1, section: 0, question: indexOf(link.order_index) };
  };

  return [...links].sort((a, b) => {
    const orderA = orderKeyOf(a);
    const orderB = orderKeyOf(b);
    if (orderA.group !== orderB.group) return orderA.group - orderB.group;
    if (orderA.section !== orderB.section) return orderA.section - orderB.section;
    if (orderA.question !== orderB.question) return orderA.question - orderB.question;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

// 返回试卷的所有题（含内嵌 question_id 与题目本体）
export async function listExamQuestions(examId) {
  if (!supabase) return [];
  let q = supabase
    .from('exam_paper_questions')
    .select('id, exam_id, section_id, question_id, score, order_index, exam_sections(order_index), questions(*)')
    .order('order_index');
  if (examId) q = q.eq('exam_id', examId);
  const { data, error } = await q;
  if (error) throw error;
  // 展平：关联行 + 内嵌题目，保证 relation id（用于删除/排序）与 question_id 并存
  return sortExamQuestionLinks(data || []).map(l => ({
    id: l.id,
    section_id: l.section_id,
    question_id: l.question_id,
    score: l.score,
    order_index: l.order_index,
    exam_id: l.exam_id,
    ...(l.questions || {})
  }));
}

// 保存试卷中的一道题：新题建 questions，已有题更新；再 upsert exam_paper_questions 关联
// question: questions 对象（新题含内容不含 id；复用题库题含 id）
export async function saveExamQuestion({ examId, sectionId, question, score, orderIndex }) {
  ensureAdmin();
  let questionId = question && question.id;
  const { label, id, ...body } = question || {};
  if (questionId) {
    // 已有题目（含从题库复用）→ 更新本体（改一处处处生效）
    await supabase.from('questions').update({ ...body, updated_at: new Date().toISOString() }).eq('id', questionId);
  } else {
    // 新题 → 落统一题库
    questionId = `peq${examId}-${orderIndex}-${Date.now().toString(36)}`;
    const ins = await supabase.from('questions').insert({ ...body, id: questionId, question_type: Number(body.question_type) || 0 }).select().single();
    if (ins.error) throw ins.error;
  }
  // upsert 关联：按 (exam_id, question_id) 唯一
  const { data, error } = await supabase
    .from('exam_paper_questions')
    .upsert(
      { exam_id: examId, section_id: sectionId || null, question_id: questionId, score: score || 5, order_index: orderIndex || 0 },
      { onConflict: 'exam_id, question_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return { linkId: data.id, questionId };
}

// 从试卷移除某题关联（不删 questions，题目可能被他卷/小节复用）
export async function removeExamQuestion(linkId) {
  ensureAdmin();
  const { error } = await supabase.from('exam_paper_questions').delete().eq('id', linkId);
  if (error) throw error;
}

// ─── Knowledge Points (考点字典) ───

export async function listKnowledgePoints(filters = {}) {
  if (!supabase) return [];
  let q = supabase.from('knowledge_points').select('*').order('sort_order');
  if (filters.courseId) q = q.eq('course_id', filters.courseId);
  if (filters.itemId) q = q.eq('item_id', filters.itemId);
  if (filters.source) q = q.eq('source', filters.source);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createKnowledgePoint(kp) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('knowledge_points')
    .insert({ ...kp, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgePoint(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('knowledge_points')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteKnowledgePoint(id) {
  ensureAdmin();
  // question_kp.kp_id 外键 ON DELETE CASCADE, DB 自动清理关联
  const { error } = await supabase.from('knowledge_points').delete().eq('id', id);
  if (error) throw error;
}

// ─── Question-KP 关联 (主/次考点) ───

// 取题的考点列表 (含 kp 详情)；question_kp 已去多态 source，单一 FK → questions.id
export async function listQuestionKps(questionId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('question_kp')
    .select('id, question_id, kp_id, role, weight, created_at, knowledge_points(id, code, name, course_id, item_id, source)')
    .eq('question_id', questionId);
  if (error) throw error;
  return data || [];
}

// 替换题的全部考点 (主+次)
// kps: [{ kp_id, role, weight }] — role='primary' 至多 1 个
export async function replaceQuestionKps(questionId, kps) {
  ensureAdmin();
  // 删旧
  const { error: delErr } = await supabase
    .from('question_kp')
    .delete()
    .eq('question_id', questionId);
  if (delErr) throw delErr;
  // 插新
  if (!kps || kps.length === 0) return [];
  const rows = kps.map(k => ({
    question_id: questionId,
    kp_id: k.kp_id,
    role: k.role,
    weight: k.role === 'primary' ? 1.0 : (k.weight ?? 0.5)
  }));
  const { data, error } = await supabase
    .from('question_kp')
    .insert(rows)
    .select();
  if (error) throw error;
  return data || [];
}

export async function addQuestionKp(questionId, kpId, role, weight) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('question_kp')
    .insert({
      question_id: questionId,
      kp_id: kpId,
      role,
      weight: role === 'primary' ? 1.0 : (weight ?? 0.5)
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeQuestionKp(questionId, kpId) {
  ensureAdmin();
  const { error } = await supabase
    .from('question_kp')
    .delete()
    .eq('question_id', questionId)
    .eq('kp_id', kpId);
  if (error) throw error;
}
