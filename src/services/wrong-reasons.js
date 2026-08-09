export const WRONG_REASONS = Object.freeze([
  '概念 / 定义没掌握',
  '公式 / 定理记不住',
  '解题方法不会',
  '题型不熟',
  '计算过程出错',
  '审题遗漏条件',
]);

const WRONG_REASON_SET = new Set(WRONG_REASONS);

export function normaliseReasons(reasons) {
  if (!Array.isArray(reasons)) return [];
  return [...new Set(reasons.filter((reason) => WRONG_REASON_SET.has(reason)))];
}

export function isCompleteReasonSelection(questionIds, selections) {
  return questionIds.every((questionId) => (
    normaliseReasons(selections?.[questionId]).length > 0
  ));
}

export function countReasons(entries) {
  const counts = Object.fromEntries(WRONG_REASONS.map((reason) => [reason, 0]));

  for (const entry of entries) {
    for (const reason of normaliseReasons(entry?.reasons)) {
      counts[reason] += 1;
    }
  }

  return counts;
}
