import { escapeHtml } from '../../utils.js';

export function renderCalc(question, { userAnswer = null } = {}) {
  const unitHint = question.unit ? `（单位：${question.unit}）` : '';
  return `
    <div class="mt-4 question-input" data-qid="${question.id}">
      <label class="text-sm font-medium mb-2 block" style="color: var(--muted);">你的答案 ${unitHint}</label>
      <input id="user-answer-${question.id}" class="answer-input question-input-field" type="text" placeholder="输入答案…" data-qid="${question.id}" value="${escapeHtml(userAnswer || '')}">
    </div>
  `;
}
