export function toleranceValidator(question, userAnswer) {
  const userNum = parseFloat(userAnswer);
  const answerNum = parseFloat(question.answer);

  if (Number.isNaN(userNum)) {
    return {
      passed: false,
      userAnswer,
      correctAnswer: question.answer,
      message: '请输入有效数字',
      manual: false
    };
  }

  const tol = question.tolerance ?? 1e-6;
  const passed = Math.abs(userNum - answerNum) <= tol + 1e-9;
  return {
    passed,
    userAnswer,
    correctAnswer: question.answer,
    message: passed
      ? '回答正确'
      : `答案接近但超出容差（容差 ±${tol}）`,
    manual: false
  };
}
