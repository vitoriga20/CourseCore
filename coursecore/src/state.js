import { COURSES } from './data/courses.js';
import { QUESTIONS } from './data/questions.js';
import {
  loadPersistedData,
  storeState,
  migrateCompletedQuestions
} from './utils/progress.js';
import { isSupabaseConfigured } from './services/supabase.js';
import * as sync from './services/sync.js';

export const CURRENT_STATE_VERSION = 1;

export const state = {
  view: 'landing',
  landingTab: 'learn',
  currentCourseId: null,
  currentExamId: null,
  currentQuestionId: null,
  currentPracticeItem: null,
  examContext: null,
  expanded: {},
  progress: {},
  search: '',
  theme: 'light',
  bankFilter: { kind: 'all', course: 'all' },

  // 用户认证
  user: null,
  authReady: false,

  // 答题状态扩展
  currentQuestion: null,
  userAnswer: null,
  validationResult: null,
  isSubmitting: false,
  completedQuestions: {},

  // inline 本节多题答题状态（不持久化）
  activePracticeItem: null,
  inlineAnswers: {},
  inlineResults: {},
  inlineShowAnswers: {},

  // 课程页理论/练习项展开状态（不持久化）
  itemExpanded: {},

  version: CURRENT_STATE_VERSION
};

export function loadProgress() {
  const persisted = loadPersistedData();
  if (persisted) {
    Object.assign(state, persisted);
    if (!state.version) state.version = 1;
    if (state.version !== CURRENT_STATE_VERSION) {
      migrateState(state);
    }
  }

  // 当前仅保留深色主题，忽略持久化或系统偏好
  state.theme = 'dark';
}

function migrateState(s) {
  // 未来版本迁移逻辑写在这里
  s.version = CURRENT_STATE_VERSION;
}

export function saveProgress() {
  storeState({
    progress: state.progress,
    expanded: state.expanded,
    completedQuestions: state.completedQuestions,
    landingTab: state.landingTab,
    theme: state.theme,
    version: state.version
  });
}

export function setUserAnswer(qid, answer) {
  if (state.currentQuestion && state.currentQuestion.id === qid) {
    state.userAnswer = answer;
  }
}

export function markQuestion(qid, result) {
  const prev = state.completedQuestions[qid] || { attempts: 0 };
  state.completedQuestions[qid] = {
    passed: result.manual ? null : Boolean(result.passed),
    attempts: prev.attempts + 1,
    lastAnswer: result.userAnswer ?? null,
    lastAt: Date.now()
  };
  saveProgress();

  if (state.user && isSupabaseConfigured()) {
    const question = QUESTIONS.find(q => q.id === qid);
    const itemId = question?.itemId || null;
    sync.pushAnswer(state.user.id, qid, itemId, result.userAnswer ?? null, result.manual ? null : Boolean(result.passed))
      .catch(err => console.error('Sync answer failed', err));
  }
}

export function clearQuestionState() {
  state.currentQuestion = null;
  state.userAnswer = null;
  state.validationResult = null;
  state.isSubmitting = false;
}

export function setInlineAnswer(qid, answer) {
  state.inlineAnswers[qid] = answer;
}

export function setInlineResult(qid, result) {
  state.inlineResults[qid] = result;
}

export function setInlineShowAnswer(qid, show = true) {
  state.inlineShowAnswers[qid] = show;
}

export function clearInlineState() {
  state.activePracticeItem = null;
  state.inlineAnswers = {};
  state.inlineResults = {};
  state.inlineShowAnswers = {};
}

export function startInlinePractice(itemId) {
  state.activePracticeItem = itemId;
  state.inlineAnswers = {};
  state.inlineResults = {};
}

export function getTotalItems(course) {
  return course.modules.reduce((sum, m) => sum + m.items.length, 0);
}

export function isItemCompleted(itemId) {
  const itemQuestions = QUESTIONS.filter(q => q.itemId === itemId);
  if (itemQuestions.length > 0) {
    return itemQuestions.every(q => state.completedQuestions[q.id]);
  }
  return !!state.progress[itemId];
}

export function getCompletedCount(course) {
  return course.modules.reduce((sum, m) => sum + m.items.filter(i => isItemCompleted(i.id)).length, 0);
}

export function getStatus(itemId) {
  return isItemCompleted(itemId) ? 'done' : 'todo';
}

export function syncItemProgress(itemId) {
  const itemQuestions = QUESTIONS.filter(q => q.itemId === itemId);
  if (itemQuestions.length === 0) return;
  const allDone = itemQuestions.every(q => state.completedQuestions[q.id]);
  if (allDone && !state.progress[itemId]) {
    state.progress[itemId] = true;
    saveProgress();

    if (state.user && isSupabaseConfigured()) {
      sync.pushItemProgress(state.user.id, itemId, 'completed', null)
        .catch(err => console.error('Sync progress failed', err));
    }
  }
}

export function toggleItem(itemId) {
  state.progress[itemId] = !state.progress[itemId];
  saveProgress();
}

export function toggleModule(moduleId) {
  state.expanded[moduleId] = !state.expanded[moduleId];
}

export function courseTitle(courseId) {
  const c = COURSES.find(x => x.id === courseId);
  return c ? c.title : '';
}

export function moduleTitle(courseId, moduleId) {
  const c = COURSES.find(x => x.id === courseId);
  if (!c) return '';
  const m = c.modules.find(x => x.id === moduleId);
  return m ? m.title : '';
}

export function itemTitle(courseId, moduleId, itemId) {
  const c = COURSES.find(x => x.id === courseId);
  if (!c) return '';
  const m = c.modules.find(x => x.id === moduleId);
  if (!m) return '';
  const i = m.items.find(x => x.id === itemId);
  return i ? i.title : '';
}
