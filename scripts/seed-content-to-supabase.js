// 将当前 src/data/*.js 中的课程/题目/试卷数据导入 Supabase
// 用法：node scripts/seed-content-to-supabase.js
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const text = fs.readFileSync(envPath, 'utf-8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    let key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedCourses() {
  const { COURSES } = await import('../src/data/courses.js');
  const courseRows = [];
  const moduleRows = [];
  const itemRows = [];

  for (const course of COURSES) {
    courseRows.push({
      id: course.id,
      title: course.title,
      description: course.description || '',
      requirements: course.requirements || []
    });

    course.modules.forEach((module, mIndex) => {
      moduleRows.push({
        course_id: course.id,
        module_id: module.id,
        title: module.title,
        order_index: mIndex
      });

      module.items.forEach((item, iIndex) => {
        itemRows.push({
          id: item.id,
          course_id: course.id,
          module_id: module.id,
          title: item.title,
          type: item.type || 'theory',
          order_index: iIndex,
          content: item.content || null
        });
      });
    });
  }

  console.log(`Seeding ${courseRows.length} courses, ${moduleRows.length} modules, ${itemRows.length} items...`);

  const { error: cErr } = await supabase.from('courses').upsert(courseRows, { onConflict: 'id' });
  if (cErr) throw cErr;

  const { error: mErr } = await supabase.from('modules').upsert(moduleRows, { onConflict: 'course_id,module_id' });
  if (mErr) throw mErr;

  const batchSize = 100;
  for (let i = 0; i < itemRows.length; i += batchSize) {
    const batch = itemRows.slice(i, i + batchSize);
    const { error } = await supabase.from('items').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function seedQuestions() {
  const { QUESTIONS } = await import('../src/data/questions.js');
  const rows = QUESTIONS.map(q => ({
    id: q.id,
    item_id: q.itemId || null,
    course_id: q.courseId || null,
    module_id: q.moduleId || null,
    question_type: q.questionType ?? 0,
    title: q.title || '',
    content: q.content || '',
    options: q.options || [],
    answer: String(q.answer ?? ''),
    answers: q.answers || [],
    blanks: q.blanks ?? null,
    tolerance: q.tolerance ?? null,
    unit: q.unit ?? null,
    solution: q.solution || '',
    hint: q.hint ?? null,
    test_string: q.testString ?? null,
    image: q.image ?? null,
    difficulty: q.difficulty ?? 1,
    tags: q.tags || [],
    source: q.source ?? null
  }));

  console.log(`Seeding ${rows.length} questions...`);
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function seedTheoryContents() {
  const { THEORY_CONTENTS } = await import('../src/data/theoryContents.js');
  const rows = THEORY_CONTENTS.map(t => ({
    item_id: t.itemId,
    course_id: t.courseId,
    module_id: t.moduleId,
    content: t.content || '',
    examples: t.examples || []
  }));

  console.log(`Seeding ${rows.length} theory contents...`);
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('theory_contents').upsert(batch, { onConflict: 'item_id' });
    if (error) throw error;
  }
}

async function seedExamPapers() {
  const { EXAM_PAPERS } = await import('../src/data/examPapers.js');
  const paperRows = [];
  const sectionRows = [];
  const questionRows = [];

  for (const exam of EXAM_PAPERS) {
    paperRows.push({
      id: exam.id,
      school: exam.school || '',
      college: exam.college || '',
      subject: exam.subject || '',
      term: exam.term || '',
      duration: exam.duration || ''
    });

    exam.sections.forEach((section, sIndex) => {
      const sectionId = `${exam.id}-sec-${sIndex}`;
      sectionRows.push({
        id: sectionId,
        exam_id: exam.id,
        title: section.title,
        order_index: sIndex
      });

      section.questions.forEach((q, qIndex) => {
        questionRows.push({
          id: q.id,
          exam_id: exam.id,
          section_id: sectionId,
          question_type: q.questionType ?? 0,
          title: q.title || '',
          content: q.content || '',
          options: q.options || [],
          answer: String(q.answer ?? ''),
          answers: q.answers || [],
          blanks: q.blanks ?? null,
          tolerance: q.tolerance ?? null,
          unit: q.unit ?? null,
          solution: q.solution || '',
          hint: q.hint ?? null,
          test_string: q.testString ?? null,
          image: q.image ?? null,
          difficulty: q.difficulty ?? 1,
          tags: q.tags || [],
          source: q.source ?? null,
          order_index: qIndex
        });
      });
    });
  }

  console.log(`Seeding ${paperRows.length} exam papers, ${sectionRows.length} sections, ${questionRows.length} exam questions...`);

  const { error: pErr } = await supabase.from('exam_papers').upsert(paperRows, { onConflict: 'id' });
  if (pErr) throw pErr;

  const batchSize = 100;
  for (let i = 0; i < sectionRows.length; i += batchSize) {
    const batch = sectionRows.slice(i, i + batchSize);
    const { error } = await supabase.from('exam_sections').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }

  for (let i = 0; i < questionRows.length; i += batchSize) {
    const batch = questionRows.slice(i, i + batchSize);
    const { error } = await supabase.from('exam_questions').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function main() {
  console.log('Seeding content to Supabase...');
  await seedCourses();
  await seedQuestions();
  await seedTheoryContents();
  await seedExamPapers();
  console.log('Done.');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
