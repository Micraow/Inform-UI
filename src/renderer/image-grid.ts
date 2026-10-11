import type{ImageGridNode}from'../schema/document.js';import type{RendererContext}from'./context.js';import{suppliedReaderContext}from'./supplied-reader-lifecycle.js';import{intentGate}from'./intent-gate.js';import{readerBlocked}from'./reader-controls.js';import{renderSearchImage}from'./search-image.js';
export interface ImageGridOpenDetail{readonly id:string;readonly index:number;}
/** Original finite image grid; local opening intent only, no fabricated remote gallery. */
export function renderImageGrid(parent:RendererContext,node:ImageGridNode,owner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=parent.element('section','iui-image-grid');const c=suppliedReaderContext(parent,root),gate=intentGate(c.lifecycle);root.setAttribute('aria-label',node.label??'Supplied images');root.style.setProperty('--iui-image-grid-columns',String(node.columns??3));
 for(const[ index,item]of node.images.entries()){const tile=c.element('figure','iui-image-grid-tile'),button=c.element('button','iui-image-grid-open');button.type='button';button.disabled=node.disabled===true;button.setAttribute('aria-label','Open '+item.alt);const picture=renderSearchImage(c,{type:'search-image',searchImage:{content_url:item.src},alt:item.alt,fit:node.fit??'cover',width:'100%',height:'100%',aspectRatio:1,fallback:'Image unavailable'},owner,host);button.append(picture);tile.append(button);if(item.caption!==undefined)tile.append(c.element('figcaption','iui-image-grid-caption',item.caption));root.append(tile);
  const allowed=()=>c.lifecycle.current()&&tile.parentNode===root&&button.parentNode===tile&&!node.disabled&&!readerBlocked(root,button,true);
  c.on(button,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed())return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;const detail:ImageGridOpenDetail=Object.freeze({id:item.id,index});const event=c.lifecycle.during(()=>new Constructor('iui:image-grid-open',{detail,bubbles:true,cancelable:true,composed:false}));if(allowed())c.lifecycle.during(()=>root.dispatchEvent(event));}));
 }
 return root;
}
