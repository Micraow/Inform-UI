import type {OnboardingSelectionNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {OnboardingLabels} from './onboarding-labels.js';
export interface OnboardingChoiceDetail { readonly componentId:string|null; readonly selectedIds:readonly string[] }
let serial=0;
export function renderOnboarding(c:RendererContext,n:OnboardingSelectionNode,t:OnboardingLabels):HTMLElement {
 const e=c.element,root=e('fieldset','iui-onboarding'),id=`iui-onboarding-internal-${c.prefix}${++serial}`;
 root.dir='auto';root.disabled=n.disabled??false;root.append(e('legend','iui-onboarding-title',n.label));
 if(n.description!==undefined)root.append(e('p','iui-onboarding-description',n.description));
 const note=e('p','iui-onboarding-note',t.note);note.id=id+'-note';root.append(note);
 const multiple=n.mode==='multiple',minimum=n.minimum??1,maximum=n.maximum??(multiple?n.options.length:1);
 const guidance=e('p','iui-onboarding-guidance',t.range(minimum,maximum));guidance.id=id+'-range';root.append(guidance);root.setAttribute('aria-describedby',`${note.id} ${guidance.id}`);
 const list=e('div','iui-onboarding-options'),count=e('p','iui-onboarding-count'),status=e('p','iui-onboarding-status');status.id=id+'-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 const initial=new Set(n.initial??[]);let selected=new Set(initial),alive=true,dispatching=false;
 const blocked=(control:HTMLElement)=>!alive||!root.isConnected||!control.isConnected||!root.contains(control)||control.matches(':disabled')||!!control.closest('[hidden],[inert]');
 const entries=n.options.map((option,index)=>{
  const label=e('label','iui-onboarding-option'),input=e('input'),text=e('span','iui-onboarding-option-body'),title=e('span','iui-onboarding-option-title',option.label);
  input.type=multiple?'checkbox':'radio';input.id=`${id}-${index}`;input.name=id;input.setAttribute('form',id+'-local-only');label.htmlFor=input.id;title.id=input.id+'-title';input.setAttribute('aria-labelledby',title.id);input.dataset.optionId=option.id;input.checked=input.defaultChecked=selected.has(option.id);text.append(title);
  if(option.description!==undefined){const description=e('span','iui-onboarding-option-description',option.description);description.id=input.id+'-description';input.setAttribute('aria-describedby',description.id);text.append(description);}
  label.append(input,text);list.append(label);
  const change=()=>{if(!alive)return;if(dispatching||blocked(input)){paint();return;}const next=new Set(entries.filter(x=>x.input.checked).map(x=>x.option.id));if(next.size>maximum){paint();setStatus('invalid',t.maximum(maximum));return;}if(next.size===selected.size&&[...next].every(x=>selected.has(x)))return;selected=next;paint();setStatus('idle','');};
  c.on(input,'input',change);c.on(input,'change',change);return{option,input,label};
 });
 const actions=e('div','iui-onboarding-actions'),proceed=e('button','iui-onboarding-continue',n.continueLabel??t.continue),reset=e('button','iui-onboarding-reset',t.reset);proceed.type=reset.type='button';proceed.setAttribute('aria-describedby',`${guidance.id} ${status.id}`);actions.append(proceed,reset);root.append(list,count,actions,status);
 function setStatus(kind:string,text:string){if(!alive)return;root.dataset.status=kind;root.setAttribute('aria-invalid',String(kind==='invalid'));status.textContent=text;}
 function paint(){if(!alive)return;for(const entry of entries){const checked=selected.has(entry.option.id);entry.input.checked=entry.input.defaultChecked=checked;entry.label.dataset.selected=String(checked);}count.textContent=t.selected(selected.size);}
 c.on(reset,'click',()=>{if(dispatching||blocked(reset))return;selected=new Set(initial);paint();setStatus('idle','');});
 c.on(proceed,'click',()=>{
  if(dispatching||blocked(proceed))return;
  if(selected.size<minimum){setStatus('invalid',t.minimum(minimum));entries[0].input.focus();return;}
  dispatching=true;
  try{
   const selectedIds=Object.freeze(n.options.filter(option=>selected.has(option.id)).map(option=>option.id));const detail:OnboardingChoiceDetail=Object.freeze({componentId:n.id??null,selectedIds});
   const Constructor=c.doc.defaultView?.CustomEvent;let event:CustomEvent<OnboardingChoiceDetail>;
   if(typeof Constructor==='function')event=new Constructor('iui:onboarding-choice',{detail,bubbles:true,cancelable:true,composed:false});else{event=c.doc.createEvent('CustomEvent');event.initCustomEvent('iui:onboarding-choice',true,true,detail);}
   if(blocked(proceed))return;const accepted=root.dispatchEvent(event);if(blocked(proceed))return;setStatus(accepted?'ready':'not-accepted',accepted?t.ready:t.rejected);
  }catch{if(alive&&root.isConnected)setStatus('error',t.error);}finally{dispatching=false;}
 });
 c.cleanup(()=>{alive=false;});paint();setStatus('idle','');return root;
}
