import { viewTypes } from '../../config/question-types.js';
import { renderChoice } from './choice.js';
import { renderFill } from './fill.js';
import { renderCalc } from './calc.js';
import { renderCode } from './code.js';
import { renderImageWithLoader } from '../../components/loading.js';

const templates = {
  choice: renderChoice,
  fill: renderFill,
  calc: renderCalc,
  code: renderCode
};

function renderQuestionImage(question) {
  if (!question.image) return '';
  return `
    <div class="question-figure mb-4 max-w-full">
      ${renderImageWithLoader(question.image, '题图')}
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
