// 将 题库/**/*.md（结构化试卷）直接导入 Supabase exam_papers / exam_sections / exam_questions 三表
// 需要 service_role key（anon key 被 RLS 拦截，无法写 exam_papers）
//
// 用法:
//   1. 在 .env.local 中添加: VITE_SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
//   2. node scripts/seed-exams-to-supabase.js
//
// 行为:
//   - upsert 29 份新试卷（长沙理工 高数A（二）8 份 + 线性代数 21 份）
//   - 删除旧试卷（同济 高等数学（上/下））: 默认删除 id 以 'exam-calculus-1-final' / 'exam-calculus-2-final' 开头的
//   - 答案/解析: 暂无答案 → 空字符串 ''（避免 exact/tolerance 判分误判）
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(process.cwd());
const bankDir = path.resolve(rootDir, '题库');

function loadEnvLocal() {
  const env = {};
  const envPath = path.resolve(rootDir, '.env.local');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('缺少 VITE_SUPABASE_SERVICE_ROLE_KEY。请在 .env.local 中添加（service_role key 可绕过 RLS 写入 exam_papers）。');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// 删除的旧试卷 id 前缀
const DELETE_OLD_PREFIXES = ['exam-calculus-1-final', 'exam-calculus-2-final'];

// ─── 解析（与 md-to-exam-seed.js 共用逻辑） ───
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf(':');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let value = t.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    meta[key] = value;
  }
  return meta;
}

function parseQuestionBlock(block) {
  const q = { question_type: 0, title: '', content: '', options: [], answer: '', answers: [], solution: '', difficulty: 2, tags: [], source: '' };
  const lines = block.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    const m = ln.match(/^-\s+\*\*([a-zA-Z_]+)\*\*:\s?(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    let value = m[2];
    if (key === 'options') {
      const opts = [];
      i++;
      while (i < lines.length && /^\s{2,}-\s+/.test(lines[i])) {
        opts.push(lines[i].replace(/^\s{2,}-\s+/, '').trim());
        i++;
      }
      if (opts.length === 0) opts.push('');
      q.options = opts;
      continue;
    }
    if (key === 'content' || key === 'solution') {
      const parts = [value];
      i++;
      while (i < lines.length && !/^-\s+\*\*/.test(lines[i]) && lines[i].trim() !== '') {
        parts.push(lines[i]);
        i++;
      }
      q[key] = parts.join('\n').trim();
      continue;
    }
    q[key] = value.trim();
    i++;
  }
  if (q.answer === '暂无答案') q.answer = '';
  if (q.solution === '暂无答案' || q.solution === '暂无解析') q.solution = '';
  if (typeof q.answers === 'string') { try { q.answers = JSON.parse(q.answers); } catch { q.answers = []; } }
  if (typeof q.tags === 'string') { try { q.tags = JSON.parse(q.tags); } catch { q.tags = []; } }
  q.options = (q.options || []).map(o => o.replace(/^[A-Ha-h][.．、]\s*/, '').trim());
  q.question_type = Number(q.question_type) || 0;
  q.difficulty = Number(q.difficulty) || 2;
  return q;
}

function parsePaperFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const meta = parseFrontmatter(text);
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const sections = [];
  const secMatches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  for (let si = 0; si < secMatches.length; si++) {
    const title = secMatches[si][1].trim();
    const start = body.indexOf(secMatches[si][0]) + secMatches[si][0].length;
    const end = si + 1 < secMatches.length ? body.indexOf(secMatches[si + 1][0]) : body.length;
    const secBody = body.slice(start, end);
    const questions = [];
    const qMatches = [...secBody.matchAll(/^###\s+Q\d+.*$/gm)];
    for (let qi = 0; qi < qMatches.length; qi++) {
      const qStart = secBody.indexOf(qMatches[qi][0]) + qMatches[qi][0].length;
      const qEnd = qi + 1 < qMatches.length ? secBody.indexOf(qMatches[qi + 1][0]) : secBody.length;
      const q = parseQuestionBlock(secBody.slice(qStart, qEnd));
      if (q.content || q.title) questions.push(q);
    }
    if (title && questions.length > 0) sections.push({ title, questions });
  }
  return { meta, sections };
}

function questionTypeMap(title) {
  if (/多选/.test(title)) return 1;
  if (/判断/.test(title)) return 5;
  if (/填空/.test(title)) return 2;
  if (/证明/.test(title)) return 4;
  if (/计算|解答|应用/.test(title)) return 3;
  return 0;
}

async function upsertExam(meta, sections) {
  // exam_papers
  const { error: pErr } = await supabase.from('exam_papers').upsert({
    id: meta.id,
    school: meta.school || '',
    college: meta.college || '',
    subject: meta.subject || '',
    term: meta.term || '',
    duration: meta.duration || ''
  }, { onConflict: 'id' });
  if (pErr) throw new Error(`exam_papers ${meta.id}: ${pErr.message}`);

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const sectionId = `${meta.id}-sec-${sIdx}`;
    const { error: sErr } = await supabase.from('exam_sections').upsert({
      id: sectionId,
      exam_id: meta.id,
      title: sec.title,
      order_index: sIdx
    }, { onConflict: 'id' });
    if (sErr) throw new Error(`exam_sections ${sectionId}: ${sErr.message}`);

    const qtype = questionTypeMap(sec.title);
    const rows = sec.questions.map((q, qIdx) => ({
      id: `q-${meta.id}-s${sIdx}-${qIdx}`,
      exam_id: meta.id,
      section_id: sectionId,
      question_type: qtype,
      title: q.title || '',
      content: q.content || '',
      options: qtype === 5 && (!q.options || q.options.length !== 2) ? ['正确', '错误'] : (q.options || []),
      answer: String(q.answer ?? ''),
      answers: Array.isArray(q.answers) ? q.answers : [],
      blanks: null,
      tolerance: null,
      unit: null,
      solution: q.solution || '',
      hint: q.hint ?? null,
      test_string: q.test_string ?? null,
      image: q.image ?? null,
      difficulty: q.difficulty || 2,
      tags: Array.isArray(q.tags) ? q.tags : [],
      source: q.source || null,
      order_index: qIdx
    }));
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const { error: qErr } = await supabase.from('exam_questions').upsert(rows.slice(i, i + batchSize), { onConflict: 'id' });
      if (qErr) throw new Error(`exam_questions ${sectionId}: ${qErr.message}`);
    }
  }
  return sections.reduce((s, x) => s + x.questions.length, 0);
}

async function deleteOldPapers() {
  const { data: old, error: listErr } = await supabase.from('exam_papers').select('id').in('id', DELETE_OLD_PREFIXES);
  if (listErr) return console.warn(`⚠ 查询旧试卷失败: ${listErr.message}`);
  // 前缀匹配（exam-calculus-1-final 就是完整 id）
  const targets = DELETE_OLD_PREFIXES;
  for (const id of targets) {
    const { error } = await supabase.from('exam_papers').delete().eq('id', id);
    if (error) console.warn(`⚠ 删除 ${id} 失败: ${error.message}`);
    else console.log(`🗑  已删除旧试卷: ${id}`);
  }
}

async function main() {
  console.log('开始导入题库到 Supabase...\n');
  await deleteOldPapers();
  console.log('');

  const files = [];
  for (const sub of ['高数', '线代']) {
    const dir = path.join(bankDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.md'))) files.push(path.join(dir, f));
  }
  files.sort();

  let totalQ = 0;
  for (const filePath of files) {
    const { meta, sections } = parsePaperFile(filePath);
    if (!meta.id) { console.log(`!! 跳过(无 id): ${path.basename(filePath)}`); continue; }
    const n = await upsertExam(meta, sections);
    totalQ += n;
    console.log(`✅ ${meta.id}  (${sections.length} 大题 / ${n} 题)`);
  }
  console.log(`\n完成：导入 ${files.length} 份试卷，共 ${totalQ} 题。`);
  console.log('下一步：npm run fetch:data 同步前端 src/data/examPapers.js');
}

main().catch(err => {
  console.error('导入失败:', err);
  process.exit(1);
});
