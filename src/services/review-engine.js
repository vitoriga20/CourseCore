import { supabase, isSupabaseConfigured } from './supabase.js';
import { apiGet, apiPost, apiDelete } from './apiClient.js';

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

// Phase 2: 服务端判分 — 调 BFF /api/v1/questions/:id/judge
// BFF 负责: 判分 + 写答题记录 + 错题本更新 + 按 answer_reveal 规则返回答案
// 失败时回退到本地判分 + Supabase 直写
export async function judgeAnswer(userId, questionId, userAnswer, subjectId, curveType = 'classic') {
  try {
    const { data } = await apiPost(`/questions/${questionId}/judge`, {
      user_answer: userAnswer,
      subject_id: subjectId,
      curve_type: curveType,
    });
    return {
      is_correct: data.is_correct,
      answer: data.answer,
      answers: data.answers,
      solution: data.solution,
      tolerance: data.tolerance,
      unit: data.unit,
      fromBFF: true,
    };
  } catch (e) {
    return null;
  }
}

async function fallbackAddWrong(userId, questionId, subjectId, userAnswer, curveType = 'classic') {
  if (!isSupabaseConfigured()) return null;
  const now = new Date().toISOString();
  const nextReviewAt = getNextReviewAt(0, curveType);

  const { data: existing } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (existing) {
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

async function fallbackMarkRight(userId, questionId, userAnswer) {
  if (!isSupabaseConfigured()) return null;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

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

export async function addWrong(userId, questionId, subjectId, userAnswer, curveType = 'classic') {
  return fallbackAddWrong(userId, questionId, subjectId, userAnswer, curveType);
}

export async function markRight(userId, questionId, userAnswer) {
  return fallbackMarkRight(userId, questionId, userAnswer);
}

export async function processAnswer(userId, questionId, subjectId, isCorrect, userAnswer, curveType = 'classic') {
  const serverResult = await judgeAnswer(userId, questionId, userAnswer, subjectId, curveType);
  if (serverResult) return serverResult;

  if (isCorrect) {
    return markRight(userId, questionId, userAnswer);
  }
  return addWrong(userId, questionId, subjectId, userAnswer, curveType);
}

export async function switchCurve(userId, newCurveType) {
  if (!isSupabaseConfigured() || !CURVES[newCurveType]) return null;
  const curve = CURVES[newCurveType];
  const now = new Date().toISOString();

  const { data: entries, error } = await supabase
    .from('wrong_book')
    .select('*')
    .eq('user_id', userId)
    .neq('status', '已掌握');
  if (error) { console.warn('[review-engine] switchCurve select:', error); return null; }
  if (!entries || entries.length === 0) return { updated: 0 };

  let updated = 0;
  for (const entry of entries) {
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

export async function getReviewQueue(userId, subjectId = null) {
  try {
    const params = { includeQuestion: 'true' };
    if (subjectId) params.subjectId = subjectId;
    const { data } = await apiGet('/me/wrong-book', params);
    return data || [];
  } catch {
    if (!isSupabaseConfigured()) return [];
    let q = supabase
      .from('wrong_book')
      .select(`*,questions!inner(id,question_type,title,content,options,answer,solution,tags)`)
      .eq('user_id', userId)
      .neq('status', '已掌握')
      .order('next_review_at', { ascending: true });
    if (subjectId) q = q.eq('subject_id', subjectId);
    const { data, error } = await q;
    if (error) { console.warn('[review-engine] getReviewQueue:', error); return []; }
    return data || [];
  }
}

export async function getTodayReview(userId) {
  try {
    const { data } = await apiGet('/me/wrong-book', { includeQuestion: 'true' });
    if (!data) return [];
    const now = new Date().toISOString();
    return data.filter((e) => e.status !== '已掌握' && e.next_review_at && e.next_review_at <= now);
  } catch {
    if (!isSupabaseConfigured()) return [];
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('wrong_book')
      .select(`*,questions!inner(id,question_type,title,content,options,answer,solution,tags)`)
      .eq('user_id', userId)
      .neq('status', '已掌握')
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });
    if (error) { console.warn('[review-engine] getTodayReview:', error); return []; }
    return data || [];
  }
}

export async function getStats(userId, subjectId = null) {
  try {
    const { data } = await apiGet('/me/wrong-book', { includeQuestion: 'false' });
    if (!data) return { byReason: {}, byTag: {} };
    const byReason = {};
    const REASONS = ['概念不清', '计算失误', '审题错误', '方法不熟', '时间不够'];
    REASONS.forEach(r => byReason[r] = 0);
    for (const e of data) {
      if (e.reason) byReason[e.reason] = (byReason[e.reason] || 0) + 1;
    }
    return { byReason, byTag: {}, total: data.length };
  } catch {
    if (!isSupabaseConfigured()) return { byReason: {}, byTag: {} };
    let q = supabase
      .from('wrong_book')
      .select('reason, status, questions(tags)')
      .eq('user_id', userId);
    if (subjectId) q = q.eq('subject_id', subjectId);
    const { data, error } = await q;
    if (error || !data) return { byReason: {}, byTag: {} };

    const byReason = {};
    const REASONS = ['概念不清', '计算失误', '审题错误', '方法不熟', '时间不够'];
    REASONS.forEach(r => byReason[r] = 0);
    for (const e of data) {
      if (e.reason) byReason[e.reason] = (byReason[e.reason] || 0) + 1;
    }

    const byTag = {};
    for (const e of data) {
      const tags = e.questions?.tags || [];
      for (const t of tags) {
        byTag[t] = (byTag[t] || 0) + 1;
      }
    }
    return { byReason, byTag, total: data.length };
  }
}

export async function getUserCurve(userId) {
  try {
    const { data } = await apiGet('/me/wrong-book', { includeQuestion: 'false' });
    if (data && data.length > 0) return data[0].curve_type;
    return 'classic';
  } catch {
    if (!isSupabaseConfigured()) return 'classic';
    const { data } = await supabase
      .from('wrong_book')
      .select('curve_type')
      .eq('user_id', userId)
      .limit(1);
    return data && data.length > 0 ? data[0].curve_type : 'classic';
  }
}

export async function removeMastered(userId) {
  try {
    const { data } = await apiGet('/me/wrong-book', { includeQuestion: 'false' });
    if (!data) return 0;
    const mastered = data.filter((e) => e.status === '已掌握');
    for (const e of mastered) {
      await apiDelete(`/me/wrong-book/${e.id}`);
    }
    return mastered.length;
  } catch {
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
}
