import type{RendererContext}from'./context.js';
import type{SearchImageRecord}from'../schema/document.js';
import{readerBlocked}from'./reader-controls.js';
import{renderSearchImage}from'./search-image.js';
import{overlayCoordinator}from'./overlays.js';
/** Local replacement scopes reuse the parent's permanent component owner. */
function viewerContext(parent:RendererContext,valid:()=>boolean):RendererContext{
 const life=parent.lifecycle.fork(valid);return{...parent,lifecycle:life,on:life.listen,cleanup:life.own,bind:fn=>life.own(parent.bind(life.guard(fn))),element:(tag,cls,value)=>life.during(()=>parent.element(tag,cls,value))};
}
/** Explicit local-basic viewer, sharing the document's overlay coordinator. */
export function openLocalImageViewer(parent:RendererContext,root:HTMLElement,trigger:HTMLButtonElement,images:readonly SearchImageRecord[],initial:number,owner:HTMLElement,host:HTMLElement):()=>void{
 if(!images.length||readerBlocked(root,trigger,true)||!parent.lifecycle.current())return()=>{};
 const surface=parent.element('div','iui-async-image-viewer iui-image-grid-viewer');surface.setAttribute('role','dialog');surface.setAttribute('aria-label','Local image viewer');surface.dataset.implementation='local-basic';surface.tabIndex=-1;parent.lifecycle.during(()=>root.append(surface));
 const c=viewerContext(parent,()=>surface.parentNode===root),coordinator=overlayCoordinator(c.doc);
 const header=c.element('div','iui-async-image-viewer-header'),title=c.element('span','','Local image viewer'),close=c.element('button','','Close'),body=c.element('div','iui-async-image-viewer-body'),nav=c.element('div','iui-async-image-viewer-nav'),previous=c.element('button','','Previous'),next=c.element('button','','Next'),count=c.element('output');close.type=previous.type=next.type='button';header.append(title,close);nav.append(previous,count,next);surface.append(header,body,nav);
 let index=Math.max(0,Math.min(images.length-1,initial)),closed=false,picture:RendererContext|undefined;
 const current=()=>!closed&&c.lifecycle.current()&&surface.parentNode===root;
 const dismiss=(restore:boolean)=>{if(closed)return;closed=true;coordinator.close(entry,'close');c.lifecycle.dispose();surface.remove();if(restore&&parent.lifecycle.current()&&!readerBlocked(root,trigger,true))parent.lifecycle.during(()=>trigger.focus({preventScroll:true}));};
 const entry={kind:'popover' as const,root,trigger,surface,hide:(reason:string)=>dismiss(reason==='close'||reason==='escape')};
 c.cleanup(()=>{closed=true;coordinator.close(entry,'dispose');surface.remove();});
 const draw=()=>{if(!current())return;picture?.lifecycle.dispose();const frame=c.element('div','iui-image-grid-viewer-frame');c.lifecycle.during(()=>body.replaceChildren(frame));picture=viewerContext(c,()=>frame.parentNode===body);const bitmap=renderSearchImage(picture,{type:'search-image',searchImage:images[index]!,alt:images[index]?.title??'',fit:'contain',width:'100%',maxHeight:640,fallback:'Image unavailable'},owner,host);picture.lifecycle.during(()=>frame.append(bitmap));c.lifecycle.during(()=>{previous.disabled=index===0;next.disabled=index===images.length-1;count.textContent=`${index+1} / ${images.length}`;});};
 const move=(delta:number,event:Event,control:HTMLButtonElement)=>{if(event.defaultPrevented||!current()||readerBlocked(surface,control,true))return;index=Math.max(0,Math.min(images.length-1,index+delta));draw();};
 c.on(previous,'click',e=>move(-1,e,previous));c.on(next,'click',e=>move(1,e,next));c.on(close,'click',e=>{if(!e.defaultPrevented&&current()&&!readerBlocked(surface,close,true))dismiss(true);});
 c.on(surface,'keydown',e=>{const key=e as KeyboardEvent;if(key.defaultPrevented||key.isComposing||key.keyCode===229||key.altKey||key.ctrlKey||key.metaKey||key.shiftKey)return;const delta=key.key==='ArrowLeft'?-1:key.key==='ArrowRight'?1:0;if(delta){move(delta,key,delta<0?previous:next);key.preventDefault();}});
 c.lifecycle.acquire(()=>{coordinator.open(entry);return entry;},value=>coordinator.close(value,'dispose'));draw();if(current())c.lifecycle.during(()=>close.focus({preventScroll:true}));return()=>dismiss(false);
}
