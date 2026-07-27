export function normalizedValidator(question, userAnswer) {
  function normalize(s) {
    return String(s)
      .toLowerCase()
      .replace(/\$/g, '')
      .replace(/\\mathrm\{([^}]*)\}/g, '$1')
      .replace(/\\,?/g, '')
      .replace(/\\;/g, '')
      .replace(/[\u3000\s]+/g, '')
      .replace(/；/g, ';')
      .replace(/，/g, ',')
      .replace(/。/g, '.')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/\\/g, '');
  }

  const passed = normalize(userAnswer) === normalize(question.answer);
  return {
    passed,
    userAnswer,
    correctAnswer: question.answer,
    message: passed ? '回答正确' : '回答错误',
    manual: false
  };
}
