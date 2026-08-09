import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('reveal has one authoritative BFF handler', () => {
  const content = read('bff/src/routes/content.ts');
  const judge = read('bff/src/routes/judge.ts');
  assert.doesNotMatch(content, /content\.post\(['"]\/questions\/:id\/reveal/);
  assert.match(judge, /judge\.post\(['"]\/questions\/:id\/reveal/);
});
