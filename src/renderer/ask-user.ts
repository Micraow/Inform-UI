import type {AskUserNode,LocalFileMetadata} from '../core/ask-user.js';
import {validLocalFile} from '../core/ask-user.js';
import type {RendererContext} from './context.js';
import {suppliedReaderContext,suppliedReaderInput,suppliedReaderPainter} from './supplied-reader-lifecycle.js';
import {readerBlocked,readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
/** CTA intents, optionally followed by a local-only review. Never reads file bodies. */
export function renderAskUser(parent:RendererContext,node:AskUserNode):HTMLElement {
 const root=parent.element('section','iui-ask-user iui-'+node.type),c=suppliedReaderContext(parent,root),life=c.lifecycle,write=life.during,gate=intentGate(life),input=suppliedReaderInput(c),paint=suppliedReaderPainter(c);
 write(()=>{root.dir='auto';root.setAttribute('aria-label',node.label);root.dataset.phase=node.status??'resolved';});
 if(node.status==='pending'){const loading=c.element('div','iui-ask-user-loading');write(()=>{root.setAttribute('aria-busy','true');loading.setAttribute('role','status');loading.setAttribute('aria-label',node.label);root.append(loading);});return root;}
 if(node.status==='failed'){if(node.fallback)write(()=>root.append(c.element('p','',node.fallback)));else write(()=>{root.hidden=true;});return root;}
 if(node.showCTA===false){write(()=>{root.hidden=true;});return root;}
 const details=node.type==='ask-user-details',enabled=details?node.enabled===true:node.enabled!==false,off=node.disabled===true||!enabled;
 const defaultFileLabel=!details?(node.kind==='photo'?node.photoLabel??'Choose photos':node.kind==='video'?node.videoLabel??'Choose videos':node.kind==='media'?node.mediaLabel??'Choose media':node.fileLabel??'Choose files'):'';
 const button=(label:string,cls:string)=>{const b=c.element('button',cls,label);write(()=>{b.type='button';b.disabled=off;});return b;};
 if(details&&node.invitation)write(()=>root.append(c.element('p','iui-ask-user-invitation',node.invitation)));
 const trigger=button(node.buttonLabel??defaultFileLabel,'iui-ask-user-trigger');write(()=>root.append(trigger));
 let revision=0,expanded=false,notice='',resetPending=()=>false;
 const allowed=(control:HTMLElement)=>write(()=>!off&&!resetPending()&&!readerBlocked(root,control,life.current()));
 const send=(control:HTMLElement,event:Event,name:string,detail:Record<string,unknown>,ticket:number)=>{
  if(write(()=>event.defaultPrevented)||!allowed(control)||ticket!==revision)return false;
  const Constructor=write(()=>c.doc.defaultView?.CustomEvent);if(!Constructor)return false;
  const emitted=write(()=>new Constructor(name,{detail:Object.freeze(detail),bubbles:true,cancelable:true,composed:false}));
  if(!allowed(control)||ticket!==revision)return false;
  const accepted=write(()=>root.dispatchEvent(emitted));return accepted&&allowed(control)&&ticket===revision;
 };
 let refresh=()=>{},review:HTMLElement|undefined;
 const requestDetail=()=>details?{id:node.id??null,questions:Object.freeze((node.questions??[]).map(q=>Object.freeze({...q,options:q.options?Object.freeze(q.options.map(option=>Object.freeze({...option}))):undefined}))),submitLabel:node.submitLabel!}:{id:node.id??null,kind:node.kind!};
 c.on(trigger,'click',event=>gate.run(()=>{const before=revision;if(!send(trigger,event,details?'iui:ask-user-details':'iui:ask-user-files',requestDetail(),before))return;if(node.localReview){revision++;expanded=true;notice='';refresh();}}));
 if(!node.localReview)return root;
 review=c.element('div','iui-ask-user-review');const reviewId=write(()=>c.allocateInternalId?.('ask-user-review')??c.prefix+'-ask-user-review');write(()=>{review!.id=reviewId;review!.setAttribute('role','group');review!.setAttribute('aria-label',node.reviewLabel??'Local review');trigger.setAttribute('aria-controls',reviewId);root.append(review!);});
 const fields=new Map<string,HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(),values=new Map<string,string>(),initial=new Map<string,string>();let files:readonly LocalFileMetadata[]=[],fileInput:HTMLInputElement|undefined;
 const content=c.element('div','iui-ask-user-fields'),status=c.element('p','iui-ask-user-status'),summary=c.element('ul','iui-ask-user-file-list'),emptyFiles=c.element('p','iui-ask-user-empty',node.emptyLabel??'No files selected');write(()=>{status.setAttribute('role','status');status.setAttribute('aria-live','polite');review!.append(content);});
 const submit=button(node.submitLabel??'Review selected files','iui-ask-user-submit'),cancel=button(node.cancelLabel??'Cancel','iui-ask-user-cancel');const actions=c.element('div','iui-ask-user-actions');write(()=>actions.append(submit,cancel));write(()=>review!.append(summary,emptyFiles,actions,status));
 const restore=()=>paint(scope=>{scope.during(()=>{review!.hidden=!expanded;});scope.during(()=>trigger.setAttribute('aria-expanded',String(expanded)));scope.during(()=>{status.textContent=notice;});for(const[id,field]of fields)scope.during(()=>{field.value=values.get(id)??'';});if(fileInput&&files.length===0)scope.during(()=>{fileInput!.value='';});scope.during(()=>{emptyFiles.hidden=details||files.length>0;});scope.during(()=>summary.replaceChildren());for(const file of files){const row=c.element('li','',file.name+' · '+file.size+' bytes');scope.during(()=>summary.append(row));}});
 refresh=restore;
 if(details){for(const q of node.questions??[]){const group=c.element('div','iui-ask-user-field'),label=c.element('label','',q.label),field=q.kind==='textarea'?c.element('textarea'):q.kind==='select'?c.element('select'):c.element('input');const id=write(()=>c.allocateInternalId?.('ask-user-field')??c.prefix+'-'+q.id);write(()=>{field.id=id;label.htmlFor=id;field.disabled=off;field.required=q.required===true;});if(field.tagName==='INPUT')write(()=>{(field as HTMLInputElement).type='text';});if(q.kind==='select'){const blank=c.element('option','',q.placeholder??'Select an option');write(()=>{blank.value='';(field as HTMLSelectElement).append(blank);});for(const option of q.options??[]){const el=c.element('option','',option.label);write(()=>{el.value=option.value;(field as HTMLSelectElement).append(el);});}}else write(()=>{(field as HTMLInputElement).maxLength=q.maxLength??4000;(field as HTMLInputElement).placeholder=q.placeholder??'';});fields.set(q.id,field);initial.set(q.id,q.initialValue??'');values.set(q.id,q.initialValue??'');write(()=>group.append(label,field));write(()=>content.append(group));
   c.on(field,q.kind==='select'?'change':'input',event=>input.run(scope=>{const ticket=++revision;if(scope.during(()=>event.defaultPrevented)||!scope.during(()=>!off&&!readerBlocked(root,field,true)))return;const value=scope.during(()=>field.value);if(ticket!==revision)return;values.set(q.id,value);notice='';restore();}));
   if(q.kind!=='textarea')c.on(field,'keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'&&!e.defaultPrevented)write(()=>e.preventDefault());});
  }if(!node.questions?.length)write(()=>content.append(c.element('p','iui-ask-user-empty',node.emptyLabel??'No questions supplied')));
 }else{fileInput=c.element('input','iui-ask-user-file-input');const picker=fileInput;write(()=>{picker.type='file';picker.disabled=off;picker.multiple=node.multiple===true;picker.setAttribute('aria-label',node.reviewLabel??'Choose files for local review');picker.accept=node.kind==='photo'?'image/*':node.kind==='video'?'video/*':node.kind==='media'?'image/*,video/*':'';content.append(picker);});
  c.on(picker,'change',event=>input.run(scope=>{const ticket=++revision;if(scope.during(()=>event.defaultPrevented)||!scope.during(()=>!off&&!readerBlocked(root,picker,true)))return;const selection=scope.during(()=>picker.files),count=scope.during(()=>selection?.length??0);const next:LocalFileMetadata[]=[];for(let i=0;i<Math.min(count,21);i++){const file=scope.during(()=>selection![i]);const name=scope.during(()=>file.name),size=scope.during(()=>file.size),type=scope.during(()=>file.type),lastModified=scope.during(()=>file.lastModified);next.push(Object.freeze({name,size,type,lastModified}));}if(ticket!==revision)return;files=Object.freeze(next);notice='';restore();}));
 }
 const controls=[trigger,submit,cancel,...fields.values(),...(fileInput?[fileInput]:[])];
 const clear=()=>{input.retire();revision++;expanded=false;notice='';files=[];values.clear();for(const[id,value]of initial)values.set(id,value);restore();};
 c.on(cancel,'click',event=>gate.run(()=>{if(send(cancel,event,'iui:ask-user-cancel',{id:node.id??null,kind:details?'details':node.kind},revision))clear();}));
 c.on(submit,'click',event=>gate.run(()=>{
  const before=revision;if(write(()=>event.defaultPrevented)||!allowed(submit))return;
  let payload:Record<string,unknown>,valid=true;
  if(details){const answers:{id:string;value:string}[]=[];for(const q of node.questions??[]){const field=fields.get(q.id)!;const value=write(()=>field.value);if(before!==revision)return;if(!allowed(field))return;if(q.required&&!value.trim()||value.length>(q.maxLength??4000)||q.kind==='select'&&value!==''&&!q.options?.some(option=>option.value===value))valid=false;answers.push(Object.freeze({id:q.id,value}));}valid=valid&&answers.length>0;payload={id:node.id??null,answers:Object.freeze(answers)};
  }else{valid=files.length>0&&files.length<=(node.multiple?node.maxFiles??5:1)&&files.every(file=>validLocalFile(file,node.kind!,node.maxFileBytes??10000000));payload={id:node.id??null,kind:node.kind,files:Object.freeze(files.map(file=>Object.freeze({...file})))};}
  if(!valid){notice=node.invalidLabel??'Check the local review entries.';restore();return;}
  if(send(submit,event,details?'iui:user-details-submit':'iui:user-files-submit',payload,before)){revision++;notice=node.acceptedLabel??'Local review accepted. Nothing was sent.';restore();}
 }));
 resetPending=readerNativeReset(c,root,controls,()=>revision,restore,clear);restore();return root;
}
