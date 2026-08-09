// 从 all-results.json 生成批量 UPDATE SQL（answer/answers/solution 用 CASE WHEN 一次写入）
// 用法: node scripts/gen-update-sql.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-results.json'), 'utf8'));

// 分批，避免单条 SQL 过长
const CHUNK = 50;
const escape = (s) => String(s).replace(/'/g, "''");

const chunks = [];
for (let i = 0; i < results.length; i += CHUNK) {
  const slice = results.slice(i, i + CHUNK);
  const lines = slice.map(r => {
    const ans = r.answer !== null && r.answer !== undefined ? `'${escape(r.answer)}'` : 'NULL';
    const ansArr = (r.answers && Array.isArray(r.answers)) ? `'${JSON.stringify(r.answers.map(String))}'` : 'NULL';
    const sol = r.solution !== null && r.solution !== undefined ? `'${escape(r.solution)}'` : 'NULL';
    return `('${escape(r.id)}', ${ans}, ${ansArr}::jsonb, ${sol})`;
  }).join(',\n  ');
  chunks.push(`UPDATE questions AS q SET
  answer    = v.answer,
  answers   = v.answers,
  solution  = v.solution,
  updated_at = now()
FROM (VALUES
  ${lines}
) AS v(id, answer, answers, solution)
WHERE q.id = v.id;`);
}

const sqlFile = path.join(__dirname, 'update-questions.sql');
fs.writeFileSync(sqlFile, chunks.join('\n\n'), 'utf-8');
console.log(`已生成 ${sqlFile}，共 ${chunks.length} 段（每段 ${CHUNK} 条）`);