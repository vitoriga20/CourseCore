import { state } from '../state.js';
import { findQuestion } from '../utils/question.js';
import { renderQuestion } from './question/index.js';
import { href } from '../config/routes.js';
import {
  renderQuestionHeader,
  renderQuestionActions,
  renderFeedback,
  renderSolution,
  renderQuestionNav
} from './question/chrome.js';

export function renderPracticeDetail(questionId) {
  const question = findQuestion(questionId);
  if (!question) {
    return '<div class="card max-w-3xl mx-auto">题目不存在</div>';
  }

  if (!state.currentQuestion || state.currentQuestion.id !== question.id) {
    state.currentQuestion = question;
    state.userAnswer = null;
    state.validationResult = null;
  }

  const backHref = state.examContext
    ? href('exam', { examId: state.examContext })
    : question.itemId
      ? href('item', { itemId: question.itemId })
      : href('bank');

  return `
    <div class="max-w-3xl mx-auto">
      <a href="${backHref}" class="text-sm mb-4 inline-block" style="color: var(--muted);">← 返回</a>
      <article class="question-card card" data-qid="${question.id}" data-type="${question.questionType}">
        ${renderQuestionHeader(question)}
        ${renderQuestion(question)}
        ${renderQuestionActions(question)}
        ${renderFeedback()}
        ${renderSolution(question)}
      </article>
      ${renderQuestionNav(question)}
    </div>
  `;
}
