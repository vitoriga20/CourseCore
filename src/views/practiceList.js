import { formatAnswerDisplay, getItemQuestions, findQuestion } from '../utils/question.js';
import { marked } from 'marked';
import { state } from '../state.js';
import { COURSES } from '../data/courses.js';
import { THEORY_CONTENTS } from '../data/theoryContents.js';
import { TYPE_LABELS, QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';
import { isItemFree } from '../config/access.js';
import { renderInlinePractice } from './inlinePractice.js';
import { renderQuizSession } from './quizSession.js';
import { renderQuestion } from './question/index.js';

function renderItemNav(course, module, item) {
  return `
    <nav class="item-nav" aria-label="课程导航">
      <ol class="item-nav-list">
        <li class="item-nav-course">
          <a href="${href('course', { courseId: course.id })}" title="${escapeHtml(course.title)}">
            <span>${escapeHtml(course.title)}</span>
          </a>
        </li>
        <li class="item-nav-module">
          <a href="${href('course', { courseId: course.id })}#module-${module.id}" title="${escapeHtml(module.title)}">
            <span>${escapeHtml(module.title)}</span>
          </a>
        </li>
      </ol>
    </nav>
  `;
}

// 把 content 里的 [图N:名称] / [表N:名称] 占位符 与 [图:asset_id] / [表:asset_id] 引用
// 替换为 DB 中的图/表内容。先替换成占位 token，避免 marked 干扰，渲染后再还原为真实 HTML。
const FIGURE_TOKEN = /@@COURSECORE_FIGURE_(\d+)@@/g;
const FIGURE_PLACEHOLDER = /\[(图|表)(\d+):([^\]]+)\]/g;
const ASSET_REF = /\[(图|表):([^\]\s]+)\]/g;

function renderFigureFigure(f) {
  if (!f) return '';
  if (f.kind === 'table') {
    return `<div class="cc-figure cc-table">${f.content || ''}</div>`;
  }
  // SVG 图：内联展示，可缩放、适配主题
  return `<div class="cc-figure">${f.content || ''}</div>`;
}

function renderTheoryContent(content, figures, assets) {
  const figureMap = {};
  for (const f of Array.isArray(figures) ? figures : []) {
    if (f && f.placeholder) figureMap[f.placeholder] = f;
  }
  const assetMap = {};
  for (const a of Array.isArray(assets) ? assets : []) {
    if (a && a.id) assetMap[a.id] = a;
  }

  const tokens = [];
  const protectedSource = String(content || '')
    // 方案3: [图:asset_id] / [表:asset_id] 全局资源引用
    .replace(ASSET_REF, (m, kind, id) => {
      const a = assetMap[id];
      if (!a) return m; // 未入库的资源引用保留原文
      const idx = tokens.length;
      tokens.push(renderFigureFigure(a));
      return `@@COURSECORE_FIGURE_${idx}@@`;
    })
    // 旧语法: [图N:名称] / [表N:名称]（content_figures 兼容）
    .replace(FIGURE_PLACEHOLDER, (m, kind, num, name) => {
      const key = `${kind}${num}`;
      const f = figureMap[key];
      if (!f) return m; // 未入库的占位符保留原文
      const idx = tokens.length;
      tokens.push(renderFigureFigure(f));
      return `@@COURSECORE_FIGURE_${idx}@@`;
    });

  const html = marked.parse(protectedSource || '');
  const final = html.replace(FIGURE_TOKEN, (_, index) => tokens[Number(index)] || '');
  return `<div class="lesson-content prose prose-invert max-w-none text-base leading-relaxed mb-8" style="color: var(--fg);">${final}</div>`;
}

function renderTheoryPlaceholder(item) {
  const runtime = state.runtimeTheoryContent[item.id];
  const theory = THEORY_CONTENTS.find(t => t.itemId === item.id);
  const content = runtime?.content || theory?.content || item.content;

  if (content) {
    return renderTheoryContent(content, runtime?.figures, runtime?.assets);
  }

  return `
    <div class="card" style="color: var(--muted);">
      <p>本节为 <strong>${escapeHtml(item.title)}</strong> 的理论内容占位小节。</p>
      <p class="mt-2">正式讲义内容待后续补充，当前仅用于展示课程章节结构。</p>
    </div>
  `;
}

function renderTheoryFeedback(question, result) {
  if (!result) return '';

  if (result.manual) {
    return `
      <div class="mt-4 p-4 rounded-xl border" style="border-color: var(--line); background: var(--card);">
        <div class="flex items-center gap-2 font-bold mb-2" style="color: var(--warning);">
          <span>?</span>
          <span>已提交，请对照参考答案自行检查</span>
        </div>
      </div>
    `;
  }

  if (result.passed) {
    return `
      <div class="mt-4 p-4 rounded-xl border" style="border-color: var(--success); background: var(--card);">
        <div class="flex items-center gap-2 font-bold" style="color: var(--success);">
          <span>✓</span>
          <span>回答正确</span>
        </div>
      </div>
    `;
  }

  const showAnswer = state.theoryShowAnswers[question.id];
  return `
    <div class="mt-4 p-4 rounded-xl border" style="border-color: var(--error); background: var(--card);">
      <div class="flex flex-wrap items-center gap-3 font-bold" style="color: var(--error);">
        <span>✗</span>
        <span>错了</span>
        ${showAnswer
          ? ''
          : `<button class="btn-pill text-xs" data-action="show-theory-answer" data-qid="${question.id}">查看答案</button>`
        }
      </div>
    </div>
  `;
}

function renderTheorySolution(question) {
  const showAnswer = state.theoryShowAnswers[question.id];
  const result = state.theoryResults[question.id];
  if (!showAnswer && !(result && (result.passed || result.manual))) return '';

  return `
    <div class="solution-box mt-4">
      <h4 class="font-bold mb-2">标准解法</h4>
      <div class="text-sm" style="color: var(--fg);">${question.solution}</div>
      ${question.answer !== undefined && question.answer !== null && question.answer !== ''
        ? `<div class="mt-3 text-sm font-semibold">答案：${escapeHtml(String(formatAnswerDisplay(question)))}</div>`
        : ''}
    </div>
  `;
}

function renderTheoryExample(question, idx) {
  const userAnswer = state.theoryAnswers[question.id] ?? null;
  const result = state.theoryResults[question.id];

  return `
    <article class="card mb-6 theory-example overflow-hidden border-l-4" data-qid="${question.id}" data-type="${question.questionType}"
      style="border-left-color: ${result ? (result.passed ? 'var(--success)' : result.manual ? 'var(--warning)' : 'var(--error)') : 'var(--line)'};">
      <div class="flex items-center gap-2 mb-3">
        <span class="kind-tag">${QUESTION_TYPE_LABELS[question.questionType] || '例题'}</span>
        <span class="text-xs" style="color: var(--muted);">例题 ${idx + 1}</span>
      </div>
      <h3 class="text-lg font-bold mb-3" style="color: var(--fg);">${escapeHtml(question.title || '例题')}</h3>
      <div class="question-content text-base mb-4" style="color: var(--fg);">${question.content}</div>
      ${renderQuestion(question, { inline: true, userAnswer })}
      ${renderTheoryFeedback(question, result)}
      ${renderTheorySolution(question)}
    </article>
  `;
}

// 支持三种例题来源：
//  v2 真实行（questions 表，经 item_questions role='theory_example' 关联，已带真实 id）——直接用
//  旧格式①（题目 ID 字符串数组）——findQuestion 解析
//  旧格式②（内联对象数组）——生成 `${itemId}-ex${idx}` 兜底 id（仅本地静态数据 fallback）
function normalizeTheoryExamples(theory, itemId) {
  const raw = theory?.examples || [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return raw.map(id => findQuestion(id)).filter(Boolean);
  }
  return raw.map((ex, idx) => {
    if (ex.id) return ex; // v2 真实行：保留真实 id，进度判定才能对上
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

function renderTheoryExamples(item) {
  const runtime = state.runtimeTheoryContent[item.id];
  const theory = THEORY_CONTENTS.find(t => t.itemId === item.id);
  const examples = normalizeTheoryExamples(runtime || theory, item.id);

  if (examples.length === 0) return '';

  // 从持久化的 completedQuestions 回填内存态 theoryResults/theoryAnswers，
  // 使刷新后进度条、边框、反馈、解法、选项勾选、提交按钮保持一致。
  for (const q of examples) {
    if (state.theoryResults[q.id]) continue;
    const rec = state.completedQuestions[q.id];
    if (!rec) continue;
    state.theoryResults[q.id] = {
      passed: rec.passed === true,
      manual: rec.passed === null,
      userAnswer: rec.lastAnswer ?? null,
    };
    state.theoryAnswers[q.id] = rec.lastAnswer ?? null;
  }

  const passedCount = examples.filter(q => {
    const r = state.theoryResults[q.id];
    return r && (r.passed || r.manual);
  }).length;
  const allPassed = examples.length > 0 && passedCount === examples.length;

  return `
    <div class="theory-examples mt-8 pt-8 border-t" style="border-color: var(--line);" data-item-id="${item.id}">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-lg font-bold" style="color: var(--fg);">本节例题</div>
          <div class="text-xs" style="color: var(--muted);">共 ${examples.length} 题，完成 ${passedCount}/${examples.length}</div>
        </div>
      </div>

      ${examples.map((q, idx) => renderTheoryExample(q, idx)).join('')}

      <div class="mt-8">
        ${allPassed
          ? `<button class="btn-pill btn-primary" data-action="next-item" data-item-id="${item.id}">进入下一节 →</button>`
          : `<button class="btn-pill btn-primary" data-action="submit-theory-examples" data-item-id="${item.id}">提交例题答案</button>`
        }
      </div>
    </div>
  `;
}

function renderLockedPrompt(course) {
  return `
    <div class="max-w-3xl mx-auto text-center card" style="color: var(--fg);">
      <div class="mb-4 flex justify-center" style="color: var(--muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h1 class="text-xl font-bold mb-2">本小节需要登录后查看</h1>
      <p class="text-sm mb-6" style="color: var(--muted);">登录即可解锁全部课程内容与训练题库。</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="btn-primary" data-action="auth-open" data-tab="login">登录 / 注册</button>
        <a href="${href('course', { courseId: course.id })}" class="btn-secondary">返回课程目录</a>
      </div>
    </div>
  `;
}

export function renderPracticeList(itemId) {
  const questions = getItemQuestions(itemId);
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return '';
  const module = course.modules.find(m => m.items.some(i => i.id === itemId));
  const item = module.items.find(i => i.id === itemId);

  if (!state.user && !isItemFree(itemId)) {
    return renderLockedPrompt(course);
  }

  let bodyHtml = '';
  if (item.type === 'quiz' || item.type === 'training') {
    bodyHtml = renderQuizSession(itemId);
  } else if (item.type === 'theory') {
    bodyHtml = renderTheoryPlaceholder(item) + renderTheoryExamples(item);
  } else if (questions.length > 0) {
    bodyHtml = renderInlinePractice(itemId);
  } else {
    bodyHtml = `
      <div class="card" style="color: var(--muted);">
        本节暂无训练题，阅读理论内容后继续学习下一节。
      </div>
    `;
  }

  const isQuiz = item.type === 'quiz' || item.type === 'training';
  const wrapperClass = isQuiz ? 'max-w-7xl mx-auto' : 'max-w-3xl mx-auto';
  const navHtml = isQuiz
    ? `<a href="${href('course', { courseId: course.id })}" class="text-sm mb-4 inline-block" style="color: var(--muted);">← 返回 ${escapeHtml(course.title)}</a>`
    : renderItemNav(course, module, item);

  return `
    <div class="${wrapperClass}">
      ${navHtml}
      <div class="flex items-center gap-3 mb-2">
        <span class="type-tag">${TYPE_LABELS[item.type] || '练习'}</span>
        <span class="text-xs" style="color: var(--muted);">${escapeHtml(module.title)}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-6" style="color: var(--fg);">${escapeHtml(item.title)}</h1>
      ${bodyHtml}
    </div>
  `;
}
