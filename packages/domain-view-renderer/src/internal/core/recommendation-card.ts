/** Explicit supplied display data and local host capability; no remote resolution. */
export interface RecommendationCardData {
  conversationId:string;
  title:string;
  description:string;
  emoji?:string;
  iconData?:string;
}
export type RecommendationCardNode = {
  type:'recommendation-card';id?:string;label:string;fallback?:string;
} & ({status:'pending'|'failed';data?:never;canOpenConversation?:never}|{
  status:'resolved';data:RecommendationCardData;canOpenConversation:boolean;
});
export interface RecommendationCardIssue {code:string;path:string;message:string}
/** Called after structural schema validation. Inline raster data does not issue remote requests. */
export function inspectRecommendationCard(node:RecommendationCardNode,path:string,add:(issue:RecommendationCardIssue)=>void,safeURL:(url:string,kind?:'link'|'image')=>boolean):void {
  if(!node.label.trim())add({code:'RECOMMENDATION_LABEL',path:path+'/label',message:'Supply a nonblank accessible label.'});
  if(node.status!=='resolved')return;
  if(!node.data.title.trim())add({code:'RECOMMENDATION_TITLE',path:path+'/data/title',message:'Supply a nonblank title.'});
  if(node.data.iconData!==undefined&&(!/^data:/i.test(node.data.iconData)||!safeURL(node.data.iconData,'image')))add({code:'UNSAFE_URL',path:path+'/data/iconData',message:'Recommendation icons require inline raster data.'});
}
