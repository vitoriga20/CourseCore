import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../src/views/practice/quiz-adapter.js', import.meta.url),
  'utf8',
);

test('returns the initialized quiz state so the practice session can register its finish callback', () => {
  assert.match(
    source,
    /export function initQuizAdapter\(virtualId, questions\)\s*\{\s*return initQuizSession\(virtualId, questions\);\s*\}/s,
  );
});
