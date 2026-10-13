import type {ConversationSuggestionsNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import {readerBlocked} from './reader-controls.js';
import {renderSearchImage} from './search-image.js';
export interface ConversationSuggestionDetail {readonly id:string;readonly prompt:string;readonly intent?:'new-turn'|'start-voice';}
/** Original supplied actions. Acceptance is a local intent receipt, never completed host work. */
export function renderConversationSuggestions(parent:RendererContext,node:ConversationSuggestionsNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('div','iui-conversation-suggestions');const c=suppliedReaderContext(parent,root),gate=intentGate(c.lifecycle);
 root.setAttribute('role','group');root.setAttribute('aria-label',node.label??'Conversation suggestions');
 const phase=node.status??'resolved';root.dataset.phase=phase;
 if(phase==='pending'){const loading=c.element('div','iui-conversation-suggestion-loading');loading.setAttribute('role','status');loading.setAttribute('aria-label','Loading suggestions');root.setAttribute('aria-busy','true');root.append(loading);return root;}
 if(phase==='failed'){if(node.fallback)root.append(c.element('div','iui-conversation-suggestion-fallback',node.fallback));else root.hidden=true;return root;}
 const actions=c.element('div','iui-conversation-suggestion-items'),status=c.element('output','iui-conversation-suggestion-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(actions,status);
 for(const action of node.suggestions){const button=c.element('button','iui-conversation-suggestion');button.setAttribute('aria-label',action.label);button.type='button';button.disabled=node.disabled===true||action.disabled===true;actions.append(button);
  if(action.iconSrc){const icon=renderSearchImage(c,{type:'search-image',searchImage:{content_url:action.iconSrc},alt:'',width:24,height:24,fit:'contain',hideOnFailure:true},owner,host);icon.classList.add('iui-conversation-suggestion-icon');icon.setAttribute('aria-hidden','true');button.append(icon);}
  button.append(c.element('span','iui-conversation-suggestion-label',action.label));
  const allowed=()=>c.lifecycle.current()&&actions.parentNode===root&&button.parentNode===actions&&!readerBlocked(root,button,true)&&!node.disabled&&!action.disabled;
  c.on(button,'click',source=>gate.run(()=>{if(source.defaultPrevented||!allowed())return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;const detail:ConversationSuggestionDetail=Object.freeze({id:action.id,prompt:action.prompt,...(action.intent===undefined?{}:{intent:action.intent})});
   const event=c.lifecycle.during(()=>new Constructor('inform:view-conversation-suggestion',{detail,bubbles:true,cancelable:true,composed:false}));if(!allowed())return;
   const accepted=c.lifecycle.during(()=>root.dispatchEvent(event));if(!allowed()||status.parentNode!==root)return;
   c.lifecycle.during(()=>{status.textContent=accepted?'Suggestion requested':'Suggestion cancelled';});
  }));
 }
 return root;
}
