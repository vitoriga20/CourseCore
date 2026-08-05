import { COURSES } from '../data/courses.js';
import { getItemQuestions } from '../utils/question.js';
import { TYPE_LABELS } from '../data/labels.js';
import { state, getTotalItems, getCompletedCount, getStatus, isItemCompleted } from '../state.js';
import { isItemFree } from '../config/access.js';
import { escapeHtml } from '../utils.js';

const LOCK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

// 当前课程页选中的小节（跨 renderMain 重渲染保留）
let _selectedItemId = null;

export function setSelectedCourseItem(itemId) {
  _selectedItemId = itemId;
}

function findItem(course, itemId) {
  for (const m of course.modules) {
    for (const i of m.items) {
      if (i.id === itemId) return { module: m, item: i };
    }
  }
  return null;
}

// 默认选中：第一个未完成小节；全部完成则选第一项
function defaultSelectedItem(course) {
  for (const m of course.modules) {
    for (const i of m.items) {
      if (!isItemCompleted(i.id)) return { module: m, item: i };
    }
  }
  const m = course.modules[0];
  return m ? { module: m, item: m.items[0] } : null;
}

// 从 markdown 内容抽取一小段"大致信息"
function excerptOf(item) {
  const raw = item.content || '';
  const text = raw
    .replace(/[#*`>_~\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text) return text.slice(0, 120) + (text.length > 120 ? '…' : '');
  return `本节为「${TYPE_LABELS[item.type] || item.type}」内容，点击「开始学习」进入。`;
}

function renderCatalogItem(m, i) {
  const locked = !state.user && !isItemFree(i.id);
  const itemDone = isItemCompleted(i.id);
  const status = getStatus(i.id);
  const selected = _selectedItemId === i.id;
  return `
    <button type="button" data-action="course-select-item" data-item-id="${i.id}"
      class="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer
        ${selected ? 'course-item-selected' : 'hover:bg-black/5'}"
      style="margin:0;background:${selected ? 'rgba(40,120,80,0.12)' : 'transparent'};color:var(--fg);">
      <span class="status-dot ${locked ? 'status-locked' : status === 'done' ? 'status-done' : 'status-todo'}"></span>
      <span class="type-tag shrink-0">${TYPE_LABELS[i.type] || i.type}</span>
      <span class="flex-1 min-w-0 truncate">${escapeHtml(i.title)}</span>
      ${locked ? `<span class="shrink-0" style="color:var(--muted);">${LOCK_ICON}</span>` : itemDone ? `<span class="shrink-0 text-xs" style="color:var(--muted);">已完成</span>` : ''}
    </button>
  `;
}

function renderSelectedPreview(sel) {
  if (!sel) {
    return `<div class="text-sm" style="color:var(--muted);">从左侧目录选择一个小节以预览。</div>`;
  }
  const { module, item } = sel;
  const locked = !state.user && !isItemFree(item.id);
  const itemDone = isItemCompleted(item.id);
  const status = getStatus(item.id);
  return `
    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <span class="type-tag">${TYPE_LABELS[item.type] || item.type}</span>
      <span class="text-xs" style="color:var(--muted);">${escapeHtml(module.title)}</span>
      <span class="ml-auto text-xs font-semibold"
        style="color:${locked ? 'var(--muted)' : itemDone ? 'var(--success)' : 'var(--accent)'};">${locked ? '需登录解锁' : itemDone ? '已完成' : '未完成'}</span>
    </div>
    <h2 class="text-xl font-bold mb-3" style="color:var(--fg);">${escapeHtml(item.title)}</h2>
    <div class="text-sm leading-relaxed mb-6" style="color:var(--muted);">${escapeHtml(excerptOf(item))}</div>
    <div class="flex gap-3">
      ${locked
        ? `<button type="button" class="btn-pill btn-primary" data-action="auth-open" data-tab="login">登录解锁</button>`
        : `<a href="/item/${item.id}" class="btn-pill btn-primary">开始学习 →</a>`}
      ${status === 'done' ? `<a href="/item/${item.id}" class="btn-pill btn-ghost">复习</a>` : ''}
    </div>
  `;
}

export function renderCourse(courseId) {
  const course = COURSES.find(c => c.id === courseId);
  if (!course) return '';
  const total = getTotalItems(course);
  const done = getCompletedCount(course);

  // 校验选中项；无效则回退默认
  let sel = _selectedItemId ? findItem(course, _selectedItemId) : null;
  if (!sel) {
    sel = defaultSelectedItem(course);
    _selectedItemId = sel ? sel.item.id : null;
  }

  return `
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style="border-color: var(--line); color: var(--muted);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);"></span>
          认证课程
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">${escapeHtml(course.title)}</h1>
        <p class="text-base sm:text-lg" style="color: var(--muted);">${escapeHtml(course.description)}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold">课程进度</h2>
            <span class="text-sm font-semibold" style="color: var(--muted);">${done}/${total}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${total ? (done / total * 100) : 0}%"></div></div>
        </div>
        <div class="card">
          <h2 class="text-lg font-bold mb-3">要获得本课程认证：</h2>
          <ul class="space-y-2">
            ${course.requirements.map(r => `<li class="flex items-start gap-3 text-sm" style="color: var(--fg);">
              <span class="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0" style="border-color: var(--line);">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              ${escapeHtml(r)}
            </li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-0 overflow-hidden">
          <div class="px-5 py-4 border-b" style="border-color: var(--line);">
            <h2 class="font-bold">课程目录</h2>
          </div>
          <div class="p-2 space-y-2">
            ${course.modules.map(m => {
              const mTotal = m.items.length;
              const mDone = m.items.filter(i => state.progress[i.id]).length;
              const expanded = !!state.expanded[m.id];
              const hasSel = _selectedItemId && m.items.some(i => i.id === _selectedItemId);
              return `<div class="border rounded-lg overflow-hidden" id="module-${m.id}" style="border-color: var(--line);">
                <button type="button" class="w-full flex items-center gap-3 px-4 py-3 text-left rounded-none border-0 cursor-pointer" data-action="toggle-module" data-module-id="${m.id}" style="background:${hasSel ? 'rgba(40,120,80,0.08)' : 'transparent'};">
                  <svg class="transition-transform duration-200 ${expanded ? 'rotate-180' : ''}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  <div class="text-left">
                    <div class="text-sm font-bold" style="color: var(--fg);">${escapeHtml(m.title)}</div>
                    <div class="text-xs mt-0.5" style="color: var(--muted);">${mDone}/${mTotal} 完成</div>
                  </div>
                </button>
                <div class="px-2 pb-2 space-y-1 ${expanded ? '' : 'hidden'}">
                  ${m.items.map(i => renderCatalogItem(m, i)).join("")}
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>

        <div class="card p-6 flex flex-col">
          <div class="mb-4">
            <span class="text-xs font-semibold px-2 py-1 rounded-full border" style="border-color: var(--line); color: var(--muted);">本节预览</span>
          </div>
          <div class="flex-1">
            ${renderSelectedPreview(sel)}
          </div>
        </div>
      </div>
    </div>
  `;
}