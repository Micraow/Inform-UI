export interface ThreadLabels {
  author: string;
  community: string;
  score: string;
  notSupplied: string;
  source: string;
  opensNewTab: string;
  suppliedNote: string;
  noComments: string;
  comments: (count: number) => string;
  replies: (count: number) => string;
}
export const threadEnglish: Readonly<ThreadLabels> = Object.freeze({
  author:'Author', community:'Community', score:'Supplied score', notSupplied:'Not supplied', source:'Source', opensNewTab:'Opens in a new tab',
  suppliedNote:'Supplied, unverified discussion content. Counts include only the supplied comments and replies.',
  noComments:'No comments supplied.', comments:(count:number)=>`Supplied comments and replies (${count})`, replies:(count:number)=>`Supplied replies (${count}, including nested replies)`
});
export const threadChinese: Readonly<ThreadLabels> = Object.freeze({
  author:'作者', community:'社区', score:'提供的分数', notSupplied:'未提供', source:'来源', opensNewTab:'在新标签页中打开',
  suppliedNote:'提供的讨论内容未经核实。数量仅统计提供的评论和回复。',
  noComments:'未提供评论。', comments:(count:number)=>`提供的评论和回复（${count}）`, replies:(count:number)=>`提供的回复（${count}，含嵌套回复）`
});
