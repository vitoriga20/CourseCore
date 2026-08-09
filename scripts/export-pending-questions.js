// 导出缺 answer 或 solution 的题目到本地 JSON，供分子智能体分批补答案/解析
// 用法: node scripts/export-pending-questions.js
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');
const outPath = path.resolve(rootDir, 'scripts/pending-questions.json');

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { enabled: false, transport: WebSocket }
});

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_type, title, content, options, answer, answers, blanks, tolerance, unit, solution, hint, difficulty, tags, source')
    .or('answer.is.null,answer.eq.,answer.eq.答案待补充,solution.is.null,solution.eq.')
    .order('id');
  if (error) throw new Error(`fetch questions: ${error.message}`);

  const rows = (data || []).map(q => ({
    id: q.id,
    question_type: q.question_type,
    title: q.title,
    content: q.content,
    options: Array.isArray(q.options) ? q.options : [],
    answer: q.answer,
    answers: Array.isArray(q.answers) ? q.answers : [],
    blanks: q.blanks,
    tolerance: q.tolerance,
    unit: q.unit,
    solution: q.solution,
    hint: q.hint,
    needs_answer: (q.answer === null || q.answer === '' || q.answer === '答案待补充'),
    needs_solution: (q.solution === null || q.solution === '')
  }));

  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`导出 ${rows.length} 题 -> ${outPath}`);
  console.log(`  需补答案: ${rows.filter(r => r.needs_answer).length} 题`);
  console.log(`  需补解析: ${rows.filter(r => r.needs_solution).length} 题`);
}

main().catch(e => { console.error('错误:', e.message); process.exit(1); });