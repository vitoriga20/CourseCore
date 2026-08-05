import { state } from '../state.js';
import { findQuestion } from '../utils/question.js';
import { renderQuestion } from './question/index.js';
import { href } from '../config/routes.js';
import { isItemFree } from '../config/access.js';
import { COURSES } from '../data/courses.js';
import { loadQuestionKps } from '../services/content.js';
import { renderQuestionHeader, renderQuestionKps } from './question/chrome.js';
import {
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

  const locked = !state.user && !isItemFree(question.itemId);
  if (locked) {
    const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === question.itemId)));
    const courseHref = course ? href('course', { courseId: course.id }) : '/';
    return `
      <div class="max-w-3xl mx-auto text-center card" style="color: var(--fg);">
        <div class="mb-4 flex justify-center" style="color: var(--muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h1 class="text-xl font-bold mb-2">本题需要登录后查看</h1>
        <p class="text-sm mb-6" style="color: var(--muted);">登录即可解锁全部课程内容与训练题库。</p>
        <div class="flex flex-wrap justify-center gap-3">
          <button type="button" class="btn-primary" data-action="auth-open" data-tab="login">登录 / 注册</button>
          <a href="${courseHref}" class="btn-secondary">返回课程目录</a>
        </div>
      </div>
    `;
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

// 异步填充考点 chip (在 router 渲染 main.innerHTML 后调用)
export async function hydrateQuestionKps(questionId) {
  const host = document.querySelector(`[data-question-kps][data-qid="${CSS.escape(questionId)}"]`);
  if (!host) return;
  const source = host.getAttribute('data-source') || 'platform';
  try {
    const kps = await loadQuestionKps(source, questionId);
    host.outerHTML = renderQuestionKps(kps);
  } catch (e) {
    host.remove();
  }
}
