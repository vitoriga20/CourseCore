import { validate } from './index.js';

export function mixedValidator(question, userAnswer) {
  const subValidators = question.subValidators || [];
  const results = subValidators.map(sub => validate(sub, userAnswer));
  const passed = results.every(r => r.passed);

  return {
    passed,
    userAnswer,
    correctAnswer: question.answer,
    message: passed ? '全部通过' : '部分判定未通过',
    manual: false,
    logs: results
  };
}
