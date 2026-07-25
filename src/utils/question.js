import { QUESTIONS } from '../data/questions.js';
import { EXAM_PAPERS } from '../data/examPapers.js';
import { state } from '../state.js';

export function findQuestion(qid) {
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
    const all = QUESTIONS.filter(q => q.itemId === state.currentPracticeItem);
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
