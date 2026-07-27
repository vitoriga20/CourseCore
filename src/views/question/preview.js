import { QUESTION_TYPE_LABELS } from '../../data/labels.js';
import { escapeHtml } from '../../utils.js';

export function renderQuestionPreview(question, indexLabel) {
  return `
    <div class="flex items-center gap-2 mb-2">
      <span class="kind-tag">${QUESTION_TYPE_LABELS[question.questionType] || '题目'}</span>
    </div>
    <div class="text-sm" style="color: var(--fg);">${indexLabel} ${question.content}</div>
  `;
}
