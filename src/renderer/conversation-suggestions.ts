import type {ConversationSuggestionsNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import {readerBlocked} from './reader-controls.js';
export interface ConversationSuggestionDetail {readonly id:string;readonly prompt:string;}
/** Original supplied actions. Acceptance is a local intent receipt, never completed host work. */
export function renderConversationSuggestions(parent:RendererContext,node:ConversationSuggestionsNode):HTMLElement {
 const root=parent.element('div','iui-conversation-suggestions');const c=suppliedReaderContext(parent,root),gate=intentGate(c.lifecycle);
 root.setAttribute('role','group');root.setAttribute('aria-label',node.label??'Conversation suggestions');
 const actions=c.element('div','iui-conversation-suggestion-items'),status=c.element('output','iui-conversation-suggestion-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(actions,status);
 for(const action of node.suggestions){const button=c.element('button','iui-conversation-suggestion',action.label);button.type='button';button.disabled=node.disabled===true||action.disabled===true;actions.append(button);
  const allowed=()=>c.lifecycle.current()&&actions.parentNode===root&&button.parentNode===actions&&!readerBlocked(root,button,true)&&!node.disabled&&!action.disabled;
  c.on(button,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed())return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;const detail:ConversationSuggestionDetail=Object.freeze({id:action.id,prompt:action.prompt});
   const event=c.lifecycle.during(()=>new Constructor('iui:conversation-suggestion',{detail,bubbles:true,cancelable:true,composed:false}));if(!allowed())return;
   const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));if(!allowed()||status.parentNode!==root)return;
   c.lifecycle.during(()=>{status.textContent=accepted?'Suggestion requested':'Suggestion cancelled';});
  }));
 }
 return root;
}
