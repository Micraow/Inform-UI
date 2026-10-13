import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import type{SearchImageNode}from'../schema/document.js';import type{RendererContext}from'./context.js';import{searchImageRatio,searchImagePosition}from'../core/search-image.js';
/** Content-first supplied image reader; no search, host URL discovery or action service. */
export function renderSearchImage(c:RendererContext,n:SearchImageNode,owner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=c.element('div','iui-search-image');c=suppliedReaderContext(c,root,()=>schedule());root.dataset.phase='loading';if(n.frame)root.dataset.frame='';if(n.hoverZoom)root.dataset.hoverZoom='';
 const dimension=(v:number|string)=>typeof v==='number'?`${v}px`:v;
 const ratio=searchImageRatio(n.aspectRatio);for(const key of['width','height','minWidth','minHeight','maxWidth','maxHeight']as const)if(n[key]!==undefined)root.style[key]=dimension(n[key]!);if(ratio)root.style.aspectRatio=String(ratio);if(n.radius!==undefined)root.style.borderRadius=`${n.radius}px`;
 const loading=c.element('div','iui-search-image-loading');loading.setAttribute('aria-hidden','true');root.append(loading);
 if(n.frame){const frame=c.element('div','iui-search-image-frame');frame.setAttribute('aria-hidden','true');root.append(frame);}
 const record=n.searchImage,primary=record?.content_url||record?.thumbnail_url||'',fallback=record?.content_url&&record.thumbnail_url&&record.content_url!==record.thumbnail_url?record.thumbnail_url:'';
 let inserted=false,alive=true,started=false,mounted=false,scheduled=false,revision=0,terminal:string|undefined,parent:ParentNode|null=null,img:HTMLImageElement|null=null,crop:HTMLElement|null=null;let resize:ResizeObserver|undefined;
 function retire(){if(!alive)return;alive=false;revision++;resize?.disconnect();const old=img;img=null;old?.removeAttribute('src');old?.remove();crop?.remove();crop=null;}
 function owned(){if(!alive||!c.lifecycle.current())return false;if(owner.ownerDocument!==c.doc||owner.parentNode!==host||!owner.contains(root)||parent&&root.parentNode!==parent||inserted&&img&&!root.contains(img)){retire();return false;}return true;}
 function current(ticket=revision){if(!owned()||ticket!==revision)return false;if(!root.isConnected){if(mounted)retire();return false;}mounted=true;if(!parent)parent=root.parentNode;return true;}
 function accepted(target:HTMLImageElement,ticket:number){if(!current(ticket)||img!==target)return false;if(!root.contains(target)){retire();return false;}return true;}
 function phase(value:string,ticket:number){if(!current(ticket))return false;root.dataset.phase=value;return current(ticket);}
 function settle(value:string,ticket:number){if(!current(ticket))return false;if(terminal===undefined){terminal=value;root.dataset.terminal=value;}return current(ticket);}
 function geometry(target:HTMLImageElement,ticket:number,source:string){
  if(!accepted(target,ticket))return;const presentation=source===record?.content_url?record?.content_presentation:record?.thumbnail_presentation;
  const set=(el:HTMLElement,key:string,value:string)=>{if(!accepted(target,ticket))return false;el.style.setProperty(key,value);return accepted(target,ticket);};
  let boxRatio=ratio;if(presentation){const box=root.getBoundingClientRect();if(!accepted(target,ticket))return;if(box.width>0&&box.height>0)boxRatio=box.width/box.height;boxRatio??=presentation.aspect_ratio;
   if(!ratio&&!set(root,'aspect-ratio',String(presentation.aspect_ratio)))return;
   if(!crop){const next=c.element('div','iui-search-image-crop');if(!accepted(target,ticket))return;crop=next;root.insertBefore(next,target);if(!accepted(target,ticket))return;next.append(target);if(!accepted(target,ticket))return;}
   const scale=n.contentCropFit==='cover'?Math.max:Math.min,w=100*scale(1,presentation.aspect_ratio/boxRatio),h=100*scale(1,boxRatio/presentation.aspect_ratio);
   for(const[key,value]of Object.entries({left:`${(100-w)/2}%`,top:`${(100-h)/2}%`,width:`${w}%`,height:`${h}%`}))if(!set(crop,key,value))return;
   for(const[key,value]of Object.entries({position:'absolute',left:`${presentation.placement.left}%`,top:`${presentation.placement.top}%`,width:`${presentation.placement.width}%`,height:`${presentation.placement.height}%`,'max-width':'none','max-height':'none','min-width':'0','min-height':'0','aspect-ratio':'auto','object-fit':'fill'}))if(!set(target,key,value))return;
  }else{
   if(!boxRatio&&(n.fit??'cover')==='cover'&&record?.thumbnail_crop_info){const box=target.getBoundingClientRect();if(!accepted(target,ticket))return;if(box.width>0&&box.height>0)boxRatio=box.width/box.height;}
   const position=searchImagePosition(n,boxRatio);if(position&&!set(target,'object-position',position))return;
   const naturalWidth=target.naturalWidth;if(!accepted(target,ticket))return;const naturalHeight=target.naturalHeight;if(!accepted(target,ticket))return;const actual=naturalWidth/naturalHeight,limits=n.containOutsideAspectRatio;
   const fit=limits&&Number.isFinite(actual)&&(actual<=limits.min||actual>=limits.max)?'contain':n.fit??'cover';set(target,'object-fit',fit);
  }
 }
 function failed(target:HTMLImageElement,ticket:number,source:string){
  if(!accepted(target,ticket)||target.getAttribute('src')!==source)return;
  if(source===primary&&fallback){request(fallback,true);return;}
  if(!phase(n.sourcePending&&source===primary?'pending':'error',ticket))return;
  if(!(n.sourcePending&&source===primary)&&!settle('error',ticket))return;
  if(n.fallback!==undefined){const text=c.element('div','iui-search-image-fallback',n.fallback);if(!accepted(target,ticket))return;target.removeAttribute('src');if(!accepted(target,ticket))return;target.remove();img=null;crop?.remove();crop=null;loading.hidden=true;if(!current(ticket))return;root.append(text);}
  else if(n.hideOnFailure&&current(ticket)){root.hidden=true;if(!accepted(target,ticket))return;target.removeAttribute('src');if(!accepted(target,ticket))return;target.remove();img=null;crop?.remove();crop=null;}
 }
 function loaded(target:HTMLImageElement,ticket:number,source:string){
  if(!accepted(target,ticket)||target.getAttribute('src')!==source)return;geometry(target,ticket,source);if(!accepted(target,ticket))return;target.dataset.loaded='';if(!accepted(target,ticket))return;loading.hidden=true;if(!phase('loaded',ticket))return;settle('loaded',ticket);
 }
 function request(source:string,isFallback=false){
  if(!current())return;const ticket=++revision;resize?.disconnect();const old=img;img=null;inserted=false;old?.removeAttribute('src');old?.remove();crop?.remove();crop=null;if(!current(ticket))return;
  const presentation=source===record?.content_url?record?.content_presentation:record?.thumbnail_presentation;root.style.aspectRatio=ratio?String(ratio):presentation?String(presentation.aspect_ratio):'';if(!current(ticket))return;
  const target=c.element('img','iui-search-image-bitmap');if(!current(ticket))return;img=target;
  target.alt=n.alt??record?.title??'';if(!current(ticket))return;target.referrerPolicy='no-referrer';if(!current(ticket))return;
  for(const key of['width','height','minWidth','minHeight','maxWidth','maxHeight']as const)if(n[key]!==undefined){target.style[key]=dimension(n[key]!);if(!current(ticket))return;}
  if(ratio){target.style.aspectRatio=String(ratio);if(!current(ticket))return;}if(n.radius!==undefined){target.style.borderRadius=`${n.radius}px`;if(!current(ticket))return;}
  target.style.objectFit=n.fit??'cover';if(!current(ticket))return;
  c.on(target,'load',()=>loaded(target,ticket,source));c.on(target,'error',()=>failed(target,ticket,source));if(!current(ticket))return;
  if(presentation){const box=c.element('div','iui-search-image-crop');if(!current(ticket))return;crop=box;root.insertBefore(box,loading);if(!current(ticket))return;box.append(target);}else root.insertBefore(target,loading);inserted=true;if(!accepted(target,ticket))return;loading.hidden=false;if(!phase(isFallback?'fallback':'loading',ticket))return;
  if(isFallback){root.dataset.fallback='true';if(!accepted(target,ticket))return;}
  geometry(target,ticket,source);if(!accepted(target,ticket))return;
  c.lifecycle.acquire(()=>{target.src=source;return target;},image=>image.removeAttribute('src'));if(!accepted(target,ticket))return;
  const Resize=c.doc.defaultView?.ResizeObserver;if(!accepted(target,ticket))return;resize=Resize?new Resize(()=>geometry(target,ticket,source)):undefined;if(!accepted(target,ticket)){resize?.disconnect();return;}resize?.observe(root);if(!accepted(target,ticket))return;resize?.observe(target);if(!accepted(target,ticket))return;
  const complete=target.complete;if(!accepted(target,ticket))return;const width=target.naturalWidth;if(!accepted(target,ticket))return;if(complete&&width>0)loaded(target,ticket,source);
 }
 function start(){if(started||!current())return;started=true;if(primary)request(primary);else{phase(n.sourcePending?'pending':record?'error':'empty',revision);if(record&&!n.sourcePending)settle('error',revision);if(record&&!n.sourcePending&&n.hideOnFailure)root.hidden=true;}}
 function schedule(){if(scheduled||started||!alive)return;scheduled=true;queueMicrotask(c.lifecycle.guard(()=>{scheduled=false;start();}));}
 c.bind(()=>{if(!parent&&owner.contains(root))parent=root.parentNode;if(started)current();else schedule();});
 c.cleanup(retire);schedule();return root;
}
