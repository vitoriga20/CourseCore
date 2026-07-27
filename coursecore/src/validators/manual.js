export function manualValidator(question, userAnswer) {
  return {
    passed: null,
    userAnswer,
    correctAnswer: question.answer ?? question.solution,
    message: '本题需人工核对，参考答案如下',
    manual: true
  };
}
