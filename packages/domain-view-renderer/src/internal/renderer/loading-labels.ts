/** Presentation only. Authored labels and accepted numeric progress stay exact. */
export interface LoadingLabels {
  indeterminate: string;
  percent: (value: number) => string;
}
export const loadingEnglish: LoadingLabels = {
  indeterminate: 'Progress not supplied',
  percent: value => `${value}%`
};
export const loadingChinese: LoadingLabels = {
  indeterminate: '未提供进度',
  percent: value => `${value}%`
};
