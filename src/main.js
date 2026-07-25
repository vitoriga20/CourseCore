import './style.css';
import { state, loadProgress, saveProgress, setInlineAnswer } from './state.js';
import { setTheme } from './theme.js';
import { initBackground } from './background.js';
import { COURSES } from './data/courses.js';
import { PLATFORM } from './data/platform.js';
import { escapeHtml } from './utils.js';
import { collectUserAnswer } from './utils/answer-collector.js';
import { findQuestion } from './utils/question.js';
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
import { renderLandingContent } from './views/landing.js';

function renderAppShell() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <header class="sticky top-0 z-30 header-glass border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="/" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full border flex items-center justify-center" style="border-color: var(--accent);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
            <span class="text-xl font-bold tracking-tight">${escapeHtml(PLATFORM.name)}</span>
          </a>
        </div>
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

function initEventDelegation() {
  const app = document.getElementById('app');
  if (!app) return;

  app.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && isInternalPath(href)) {
        e.preventDefault();
        navigateTo(href);
        return;
      }
    }

    const el = e.target.closest('[data-action]');
    if (!el) return;
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
      case 'submit-answer': handleSubmitAnswer(qid); break;
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
      const qid = target.dataset.qid;
      if (inlineRoot && qid) {
        const question = findQuestion(qid);
        if (question) {
          setInlineAnswer(qid, collectUserAnswer(question, inlineRoot));
          delete state.inlineResults[qid];
          delete state.inlineShowAnswers[qid];
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
