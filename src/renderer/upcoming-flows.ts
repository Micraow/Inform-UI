import type{LedgerUpcomingActivityNode,UpcomingActivity}from'../schema/document.js';
import type{RendererContext}from'./context.js';
import{suppliedReaderContext,suppliedReaderInput,suppliedReaderPainter}from'./supplied-reader-lifecycle.js';
import{readerBlocked,readerNativeReset}from'./reader-controls.js';
import{intentGate}from'./intent-gate.js';
import{renderSearchImage}from'./search-image.js';
/** Explicit flow/expansion reader over supplied labels; never reads an account. */
export function renderUpcomingFlows(parent:RendererContext,node:LedgerUpcomingActivityNode,owner:HTMLElement,host:HTMLElement):HTMLElement{
 const root=parent.element('section','iui-upcoming-activity iui-upcoming-flows');let measure=()=>{};const c=suppliedReaderContext(parent,root,()=>measure()),paint=suppliedReaderPainter(c),input=suppliedReaderInput(c),gate=intentGate(c.lifecycle);root.setAttribute('aria-label',node.label);const phase=node.status??'resolved';root.dataset.phase=phase;
 if(phase==='pending'){const loading=c.element('div','iui-upcoming-loading');loading.setAttribute('role','status');loading.setAttribute('aria-label','Loading upcoming activity');root.setAttribute('aria-busy','true');root.append(loading);return root;}
 if(phase==='failed'){if(node.fallback)root.append(c.element('p','',node.fallback));else root.hidden=true;return root;}
 const heading=c.element('h3','',node.label);root.append(heading);
 if(node.hasConnectedAccounts===false){root.append(c.element('p','iui-upcoming-no-accounts',node.noAccountsLabel??'No connected accounts supplied'));return root;}
 let flow=node.activeFlow??'outgoing',expanded=node.expanded===true,revision=0,rowsVersion=0,resetPending=()=>false;let rowsLife=c.lifecycle.fork();
 const tabs=c.element('div','iui-upcoming-flow-tabs'),flowLabel=c.element('p','iui-upcoming-flow-label'),list=c.element('ul','iui-upcoming-list'),empty=c.element('p','iui-upcoming-empty',node.emptyLabel??'No supplied upcoming activity'),toggle=c.element('button','iui-upcoming-expand');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Activity flow');toggle.type='button';toggle.disabled=node.disabled===true;const buttons=new Map<string,HTMLButtonElement>();
 for(const value of['outgoing','incoming']as const){const button=c.element('button','iui-upcoming-flow',value==='outgoing'?node.outgoingLabel??'Outgoing':node.incomingLabel??'Incoming');button.type='button';button.disabled=node.disabled===true;buttons.set(value,button);tabs.append(button);
  c.on(button,'click',event=>input.run(scope=>{if(event.defaultPrevented||scope.during(()=>readerBlocked(root,button,true))||value===flow)return;flow=value;expanded=false;revision++;render();}));
 }
 const showTabs=node.flows!==undefined&&node.showFlowTabs!==false;tabs.hidden=!showTabs;flowLabel.hidden=showTabs;root.append(tabs,flowLabel,list,empty,toggle);
 const data=()=>node.flows?.[flow]??{items:node.activities};
 const amount=(item:UpcomingActivity)=>item.amountLabel===null?'Unknown amount':node.masked&&!item.amountUnknown?node.maskedLabel??'Hidden amount':item.amountLabel;
 const restore=()=>paint(scope=>{for(const[value,button]of buttons)scope.during(()=>button.setAttribute('aria-pressed',String(value===flow)));scope.during(()=>toggle.setAttribute('aria-expanded',String(expanded)));});
 const render=()=>paint(scope=>{
  const source=data(),canExpand=(source.expandedItems?.length??0)>source.items.length,items=expanded&&canExpand?source.expandedItems!:source.items,records=source.top?[source.top,...items]:items;const version=++rowsVersion;rowsLife.dispose();rowsLife=c.lifecycle.fork(()=>version===rowsVersion&&list.parentNode===root);const life=rowsLife,local:RendererContext={...c,lifecycle:life,on:life.listen,cleanup:life.own,bind:fn=>life.own(c.bind(life.guard(fn))),element:(tag,cls,value)=>life.during(()=>c.element(tag,cls,value))};scope.during(()=>list.replaceChildren());
  for(const item of records){const row=local.element('li','iui-upcoming-row'),body=local.element('div','iui-upcoming-row-main');
   if(item.iconSrc){const avatar=local.element('div','iui-upcoming-avatar');const image=renderSearchImage(local,{type:'search-image',searchImage:{content_url:item.iconSrc},alt:'',fit:'contain',width:'100%',height:'100%',hideOnFailure:true},owner,host);avatar.setAttribute('aria-hidden','true');avatar.append(image);row.append(avatar);}
   const interactive=item.detailEnabled??!node.flows;const title=interactive?local.element('button','iui-upcoming-open',item.title):local.element('span','iui-upcoming-title',item.title);if(interactive){const button=title as HTMLButtonElement;button.type='button';button.disabled=node.disabled===true;local.on(button,'click',event=>gate.run(()=>{if(event.defaultPrevented||resetPending()||!local.lifecycle.current()||row.parentNode!==list||readerBlocked(root,button,true))return;const Constructor=c.doc.defaultView?.CustomEvent;if(!Constructor)return;const detail=Object.freeze(node.flows?{id:item.id,flow}:{id:item.id});const request=local.lifecycle.during(()=>new Constructor('iui:upcoming-activity',{detail,bubbles:true,cancelable:true,composed:false}));if(row.parentNode===list&&!readerBlocked(root,button,true))local.lifecycle.during(()=>root.dispatchEvent(request));}));}
   body.append(title,local.element('span','iui-upcoming-date',item.dateLabel??'Unknown date'));if(item.accountLabel)body.append(local.element('span','iui-upcoming-account',item.accountLabel));row.append(body,local.element('span','iui-upcoming-amount',amount(item)));scope.during(()=>list.append(row));
  }
  for(const[value,button]of buttons)scope.during(()=>button.setAttribute('aria-pressed',String(value===flow)));scope.during(()=>{flowLabel.textContent=flow==='incoming'?node.incomingLabel??'Incoming':node.outgoingLabel??'Outgoing';});scope.during(()=>{empty.hidden=records.length!==0;});scope.during(()=>{toggle.hidden=!canExpand;});scope.during(()=>{toggle.textContent=expanded?node.lessLabel??'Show less':node.moreLabel??'Show more';});scope.during(()=>toggle.setAttribute('aria-expanded',String(expanded)));
 });
 c.on(toggle,'click',event=>input.run(scope=>{if(event.defaultPrevented||scope.during(()=>readerBlocked(root,toggle,true))||toggle.hidden)return;expanded=!expanded;revision++;render();}));
 resetPending=readerNativeReset(c,root,showTabs?[...buttons.values()]:[toggle],()=>revision,restore,()=>{input.retire();flow=node.activeFlow??'outgoing';expanded=node.expanded===true;revision++;render();});
 measure=()=>{const width=c.lifecycle.during(()=>owner.getBoundingClientRect().width);c.lifecycle.during(()=>{root.dataset.wide=String(width>=576);});};c.bind(()=>measure());if(c.doc.defaultView)c.on(c.doc.defaultView,'resize',()=>measure());render();return root;
}
