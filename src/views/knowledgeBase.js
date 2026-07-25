import { state, courseTitle, moduleTitle } from '../state.js';
import { QUESTIONS } from '../data/questions.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';

function getVisibleQuestions() {
  const term = state.search.toLowerCase().trim();
  return QUESTIONS.filter(q => {
    const done = state.completedQuestions[q.id];
    if (!done) return false;
    const label = QUESTION_TYPE_LABELS[q.questionType] || '';
    if (!term) return true;
    return q.title.toLowerCase().includes(term) ||
           q.content.toLowerCase().includes(term) ||
           label.includes(term);
  });
}

function groupQuestions(questions) {
  const grouped = {};
  questions.forEach(q => {
    const key = QUESTION_TYPE_LABELS[q.questionType];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });
  return grouped;
}

export function renderKnowledgeBaseList() {
  const grouped = groupQuestions(getVisibleQuestions());
  const empty = Object.keys(grouped).length === 0;

  if (empty) {
    return `
      <div class="card text-center py-12">
        <p style="color: var(--muted);">暂无已解锁的题型解法。</p>
        <button data-action="go-learn" class="btn-pill btn-primary mt-4">先去学习</button>
      </div>
    `;
  }

  return Object.entries(grouped).map(([kind, qs]) => `
    <div class="mb-8">
      <h2 class="text-xl font-bold mb-4" style="color: var(--fg);">${kind}题 <span class="text-sm font-normal" style="color:var(--muted)">(${qs.length})</span></h2>
      <div class="space-y-3">
        ${qs.map(q => `
          <a href="${href('question', { qid: q.id })}" class="card card-hover cursor-pointer">
            <div class="flex items-center gap-2 mb-2">
              <span class="kind-tag">${QUESTION_TYPE_LABELS[q.questionType]}</span>
              <span class="text-xs" style="color: var(--muted);">${courseTitle(q.courseId)} · ${moduleTitle(q.courseId, q.moduleId)}</span>
            </div>
            <div class="text-sm font-medium" style="color: var(--fg);">${escapeHtml(q.title)}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

export function renderKnowledgeBase() {
  return `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">知识库</h1>
      <p class="mb-8" style="color: var(--muted);">收录你已做过的题型与标准解法。完成练习或刷题后，对应解法自动解锁。</p>

      <div class="card mb-8">
        <div class="search-wrap">
          <span class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input id="kb-search" class="search-input" type="text" placeholder="搜索已解锁的题型或解法…" value="${escapeHtml(state.search)}">
        </div>
      </div>

      <div id="kb-list">
        ${renderKnowledgeBaseList()}
      </div>
    </div>
  `;
}
