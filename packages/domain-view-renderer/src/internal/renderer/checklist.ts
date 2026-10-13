import type {RendererContext} from './context.js';
import type {ChecklistNode} from '../schema/document.js';
import type {ChecklistLabels} from './checklist-labels.js';
let serial=0;
type Filter='all'|'open'|'done';
/** Controlled native checkbox collection, composed through the existing Forms registry. */
export function renderChecklist(c:RendererContext,n:ChecklistNode,t:ChecklistLabels):HTMLElement{
 const e=c.element,root=e('fieldset','iui-checklist'),base=`iui-checklist-internal-${c.prefix}${++serial}`;root.append(e('legend','iui-checklist-label',n.label));
 // Register ancestor disabled before child field refreshers, as Forms groups do.
 c.bind(()=>{root.disabled=n.disabled!==undefined&&c.value(n.disabled)===true;});
 const controls=e('div','iui-checklist-controls'),count=e('output','iui-checklist-count');count.id=base+'-count';root.setAttribute('aria-describedby',count.id);controls.append(count);
 const filter=e('select'),filterLabel=e('label','',t.filter);filter.id=base+'-filter';filterLabel.htmlFor=filter.id;
 for(const [value,label] of [['all',t.all],['open',t.open],['done',t.done]]){const option=e('option','',label);option.value=value;filter.append(option);}
 if(n.filter!==false){const group=e('div','iui-checklist-filter');group.append(filterLabel,filter);controls.append(group);}
 const check=e('button','',t.checkAll),clear=e('button','',t.clearAll);check.type=clear.type='button';if(n.bulk!==false)controls.append(check,clear);
 root.append(controls);const list=e('ul','iui-checklist-items');root.append(list);
 const entries=n.items.map(item=>{const row=e('li','iui-checklist-item');row.dataset.item=item.id;const field=c.render({type:'input',kind:'checkbox',label:item.label,bind:item.bind,...(item.hint?{hint:item.hint}:{}),...(item.disabled===undefined?{}:{disabled:item.disabled})});row.append(field);list.append(row);const input=row.querySelector<HTMLInputElement>('input')!;return{item,row,input};});
 const empty=e('p','iui-caption'),feedback=e('p','iui-checklist-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');root.append(empty,feedback);
 let selected:Filter='all',disposed=false,observed=n.items.map(item=>c.getState()[item.bind]);
 const paint=()=>{
  if(disposed)return;const state=c.getState(),values=n.items.map(item=>state[item.bind]);
  if(values.some((value,i)=>value!==observed[i]))feedback.textContent='';observed=values;
  count.textContent=t.count(values.filter(value=>value===true).length,entries.length);
  const active=c.doc.activeElement;let hiddenFocus=-1;
  entries.forEach(({row,input},i)=>{const done=values[i]===true,hidden=selected==='open'?done:selected==='done'?!done:false;row.dataset.complete=String(done);if(hidden&&active&&row.contains(active))hiddenFocus=i;row.hidden=hidden;});
  const visible=entries.filter(entry=>!entry.row.hidden);empty.hidden=visible.length>0;empty.textContent=entries.length?t.noMatches:n.emptyText??t.empty;
  const eligible=entries.filter(entry=>!entry.input.matches(':disabled'));check.setAttribute('aria-disabled',String(!eligible.some(entry=>state[entry.item.bind]!==true)));clear.setAttribute('aria-disabled',String(!eligible.some(entry=>state[entry.item.bind]!==false)));
  if(hiddenFocus>=0){const after=entries.slice(hiddenFocus+1).find(entry=>!entry.row.hidden&&!entry.input.matches(':disabled'))??visible.find(entry=>!entry.input.matches(':disabled'));
   if(after)after.input.focus({preventScroll:true});else if(n.filter!==false&&!filter.matches(':disabled'))filter.focus({preventScroll:true});else{count.tabIndex=-1;count.focus({preventScroll:true});}
  }
 };
 const apply=(value:boolean)=>{
  if(disposed||root.matches(':disabled'))return;const state=c.getState(),patch=Object.fromEntries(entries.filter(entry=>!entry.input.matches(':disabled')&&state[entry.item.bind]!==value).map(entry=>[entry.item.bind,value]));if(!Object.keys(patch).length)return;
  try{c.change(patch);feedback.textContent=t.changed(Object.keys(patch).length);}catch{feedback.textContent=t.rejected;}paint();
 };
 c.on(check,'click',()=>apply(true));c.on(clear,'click',()=>apply(false));
 c.on(filter,'change',()=>{if(disposed||filter.matches(':disabled')||!['all','open','done'].includes(filter.value)){filter.value=selected;return;}selected=filter.value as Filter;paint();});
 c.bind(paint);c.cleanup(()=>{disposed=true;});return root;
}
