import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import type {PressableNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {readerBlocked} from './reader-controls.js';
export interface PressDetail {readonly componentId:string|null;readonly actionId:string;}

/** Native single action over passive authored content. Emits intent only; no host execution. */
export function renderPressable(c:RendererContext,n:PressableNode):HTMLElement {
 const root=c.element('div','iui-pressable');c=suppliedReaderContext(c,root);const intent=intentGate(c.lifecycle),e=c.element,t=c.labels().pressableUI,id=c.allocateInternalId?.('pressable')??`${c.prefix}-pressable`;
 const surface=e('div','iui-pressable-surface'),content=e('div','iui-pressable-content'),button=e('button','iui-pressable-hit'),status=e('p','iui-pressable-status');
 root.dir='auto';root.dataset.tone=n.tone??'default';root.dataset.status='idle';
 content.setAttribute('aria-hidden','true');for(const child of n.children)content.append(c.render(child));
 button.type='button';button.setAttribute('aria-label',n.label);button.id=id+'-action';
 status.id=id+'-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 surface.append(content,button);root.append(surface);
 const described=[status.id];if(n.description!==undefined){const description=e('p','iui-pressable-description',n.description);description.id=id+'-description';described.unshift(description.id);root.append(description);}
 button.setAttribute('aria-describedby',described.join(' '));root.append(status);
 let alive=true,revision=0;
 const owned=(el:HTMLElement)=>alive&&root.contains(el);
 const blocked=()=>!c.lifecycle.current()||readerBlocked(root,button,alive)||!surface.contains(button)||!root.contains(surface)||!surface.contains(content);
 const disabled=()=>n.disabled!==undefined&&c.value(n.disabled)===true;
 const setStatus=(value:string,text:string,ticket:number)=>{if(ticket!==revision||blocked())return;root.dataset.status=value;if(owned(status)&&ticket===revision)status.textContent=text;};
 c.bind(()=>{if(!alive)return;revision++;const off=disabled();if(owned(button))button.disabled=off;if(owned(root))root.dataset.disabled=String(off);});
 c.on(button,'click',()=>intent.run(()=>{
  if(blocked()||disabled())return;
  const ticket=revision;
  try {
   const detail:PressDetail=Object.freeze({componentId:n.id??null,actionId:n.actionId});
   const Constructor=c.doc.defaultView?.CustomEvent;
   if(ticket!==revision||blocked()||disabled())return;
   let event:CustomEvent<PressDetail>;
   if(typeof Constructor==='function')event=c.lifecycle.during(()=>new Constructor('iui:press',{detail,bubbles:true,cancelable:true,composed:false}));
   else{event=c.doc.createEvent('CustomEvent');event.initCustomEvent('iui:press',true,true,detail);}
   if(ticket!==revision||blocked()||disabled())return;
   const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));
   if(ticket!==revision||blocked()||disabled())return;
   setStatus(accepted?'requested':'cancelled',accepted?t.requested:t.cancelled,ticket);
  } catch {setStatus('error',t.failed,ticket);}
 }));
 c.cleanup(()=>{alive=false;revision++;});return root;
}
