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

const LETTER_TO_INDEX = { A: '0', B: '1', C: '2', D: '3', E: '4', F: '5' };

const TRUTHY_LABELS = new Set(['正确', '对', '是', 'true', 't', 'yes', 'y', '1']);
const FALSY_LABELS = new Set(['错误', '错', '否', 'false', 'f', 'no', 'n', '0']);

function isDigitString(value) {
  return typeof value === 'string' && /^\d+$/.test(value.trim());
}

function letterToIndex(letter, options, sourcePath) {
  const upper = String(letter).trim().toUpperCase();
  if (!/^[A-Z]$/.test(upper)) return null;
  const idx = LETTER_TO_INDEX[upper];
  if (idx === undefined) {
    if (sourcePath) console.warn(`[question-builder] Unknown answer letter "${upper}" in ${sourcePath}`);
    return null;
  }
  const numIdx = parseInt(idx, 10);
  if (options && numIdx >= options.length) {
    if (sourcePath) console.warn(`[question-builder] Answer "${upper}" maps to index ${idx} but only ${options.length} options in ${sourcePath}`);
    return null;
  }
  return idx;
}

function normalizeChoiceAnswer(answer, options, sourcePath) {
  if (answer === undefined || answer === null || answer === '') return answer;
  if (isDigitString(answer)) return answer.trim();
  const fromLetter = letterToIndex(answer, options, sourcePath);
  if (fromLetter !== null) return fromLetter;
  const lower = String(answer).trim().toLowerCase();
  if (TRUTHY_LABELS.has(lower)) return '1';
  if (FALSY_LABELS.has(lower)) return '0';
  return answer;
}

function buildQuestion(frontmatter, sections, sourcePath = '') {
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

  const choiceTypes = [questionTypes.singleChoice, questionTypes.multipleChoice, questionTypes.trueFalse];
  if (choiceTypes.includes(q.questionType)) {
    if (q.questionType === questionTypes.multipleChoice && Array.isArray(q.answers)) {
      q.answers = q.answers.map(a => normalizeChoiceAnswer(a, q.options, sourcePath));
    } else {
      q.answer = normalizeChoiceAnswer(q.answer, q.options, sourcePath);
    }
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

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n');
}

function parseQuestionMarkdown(filePath) {
  const raw = normalizeLineEndings(fs.readFileSync(filePath, 'utf-8'));
  const { data: frontmatter, content } = matter(raw);
  if (frontmatter.type === 'theory') {
    return null;
  }
  const sections = parseSections(content, 2);
  const q = buildQuestion(frontmatter, sections, filePath);
  validateQuestion(q, filePath);
  return q;
}

function parseTheoryMarkdown(filePath) {
  const raw = normalizeLineEndings(fs.readFileSync(filePath, 'utf-8'));
  const { data: frontmatter, content } = matter(raw);
  if (frontmatter.type !== 'theory') return null;
  const sections = parseSections(content, 2);
  const examples = Array.isArray(frontmatter.examples)
    ? frontmatter.examples.filter(id => typeof id === 'string')
    : [];
  return {
    id: frontmatter.id,
    courseId: frontmatter.courseId || null,
    moduleId: frontmatter.moduleId || null,
    itemId: frontmatter.itemId || null,
    title: frontmatter.title || '',
    content: sections.content || content.trim(),
    examples
  };
}

function parseExamMarkdown(filePath) {
  const raw = normalizeLineEndings(fs.readFileSync(filePath, 'utf-8'));
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
      const q = buildQuestion(qMatter.data, qSections, `${filePath} > ${secFrontmatter.title}`);
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
