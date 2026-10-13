export const pieEnglish = {
  knownValues: 'Percentages are shares of known values. Missing values are not treated as zero.',
  noPositiveData: 'No positive values to plot. Original values are available in the data table.',
  share: (percent: string) => `${percent} of known values`
};
export type PieLabels = typeof pieEnglish;
export const pieChinese: PieLabels = {
  knownValues: '百分比以已知数值之和为分母；缺测值不按零处理。',
  noPositiveData: '没有可绘制的正值。原始数值仍可在数据表中查看。',
  share: (percent: string) => `占已知数值的 ${percent}`
};
