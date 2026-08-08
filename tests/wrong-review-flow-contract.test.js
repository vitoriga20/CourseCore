import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(relativePath) {
  return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const allowedReasons = [
  '概念 / 定义没掌握',
  '公式 / 定理记不住',
  '解题方法不会',
  '题型不熟',
  '计算过程出错',
  '审题遗漏条件',
];

test('judge validates required reasons after determining a wrong answer', () => {
  const source = read('bff/src/routes/judge.ts');

  assert.match(source, /import\s*\{\s*parseWrongReasons\s*\}\s*from\s*['"]\.\.\/lib\/wrong-reasons['"]/);
  assert.match(source, /const\s*\{[^}]*\breasons\b[^}]*\}\s*=\s*body/s);
  assert.match(source, /const parsedReasons\s*=\s*parseWrongReasons\(reasons,\s*!isCorrect\)/);
  assert.match(source, /if\s*\(!parsedReasons\)\s*return jsonError\(c,\s*400,\s*['"]VALIDATION_ERROR['"]/);
});

test('schema and migration store only the six supported wrong reasons', () => {
  const schema = read('scripts/schema-v2.sql');
  const migration = read('scripts/migrations/002-wrong-book-reasons.sql');

  for (const source of [schema, migration]) {
    assert.match(source, /reasons\s+TEXT\[\]\s+NOT NULL\s+DEFAULT\s+'\{\}'/i);
    for (const reason of allowedReasons) assert.ok(source.includes(reason), `missing ${reason}`);
  }

  assert.match(migration, /概念不清[\s\S]*概念 \/ 定义没掌握/);
  assert.match(migration, /计算失误[\s\S]*计算过程出错/);
  assert.match(migration, /审题错误[\s\S]*审题遗漏条件/);
  assert.match(migration, /方法不熟[\s\S]*解题方法不会/);
  assert.doesNotMatch(migration, /时间不够['"]?\s*(?:THEN|,|=>)[\s\S]{0,40}(?:概念|公式|方法|题型|计算|审题)/);
});

test('normal and wrong-review sessions require a per-question reason summary', () => {
  for (const file of [
    'src/views/practice/practice-session.js',
    'src/views/practice/review-session.js',
  ]) {
    const source = read(file);
    assert.match(source, /import\s*\{\s*mountWrongReasonSummary\s*\}/);
    assert.match(source, /mountWrongReasonSummary\(/);
    assert.match(source, /persistFinishedSession\(s,\s*selections\)/);
    assert.match(source, /result\s*&&\s*!result\.passed\s*&&\s*!result\.manual/);
  }
});

test('wrong-reason summary gates submission until every wrong question is classified', () => {
  const source = read('src/views/practice/wrong-reason-summary.js');

  assert.match(source, /export function mountWrongReasonSummary\(container, wrongQuestions, onComplete\)/);
  assert.match(source, /import\s*\{[^}]*WRONG_REASONS[^}]*\}\s*from\s*['"]\.\.\/\.\.\/services\/wrong-reasons\.js['"]/s);
  assert.match(source, /WRONG_REASONS\.map\(/);
  assert.ok(source.includes('aria-pressed'));
  assert.ok(source.includes('完成总结并生成复习计划'));
  assert.ok(source.includes('请为每道错题至少选择一个薄弱点'));
  assert.ok(source.includes('总结已保存，错题已加入今日复习'));
});

test('review engine sends normalized arrays and aggregates legacy values only as fallback', () => {
  const source = read('src/services/review-engine.js');

  assert.match(source, /judgeAnswer\([^)]*reasons\s*=\s*\[\]/);
  assert.match(source, /processAnswer\([^)]*reasons\s*=\s*\[\]/);
  assert.match(source, /normaliseReasons\(reasons\)/);
  assert.match(source, /countReasons\(/);
  assert.ok(source.includes('概念不清'));
  assert.ok(source.includes('方法不熟'));
});

test('user wrong-book writes expose and validate optional reason arrays', () => {
  const source = read('bff/src/routes/user.ts');

  assert.match(source, /WRONG_BOOK_FIELDS[\s\S]*reason,reasons/);
  assert.match(source, /parseWrongReasons\(reasons,\s*false\)/);
});
