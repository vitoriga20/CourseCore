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
  handleSubmitTheoryExamples,
  handleShowTheoryAnswer,
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
import { showPageLoader, hidePageLoader, initImageLoaders } from './components/loading.js';
import { initGuest, initAuth, signUp, signIn, signOut, resetPassword, updateUserProfile, getDefaultAvatar } from './services/auth.js';
import { showAuthModal, hideAuthModal, switchAuthTab, getActiveAuthTab } from './components/authModal.js';
import { updateUserMenu } from './components/userMenu.js';
import { renderUserPage } from './views/user/userPage.js';
import { renderAvatarPicker } from './components/avatarPicker.js';
import { handleAdminAction } from './views/admin/adminPage.js';

function renderAppShell() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <header class="sticky top-0 z-30 header-glass border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <a href="/" class="flex items-center">
          <img src="/logo-lockup.svg" class="h-8 w-auto" alt="CourseCore">
        </a>
        <div class="hidden md:flex items-center gap-6">
          <div class="search-wrap w-56">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input id="global-search" class="search-input" type="text" placeholder="查找课程、题型或试卷…">
          </div>
        </div>
        <div class="flex-1"></div>
        <div id="user-menu-container"></div>
      </div>
    </header>

    <div class="flex flex-1 max-w-7xl mx-auto w-full">
      <main id="main" class="main-content w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-12"></main>
    </div>

    <footer class="border-t mt-auto" style="border-color: var(--line);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center mb-4">
              <img src="/logo-lockup.svg" class="h-7 w-auto" alt="CourseCore">
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
              <li><a href="/terms" class="hover:text-[var(--fg)]">使用条款</a></li>
              <li><a href="/privacy" class="hover:text-[var(--fg)]">隐私政策</a></li>
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
          <div class="sm-panel-avatar">
            <button type="button" class="sm-avatar-btn" data-action="user-entry" title="${state.user ? state.user.name : '登录'}">
              <img src="${state.user ? state.user.avatar : getDefaultAvatar('Guest', 'e5e7eb')}" alt="用户头像" class="sm-avatar-img" loading="eager">
            </button>
          </div>
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

    <div id="auth-modal-container"></div>
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

function updateStaggeredMenuAuth() {
  const avatarBtn = document.querySelector('.sm-avatar-btn');
  const avatarImg = document.querySelector('.sm-avatar-img');
  if (!avatarBtn || !avatarImg) return;
  if (state.user) {
    avatarImg.src = state.user.avatar || getDefaultAvatar(state.user.name || 'Admin');
    avatarBtn.title = state.user.name || '用户中心';
  } else {
    avatarImg.src = getDefaultAvatar('Guest', 'e5e7eb');
    avatarBtn.title = '登录';
  }
}

function toggleStaggeredMenu() {
  const wrapper = document.getElementById('staggered-menu');
  if (wrapper?.getAttribute('data-open') === 'true') {
    closeStaggeredMenu();
  } else {
    updateStaggeredMenuAuth();
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

function toggleUserMenu() {
  const dropdown = document.getElementById('user-menu-dropdown');
  const toggle = document.querySelector('[data-action="toggle-user-menu"]');
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    dropdown.classList.remove('hidden');
    toggle?.setAttribute('aria-expanded', 'true');
  } else {
    dropdown.classList.add('hidden');
    toggle?.setAttribute('aria-expanded', 'false');
  }
}

function closeUserMenu() {
  const dropdown = document.getElementById('user-menu-dropdown');
  const toggle = document.querySelector('[data-action="toggle-user-menu"]');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    dropdown.classList.add('hidden');
    toggle?.setAttribute('aria-expanded', 'false');
  }
}

function showAuthMessage(text, type) {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = `auth-message ${type}`;
}

function getAuthSubmitLabel(tab) {
  const labels = { login: '登录', signup: '注册', reset: '发送重置邮件' };
  return labels[tab] || '提交';
}

async function handleAuthSubmit() {
  const tab = getActiveAuthTab();
  const email = document.getElementById('auth-email')?.value.trim() || '';
  const password = document.getElementById('auth-password')?.value || '';
  const confirm = document.getElementById('auth-password-confirm')?.value || '';

  if (!email) {
    showAuthMessage('请输入邮箱', 'error');
    return;
  }

  if (tab !== 'reset' && !password) {
    showAuthMessage('请输入密码', 'error');
    return;
  }

  if (tab === 'signup' && password !== confirm) {
    showAuthMessage('两次输入的密码不一致', 'error');
    return;
  }

  if (tab === 'signup') {
    const consent = document.getElementById('auth-consent')?.checked;
    if (!consent) {
      showAuthMessage('请同意用户协议与隐私政策后注册', 'error');
      return;
    }
  }

  const submitBtn = document.querySelector('[data-action="auth-submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
  }

  try {
    if (tab === 'login') {
      await signIn(email, password);
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
      }
      setTimeout(() => {
        hideAuthModal();
      }, 1200);
    } else if (tab === 'signup') {
      await signUp(email, password);
      showAuthMessage('注册成功，请查收确认邮件（如启用邮箱验证）后登录。', 'success');
    } else if (tab === 'reset') {
      await resetPassword(email);
      showAuthMessage('重置邮件已发送，请查收。', 'success');
    }
  } catch (err) {
    showAuthMessage(err?.message || '操作失败，请重试', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      if (!submitBtn.classList.contains('success')) {
        submitBtn.classList.remove('success');
      }
    }
  }
}

async function handleLogout() {
  try {
    await signOut();
    updateUserMenu();
    updateStaggeredMenuAuth();
  } catch (err) {
    console.error('Logout failed', err);
  }
}

function openAvatarPicker() {
  const container = document.getElementById('avatar-picker-container');
  if (!container) return;
  container.innerHTML = renderAvatarPicker(state.user?.avatar || '');
}

function closeAvatarPicker() {
  const container = document.getElementById('avatar-picker-container');
  if (container) container.innerHTML = '';
}

function startEditUserName() {
  const nameEl = document.getElementById('user-display-name');
  if (!nameEl) return;
  const current = state.user?.name || '管理员';
  nameEl.outerHTML = `
    <input type="text" id="user-name-input" class="user-name-input" value="${escapeHtml(current)}" maxlength="20" autocomplete="off">
  `;
  const input = document.getElementById('user-name-input');
  if (input) {
    input.focus();
    input.select();
    input.addEventListener('blur', finishEditUserName);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditUserName();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditUserName();
      }
    });
  }
}

function finishEditUserName() {
  const input = document.getElementById('user-name-input');
  if (!input) return;
  const value = input.value.trim();
  if (value && state.user && value !== state.user.name) {
    updateUserProfile({ name: value });
  }
  renderUserName(value || state.user?.name || '管理员');
}

function cancelEditUserName() {
  renderUserName(state.user?.name || '管理员');
}

function renderUserName(name) {
  const input = document.getElementById('user-name-input');
  if (!input) return;
  input.outerHTML = `<span class="user-name" id="user-display-name">${escapeHtml(name)}</span>`;
}

function initEventDelegation() {
  const app = document.getElementById('app');
  if (!app) return;

  app.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        const pathname = href.split('#')[0];
        if (isInternalPath(pathname)) {
          e.preventDefault();
          closeStaggeredMenu();
          navigateTo(href);
          return;
        }
      }
    }

    const el = e.target.closest('[data-action]');
    if (!el) {
      const menuWrap = document.getElementById('staggered-menu');
      if (menuWrap && !menuWrap.contains(e.target)) closeStaggeredMenu();
      const userMenu = document.querySelector('.user-menu');
      if (userMenu && !userMenu.contains(e.target)) closeUserMenu();
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
      case 'submit-theory-examples': handleSubmitTheoryExamples(itemId); break;
      case 'show-theory-answer': handleShowTheoryAnswer(qid); break;
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
      case 'auth-open':
        closeStaggeredMenu();
        showAuthModal(tab || 'login');
        break;
      case 'auth-close': {
        const overlay = document.getElementById('auth-modal-overlay');
        const isOverlayBackground = overlay && e.target === overlay;
        const isCloseButton = e.target.closest('.auth-modal-close');
        if (isOverlayBackground || isCloseButton) {
          hideAuthModal();
        }
        break;
      }
      case 'auth-close-navigate':
        hideAuthModal();
        if (el.dataset.target) navigateTo(el.dataset.target);
        break;
      case 'auth-tab': switchAuthTab(tab || 'login'); break;
      case 'auth-submit': handleAuthSubmit(); break;
      case 'logout':
        closeStaggeredMenu();
        handleLogout();
        break;
      case 'logout-from-user-page':
        handleLogout();
        navigateTo('/');
        break;
      case 'user-page-back':
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigateTo('/');
        }
        break;
      case 'heatmap-prev-year':
        state.userHeatmapYear = (state.userHeatmapYear || new Date().getFullYear()) - 1;
        navigateTo('/user', { replace: true });
        break;
      case 'heatmap-next-year':
        state.userHeatmapYear = (state.userHeatmapYear || new Date().getFullYear()) + 1;
        navigateTo('/user', { replace: true });
        break;
      case 'user-entry':
        closeStaggeredMenu();
        if (state.user) {
          navigateTo('/user');
        } else {
          showAuthModal('login');
        }
        break;
      case 'open-avatar-picker':
        openAvatarPicker();
        break;
      case 'close-avatar-picker': {
        const pickerOverlay = document.getElementById('avatar-picker-overlay');
        const isPickerBackground = pickerOverlay && e.target === pickerOverlay;
        const isPickerClose = e.target.closest('.avatar-picker-close');
        if (isPickerBackground || isPickerClose) {
          closeAvatarPicker();
        }
        break;
      }
      case 'select-avatar':
        if (el.dataset.avatar) {
          updateUserProfile({ avatar: el.dataset.avatar });
          closeAvatarPicker();
        }
        break;
      case 'edit-user-name':
        startEditUserName();
        break;
      case 'toggle-user-menu': toggleUserMenu(); break;
      case 'admin-section':
      case 'admin-toggle-group':
      case 'admin-add':
      case 'admin-edit':
      case 'admin-delete':
      case 'admin-modal-close':
      case 'admin-modal-noop':
      case 'admin-modal-save':
      case 'admin-refresh':
      case 'admin-edit-theory':
      case 'admin-edit-practice':
      case 'admin-back-list':
      case 'admin-add-example':
      case 'admin-remove-example':
      case 'admin-toggle-example':
      case 'admin-save-theory':
      case 'admin-practice-select':
      case 'admin-practice-add':
      case 'admin-practice-remove':
      case 'admin-practice-move-up':
      case 'admin-practice-move-down':
      case 'admin-practice-type':
      case 'admin-save-practice':
        handleAdminAction(action, el);
        break;
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

async function init() {
  initGuest();
  loadProgress();
  setTheme(state.theme);
  renderAppShell();
  initEventDelegation();
  showPageLoader('CourseCore');
  initBackground(() => state.theme);

  window.addEventListener('cc-auth-change', () => {
    updateUserMenu();
    updateStaggeredMenuAuth();
  });

  await initAuth();
  updateUserMenu();
  await restoreLocation();

  window.addEventListener('popstate', async () => {
    await restoreLocation();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideAuthModal();
  });
}


document.addEventListener('DOMContentLoaded', init);
