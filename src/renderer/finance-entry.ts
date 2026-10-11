import type{FinanceEntryNode,FinanceEntryDetail}from'../core/finance-entry.js';
import type{RendererContext}from'./context.js';
import{suppliedReaderContext,suppliedReaderPainter}from'./supplied-reader-lifecycle.js';
import{readerBlocked,readerNativeReset}from'./reader-controls.js';
import{intentGate}from'./intent-gate.js';
import{renderSearchImage}from'./search-image.js';
/** Original finite supplied finance entry views. Local requests only. */
export function renderFinanceEntry(parent:RendererContext,n:FinanceEntryNode,owner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=parent.element('section','iui-finance-entry'),c=suppliedReaderContext(parent,root),life=c.lifecycle,w=life.during,e=c.element,gate=intentGate(life),paint=suppliedReaderPainter(c);
 w(()=>{root.setAttribute('role','group');root.setAttribute('aria-label',n.label);root.dir='auto';root.dataset.kind=n.type;root.dataset.phase=n.status??'resolved';});
 if(n.status==='pending'){w(()=>{root.setAttribute('aria-busy','true');root.append(e('p','iui-finance-entry-loading',n.fallback??'Waiting for supplied information'));});return root;}
 if(n.status==='failed'){w(()=>{if(n.fallback)root.append(e('p','',n.fallback));else root.hidden=true;});return root;}
 const body=e('div','iui-finance-entry-body'),notice=e('p','iui-finance-entry-notice'),reset=e('button','iui-finance-entry-reset',n.resetLabel??'Reset local requests');w(()=>{notice.setAttribute('role','status');reset.type='button';reset.disabled=n.disabled===true;reset.dataset.financeEntry='reset';root.append(body,reset,notice);});
 let revision=0,message='',pending=()=>false;const refresh=()=>paint(scope=>scope.during(()=>{notice.textContent=message;}));const ready=(b:HTMLElement,enabled=true)=>w(()=>enabled&&n.disabled!==true&&!readerBlocked(root,b,life.current()));
 function control(target:HTMLElement,label:string,detail:Omit<FinanceEntryDetail,'id'|'component'>,enabled=true,className='iui-finance-entry-action'){
  const b=e('button',className,label);w(()=>{b.type='button';b.disabled=n.disabled===true||!enabled;b.dataset.financeEntry=detail.intent;target.append(b);});
  c.on(b,'click',ev=>gate.run(()=>{const before=revision;if(w(()=>ev.defaultPrevented)||pending()||!ready(b,enabled))return;const Constructor=w(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return;const payload:FinanceEntryDetail=Object.freeze({id:n.id??null,component:n.type,...detail,...(detail.action?{action:Object.freeze({...detail.action})}:{})});const request=w(()=>new Constructor('iui:finance-entry',{detail:payload,bubbles:true,cancelable:true,composed:false}));if(before!==revision||pending()||!ready(b,enabled))return;const accepted=w(()=>root.dispatchEvent(request));if(before!==revision||pending()||!ready(b,enabled))return;revision++;message=accepted?(n.requestedLabel??'Local request accepted'):(n.cancelledLabel??'Local request cancelled');refresh();}));return b;
 }
 if(n.type==='finance-onboarding-suggestions'){
  const grid=e('div','iui-finance-entry-grid'),follow=e('div','iui-finance-entry-follow');w(()=>body.append(e('h3','',n.heading??''),grid,follow));
  for(const item of n.items??[]){const cell=e('div','iui-finance-entry-tile'),b=control(cell,'',{intent:'prefill',itemId:item.id,query:item.query},n.prefillAvailable===true&&item.disabled!==true,'iui-finance-entry-suggestion');const icon=e('span','iui-finance-entry-emoji',item.emoji??''),plus=e('span','iui-finance-entry-plus','+');w(()=>{icon.setAttribute('aria-hidden','true');plus.setAttribute('aria-hidden','true');b.setAttribute('aria-label',item.label);b.append(icon,plus,e('span','',item.label));grid.append(cell);});}
  if(n.followUp){const f=n.followUp,b=control(follow,f.label,{intent:'follow-up',query:f.query,...(f.event?{event:f.event}:{})},f.disabled!==true);if(f.icon){const icon=e('span','',f.icon);w(()=>{icon.setAttribute('aria-hidden','true');b.prepend(icon);});}}
 }else if(n.type==='ledger-repair-bank-connection'){
  const actionable=!!n.ctaLabel&&!!n.linkId,copy=e('div','iui-finance-entry-copy');w(()=>{body.dataset.actionable=String(actionable);if(!actionable){const warning=e('span','iui-finance-entry-warning','!');warning.setAttribute('aria-hidden','true');body.append(warning);}copy.append(e('h3','',n.title??''),e('p','',n.description??''));body.append(copy);});
  if(actionable){const b=control(body,n.ctaLabel!,{intent:'repair-bank-connection',title:n.title,linkId:n.linkId,...(n.prompt?{query:n.prompt}:{}),...(n.systemHint?{systemHint:n.systemHint}:{})},n.initializing!==true);w(()=>{b.setAttribute('aria-busy',String(n.initializing===true));});}
 }else{
  const card=control(body,'',{intent:'open-finance-onboarding',title:n.title,...(n.action?{action:n.action}:{query:n.prompt}),...(n.threadMode?{threadMode:n.threadMode}:{}),...(n.systemHint?{systemHint:n.systemHint}:{})},true,'iui-finance-entry-onboarding');const icon=e('span','iui-finance-entry-icon',n.icon??'◇');w(()=>{card.setAttribute('aria-label',n.title??n.label);icon.setAttribute('aria-hidden','true');card.append(icon,e('strong','',n.title??''),e('span','iui-finance-entry-description',n.description??''));});
  if(n.iconSrc){const source=n.iconSrc,load=(target:HTMLElement)=>{const image=renderSearchImage(c,{type:'search-image',searchImage:{content_url:source},alt:'',width:24,height:24,fit:'contain',fallback:n.icon??'◇',hideOnFailure:true},owner,host);w(()=>target.replaceChildren(image));};if(/^data:/i.test(source))load(icon);else{const frame=e('div','iui-finance-entry-external-icon'),consent=e('button','',n.loadImageLabel??'Load supplied icon');w(()=>{consent.type='button';consent.disabled=n.disabled===true;consent.dataset.financeEntry='load-image';frame.append(consent);body.append(frame);});c.on(consent,'click',event=>gate.run(()=>{if(w(()=>event.defaultPrevented)||pending()||!ready(consent))return;revision++;load(frame);}));}}

 }
 const clear=()=>{revision++;message='';refresh();};c.on(reset,'click',ev=>gate.run(()=>{if(w(()=>ev.defaultPrevented)||!ready(reset))return;clear();}));pending=readerNativeReset(c,root,[reset],()=>revision,refresh,clear);refresh();return root;
}
