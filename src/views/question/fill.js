import { escapeHtml } from '../../utils.js';

export function renderFill(question, { userAnswer = null } = {}) {
  const answerArray = Array.isArray(userAnswer) ? userAnswer : [];

  if (question.blanks > 1) {
    return `
      <div class="space-y-3 mt-4 question-input" data-qid="${question.id}">
        ${Array.from({ length: question.blanks }, (_, i) => `
          <div>
            <label class="text-sm font-medium mb-2 block" style="color: var(--muted);">第 ${i + 1} 空</label>
            <input id="blank-${question.id}-${i}" class="answer-input question-input-field" type="text" placeholder="输入答案…" data-qid="${question.id}" value="${escapeHtml(answerArray[i] || '')}">
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <div class="mt-4 question-input" data-qid="${question.id}">
      <label class="text-sm font-medium mb-2 block" style="color: var(--muted);">你的答案</label>
      <input id="user-answer-${question.id}" class="answer-input question-input-field" type="text" placeholder="输入答案…" data-qid="${question.id}" value="${escapeHtml(userAnswer || '')}">
    </div>
  `;
}
