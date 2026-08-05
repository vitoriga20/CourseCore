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
    currentIndex: 0,
    mode: 'sequential',
    seed: seedFromString(itemId),
    font: loadQuizPreference('font', 'serif'),
    bg: loadQuizPreference('bg', 'geo'),
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

function renderControlBar(state) {
  const progress = state.allQuestions.length > 0
    ? Math.round(((state.currentIndex + (state.finished ? 1 : 0)) / state.allQuestions.length) * 100)
    : 0;

  return `
    <div class="quiz-control-bar">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="quiz-mode-badge">${state.mode === 'random' ? '随机' : '顺序'}</span>
          <span class="text-sm font-medium" style="color: var(--fg);">${escapeHtml(getItemTitle(state.itemId))}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="quiz-chip" data-action="quiz-toggle-order" data-item-id="${state.itemId}">
            ${state.mode === 'random' ? '随机刷题' : '顺序刷题'}
          </button>
          <button class="quiz-chip" data-action="quiz-toggle-font" data-item-id="${state.itemId}">
            ${FONT_LABELS[state.font]}
          </button>
          <button class="quiz-chip" data-action="quiz-toggle-bg" data-item-id="${state.itemId}">
            ${BG_LABELS[state.bg]}
          </button>
        </div>
      </div>
      <div class="quiz-progress-track">
        <div class="quiz-progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>
  `;
}

function renderFeedback(question, result, showAnswer) {
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

function renderSolution(question, result, showAnswer) {
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

  const content = renderQuestion(q, { inline: true, userAnswer, selectAction: 'quiz-select-option' });

  return `
    <article class="quiz-question-card" data-qid="${qid}" data-item-id="${state.itemId}">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs font-semibold px-2 py-1 rounded" style="background: var(--accent); color: var(--bg);">第 ${state.currentIndex + 1} / ${state.allQuestions.length} 题</span>
      </div>
      <h3 class="quiz-question-title">${escapeHtml(normalizeText(q.title || '题目'))}</h3>
      <div class="quiz-question-content">${normalizeText(q.content)}</div>
      ${content}
      ${!isInstant && !result && !showAnswer
        ? `<button class="quiz-btn quiz-btn-primary mt-4" data-action="quiz-submit-answer" data-item-id="${state.itemId}" data-qid="${qid}">提交答案</button>`
        : ''}
      ${renderFeedback(q, result, showAnswer)}
      ${renderSolution(q, result, showAnswer)}
    </article>
  `;
}

function renderNavButton(state, displayIdx, q) {
  const qid = q.id;
  const result = resultFor(state, qid);
  const isCurrent = displayIdx === state.currentIndex;
  let statusClass = '';
  if (result) {
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
  return `
    <div class="quiz-bottom-actions">
      <button class="quiz-btn" data-action="quiz-prev" data-item-id="${state.itemId}" ${state.currentIndex === 0 ? 'disabled' : ''}>上一题</button>
      ${state.currentIndex === state.allQuestions.length - 1 && !state.finished
        ? `<button class="quiz-btn quiz-btn-primary" data-action="quiz-finish" data-item-id="${state.itemId}">完成练习</button>`
        : `<button class="quiz-btn quiz-btn-primary" data-action="quiz-next" data-item-id="${state.itemId}">下一题</button>`
      }
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

  container.setAttribute('data-font', state.font);
  container.setAttribute('data-bg', state.bg);
  updateBodyBg(state.bg);
  initQuizBackground();

  container.innerHTML = renderControlBar(state) + renderQuizContent(state);
  typeset(container);
  initImageLoaders(container);
  return state;
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
  container.setAttribute('data-font', state.font);
  container.setAttribute('data-bg', state.bg);
  updateBodyBg(state.bg);
  container.innerHTML = renderControlBar(state) + renderQuizContent(state);
  typeset(container);
  initImageLoaders(container);
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

  const root = getQuestionRoot(itemId, qid);
  const userAnswer = collectUserAnswer(question, root);

  if (isEmptyAnswer(userAnswer)) {
    alert('请先输入或选择答案');
    return;
  }

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

  const submitType = submitTypes[question.questionType];
  if (submitType === 'instant' && result.passed && state.currentIndex < state.allQuestions.length - 1) {
    setTimeout(() => handleQuizNext(itemId), 600);
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
  const answered = state.allQuestions.filter(q => {
    const r = resultFor(state, q.id);
    return r || state.userAnswers[q.id] !== undefined;
  }).length;

  if (answered < state.allQuestions.length) {
    alert(`还有 ${state.allQuestions.length - answered} 题未完成，请继续作答`);
    return;
  }

  state.finished = true;
  // 记录"继续上次"会话
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
  // 适配层回调: 提交后处理（更新错题本 + 保存记录）
  if (typeof state.onFinish === 'function') {
    try { state.onFinish(state); } catch (e) { console.warn('[quizSession] onFinish:', e); }
  }
}

export function handleQuizRestart(itemId) {
  quizStates.set(itemId, createState(itemId));
  rerender(itemId);
}

export function handleQuizToggleOrder(itemId) {
  const state = getState(itemId);
  state.mode = state.mode === 'random' ? 'sequential' : 'random';
  if (state.mode === 'random') {
    state.seed = Date.now();
  }
  resetOrder(state);
  state.currentIndex = 0;
  rerender(itemId);
}

export function handleQuizToggleFont(itemId) {
  const state = getState(itemId);
  const idx = FONT_MODES.indexOf(state.font);
  state.font = FONT_MODES[(idx + 1) % FONT_MODES.length];
  saveQuizPreference('font', state.font);
  rerender(itemId);
}

export function handleQuizToggleBg(itemId) {
  const state = getState(itemId);
  const idx = BG_MODES.indexOf(state.bg);
  state.bg = BG_MODES[(idx + 1) % BG_MODES.length];
  saveQuizPreference('bg', state.bg);
  updateBodyBg(state.bg);
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
  state.userAnswers[qid] = value;
  submitCurrentAnswer(itemId, qid);
}

export function cleanupQuizSession(itemId) {
  restoreBodyBg();
  destroyQuizBackground();
}
