export interface CarouselLabels {
  collection: string; previous: string; next: string; empty: string;
  visible: (first:number,last:number,total:number)=>string;
}
export const carouselEnglish: CarouselLabels = {
  collection:'Scrollable collection', previous:'Previous items', next:'Next items', empty:'No items',
  visible:(first,last,total)=>`Items ${first}–${last} of ${total} visible`
};
export const carouselChinese: CarouselLabels = {
  collection:'可横向滚动的内容', previous:'上一组内容', next:'下一组内容', empty:'暂无内容',
  visible:(first,last,total)=>`当前可见第 ${first}–${last} 项，共 ${total} 项`
};
