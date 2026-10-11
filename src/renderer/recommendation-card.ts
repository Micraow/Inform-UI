import type {RecommendationCardNode} from '../core/recommendation-card.js';
import type {RendererContext} from './context.js';
import {readerBlocked} from './reader-controls.js';
import {ownedTree} from './owned-tree.js';
export interface RecommendationCardIntent {readonly componentId:string|null;readonly conversationId:string}
/** Frozen local intent only. Host authorization and navigation are outside this renderer. */
export function renderRecommendationCard(c:RendererContext,node:RecommendationCardNode):HTMLElement {
 const root=c.element('section','iui-recommendation-card');
 let dispatching=false;
 const life=ownedTree(c,root),write=life.during;
 write(()=>root.setAttribute('aria-label',node.label));write(()=>{root.dataset.status=node.status;});write(()=>{root.dir='auto';});
 if(node.status==='pending'){
  write(()=>root.setAttribute('aria-busy','true'));
  const loading=c.element('div','iui-recommendation-loading');
  write(()=>loading.setAttribute('role','status'));write(()=>loading.setAttribute('aria-label',node.label));write(()=>root.append(loading));return root;
 }
 if(node.status!=='resolved'){
  if(node.fallback){const fallback=c.element('p','iui-recommendation-fallback',node.fallback);write(()=>root.append(fallback));}
  else write(()=>{root.hidden=true;});return root;
 }
 const data=node.data,button=c.element('button','iui-recommendation-action');
 write(()=>{button.type='button';});write(()=>{button.disabled=!node.canOpenConversation;});write(()=>button.setAttribute('aria-label',data.title));
 if(data.iconData){
  const slot=c.element('span','iui-recommendation-icon-slot'),image=c.element('img','iui-recommendation-icon');
  write(()=>{image.alt='';});write(()=>{image.width=40;image.height=40;});write(()=>{image.decoding='async';});write(()=>{image.referrerPolicy='no-referrer';});
  life.listen(image,'error',()=>{if(life.current()&&root.contains(image))write(()=>{image.hidden=true;});});
  write(()=>slot.append(image));life.acquire(()=>{image.src=data.iconData!;return image;},value=>{if(slot.contains(value))value.removeAttribute('src');});write(()=>button.append(slot));
 }else if(data.emoji){const emoji=c.element('span','iui-recommendation-emoji',data.emoji);write(()=>emoji.setAttribute('aria-hidden','true'));write(()=>button.append(emoji));}
 const copy=c.element('span','iui-recommendation-copy'),title=c.element('span','iui-recommendation-title',data.title),description=c.element('span','iui-recommendation-description',data.description);
 write(()=>copy.append(title,description));write(()=>button.append(copy));write(()=>root.append(button));
 life.listen(button,'click',()=>{
  if(dispatching||!life.current()||readerBlocked(root,button,life.current()))return;
  dispatching=true;
  try{
   const detail:RecommendationCardIntent=Object.freeze({componentId:node.id??null,conversationId:data.conversationId});
   const event=write(()=>{
    const Event=c.doc.defaultView?.CustomEvent;
    if(Event)return new Event('iui:recommendation-card',{detail,bubbles:true,cancelable:true,composed:false});
    const fallback=write(()=>c.doc.createEvent('CustomEvent'));write(()=>fallback.initCustomEvent('iui:recommendation-card',true,true,detail));return fallback;
   });
   if(readerBlocked(root,button,life.current()))return;
   const dispatch=write(()=>root.dispatchEvent);write(()=>dispatch.call(root,event));
  }finally{dispatching=false;}
 });
 return root;
}
