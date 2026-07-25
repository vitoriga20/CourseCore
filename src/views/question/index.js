import { viewTypes } from '../../config/question-types.js';
import { renderChoice } from './choice.js';
import { renderFill } from './fill.js';
import { renderCalc } from './calc.js';
import { renderCode } from './code.js';
import { escapeHtml } from '../../utils.js';

const templates = {
  choice: renderChoice,
  fill: renderFill,
  calc: renderCalc,
  code: renderCode
};

function renderQuestionImage(question) {
  if (!question.image) return '';
  return `
    <div class="question-figure mb-4">
      <img src="${escapeHtml(question.image)}" alt="题图" class="rounded-xl max-w-full h-auto">
    </div>
  `;
}

export function renderQuestion(question, options = {}) {
  const viewType = viewTypes[question.questionType];
  const renderer = templates[viewType];
  if (!renderer) {
    throw new Error(`No renderer for view type "${viewType}" (questionType: ${question.questionType})`);
  }
  return renderQuestionImage(question) + renderer(question, options);
}
