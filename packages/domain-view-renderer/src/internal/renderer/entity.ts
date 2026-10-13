import type {EntityNode} from '../core/entity.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import {readerBlocked} from './reader-controls.js';
import {renderSearchImage} from './search-image.js';
import {renderCarousel} from './carousel.js';
/** Original presentation of supplied entities; actions are bounded local intents. */
export function renderEntity(parent:RendererContext,node:EntityNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('section','iui-entity iui-'+node.type),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,gate=intentGate(life);
 write(()=>{root.dir='auto';root.dataset.phase=node.status??'resolved';root.setAttribute('aria-label',node.label);});
 if(node.status==='pending'){const loading=c.element('div','iui-entity-loading');write(()=>{root.setAttribute('aria-busy','true');loading.setAttribute('role','status');loading.setAttribute('aria-label',node.label);root.append(loading);});return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(c.element('p','iui-entity-fallback',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 const allowed=(button:HTMLButtonElement,disabled=false)=>write(()=>!node.disabled&&!disabled&&!readerBlocked(root,button,life.current()));
 const emit=(button:HTMLButtonElement,event:Event,name:string,detail:Record<string,unknown>,disabled=false)=>{
  if(write(()=>event.defaultPrevented)||!allowed(button,disabled))return false;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return false;
  const intent=write(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));
  return allowed(button,disabled)&&write(()=>root.dispatchEvent(intent))&&allowed(button,disabled);
 };
 const makeButton=(label:string,cls:string,disabled=false)=>{const b=c.element('button',cls,label);write(()=>{b.type='button';b.disabled=node.disabled===true||disabled;});return b;};
 const bitmap=(record:{src:string;alt?:string},title:string,entityId:string|null,disabled:boolean)=>{
  const frame=c.element('div','iui-entity-image');let loaded=false;
  const load=()=>{if(loaded)return;loaded=true;const image=write(()=>renderSearchImage(c,{type:'search-image',searchImage:{content_url:record.src},alt:record.alt??title,fit:'cover',width:'100%',height:'100%',hideOnFailure:true},owner,host));write(()=>frame.replaceChildren(image));};
  if(/^data:/i.test(record.src))load();else{const consent=makeButton(node.loadImageLabel??'Load supplied image','iui-entity-image-consent',disabled);write(()=>frame.append(consent));c.on(consent,'click',event=>gate.run(()=>{if(emit(consent,event,'inform:view-entity-image-request',{id:node.id??null,entityId,src:record.src},disabled))load();}));}
  return frame;
 };
 const tile=(data:{id?:string;title:string;subtitle?:string;images?:{src:string;alt?:string}[];metadata?:{label:string;value:string}[];description?:string;actionId?:string;actionLabel?:string;disabled?:boolean},card:boolean,carousel:boolean)=>{
  const box=c.element('article','iui-entity-tile'+(carousel?' iui-entity-carousel-tile':'')),entityId=data.id??null,disabled=data.disabled===true;
  const images=data.images??[];
  if(card||images.length){const mosaic=c.element('div','iui-entity-mosaic');write(()=>{mosaic.dataset.count=String(Math.min(images.length,carousel?2:card?1:3));if(card)mosaic.classList.add('iui-entity-card-image');});for(const image of images.slice(0,carousel?2:card?1:3))write(()=>mosaic.append(bitmap(image,data.title,entityId,disabled)));write(()=>box.append(mosaic));}
  const content=c.element('div','iui-entity-copy'),title=c.element('h3','iui-entity-title',data.title);write(()=>content.append(title));
  if(card&&data.subtitle!==undefined)write(()=>content.append(c.element('p','iui-entity-subtitle',data.subtitle)));
  if(data.metadata?.length){const metadata=c.element('dl','iui-entity-metadata');for(const item of data.metadata){const pair=c.element('div','iui-entity-fact'),label=c.element('dt','',item.label),value=c.element('dd','',item.value);write(()=>pair.append(label,value));write(()=>metadata.append(pair));}write(()=>content.append(metadata));}
  if(data.description)write(()=>content.append(c.element('p','iui-entity-description',data.description)));write(()=>box.append(content));
  if(data.actionId){const action=makeButton('', 'iui-entity-action',disabled);write(()=>action.setAttribute('aria-label',data.actionLabel??'Open details for '+data.title));c.on(box,'click',event=>gate.run(()=>{const target=write(()=>event.target);if(target instanceof(c.doc.defaultView?.Element??Object)){const other=write(()=>(target as Element).closest('button'));if(other&&other!==action)return;}emit(action,event,'inform:view-entity-action',{id:node.id??null,entityId,actionId:data.actionId},disabled);}));write(()=>box.append(action));}
  return box;
 };
 if(node.type==='entity-card'){write(()=>root.append(tile({...node,title:node.title!,images:node.image?[node.image]:[]},true,false)));return root;}
 if(node.variant!=='carousel'){if(node.item)write(()=>root.append(tile(node.item!,false,false)));return root;}
 write(()=>root.classList.add('iui-entity-carousel'));if(node.mobile)write(()=>root.classList.add('iui-entity-mobile'));
 if(node.title)write(()=>root.append(c.element('h3','iui-entity-collection-title',node.title)));
 if(!node.items?.length){write(()=>root.append(c.element('p','iui-entity-empty',node.emptyLabel??'No entities')));return root;}
 const items=node.items;
 const carouselContext:RendererContext={...c,on:(target,name,listener)=>name==='click'?c.on(target,name,event=>gate.run(()=>{if(write(()=>event.defaultPrevented)||!allowed(target as HTMLButtonElement))return;listener(event);})):c.on(target,name,listener),render:child=>tile(items[Number((child as {value?:unknown}).value)],false,true)};
 const rail=write(()=>renderCarousel(carouselContext,{type:'carousel',label:node.label,children:items.map((_,i)=>({type:'text',value:i}))},c.labels().carouselUI));for(const control of write(()=>Array.from(rail.querySelectorAll<HTMLButtonElement>('.iui-carousel-previous,.iui-carousel-next'))))write(()=>{control.disabled=node.disabled===true;});write(()=>root.append(rail));return root;
}
