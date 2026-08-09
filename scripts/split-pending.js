// 拆分 pending-questions.json 成多个批次文件，供分子智能体并行处理
// 用法: node scripts/split-pending.js <每批数量>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const batchSize = parseInt(process.argv[2] || '50', 10);
const src = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'pending-questions.json'), 'utf8'));

const batches = [];
for (let i = 0; i < src.length; i += batchSize) {
  batches.push(src.slice(i, i + batchSize));
}

const outDir = path.resolve(__dirname, 'batches');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

batches.forEach((b, idx) => {
  const name = `batch-${String(idx).padStart(3, '0')}.json`;
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(b, null, 2), 'utf-8');
  console.log(`已生成 ${name}: ${b.length} 题`);
});

console.log(`\n共 ${batches.length} 批，每批 ${batchSize} 题`);