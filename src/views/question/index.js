import { viewTypes } from '../../config/question-types.js';
import { renderChoice } from './choice.js';
import { renderFill } from './fill.js';
import { renderCalc } from './calc.js';
import { renderCode } from './code.js';

const templates = {
  choice: renderChoice,
  fill: renderFill,
  calc: renderCalc,
  code: renderCode
};

export function renderQuestion(question, options = {}) {
  const viewType = viewTypes[question.questionType];
  const renderer = templates[viewType];
  if (!renderer) {
    throw new Error(`No renderer for view type "${viewType}" (questionType: ${question.questionType})`);
  }
  return renderer(question, options);
}
