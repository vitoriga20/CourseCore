import { validatorTypes } from '../config/question-types.js';
import { exactValidator } from './exact.js';
import { normalizedValidator } from './normalized.js';
import { toleranceValidator } from './tolerance.js';
import { setValidator } from './set.js';
import { manualValidator } from './manual.js';
import { runnerValidator } from './runner.js';
import { mixedValidator } from './mixed.js';

export const validators = {
  exact: exactValidator,
  normalized: normalizedValidator,
  tolerance: toleranceValidator,
  set: setValidator,
  manual: manualValidator,
  runner: runnerValidator,
  mixed: mixedValidator
};

export function validate(question, userAnswer) {
  const type = validatorTypes[question.questionType];
  const validator = validators[type];
  if (!validator) {
    throw new Error(`No validator for questionType ${question.questionType} (validatorType: ${type})`);
  }
  return validator(question, userAnswer);
}
