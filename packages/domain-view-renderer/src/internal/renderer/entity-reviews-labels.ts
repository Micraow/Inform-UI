import type {ReviewFilter, ReviewSort} from '../core/entity-reviews.js';
export interface ReviewsLabels {
  filter: string;
  sort: string;
  filters: Readonly<Record<ReviewFilter, string>>;
  sorts: Readonly<Record<ReviewSort, string>>;
  note: string;
  count: (visible: number, total: number) => string;
  rating: (value: number) => string;
  unrated: string;
  details: string;
  noReviews: string;
  noMatches: string;
  source: string;
  reviewLink: string;
  opensNewTab: string;
}
export const reviewsEnglish: Readonly<ReviewsLabels> = Object.freeze({
  filter:'Filter by supplied rating', sort:'Sort supplied reviews',
  filters:{all:'All',rated:'Rated',unrated:'Unrated','5':'5 of 5','4':'4 of 5','3':'3 of 5','2':'2 of 5','1':'1 of 5'},
  sorts:{supplied:'Supplied order',newest:'Newest supplied date',highest:'Highest supplied rating',lowest:'Lowest supplied rating'},
  note:'Only the supplied reviews are shown. Ratings and dates are displayed as supplied.',
  count:(visible:number,total:number)=>`${visible} of ${total} supplied reviews shown`,
  rating:(value:number)=>`Rating: ${value} of 5`, unrated:'Rating not supplied', details:'Full review',
  noReviews:'No reviews supplied.', noMatches:'No supplied reviews match this filter.', source:'Source', reviewLink:'Review link', opensNewTab:'Opens in a new tab'
});
export const reviewsChinese: Readonly<ReviewsLabels> = Object.freeze({
  filter:'按所提供的评分筛选', sort:'排序所提供的评论',
  filters:{all:'全部',rated:'已评分',unrated:'未评分','5':'5 分（满分 5 分）','4':'4 分（满分 5 分）','3':'3 分（满分 5 分）','2':'2 分（满分 5 分）','1':'1 分（满分 5 分）'},
  sorts:{supplied:'提供的顺序',newest:'所提供日期从新到旧',highest:'所提供评分从高到低',lowest:'所提供评分从低到高'},
  note:'仅显示所提供的评论。评分和日期均按提供的内容显示。',
  count:(visible:number,total:number)=>`显示 ${visible} 条，共提供 ${total} 条评论`,
  rating:(value:number)=>`评分：${value} 分，满分 5 分`, unrated:'未提供评分', details:'完整评论',
  noReviews:'未提供评论。', noMatches:'没有符合筛选条件的已提供评论。', source:'来源', reviewLink:'评论链接', opensNewTab:'在新标签页中打开'
});
