export interface NewsLabels {
  source: string;
  author: string;
  published: string;
  tags: string;
  readArticle: string;
  opensNewTab: string;
  suppliedNote: string;
}
export const newsEnglish: Readonly<NewsLabels> = Object.freeze({
  source:'Supplied source', author:'Supplied author', published:'Publication date', tags:'Tags', readArticle:'Read supplied article', opensNewTab:'Opens in a new tab', suppliedNote:'Supplied article content and source details are unverified.'
});
export const newsChinese: Readonly<NewsLabels> = Object.freeze({
  source:'所提供的来源', author:'所提供的作者', published:'发布日期', tags:'标签', readArticle:'阅读所提供的文章', opensNewTab:'在新标签页中打开', suppliedNote:'所提供的文章内容和来源信息未经核实。'
});
