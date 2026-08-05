// 艾宾浩斯复习引擎（融合 Shiroha Quiz 精细模型）
// 核心: 答错→wrong_book, 答对→streak/stage提升, 连续2次或stage满→毕业
// 曲线: 经典[1,2,4,7,15]天5阶段 / 紧凑[1,2,4]天3阶段
// 重合: 切换曲线时stage保留, 若stage≥新曲线阶段数→毕业

import { supabase, isSupabaseConfigured } from './supabase.js';

// ============================================================
// 曲线定义
// ============================================================
export const CURVES = {
  classic: { intervals: [1, 2, 4, 7, 15], name: '经典', label: '1-2-4-7-15 天' },
  compact: { intervals: [1, 2, 4], name: '紧凑', label: '1-2-4 天' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getNextReviewAt(stage, curveType, baseTime = Date.now()) {
  const curve = CURVES[curveType] || CURVES.classic;
  const idx = Math.max(0, Math.min(stage, curve.intervals.length - 1));
  const days = curve.intervals[idx];
  return new Date(baseTime + days * DAY_MS).toISOString();
}

function isMastered(stage, streak, curveType) {
  const curve = CURVES[curveType] || CURVES.classic;
  return stage >= curve.intervals.length || streak >= 2;
}

// ============================================================
// 答错处理: addWrong
// ============================================================
export async function addWrong(userId, questionId, subjectId, userAnswer, curveType = 'classic') {
  if (!isSupabaseConfigured()) return null;

  const now = new Date().toISOString();
  const nextReviewAt = getNextReviewAt(0, curveType);

  // 查现有记录
  const { data: existing } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (existing) {
    // 更新: 错误次数++, 所有正确计数清零, 重置阶段
    const { data, error } = await supabase
      .from('wrong_book')
      .update({
        wrong_count: existing.wrong_count + 1,
        right_count: 0,
        streak_correct_count: 0,
        stage: 0,
        status: '未掌握',
        last_wrong_at: now,
        last_reviewed_at: now,
        next_review_at: nextReviewAt,
        last_answer: userAnswer,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) console.warn('[review-engine] addWrong update:', error);
    return data;
  }

  // 插入新记录
  const { data, error } = await supabase
    .from('wrong_book')
    .insert({
      user_id: userId,
      question_id: questionId,
      subject_id: subjectId,
      curve_type: curveType,
      stage: 0,
      wrong_count: 1,
      right_count: 0,
      streak_correct_count: 0,
      status: '未掌握',
      last_wrong_at: now,
      last_reviewed_at: now,
      next_review_at: nextReviewAt,
      last_answer: userAnswer,
    })
    .select()
    .single();
  if (error) console.warn('[review-engine] addWrong insert:', error);
  return data;
}

// ============================================================
// 答对处理: markRight
// ============================================================
export async function markRight(userId, questionId, userAnswer) {
  if (!isSupabaseConfigured()) return null;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  // 不在错题库: 答对的题不进库, 直接返回
  if (!existing) return null;

  const newStreak = existing.streak_correct_count + 1;
  const newStage = existing.stage + 1;
  const mastered = isMastered(newStage, newStreak, existing.curve_type);

  const update = {
    right_count: existing.right_count + 1,
    streak_correct_count: newStreak,
    stage: mastered ? Math.max(newStage, existing.stage) : newStage,
    status: mastered ? '已掌握' : '复习中',
    last_correct_at: now,
    last_reviewed_at: now,
    next_review_at: mastered ? null : getNextReviewAt(newStage, existing.curve_type),
    last_answer: userAnswer,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('wrong_book')
    .update(update)
    .eq('id', existing.id)
    .select()
    .single();
  if (error) console.warn('[review-engine] markRight:', error);
  return data;
}

// ============================================================
// 统一处理: processAnswer
// ============================================================
export async function processAnswer(userId, questionId, subjectId, isCorrect, userAnswer, curveType = 'classic') {
  if (isCorrect) {
    return markRight(userId, questionId, userAnswer);
  }
  return addWrong(userId, questionId, subjectId, userAnswer, curveType);
}

// ============================================================
// 重合算法: 切换曲线
// ============================================================
export async function switchCurve(userId, newCurveType) {
  if (!isSupabaseConfigured() || !CURVES[newCurveType]) return null;
  const curve = CURVES[newCurveType];
  const now = new Date().toISOString();

  // 读取该用户所有非已掌握的错题
  const { data: entries, error } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .neq('status', '已掌握');
  if (error) { console.warn('[review-engine] switchCurve select:', error); return null; }
  if (!entries || entries.length === 0) return { updated: 0 };

  let updated = 0;
  for (const entry of entries) {
    // 阶段截断: 若 stage >= 新曲线阶段数 → 毕业
    const mastered = entry.stage >= curve.intervals.length;
    const update = {
      curve_type: newCurveType,
      status: mastered ? '已掌握' : entry.status,
      next_review_at: mastered ? null : getNextReviewAt(entry.stage, newCurveType),
      updated_at: now,
    };
    const { error: e } = await supabase
      .from('wrong_book')
      .update(update)
      .eq('id', entry.id);
    if (!e) updated++;
  }
  return { updated, total: entries.length };
}

// ============================================================
// 查询: 复习队列
// ============================================================
export async function getReviewQueue(userId, subjectId = null) {
  if (!isSupabaseConfigured()) return [];
  let q = supabase
    .from('wrong_book')
    .select(`
      *,
      exam_questions!inner(id, question_type, title, content, options, answer, solution, tags)
    `)
    .eq('user_id', userId)
    .neq('status', '已掌握')
    .order('next_review_at', { ascending: true });
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q;
  if (error) { console.warn('[review-engine] getReviewQueue:', error); return []; }
  return data || [];
}

// ============================================================
// 查询: 今日复习
// ============================================================
export async function getTodayReview(userId) {
  if (!isSupabaseConfigured()) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('wrong_book')
    .select(`
      *,
      exam_questions!inner(id, question_type, title, content, options, answer, solution, tags)
    `)
    .eq('user_id', userId)
    .neq('status', '已掌握')
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });
  if (error) { console.warn('[review-engine] getTodayReview:', error); return []; }
  return data || [];
}

// ============================================================
// 查询: 统计（雷达图用）
// ============================================================
export async function getStats(userId, subjectId = null) {
  if (!isSupabaseConfigured()) return { byReason: {}, byTag: {} };
  let q = supabase
    .from('wrong_book')
    .select('reason, status, exam_questions(tags)')
    .eq('user_id', userId);
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q;
  if (error || !data) return { byReason: {}, byTag: {} };

  // 按错误原因统计
  const byReason = {};
  const REASONS = ['概念不清', '计算失误', '审题错误', '方法不熟', '时间不够'];
  REASONS.forEach(r => byReason[r] = 0);
  for (const e of data) {
    if (e.reason) byReason[e.reason] = (byReason[e.reason] || 0) + 1;
  }

  // 按考点统计（from exam_questions.tags）
  const byTag = {};
  for (const e of data) {
    const tags = e.exam_questions?.tags || [];
    for (const t of tags) {
      byTag[t] = (byTag[t] || 0) + 1;
    }
  }

  return { byReason, byTag, total: data.length };
}

// ============================================================
// 查询: 用户曲线配置
// ============================================================
export async function getUserCurve(userId) {
  if (!isSupabaseConfigured()) return 'classic';
  const { data } = await supabase
    .from('wrong_book')
    .select('curve_type')
    .eq('user_id', userId)
    .limit(1);
  return data && data.length > 0 ? data[0].curve_type : 'classic';
}

// ============================================================
// 删除已掌握（可选: 自动清理）
// ============================================================
export async function removeMastered(userId) {
  if (!isSupabaseConfigured()) return 0;
  const { data, error } = await supabase
    .from('wrong_book')
    .delete()
    .eq('user_id', userId)
    .eq('status', '已掌握')
    .select('id');
  if (error) { console.warn('[review-engine] removeMastered:', error); return 0; }
  return data ? data.length : 0;
}
