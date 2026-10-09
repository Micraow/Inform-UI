export const fillBlankEnglish = {
  kind: 'Fill in the blanks', check: 'Check answers', reveal: 'Show reference answers', retry: 'Start again',
  privacy: 'Local practice. Reference answers are included in this document; responses and results are not saved.',
  rules: 'Match a supplied answer exactly, including case. Leading and trailing whitespace is ignored. Maximum 200 characters per blank.',
  required: 'Fill in this blank before checking.', tooLong: 'Use at most 200 characters (Unicode code points).',
  correct: 'Matches a reference answer.', incorrect: 'Does not match a reference answer.',
  reference: 'Reference answers', hint: 'Hint', explanation: 'Explanation',
  incomplete: 'Complete the highlighted blanks before checking. No result has been calculated.',
  editing: 'Answers changed. Check again for an updated result.',
  revealed: 'Reference answers are now visible. This is review mode, not a scored attempt. Start again to hide them.',
  reset: 'Practice reset. All blanks are empty.',
  result: (correct: number, total: number) => `Reference matches: ${correct} / ${total}.`
};
export const fillBlankChinese: typeof fillBlankEnglish = {
  kind: '句中填空', check: '检查答案', reveal: '查看参考答案', retry: '重新开始',
  privacy: '本地练习。参考答案包含在此文档中；不保存作答或结果。',
  rules: '与给定答案精确匹配，区分大小写，仅忽略首尾空白。每空最多 200 个 Unicode 码点。',
  required: '请填写此空后再检查。', tooLong: '每空最多 200 个 Unicode 码点。',
  correct: '与参考答案匹配。', incorrect: '与参考答案不匹配。',
  reference: '参考答案', hint: '提示', explanation: '说明',
  incomplete: '请先完成标出的填空；尚未计算结果。',
  editing: '答案已修改，请重新检查结果。',
  revealed: '参考答案已显示，当前为回看模式，不计作答结果。重新开始可隐藏参考答案。',
  reset: '练习已重置，所有填空为空。',
  result: (correct: number, total: number) => `匹配参考答案：${correct} / ${total}。`
};
