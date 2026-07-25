import { escapeHtml } from '../../utils.js';
import { questionTypes } from '../../config/question-types.js';

export function renderChoice(question, { inline = false, userAnswer = null, selectAction = 'select-option' } = {}) {
  const isMulti = question.questionType === questionTypes.multipleChoice;
  const inputType = isMulti ? 'checkbox' : 'radio';
  const name = `q-choice-${question.id}`;
  const actionAttr = inline
    ? (selectAction ? `data-action="${selectAction}"` : '')
    : 'data-action="select-option"';

  const isSelected = (idx) => {
    if (userAnswer === null || userAnswer === undefined) return false;
    if (isMulti) return (Array.isArray(userAnswer) ? userAnswer : []).map(String).includes(String(idx));
    return String(userAnswer) === String(idx);
  };

  return `
    <div class="space-y-2 mt-3 question-input" data-qid="${question.id}">
      ${(question.options || []).map((opt, idx) => `
        <label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer choice-option" style="border-color: var(--line);">
          <input type="${inputType}" name="${name}" value="${idx}" class="mt-1 question-input-field" ${actionAttr} data-qid="${question.id}" data-value="${idx}" ${isSelected(idx) ? 'checked' : ''}>
          <span class="text-sm" style="color: var(--fg);">${escapeHtml(opt)}</span>
        </label>
      `).join('')}
    </div>
  `;
}
