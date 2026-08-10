import { state, saveProgress, markQuestion, toggleItem, toggleModule, setUserAnswer, clearQuestionState, syncItemProgress, startInlinePractice, clearInlineState, setInlineResult, setInlineShowAnswer, setTheoryAnswer, setTheoryResult, setTheoryShowAnswer } from './state.js';
import { COURSES } from './data/courses.js';
import { THEORY_CONTENTS } from './data/theoryContents.js';
import { EXAM_PAPERS } from './data/examPapers.js';
import { submitTypes } from './config/question-types.js';
import { validate } from './validators/index.js';
import { collectUserAnswer, isEmptyAnswer } from './utils/answer-collector.js';
import { findQuestion, getNextQuestionId, getPrevQuestionId, getItemQuestions } from './utils/question.js';
import { matchRoute, buildPath, isInternalPath } from './config/routes.js';
export { isInternalPath };

import { renderLanding, renderLandingContent, initLandingContent } from './views/landing.js';
import { renderCourse, setSelectedCourseItem } from './views/course.js';
import { renderKnowledgeBase } from './views/knowledgeBase.js';
import { renderPracticeBank } from './views/practiceBank.js';
import { renderPracticeList } from './views/practiceList.js';
import { initQuizSession, cleanupQuizSession } from './views/quizSession.js';
import { renderPracticeDetail, hydrateQuestionKps } from './views/practiceDetail.js';
import { renderExamPapers } from './views/examPapers.js';
import { renderExamDetail } from './views/examDetail.js';
import {
  renderPracticeOverview, renderPracticeExams, renderPracticeTypes,
  renderCommunity, renderCommunityDetail,
  renderUserRecords
} from './views/practice/index.js';
import { renderReviewSession, initReviewSession } from './views/practice/review-session.js';
import { renderPracticeSession, initPracticeSession } from './views/practice/practice-session.js';
import { renderAddMyPaper } from './views/practice/add-my-paper.js';
import { renderPrivacy, renderTerms } from './views/legal.js';
import { renderUserPage } from './views/user/userPage.js';
import { renderAdminPage, initAdminPage } from './views/admin/adminPage.js';
import { renderDownloadCenter, initDownloadCenter } from './views/downloadCenter.js';
import { initPillNav } from './components/pillNav.js';
import { loadTheoryContent, loadQuestions } from './services/content.js';
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

async function applyRoute(route) {
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
    case 'practice':
      showPracticeOverview();
      break;
    case 'practiceExams':
      showPracticeExams();
      break;
    case 'practiceTypes':
      showPracticeTypes();
      break;
    case 'practiceQuiz':
      showPracticeQuiz();
      break;
    case 'practiceAddPaper':
      showAddMyPaper();
      break;
    case 'reviewSession':
      showReviewSession();
      break;
    case 'community':
      showCommunity();
      break;
    case 'communityPost':
      showCommunityPost(route.params.postId);
      break;
    case 'communityNew':
      showPostNew();
      break;
    case 'userRecords':
      showUserRecords();
      break;
    case 'privacy':
      showPrivacy();
      break;
    case 'terms':
      showTerms();
      break;
    case 'user':
      showUserPage();
      break;
    case 'download':
      showDownloadCenter();
      break;
    case 'admin':
      showAdminPage();
      break;
    case 'course':
      showCourse(route.params.courseId);
      break;
    case 'item':
      await showPracticeItem(route.params.itemId);
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

async function applyRouteWithLoader(route) {
  showPageLoader();
  if (route) {
    await applyRoute(route);
  } else {
    showLanding('learn');
  }
  window.setTimeout(() => hidePageLoader(), LOADER_DELAY);
}

export async function restoreLocation() {
  const route = matchRoute(window.location.pathname);
  await applyRouteWithLoader(route);
}

export async function navigateTo(path, { replace = false } = {}) {
  const pathname = path.split('#')[0];
  const hash = path.includes('#') ? '#' + path.split('#')[1] : '';
  const route = matchRoute(pathname);
  if (!route) {
    await navigateTo(buildPath('home'), { replace: true });
    return;
  }
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  await applyRouteWithLoader(route);
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

  const hash = window.location.hash;
  if (hash) {
    const el = document.querySelector(hash);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
  }
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

// === 刷题板块 ===
export function showPracticeOverview() {
  state.view = "practice-overview";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeExams() {
  state.view = "practice-exams";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeTypes() {
  state.view = "practice-types";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPracticeQuiz() {
  state.view = "practice-session";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showAddMyPaper() {
  state.view = "add-my-paper";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

// === 知识库细分（/kb 为统一 hub，仅保留复盘会话） ===
export function showReviewSession() {
  state.view = "review-session";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

// === 社区 ===
export function showCommunity() {
  state.view = "community";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showCommunityPost(postId) {
  state.view = "community-detail";
  state.currentPostId = postId;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showPostNew() {
  state.view = "post-new";
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

// === 我的刷题记录 ===
export function showUserRecords() {
  state.view = "user-records";
  clearQuestionState();
  setActiveNav('landing');
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

export function showUserPage() {
  state.view = "user";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showDownloadCenter() {
  state.view = "download";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  window.scrollTo({ top: 0 });
}

export function showAdminPage() {
  state.view = "admin";
  state.currentCourseId = null;
  clearQuestionState();
  setActiveNav('landing');
  renderMain();
  initAdminPage();
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

export async function showPracticeItem(itemId) {
  state.view = "practice-list";
  state.currentPracticeItem = itemId;
  clearQuestionState();
  clearInlineState();
  startInlinePractice(itemId);
  syncItemProgress(itemId);
  setActiveNav('landing');

  // 先用本地数据渲染，避免等待网络
  renderMain();
  window.scrollTo({ top: 0 });

  // theory / training / quiz 小节尝试从 Supabase 实时读取最新内容，避免每次保存后都要手动 fetch:data
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  const item = course?.modules.flatMap(m => m.items).find(i => i.id === itemId);
  if (item?.type === 'theory') {
    const runtime = await loadTheoryContent(itemId);
    if (runtime) {
      const local = THEORY_CONTENTS.find(t => t.itemId === itemId);
      const localContent = local?.content || item.content;
      // 仅当 Supabase 数据比本地新或本地为空时才更新视图
      if (runtime.content && runtime.content !== localContent) {
        state.runtimeTheoryContent[itemId] = runtime;
        renderMain();
      } else if ((runtime.figures && runtime.figures.length > 0) || (runtime.assets && runtime.assets.length > 0)) {
        // 内容相同但带图/表内容或全局资源引用时也要注入，保证占位符/引用能被替换
        state.runtimeTheoryContent[itemId] = runtime;
        renderMain();
      }
    }
  } else if (item?.type === 'quiz' || item?.type === 'training') {
    const runtime = await loadQuestions(itemId);
    if (runtime.length > 0) {
      const localIds = new Set(getItemQuestions(itemId).map(q => q.id));
      const hasNewOrUpdated = runtime.some(q => !localIds.has(q.id));
      if (hasNewOrUpdated) {
        state.runtimeQuestions[itemId] = runtime;
        renderMain();
      }
    }
  }
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

export function handleSelectCourseItem(itemId) {
  setSelectedCourseItem(itemId);
  // 确保所选小节所在模块展开，便于定位
  if (state.currentCourseId) {
    const course = COURSES.find(c => c.id === state.currentCourseId);
    if (course) {
      for (const m of course.modules) {
        if (m.items.some(i => i.id === itemId)) {
          state.expanded[m.id] = true;
          break;
        }
      }
    }
  }
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
  const questions = getItemQuestions(itemId);
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
  const questions = getItemQuestions(itemId);
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

// 支持三种例题来源：
//  v2 真实行（已带真实 id，经 item_questions role='theory_example' 关联）——直接用
//  旧格式①（题目 ID 字符串数组）——findQuestion 解析
//  旧格式②（内联对象数组）——生成 `${itemId}-ex${idx}` 兜底 id（仅本地静态数据 fallback）
function normalizeTheoryExamplesForSubmit(theory, itemId) {
  const raw = theory?.examples || [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return raw.map(id => findQuestion(id)).filter(Boolean);
  }
  return raw.map((ex, idx) => {
    if (ex.id) return ex; // v2 真实行：保留真实 id，markQuestion 才能更新进度
    return {
      id: `${itemId}-ex${idx}`,
      questionType: 0,
      title: `\u4f8b\u9898 ${idx + 1}`,
      content: ex.content || ex.text || '',
      image: ex.image || '',
      options: ex.options || [],
      answer: ex.answer !== undefined ? String(ex.answer) : '0',
      solution: ex.solution || '',
      itemId: itemId,
    };
  });
}

export function handleSubmitTheoryExamples(itemId) {
  const runtime = state.runtimeTheoryContent[itemId];
  const theory = THEORY_CONTENTS.find(t => t.itemId === itemId);
  const examples = normalizeTheoryExamplesForSubmit(runtime || theory, itemId);
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

  syncItemProgress(itemId);

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
      initLandingContent();
      const pillContainer = main.querySelector('[data-pill-nav]');
      if (pillContainer) {
        initPillNav(pillContainer, {
          onChange: (index) => {
            const tabs = ['learn', 'practice', 'kb', 'community', 'me'];
            const value = tabs[index] || 'learn';
            if (state.landingTab === value) return;
            state.landingTab = value;
            saveProgress();
            const contentEl = document.getElementById('landing-content');
            if (contentEl) {
              contentEl.innerHTML = renderLandingContent();
              initLandingContent();
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
      hydrateQuestionKps(state.currentQuestionId);
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
    case "practice-overview":
      main.innerHTML = renderPracticeOverview();
      break;
    case "practice-exams":
      main.innerHTML = renderPracticeExams();
      break;
    case "practice-types":
      main.innerHTML = renderPracticeTypes();
      break;
    case "practice-session":
      main.innerHTML = renderPracticeSession();
      initPracticeSession();
      break;
    case "add-my-paper":
      main.innerHTML = renderAddMyPaper();
      break;
    case "review-session":
      main.innerHTML = renderReviewSession();
      initReviewSession();
      break;
    case "community":
      main.innerHTML = renderCommunity();
      break;
    case "community-detail":
      main.innerHTML = renderCommunityDetail(state.currentPostId);
      break;
    case "post-new":
      main.innerHTML = renderPostForm();
      break;
    case "user-records":
      main.innerHTML = renderUserRecords();
      break;
    case "privacy":
      main.innerHTML = renderPrivacy();
      break;
    case "terms":
      main.innerHTML = renderTerms();
      break;
    case "user":
      main.innerHTML = renderUserPage();
      break;
    case "download":
      main.innerHTML = renderDownloadCenter();
      initDownloadCenter();
      break;
    case "admin":
      main.innerHTML = renderAdminPage();
      break;
    default:
      main.innerHTML = renderLanding();
      initLandingContent();
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
