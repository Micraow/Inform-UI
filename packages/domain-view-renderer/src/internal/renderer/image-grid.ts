import type{ImageGridNode,ImageGridItem}from'../schema/document.js';
import type{RendererContext}from'./context.js';
import{suppliedReaderContext}from'./supplied-reader-lifecycle.js';
import{intentGate}from'./intent-gate.js';
import{readerBlocked}from'./reader-controls.js';
import{renderSearchImage}from'./search-image.js';
import{openLocalImageViewer}from'./local-image-viewer.js';
export interface ImageGridOpenDetail{readonly id:string;readonly index:number;}
export function renderImageGrid(parent:RendererContext,node:ImageGridNode,owner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=parent.element('section','iui-image-grid');let resize=()=>{},closeViewer=()=>{};const c=suppliedReaderContext(parent,root,()=>resize()),gate=intentGate(c.lifecycle);c.cleanup(()=>closeViewer());
 const presentation=node.presentation??'grid',phase=node.status??'resolved';root.dataset.presentation=presentation;root.dataset.phase=phase;root.setAttribute('aria-label',node.label??'Supplied images');root.style.setProperty('--if-domain-image-grid-columns',String(node.columns??3));
 if(phase==='pending'){const loading=c.element('div','iui-image-grid-pending','Loading images');loading.setAttribute('role','status');root.setAttribute('aria-busy','true');root.append(loading);return root;}
 if(phase==='failed'){if(node.fallback)root.append(c.element('div','iui-image-grid-fallback',node.fallback));else root.hidden=true;return root;}
 const allowed=(button:HTMLButtonElement)=>c.lifecycle.current()&&root.contains(button)&&!button.hidden&&!node.disabled&&!readerBlocked(root,button,true);
 const emit=(name:string,detail:object,button:HTMLButtonElement)=>{const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor||!allowed(button))return false;const event=c.lifecycle.during(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));if(!allowed(button))return false;const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));return accepted&&allowed(button);};
 const tile=(item:ImageGridItem,index:number,passive=false)=>{
  const figure=c.element('figure','iui-image-grid-tile');figure.dataset.imageId=item.id;
  const target=passive?c.element('div','iui-image-grid-passive'):c.element('button','iui-image-grid-open');
  if(target.tagName==='BUTTON'){const button=target as HTMLButtonElement;button.type='button';button.disabled=node.disabled===true;button.setAttribute('aria-label','Open '+item.alt);
   c.on(button,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed(button)||!emit('inform:view-image-grid-open',{id:item.id,index},button))return;
    if((node.viewer??(presentation==='mosaic'?'local':'intent'))==='local'){closeViewer();if(allowed(button))closeViewer=openLocalImageViewer(c,root,button,node.images.map(image=>({content_url:image.src,title:image.alt})),index,owner,host);}
   }));
  }
  const image=renderSearchImage(c,{type:'search-image',searchImage:{content_url:item.src},alt:item.alt,fit:node.fit??'cover',width:'100%',height:'100%',...(presentation==='grid'?{aspectRatio:1}:{}),...(presentation==='grid'?{fallback:'Image unavailable'}:{hideOnFailure:true})},owner,host);
  target.append(image);figure.append(target);if(item.caption!==undefined&&!passive&&presentation==='grid')figure.append(c.element('figcaption','iui-image-grid-caption',item.caption));return figure;
 };
 if(presentation==='live'){root.dataset.theme='dark';if(!node.images.length)root.hidden=true;for(const[itemIndex,item]of node.images.slice(0,4).entries())root.append(tile(item,itemIndex,true));return root;}
 if(presentation==='mosaic'&&!node.images.length&&!node.loading){root.style.height='0px';return root;}
 if(node.loading&&node.placeholderRows?.length){const group=c.element('div','iui-image-grid-mosaic iui-image-grid-placeholders');for(const row of node.placeholderRows){const line=c.element('div','iui-image-grid-row');line.style.aspectRatio=String(row.aspectRatio??16/9);for(const item of row.tiles){const block=c.element('div','iui-image-grid-placeholder');block.setAttribute('role','status');block.setAttribute('aria-label','Loading image');block.style.flex=String(item.flexGrow??1);if(item.aspectRatio)block.style.aspectRatio=String(item.aspectRatio);line.append(block);}group.append(line);}root.append(group);}
 if(presentation==='mosaic'){
  const group=c.element('div','iui-image-grid-mosaic'),rows=node.rows?.length?node.rows:[{tiles:node.images.map(image=>({imageId:image.id})),aspectRatio:16/9}];
  for(const row of rows){if(!row.tiles.length)continue;const line=c.element('div','iui-image-grid-row');line.style.aspectRatio=String(row.aspectRatio??16/9);for(const cell of row.tiles){const index=node.images.findIndex(image=>image.id===cell.imageId);if(index<0)continue;const figure=tile(node.images[index]!,index);figure.style.flex=String('flexGrow'in cell?cell.flexGrow??1:1);if('aspectRatio'in cell&&cell.aspectRatio)figure.style.aspectRatio=String(cell.aspectRatio);line.append(figure);}group.append(line);}root.append(group);
 }else for(const[index,item]of node.images.entries())root.append(tile(item,index));
 const recommendations=node.recommendations??[];
 if(recommendations.length){const group=c.element('div','iui-image-grid-recommendations');group.setAttribute('role','group');group.setAttribute('aria-label','Image search follow-ups');root.append(group);let expanded=node.recommendationsExpanded===true;const controls:HTMLElement[]=[];
  for(const item of recommendations){
   if(node.loading){const placeholder=c.element('div','iui-image-grid-recommendation-placeholder');placeholder.setAttribute('role','status');placeholder.setAttribute('aria-label','Loading image search follow-up');group.append(placeholder);controls.push(placeholder);continue;}
   const button=c.element('button','iui-image-grid-recommendation');button.type='button';button.disabled=node.disabled===true;button.setAttribute('aria-label',item.label);const picture=renderSearchImage(c,{type:'search-image',searchImage:{content_url:item.thumbnailSrc},alt:'',fit:'cover',width:24,height:24,radius:999,hideOnFailure:true},owner,host);picture.setAttribute('aria-hidden','true');button.append(picture,c.element('span','',item.label));group.append(button);controls.push(button);
   c.on(button,'click',source=>gate.run(()=>{if(!source.defaultPrevented&&allowed(button))emit('inform:view-image-grid-recommendation',{id:item.id,query:item.query,prompt:'search images of '+item.query},button);}));
  }
  const toggle=c.element('button','iui-image-grid-recommendation-toggle');toggle.type='button';toggle.disabled=node.disabled===true;group.append(toggle);
  resize=()=>{const width=c.lifecycle.during(()=>owner.getBoundingClientRect().width),limit=width>=576?3:2;for(const[index,control]of controls.entries())c.lifecycle.during(()=>{control.hidden=(node.loading||!expanded)&&index>=limit;});c.lifecycle.during(()=>{toggle.hidden=!!node.loading||recommendations.length<=limit;toggle.textContent=expanded?'Fewer':'More';toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Show fewer image search follow-ups':'Show more image search follow-ups');});};
  c.on(toggle,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed(toggle))return;expanded=!expanded;resize();}));c.bind(()=>resize());if(c.doc.defaultView)c.on(c.doc.defaultView,'resize',()=>resize());
 }
 return root;
}
