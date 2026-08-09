import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('review process uses the server judge before local fallback', () => {
  const source = read('src/services/review-engine.js');
  const processStart = source.indexOf('export async function processAnswer');
  assert.notEqual(processStart, -1);
  const processBody = source.slice(processStart, source.indexOf('\n}', processStart) + 2);
  assert.match(processBody, /await judgeAnswer\(/);
});

test('wrong-book client calls use the mounted /me route', () => {
  const source = read('src/services/sync.js');
  assert.doesNotMatch(source, /api(?:Get|Post|Patch|Delete)\(['"]\/wrong-book/);
  assert.match(source, /api(?:Get|Post|Patch|Delete)\(['"]\/me\/wrong-book/);
});

test('practice record persistence uses the BFF endpoint before fallback', () => {
  const source = read('src/views/practice/quiz-adapter.js');
  assert.match(source, /apiPost\(['"]\/me\/practice-records/);
});
