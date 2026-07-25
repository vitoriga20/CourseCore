import './style.css';
import { state, loadProgress, saveProgress, setInlineAnswer } from './state.js';
import { setTheme } from './theme.js';
import { initBackground } from './background.js';
import { COURSES } from './data/courses.js';
import { PLATFORM } from './data/platform.js';
import { escapeHtml } from './utils.js';
import { collectUserAnswer } from './utils/answer-collector.js';
import { findQuestion } from './utils/question.js';
import { questionTypes } from './config/question-types.js';
import { renderKnowledgeBaseList } from './views/knowledgeBase.js';
import {
  navigateTo,
  restoreLocation,
  isInternalPath,
  showLanding,
  showPracticeBank,
  showExamPapers,
  handleToggleItem,
  handleToggleModule,
  handleToggleItemExpand,
  handleMarkItemDone,
  handleStartPractice,
  handleClosePractice,
  handleSubmitItem,
  handleRetryItem,
  handleNextItem,
  handleShowInlineAnswer,
  handleSelectOption,
  handleSubmitAnswer,
  handleShowHint,
  handleResetAnswer,
  handleNextQuestion,
  handlePrevQuestion
} from './router.js';
import {
  handleQuizPrev,
  handleQuizNext,
  handleQuizGoto,
  handleQuizFinish,
  handleQuizRestart,
  handleQuizToggleOrder,
  handleQuizToggleFont,
  handleQuizToggleBg,
  handleQuizShowAnswer,
  handleQuizSubmitAnswer,
  handleQuizSelectOption
} from './views/quizSession.js';
import { renderLandingContent } from './views/landing.js';

function renderAppShell() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <header class="sticky top-0 z-30 header-glass border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <a href="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full border flex items-center justify-center" style="border-color: var(--accent);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <span class="text-xl font-bold tracking-tight">${escapeHtml(PLATFORM.name)}</span>
        </a>
        <div class="hidden md:flex items-center gap-6">
          <div class="search-wrap w-56">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input id="global-search" class="search-input" type="text" placeholder="查找课程、题型或试卷…">
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 max-w-7xl mx-auto w-full">
      <main id="main" class="main-content w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-12"></main>
    </div>

    <footer class="border-t mt-auto" style="border-color: var(--line);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-full border flex items-center justify-center" style="border-color: var(--accent);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </div>
              <span class="font-bold">${escapeHtml(PLATFORM.name)}</span>
            </div>
            <p class="text-sm" style="color: var(--muted);">帮助大学生系统掌握基础课，从概念到考题逐步拆解。</p>
          </div>
          <div>
            <h4 class="font-semibold mb-3">课程</h4>
            <ul class="space-y-2 text-sm" style="color: var(--muted);">
              ${COURSES.map(c => `<li><a href="/course/${c.id}" class="hover:text-[var(--fg)]">${escapeHtml(c.title)}</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">资源</h4>
            <ul class="space-y-2 text-sm" style="color: var(--muted);">
              <li><a href="/exams" class="hover:text-[var(--fg)]">期末试卷</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-3">关于</h4>
            <ul class="space-y-2 text-sm" style="color: var(--muted);">
              <li><span class="hover:text-[var(--fg)]">关于我们</span></li>
              <li><span class="hover:text-[var(--fg)]">使用条款</span></li>
              <li><span class="hover:text-[var(--fg)]">隐私政策</span></li>
            </ul>
          </div>
        </div>
        <div class="mt-10 pt-6 border-t text-center text-xs" style="border-color: var(--line); color: var(--muted);">
          (c) 2026 ${escapeHtml(PLATFORM.name)}. 内容仅供学习交流，课程数据可自由改造。
        </div>
      </div>
    </footer>

    <div class="staggered-menu-wrapper" id="staggered-menu" data-open="false">
      <div class="sm-prelayers" aria-hidden="true">
        <div class="sm-prelayer" style="background: #1a1a2e;"></div>
        <div class="sm-prelayer" style="background: #4a2c6a;"></div>
        <div class="sm-prelayer" style="background: #2dd288;"></div>
      </div>
      <button class="sm-toggle" data-action="toggle-menu" aria-label="打开菜单" aria-expanded="false" aria-controls="sm-panel">
        <span class="sm-toggle-text">Menu</span>
        <span class="sm-icon" aria-hidden="true">
          <span class="sm-icon-line"></span>
          <span class="sm-icon-line sm-icon-line-v"></span>
        </span>
      </button>
      <aside class="sm-panel" id="sm-panel" aria-hidden="true">
        <nav class="sm-panel-inner">
          <ul class="sm-panel-list">
            <li class="sm-panel-itemWrap">
              <a href="/" class="sm-panel-item" data-index="01"><span class="sm-panel-label">首页</span></a>
            </li>
            <li class="sm-panel-itemWrap sm-panel-group">
              <button type="button" class="sm-panel-item sm-panel-parent" data-action="toggle-course-submenu" aria-expanded="false" data-index="02">
                <span class="sm-panel-label">课程</span>
              </button>
              <ul class="sm-submenu">
                ${COURSES.map((c, i) => `<li class="sm-submenu-itemWrap"><a href="/course/${c.id}" class="sm-submenu-item" data-subindex="0${i + 1}"><span class="sm-submenu-label">${escapeHtml(c.title)}</span></a></li>`).join('')}
              </ul>
            </li>
            <li class="sm-panel-itemWrap">
              <a href="/kb" class="sm-panel-item" data-index="03"><span class="sm-panel-label">知识库</span></a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  `;
}

function typeset(element) {
  if (window.MathJax && window.MathJax.typesetPromise && element) {
    window.MathJax.typesetPromise([element]).catch(() => {});
  }
}

function refreshLandingContent() {
  const contentEl = document.getElementById('landing-content');
  if (contentEl) {
    contentEl.innerHTML = renderLandingContent();
    typeset(contentEl);
  }
}

function updateKBSearch(value) {
  state.search = value;
  const list = document.getElementById('kb-list');
  if (list) {
    list.innerHTML = renderKnowledgeBaseList();
    typeset(list);
  }
}

function updateSearch(value) {
  state.search = value;
  if (state.view === 'landing' && state.landingTab === 'kb') refreshLandingContent();
  else if (state.view === 'bank') showPracticeBank();
}

function closeStaggeredMenu() {
  const wrapper = document.getElementById('staggered-menu');
  const btn = wrapper?.querySelector('.sm-toggle');
  const panel = document.getElementById('sm-panel');
  if (wrapper) wrapper.setAttribute('data-open', 'false');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (panel) panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.sm-panel-group.open').forEach(g => g.classList.remove('open'));
  document.querySelectorAll('.sm-panel-parent[aria-expanded="true"]').forEach(p => p.setAttribute('aria-expanded', 'false'));
}

function openStaggeredMenu() {
  const wrapper = document.getElementById('staggered-menu');
  const btn = wrapper?.querySelector('.sm-toggle');
  const panel = document.getElementById('sm-panel');
  if (wrapper) wrapper.setAttribute('data-open', 'true');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  if (panel) panel.setAttribute('aria-hidden', 'false');
}

function toggleStaggeredMenu() {
  const wrapper = document.getElementById('staggered-menu');
  if (wrapper?.getAttribute('data-open') === 'true') {
    closeStaggeredMenu();
  } else {
    openStaggeredMenu();
  }
}

function toggleCourseSubmenu(button) {
  const group = button.closest('.sm-panel-group');
  if (!group) return;
  const isOpen = group.classList.contains('open');
  if (isOpen) {
    group.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  } else {
    group.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
  }
}

function initEventDelegation() {
  const app = document.getElementById('app');
  if (!app) return;

  app.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && isInternalPath(href)) {
        e.preventDefault();
        closeStaggeredMenu();
        navigateTo(href);
        return;
      }
    }

    const el = e.target.closest('[data-action]');
    if (!el) {
      const menuWrap = document.getElementById('staggered-menu');
      if (menuWrap && !menuWrap.contains(e.target)) closeStaggeredMenu();
      return;
    }
    const action = el.dataset.action;
    const itemId = el.dataset.itemId;
    const qid = el.dataset.qid;
    const examId = el.dataset.examId;
    const moduleId = el.dataset.moduleId;
    const tab = el.dataset.tab;

    switch (action) {
      case 'landing':
        showLanding(tab === 'kb' ? 'kb' : 'learn');
        break;
      case 'go-learn':
        state.landingTab = 'learn';
        saveProgress();
        navigateTo('/');
        break;
      case 'bank':
        navigateTo('/bank');
        break;
      case 'exam-papers':
        navigateTo('/exams');
        break;
      case 'toggle-menu': toggleStaggeredMenu(); break;
      case 'toggle-course-submenu': toggleCourseSubmenu(el); break;
      case 'toggle-item': handleToggleItem(itemId); break;
      case 'toggle-module': handleToggleModule(moduleId); break;
      case 'toggle-item-expand': handleToggleItemExpand(itemId); break;
      case 'mark-item-done': handleMarkItemDone(itemId); break;
      case 'start-practice': handleStartPractice(itemId); break;
      case 'close-practice': handleClosePractice(itemId); break;
      case 'submit-item': handleSubmitItem(itemId); break;
      case 'retry-item': handleRetryItem(itemId); break;
      case 'next-item': handleNextItem(itemId); break;
      case 'show-inline-answer': handleShowInlineAnswer(qid); break;
      case 'select-option': handleSelectOption(el.dataset.value); break;
      case 'quiz-select-option': handleQuizSelectOption(itemId, qid, el.dataset.value); break;
      case 'submit-answer': handleSubmitAnswer(qid); break;
      case 'quiz-submit-answer': handleQuizSubmitAnswer(itemId, qid); break;
      case 'quiz-prev': handleQuizPrev(itemId); break;
      case 'quiz-next': handleQuizNext(itemId); break;
      case 'quiz-goto': handleQuizGoto(itemId, el.dataset.index); break;
      case 'quiz-finish': handleQuizFinish(itemId); break;
      case 'quiz-restart': handleQuizRestart(itemId); break;
      case 'quiz-toggle-order': handleQuizToggleOrder(itemId); break;
      case 'quiz-toggle-font': handleQuizToggleFont(itemId); break;
      case 'quiz-toggle-bg': handleQuizToggleBg(itemId); break;
      case 'quiz-show-answer': handleQuizShowAnswer(itemId, qid); break;
      case 'show-hint': handleShowHint(); break;
      case 'reset-answer': handleResetAnswer(); break;
      case 'next-question': handleNextQuestion(qid); break;
      case 'prev-question': handlePrevQuestion(qid); break;
      case 'history-back': window.history.back(); break;
      default: break;
    }
  });

  app.addEventListener('input', e => {
    const target = e.target;
    if (target.id === 'global-search') {
      updateSearch(target.value);
    } else if (target.id === 'kb-search') {
      updateKBSearch(target.value);
    } else if (target.id === 'bank-search') {
      state.search = target.value;
      showPracticeBank();
    } else if (target.classList.contains('question-input-field')) {
      const inlineRoot = target.closest('.inline-practice');
      const quizRoot = target.closest('.quiz-session');
      const qid = target.dataset.qid;
      if (inlineRoot && qid) {
        const question = findQuestion(qid);
        if (question) {
          setInlineAnswer(qid, collectUserAnswer(question, inlineRoot));
          delete state.inlineResults[qid];
          delete state.inlineShowAnswers[qid];
        }
      } else if (quizRoot && qid) {
        const question = findQuestion(qid);
        if (question && (question.questionType === questionTypes.singleChoice || question.questionType === questionTypes.trueFalse)) {
          handleQuizSelectOption(quizRoot.dataset.itemId, qid, target.dataset.value);
        }
      } else {
        const card = target.closest('.question-card');
        const cardQid = card?.dataset.qid;
        if (!cardQid || !state.currentQuestion || state.currentQuestion.id !== cardQid) return;
        state.userAnswer = collectUserAnswer(state.currentQuestion);
      }
    }
  });

  app.addEventListener('change', e => {
    const target = e.target;
    if (target.id === 'bank-kind') {
      state.bankFilter.kind = target.value;
      showPracticeBank();
    } else if (target.id === 'bank-course') {
      state.bankFilter.course = target.value;
      showPracticeBank();
    }
  });
}

function init() {
  loadProgress();
  setTheme(state.theme);
  renderAppShell();
  initEventDelegation();
  restoreLocation();
  initBackground(() => state.theme);

  window.addEventListener('popstate', () => {
    restoreLocation();
  });
}

document.addEventListener('DOMContentLoaded', init);
