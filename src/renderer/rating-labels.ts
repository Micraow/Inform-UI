/** Project-owned presentation labels; no inferred review score or service. */
export interface RatingLabels {
  unrated: string;
  choice: (value: number, max: number) => string;
  clear: string;
  rejected: string;
}
export const ratingEnglish: RatingLabels = {
  unrated:'Unrated',
  choice:(value,max)=>`${value} of ${max}`,
  clear:'Clear rating',
  rejected:'This rating could not be applied. The previous value is unchanged.'
};
export const ratingChinese: RatingLabels = {
  unrated:'尚未评分',
  choice:(value,max)=>`${value} 分，满分 ${max} 分`,
  clear:'清除评分',
  rejected:'无法应用此次评分，已保留原来的数值。'
};
