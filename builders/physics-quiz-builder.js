import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TEMPLATE_PATH = path.resolve(root, '..', 'index（综合混合）.html');
const OUT_DIR = path.join(root, 'curriculum', 'raw', 'questions', 'physics-b-1');

const COURSE_ID = 'physics-b-1';

const CATEGORY_MAP = {
  '力学': { moduleId: 'p1b-m1', itemId: 'p1b-m1-quiz', title: '力学期末综合测验' },
  '波动光学': { moduleId: 'p1b-m2', itemId: 'p1b-m2-quiz', title: '波动光学期末综合测验' }
};

const TYPE_MAP = {
  multipleChoice: 'singleChoice',
  fillInTheBlank: 'fillInBlank',
  problemSolving: 'calculation'
};

const THEORY_ITEMS = [
  // 力学
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-01', title: '质点运动学基础' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-02', title: '质点运动学与相对运动' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-03', title: '牛顿运动定律与非惯性系' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-04', title: '动量与动量守恒定律' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-05', title: '功和能与机械能守恒定律' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-06', title: '角动量与角动量守恒定律' },
  { moduleId: 'p1b-m1', itemId: 'p1b-m1-07', title: '刚体的定轴转动' },
  // 波动光学
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-01', title: '光的干涉基础' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-02', title: '光程差与薄膜干涉' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-03', title: '薄膜干涉与迈克耳逊干涉仪' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-04', title: '光的衍射与单缝衍射' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-05', title: '光栅衍射' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-06', title: '光学仪器分辨率与X射线衍射' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-07', title: '光的偏振' },
  { moduleId: 'p1b-m2', itemId: 'p1b-m2-08', title: '反射折射偏振与双折射' }
];

function extractQuestionBankData(html) {
  const startMarker = 'const questionBankData = ';
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error('questionBankData not found');

  let braceStart = html.indexOf('[', start);
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = braceStart;

  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const jsonText = html.slice(braceStart, end);
  return JSON.parse(jsonText);
}

function letterToIndex(letter) {
  const idx = letter.toUpperCase().charCodeAt(0) - 65;
  return idx >= 0 && idx <= 25 ? idx : -1;
}

function rewriteImagePath(imagePath) {
  if (!imagePath) return undefined;
  const match = imagePath.match(/assets\/(q\d+\.jpg)/i);
  return match ? `/physics/${match[1]}` : imagePath;
}

function isNumericLike(value) {
  if (!value) return false;
  const cleaned = String(value)
    .replace(/\$|\\mathrm\{[^}]*\}|\\,|\\;|[\s\u3000]/g, '')
    .replace(/\\[a-zA-Z]+/g, '');
  return /^[\d\+\-\.\/×\^×·]*\d[\d\+\-\.\/×\^×·]*$/.test(cleaned) && /\d/.test(cleaned);
}

function determineQuestionType(rawType, answer) {
  const mapped = TYPE_MAP[rawType];
  if (mapped !== 'calculation') return mapped;
  // problemSolving: if answer looks numeric use calculation, else proof
  return isNumericLike(answer) ? 'calculation' : 'proof';
}

function formatAnswer(rawType, answer) {
  if (rawType === 'multipleChoice') {
    const idx = letterToIndex(answer);
    return idx >= 0 ? String(idx) : answer;
  }
  if (rawType === 'fillInTheBlank' || rawType === 'problemSolving') {
    // answer may be a string with semicolon-separated parts
    return String(answer).split(';').map(s => s.trim()).join('; ');
  }
  return String(answer);
}

function escapeYamlString(s) {
  if (s == null) return '';
  const str = String(s);
  if (/[:#\n\r'"{}\[\],&*!?|><=\-`]/.test(str) || str.startsWith(' ') || str.endsWith(' ')) {
    return JSON.stringify(str);
  }
  return str;
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => JSON.stringify(v)).join(', ')}]`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${escapeYamlString(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function buildMarkdown(question, courseId, moduleId, itemId, seqInItem) {
  const questionType = determineQuestionType(question.type, question.answer);
  const answer = formatAnswer(question.type, question.answer);
  const image = rewriteImagePath(question.image);

  const id = `q-${courseId}-${itemId}-${String(seqInItem).padStart(3, '0')}`;

  const fields = {
    id,
    courseId,
    moduleId,
    itemId,
    questionType,
    title: `第 ${seqInItem} 题`,
    answer,
    tags: [question.category],
    source: '大学物理B（上）综合测试'
  };

  if (image) fields.image = image;
  if (questionType === 'calculation') fields.tolerance = 0.05;

  const lines = [buildFrontmatter(fields), ''];

  lines.push('## Content');
  lines.push(question.question);
  lines.push('');

  if (question.options && question.options.length > 0) {
    lines.push('## Options');
    for (const opt of question.options) {
      lines.push(`- ${opt}`);
    }
    lines.push('');
  }

  if (question.solution) {
    lines.push('## Solution');
    lines.push(question.solution);
    lines.push('');
  }

  return lines.join('\n');
}

function generateTheoryMarkdown(item) {
  const id = `${item.itemId}-theory`;
  const fields = {
    id,
    courseId: COURSE_ID,
    moduleId: item.moduleId,
    itemId: item.itemId,
    type: 'theory',
    title: item.title
  };

  const lines = [buildFrontmatter(fields), ''];
  lines.push('## Content');
  lines.push(`本节为 **${item.title}** 的理论内容占位小节。`);
  lines.push('');
  lines.push('> 正式讲义内容待后续补充，当前仅用于展示课程章节结构。');
  lines.push('');

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found: ${TEMPLATE_PATH}`);
  }

  const html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const questions = extractQuestionBankData(html);

  // Group by category
  const groups = {};
  for (const q of questions) {
    const cat = q.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(q);
  }

  // Clean output directory
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }

  let total = 0;

  for (const [category, items] of Object.entries(groups)) {
    const config = CATEGORY_MAP[category];
    if (!config) {
      console.warn(`Unknown category: ${category}, skipped`);
      continue;
    }

    const dir = path.join(OUT_DIR, config.itemId);
    fs.mkdirSync(dir, { recursive: true });

    items.sort((a, b) => a.id - b.id);
    for (let i = 0; i < items.length; i++) {
      const q = items[i];
      const seq = i + 1;
      const md = buildMarkdown(q, COURSE_ID, config.moduleId, config.itemId, seq);
      const filePath = path.join(dir, `q-${COURSE_ID}-${config.itemId}-${String(seq).padStart(3, '0')}.md`);
      fs.writeFileSync(filePath, md, 'utf-8');
      total++;
    }

    console.log(`Generated ${items.length} questions for ${category} → ${config.itemId}`);
  }

  // Generate theory placeholders
  for (const item of THEORY_ITEMS) {
    const filePath = path.join(OUT_DIR, `${item.itemId}.md`);
    fs.writeFileSync(filePath, generateTheoryMarkdown(item), 'utf-8');
  }
  console.log(`Generated ${THEORY_ITEMS.length} theory placeholders`);

  console.log(`Total questions: ${total}`);
}

main();
