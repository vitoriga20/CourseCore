import { formatAnswerDisplay } from '../utils/question.js';
import { state } from '../state.js';
import { COURSES } from '../data/courses.js';
import { QUESTIONS } from '../data/questions.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { renderQuestion } from './question/index.js';

function renderInlineFeedback(question, result) {
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

  const showAnswer = state.inlineShowAnswers[question.id];
  return `
    <div class="mt-4 p-4 rounded-xl border" style="border-color: var(--error); background: var(--card);">
      <div class="flex flex-wrap items-center gap-3 font-bold" style="color: var(--error);">
        <span>✗</span>
        <span>错了</span>
        ${showAnswer
          ? ''
          : `<button class="btn-pill text-xs" data-action="show-inline-answer" data-qid="${question.id}">查看答案</button>`
        }
      </div>
    </div>
  `;
}

function renderInlineSolution(question) {
  const showAnswer = state.inlineShowAnswers[question.id];
  const result = state.inlineResults[question.id];
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

function getQuestionBorderColor(question) {
  const result = state.inlineResults[question.id];
  if (!result) return 'var(--line)';
  if (result.passed) return 'var(--success)';
  if (result.manual) return 'var(--warning)';
  return 'var(--error)';
}

function renderInlineQuestion(question, idx) {
  const userAnswer = state.inlineAnswers[question.id] ?? null;
  const result = state.inlineResults[question.id];

  return `
    <article class="card mb-6 inline-question overflow-hidden border-l-4" data-qid="${question.id}" data-type="${question.questionType}"
      style="border-left-color: ${getQuestionBorderColor(question)};">
      <div class="flex items-center gap-2 mb-3">
        <span class="kind-tag">${QUESTION_TYPE_LABELS[question.questionType] || '题目'}</span>
        <span class="text-xs" style="color: var(--muted);">第 ${idx + 1} 题</span>
      </div>
      <h3 class="text-lg font-bold mb-3" style="color: var(--fg);">${escapeHtml(question.title || '题目')}</h3>
      <div class="question-content text-base mb-4" style="color: var(--fg);">${question.content}</div>
      ${renderQuestion(question, { inline: true, userAnswer })}
      ${renderInlineFeedback(question, result)}
      ${renderInlineSolution(question)}
    </article>
  `;
}

export function renderInlinePractice(itemId) {
  const questions = QUESTIONS.filter(q => q.itemId === itemId);
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return '';
  const module = course.modules.find(m => m.items.some(i => i.id === itemId));
  const item = module.items.find(i => i.id === itemId);

  const submitted = questions.some(q => state.inlineResults[q.id]);
  const passedCount = questions.filter(q => {
    const r = state.inlineResults[q.id];
    return r && (r.passed || r.manual);
  }).length;
  const allPassed = questions.length > 0 && passedCount === questions.length;

  return `
    <div class="inline-practice mt-6" data-item-id="${itemId}">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-sm font-semibold" style="color: var(--fg);">本节训练</div>
          <div class="text-xs" style="color: var(--muted);">共 ${questions.length} 题</div>
        </div>
      </div>

      ${questions.map((q, idx) => renderInlineQuestion(q, idx)).join('')}

      <div class="mt-8">
        ${allPassed
          ? `<button class="btn-pill btn-primary" data-action="next-item" data-item-id="${itemId}">进入下一节 →</button>`
          : `<button class="btn-pill btn-primary" data-action="submit-item" data-item-id="${itemId}">提交答案</button>`
        }
      </div>
    </div>
  `;
}
