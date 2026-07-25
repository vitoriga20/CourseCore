export const questionTypes = {
  singleChoice: 0,
  multipleChoice: 1,
  fillInBlank: 2,
  calculation: 3,
  proof: 4,
  trueFalse: 5,
  shortAnswer: 6,
  code: 7,
  composite: 8
};

export const viewTypes = {
  [questionTypes.singleChoice]: 'choice',
  [questionTypes.multipleChoice]: 'choice',
  [questionTypes.fillInBlank]: 'fill',
  [questionTypes.calculation]: 'calc',
  [questionTypes.proof]: 'calc',
  [questionTypes.trueFalse]: 'choice',
  [questionTypes.shortAnswer]: 'fill',
  [questionTypes.code]: 'code',
  [questionTypes.composite]: 'exam'
};

export const validatorTypes = {
  [questionTypes.singleChoice]: 'exact',
  [questionTypes.multipleChoice]: 'set',
  [questionTypes.fillInBlank]: 'normalized',
  [questionTypes.calculation]: 'tolerance',
  [questionTypes.proof]: 'manual',
  [questionTypes.trueFalse]: 'exact',
  [questionTypes.shortAnswer]: 'normalized',
  [questionTypes.code]: 'runner',
  [questionTypes.composite]: 'mixed'
};

export const submitTypes = {
  [questionTypes.singleChoice]: 'instant',
  [questionTypes.multipleChoice]: 'button',
  [questionTypes.fillInBlank]: 'button',
  [questionTypes.calculation]: 'button',
  [questionTypes.proof]: 'button',
  [questionTypes.trueFalse]: 'instant',
  [questionTypes.shortAnswer]: 'button',
  [questionTypes.code]: 'button',
  [questionTypes.composite]: 'button'
};

export function getViewType(questionType) {
  return viewTypes[questionType] ?? 'calc';
}

export function getValidatorType(questionType) {
  return validatorTypes[questionType] ?? 'manual';
}

export function getSubmitType(questionType) {
  return submitTypes[questionType] ?? 'button';
}
