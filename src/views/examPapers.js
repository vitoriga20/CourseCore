import { EXAM_PAPERS } from '../data/examPapers.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';

// 按 subject 分组（保持出现顺序），组内按 id 排序
function groupBySubject(papers) {
  const groups = [];
  const index = new Map();
  for (const exam of papers) {
    const key = exam.subject || '其他';
    if (!index.has(key)) {
      index.set(key, { subject: key, papers: [] });
      groups.push(index.get(key));
    }
    index.get(key).papers.push(exam);
  }
  return groups;
}

export function renderExamPapers() {
  const groups = groupBySubject(EXAM_PAPERS);
  return `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">期末试卷</h1>
      <p class="mb-8" style="color: var(--muted);">收录各大学期末试卷，用于考前模拟与真题演练。</p>
      ${groups.map(group => `
        <div class="mb-10">
          <h2 class="text-xl font-bold mb-4 pb-2 border-b" style="color: var(--fg); border-color: var(--line);">${escapeHtml(group.subject)} <span class="text-sm font-normal" style="color: var(--muted);">${group.papers.length} 套</span></h2>
          <div class="space-y-4">
            ${group.papers.map(exam => {
              const qCount = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);
              return `<a href="${href('exam', { examId: exam.id })}" class="card card-hover cursor-pointer">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-wide mb-1" style="color: var(--muted);">${escapeHtml(exam.school)} · ${escapeHtml(exam.college || '期末试卷')}</div>
                    <h3 class="text-lg font-bold" style="color: var(--fg);">${escapeHtml(exam.term || exam.id)}</h3>
                    <p class="text-sm" style="color: var(--muted);">${qCount} 题 · ${exam.duration ? exam.duration + ' 分钟' : '时长待定'}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button type="button" data-action="dl-single-exam" data-exam-id="${exam.id}" class="btn-pill btn-ghost" title="下载这份试卷为 PDF">下载</button>
                    <span class="btn-pill btn-ghost">开始模拟</span>
                  </div>
                </div>
              </a>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
