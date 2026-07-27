import { EXAM_PAPERS } from '../data/examPapers.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';

export function renderExamPapers() {
  return `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">期末试卷</h1>
      <p class="mb-8" style="color: var(--muted);">收录各大学期末试卷，用于考前模拟与真题演练。</p>
      <div class="space-y-4">
        ${EXAM_PAPERS.map(exam => {
          const qCount = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);
          return `<a href="${href('exam', { examId: exam.id })}" class="card card-hover cursor-pointer">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="text-xs font-semibold uppercase tracking-wide mb-1" style="color: var(--muted);">${escapeHtml(exam.school)} · ${escapeHtml(exam.college)}</div>
                <h3 class="text-lg font-bold" style="color: var(--fg);">${escapeHtml(exam.subject)}</h3>
                <p class="text-sm" style="color: var(--muted);">${escapeHtml(exam.term)} · ${qCount} 题 · ${exam.duration} 分钟</p>
              </div>
              <span class="btn-pill btn-ghost shrink-0">开始模拟</span>
            </div>
          </a>`;
        }).join('')}
      </div>
    </div>
  `;
}
