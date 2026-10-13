import {officialSymbol} from './official-symbol.js';
import type {AutomationNode,AutomationItem} from '../core/automation.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {renderOfficialIcon} from './official-icons.js';
/** Supplied content and cancelable local intents only. This renderer has no scheduler. */
export function renderAutomation(parent:RendererContext,node:AutomationNode):HTMLElement {
 const root=parent.element('section','iui-automation iui-'+node.type),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,gate=intentGate(life);
 write(()=>root.setAttribute('aria-label',node.label));write(()=>{root.dir='auto';root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){write(()=>root.setAttribute('aria-busy','true'));const loading=c.element('div','iui-automation-loading');write(()=>loading.setAttribute('role','status'));write(()=>loading.setAttribute('aria-label',node.label));write(()=>root.append(loading));return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(c.element('p','iui-automation-fallback',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 let resetPending=()=>false;
 const allowed=(button:HTMLButtonElement)=>write(()=>!node.disabled&&!resetPending()&&!readerBlocked(root,button,life.current()));
 const emit=(button:HTMLButtonElement,event:Event,name:string,detail:Record<string,unknown>)=>{
  if(write(()=>event.defaultPrevented)||!allowed(button))return false;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return false;
  const intent=write(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));
  if(!allowed(button))return false;
  const accepted=write(()=>root.dispatchEvent(intent));return accepted&&allowed(button);
 };
 const button=(label:string,cls:string)=>{const b=c.element('button',cls,label);write(()=>{b.type='button';b.disabled=node.disabled===true;});return b;};
 const open=(b:HTMLButtonElement,id:string|null,url:string,disabled=false)=>c.on(b,'click',event=>gate.run(()=>{if(!disabled)emit(b,event,'inform:view-automation-open',{id:node.id??null,automationId:id,url});}));
 const resource=(item:AutomationItem,list:boolean)=>{
  const b=button('',list?'iui-automation-list-item':'iui-automation-card');write(()=>{b.disabled=node.disabled===true||item.disabled===true;b.setAttribute('aria-label',item.title+', '+item.scheduleLabel);});
  if(!list){const icon=(item.emoji?c.element('span','iui-automation-icon',item.emoji):officialSymbol(c,'iui-automation-icon','Clock'));write(()=>icon.setAttribute('aria-hidden','true'));write(()=>b.append(icon));}
  const copy=c.element('span','iui-automation-copy'),title=c.element('span','iui-automation-title',item.title),schedule=c.element('span','iui-automation-schedule',item.scheduleLabel),arrow=officialSymbol(c,'iui-automation-arrow',list?'ChevronRight':'Pencil');write(()=>arrow.setAttribute('aria-hidden','true'));write(()=>copy.append(title,schedule));write(()=>b.append(copy,arrow));open(b,item.id,item.url,item.disabled===true);return b;
 };
 if(node.type==='display-automation'){if(node.item)write(()=>root.append(resource(node.item!,false)));return root;}
 if(node.type==='list-automations'){
  write(()=>root.append(c.element('h3','iui-automation-header',node.headerLabel)));
  if(!node.items?.length)write(()=>root.append(c.element('p','iui-automation-empty',node.emptyLabel)));
  const list=c.element('ul','iui-automation-list');for(const item of(node.items??[]).slice(0,5)){const li=c.element('li');write(()=>li.append(resource(item,true)));write(()=>list.append(li));}write(()=>root.append(list));
  if(node.viewAll){const b=button(node.viewAll.label,'iui-automation-view-all');open(b,null,node.viewAll.url);write(()=>root.append(b));}return root;
 }
 const library=node.layout==='library',learning=node.planType==='language_learning';write(()=>root.classList.toggle('iui-automation-library',library));
 let collapsed=node.collapsed??false,expanded=node.completedExpanded??false,revision=0;
 const initial={collapsed,expanded},controls:HTMLButtonElement[]=[],paint=suppliedReaderPainter(c);
 const heading=c.element('div','iui-automation-plan-header'),copy=c.element('div'),goal=c.element('p','iui-automation-goal',node.goalLabel),title=c.element('h3','iui-automation-plan-title',node.title);write(()=>copy.append(goal,title));write(()=>heading.append(copy));write(()=>root.append(heading));
 const body=c.element('div','iui-automation-plan-body');write(()=>{body.id=c.allocateInternalId?.('automation-plan')??c.prefix+'-automation-plan';});write(()=>root.append(body));
 let toggle:HTMLButtonElement|undefined,completed:HTMLButtonElement|undefined;
 const completedRows:HTMLElement[]=[];
 const refresh=()=>paint(scope=>{
  scope.during(()=>{body.hidden=collapsed;});
  if(toggle){scope.during(()=>toggle!.setAttribute('aria-expanded',String(!collapsed)));scope.during(()=>{toggle!.textContent=collapsed?node.showPlanLabel!:node.hidePlanLabel!;});}
  if(completed)scope.during(()=>completed!.setAttribute('aria-expanded',String(expanded)));
  for(const row of completedRows)scope.during(()=>{row.hidden=!expanded;});
 });
 const change=(b:HTMLButtonElement,kind:'plan'|'completed',event:Event)=>gate.run(()=>{
  const next=kind==='plan'?collapsed:!expanded;
  if(!emit(b,event,'inform:view-automation-toggle',{id:node.id??null,section:kind,expanded:next}))return;
  revision++;if(kind==='plan')collapsed=!next;else expanded=next;refresh();
 });
 if(!library&&!learning&&node.showPlanLabel&&node.hidePlanLabel){toggle=button('','iui-automation-plan-toggle');const b=toggle;controls.push(b);write(()=>b.setAttribute('aria-controls',body.id));c.on(b,'click',event=>change(b,'plan',event));write(()=>heading.append(b));}
 if(node.steps===null){write(()=>body.append(c.element('p','iui-automation-error',node.summaryErrorLabel)));}
 else {
  const steps=node.steps??[],done=steps.filter(s=>s.status==='completed'),grouped=!library&&done.length>=2;
  const list=c.element('ol','iui-automation-steps');write(()=>body.append(list));
  if(steps.length===0)write(()=>body.append(c.element('p','iui-automation-empty',node.emptyLabel??'No steps')));
  if(grouped){const li=c.element('li','iui-automation-completed-group');completed=button(node.completedCountLabel??`${done.length} completed`,'iui-automation-completed');controls.push(completed);const b=completed;write(()=>b.setAttribute('aria-label',node.showCompletedLabel??'Show completed steps'));c.on(b,'click',event=>change(b,'completed',event));write(()=>li.append(b));write(()=>list.append(li));}
  const start=Math.max(0,steps.findIndex(s=>s.status==='in_progress'));
  const upcoming=steps.slice(start).filter(s=>s.status!=='completed').slice(0,node.mobile?3:5);
  const visible=library?steps:[...done,...upcoming];
  for(const [index,step] of visible.entries()){
   const last=index===visible.length-1,statusLabel=node.statusLabels?.[step.status]??step.status;
   const row=c.element('li','iui-automation-step'),marker=c.element('span','iui-automation-marker'),glyph=c.element('span','iui-automation-marker-glyph'),copy=c.element('span','iui-automation-step-copy'),label=c.element('span','iui-automation-step-title',step.title),status=c.element('span','iui-automation-step-status',statusLabel);
   write(()=>{row.dataset.status=step.status;row.dataset.last=String(last);marker.setAttribute('role','img');marker.setAttribute('aria-label',statusLabel);status.setAttribute('aria-hidden','true');marker.append(glyph);});
   if(learning&&step.status!=='completed')write(()=>{glyph.textContent=String(steps.indexOf(step)+1);});
   else if(step.status==='in_progress'){const spinner=c.element('span','iui-automation-status-spinner');write(()=>{spinner.setAttribute('aria-hidden','true');glyph.append(spinner);});}
   else{const icon=write(()=>renderOfficialIcon(c,step.status==='completed'?'CheckCircleFilled':'EmptyCircle',{size:20}));write(()=>glyph.append(icon));}
   if(!library&&!last){const connector=c.element('span','iui-automation-marker-connector');write(()=>{connector.setAttribute('aria-hidden','true');marker.append(connector);});}
   write(()=>{copy.append(label,status);row.append(marker,copy);list.append(row);});if(grouped&&step.status==='completed')completedRows.push(row);
  }
 }
 // The header toggle remains visible while the completed control is inside
 // the collapsed body. Hidden child controls must not veto this native reset.
 // Without a whole-plan toggle, the completed disclosure is the visible anchor.
 resetPending=readerNativeReset(c,root,toggle?[toggle]:controls,()=>revision,refresh,()=>{revision++;collapsed=initial.collapsed;expanded=initial.expanded;refresh();});
 refresh();return root;
}
