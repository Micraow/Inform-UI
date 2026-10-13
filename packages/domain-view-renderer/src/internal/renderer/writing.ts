import type {WritingBlockNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {WritingLabels} from './writing-labels.js';

let serial=0;
/** One local literal draft. No state bindings, persistence, sending or service calls. */
export function renderWriting(c:RendererContext,n:WritingBlockNode,t:WritingLabels):HTMLElement {
 const e=c.element,id=`iui-writing-internal-${c.prefix}${++serial}`;
 const root=e('section','iui-writing-block');root.dir='auto';
 const label=e('label','iui-writing-label',n.label);label.id=`${id}-label`;label.htmlFor=`${id}-draft`;
 root.setAttribute('aria-labelledby',label.id);
 const draft=e('textarea','iui-writing-draft');draft.id=label.htmlFor;draft.rows=8;draft.dir='auto';
 draft.readOnly=n.editable===false;draft.maxLength=24000;
 // The native textarea normalizes CRLF/CR to LF. Make that contract explicit,
 // and leave the caller's authored source unchanged.
 const initial=n.value.replace(/\r\n?/g,'\n');draft.defaultValue=initial;draft.value=initial;
 const count=e('span','iui-writing-count'),dirty=e('span','iui-writing-dirty');
 count.id=`${id}-count`;dirty.id=`${id}-dirty`;
 const meta=e('div','iui-writing-meta');meta.append(count,dirty);
 const note=e('p','iui-writing-note',n.note??'');note.id=`${id}-note`;note.hidden=n.note===undefined;
 const local=e('p','iui-writing-note',t.local);local.id=`${id}-local`;
 const limit=e('p','iui-writing-limit',t.tooLong);limit.id=`${id}-limit`;
 const descriptions=[count.id,dirty.id,local.id,...(n.note===undefined?[]:[note.id])];
 const action=(name:string,text:string)=>{const b=e('button','',text);b.type='button';b.dataset.writingAction=name;return b;};
 const copy=action('copy',t.copy),select=action('select',t.select),revert=action('revert',t.revert);
 const controls=e('div','iui-writing-controls');controls.append(copy,select,revert);
 const status=e('p','iui-writing-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 root.append(label,draft,meta,note,local,limit,controls,status);
 let disposed=false,busy=false,generation=0,currentDraft=initial;
 const live=()=>!disposed&&root.isConnected;
 c.cleanup(()=>{disposed=true;generation++;});
 function sync() {
  const current=draft.value,length=Array.from(current).length,invalid=length>12000;
  currentDraft=current;
  // External native form.reset() must preserve this independent local draft.
  // No external form is reset, submitted, or registered with the renderer.
  if(draft.defaultValue!==current)draft.defaultValue=current;
  count.textContent=t.count(length);dirty.textContent=current===initial?t.unchanged:t.changed;
  root.dataset.dirty=String(current!==initial);limit.hidden=!invalid;
  draft.setAttribute('aria-describedby',[...descriptions,...(invalid?[limit.id]:[])].join(' '));
  draft.setAttribute('aria-invalid',String(invalid));copy.setAttribute('aria-disabled',String(busy||invalid));
  return !invalid;
 }
 sync();
 c.on(draft,'input',()=>{if(!live())return;if(draft.matches(':disabled')||draft.readOnly){draft.value=currentDraft;return;}sync();if(!busy)status.textContent='';});
 c.on(select,'click',()=>{
  if(!live()||select.matches(':disabled'))return;
  if(!busy)status.textContent=t.selected;
  draft.focus();
  // A host focus listener may synchronously update or dispose this mount.
  if(live())draft.setSelectionRange(0,draft.value.length);
 });
 c.on(revert,'click',()=>{
  if(!live()||revert.matches(':disabled'))return;
  draft.value=initial;sync();if(!busy)status.textContent=t.reverted;
  draft.focus();if(live())draft.setSelectionRange(0,draft.value.length);
 });
 c.on(copy,'click',event=>{
  // Same boundary as code: only an actual trusted click can request a write.
  // Programmatic click/dispatchEvent never access Clipboard or claim success.
  if(!event.isTrusted||!live()||busy||copy.matches(':disabled'))return;
  if(!sync()){status.textContent=t.tooLong;return;}
  const snapshot=draft.value,current=++generation;busy=true;
  copy.setAttribute('aria-disabled','true');status.textContent=t.copying;
  const active=()=>live()&&generation===current;
  const settle=(success:boolean)=>{
   if(!active())return;
   busy=false;sync();
   status.textContent=success?(draft.value===snapshot?t.copied:t.earlier):t.failed;
  };
  try {
   const win=draft.ownerDocument.defaultView;
   if(win?.isSecureContext!==true){settle(false);return;}
   if(!active())return;
   // Clipboard and method getters may reenter host update/dispose. Check after
   // each before issuing a write; an already-issued write cannot be revoked.
   const clipboard=win.navigator.clipboard;if(!active())return;
   const write=clipboard?.writeText;if(!active())return;
   if(typeof write!=='function'){settle(false);return;}
   Promise.resolve(write.call(clipboard,snapshot)).then(()=>settle(true),()=>settle(false));
  } catch {settle(false);}
 });
 return root;
}
