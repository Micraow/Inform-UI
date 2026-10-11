import type {FollowUpActionBarNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import {readerBlocked} from './reader-controls.js';
export interface FollowUpActionDetail {readonly id:string;}
/** Original supplied actions. Acceptance is a local intent receipt, never completed host work. */
export function renderFollowUpActionBar(parent:RendererContext,node:FollowUpActionBarNode):HTMLElement {
 const root=parent.element('div','iui-follow-up-action-bar');const c=suppliedReaderContext(parent,root),gate=intentGate(c.lifecycle);
 root.setAttribute('role','group');root.setAttribute('aria-label',node.label??'Follow-up actions');
 const actions=c.element('div','iui-follow-up-action-items'),status=c.element('output','iui-follow-up-action-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(actions,status);
 for(const action of node.actions){const button=c.element('button','iui-follow-up-action',action.label);button.type='button';button.disabled=node.disabled===true||action.disabled===true;actions.append(button);
  const allowed=()=>c.lifecycle.current()&&actions.parentNode===root&&button.parentNode===actions&&!readerBlocked(root,button,true)&&!node.disabled&&!action.disabled;
  c.on(button,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed())return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;const detail:FollowUpActionDetail=Object.freeze({id:action.id});
   const event=c.lifecycle.during(()=>new Constructor('iui:follow-up-action',{detail,bubbles:true,cancelable:true,composed:false}));if(!allowed())return;
   const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));if(!allowed()||status.parentNode!==root)return;
   c.lifecycle.during(()=>{status.textContent=accepted?'Action requested':'Action cancelled';});
  }));
 }
 return root;
}
