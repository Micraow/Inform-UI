import {animateChecklistDetails} from './prompt-checklist-motion.js';
import type {PromptChecklistNode,PromptChecklistLocal,ChecklistTask,ChecklistPrompt,PromptChecklistAction} from '../core/prompt-checklist.js';
import {promptChecklistView,updatePromptChecklistLocal,promptChecklistDetails,promptChecklistPressScale} from '../core/prompt-checklist.js';
import type {RendererContext} from './context.js';
import type {RenderGeneration} from './generation.js';
import {readerBlocked} from './reader-controls.js';
export interface PromptChecklistIntent {readonly componentId:string|null;readonly taskId:string;readonly promptId:string|null;readonly query:string}
/** Local view changes and cancelable supplied prompt intents; never modifies completion facts. */
export function renderPromptChecklist(c:RendererContext,node:PromptChecklistNode):HTMLElement {
 const root=c.element('section','iui-prompt-checklist');let owner:Node|null=null,busy=false,revision=0,local:PromptChecklistLocal={},paintLife:RenderGeneration|undefined,retirePreviousExit:(()=>void)|undefined;
 const life=c.lifecycle.fork(()=>owner===null||owner.contains(root));
 life.during(()=>root.setAttribute('aria-label',node.label));life.during(()=>{root.dir='auto';root.dataset.status=node.status;});
 if(node.status==='pending'){const block=c.element('div','iui-prompt-checklist-loading');life.during(()=>root.setAttribute('aria-busy','true'));life.during(()=>block.setAttribute('role','status'));life.during(()=>block.setAttribute('aria-label',node.label));life.during(()=>root.append(block));return root;}
 if(node.status!=='resolved'){if(node.fallback)life.during(()=>root.append(c.element('p','iui-prompt-checklist-fallback',node.fallback)));else life.during(()=>{root.hidden=true;});return root;}
 const data=node.data,ids=new Map(data.tasks.map((task,index)=>[task.id,life.during(()=>c.allocateInternalId?.('prompt-task')??`${c.prefix}-prompt-task-${index}`)]));
 life.own(c.bind(()=>{if(owner===null&&root.isConnected)owner=root.parentNode;}));
 const paint=(focusKey?:string)=>{
  retirePreviousExit?.();retirePreviousExit=undefined;
  const previousPaint=paintLife,previousDetails=root.querySelector<HTMLElement>('.iui-prompt-checklist-details:not([data-exiting])'),nextView=promptChecklistView(data,local);
  const outgoing=previousDetails&&nextView.fullReady&&previousDetails.dataset.taskId!==nextView.selectedTaskId&&root.contains(previousDetails)?previousDetails:null;
  const outgoingHeight=outgoing?life.during(()=>outgoing.getBoundingClientRect().height):0;
  const epoch=++revision;const scope=life.fork(()=>revision===epoch),write=scope.during;paintLife=scope;
  const retireOutgoing=scope.own(()=>{previousPaint?.dispose();if(outgoing&&root.contains(outgoing))outgoing.remove();});
  if(!outgoing)retireOutgoing();else retirePreviousExit=retireOutgoing;
  try{
   const view=promptChecklistView(data,local),e=c.element,body=e('div',view.finished?'iui-prompt-checklist-finished':'iui-prompt-checklist-body'),controls=new Map<string,HTMLButtonElement>();
   const put=(target:Element,...children:(Node|string)[])=>write(()=>target.append(...children));
   const attr=(target:Element,name:string,value:string)=>write(()=>target.setAttribute(name,value));
   const text=(cls:string,value:string)=>e('span',cls,value);
   const usable=(button:HTMLElement)=>owner?.contains(root)&&!node.disabled&&!readerBlocked(root,button,scope.current());
   const control=(cls:string,key:string,action:(button:HTMLButtonElement)=>void)=>{const b=e('button',cls);write(()=>{b.type='button';b.disabled=node.disabled??false;b.dataset.controlKey=key;});controls.set(key,b);if(cls==='iui-prompt-checklist-secondary'){const measure=()=>{if(!usable(b))return;const width=write(()=>b.offsetWidth),scale=promptChecklistPressScale(width);write(()=>b.style.setProperty('--iui-prompt-button-scale',String(scale)));};scope.listen(b,'pointerdown',measure);scope.listen(b,'keydown',event=>{if(['Enter',' '].includes((event as KeyboardEvent).key))measure();});}scope.listen(b,'click',()=>{if(busy||!usable(b))return;busy=true;try{action(b);}finally{busy=false;}});return b;};
   const localAction=(action:PromptChecklistAction,key:string,button:HTMLButtonElement)=>{const restore=c.doc.activeElement===button;local=updatePromptChecklistLocal(data,local,action);paint(restore?key:undefined);};
   const emit=(task:ChecklistTask,prompt:ChecklistPrompt|null,button:HTMLButtonElement)=>{
    const detail:PromptChecklistIntent=Object.freeze({componentId:node.id??null,taskId:task.id,promptId:prompt?.id??null,query:prompt?.promptText??task.tryOwnPromptText});
    const event=write(()=>{const Event=c.doc.defaultView?.CustomEvent;if(Event)return new Event('iui:prompt-checklist',{detail,bubbles:true,cancelable:true,composed:false});const fallback=write(()=>c.doc.createEvent('CustomEvent'));write(()=>fallback.initCustomEvent('iui:prompt-checklist',true,true,detail));return fallback;});
    if(!usable(button))return;const dispatch=write(()=>root.dispatchEvent);if(!usable(button))return;write(()=>dispatch.call(root,event));
   };
   const glyph=(kind:'complete'|'empty'|'up'|'down')=>{const svg=write(()=>c.svg('svg',{viewBox:'0 0 24 24','aria-hidden':'true',focusable:'false',class:'iui-prompt-checklist-symbol'}));
    if(kind==='complete'||kind==='empty'){put(svg,write(()=>c.svg('circle',{cx:12,cy:12,r:9,fill:kind==='complete'?'currentColor':'none',stroke:'currentColor','stroke-width':1.5})));if(kind==='complete')put(svg,write(()=>c.svg('polyline',{points:'7.5,12 10.5,15 16.5,8.5',fill:'none',stroke:'var(--iui-prompt-elevated)','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'})));}
    else put(svg,write(()=>c.svg('polyline',{points:kind==='up'?'7,14 12,9 17,14':'7,10 12,15 17,10',fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'})));return svg;};
   const heading=(task:ChecklistTask,expanded:boolean,expandable:boolean)=>{const completed=data.completedTaskIds.includes(task.id),row=e('span','iui-prompt-checklist-heading'),mark=e('span','iui-prompt-checklist-marker');attr(row,'data-completed',String(completed));put(mark,glyph(completed?'complete':'empty'));put(row,mark,text('iui-prompt-checklist-task-title',task.title));if(expandable){const arrow=e('span','iui-prompt-checklist-arrow');put(arrow,glyph(expanded?'up':'down'));put(row,arrow);}return row;};
   const details=(task:ChecklistTask)=>{const out=e('div','iui-prompt-checklist-details'),inner=e('div','iui-prompt-checklist-detail-content'),content=promptChecklistDetails(task);put(out,inner);attr(out,'id',ids.get(task.id)!);attr(out,'data-task-id',task.id);
    for(const prompt of content.prompts){const b=control('iui-prompt-checklist-choice',`prompt:${task.id}:${prompt.id}`,button=>emit(task,prompt,button));attr(b,'aria-label',prompt.label);
     if(content.hasIcons){const slot=e('span','iui-prompt-checklist-icon');attr(slot,'aria-hidden','true');if(prompt.icon){const icon=write(()=>c.render({type:'icon',name:prompt.icon!,size:'md'}));attr(icon,'width','18');attr(icon,'height','18');put(slot,icon);}put(b,slot);}
     if(content.hasImages){const slot=e('span','iui-prompt-checklist-image-slot');if(prompt.imageData){const image=e('img','iui-prompt-checklist-image');write(()=>{image.alt='';image.width=73;image.height=73;image.referrerPolicy='no-referrer';});put(slot,image);scope.listen(image,'error',()=>{if(owner?.contains(root)&&root.contains(slot)&&slot.contains(image))write(()=>{image.hidden=true;});});scope.acquire(()=>{image.src=prompt.imageData!;return image;},owned=>{if(slot.contains(owned))owned.removeAttribute('src');});}put(b,slot);}
     const copy=e('span','iui-prompt-checklist-choice-copy');put(copy,text('iui-prompt-checklist-prompt-label',prompt.label),text('iui-prompt-checklist-summary',prompt.summary||prompt.promptText));put(b,copy);put(inner,b);
    }
    const ownWrap=e('div','iui-prompt-checklist-own-wrap'),own=control('iui-prompt-checklist-secondary',`own:${task.id}`,button=>emit(task,null,button));put(own,task.tryOwnLabel||data.tryOwnLabel);put(ownWrap,own);put(inner,ownWrap);return out;
   };
   if(view.finished){
    const mark=e('span','iui-prompt-checklist-finished-mark');put(mark,glyph('complete'));const headline=e('h3','iui-prompt-checklist-title',data.completion.headline),copy=e('p','iui-prompt-checklist-finished-copy',data.completion.body),wrap=e('div','iui-prompt-checklist-review-wrap'),review=control('iui-prompt-checklist-review','review-all',b=>localAction({kind:'show-all'},'review-all',b));put(review,data.completion.showCompletedItemsLabel);put(wrap,review);put(body,mark,headline,copy,wrap);
   }else{
    if(view.compact||view.fullReady)put(body,e('h3','iui-prompt-checklist-title',data.title));
    const list=e('div','iui-prompt-checklist-tasks');
    view.visibleTasks.forEach((task,index)=>{const group=e('div','iui-prompt-checklist-task'),expandable=task.prompts.length>0,expanded=!view.compact&&view.selectedTaskId===task.id&&expandable;
     if(expandable){const key=`task:${task.id}`,b=control('iui-prompt-checklist-task-button',key,button=>localAction({kind:'task',taskId:task.id},key,button));attr(b,'aria-expanded',String(expanded));if(expanded)attr(b,'aria-controls',ids.get(task.id)!);put(b,heading(task,expanded,true));put(group,b);}else{const plain=e('div','iui-prompt-checklist-task-plain');put(plain,heading(task,false,false));put(group,plain);}
     if(expanded)put(group,details(task));if(outgoing?.dataset.taskId===task.id){attr(outgoing,'data-exiting','true');attr(outgoing,'aria-hidden','true');attr(outgoing,'inert','');write(()=>outgoing.removeAttribute('id'));put(group,outgoing);}put(list,group);if(index<view.visibleTasks.length-1)put(list,e('div','iui-prompt-checklist-divider'));
    });put(body,list);
    if(view.compact&&view.olderCompletedTasks.length&&!view.completedItemsExpanded){const more=control('iui-prompt-checklist-secondary','show-completed',b=>localAction({kind:'show-completed'},'show-completed',b));put(more,data.showCompletedItemsLabel);put(body,more);}
   }
   write(()=>{root.dataset.view=view.finished?'finished':view.compact?'compact':view.fullReady?'full':'empty';});write(()=>root.replaceChildren(body));
   const enter=()=>{if(!scope.current()||!root.isConnected)return;const incoming=root.querySelector<HTMLElement>('.iui-prompt-checklist-details:not([data-exiting])');if(incoming)animateChecklistDetails(scope,incoming,'enter',write(()=>incoming.getBoundingClientRect().height));};
   if(outgoing&&root.contains(outgoing)){const stopExit=animateChecklistDetails(scope,outgoing,'exit',outgoingHeight,retireOutgoing);retirePreviousExit=()=>{stopExit();retireOutgoing();};}else retireOutgoing();
   if(root.isConnected)enter();else{let started=false;scope.own(c.bind(()=>{if(!started&&root.isConnected){started=true;enter();}}));}
   if(focusKey){const next=controls.get(focusKey)??controls.get('task:'+data.tasks[0]?.id);if(next)write(()=>next.focus({preventScroll:true}));}
  }catch(error){scope.dispose();throw error;}
 };
 paint();return root;
}
