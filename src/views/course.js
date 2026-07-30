import { COURSES } from '../data/courses.js';
import { getItemQuestions } from '../utils/question.js';
import { TYPE_LABELS } from '../data/labels.js';
import { state, getTotalItems, getCompletedCount, getStatus, isItemCompleted } from '../state.js';
import { isItemFree } from '../config/access.js';
import { escapeHtml } from '../utils.js';

const LOCK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

function renderItemRow(i) {
  const status = getStatus(i.id);
  const hasQuestions = getItemQuestions(i.id).length > 0;
  const itemDone = isItemCompleted(i.id);
  const locked = !state.user && !isItemFree(i.id);

  if (locked) {
    return `
      <button type="button" class="item-row px-6 w-full text-left" data-action="auth-open" title="登录后解锁">
        <span class="status-dot status-locked"></span>
        <span class="type-tag">${TYPE_LABELS[i.type]}</span>
        <span class="text-sm" style="color: var(--fg);">${escapeHtml(i.title)}</span>
        <span class="ml-auto flex items-center gap-1 text-xs" style="color: var(--muted);">${LOCK_ICON} 登录解锁</span>
      </button>
    `;
  }

  return `
    <a href="/item/${i.id}" class="item-row px-6 w-full text-left block">
      <span class="status-dot ${status === 'done' ? 'status-done' : 'status-todo'}"></span>
      <span class="type-tag">${TYPE_LABELS[i.type]}</span>
      <span class="text-sm" style="color: var(--fg);">${escapeHtml(i.title)}</span>
      ${hasQuestions
        ? `<span class="ml-auto text-xs" style="color: var(--muted);">${itemDone ? '已完成' : '开始练习'}</span>`
        : `<span class="ml-auto text-xs" style="color: var(--muted);">学习</span>`
      }
    </a>
  `;
}

export function renderCourse(courseId) {
  const course = COURSES.find(c => c.id === courseId);
  if (!course) return '';
  const total = getTotalItems(course);
  const done = getCompletedCount(course);

  return `
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style="border-color: var(--line); color: var(--muted);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);"></span>
          认证课程
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">${escapeHtml(course.title)}</h1>
        <p class="text-base sm:text-lg" style="color: var(--muted);">${escapeHtml(course.description)}</p>
      </div>

      <div class="card mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold">课程进度</h2>
          <span class="text-sm font-semibold" style="color: var(--muted);">${done}/${total}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${total ? (done/total*100) : 0}%"></div></div>
      </div>

      <div class="card mb-10">
        <h2 class="text-lg font-bold mb-4">要获得本课程认证：</h2>
        <ul class="space-y-3">
          ${course.requirements.map(r => `<li class="flex items-start gap-3 text-sm" style="color: var(--fg);">
            <span class="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0" style="border-color: var(--line);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            ${escapeHtml(r)}
          </li>`).join("")}
        </ul>
      </div>

      <h2 class="text-2xl font-bold mb-6" style="color: var(--fg);">课程</h2>
      <div class="space-y-4">
        ${course.modules.map(m => {
          const mTotal = m.items.length;
          const mDone = m.items.filter(i => state.progress[i.id]).length;
          const expanded = !!state.expanded[m.id];
          return `<div class="card p-0 overflow-hidden" id="module-${m.id}">
            <button class="module-header rounded-none border-0 px-6 py-5" data-action="toggle-module" data-module-id="${m.id}">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl border flex items-center justify-center" style="border-color: var(--line);">
                  <span class="font-bold text-sm">${m.title.slice(0,1)}</span>
                </div>
                <div class="text-left">
                  <div class="font-bold" style="color: var(--fg);">${escapeHtml(m.title)}</div>
                  <div class="text-xs mt-0.5" style="color: var(--muted);">${mDone}/${mTotal} 完成</div>
                </div>
              </div>
              <svg class="transition-transform duration-200 ${expanded ? 'rotate-180' : ''}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="overflow-hidden transition-all duration-250 ${expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}">
              <div class="px-2 pb-4">
                ${m.items.map(i => renderItemRow(i)).join("")}
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  `;
}
