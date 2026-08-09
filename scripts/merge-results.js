// 合并 13 个批次结果，校验完整性，生成最终写入映射
// 用法: node scripts/merge-results.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, 'results');
const batchesDir = path.join(__dirname, 'batches');

// 收集所有批次输入题目
const allInput = [];
for (let i = 0; i < 13; i++) {
  const name = `batch-${String(i).padStart(3, '0')}.json`;
  const arr = JSON.parse(fs.readFileSync(path.join(batchesDir, name), 'utf8'));
  allInput.push(...arr);
}

// 收集所有结果
const allResults = [];
for (let i = 0; i < 13; i++) {
  const name = `batch-${String(i).padStart(3, '0')}-result.json`;
  const p = path.join(resultsDir, name);
  if (!fs.existsSync(p)) throw new Error(`缺少结果文件: ${name}`);
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  allResults.push(...arr);
}

console.log(`输入题目: ${allInput.length}, 结果: ${allResults.length}`);

// 1. id 集合对比
const inputIds = new Set(allInput.map(q => q.id));
const resultIds = new Set(allResults.map(q => q.id));
const missing = [...inputIds].filter(id => !resultIds.has(id));
const extra = [...resultIds].filter(id => !inputIds.has(id));
console.log('缺失 id:', missing.length ? missing : '无');
console.log('多余 id:', extra.length ? extra : '无');

// 2. 每个结果检查 answer/solution
const idToInput = new Map(allInput.map(q => [q.id, q]));
let nullAnswer = 0, nullSolution = 0, answerEmpty = 0, solutionEmpty = 0;
const flagged = [];
for (const r of allResults) {
  const inp = idToInput.get(r.id);
  if (!inp) continue;
  const ans = r.answer;
  const sol = r.solution;
  if (ans === null || ans === undefined) nullAnswer++;
  if (sol === null || sol === undefined) nullSolution++;
  if (typeof sol === 'string' && sol.trim() === '') { solutionEmpty++; flagged.push({ id: r.id, why: 'solution为空' }); }
  if (typeof ans === 'string' && (ans.trim() === '' || ans.includes('待补充') || ans.includes('占位'))) { answerEmpty++; flagged.push({ id: r.id, why: `answer异常:${ans}` }); }
  if (ans === null || ans === undefined) flagged.push({ id: r.id, why: 'answer为null' });
}
console.log(`answer=null: ${nullAnswer}, solution=null: ${nullSolution}, solution空: ${solutionEmpty}, answer占位/空: ${answerEmpty}`);

// 3. 单选题型 answer 应为索引字符串
const qtype0 = allResults.filter(r => idToInput.get(r.id)?.question_type === 0);
const badIdx = qtype0.filter(r => !/^\d+$/.test(String(r.answer)));
console.log(`单选共 ${qtype0.length}, 非数字索引 answer: ${badIdx.length}`, badIdx.map(r => r.id));

// 写入合并文件
const merged = allResults.map(r => ({ id: r.id, answer: r.answer, answers: r.answers, solution: r.solution }));
fs.writeFileSync(path.join(__dirname, 'all-results.json'), JSON.stringify(merged, null, 2), 'utf-8');
console.log(`\n已写入 scripts/all-results.json (${merged.length} 条)`);
if (flagged.length) console.log('需人工关注:', JSON.stringify(flagged, null, 2));