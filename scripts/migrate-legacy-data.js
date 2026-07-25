import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const kindToType = {
  choice: 'singleChoice',
  fill: 'fillInBlank',
  calc: 'calculation',
  proof: 'proof',
  apply: 'calculation'
};

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function questionToMarkdown(q) {
  const questionType = kindToType[q.kind] || 'calculation';
  const tags = q.kind === 'apply' ? "['应用']" : "[]";
  const source = q.courseId || '平台题库';
  const blanks = q.kind === 'fill' ? 'blanks: 1\n' : '';
  const tolerance = q.kind === 'calc' || q.kind === 'apply' ? 'tolerance: 1e-6\n' : '';
  const options = Array.isArray(q.options) && q.options.length > 0
    ? `\n## Options\n${q.options.map(opt => `- ${opt}`).join('\n')}\n`
    : '';

  return `---
id: ${q.id}
courseId: ${q.courseId || ''}
moduleId: ${q.moduleId || ''}
itemId: ${q.itemId || ''}
questionType: ${questionType}
title: ${q.title || ''}
difficulty: 1
tags: ${tags}
source: ${source}
${blanks}${tolerance}---

## Content
${q.content || ''}
${options}
## Answer
${q.answer || ''}

## Solution
${q.solution || ''}
`;
}

function examToMarkdown(exam) {
  const sectionsMd = exam.sections.map(sec => {
    const questionsMd = sec.questions.map(q => {
      const questionType = kindToType[q.kind] || 'calculation';
      const blanks = q.kind === 'fill' ? 'blanks: 1\n' : '';
      const tolerance = q.kind === 'calc' || q.kind === 'apply' ? 'tolerance: 1e-6\n' : '';
      const options = Array.isArray(q.options) && q.options.length > 0
        ? `\n#### Options\n${q.options.map(opt => `- ${opt}`).join('\n')}\n`
        : '';

      return `### Question
---
id: ${q.id}
questionType: ${questionType}
${blanks}${tolerance}---

#### Content
${q.content || ''}
${options}
#### Answer
${q.answer || ''}

#### Solution
${q.solution || ''}
`;
    }).join('\n');

    return `## Section
---
title: ${sec.title}
---

${questionsMd}`;
  }).join('\n\n');

  return `---
id: ${exam.id}
school: ${exam.school || ''}
college: ${exam.college || ''}
subject: ${exam.subject || ''}
term: ${exam.term || ''}
duration: ${exam.duration || 120}
---

${sectionsMd}
`;
}

async function main() {
  const { QUESTIONS } = await import('../src/data/questions.js');
  const { EXAM_PAPERS } = await import('../src/data/examPapers.js');

  const questionsDir = path.join(root, 'curriculum', 'raw', 'questions');
  const examsDir = path.join(root, 'curriculum', 'raw', 'exams');
  fs.mkdirSync(questionsDir, { recursive: true });
  fs.mkdirSync(examsDir, { recursive: true });

  const byCourse = {};
  for (const q of QUESTIONS) {
    const courseId = q.courseId || 'uncategorized';
    byCourse[courseId] = byCourse[courseId] || [];
    byCourse[courseId].push(q);
  }

  for (const [courseId, questions] of Object.entries(byCourse)) {
    const courseDir = path.join(questionsDir, slugify(courseId));
    fs.mkdirSync(courseDir, { recursive: true });
    for (const q of questions) {
      const fileName = `${q.id}.md`;
      fs.writeFileSync(path.join(courseDir, fileName), questionToMarkdown(q), 'utf-8');
    }
  }

  for (const exam of EXAM_PAPERS) {
    const fileName = `${exam.id}.md`;
    fs.writeFileSync(path.join(examsDir, fileName), examToMarkdown(exam), 'utf-8');
  }

  console.log(`Migrated ${QUESTIONS.length} questions and ${EXAM_PAPERS.length} exams to curriculum/raw/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
