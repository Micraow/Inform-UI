import type {FollowUpActionBarNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import {readerBlocked} from './reader-controls.js';
import {renderSearchImage} from './search-image.js';
export interface FollowUpActionDetail {readonly id:string;readonly query?:string;readonly intent?:'new-turn'|'start-voice'|'open-image-composer';}
/** Independent presentation of supplied follow-ups. A receipt never executes host work. */
export function renderFollowUpActionBar(parent:RendererContext,node:FollowUpActionBarNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('div','iui-follow-up-action-bar');let measure=()=>{};const c=suppliedReaderContext(parent,root,()=>measure()),gate=intentGate(c.lifecycle);
 const presentation=node.presentation??'flat',phase=node.status??'resolved';root.dataset.presentation=presentation;root.dataset.phase=phase;
 root.setAttribute('role','group');root.setAttribute('aria-label',node.label??'Follow-up actions');
 if(phase==='pending'){const loading=c.element('div','iui-follow-up-action-loading');loading.setAttribute('role','status');loading.setAttribute('aria-label','Loading follow-ups');root.setAttribute('aria-busy','true');root.append(loading);return root;}
 if(phase==='failed'){if(node.fallback)root.append(c.element('div','iui-follow-up-action-fallback',node.fallback));else root.hidden=true;return root;}
 if(node.actions.length===0){root.hidden=true;return root;}
 const actions=c.element('div','iui-follow-up-action-items'),status=c.element('output','iui-follow-up-action-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(actions,status);
 const buttons:HTMLButtonElement[]=[];
 for(const action of node.actions){
  const button=c.element('button','iui-follow-up-action');button.type='button';button.disabled=node.disabled===true||action.disabled===true;button.setAttribute('aria-label',action.label);buttons.push(button);actions.append(button);
  if(action.iconSrc){const icon=renderSearchImage(c,{type:'search-image',searchImage:{content_url:action.iconSrc},alt:'',width:24,height:24,fit:'contain',hideOnFailure:true},owner,host);icon.classList.add('iui-follow-up-action-icon');icon.setAttribute('aria-hidden','true');button.append(icon);}
  button.append(c.element('span','iui-follow-up-action-label',action.label));
  const allowed=()=>c.lifecycle.current()&&actions.parentNode===root&&button.parentNode===actions&&!button.hidden&&!readerBlocked(root,button,true)&&!node.disabled&&!action.disabled;
  c.on(button,'click',source=>gate.run(()=>{
   if(source.defaultPrevented||!allowed())return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;
   const detail:FollowUpActionDetail=Object.freeze(action.query===undefined&&action.intent===undefined?{id:action.id}:{id:action.id,...(action.query===undefined?{}:{query:action.query}),intent:action.intent??'new-turn'});
   const event=c.lifecycle.during(()=>new Constructor('iui:follow-up-action',{detail,bubbles:true,cancelable:true,composed:false}));if(!allowed())return;
   const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));if(!allowed()||status.parentNode!==root)return;
   c.lifecycle.during(()=>{status.textContent=accepted?'Action requested':'Action cancelled';});
  }));
 }
 if(presentation==='footer'){
  const win=c.doc.defaultView;
  measure=()=>{const width=c.lifecycle.during(()=>owner.getBoundingClientRect().width);const limit=width>=576?3:width>=380?2:1;
   for(const[index,button]of buttons.entries()){if(button.parentNode!==actions)return;c.lifecycle.during(()=>{button.hidden=index>=limit;});}
  };
  if(win)c.on(win,'resize',()=>measure());c.bind(()=>measure());
 }
 return root;
}
