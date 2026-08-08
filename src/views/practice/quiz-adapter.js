// quizSession 适配层
// 包装现有 quizSession，支持 4 种入参: {examId} / {questionIds} / {wrongEntries} / {myPaperId}
// 不改 quizSession 内部逻辑（仅通过 externalQuestions 注入题目列表）
// 提交后处理（保存 practice_records + 更新 wrong_book）由调用方在 onFinish 回调中实现

import { renderQuizSession, initQuizSession, cleanupQuizSession } from '../quizSession.js';
import { getExamPaper, getQuestionsByType } from '../../services/practice-data.js';
import { supabase } from '../../services/supabase.js';
import { apiPost } from '../../services/apiClient.js';

// ============================================================
// 取题：从不同来源获取题目列表
// ============================================================

async function fetchQuestionsByExamId(examId) {
  console.log('### fetchQuestionsByExamId', examId);
  const paper = await getExamPaper(examId);
  console.log('### got paper', paper?.id, paper?.sections?.length);
  if (!paper) return { questions: [], title: '', subjectId: '' };
  const questions = (paper.sections || []).flatMap(s => s.questions || []);
  return {
    questions,
    title: `${paper.subject}·${paper.term || ''}`,
    subjectId: paper.subject,
  };
}

async function fetchQuestionsByType(subject, questionType) {
  const questions = await getQuestionsByType(subject, questionType);
  const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };
  return {
    questions,
    title: `${subject}·${TYPE_NAMES[questionType] || ''}题组`,
    subjectId: subject,
  };
}

function fetchQuestionsFromWrongEntries(wrongEntries) {
  const questions = wrongEntries.map(e => e.questions).filter(Boolean);
  const subjectId = wrongEntries[0]?.subject_id || '';
  return {
    questions,
    title: '错题复盘',
    subjectId,
  };
}

async function fetchQuestionsByMyPaper(myPaperId) {
  if (!supabase) return { questions: [], title: '', subjectId: '' };
  const { data, error } = await supabase
    .from('my_papers')
    .select('*')
    .eq('id', myPaperId)
    .maybeSingle();
  if (error || !data) return { questions: [], title: '', subjectId: '' };

  // 按 question_ids 顺序从统一 questions 表取题
  const ids = data.question_ids || [];
  if (ids.length === 0) return { questions: [], title: data.name, subjectId: '' };

  const { data: qs, error: e2 } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids);
  if (e2 || !qs) return { questions: [], title: data.name, subjectId: '' };

  // 按 question_ids 顺序排序
  const order = new Map(ids.map((id, i) => [id, i]));
  const questions = qs.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

  return { questions, title: data.name, subjectId: '' };
}

// ============================================================
// 启动刷题会话
// ============================================================

/**
 * 启动刷题会话
 * @param {Object} params - 入参（四选一）
 * @param {string} params.examId - 按试卷
 * @param {string} params.subject + {number} params.questionType - 按题型
 * @param {Array} params.wrongEntries - 错题复盘（wrong_book JOIN questions 的结果）
 * @param {string} params.myPaperId - 我的试卷
 * @returns {Promise<{virtualId, questions, title, mode, sourceId, subjectId}>}
 */
export async function startPracticeSession(params) {
  console.log('### startPracticeSession', params);
  let questions = [];
  let title = '';
  let mode = 'exam';
  let sourceId = '';
  let subjectId = '';

  if (params.examId) {
    mode = 'exam';
    sourceId = params.examId;
    ({ questions, title, subjectId } = await fetchQuestionsByExamId(params.examId));
  } else if (params.subject !== undefined && params.questionType !== undefined) {
    mode = 'type_group';
    sourceId = `${params.subject}_${params.questionType}`;
    ({ questions, title, subjectId } = await fetchQuestionsByType(params.subject, params.questionType));
  } else if (params.wrongEntries && params.wrongEntries.length > 0) {
    mode = 'wrong_review';
    sourceId = `wrong_${params.wrongEntries[0].subject_id}`;
    ({ questions, title, subjectId } = fetchQuestionsFromWrongEntries(params.wrongEntries));
  } else if (params.myPaperId) {
    mode = 'my_paper';
    sourceId = params.myPaperId;
    ({ questions, title, subjectId } = await fetchQuestionsByMyPaper(params.myPaperId));
  }

  const virtualId = `practice:${mode}:${sourceId}`;

  return { virtualId, questions, title, mode, sourceId, subjectId };
}

/**
 * 渲染答题容器
 */
export function renderQuizAdapter(virtualId) {
  return renderQuizSession(virtualId);
}

/**
 * 初始化答题会话
 */
export function initQuizAdapter(virtualId, questions) {
  initQuizSession(virtualId, questions);
}

/**
 * 清理答题会话
 */
export function cleanupQuizAdapter(virtualId) {
  cleanupQuizSession(virtualId);
}

// ============================================================
// 保存刷题总结记录
// ============================================================

/**
 * 保存刷题总结到 practice_records
 * @param {Object} params - { userId, mode, sourceId, sourceName, subjectId, state }
 *   state = quizSession 的 state 对象（含 allQuestions/userAnswers/results）
 */
export async function savePracticeRecord({ userId, mode, sourceId, sourceName, subjectId, state }) {
  const total = state.allQuestions.length;
  let correct = 0;
  let wrong = 0;
  const details = [];

  for (const q of state.allQuestions) {
    const result = state.results[q.id];
    const userAnswer = state.userAnswers[q.id];
    const isCorrect = result?.passed === true;
    if (isCorrect) correct++;
    else if (result) wrong++;
    details.push({
      question_id: q.id,
      user_answer: userAnswer,
      correct: isCorrect,
    });
  }

  const answered = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const durationSeconds = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;

  const payload = {
    mode,
    source_id: sourceId,
    source_name: sourceName,
    subject_id: subjectId,
    total,
    answered,
    correct,
    wrong,
    accuracy,
    duration_seconds: durationSeconds,
    details,
  };

  try {
    const { data } = await apiPost('/me/practice-records', payload);
    return data;
  } catch (e) {
    console.warn('[quiz-adapter] BFF practice record fallback:', e?.message || e);
  }

  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('practice_records')
    .insert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) console.warn('[quiz-adapter] savePracticeRecord:', error);
  return data;
}
