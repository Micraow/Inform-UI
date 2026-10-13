/** Presentation only. Nothing in these labels claims source verification. */
export interface SourceLabels {
  previous: string; next: string; opensNewTab: string;
  visible: (first: number, last: number, total: number) => string;
}
export const sourceEnglish: Readonly<SourceLabels> = Object.freeze({
  previous: 'Previous links', next: 'Next links', opensNewTab: 'Opens in a new tab',
  visible: (first: number, last: number, total: number) => `Visible links ${first}–${last} of ${total}`
});
export const sourceChinese: Readonly<SourceLabels> = Object.freeze({
  previous: '上一页链接', next: '下一页链接', opensNewTab: '在新标签页中打开',
  visible: (first: number, last: number, total: number) => `当前可见第 ${first}–${last} 条，共 ${total} 条链接`
});
