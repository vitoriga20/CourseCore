import { supabase } from './supabase.js';
import { QUESTIONS } from '../data/questions.js';

function getItemIdForQuestion(questionId) {
  const q = QUESTIONS.find(x => x.id === questionId);
  return q?.itemId || null;
}

export async function pushAnswer(userId, questionId, itemId, answer, isCorrect) {
  if (!supabase) return;
  const { error } = await supabase.from('answers').insert({
    user_id: userId,
    item_id: itemId,
    question_id: questionId,
    answer: answer ?? null,
    is_correct: isCorrect
  });
  if (error) throw error;
}

export async function pushItemProgress(userId, itemId, status, score) {
  if (!supabase) return;
  const { error } = await supabase.from('progress').upsert(
    {
      user_id: userId,
      item_id: itemId,
      status,
      score: score ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: ['user_id', 'item_id'] }
  );
  if (error) throw error;
}

export async function pullProgress(userId) {
  if (!supabase) return { answers: [], progress: [] };

  const [{ data: answers, error: answersError }, { data: progress, error: progressError }] = await Promise.all([
    supabase.from('answers').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('progress').select('*').eq('user_id', userId)
  ]);

  if (answersError) throw answersError;
  if (progressError) throw progressError;

  return {
    answers: answers || [],
    progress: progress || []
  };
}

export async function mergeAndPushLocal(userId, localProgress, localCompleted, remoteAnswers, remoteProgress) {
  if (!supabase) {
    return {
      progress: localProgress || {},
      completedQuestions: localCompleted || {}
    };
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
        is_correct: record.passed ?? null
      });
    }
  }

  const progressToUpsert = [];
  for (const [itemId, done] of Object.entries(localProgress || {})) {
    if (!done) continue;
    const remote = (remoteProgress || []).find(p => p.item_id === itemId);
    if (!remote) {
      progressToUpsert.push({
        user_id: userId,
        item_id: itemId,
        status: 'completed'
      });
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
        lastAt: remoteAt
      };
    }
  }

  const mergedProgress = { ...(localProgress || {}) };
  for (const p of remoteProgress || []) {
    if (p.status === 'completed') {
      mergedProgress[p.item_id] = true;
    }
  }

  if (answersToInsert.length > 0) {
    const { error } = await supabase.from('answers').insert(answersToInsert);
    if (error) throw error;
  }

  if (progressToUpsert.length > 0) {
    const { error } = await supabase.from('progress').upsert(progressToUpsert, { onConflict: ['user_id', 'item_id'] });
    if (error) throw error;
  }

  return {
    progress: mergedProgress,
    completedQuestions: mergedCompleted
  };
}
