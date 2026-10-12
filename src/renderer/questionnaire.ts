import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked, readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {internalId} from './internal-id.js';
import {createQuestionnaireDraft,evaluateQuestionnaire,type QuestionnaireNode,type QuestionnaireSnapshot} from '../core/questionnaire.js';
export interface QuestionnaireActionContext {readonly snapshot:QuestionnaireSnapshot;readonly signal:AbortSignal}
export type QuestionnaireAction=(context:QuestionnaireActionContext)=>void|Promise<void>;
export function renderQuestionnaire(parent:RendererContext,node:QuestionnaireNode):HTMLElement {
 const root=parent.element('section','iui-questionnaire'),c=suppliedReaderContext(parent,root),life=c.lifecycle,w=life.during,e=c.element,gate=intentGate(life);
 const fields=e('fieldset','iui-questionnaire-fields'),result=e('div','iui-questionnaire-result'),status=e('p','iui-questionnaire-status'),submit=e('button','',node.submitLabel??'Submit answers'),reset=e('button','',node.resetLabel??'Reset answers');
 const painter=suppliedReaderPainter(c);
 const controls=new Map<string,HTMLInputElement|HTMLSelectElement>(),rows=new Map<string,HTMLElement>(),errors=new Map<string,HTMLElement>();
 let draft=createQuestionnaireDraft(node),evaluation=evaluateQuestionnaire(node,draft),revision=0,ticket=0,pending=()=>false,abort:AbortController|undefined,busy=false,receipt='';
 const blocked=(control:HTMLElement)=>node.disabled===true||w(()=>readerBlocked(root,control,life.current()));
 function retire(){ticket++;const old=abort;abort=undefined;busy=false;old?.abort();}
 function paint(){
  evaluation=evaluateQuestionnaire(node,draft);draft={...evaluation.draft};
  painter(scope=>{const write=scope.during,view=evaluation.snapshot,localDraft=draft;
   for(const field of node.fields){const control=controls.get(field.id)!,row=rows.get(field.id)!,valid=view.validity[field.id],hidden=!valid.visible;
    const focus=write(()=>(root.getRootNode() as Document|ShadowRoot).activeElement),move=write(()=>hidden&&row.contains(focus));
    write(()=>{row.hidden=hidden;});write(()=>{control.disabled=node.disabled===true||hidden;});
    const raw=localDraft[field.id],value=raw===null||raw===undefined?'':String(raw);if(write(()=>control.value)!==value)write(()=>{control.value=value;});
    write(()=>control.setAttribute('aria-invalid',String(valid.status==='invalid')));write(()=>{errors.get(field.id)!.textContent=valid.status==='invalid'?valid.message??'Invalid answer':'';});
    if(move&&!write(()=>blocked(reset)))write(()=>reset.focus());
   }
   write(()=>result.replaceChildren());write(()=>{result.dataset.status=view.status;});
   if(view.status==='ready'){for(const[key,value]of Object.entries(view.computed)){const row=e('p'),name=e('span','',key+': '),out=e('output','',value===null?'Unknown':String(value));write(()=>{out.dataset.result=key;});write(()=>row.append(name,out));write(()=>result.append(row));}if(!Object.keys(view.computed).length)write(()=>result.append(e('p','','Answers are ready.')));}
   else write(()=>result.append(e('p','',view.status==='invalid'?'Resolve invalid answers before viewing results.':'Complete the required answers before viewing results.')));
   write(()=>{root.dataset.status=view.status;});write(()=>root.setAttribute('aria-busy',String(busy)));write(()=>{status.textContent=busy?'Submitting…':receipt;});write(()=>{submit.disabled=node.disabled===true||busy;});write(()=>{reset.disabled=node.disabled===true;});
  });
 }
 function event(intent:'submit'|'reset'){
  const C=w(()=>c.doc.defaultView?.CustomEvent);if(!C)return false;
  const detail=Object.freeze({intent,snapshot:evaluation.snapshot});return w(()=>root.dispatchEvent(new C('iui:questionnaire',{bubbles:true,cancelable:true,composed:false,detail})));
 }
 function clear(){const before=++revision;retire();if(!life.current()||revision!==before)return;draft=createQuestionnaireDraft({...node,initialAnswers:node.defaults??node.initialAnswers});receipt='';paint();}
 function doReset(){gate.run(()=>{if(blocked(reset)||pending())return;const before=revision;if(!event('reset')||!life.current()||revision!==before||blocked(reset))return;clear();});}
 function doSubmit(){gate.run(()=>{
  if(blocked(submit)||pending()||busy)return;paint();
  if(evaluation.snapshot.status!=='ready'){w(()=>{const bad=node.fields.find(f=>{const v=evaluation.snapshot.validity[f.id];return v.visible&&(v.status==='invalid'||v.status==='pending'||(f.required===true&&v.status==='unknown'));});if(bad)controls.get(bad.id)?.focus();});return;}
  const before=revision,snapshot=evaluation.snapshot;
  if(!event('submit')||!life.current()||revision!==before||blocked(submit))return;
  let action:QuestionnaireAction|undefined;
  try{action=node.action&&Object.hasOwn(c.questionnaireActions??{},node.action)?c.questionnaireActions![node.action]:undefined;}catch{if(life.current()){receipt='The registered action could not be read.';paint();}return;}
  if(!life.current()||revision!==before||blocked(submit))return;
  if(node.action&&typeof action!=='function'){receipt='No questionnaire action is registered.';paint();return;}
  if(!action){receipt='Answers accepted locally.';paint();return;}
  const current=++ticket,controller=new AbortController();abort=controller;busy=true;receipt='';paint();if(!life.current()||revision!==before||ticket!==current)return;
  let work:void|Promise<void>;try{work=action(Object.freeze({snapshot,signal:controller.signal}));}catch(error){work=Promise.reject(error);}
  Promise.resolve(work).then(()=>{if(!life.current()||current!==ticket||revision!==before)return;abort=undefined;busy=false;receipt='Answers accepted.';paint();},()=>{if(!life.current()||current!==ticket||revision!==before)return;abort=undefined;busy=false;receipt='The questionnaire action failed.';paint();});
 });}
 w(()=>{root.setAttribute('aria-label',node.title);root.append(e('h3','',node.title));if(node.description)root.append(e('p','',node.description));fields.disabled=node.disabled===true;fields.append(e('legend','','Questions'));
  for(const field of node.fields){const row=e('div','iui-questionnaire-field'),label=e('label','',field.label),control=field.type==='choice'||field.type==='boolean'?e('select'):e('input'),error=e('p','iui-questionnaire-error');
   control.id=internalId(c,'questionnaire-field');control.dataset.field=field.id;label.htmlFor=control.id;error.id=internalId(c,'questionnaire-error');control.setAttribute('aria-describedby',error.id);control.setAttribute('aria-required',String(field.required===true));
   if(control.tagName==='SELECT'){const unknown=e('option','','Unknown');unknown.value='';control.append(unknown);const choices=field.type==='boolean'?[{value:'true',label:'Yes'},{value:'false',label:'No'}]:field.options??[];for(const option of choices){const item=e('option','',option.label);item.value=String(option.value);control.append(item);}}
   else{const input=control as HTMLInputElement;input.type='text';input.maxLength=field.type==='number'?128:(field.maxLength??12000)*2;if(field.type==='number')input.inputMode='decimal';if(field.placeholder)input.placeholder=field.placeholder;}
   rows.set(field.id,row);controls.set(field.id,control);errors.set(field.id,error);row.append(label,control);if(field.description)row.append(e('p','',field.description));row.append(error);fields.append(row);
  }
  result.setAttribute('role','status');result.setAttribute('aria-live','polite');status.setAttribute('role','status');submit.type=reset.type='button';submit.dataset.action='submit';reset.dataset.action='reset';root.append(fields,result,submit,reset,status);
  if(node.sources?.length){const list=e('ul','iui-questionnaire-sources');for(const source of node.sources){const item=e('li','',source.title+(source.version?' ('+source.version+')':''));if(source.url){const a=e('a','','Source');a.href=source.url;a.rel='noopener noreferrer';item.append(' ',a);}list.append(item);}root.append(list);}
 });
 for(const field of node.fields){const control=controls.get(field.id)!;c.on(control,control.tagName==='SELECT'?'change':'input',()=>{
  // A valid raw edit is admitted during request callbacks and pending native reset.
  if(blocked(control))return;const before=++revision,raw=w(()=>control.value);retire();if(!life.current()||revision!==before)return;draft={...draft,[field.id]:raw===''?null:field.type==='boolean'&&['true','false'].includes(raw)?raw==='true':raw};receipt='';paint();
 });c.on(control,'keydown',(event:Event)=>{const k=event as KeyboardEvent;if(k.key==='Enter'&&!k.isComposing&&!k.ctrlKey&&!k.metaKey&&!k.altKey&&!k.shiftKey&&k.keyCode!==229){k.preventDefault();doSubmit();}});}
 c.on(submit,'click',doSubmit);c.on(reset,'click',doReset);
 pending=readerNativeReset(c,root,[reset],()=>revision,paint,clear,'after-default');
 c.cleanup(()=>{revision++;retire();});paint();return root;
}
