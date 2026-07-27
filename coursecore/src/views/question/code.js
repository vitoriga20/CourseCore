import { escapeHtml } from '../../utils.js';

export function renderCode(question, { userAnswer = null } = {}) {
  return `
    <div class="mt-4 question-input" data-qid="${question.id}">
      <label class="text-sm font-medium mb-2 block" style="color: var(--muted);">你的代码</label>
      <textarea id="user-answer-${question.id}" class="answer-input question-input-field w-full font-mono" rows="10" placeholder="在此输入代码…" data-qid="${question.id}">${escapeHtml(userAnswer || '')}</textarea>
    </div>
  `;
}
