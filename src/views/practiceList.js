import { formatAnswerDisplay } from '../utils/question.js';
import { marked } from 'marked';
import { state } from '../state.js';
import { COURSES } from '../data/courses.js';
import { QUESTIONS } from '../data/questions.js';
import { THEORY_CONTENTS } from '../data/theoryContents.js';
import { TYPE_LABELS, QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';
import { renderInlinePractice } from './inlinePractice.js';
import { renderQuizSession } from './quizSession.js';
import { renderQuestion } from './question/index.js';

function renderTheoryContent(content) {
  const html = marked.parse(content || '');
  return `<div class="lesson-content prose prose-invert max-w-none text-base leading-relaxed mb-8" style="color: var(--fg);">${html}</div>`;
}

function renderTheoryPlaceholder(item) {
  const theory = THEORY_CONTENTS.find(t => t.itemId === item.id);
  const content = theory?.content || item.content;

  if (content) {
    return renderTheoryContent(content);
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

function renderTheoryExamples(item) {
  const theory = THEORY_CONTENTS.find(t => t.itemId === item.id);
  const exampleIds = theory?.examples || [];
  const examples = exampleIds
    .map(id => QUESTIONS.find(q => q.id === id))
    .filter(Boolean);

  if (examples.length === 0) return '';

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

export function renderPracticeList(itemId) {
  const questions = QUESTIONS.filter(q => q.itemId === itemId);
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return '';
  const module = course.modules.find(m => m.items.some(i => i.id === itemId));
  const item = module.items.find(i => i.id === itemId);

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

  const wrapperClass = item.type === 'quiz' || item.type === 'training' ? 'max-w-7xl mx-auto' : 'max-w-3xl mx-auto';

  return `
    <div class="${wrapperClass}">
      <a href="${href('course', { courseId: course.id })}" class="text-sm mb-4 inline-block" style="color: var(--muted);">← 返回 ${escapeHtml(course.title)}</a>
      <div class="flex items-center gap-3 mb-2">
        <span class="type-tag">${TYPE_LABELS[item.type] || '练习'}</span>
        <span class="text-xs" style="color: var(--muted);">${escapeHtml(module.title)}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-6" style="color: var(--fg);">${escapeHtml(item.title)}</h1>
      ${bodyHtml}
    </div>
  `;
}
