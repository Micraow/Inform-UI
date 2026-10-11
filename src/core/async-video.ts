import type{AsyncVideoCarouselNode,AsyncVideoItem,Value}from'../schema/document.js';import type{Issue,Scalar}from'./index.js';
/** Canonical public destinations must match the supplied provider and literal ID. */
export function asyncVideoURL(item:AsyncVideoItem):boolean{
 try{const u=new URL(item.url);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  if(item.provider==='youtube'){if(u.hostname==='youtu.be')return u.pathname==='/'+item.videoId;return['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)&&((u.pathname==='/watch'&&u.searchParams.getAll('v').length===1&&u.searchParams.get('v')===item.videoId)||u.pathname==='/shorts/'+item.videoId);}
  return['www.tiktok.com','tiktok.com'].includes(u.hostname)&&/^\/@[^/]+\/video\/([^/]+)\/?$/.exec(u.pathname)?.[1]===item.videoId;
 }catch{return false;}
}
export function inspectAsyncVideo(n:AsyncVideoCarouselNode,path:string,add:(i:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 for(const[i,item]of(n.items??[]).entries()){const p=path+'/items/'+i;if(!(item.provider==='youtube'?/^[A-Za-z0-9_-]{11}$/:/^\d{1,30}$/).test(item.videoId))add({code:'ASYNC_VIDEO_ID',path:p+'/videoId',message:'Supply a valid literal YouTube or TikTok video ID.'});if(!item.title.trim())add({code:'ASYNC_VIDEO_TITLE',path:p+'/title',message:'A nonblank supplied video title is required.'});if(!safe(item.url)||!asyncVideoURL(item))add({code:'ASYNC_VIDEO_URL',path:p+'/url',message:'Use a public HTTPS canonical provider URL matching the supplied video ID.'});if(item.thumbnailUrl!==undefined&&(item.provider!=='tiktok'||!safe(item.thumbnailUrl,'image')))add({code:'ASYNC_VIDEO_THUMBNAIL',path:p+'/thumbnailUrl',message:'Only TikTok accepts supplied safe raster thumbnails; YouTube uses its fixed public thumbnail source.'});}
}
export function checkAsyncVideoStatus(n:AsyncVideoCarouselNode,path:string,evaluate:(v:Value)=>Scalar,add:(i:Issue)=>void):void{if(!['pending','resolved','failed'].includes(String(evaluate(n.status===undefined?(n.items===undefined?'pending':'resolved'):n.status))))add({code:'ASYNC_VIDEO_STATUS',path:path+'/status',message:'Video status must resolve to pending, resolved or failed.'});}
