// 把 update-questions.sql 拆成独立 UPDATE 语句文件
// 注意：不能按空行拆（solution 字符串里含 \n\n），只能按 "UPDATE questions" 语句边界拆
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'update-questions.sql'), 'utf8');
const parts = sql.split(/UPDATE questions AS q SET/).filter(s => s.trim());
const dir = path.join(__dirname, 'sqlseg');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
parts.forEach((p, i) => {
  const body = `UPDATE questions AS q SET${p}`.trim();
  fs.writeFileSync(path.join(dir, `seg-${String(i + 1).padStart(2, '0')}.sql`), body, 'utf8');
});
console.log(`拆分 ${parts.length} 段 -> ${dir}`);
parts.forEach((p, i) => {
  const body = `UPDATE questions AS q SET${p}`.trim();
  console.log(`seg-${String(i + 1).padStart(2, '0')}.sql: ${body.length}B`);
});