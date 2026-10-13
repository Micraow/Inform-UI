import type{SearchImageNode}from'../schema/document.js';import type{Issue}from'./index.js';
export function searchImageRatio(value:number|string|undefined):number|undefined{if(value===undefined)return;const parts=typeof value==='string'?value.split(/[:/]/).map(Number):[value,1];const ratio=parts[0]/parts[1];return Number.isFinite(ratio)&&ratio>0&&ratio<=1000?ratio:undefined;}
export function inspectSearchImage(n:SearchImageNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 for(const key of['content_url','thumbnail_url']as const){const url=n.searchImage?.[key];if(url&&!safe(url,'image'))add({code:'UNSAFE_URL',path:path+'/searchImage/'+key,message:'Supplied images need absolute credential-free HTTP(S) or supported inline raster data.'});}
 if(n.aspectRatio!==undefined&&searchImageRatio(n.aspectRatio)===undefined)add({code:'SEARCH_IMAGE_RATIO',path:path+'/aspectRatio',message:'Aspect ratio must be positive and at most 1000.'});
 if(n.containOutsideAspectRatio&&n.containOutsideAspectRatio.min>=n.containOutsideAspectRatio.max)add({code:'SEARCH_IMAGE_RATIO',path:path+'/containOutsideAspectRatio',message:'Contain thresholds must be positive and increasing.'});
 if(n.position&&n.position.split(' ').some(x=>Number(x.slice(0,-1))>100))add({code:'SEARCH_IMAGE_POSITION',path:path+'/position',message:'Object position must contain two percentages from 0 through 100.'});
}
/** Crop centers accept normalized fractions or percentages, following the reference metadata. */
export function searchImagePosition(n:SearchImageNode,targetRatio:number|undefined):string|undefined{
 if(n.position)return n.position;const info=n.searchImage?.thumbnail_crop_info,size=n.searchImage?.thumbnail_size??n.searchImage?.content_size;if((n.fit??'cover')!=='cover'||!info||!size||!targetRatio)return;
 const ratio=size.width/size.height;if(Math.abs(ratio-targetRatio)<1e-6)return;const clamp=(x:number)=>Math.max(0,Math.min(1,x)),center=(x:number)=>clamp(x>1?x/100:x);let x=50,y=50;
 if(ratio>targetRatio)x=clamp((center(info.center_x_percent)*ratio-targetRatio/2)/(ratio-targetRatio))*100;else y=clamp((center(info.center_y_percent)/ratio-1/targetRatio/2)/(1/ratio-1/targetRatio))*100;
 return`${x.toFixed(1)}% ${y.toFixed(1)}%`;
}
