export function normalizedValidator(question, userAnswer) {
  const normalize = s => String(s)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/\\/g, '');

  const passed = normalize(userAnswer) === normalize(question.answer);
  return {
    passed,
    userAnswer,
    correctAnswer: question.answer,
    message: passed ? '回答正确' : '回答错误',
    manual: false
  };
}
