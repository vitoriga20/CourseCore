// 读取 src/data/*.js 生成多个 seed SQL 文件（每个 < 100KB），供 execute_sql / apply_migration 执行
import fs from 'node:fs';
import path from 'node:path';

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

function escJson(arr) {
  if (!arr || arr.length === 0) return "'[]'::jsonb";
  return esc(JSON.stringify(arr)) + '::jsonb';
}

function makeQuestionInsert(q) {
  return `INSERT INTO public.questions (id, item_id, course_id, module_id, question_type, title, content, options, answer, answers, blanks, tolerance, unit, solution, hint, test_string, image, difficulty, tags, source) VALUES (${esc(q.id)}, ${esc(q.itemId || null)}, ${esc(q.courseId || null)}, ${esc(q.moduleId || null)}, ${q.questionType ?? 0}, ${esc(q.title || '')}, ${esc(q.content || '')}, ${escJson(q.options)}, ${esc(String(q.answer ?? ''))}, ${escJson(q.answers)}, ${q.blanks ?? 'NULL'}, ${q.tolerance ?? 'NULL'}, ${esc(q.unit ?? null)}, ${esc(q.solution || '')}, ${esc(q.hint ?? null)}, ${esc(q.testString ?? null)}, ${esc(q.image ?? null)}, ${q.difficulty ?? 1}, ${escJson(q.tags)}, ${esc(q.source ?? null)}) ON CONFLICT (id) DO UPDATE SET item_id = EXCLUDED.item_id, course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, question_type = EXCLUDED.question_type, title = EXCLUDED.title, content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, answers = EXCLUDED.answers, blanks = EXCLUDED.blanks, tolerance = EXCLUDED.tolerance, unit = EXCLUDED.unit, solution = EXCLUDED.solution, hint = EXCLUDED.hint, test_string = EXCLUDED.test_string, image = EXCLUDED.image, difficulty = EXCLUDED.difficulty, tags = EXCLUDED.tags, source = EXCLUDED.source;`;
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'scripts/seed');
  fs.mkdirSync(outDir, { recursive: true });

  const { COURSES } = await import('../src/data/courses.js');
  const { QUESTIONS } = await import('../src/data/questions.js');
  const { THEORY_CONTENTS } = await import('../src/data/theoryContents.js');
  const { EXAM_PAPERS } = await import('../src/data/examPapers.js');

  // 1. courses, modules, items (items 内容存到 theory_contents，这里 content 留空)
  const cmsLines = ['BEGIN;'];
  for (const c of COURSES) {
    cmsLines.push(`INSERT INTO public.courses (id, title, description, requirements) VALUES (${esc(c.id)}, ${esc(c.title)}, ${esc(c.description || '')}, ${escJson(c.requirements)}) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, requirements = EXCLUDED.requirements;`);
  }
  for (const c of COURSES) {
    c.modules.forEach((m, idx) => {
      cmsLines.push(`INSERT INTO public.modules (course_id, module_id, title, order_index) VALUES (${esc(c.id)}, ${esc(m.id)}, ${esc(m.title)}, ${idx}) ON CONFLICT (course_id, module_id) DO UPDATE SET title = EXCLUDED.title, order_index = EXCLUDED.order_index;`);
    });
  }
  for (const c of COURSES) {
    for (const m of c.modules) {
      m.items.forEach((item, idx) => {
        cmsLines.push(`INSERT INTO public.items (id, course_id, module_id, title, type, order_index, content) VALUES (${esc(item.id)}, ${esc(c.id)}, ${esc(m.id)}, ${esc(item.title)}, ${esc(item.type || 'theory')}, ${idx}, NULL) ON CONFLICT (id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, title = EXCLUDED.title, type = EXCLUDED.type, order_index = EXCLUDED.order_index, content = EXCLUDED.content;`);
      });
    }
  }
  cmsLines.push('COMMIT;');
  fs.writeFileSync(path.join(outDir, '01-courses-modules-items.sql'), cmsLines.join('\n'), 'utf-8');

  // 2. questions, split by course and chunk to keep files small (< 50KB)
  const byCourse = {};
  for (const q of QUESTIONS) {
    const cid = q.courseId || 'unknown';
    byCourse[cid] = byCourse[cid] || [];
    byCourse[cid].push(q);
  }
  let qFileIndex = 0;
  for (const [cid, qs] of Object.entries(byCourse)) {
    const chunkSize = 40;
    for (let i = 0; i < qs.length; i += chunkSize) {
      const chunk = qs.slice(i, i + chunkSize);
      const lines = ['BEGIN;'];
      for (const q of chunk) lines.push(makeQuestionInsert(q));
      lines.push('COMMIT;');
      qFileIndex++;
      fs.writeFileSync(path.join(outDir, `02-questions-${String(qFileIndex).padStart(2, '0')}-${cid}-${String(Math.floor(i / chunkSize) + 1).padStart(2, '0')}.sql`), lines.join('\n'), 'utf-8');
    }
  }

  // 3. theory contents
  const theoryLines = ['BEGIN;'];
  for (const t of THEORY_CONTENTS) {
    theoryLines.push(`INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES (${esc(t.itemId)}, ${esc(t.courseId)}, ${esc(t.moduleId)}, ${esc(t.content || '')}, ${escJson(t.examples)}) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;`);
  }
  theoryLines.push('COMMIT;');
  fs.writeFileSync(path.join(outDir, '03-theory-contents.sql'), theoryLines.join('\n'), 'utf-8');

  // 4. exam papers, split by exam
  let examFileIndex = 0;
  for (const e of EXAM_PAPERS) {
    const examLines = ['BEGIN;'];
    examLines.push(`INSERT INTO public.exam_papers (id, school, college, subject, term, duration) VALUES (${esc(e.id)}, ${esc(e.school || '')}, ${esc(e.college || '')}, ${esc(e.subject || '')}, ${esc(e.term || '')}, ${esc(e.duration || '')}) ON CONFLICT (id) DO UPDATE SET school = EXCLUDED.school, college = EXCLUDED.college, subject = EXCLUDED.subject, term = EXCLUDED.term, duration = EXCLUDED.duration;`);
    e.sections.forEach((sec, sIdx) => {
      const sectionId = `${e.id}-sec-${sIdx}`;
      examLines.push(`INSERT INTO public.exam_sections (id, exam_id, title, order_index) VALUES (${esc(sectionId)}, ${esc(e.id)}, ${esc(sec.title)}, ${sIdx}) ON CONFLICT (id) DO UPDATE SET exam_id = EXCLUDED.exam_id, title = EXCLUDED.title, order_index = EXCLUDED.order_index;`);
      sec.questions.forEach((q, qIdx) => {
        examLines.push(`INSERT INTO public.exam_questions (id, exam_id, section_id, question_type, title, content, options, answer, answers, blanks, tolerance, unit, solution, hint, test_string, image, difficulty, tags, source, order_index) VALUES (${esc(q.id)}, ${esc(e.id)}, ${esc(sectionId)}, ${q.questionType ?? 0}, ${esc(q.title || '')}, ${esc(q.content || '')}, ${escJson(q.options)}, ${esc(String(q.answer ?? ''))}, ${escJson(q.answers)}, ${q.blanks ?? 'NULL'}, ${q.tolerance ?? 'NULL'}, ${esc(q.unit ?? null)}, ${esc(q.solution || '')}, ${esc(q.hint ?? null)}, ${esc(q.testString ?? null)}, ${esc(q.image ?? null)}, ${q.difficulty ?? 1}, ${escJson(q.tags)}, ${esc(q.source ?? null)}, ${qIdx}) ON CONFLICT (id) DO UPDATE SET exam_id = EXCLUDED.exam_id, section_id = EXCLUDED.section_id, question_type = EXCLUDED.question_type, title = EXCLUDED.title, content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, answers = EXCLUDED.answers, blanks = EXCLUDED.blanks, tolerance = EXCLUDED.tolerance, unit = EXCLUDED.unit, solution = EXCLUDED.solution, hint = EXCLUDED.hint, test_string = EXCLUDED.test_string, image = EXCLUDED.image, difficulty = EXCLUDED.difficulty, tags = EXCLUDED.tags, source = EXCLUDED.source, order_index = EXCLUDED.order_index;`);
      });
    });
    examLines.push('COMMIT;');
    examFileIndex++;
    fs.writeFileSync(path.join(outDir, `04-exam-papers-${String(examFileIndex).padStart(2, '0')}-${e.id}.sql`), examLines.join('\n'), 'utf-8');
  }

  console.log(`Generated seed SQL files in ${outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
