import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

import {
  WRONG_REASONS,
  countReasons,
  isCompleteReasonSelection,
  normaliseReasons,
} from '../src/services/wrong-reasons.js';

const bffModuleUrl = new URL('../bff/src/lib/wrong-reasons.ts', import.meta.url);
const bffSource = fs.readFileSync(bffModuleUrl, 'utf8');
const { code: bffCommonJs } = transformSync(bffSource, {
  loader: 'ts',
  format: 'cjs',
  target: 'node18',
});
const bffModule = { exports: {} };
const evaluateBffModule = vm.runInThisContext(
  `(function (module, exports) { ${bffCommonJs}\n })`,
  { filename: fileURLToPath(bffModuleUrl) },
);
evaluateBffModule(bffModule, bffModule.exports);

const {
  WRONG_REASONS: BFF_WRONG_REASONS,
  parseWrongReasons,
} = bffModule.exports;

const [concept, formula, method, familiarity, calculation, reading] = [
  '概念 / 定义没掌握',
  '公式 / 定理记不住',
  '解题方法不会',
  '题型不熟',
  '计算过程出错',
  '审题遗漏条件',
];

test('requires at least one valid reason for every wrong question', () => {
  const questionIds = ['q1', 'q2'];
  const selections = {
    q1: [concept],
    q2: ['就是错了'],
  };

  assert.equal(isCompleteReasonSelection(questionIds, selections), false);

  selections.q2 = [calculation, reading];
  assert.equal(isCompleteReasonSelection(questionIds, selections), true);
});

test('normalises reasons by removing duplicates and invalid labels in order', () => {
  assert.deepEqual(
    normaliseReasons([method, '粗心', method, formula, '就是错了', concept]),
    [method, formula, concept],
  );
  assert.deepEqual(normaliseReasons(null), []);
});

test('counts every selected reason and initializes all allowed labels', () => {
  assert.deepEqual(
    countReasons([
      { reasons: [concept, calculation] },
      { reasons: [calculation, reading] },
      { reasons: [familiarity, '粗心'] },
    ]),
    {
      [concept]: 1,
      [formula]: 0,
      [method]: 0,
      [familiarity]: 1,
      [calculation]: 2,
      [reading]: 1,
    },
  );
});

test('exports only actionable reasons and excludes “就是错了”', () => {
  assert.deepEqual(WRONG_REASONS, [concept, formula, method, familiarity, calculation, reading]);
  assert.equal(WRONG_REASONS.includes('就是错了'), false);
  assert.equal(WRONG_REASONS.includes('粗心'), false);
  assert.equal(Object.isFrozen(WRONG_REASONS), true);
});

test('keeps the client and BFF wrong-reason catalogs in parity', () => {
  assert.deepEqual(BFF_WRONG_REASONS, WRONG_REASONS);
});

test('parses absent wrong reasons according to whether they are required', () => {
  assert.deepEqual(parseWrongReasons(null, false), []);
  assert.deepEqual(parseWrongReasons(undefined, false), []);
  assert.deepEqual(parseWrongReasons([], false), []);
  assert.equal(parseWrongReasons(null, true), null);
  assert.equal(parseWrongReasons(undefined, true), null);
  assert.equal(parseWrongReasons([], true), null);
});

test('rejects invalid and duplicate wrong reasons at the BFF boundary', () => {
  assert.equal(parseWrongReasons(concept, false), null);
  assert.equal(parseWrongReasons([concept, '就是错了'], false), null);
  assert.equal(parseWrongReasons([concept, 42], false), null);
  assert.equal(parseWrongReasons([concept, concept], false), null);
});

test('preserves a valid wrong-reason array', () => {
  const reasons = [method, calculation, reading];

  assert.deepEqual(parseWrongReasons(reasons, true), reasons);
});
