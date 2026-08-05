import { formatAnswerDisplay, getItemQuestions } from '../utils/question.js';
import { COURSES } from '../data/courses.js';
import { escapeHtml } from '../utils.js';
import { renderQuestion } from './question/index.js';
import { validate } from '../validators/index.js';
import { collectUserAnswer, isEmptyAnswer } from '../utils/answer-collector.js';
import { markQuestion, syncItemProgress, setLastSession } from '../state.js';
import { submitTypes } from '../config/question-types.js';
import { initQuizBackground, destroyQuizBackground } from '../quiz-background.js';
import { renderSpinner, renderButtonLoader, initImageLoaders } from '../components/loading.js';

const quizStates = new Map();

const FONT_MODES = ['serif', 'sans'];
const FONT_LABELS = { serif: '衬线', sans: '无衬线' };
const BG_MODES = ['geo', 'plain'];
const BG_LABELS = { geo: '几何', plain: '素白' };
const ORDER_MODES = ['sequential', 'random'];
const ORDER_LABELS = { sequential: '顺序', random: '随机' };
const PRACTICE_MODES = ['standard', 'exam', 'memorize'];
const PRACTICE_LABELS = { standard: '标准', exam: '考试', memorize: '背题' };
const FONT_SIZE_MODES = ['sm', 'md', 'lg'];
const FONT_SIZE_LABELS = { sm: '小', md: '中', lg: '大' };

let keyboardListener = null;
let settingsOutsideClickListener = null;

function loadQuizPreference(key, defaultValue) {
  try {
    const v = localStorage.getItem(`quiz-${key}`);
    return v !== null ? v : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveQuizPreference(key, value) {
  try {
    localStorage.setItem(`quiz-${key}`, value);
  } catch {
    // ignore
  }
}

function getContainer(itemId) {
  return document.querySelector(`.quiz-session[data-item-id="${itemId}"]`);
}

function shuffleArray(arr, seed) {
  const result = arr.slice();
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// 题目文本中 Markdown 转义的下划线（\_）还原为普通下划线，
// 避免填空题占位符在未走 Markdown 渲染时显示成 \_\_\_\_
function normalizeText(text) {
  if (!text) return text;
  return text.replace(/\\_/g, '_');
}

function getItemTitle(itemId) {
  for (const c of COURSES) {
    for (const m of c.modules) {
      for (const i of m.items) {
        if (i.id === itemId) return i.title;
      }
    }
  }
  return '';
}

function createState(itemId, externalQuestions = null) {
  const sourceQuestions = externalQuestions || getItemQuestions(itemId);
  // 外部注入题目（刷题中心入口）按原始试卷顺序，不再重排；
  // 兜底 getItemQuestions 路径保留按尾部编号排序的行为
  const allQuestions = externalQuestions
    ? sourceQuestions.slice()
    : sourceQuestions.slice().sort((a, b) => {
        const idxA = Number(a.id.split('-').pop());
        const idxB = Number(b.id.split('-').pop());
        return idxA - idxB;
      });

  return {
    itemId,
    allQuestions,
    order: allQuestions.map((_, i) => i),
    userAnswers: {},
    results: {},
    showAnswers: {},
    examAnswers: {},
    currentIndex: 0,
    mode: loadQuizPreference('order', 'sequential'),
    seed: seedFromString(itemId),
    practiceMode: loadQuizPreference('practice-mode', 'standard'),
    font: loadQuizPreference('font', 'serif'),
    fontSize: loadQuizPreference('font-size', 'md'),
    bg: loadQuizPreference('bg', 'geo'),
    autoNext: loadQuizPreference('auto-next', 'true') === 'true',
    shortcuts: loadQuizPreference('shortcuts', 'true') === 'true',
    settingsOpen: false,
    finished: false
  };
}

function getState(itemId, externalQuestions = null) {
  if (!quizStates.has(itemId)) {
    quizStates.set(itemId, createState(itemId, externalQuestions));
  }
  return quizStates.get(itemId);
}

function currentQuestion(state) {
  return state.allQuestions[state.order[state.currentIndex]];
}

function userAnswerFor(state, qid) {
  return state.userAnswers[qid] ?? null;
}

function resultFor(state, qid) {
  return state.results[qid] ?? null;
}

function showAnswerFor(state, qid) {
  return state.showAnswers[qid] ?? false;
}

function resetOrder(state) {
  state.order = state.allQuestions.map((_, i) => i);
  if (state.mode === 'random') {
    state.order = shuffleArray(state.order, state.seed);
  }
}

function updateBodyBg(bg) {
  document.body.setAttribute('data-bg', bg);
}

function restoreBodyBg() {
  document.body.removeAttribute('data-bg');
}

function renderSettingsOption(label, active, action, value, itemId) {
  return `<button class="quiz-set-opt ${active ? 'active' : ''}" data-action="${action}" data-item-id="${itemId}" data-value="${value}">${label}</button>`;
}

function renderSettingsToggle(label, on, action, itemId) {
  return `<button class="quiz-set-toggle ${on ? 'on' : 'off'}" data-action="${action}" data-item-id="${itemId}" role="switch" aria-checked="${on}"><span class="quiz-set-toggle-dot"></span>${label}</button>`;
}

function renderSettingsMenu(state) {
  const itemId = state.itemId;
  const isMemorize = state.practiceMode === 'memorize';
  return `
    <div class="quiz-settings-menu" ${state.settingsOpen ? '' : 'hidden'} role="menu">
      <div class="quiz-set-group">
        <div class="quiz-set-label">刷题模式</div>
        <div class="quiz-set-row">
          ${PRACTICE_MODES.map(m => renderSettingsOption(PRACTICE_LABELS[m], state.practiceMode === m, 'quiz-set-mode', m, itemId)).join('')}
        </div>
        <div class="quiz-set-hint">${
          state.practiceMode === 'standard' ? '即时判分，答错可查看解析'
          : state.practiceMode === 'exam' ? '答完所有题交卷后统一判分'
          : '答案自动展示，仅浏览，不计入错题库'
        }</div>
      </div>
      ${isMemorize ? '' : `
      <div class="quiz-set-group">
        <div class="quiz-set-label">题目顺序</div>
        <div class="quiz-set-row">
          ${ORDER_MODES.map(m => renderSettingsOption(ORDER_LABELS[m], state.mode === m, 'quiz-set-order', m, itemId)).join('')}
        </div>
      </div>`}
      <div class="quiz-set-group">
        <div class="quiz-set-label">字体</div>
        <div class="quiz-set-row">
          ${FONT_MODES.map(m => renderSettingsOption(FONT_LABELS[m], state.font === m, 'quiz-set-font', m, itemId)).join('')}
        </div>
        <div class="quiz-set-label mt-3">字号</div>
        <div class="quiz-set-row">
          ${FONT_SIZE_MODES.map(m => renderSettingsOption(FONT_SIZE_LABELS[m], state.fontSize === m, 'quiz-set-font-size', m, itemId)).join('')}
        </div>
      </div>
      <div class="quiz-set-group">
        <div class="quiz-set-label">背景</div>
        <div class="quiz-set-row">
          ${BG_MODES.map(m => renderSettingsOption(BG_LABELS[m], state.bg === m, 'quiz-set-bg', m, itemId)).join('')}
        </div>
      </div>
      ${isMemorize ? '' : `
      <div class="quiz-set-group">
        ${renderSettingsToggle('自动跳下一题', state.autoNext, 'quiz-toggle-auto-next', itemId)}
      </div>`}
      <div class="quiz-set-group">
        ${renderSettingsToggle('键盘快捷键', state.shortcuts, 'quiz-toggle-shortcuts', itemId)}
        <div class="quiz-set-hint">← / → 切换题号</div>
      </div>
      <div class="quiz-set-group">
        <button class="quiz-set-action" data-action="quiz-reset-session" data-item-id="${itemId}">重置当前会话</button>
      </div>
    </div>
  `;
}

function renderControlBar(state) {
  const progress = state.allQuestions.length > 0
    ? Math.round(((state.currentIndex + (state.finished ? 1 : 0)) / state.allQuestions.length) * 100)
    : 0;

  return `
    <div class="quiz-control-bar">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="quiz-mode-badge mode-${state.practiceMode}">${PRACTICE_LABELS[state.practiceMode]}</span>
          <span class="text-sm font-medium" style="color: var(--fg);">${escapeHtml(getItemTitle(state.itemId))}</span>
        </div>
        <div class="quiz-settings" data-item-id="${state.itemId}">
          <button class="quiz-settings-btn ${state.settingsOpen ? 'active' : ''}" data-action="quiz-toggle-settings" data-item-id="${state.itemId}" aria-expanded="${state.settingsOpen}" aria-label="刷题设置">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          ${renderSettingsMenu(state)}
        </div>
      </div>
      <div class="quiz-progress-track">
        <div class="quiz-progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>
  `;
}

function renderFeedback(question, result, showAnswer, practiceMode) {
  if (practiceMode !== 'standard') return '';
  if (!result && !showAnswer) return '';

  if (result?.manual) {
    return `
      <div class="quiz-feedback quiz-feedback-warning">
        <div class="font-bold">请对照参考答案自行检查</div>
      </div>
    `;
  }

  if (result?.passed) {
    return `
      <div class="quiz-feedback quiz-feedback-success">
        <div class="font-bold">回答正确</div>
      </div>
    `;
  }

  if (result && !result.passed) {
    return `
      <div class="quiz-feedback quiz-feedback-error">
        <div class="flex flex-wrap items-center gap-3 font-bold">
          <span>回答错误</span>
          ${!showAnswer ? `<button class="quiz-chip" data-action="quiz-show-answer" data-item-id="${question.itemId}" data-qid="${question.id}">查看答案</button>` : ''}
        </div>
      </div>
    `;
  }

  return '';
}

function renderSolution(question, result, showAnswer, practiceMode) {
  if (practiceMode === 'memorize') {
    return `
      <div class="quiz-solution">
        <h4 class="font-bold mb-2">解析</h4>
        <div class="text-sm" style="color: var(--fg);">${question.solution || '暂无解析'}</div>
        ${question.answer !== undefined && question.answer !== null && question.answer !== ''
          ? `<div class="mt-3 text-sm font-semibold">答案：${escapeHtml(String(formatAnswerDisplay(question)))}</div>`
          : ''}
      </div>
    `;
  }
  if (practiceMode === 'exam') return '';
  if (!showAnswer && !(result?.passed || result?.manual)) return '';

  return `
    <div class="quiz-solution">
      <h4 class="font-bold mb-2">解析</h4>
      <div class="text-sm" style="color: var(--fg);">${question.solution || '暂无解析'}</div>
      ${question.answer !== undefined && question.answer !== null && question.answer !== ''
        ? `<div class="mt-3 text-sm font-semibold">答案：${escapeHtml(String(formatAnswerDisplay(question)))}</div>`
        : ''}
    </div>
  `;
}

function renderCurrentQuestion(state) {
  const q = currentQuestion(state);
  if (!q) return '';

  const qid = q.id;
  const userAnswer = userAnswerFor(state, qid);
  const result = resultFor(state, qid);
  const showAnswer = showAnswerFor(state, qid);
  const submitType = submitTypes[q.questionType];
  const isInstant = submitType === 'instant';
  const mode = state.practiceMode;
  const isMemorize = mode === 'memorize';
  const isExam = mode === 'exam';
  const examSaved = state.examAnswers[qid];

  // 背题模式：禁用作答，只展示题面 + 答案
  const content = isMemorize
    ? `<fieldset disabled>${renderQuestion(q, { inline: true, userAnswer: null, selectAction: null })}</fieldset>`
    : renderQuestion(q, { inline: true, userAnswer, selectAction: 'quiz-select-option' });

  // 提交/保存按钮逻辑
  let actionBtn = '';
  if (isMemorize) {
    actionBtn = '';
  } else if (isExam) {
    actionBtn = examSaved
      ? `<button class="quiz-btn mt-4" disabled>已保存</button>`
      : `<button class="quiz-btn quiz-btn-primary mt-4" data-action="quiz-submit-answer" data-item-id="${state.itemId}" data-qid="${qid}">保存答案</button>`;
  } else if (!isInstant && !result && !showAnswer) {
    actionBtn = `<button class="quiz-btn quiz-btn-primary mt-4" data-action="quiz-submit-answer" data-item-id="${state.itemId}" data-qid="${qid}">提交答案</button>`;
  }

  return `
    <article class="quiz-question-card" data-qid="${qid}" data-item-id="${state.itemId}">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs font-semibold px-2 py-1 rounded" style="background: var(--accent); color: var(--bg);">第 ${state.currentIndex + 1} / ${state.allQuestions.length} 题</span>
        ${isExam && examSaved ? `<span class="text-xs px-2 py-1 rounded" style="background: var(--success); color: var(--bg);">已答</span>` : ''}
      </div>
      <h3 class="quiz-question-title">${escapeHtml(normalizeText(q.title || '题目'))}</h3>
      <div class="quiz-question-content">${normalizeText(q.content)}</div>
      ${content}
      ${actionBtn}
      ${renderFeedback(q, result, showAnswer, mode)}
      ${renderSolution(q, result, showAnswer, mode)}
    </article>
  `;
}

function renderNavButton(state, displayIdx, q) {
  const qid = q.id;
  const result = resultFor(state, qid);
  const isCurrent = displayIdx === state.currentIndex;
  let statusClass = '';
  if (state.practiceMode === 'memorize') {
    statusClass = '';
  } else if (state.practiceMode === 'exam') {
    if (state.examAnswers[qid]) statusClass = 'answered';
  } else if (result) {
    statusClass = result.passed ? 'correct' : (result.manual ? 'manual' : 'wrong');
  } else if (userAnswerFor(state, qid) !== null) {
    statusClass = 'answered';
  }

  return `
    <button class="quiz-nav-btn ${isCurrent ? 'current' : ''} ${statusClass}"
      data-action="quiz-goto" data-item-id="${state.itemId}" data-index="${displayIdx}">
      ${displayIdx + 1}
    </button>
  `;
}

function renderNav(state) {
  return `
    <div class="quiz-nav">
      <div class="text-xs font-semibold mb-2" style="color: var(--muted);">题号导航</div>
      <div class="quiz-nav-grid">
        ${state.order.map((origIdx, displayIdx) => renderNavButton(state, displayIdx, state.allQuestions[origIdx])).join('')}
      </div>
    </div>
  `;
}

function renderBottomActions(state) {
  const isMemorize = state.practiceMode === 'memorize';
  const isExam = state.practiceMode === 'exam';
  const isLast = state.currentIndex === state.allQuestions.length - 1;

  let primaryBtn = '';
  if (isMemorize) {
    primaryBtn = isLast
      ? `<button class="quiz-btn" disabled>已到最后一题</button>`
      : `<button class="quiz-btn quiz-btn-primary" data-action="quiz-next" data-item-id="${state.itemId}">下一题</button>`;
  } else if (isLast && !state.finished) {
    primaryBtn = `<button class="quiz-btn quiz-btn-primary" data-action="quiz-finish" data-item-id="${state.itemId}">${isExam ? '交卷' : '完成练习'}</button>`;
  } else {
    primaryBtn = `<button class="quiz-btn quiz-btn-primary" data-action="quiz-next" data-item-id="${state.itemId}">下一题</button>`;
  }

  return `
    <div class="quiz-bottom-actions">
      <button class="quiz-btn" data-action="quiz-prev" data-item-id="${state.itemId}" ${state.currentIndex === 0 ? 'disabled' : ''}>上一题</button>
      ${primaryBtn}
    </div>
  `;
}

function renderResults(state) {
  const total = state.allQuestions.length;
  const correct = state.allQuestions.filter(q => {
    const r = resultFor(state, q.id);
    return r && r.passed;
  }).length;
  const manual = state.allQuestions.filter(q => {
    const r = resultFor(state, q.id);
    return r && r.manual;
  }).length;
  const wrong = state.allQuestions.filter(q => {
    const r = resultFor(state, q.id);
    return r && !r.passed && !r.manual;
  });
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const itemId = state.itemId;

  // 状态标签：全部通过时给"掌握"，否则提示"未掌握"
  const statusTag = wrong.length === 0
    ? `<span class="summary-status-tag ok">全部掌握</span>`
    : `<span class="summary-status-tag warn">${wrong.length} 题未掌握</span>`;

  // 错题列表（诊断 + 行动）
  const wrongList = wrong.length > 0
    ? wrong.map((q, i) => `
        <div class="wrong-item">
          <span class="wrong-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="wrong-title">${escapeHtml(normalizeText(q.title || '题目'))}</span>
        </div>`).join('')
    : `<div class="empty-state">全部答对，干得漂亮！</div>`;

  return `
    <div class="quiz-results">
      <h2 class="text-2xl font-bold mb-6" style="color: var(--fg);">练习完成</h2>
      <div class="summary-grid">
        <div class="summary-left">
          <div class="summary-hero">
            <div class="summary-score">${correct} <span class="summary-total">/ ${total}</span></div>
            <div class="summary-rate">正确率 ${rate}%</div>
            ${statusTag}
            ${manual > 0 ? `<div class="summary-manual">含 ${manual} 题需自行对照参考答案</div>` : ''}
          </div>
          <div class="summary-actions">
            <button class="quiz-btn quiz-btn-primary" data-action="quiz-restart" data-item-id="${itemId}">重新开始</button>
            <a href="/item/${itemId}" class="quiz-btn">复习本节</a>
          </div>
        </div>
        <div class="summary-right">
          <h3 class="summary-right-title">错题回顾</h3>
          <div class="wrong-list">${wrongList}</div>
          <div class="summary-tip">未掌握题目将自动进入错题库，按复习曲线安排复盘。</div>
        </div>
      </div>
    </div>
  `;
}

function renderQuizContent(state) {
  if (state.finished) {
    return renderResults(state);
  }

  return `
    <div class="quiz-layout">
      <div class="quiz-main">
        ${renderCurrentQuestion(state)}
        ${renderBottomActions(state)}
      </div>
      <aside class="quiz-sidebar hidden lg:block">
        ${renderNav(state)}
      </aside>
    </div>
    <div class="quiz-mobile-nav lg:hidden">
      ${renderNav(state)}
    </div>
  `;
}

export function renderQuizSession(itemId) {
  return `
    <div class="quiz-session" data-item-id="${itemId}" data-font="serif" data-bg="geo">
      <div class="quiz-loading">
        ${renderSpinner({ size: 'lg' })}
        <span>加载测验中…</span>
      </div>
    </div>
  `;
}

export function initQuizSession(itemId, externalQuestions = null) {
  const state = getState(itemId, externalQuestions);
  const container = getContainer(itemId);
  if (!container) return state;

  applyContainerAttrs(container, state);
  updateBodyBg(state.bg);
  initQuizBackground();

  container.innerHTML = renderControlBar(state) + renderQuizContent(state);
  typeset(container);
  initImageLoaders(container);
  attachKeyboardListener(itemId);
  attachSettingsOutsideClickListener();
  return state;
}

function applyContainerAttrs(container, state) {
  container.setAttribute('data-font', state.font);
  container.setAttribute('data-font-size', state.fontSize);
  container.setAttribute('data-bg', state.bg);
  container.setAttribute('data-practice-mode', state.practiceMode);
}

function typeset(element) {
  if (window.MathJax && window.MathJax.typesetPromise && element) {
    window.MathJax.typesetPromise([element]).catch(() => {});
  }
}

function rerender(itemId) {
  const container = getContainer(itemId);
  if (!container) return;
  const state = getState(itemId);
  applyContainerAttrs(container, state);
  updateBodyBg(state.bg);
  container.innerHTML = renderControlBar(state) + renderQuizContent(state);
  typeset(container);
  initImageLoaders(container);
}

function attachKeyboardListener(itemId) {
  detachKeyboardListener();
  keyboardListener = (e) => {
    const state = getState(itemId);
    if (!state || !state.shortcuts || state.finished) return;
    if (state.settingsOpen) return;
    // 忽略输入框内的按键
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleQuizPrev(itemId);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleQuizNext(itemId);
    }
  };
  document.addEventListener('keydown', keyboardListener);
}

function detachKeyboardListener() {
  if (keyboardListener) {
    document.removeEventListener('keydown', keyboardListener);
    keyboardListener = null;
  }
}

function attachSettingsOutsideClickListener() {
  detachSettingsOutsideClickListener();
  // 采用 Radix UI 的 pointerdown 模式：pointerdown 先于 click 触发，
  // 点击齿轮时 menu 尚未打开 → listener 直接 return，不会与 toggle 冲突；
  // menu 打开后，下一次外部 pointerdown 才关闭。
  settingsOutsideClickListener = (e) => {
    const openMenu = document.querySelector('.quiz-settings-menu:not([hidden])');
    if (!openMenu) return;
    const wrap = openMenu.closest('.quiz-settings');
    if (wrap && !wrap.contains(e.target)) {
      const itemId = wrap.dataset.itemId;
      if (itemId) {
        const state = getState(itemId);
        if (state && state.settingsOpen) {
          state.settingsOpen = false;
          rerender(itemId);
        }
      }
    }
  };
  document.addEventListener('pointerdown', settingsOutsideClickListener);
}

function detachSettingsOutsideClickListener() {
  if (settingsOutsideClickListener) {
    document.removeEventListener('pointerdown', settingsOutsideClickListener);
    settingsOutsideClickListener = null;
  }
}

function getQuestionRoot(itemId, qid) {
  const container = getContainer(itemId);
  if (!container) return null;
  return container.querySelector(`[data-qid="${qid}"]`);
}

function submitCurrentAnswer(itemId, qid) {
  const state = getState(itemId);
  const question = state.allQuestions.find(q => q.id === qid);
  if (!question) return;
  const mode = state.practiceMode;

  // 背题模式：无作答
  if (mode === 'memorize') return;

  const root = getQuestionRoot(itemId, qid);
  const userAnswer = collectUserAnswer(question, root);

  if (isEmptyAnswer(userAnswer)) {
    alert('请先输入或选择答案');
    return;
  }

  // 考试模式：仅保存答案，不判分
  if (mode === 'exam') {
    state.userAnswers[qid] = userAnswer;
    state.examAnswers[qid] = true;
    rerender(itemId);
    if (state.autoNext && state.currentIndex < state.allQuestions.length - 1) {
      setTimeout(() => handleQuizNext(itemId), 200);
    }
    return;
  }

  // 标准模式：即时判分
  const submitBtn = document.querySelector(`[data-action="quiz-submit-answer"][data-item-id="${itemId}"][data-qid="${qid}"]`);
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = renderButtonLoader();
  }

  state.userAnswers[qid] = userAnswer;

  let result;
  try {
    result = validate(question, userAnswer);
  } catch (e) {
    console.error(e);
    result = { passed: false, userAnswer, correctAnswer: question.answer, message: '验证出错：' + e.message, manual: false };
  }
  state.results[qid] = result;

  if (!result.manual) {
    markQuestion(qid, result);
  }

  syncItemProgress(itemId);
  rerender(itemId);

  // 自动跳下一题：标准模式下 instant 题型答对，或开启了 autoNext 且答对
  const submitType = submitTypes[question.questionType];
  const isInstant = submitType === 'instant';
  if (result.passed && state.currentIndex < state.allQuestions.length - 1) {
    if (isInstant || state.autoNext) {
      setTimeout(() => handleQuizNext(itemId), isInstant ? 600 : 300);
    }
  }
}

export function handleQuizPrev(itemId) {
  const state = getState(itemId);
  if (state.currentIndex > 0) {
    state.currentIndex--;
    rerender(itemId);
  }
}

export function handleQuizNext(itemId) {
  const state = getState(itemId);
  if (state.currentIndex < state.allQuestions.length - 1) {
    state.currentIndex++;
    rerender(itemId);
  }
}

export function handleQuizGoto(itemId, index) {
  const state = getState(itemId);
  const idx = Number(index);
  if (idx >= 0 && idx < state.allQuestions.length) {
    state.currentIndex = idx;
    rerender(itemId);
  }
}

export function handleQuizFinish(itemId) {
  const state = getState(itemId);
  const mode = state.practiceMode;

  if (mode === 'memorize') {
    // 背题模式无完成概念
    return;
  }

  if (mode === 'exam') {
    // 考试模式：检查全部已答，然后统一判分
    const unanswered = state.allQuestions.filter(q => !state.examAnswers[q.id] && state.userAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`还有 ${unanswered.length} 题未作答，请完成后再交卷`);
      return;
    }
    // 统一判分
    state.allQuestions.forEach(q => {
      const ans = state.userAnswers[q.id];
      let result;
      try {
        result = validate(q, ans);
      } catch (e) {
        result = { passed: false, userAnswer: ans, correctAnswer: q.answer, message: '验证出错', manual: false };
      }
      state.results[q.id] = result;
      if (!result.manual) markQuestion(q.id, result);
    });
    syncItemProgress(itemId);
    state.finished = true;
    try {
      const correct = state.allQuestions.filter(q => {
        const r = resultFor(state, q.id);
        return r && r.passed;
      }).length;
      setLastSession({
        itemId: state.itemId,
        title: getItemTitle(state.itemId),
        lastIndex: state.allQuestions.length - 1,
        total: state.allQuestions.length,
        correct
      });
    } catch (e) { console.warn('[quizSession] lastSession:', e); }
    rerender(itemId);
    if (typeof state.onFinish === 'function') {
      try { state.onFinish(state); } catch (e) { console.warn('[quizSession] onFinish:', e); }
    }
    return;
  }

  // 标准模式
  const answered = state.allQuestions.filter(q => {
    const r = resultFor(state, q.id);
    return r || state.userAnswers[q.id] !== undefined;
  }).length;

  if (answered < state.allQuestions.length) {
    alert(`还有 ${state.allQuestions.length - answered} 题未完成，请继续作答`);
    return;
  }

  state.finished = true;
  try {
    const correct = state.allQuestions.filter(q => {
      const r = resultFor(state, q.id);
      return r && r.passed;
    }).length;
    setLastSession({
      itemId: state.itemId,
      title: getItemTitle(state.itemId),
      lastIndex: state.allQuestions.length - 1,
      total: state.allQuestions.length,
      correct
    });
  } catch (e) { console.warn('[quizSession] lastSession:', e); }
  rerender(itemId);
  if (typeof state.onFinish === 'function') {
    try { state.onFinish(state); } catch (e) { console.warn('[quizSession] onFinish:', e); }
  }
}

export function handleQuizRestart(itemId) {
  const state = getState(itemId);
  resetSessionData(state);
  rerender(itemId);
}

// ============ 设置菜单 handlers ============

export function handleQuizToggleSettings(itemId) {
  const state = getState(itemId);
  state.settingsOpen = !state.settingsOpen;
  rerender(itemId);
}

function resetSessionData(state) {
  // 清空作答与判分，保留 allQuestions / order / 偏好
  state.userAnswers = {};
  state.results = {};
  state.showAnswers = {};
  state.examAnswers = {};
  state.currentIndex = 0;
  state.finished = false;
  state.settingsOpen = false;
  resetOrder(state);
}

export function handleQuizSetMode(itemId, value) {
  if (!PRACTICE_MODES.includes(value)) return;
  const state = getState(itemId);
  if (state.practiceMode === value) return;
  saveQuizPreference('practice-mode', value);
  state.practiceMode = value;
  resetSessionData(state);
  rerender(itemId);
}

export function handleQuizSetOrder(itemId, value) {
  if (!ORDER_MODES.includes(value)) return;
  const state = getState(itemId);
  state.mode = value;
  saveQuizPreference('order', value);
  if (value === 'random') state.seed = Date.now();
  resetOrder(state);
  state.currentIndex = 0;
  rerender(itemId);
}

export function handleQuizSetFont(itemId, value) {
  if (!FONT_MODES.includes(value)) return;
  const state = getState(itemId);
  state.font = value;
  saveQuizPreference('font', value);
  rerender(itemId);
}

export function handleQuizSetFontSize(itemId, value) {
  if (!FONT_SIZE_MODES.includes(value)) return;
  const state = getState(itemId);
  state.fontSize = value;
  saveQuizPreference('font-size', value);
  rerender(itemId);
}

export function handleQuizSetBg(itemId, value) {
  if (!BG_MODES.includes(value)) return;
  const state = getState(itemId);
  state.bg = value;
  saveQuizPreference('bg', value);
  updateBodyBg(state.bg);
  rerender(itemId);
}

export function handleQuizToggleAutoNext(itemId) {
  const state = getState(itemId);
  state.autoNext = !state.autoNext;
  saveQuizPreference('auto-next', String(state.autoNext));
  rerender(itemId);
}

export function handleQuizToggleShortcuts(itemId) {
  const state = getState(itemId);
  state.shortcuts = !state.shortcuts;
  saveQuizPreference('shortcuts', String(state.shortcuts));
  rerender(itemId);
}

export function handleQuizResetSession(itemId) {
  if (!confirm('确定要重置当前会话吗？所有作答记录将被清空。')) return;
  const state = getState(itemId);
  resetSessionData(state);
  rerender(itemId);
}

export function handleQuizShowAnswer(itemId, qid) {
  const state = getState(itemId);
  state.showAnswers[qid] = true;
  rerender(itemId);
}

export function handleQuizSubmitAnswer(itemId, qid) {
  submitCurrentAnswer(itemId, qid);
}

export function handleQuizSelectOption(itemId, qid, value) {
  const state = getState(itemId);
  if (state.practiceMode === 'memorize') return;
  state.userAnswers[qid] = value;
  submitCurrentAnswer(itemId, qid);
}

export function cleanupQuizSession(itemId) {
  restoreBodyBg();
  destroyQuizBackground();
  detachKeyboardListener();
  detachSettingsOutsideClickListener();
}
