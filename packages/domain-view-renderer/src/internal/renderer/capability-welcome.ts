import {officialSymbol} from './official-symbol.js';
import type {CapabilityWelcomeNode,CapabilityWelcomeDetail,WelcomeAction} from '../core/capability-welcome.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {renderSearchImage} from './search-image.js';
/** Supplied welcome pills. No telemetry, navigation, voice session or client service. */
export function renderCapabilityWelcome(parent:RendererContext,node:CapabilityWelcomeNode,owner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=parent.element('section','iui-capability-welcome'),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,draw=suppliedReaderPainter(c),gate=intentGate(life),e=c.element;
 write(()=>{root.setAttribute('role','group');root.setAttribute('aria-label',node.label);root.dir='auto';root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){const pending=e('p','iui-capability-loading',node.fallback??'Waiting for supplied capabilities');write(()=>{pending.setAttribute('role','status');root.setAttribute('aria-busy','true');root.append(pending);});return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(e('p','',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 const list=e('ul','iui-capability-welcome-list'),notice=e('p','iui-capability-welcome-status'),reset=e('button','iui-capability-welcome-reset',node.resetLabel??'Reset welcome actions');write(()=>{notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');reset.type='button';reset.dataset.welcomeAction='reset';reset.disabled=node.disabled===true;root.append(list,reset,notice);});
 let revision=0,message='',resetPending=()=>false;
 const refresh=()=>draw(scope=>scope.during(()=>{notice.textContent=message;}));
 const actionReady=(action:WelcomeAction|undefined)=>action!==undefined&&action.disabled!==true&&action.kind!=='voice'&&(action.kind!=='capability'||action.available===true);
 const allowed=(control:HTMLElement,action?:WelcomeAction)=>write(()=>node.disabled!==true&&(action===undefined||actionReady(action))&&!readerBlocked(root,control,life.current()));
 for(const item of node.items??[]){const action=node.actions?.find(action=>action.id===item.actionId),row=e('li','iui-capability-welcome-item'),button=e('button','iui-capability-welcome-pill'),symbol=e('span','iui-capability-welcome-symbol'),label=e('span','iui-capability-welcome-label',item.label),fallback=item.fallbackSymbol??item.label;
  write(()=>{button.type='button';button.dataset.welcomeAction='activate';button.dataset.itemId=item.id;button.setAttribute('aria-label',item.label);button.disabled=node.disabled===true||item.disabled===true||!actionReady(action);symbol.setAttribute('aria-hidden','true');});
  if(item.iconSrc){const image=renderSearchImage(c,{type:'search-image',searchImage:{content_url:item.iconSrc},alt:'',width:24,height:24,fit:'contain',fallback,hideOnFailure:true},owner,host);write(()=>symbol.append(image));}else write(()=>{if(item.fallbackSymbol)symbol.textContent=item.fallbackSymbol;else symbol.append(officialSymbol(c,'',item.actionId==='search'?'Search':item.actionId==='images'?'Images':'Heart')); });
  write(()=>{button.append(symbol,label);row.append(button);list.append(row);});
  c.on(button,'click',event=>gate.run(()=>{const before=revision;if(write(()=>event.defaultPrevented)||resetPending()||item.disabled===true||!actionReady(action)||!allowed(button,action))return;
   const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor||!action||action.kind==='voice')return;
   const detail:CapabilityWelcomeDetail=Object.freeze({id:node.id??null,itemId:item.id,actionId:action.id,...(node.campaignId?{campaignId:node.campaignId}:{}),...(action.kind==='prompt'?{intent:'submit-prompt',query:action.query}:action.kind==='url'?{intent:'open-url',url:action.url}:{intent:'open-capability',capability:action.capability})});
   const emitted=write(()=>new Constructor('inform:view-capability-welcome',{detail,bubbles:true,cancelable:true,composed:false}));if(before!==revision||resetPending()||!allowed(button,action))return;
   const accepted=write(()=>root.dispatchEvent(emitted));if(before!==revision||resetPending()||!allowed(button,action))return;revision++;message=accepted?(node.requestedLabel??'Local request accepted'):(node.cancelledLabel??'Local request cancelled');refresh();
  }));
 }
 if(!node.items?.length)write(()=>list.append(e('li','iui-capability-welcome-empty',node.emptyLabel??'No capabilities supplied')));
 const clear=()=>{revision++;message='';refresh();};c.on(reset,'click',event=>gate.run(()=>{if(write(()=>event.defaultPrevented)||!allowed(reset))return;clear();}));resetPending=readerNativeReset(c,root,[reset],()=>revision,refresh,clear);refresh();return root;
}
