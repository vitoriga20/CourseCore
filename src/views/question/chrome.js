import { formatAnswerDisplay, getNextQuestionId, getPrevQuestionId } from '../../utils/question.js';
import { QUESTION_TYPE_LABELS } from '../../data/labels.js';
import { courseTitle, moduleTitle, state } from '../../state.js';
import { escapeHtml } from '../../utils.js';
import { href } from '../../config/routes.js';

// 渲染考点 chip 行: 主考点高亮, 次考点淡色
// kps: [{ role, weight, kp: { code, name } }] | null/undefined (占位待异步填充)
export function renderQuestionKps(kps) {
  if (!kps || kps.length === 0) return '';
  const primary = kps.filter(k => k.role === 'primary');
  const secondary = kps.filter(k => k.role === 'secondary');
  const chip = (k, isPrimary) => {
    const name = k.kp?.name || '未知考点';
    const code = k.kp?.code || '';
    const cls = isPrimary ? 'kp-chip kp-chip-primary' : 'kp-chip kp-chip-secondary';
    const prefix = isPrimary ? '主考点' : '次考点';
    return `<span class="${cls}" title="${escapeHtml(code)}">${escapeHtml(prefix)}：${escapeHtml(name)}</span>`;
  };
  return `
    <div class="question-kps flex flex-wrap items-center gap-2 mt-2">
      ${primary.map(k => chip(k, true)).join('')}
      ${secondary.map(k => chip(k, false)).join('')}
    </div>
  `;
}

export function renderQuestionHeader(question) {
  const sourceText = question.examName
    ? escapeHtml(question.examName)
    : `${escapeHtml(courseTitle(question.courseId))} · ${escapeHtml(moduleTitle(question.courseId, question.moduleId))}`;

  // 考点 chip: 已挂载到 question.kps 时直接渲染; 否则留占位由 practiceDetail 异步填充
  const kpsHtml = Array.isArray(question.kps) && question.kps.length > 0
    ? renderQuestionKps(question.kps)
    : `<div class="question-kps-host" data-question-kps data-source="${state.examContext ? 'exam' : 'platform'}" data-qid="${escapeHtml(question.id)}"></div>`;

  return `
    <header class="question-header mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="kind-tag">${QUESTION_TYPE_LABELS[question.questionType] || '题目'}</span>
        <span class="text-xs" style="color: var(--muted);">${sourceText}</span>
      </div>
      <h1 class="text-xl font-bold" style="color: var(--fg);">${escapeHtml(question.title || '题目')}</h1>
      ${kpsHtml}
    </header>
    <section class="question-content text-base mb-6" style="color: var(--fg);">${question.content}</section>
  `;
}

export function renderQuestionActions(question) {
  const record = state.completedQuestions[question.id];
  const isCompleted = !!record;

  return `
    <section class="question-actions flex flex-wrap gap-3 mt-6">
      <button class="btn-pill btn-primary" data-action="submit-answer" data-qid="${question.id}">提交答案</button>
      ${question.hint ? `<button class="btn-pill" data-action="show-hint" data-qid="${question.id}">提示</button>` : ''}
      <button class="btn-pill" data-action="reset-answer" data-qid="${question.id}">重置</button>
      ${isCompleted ? `<span class="text-sm self-center" style="color: var(--success);">已完成 · 尝试 ${record.attempts} 次</span>` : ''}
    </section>
  `;
}

export function renderFeedback() {
  const result = state.validationResult;
  if (!result) return '<section class="question-feedback hidden"></section>';

  const statusClass = result.manual ? 'warning' : result.passed ? 'success' : 'error';
  const icon = result.manual ? '?' : result.passed ? '✓' : '✗';

  return `
    <section class="question-feedback mt-6 p-4 rounded-xl border" style="border-color: var(--line); background: var(--card);">
      <div class="flex items-center gap-2 font-bold mb-2" style="color: var(--${statusClass});">
        <span>${icon}</span>
        <span>${result.message}</span>
      </div>
      ${result.manual ? `<div class="text-sm" style="color: var(--muted);">请对照参考答案自行检查。</div>` : ''}
    </section>
  `;
}

export function renderSolution(question) {
  const result = state.validationResult;
  const isVisible = state.completedQuestions[question.id] || (result && (result.passed || result.manual));

  return `
    <section class="question-solution solution-box mt-6 ${isVisible ? '' : 'hidden'}">
      <h3 class="font-bold mb-2">标准解法</h3>
      <div class="text-sm" style="color: var(--fg);">${question.solution}</div>
      ${question.answer ? `<div class="mt-3 text-sm font-semibold">答案：${escapeHtml(String(formatAnswerDisplay(question)))}</div>` : ''}
      ${question.hint ? `<div class="question-hint hidden mt-4 p-3 rounded-lg text-sm" style="background: var(--hover); color: var(--muted);">${question.hint}</div>` : ''}
    </section>
  `;
}

export function renderQuestionNav(question) {
  const prevId = getPrevQuestionId(question);
  const nextId = getNextQuestionId(question);
  const link = id => state.examContext
    ? href('examQuestion', { examId: state.examContext, qid: id })
    : href('question', { qid: id });

  return `
    <nav class="flex justify-between mt-8">
      ${prevId
        ? `<a href="${link(prevId)}" class="btn-pill">← 上一题</a>`
        : '<span></span>'}
      ${nextId
        ? `<a href="${link(nextId)}" class="btn-pill">下一题 →</a>`
        : '<span></span>'}
    </nav>
  `;
}
