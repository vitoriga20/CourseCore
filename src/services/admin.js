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

// 注：DB 外键 ON DELETE CASCADE 会自动清理 modules/items/questions/theory_contents
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

// 注：DB 外键 ON DELETE CASCADE 会自动清理 items/questions/theory_contents

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

// 注：DB 外键 ON DELETE CASCADE 会自动清理 questions/theory_contents

// ─── Questions ───

export async function listQuestions(filters = {}) {
  if (!supabase) return [];
  let q = supabase.from('questions').select('*').order('id');
  if (filters.courseId) q = q.eq('course_id', filters.courseId);
  if (filters.itemId) q = q.eq('item_id', filters.itemId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createQuestion(question) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQuestion(id) {
  ensureAdmin();
  // 应用层清理 question_kp 关联 (questions.id 非 question_kp 外键, 不级联)
  const { error: kpErr } = await supabase
    .from('question_kp')
    .delete()
    .eq('source', 'platform')
    .eq('question_id', id);
  if (kpErr) throw kpErr;
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Theory Contents ───

export async function listTheoryContents() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('theory_contents')
    .select('*')
    .order('item_id');
  if (error) throw error;
  return data || [];
}

export async function getTheoryContent(itemId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('theory_contents')
    .select('*')
    .eq('item_id', itemId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function updateTheoryContent(itemId, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('theory_contents')
    .update(updates)
    .eq('item_id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertTheoryContent(record) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('theory_contents')
    .upsert(record, { onConflict: 'item_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
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

// ─── Exam Questions ───

export async function listExamQuestions(examId) {
  if (!supabase) return [];
  let q = supabase.from('exam_questions').select('*').order('order_index');
  if (examId) q = q.eq('exam_id', examId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createExamQuestion(question) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_questions')
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExamQuestion(id, updates) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('exam_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExamQuestion(id) {
  ensureAdmin();
  // 应用层清理 question_kp 关联 (questions.id 非 question_kp 外键, 不级联)
  const { error: kpErr } = await supabase
    .from('question_kp')
    .delete()
    .eq('source', 'exam')
    .eq('question_id', id);
  if (kpErr) throw kpErr;
  const { error } = await supabase.from('exam_questions').delete().eq('id', id);
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

// 取题的考点列表 (含 kp 详情)
// source: 'platform' | 'exam'
export async function listQuestionKps(source, questionId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('question_kp')
    .select('id, source, question_id, kp_id, role, weight, created_at, knowledge_points(id, code, name, course_id, item_id, source)')
    .eq('source', source)
    .eq('question_id', questionId);
  if (error) throw error;
  return data || [];
}

// 替换题的全部考点 (主+次)
// kps: [{ kp_id, role, weight }] — role='primary' 至多 1 个
export async function replaceQuestionKps(source, questionId, kps) {
  ensureAdmin();
  // 删旧
  const { error: delErr } = await supabase
    .from('question_kp')
    .delete()
    .eq('source', source)
    .eq('question_id', questionId);
  if (delErr) throw delErr;
  // 插新
  if (!kps || kps.length === 0) return [];
  const rows = kps.map(k => ({
    source,
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

export async function addQuestionKp(source, questionId, kpId, role, weight) {
  ensureAdmin();
  const { data, error } = await supabase
    .from('question_kp')
    .insert({
      source,
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

export async function removeQuestionKp(source, questionId, kpId) {
  ensureAdmin();
  const { error } = await supabase
    .from('question_kp')
    .delete()
    .eq('source', source)
    .eq('question_id', questionId)
    .eq('kp_id', kpId);
  if (error) throw error;
}
