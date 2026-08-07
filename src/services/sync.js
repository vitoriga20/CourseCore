import { supabase } from './supabase.js';
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient.js';
import { findQuestion } from '../utils/question.js';

function getItemIdForQuestion(questionId) {
  const q = findQuestion(questionId);
  return q?.itemId || null;
}

async function fallbackPushAnswer(userId, questionId, itemId, answer, isCorrect) {
  if (!supabase) return;
  const { error } = await supabase.from('answers').insert({
    user_id: userId,
    item_id: itemId,
    question_id: questionId,
    answer: answer ?? null,
    is_correct: isCorrect,
  });
  if (error) throw error;
}

async function fallbackPushItemProgress(userId, itemId, status, score) {
  if (!supabase) return;
  const { error } = await supabase.from('progress').upsert(
    {
      user_id: userId,
      item_id: itemId,
      status,
      score: score ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: ['user_id', 'item_id'] },
  );
  if (error) throw error;
}

async function fallbackPullProgress(userId) {
  if (!supabase) return { answers: [], progress: [] };
  const [{ data: answers, error: answersError }, { data: progress, error: progressError }] = await Promise.all([
    supabase.from('answers').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('progress').select('*').eq('user_id', userId),
  ]);
  if (answersError) throw answersError;
  if (progressError) throw progressError;
  return { answers: answers || [], progress: progress || [] };
}

export async function pushAnswer(userId, questionId, itemId, answer, isCorrect) {
  try {
    await apiPost('/me/progress', {
      answer_records: [{ item_id: itemId, question_id: questionId, answer, is_correct: isCorrect }],
      progress_updates: [],
    });
  } catch {
    return fallbackPushAnswer(userId, questionId, itemId, answer, isCorrect);
  }
}

export async function pushItemProgress(userId, itemId, status, score) {
  try {
    await apiPost('/me/progress', {
      answer_records: [],
      progress_updates: [{ item_id: itemId, status, score }],
    });
  } catch {
    return fallbackPushItemProgress(userId, itemId, status, score);
  }
}

export async function pullProgress(userId) {
  try {
    const { data } = await apiGet('/me/progress');
    return data || { answers: [], progress: [] };
  } catch {
    return fallbackPullProgress(userId);
  }
}

export async function mergeAndPushLocal(userId, localProgress, localCompleted, remoteAnswers, remoteProgress) {
  if (!supabase) {
    return { progress: localProgress || {}, completedQuestions: localCompleted || {} };
  }

  const latestRemoteByQid = {};
  for (const a of remoteAnswers || []) {
    const existing = latestRemoteByQid[a.question_id];
    if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
      latestRemoteByQid[a.question_id] = a;
    }
  }

  const answersToInsert = [];
  for (const [qid, record] of Object.entries(localCompleted || {})) {
    const remote = latestRemoteByQid[qid];
    const localAt = record.lastAt || 0;
    if (!remote || localAt > new Date(remote.created_at).getTime()) {
      answersToInsert.push({
        user_id: userId,
        item_id: getItemIdForQuestion(qid),
        question_id: qid,
        answer: record.lastAnswer ?? null,
        is_correct: record.passed ?? null,
      });
    }
  }

  const progressToUpsert = [];
  for (const [itemId, done] of Object.entries(localProgress || {})) {
    if (!done) continue;
    const remote = (remoteProgress || []).find((p) => p.item_id === itemId);
    if (!remote) {
      progressToUpsert.push({ user_id: userId, item_id: itemId, status: 'completed' });
    }
  }

  const mergedCompleted = { ...(localCompleted || {}) };
  for (const a of remoteAnswers || []) {
    const qid = a.question_id;
    const remoteAt = new Date(a.created_at).getTime();
    const local = mergedCompleted[qid];
    if (!local || remoteAt > (local.lastAt || 0)) {
      mergedCompleted[qid] = {
        passed: a.is_correct,
        attempts: (local?.attempts || 0) + 1,
        lastAnswer: a.answer ?? null,
        lastAt: remoteAt,
      };
    }
  }

  const mergedProgress = { ...(localProgress || {}) };
  for (const p of remoteProgress || []) {
    if (p.status === 'completed') mergedProgress[p.item_id] = true;
  }

  try {
    await apiPost('/me/progress', {
      answer_records: answersToInsert,
      progress_updates: progressToUpsert,
    });
  } catch {
    if (answersToInsert.length > 0) {
      await supabase.from('answers').insert(answersToInsert);
    }
    if (progressToUpsert.length > 0) {
      await supabase.from('progress').upsert(progressToUpsert, { onConflict: ['user_id', 'item_id'] });
    }
  }

  return { progress: mergedProgress, completedQuestions: mergedCompleted };
}

export async function addWrong(userId, questionId, subjectId, userAnswer, curveType = 'classic') {
  try {
    const { data } = await apiPost('/me/wrong-book', {
      question_id: questionId,
      subject_id: subjectId,
      curve_type: curveType,
      last_answer: userAnswer,
    });
    return data;
  } catch {
    return null;
  }
}

export async function markRight(userId, questionId, userAnswer) {
  try {
    const { data: wbList } = await apiGet('/me/wrong-book', { includeQuestion: 'false' });
    const entry = (wbList || []).find((w) => w.question_id === questionId);
    if (!entry) return null;
    const { data } = await apiPatch(`/me/wrong-book/${entry.id}`, { is_correct: true, last_answer: userAnswer });
    return data;
  } catch {
    return null;
  }
}

export async function markWrong(userId, questionId, userAnswer, reason) {
  try {
    const { data: wbList } = await apiGet('/me/wrong-book', { includeQuestion: 'false' });
    const entry = (wbList || []).find((w) => w.question_id === questionId);
    if (!entry) {
      const { data } = await apiPost('/me/wrong-book', { question_id: questionId, last_answer: userAnswer });
      return data;
    }
    const { data } = await apiPatch(`/me/wrong-book/${entry.id}`, {
      is_correct: false,
      last_answer: userAnswer,
      reason,
    });
    return data;
  } catch {
    return null;
  }
}

export async function getMyWrongBook(userId, subjectId = null, includeQuestion = true) {
  try {
    const params = { includeQuestion: includeQuestion ? 'true' : 'false' };
    if (subjectId) params.subjectId = subjectId;
    const { data } = await apiGet('/me/wrong-book', params);
    return data || [];
  } catch {
    return [];
  }
}

export async function deleteWrongBookEntry(entryId) {
  try {
    await apiDelete(`/me/wrong-book/${entryId}`);
    return true;
  } catch {
    return false;
  }
}
