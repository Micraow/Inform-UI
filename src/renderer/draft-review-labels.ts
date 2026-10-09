export interface DraftReviewLabels {
  subject: string; to: string; cc: string; noRecipients: string; recipientsNote: string;
  body: string; reviewed: string; details: string; reset: string; reviewNote: string;
  count: (reviewed: number, total: number) => string;
}
export const draftReviewEnglish: DraftReviewLabels = {
  subject: 'Subject', to: 'To', cc: 'Cc', noRecipients: 'No recipients supplied',
  recipientsNote: 'Supplied recipients; delivery is not checked.', body: 'Message body',
  reviewed: 'Reviewed', details: 'Details', reset: 'Reset review marks',
  reviewNote: "Marks indicate that this page's plan text was reviewed, not that tasks were performed.",
  count: (reviewed, total) => `${reviewed} of ${total} steps marked reviewed`
};
export const draftReviewChinese: DraftReviewLabels = {
  subject: '主题', to: '收件人', cc: '抄送', noRecipients: '未提供收件人',
  recipientsNote: '收件人由内容提供者给出；未检查是否可投递。', body: '邮件正文',
  reviewed: '已阅读', details: '详情', reset: '重置阅读标记',
  reviewNote: '标记仅表示已阅读本页的计划文本，不表示已执行任务。',
  count: (reviewed, total) => `${total} 个步骤中有 ${reviewed} 个已标记为已阅读`
};
