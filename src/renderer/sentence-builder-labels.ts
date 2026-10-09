export const sentenceBuilderEnglish = {
  kind: 'Sentence builder', bank: 'Available tokens', chosen: 'Your order', reference: 'Reference order',
  empty: 'Choose tokens from the bank to build your answer.', bankEmpty: 'All tokens are selected.',
  check: 'Check order', reveal: 'Reveal answer', retry: 'Retry', remove: 'Remove', earlier: 'Move earlier', later: 'Move later',
  correct: 'Correct order.', incorrect: 'This order does not match the supplied answer. You can move or remove tokens and check again.',
  revealed: 'Reference answer revealed. This is not an independently correct attempt.',
  assistedMatch: 'This order matches the revealed answer. This is not an independently correct attempt.',
  assistedMismatch: 'This order does not match the revealed answer. You can keep practicing.',
  reset: 'New attempt. The token bank has been restored.',
  privacy: 'Local practice only. Answers are supplied in this document; no grade or verified learning result is saved.',
  preview: 'Text preview', incomplete: 'Choose every token before checking the order.',
  progress: (chosen: number, total: number) => `${chosen} of ${total} tokens selected`,
  addName: (text: string, position: number) => `Add ${text}, bank position ${position}`,
  itemAction: (action: string, text: string, position: number) => `${action}: ${text}, position ${position}`,
  added: (position: number) => `Token added at position ${position}.`,
  removed: (position: number) => `Token returned to bank position ${position}.`,
  moved: (position: number) => `Token moved to position ${position}.`
};
export type SentenceBuilderLabels = typeof sentenceBuilderEnglish;
export const sentenceBuilderChinese: SentenceBuilderLabels = {
  kind: '组句练习', bank: '可选词块', chosen: '你的顺序', reference: '参考顺序',
  empty: '从词库中选择词块，组成你的答案。', bankEmpty: '已选中全部词块。',
  check: '检查顺序', reveal: '查看答案', retry: '重试', remove: '移除', earlier: '前移', later: '后移',
  correct: '顺序正确。', incorrect: '当前顺序与所提供的答案不同。可移动或移除词块后再次检查。',
  revealed: '已显示参考答案。本次不算独立答对。',
  assistedMatch: '当前顺序与已显示的答案一致。本次不算独立答对。',
  assistedMismatch: '当前顺序与已显示的答案不同。可以继续练习。',
  reset: '开始新一轮，词库已恢复。',
  privacy: '仅供本地练习。答案包含在本文档中；不保存成绩或经验证的学习成果。',
  preview: '文本预览', incomplete: '请先选择全部词块，再检查顺序。',
  progress: (chosen: number, total: number) => `已选 ${chosen} / ${total} 个词块`,
  addName: (text: string, position: number) => `添加 ${text}，词库第 ${position} 位`,
  itemAction: (action: string, text: string, position: number) => `${action}：${text}，第 ${position} 位`,
  added: (position: number) => `已添加到第 ${position} 位。`,
  removed: (position: number) => `已放回词库第 ${position} 位。`,
  moved: (position: number) => `已移动到第 ${position} 位。`
};
