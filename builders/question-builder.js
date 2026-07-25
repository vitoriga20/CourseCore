import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

import { questionTypes } from '../src/config/question-types.js';

const questionTypeByName = Object.fromEntries(
  Object.entries(questionTypes).map(([k, v]) => [k, v])
);

function resolveQuestionType(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value in questionTypeByName) {
    return questionTypeByName[value];
  }
  throw new Error(`Unknown questionType: ${value}`);
}

function parseSections(content, level = 2) {
  const sections = {};
  const prefix = '#'.repeat(level) + ' ';
  const regex = new RegExp(`^${prefix}(\\w+)\\s*\\n`, 'gm');
  let match;
  const matches = [];
  while ((match = regex.exec(content)) !== null) {
    matches.push({ name: match[1], index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].name.length + level + 2;
    const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
    sections[matches[i].name.toLowerCase()] = content.slice(start, end).trim();
  }
  return sections;
}

function parseRepeatedSections(content, level = 2) {
  const prefix = '#'.repeat(level) + ' ';
  const regex = new RegExp(`^${prefix}(\\w+)\\s*\\n`, 'gm');
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push({ name: match[1], index: match.index, length: match[0].length });
  }

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].length;
    const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
    sections.push({
      name: matches[i].name,
      content: content.slice(start, end).trim()
    });
  }
  return sections;
}

function parseOptions(text) {
  if (!text) return undefined;
  return text
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

function parseTags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function buildQuestion(frontmatter, sections) {
  const q = {
    id: frontmatter.id,
    courseId: frontmatter.courseId || null,
    moduleId: frontmatter.moduleId || null,
    itemId: frontmatter.itemId || null,
    questionType: resolveQuestionType(frontmatter.questionType),
    title: frontmatter.title || '',
    content: sections.content || '',
    answer: frontmatter.answer ?? sections.answer ?? '',
    solution: sections.solution || '',
    difficulty: Number(frontmatter.difficulty) || 1,
    tags: parseTags(frontmatter.tags),
    source: frontmatter.source || ''
  };

  if (sections.options) {
    q.options = parseOptions(sections.options);
  }
  if ('answers' in frontmatter || 'answers' in sections) {
    q.answers = Array.isArray(frontmatter.answers)
      ? frontmatter.answers
      : parseTags(frontmatter.answers || sections.answers);
  }
  if ('blanks' in frontmatter) {
    q.blanks = Number(frontmatter.blanks) || 1;
  }
  if ('tolerance' in frontmatter) {
    q.tolerance = Number(frontmatter.tolerance);
  }
  if ('unit' in frontmatter) {
    q.unit = frontmatter.unit;
  }
  if ('hint' in frontmatter) {
    q.hint = frontmatter.hint;
  }
  if ('testString' in frontmatter) {
    q.testString = frontmatter.testString;
  }
  if ('image' in frontmatter && frontmatter.image) {
    q.image = frontmatter.image;
  }

  return q;
}

function validateQuestion(q, sourcePath) {
  const required = ['id', 'questionType', 'content'];
  for (const key of required) {
    if (q[key] === undefined || q[key] === '') {
      throw new Error(`Missing required field "${key}" in ${sourcePath}`);
    }
  }
  if (!('answer' in q) && !('answers' in q)) {
    throw new Error(`Missing "answer" or "answers" in ${sourcePath}`);
  }
}

function parseQuestionMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  if (frontmatter.type === 'theory') {
    return null;
  }
  const sections = parseSections(content, 2);
  const q = buildQuestion(frontmatter, sections);
  validateQuestion(q, filePath);
  return q;
}

function parseTheoryMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  if (frontmatter.type !== 'theory') return null;
  const sections = parseSections(content, 2);
  return {
    id: frontmatter.id,
    courseId: frontmatter.courseId || null,
    moduleId: frontmatter.moduleId || null,
    itemId: frontmatter.itemId || null,
    title: frontmatter.title || '',
    content: sections.content || content.trim()
  };
}

function parseExamMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const sectionList = parseRepeatedSections(content, 2);

  const exam = {
    id: frontmatter.id,
    school: frontmatter.school || '',
    college: frontmatter.college || '',
    subject: frontmatter.subject || '',
    term: frontmatter.term || '',
    duration: Number(frontmatter.duration) || 120,
    sections: []
  };

  for (const { name, content: sectionRaw } of sectionList) {
    if (name.toLowerCase() !== 'section') continue;
    const secMatter = matter('---\n' + sectionRaw.replace(/^---\n/, ''));
    const secContent = secMatter.content;
    const secFrontmatter = secMatter.data;

    const questionList = parseRepeatedSections(secContent, 3);
    const questions = [];

    for (const { name: qName, content: qRaw } of questionList) {
      if (qName.toLowerCase() !== 'question') continue;
      const qMatter = matter('---\n' + qRaw.replace(/^---\n/, ''));
      const qSections = parseSections(qMatter.content, 4);
      const q = buildQuestion(qMatter.data, qSections);
      validateQuestion(q, `${filePath} > ${secFrontmatter.title}`);
      questions.push(q);
    }

    exam.sections.push({
      title: secFrontmatter.title || '',
      questions
    });
  }

  return exam;
}

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const questionsDir = path.join(root, 'curriculum', 'raw', 'questions');
  const examsDir = path.join(root, 'curriculum', 'raw', 'exams');

  const allFiles = walk(questionsDir);
  const questions = allFiles.map(parseQuestionMarkdown).filter(Boolean);
  const theoryContents = allFiles.map(parseTheoryMarkdown).filter(Boolean);

  const examFiles = fs.existsSync(examsDir)
    ? fs.readdirSync(examsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(examsDir, f))
    : [];
  const examPapers = examFiles.map(parseExamMarkdown);

  const outQuestions = path.join(root, 'src', 'data', 'questions.js');
  const outExams = path.join(root, 'src', 'data', 'examPapers.js');
  const outTheory = path.join(root, 'src', 'data', 'theoryContents.js');

  fs.writeFileSync(
    outQuestions,
    `// Auto-generated by builders/question-builder.js. Do not edit manually.\nexport const QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`,
    'utf-8'
  );

  fs.writeFileSync(
    outExams,
    `// Auto-generated by builders/question-builder.js. Do not edit manually.\nexport const EXAM_PAPERS = ${JSON.stringify(examPapers, null, 2)};\n`,
    'utf-8'
  );

  fs.writeFileSync(
    outTheory,
    `// Auto-generated by builders/question-builder.js. Do not edit manually.\nexport const THEORY_CONTENTS = ${JSON.stringify(theoryContents, null, 2)};\n`,
    'utf-8'
  );

  console.log(`Built ${questions.length} questions, ${theoryContents.length} theory contents and ${examPapers.length} exam papers.`);
}

main();
