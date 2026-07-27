import { state, saveProgress, markQuestion, toggleItem, toggleModule, setUserAnswer, clearQuestionState, syncItemProgress, startInlinePractice, clearInlineState, setInlineResult, setInlineShowAnswer, setTheoryAnswer, setTheoryResult, setTheoryShowAnswer } from './state.js';
import { COURSES } from './data/courses.js';
import { QUESTIONS } from './data/questions.js';
import { THEORY_CONTENTS } from './data/theoryContents.js';
import { EXAM_PAPERS } from './data/examPapers.js';
import { submitTypes } from './config/question-types.js';
import { validate } from './validators/index.js';
import { collectUserAnswer, isEmptyAnswer } from './utils/answer-collector.js';
import { findQuestion, getNextQuestionId, getPrevQuestionId } from './utils/question.js';
import { matchRoute, buildPath, isInternalPath } from './config/routes.js';
export { isInternalPath };

import { renderLanding, renderLandingContent } from './views/landing.js';
import { renderCourse } from './views/course.js';
import { renderKnowledgeBase } from './views/knowledgeBase.js';
import { renderPracticeBank } from './views/practiceBank.js';
import { renderPracticeList } from './views/practiceList.js';
import { initQuizSession, cleanupQuizSession } from './views/quizSession.js';
import { renderPracticeDetail } from './views/practiceDetail.js';
import { renderExamPapers } from './views/examPapers.js';
import { renderExamDetail } from './views/examDetail.js';
import { renderPrivacy, renderTerms } from './views/legal.js';
import { initGooeyNav } from './components/gooeyNav.js';
import { showPageLoader, hidePageLoader, initImageLoaders, renderButtonLoader } from './components/loading.js';

let activeQuizItemId = null;

function typeset(element) {
  if (window.MathJax && window.MathJax.typesetPromise && element) {
    window.MathJax.typesetPromise([element]).catch(() => {});
  }
}

export function setActiveNav(view) {
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  if (view === 'bank' || view === 'exam' || view === 'practice') {
    document.getElementById('nav-bank')?.classList.add('active');
  }
}

function applyRoute(route) {
  switch (route.name) {
    case 'home':
      showLanding(state.landingTab || 'learn');
      break;
    case 'kb':
      showKnowledgeBase();
      break;
    case 'bank':
      showPracticeBank();
      break;
    case 'exams':
      showExamPapers();
      break;
    case 'privacy':
      showPrivacy();
      break;
    case 'terms':
      showTerms();
      break;
    case 'course':
      showCourse(route.params.courseId);
      break;
    case 'item':
      showPracticeItem(route.params.itemId);
      break;
    case 'question':
      showPracticeDetail(route.params.qid);
      break;
    case 'exam':
      showExamPaper(route.params.examId);
      break;
    case 'examQuestion':
      showExamQuestion(route.params.examId, route.params.qid);
      break;
    default:
      showLanding('learn');
  }
}

const LOADER_DELAY = 120;

function applyRouteWithLoader(route) {
  showPageLoader();
  if (route) {
    applyRoute(route);
  } else {
    showLanding('learn');
  }
  window.setTimeout(() => hidePageLoader(), LOADER_DELAY);
}

export function restoreLocation() {
  const route = matchRoute(window.location.pathname);
  applyRouteWithLoader(route);
}

export function navigateTo(path, { replace = false } = {}) {
  const route = matchRoute(path);
  if (!route) {
    navigateTo(buildPath('home'), { replace: true });
    return;
  }
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  applyRouteWithLoader(route);
}

export function showLanding(tab) {
  state.view = "landing";
  state.landingTab = tab || "learn";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  saveProgress();
  window.scrollTo({ top: 0 });
}

export function showCourse(courseId) {
  state.view = "course";
  state.currentCourseId = courseId;
  clearQuestionState();
  const course = COURSES.find(c => c.id === courseId);
  if (course) {
    course.modules.forEach(m => {
      if (!(m.id in state.expanded)) state.expanded[m.id] = true;
    });
  }
  setActiveNav('course');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showKnowledgeBase() {
  state.view = "knowledge";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeBank() {
  state.view = "bank";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('bank');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showExamPapers() {
  state.view = "exam";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('bank');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPrivacy() {
  state.view = "privacy";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showTerms() {
  state.view = "terms";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showExamPaper(examId) {
  state.view = "exam-detail";
  state.currentExamId = examId;
  clearQuestionState();
  setActiveNav('bank');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeDetail(questionId) {
  state.view = "practice";
  state.currentQuestionId = questionId;
  state.examContext = null;
  setActiveNav('bank');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeItem(itemId) {
  state.view = "practice-list";
  state.currentPracticeItem = itemId;
  clearQuestionState();
  clearInlineState();
  startInlinePractice(itemId);
  syncItemProgress(itemId);
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showExamQuestion(examId, qid) {
  state.view = "practice";
  state.currentQuestionId = qid;
  state.examContext = examId;
  setActiveNav('bank');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function historyBack() {
  clearQuestionState();
  window.history.back();
}

export function handleToggleItem(itemId) {
  toggleItem(itemId);
  if (state.currentCourseId) {
    renderMain();
  }
}

export function handleToggleModule(moduleId) {
  toggleModule(moduleId);
  if (state.currentCourseId) renderMain();
}

export function handleToggleItemExpand(itemId) {
  state.itemExpanded[itemId] = !state.itemExpanded[itemId];
  if (state.currentCourseId) renderMain();
}

export function handleMarkItemDone(itemId) {
  toggleItem(itemId);
  if (state.currentCourseId) renderMain();
}

export function handleStartPractice(itemId) {
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return;
  const item = course.modules.flatMap(m => m.items).find(i => i.id === itemId);
  if (!item) return;
  if (item.type === 'theory') {
    state.itemExpanded[itemId] = true;
  } else {
    startInlinePractice(itemId);
  }
  if (state.view !== 'course' || state.currentCourseId !== course.id) {
    navigateTo(buildPath('course', { courseId: course.id }));
  } else {
    renderMain();
  }
}

export function handleClosePractice(itemId) {
  clearInlineState();
  renderMain();
}

export function handleSubmitItem(itemId) {
  const questions = QUESTIONS.filter(q => q.itemId === itemId);
  if (questions.length === 0) return;

  const root = document.querySelector(`.inline-practice[data-item-id="${itemId}"]`);
  if (!root) return;

  const answers = {};
  for (const q of questions) {
    answers[q.id] = collectUserAnswer(q, root);
  }

  const emptyQids = questions.filter(q => isEmptyAnswer(answers[q.id])).map(q => q.id);
  if (emptyQids.length > 0) {
    alert('请先完成所有题目再提交');
    const firstEmpty = root.querySelector(`[data-qid="${emptyQids[0]}"]`);
    firstEmpty?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const submitBtn = document.querySelector(`[data-action="submit-item"][data-item-id="${itemId}"]`);
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = renderButtonLoader();
  }

  state.inlineShowAnswers = {};

  let allPassed = true;
  for (const q of questions) {
    let result;
    try {
      result = validate(q, answers[q.id]);
    } catch (e) {
      console.error(e);
      result = { passed: false, userAnswer: answers[q.id], correctAnswer: q.answer, message: '验证出错：' + e.message, manual: false };
    }
    setInlineResult(q.id, result);
    if (!result.manual && !result.passed) {
      allPassed = false;
    }
    markQuestion(q.id, result);
  }

  syncItemProgress(itemId);
  renderMain();

  if (allPassed) {
    const submitBtn = root.querySelector('[data-action="next-item"]');
    submitBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function handleRetryItem(itemId) {
  const questions = QUESTIONS.filter(q => q.itemId === itemId);
  for (const q of questions) {
    delete state.inlineResults[q.id];
    delete state.inlineAnswers[q.id];
    delete state.inlineShowAnswers[q.id];
  }
  renderMain();
}

export function handleShowInlineAnswer(qid) {
  setInlineShowAnswer(qid, true);
  renderMain();
}

export function handleSubmitTheoryExamples(itemId) {
  const theory = THEORY_CONTENTS.find(t => t.itemId === itemId);
  const exampleIds = theory?.examples || [];
  const examples = exampleIds
    .map(id => QUESTIONS.find(q => q.id === id))
    .filter(Boolean);
  if (examples.length === 0) return;

  const root = document.querySelector(`.theory-examples[data-item-id="${itemId}"]`);
  if (!root) return;

  const answers = {};
  for (const q of examples) {
    const qRoot = root.querySelector(`[data-qid="${q.id}"]`);
    answers[q.id] = collectUserAnswer(q, qRoot);
  }

  const emptyQids = examples.filter(q => isEmptyAnswer(answers[q.id])).map(q => q.id);
  if (emptyQids.length > 0) {
    alert('请先完成所有例题再提交');
    const firstEmpty = root.querySelector(`[data-qid="${emptyQids[0]}"]`);
    firstEmpty?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const submitBtn = document.querySelector(`[data-action="submit-theory-examples"][data-item-id="${itemId}"]`);
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = renderButtonLoader();
  }

  state.theoryShowAnswers = {};

  let allPassed = true;
  for (const q of examples) {
    setTheoryAnswer(q.id, answers[q.id]);
    let result;
    try {
      result = validate(q, answers[q.id]);
    } catch (e) {
      console.error(e);
      result = { passed: false, userAnswer: answers[q.id], correctAnswer: q.answer, message: '验证出错：' + e.message, manual: false };
    }
    setTheoryResult(q.id, result);
    if (!result.manual && !result.passed) {
      allPassed = false;
    }
    markQuestion(q.id, result);
  }

  if (allPassed && !state.progress[itemId]) {
    state.progress[itemId] = true;
    saveProgress();
  }

  renderMain();

  if (allPassed) {
    const nextBtn = root.querySelector('[data-action="next-item"]');
    nextBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function handleShowTheoryAnswer(qid) {
  setTheoryShowAnswer(qid, true);
  renderMain();
}

function findNextPracticeItem(itemId) {
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return null;
  let found = false;
  for (const m of course.modules) {
    for (const i of m.items) {
      if (found) return i.id;
      if (i.id === itemId) {
        found = true;
      }
    }
  }
  return null;
}

export function handleNextItem(itemId) {
  const nextId = findNextPracticeItem(itemId);
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!nextId || !course) {
    if (course) {
      clearInlineState();
      navigateTo(buildPath('course', { courseId: course.id }));
    }
    return;
  }
  clearInlineState();
  navigateTo(buildPath('item', { itemId: nextId }));
}

export function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;

  if (activeQuizItemId) {
    cleanupQuizSession(activeQuizItemId);
    activeQuizItemId = null;
  }

  switch (state.view) {
    case "landing": {
      main.innerHTML = renderLanding();
      const gooeyContainer = main.querySelector('[data-gooey-nav]');
      if (gooeyContainer) {
        initGooeyNav(gooeyContainer, {
          animationTime: 600,
          particleCount: 15,
          particleDistances: [90, 10],
          particleR: 100,
          timeVariance: 300,
          colors: [1, 2, 3, 1, 2, 3, 1, 4],
          onChange: (index) => {
            const value = index === 1 ? 'kb' : 'learn';
            if (state.landingTab === value) return;
            state.landingTab = value;
            saveProgress();
            const contentEl = document.getElementById('landing-content');
            if (contentEl) {
              contentEl.innerHTML = renderLandingContent();
              typeset(contentEl);
            }
          }
        });
      }
      break;
    }
    case "course":
      main.innerHTML = renderCourse(state.currentCourseId);
      break;
    case "knowledge":
      main.innerHTML = renderKnowledgeBase();
      break;
    case "bank":
      main.innerHTML = renderPracticeBank();
      break;
    case "practice":
      main.innerHTML = renderPracticeDetail(state.currentQuestionId);
      break;
    case "practice-list":
      main.innerHTML = renderPracticeList(state.currentPracticeItem);
      {
        const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === state.currentPracticeItem)));
        const item = course?.modules.flatMap(m => m.items).find(i => i.id === state.currentPracticeItem);
        if (item?.type === 'quiz' || item?.type === 'training') {
          initQuizSession(state.currentPracticeItem);
          activeQuizItemId = state.currentPracticeItem;
        }
      }
      break;
    case "exam":
      main.innerHTML = renderExamPapers();
      break;
    case "exam-detail":
      main.innerHTML = renderExamDetail(state.currentExamId);
      break;
    case "privacy":
      main.innerHTML = renderPrivacy();
      break;
    case "terms":
      main.innerHTML = renderTerms();
      break;
    default:
      main.innerHTML = renderLanding();
  }
  typeset(main);
  initImageLoaders(main);
}

function refreshQuestionView() {
  renderMain();
}

export function handleSelectOption(value) {
  if (!state.currentQuestion) return;
  const submitType = submitTypes[state.currentQuestion.questionType];
  if (submitType === 'instant') {
    setUserAnswer(state.currentQuestion.id, value);
    handleSubmitAnswer(state.currentQuestion.id);
  }
}

export function handleSubmitAnswer(qid) {
  const question = findQuestion(qid);
  if (!question) return;

  const userAnswer = collectUserAnswer(question);
  if (isEmptyAnswer(userAnswer)) {
    alert('请先输入或选择答案');
    return;
  }

  const submitBtn = document.querySelector(`[data-action="submit-answer"][data-qid="${qid}"]`);
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = renderButtonLoader();
  }

  state.isSubmitting = true;
  let result;
  try {
    result = validate(question, userAnswer);
  } catch (e) {
    console.error(e);
    result = { passed: false, userAnswer, correctAnswer: question.answer, message: '验证出错：' + e.message, manual: false };
  }
  state.isSubmitting = false;
  state.validationResult = result;

  if (!result.manual) {
    markQuestion(qid, result);
  }

  if (question.itemId) {
    syncItemProgress(question.itemId);
  }

  refreshQuestionView();

  const submitType = submitTypes[question.questionType];
  if (submitType === 'instant' && result.passed) {
    const nextId = getNextQuestionId(question);
    if (nextId) {
      setTimeout(() => handleNextQuestion(nextId), 600);
    }
  }
}

export function handleShowHint() {
  const hint = document.querySelector('.question-hint');
  if (hint) hint.classList.remove('hidden');
}

export function handleResetAnswer() {
  state.userAnswer = null;
  state.validationResult = null;
  refreshQuestionView();
}

export function handleNextQuestion(qid) {
  const targetId = qid || getNextQuestionId(state.currentQuestion);
  if (!targetId) {
    alert('已完成本节/本试卷全部题目');
    historyBack();
    return;
  }
  if (state.examContext) {
    navigateTo(buildPath('examQuestion', { examId: state.examContext, qid: targetId }));
  } else {
    navigateTo(buildPath('question', { qid: targetId }));
  }
}

export function handlePrevQuestion(qid) {
  const targetId = qid || getPrevQuestionId(state.currentQuestion);
  if (!targetId) return;
  if (state.examContext) {
    navigateTo(buildPath('examQuestion', { examId: state.examContext, qid: targetId }));
  } else {
    navigateTo(buildPath('question', { qid: targetId }));
  }
}
