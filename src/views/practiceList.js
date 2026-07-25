import { state } from '../state.js';
import { COURSES } from '../data/courses.js';
import { QUESTIONS } from '../data/questions.js';
import { TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';
import { renderInlinePractice } from './inlinePractice.js';

export function renderPracticeList(itemId) {
  const questions = QUESTIONS.filter(q => q.itemId === itemId);
  const course = COURSES.find(c => c.modules.some(m => m.items.some(i => i.id === itemId)));
  if (!course) return '';
  const module = course.modules.find(m => m.items.some(i => i.id === itemId));
  const item = module.items.find(i => i.id === itemId);

  const contentHtml = item.type === 'theory' && item.content
    ? `<div class="lesson-content text-base leading-relaxed mb-6" style="color: var(--fg); white-space: pre-wrap;">${escapeHtml(item.content)}</div>`
    : '';

  return `
    <div class="max-w-3xl mx-auto">
      <a href="${href('course', { courseId: course.id })}" class="text-sm mb-4 inline-block" style="color: var(--muted);">← 返回 ${escapeHtml(course.title)}</a>
      <div class="flex items-center gap-3 mb-2">
        <span class="type-tag">${TYPE_LABELS[item.type] || '练习'}</span>
        <span class="text-xs" style="color: var(--muted);">${escapeHtml(module.title)}</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-6" style="color: var(--fg);">${escapeHtml(item.title)}</h1>
      ${contentHtml}
      ${questions.length > 0 ? renderInlinePractice(itemId) : `
        <div class="card" style="color: var(--muted);">
          本节暂无训练题，阅读理论内容后继续学习下一节。
        </div>
      `}
    </div>
  `;
}
