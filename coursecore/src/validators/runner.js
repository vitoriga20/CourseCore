export function runnerValidator(question, userAnswer) {
  try {
    const fn = new Function('answer', question.testString);
    const passed = fn(userAnswer);
    return {
      passed,
      userAnswer,
      correctAnswer: question.answer,
      message: passed ? '测试通过' : '测试未通过',
      manual: false,
      logs: []
    };
  } catch (e) {
    return {
      passed: false,
      userAnswer,
      correctAnswer: question.answer,
      message: e.message,
      manual: false,
      logs: []
    };
  }
}
