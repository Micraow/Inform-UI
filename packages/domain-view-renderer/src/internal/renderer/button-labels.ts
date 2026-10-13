export const buttonEnglish = {
  working: 'Working…', cancel: 'Cancel action',
  pending: 'Action in progress.', completed: 'Action completed.',
  cancelled: 'Action cancelled here. Work already performed may not be undone.',
  failed: 'Action failed. Try again.', unavailable: 'This action is unavailable.'
};
export type ButtonLabels = typeof buttonEnglish;
export const buttonChinese: ButtonLabels = {
  working: '处理中…', cancel: '取消操作',
  pending: '操作进行中。', completed: '操作已完成。',
  cancelled: '已在此取消操作。已经执行的工作可能无法撤销。',
  failed: '操作失败，请重试。', unavailable: '此操作不可用。'
};
