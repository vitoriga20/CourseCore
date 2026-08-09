import test from 'node:test';
import assert from 'node:assert/strict';
import { sortExamQuestionLinks } from '../src/services/admin.js';

test('orders paper questions by section order then question order', () => {
  const links = [
    { id: 'calculation-2', order_index: 1, exam_sections: { order_index: 2 } },
    { id: 'choice-2', order_index: 1, exam_sections: { order_index: 0 } },
    { id: 'fill-1', order_index: 0, exam_sections: { order_index: 1 } },
    { id: 'choice-1', order_index: 0, exam_sections: { order_index: 0 } },
    { id: 'calculation-1', order_index: 0, exam_sections: { order_index: 2 } }
  ];

  assert.deepEqual(
    sortExamQuestionLinks(links).map(link => link.id),
    ['choice-1', 'choice-2', 'fill-1', 'calculation-1', 'calculation-2']
  );
});

test('keeps unsectioned editor questions in their saved order', () => {
  const links = [
    { id: 'third', order_index: 2, section_id: null },
    { id: 'first', order_index: 0, section_id: null },
    { id: 'second', order_index: 1, section_id: null }
  ];

  assert.deepEqual(
    sortExamQuestionLinks(links).map(link => link.id),
    ['first', 'second', 'third']
  );
});

test('restores legacy paper order from question ids when section data is absent', () => {
  const links = [
    { id: 'link-fill-1', question_id: 'q-exam-calculus-2-2023-s1-0', order_index: 0, section_id: null },
    { id: 'link-choice-2', question_id: 'q-exam-calculus-2-2023-s0-1', order_index: 1, section_id: null },
    { id: 'link-choice-1', question_id: 'q-exam-calculus-2-2023-s0-0', order_index: 0, section_id: null }
  ];

  assert.deepEqual(
    sortExamQuestionLinks(links).map(link => link.question_id),
    [
      'q-exam-calculus-2-2023-s0-0',
      'q-exam-calculus-2-2023-s0-1',
      'q-exam-calculus-2-2023-s1-0'
    ]
  );
});
