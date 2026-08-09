import { state, courseTitle, moduleTitle, itemTitle } from '../state.js';
import { QUESTIONS } from '../data/questions.js';
import { COURSES } from '../data/courses.js';
import { questionTypes } from '../config/question-types.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';

export function renderPracticeBank() {
  const term = state.search.toLowerCase().trim();

  const filtered = QUESTIONS.filter(q => {
    const label = QUESTION_TYPE_LABELS[q.questionType] || '';
    const item = itemTitle(q.courseId, q.moduleId, q.itemId);
    const matchTerm = !term ||
      q.title.toLowerCase().includes(term) ||
      q.content.toLowerCase().includes(term) ||
      label.includes(term) ||
      item.toLowerCase().includes(term) ||
      courseTitle(q.courseId).toLowerCase().includes(term) ||
      moduleTitle(q.courseId, q.moduleId).toLowerCase().includes(term);
    const matchKind = state.bankFilter.kind === 'all' || String(q.questionType) === state.bankFilter.kind;
    const matchCourse = state.bankFilter.course === 'all' || q.courseId === state.bankFilter.course;
    return matchTerm && matchKind && matchCourse;
  });

  const grouped = {};
  filtered.forEach(q => {
    if (!grouped[q.courseId]) grouped[q.courseId] = {};
    if (!grouped[q.courseId][q.moduleId]) grouped[q.courseId][q.moduleId] = {};
    if (!grouped[q.courseId][q.moduleId][q.itemId]) grouped[q.courseId][q.moduleId][q.itemId] = [];
    grouped[q.courseId][q.moduleId][q.itemId].push(q);
  });

  const doneCount = Object.keys(state.completedQuestions).length;

  return `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">刷题</h1>
      <p class="mb-8" style="color: var(--muted);">按课程小节拆分的题库，可直接定位到具体知识点的训练题。</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="card">
          <div class="text-2xl font-extrabold mb-1" style="color: var(--fg);">${QUESTIONS.length}</div>
          <div class="text-sm" style="color: var(--muted);">平台总题数</div>
        </div>
        <div class="card">
          <div class="text-2xl font-extrabold mb-1" style="color: var(--fg);">${doneCount}</div>
          <div class="text-sm" style="color: var(--muted);">已完成题数</div>
        </div>
      </div>

      <div class="card mb-8">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="search-wrap flex-1">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input id="bank-search" class="search-input" type="text" placeholder="搜索题目、小节或模块…" value="${escapeHtml(state.search)}">
          </div>
          <select id="bank-kind" class="answer-input md:w-40">
            <option value="all" ${state.bankFilter.kind === 'all' ? 'selected' : ''}>全部题型</option>
            ${Object.entries(questionTypes).map(([key, value]) => `
              <option value="${value}" ${state.bankFilter.kind === String(value) ? 'selected' : ''}>${QUESTION_TYPE_LABELS[value]}题</option>
            `).join('')}
          </select>
          <select id="bank-course" class="answer-input md:w-44">
            <option value="all" ${state.bankFilter.course === 'all' ? 'selected' : ''}>全部学科</option>
            ${COURSES.map(c => `<option value="${c.id}" ${state.bankFilter.course === c.id ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}
          </select>
        </div>
      </div>

      ${filtered.length === 0 ? `<div class="card text-center py-10" style="color: var(--muted);">暂无符合条件的题目。</div>` : ''}

      <div class="space-y-8">
        ${Object.entries(grouped).map(([courseId, modules]) => `
          <section>
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2" style="color: var(--fg);">
              <span class="w-1 h-6 rounded-full" style="background: var(--accent);"></span>
              ${escapeHtml(courseTitle(courseId))}
            </h2>
            <div class="space-y-6 ml-3 pl-4 border-l" style="border-color: var(--line);">
              ${Object.entries(modules).map(([moduleId, items]) => `
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide mb-3" style="color: var(--muted);">${escapeHtml(moduleTitle(courseId, moduleId))}</h3>
                  <div class="space-y-3">
                    ${Object.entries(items).map(([itemId, questions]) => `
                      <div class="card">
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="font-semibold" style="color: var(--fg);">${escapeHtml(itemTitle(courseId, moduleId, itemId))}</h4>
                          <span class="text-xs font-medium px-2 py-1 rounded-full border" style="border-color: var(--line); color: var(--muted);">${questions.length} 题</span>
                        </div>
                        <div class="space-y-2">
                          ${questions.map(q => `
                            <div class="card card-hover cursor-pointer p-3" style="background: transparent; border: 1px solid var(--line);">
                              <div class="flex items-center gap-2 mb-1">
                                <a href="${href('question', { qid: q.id })}" class="flex items-center gap-2 flex-1 min-w-0">
                                  <span class="kind-tag">${QUESTION_TYPE_LABELS[q.questionType]}</span>
                                  ${state.completedQuestions[q.id] ? `<span class="text-xs font-semibold" style="color:var(--success)">已完成</span>` : ''}
                                </a>
                                <button type="button" data-action="dl-single-question" data-key="${escapeHtml(q.id)}" class="btn-pill btn-ghost" style="padding:0.25rem 0.6rem;font-size:0.7rem;" title="下载本题为 PDF">下载</button>
                              </div>
                              <a href="${href('question', { qid: q.id })}" class="text-sm" style="color: var(--fg);">${escapeHtml(q.title)}</a>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </div>
  `;
}
