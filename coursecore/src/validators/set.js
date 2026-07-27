export function setValidator(question, userAnswer) {
  const userSet = new Set(userAnswer);
  const answerSet = new Set(question.answers);
  const passed = userSet.size === answerSet.size &&
    [...userSet].every(x => answerSet.has(x));

  return {
    passed,
    userAnswer,
    correctAnswer: question.answers,
    message: passed ? '回答正确' : '选项集合不匹配',
    manual: false
  };
}
