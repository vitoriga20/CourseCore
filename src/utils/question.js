import { QUESTIONS } from '../data/questions.js';
import { EXAM_PAPERS } from '../data/examPapers.js';
import { THEORY_CONTENTS } from '../data/theoryContents.js';
import { COURSES } from '../data/courses.js';
import { state } from '../state.js';

// 运行时从 Supabase 读取的题目缓存（按 itemId 分组）与本地 QUESTIONS 合并
// v2: 训练题在 state.runtimeQuestions（经 item_questions role='practice'），
//     理论例题在 state.runtimeTheoryContent[itemId].examples（经 role='theory_example'），
//     两者都纳入该小节的题目集合，供进度判定/上一题下一题使用。
// 理论小节只有例题（role='theory_example'），不含训练题（role='practice'）。
// 训练刷题/进度判定对理论小节只统计例题，避免误挂的 practice 训练题阻塞理论进度。
function getItemType(itemId) {
  for (const c of COURSES) {
    for (const m of c.modules) {
      for (const i of m.items) if (i.id === itemId) return i.type;
    }
  }
  return null;
}

export function getItemQuestions(itemId) {
  const isTheory = getItemType(itemId) === 'theory';
  const runtime = isTheory ? [] : (state.runtimeQuestions[itemId] || []);
  const theoryExamples = state.runtimeTheoryContent[itemId]?.examples || [];
  const local = isTheory ? [] : QUESTIONS.filter(q => q.itemId === itemId);

  // 静态理论例题（THEORY_CONTENTS.examples）也纳入该小节题目集合，
  // 使 syncItemProgress 能对带例题的理论小节做进度判定。（与 normalizeTheoryExamples 同源）
  const staticTheory = (THEORY_CONTENTS.find(t => t.itemId === itemId)?.examples || [])
    .map((ex, idx) => ex.id ? ex : {
      id: `${itemId}-ex${idx}`,
      questionType: 0,
      title: `例题 ${idx + 1}`,
      content: ex.content || ex.text || '',
      image: ex.image || '',
      options: ex.options || [],
      answer: ex.answer !== undefined ? String(ex.answer) : '0',
      solution: ex.solution || '',
      itemId: itemId,
    });

  const mergedMap = new Map();
  for (const q of [...local, ...runtime, ...theoryExamples, ...staticTheory]) mergedMap.set(q.id, q);
  return Array.from(mergedMap.values()).sort((a, b) => {
    const ai = Number(a.order_index ?? a.sort_order ?? a.order ?? 0);
    const bi = Number(b.order_index ?? b.sort_order ?? b.order ?? 0);
    return ai - bi;
  });
}

export function findQuestion(qid) {
  // 优先从运行时缓存中查找（训练题）
  for (const itemId in state.runtimeQuestions) {
    const found = state.runtimeQuestions[itemId].find(q => q.id === qid);
    if (found) return found;
  }

  // 理论例题（v2: examples 为 questions 真实行）
  for (const itemId in state.runtimeTheoryContent) {
    const examples = state.runtimeTheoryContent[itemId]?.examples || [];
    const found = examples.find(q => q.id === qid);
    if (found) return found;
  }

  const fromQuestions = QUESTIONS.find(q => q.id === qid);
  if (fromQuestions) return fromQuestions;

  for (const exam of EXAM_PAPERS) {
    for (const sec of exam.sections) {
      const q = sec.questions.find(x => x.id === qid);
      if (q) {
        return {
          ...q,
          examId: exam.id,
          examName: `${exam.school} ${exam.subject} ${exam.term}`
        };
      }
    }
  }
  return null;
}

export function getQuestionContext(question) {
  if (state.examContext) {
    const exam = EXAM_PAPERS.find(e => e.id === state.examContext);
    if (exam) {
      const all = exam.sections.flatMap(s => s.questions);
      return { all, currentIndex: all.findIndex(q => q.id === question.id) };
    }
  }

  if (state.currentPracticeItem) {
    const all = getItemQuestions(state.currentPracticeItem);
    return { all, currentIndex: all.findIndex(q => q.id === question.id) };
  }

  const all = QUESTIONS;
  return { all, currentIndex: all.findIndex(q => q.id === question.id) };
}

export function getNextQuestionId(question) {
  const ctx = getQuestionContext(question);
  const next = ctx.all[ctx.currentIndex + 1];
  return next ? next.id : null;
}

export function getPrevQuestionId(question) {
  const ctx = getQuestionContext(question);
  const prev = ctx.all[ctx.currentIndex - 1];
  return prev ? prev.id : null;
}

export function formatAnswerDisplay(question) {
  const { questionType, answer, answers } = question;

  if ((questionType === 0 || questionType === 1) && Array.isArray(answers)) {
    return answers
      .map(a => /^\d+$/.test(String(a)) ? String.fromCharCode(65 + parseInt(a, 10)) : a)
      .filter(Boolean)
      .join(', ');
  }

  if (questionType === 0 && /^\d+$/.test(String(answer))) {
    const idx = parseInt(answer, 10);
    return String.fromCharCode(65 + idx) || answer;
  }

  if (questionType === 5) {
    const v = String(answer).trim();
    if (v === '1') return '正确';
    if (v === '0') return '错误';
  }

  return answer;
}
