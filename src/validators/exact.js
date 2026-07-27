export function exactValidator(question, userAnswer) {
  const passed = String(userAnswer).trim() === String(question.answer).trim();
  return {
    passed,
    userAnswer,
    correctAnswer: question.answer,
    message: passed ? '回答正确' : '回答错误',
    manual: false
  };
}
