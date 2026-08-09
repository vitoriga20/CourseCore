export const WRONG_REASONS = Object.freeze([
  '概念 / 定义没掌握',
  '公式 / 定理记不住',
  '解题方法不会',
  '题型不熟',
  '计算过程出错',
  '审题遗漏条件',
] as const);

export type WrongReason = (typeof WRONG_REASONS)[number];

const WRONG_REASON_SET = new Set<string>(WRONG_REASONS);

export function parseWrongReasons(value: unknown, required: boolean): WrongReason[] | null {
  if (value === null || value === undefined) return required ? null : [];
  if (!Array.isArray(value) || (required && value.length === 0)) return null;

  const seen = new Set<string>();
  for (const reason of value) {
    if (typeof reason !== 'string' || !WRONG_REASON_SET.has(reason) || seen.has(reason)) {
      return null;
    }
    seen.add(reason);
  }

  return [...value] as WrongReason[];
}
