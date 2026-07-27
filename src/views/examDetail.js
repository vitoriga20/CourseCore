import { state } from '../state.js';
import { EXAM_PAPERS } from '../data/examPapers.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';

export function renderExamDetail(examId) {
  const exam = EXAM_PAPERS.find(e => e.id === examId);
  if (!exam) return '';

  return `
    <div class="max-w-4xl mx-auto">
      <a href="${href('exams')}" class="text-sm mb-4 inline-block" style="color: var(--muted);">← 返回试卷列表</a>
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-2" style="color: var(--fg);">${escapeHtml(exam.subject)}</h1>
      <p class="mb-8" style="color: var(--muted);">${escapeHtml(exam.school)} ${escapeHtml(exam.college)} · ${escapeHtml(exam.term)} · ${exam.duration} 分钟</p>
      <div class="space-y-8">
        ${exam.sections.map((sec, sidx) => `
          <div>
            <h2 class="text-lg font-bold mb-4" style="color: var(--fg);">${escapeHtml(sec.title)}</h2>
            <div class="space-y-4">
              ${sec.questions.map((q, idx) => `
                <a href="${href('examQuestion', { examId: exam.id, qid: q.id })}" class="card card-hover cursor-pointer">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="kind-tag">${QUESTION_TYPE_LABELS[q.questionType]}</span>
                    ${state.completedQuestions[q.id] ? `<span class="text-xs font-semibold" style="color:var(--success)">已完成</span>` : ''}
                  </div>
                  <div class="text-sm" style="color: var(--fg);">${sidx + 1}.${idx + 1} ${q.content}</div>
                </a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
