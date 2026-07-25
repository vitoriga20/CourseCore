import { viewTypes, questionTypes } from '../config/question-types.js';

export function collectUserAnswer(question, root = document) {
  const viewType = viewTypes[question.questionType];
  const qid = question.id;

  if (viewType === 'choice') {
    if (question.questionType === questionTypes.multipleChoice) {
      return Array.from(root.querySelectorAll(`input[name="q-choice-${qid}"]:checked`))
        .map(cb => cb.value);
    }
    return root.querySelector(`input[name="q-choice-${qid}"]:checked`)?.value ?? null;
  }

  const getById = (id) => (root.ownerDocument || document).getElementById(id);

  if (viewType === 'fill') {
    if (question.blanks > 1) {
      return Array.from({ length: question.blanks }, (_, i) =>
        getById(`blank-${qid}-${i}`)?.value.trim() ?? ''
      );
    }
    return getById(`user-answer-${qid}`)?.value.trim() ?? null;
  }

  if (viewType === 'calc' || viewType === 'code') {
    return getById(`user-answer-${qid}`)?.value.trim() ?? null;
  }

  return null;
}

export function isEmptyAnswer(answer) {
  if (answer === null || answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim() === '';
  if (Array.isArray(answer)) return answer.length === 0 || answer.every(isEmptyAnswer);
  return false;
}
