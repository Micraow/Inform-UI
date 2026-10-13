import type {FoundationContext,FoundationHandle,FoundationNode} from './foundation/types.js';
import {foundationCSS} from './foundation/tokens.js';
import {migratedControlCSS} from './foundation/bridge.js';
export interface HostRuntime {
 commit(source:string):any;preview(source:string):any;getSnapshot():any;
 setBinding(handle:unknown,value:unknown):any;dispatchLocal(handle:unknown):any;
 subscribe(listener:(snapshot:any)=>void):()=>void;dispose():void;
}
export interface HostProfile {components:Readonly<Record<string,{renderer:any}>>;styleText?:string}
export interface MountOptions {source:string;theme?:'light'|'dark';allowImageURL?:(url:string)=>boolean;allowAnimationURL?:(url:string)=>boolean;allowMediaURL?:(url:string)=>boolean;onError?:(issues:readonly any[])=>void}
/** The host alone owns events, revisions and DOM lifecycle; schemas never execute code. */
export function mountProfile(container:HTMLElement,profile:HostProfile,runtime:HostRuntime,options:MountOptions){
 const doc=container.ownerDocument;let disposed=false,current:FoundationHandle|null=null,renderRevision=0,currentAbort:AbortController|null=null;
 const root=doc.createElement('div');root.className='if-root';root.dataset.theme=options.theme??'light';
 const style=doc.createElement('style');style.textContent=(profile.styleText??'')+foundationCSS+migratedControlCSS;const body=doc.createElement('div');root.append(style,body);container.append(root);
 const error=(issues:readonly any[])=>{options.onError?.(issues);return{ok:false,issues};};
 const render=(snapshot:any)=>{
  if(disposed)return;const revision=++renderRevision,active=doc.activeElement as HTMLInputElement|null;
  const restore=active&&body.contains(active)?{binding:active.dataset.ifBinding,key:active.closest<HTMLElement>('[data-if-node]')?.dataset.ifNode,tag:active.tagName,optionValue:active.type==='radio'?active.value:null,selection:typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null}:null;
  let nodes=0;const budget={get remaining(){return 12000-nodes;},consume(units=1){nodes+=units;if(nodes>12000)throw Error('DOM rendering budget exceeded');}};
  const handles:FoundationHandle[]=[],renderAbort=new AbortController();
  const renderNode=(node:FoundationNode,path='root'):FoundationHandle=>{
   budget.consume();const definition=profile.components[node.typeName];if(!definition||definition.renderer.kind!=='dom')throw Error('No DOM adapter: '+node.typeName);
   let child=0;const context:FoundationContext={document:doc,budget,partial:false,bindings:node.bindings,signal:renderAbort.signal,get theme(){return root.dataset.theme as 'light'|'dark';},
    renderChild:value=>renderNode(value,path+'.'+child++),
    writeBinding:(prop,value)=>{if(disposed||revision!==renderRevision)return error([{code:'STALE_VIEW',message:'This view is no longer active'}]);const handle=node.bindings?.[prop];if(!handle)return error([{code:'UNBOUND',message:'This field is not writable'}]);const result=runtime.setBinding(handle,value);if(!result.ok){error(result.issues);return result;}return{ok:true,value:null};},
    dispatchLocal:action=>{if(disposed||revision!==renderRevision)return error([{code:'STALE_VIEW',message:'This view is no longer active'}]);const result=runtime.dispatchLocal(action);if(!result.ok){error(result.issues);return result;}return{ok:true,value:null};},
    allowImageURL:options.allowImageURL,allowAnimationURL:options.allowAnimationURL,allowMediaURL:options.allowMediaURL};
   const handle=definition.renderer.create(node.props,context) as FoundationHandle;handles.push(handle);handle.element.dataset.ifNode=path;
   const binding=node.bindings?.value??node.bindings?.checked;if(binding&&typeof(binding as any).name==='string')for(const control of handle.element.querySelectorAll<HTMLElement>('input,select,textarea'))control.dataset.ifBinding=(binding as any).name;
   return handle;
  };
  let next:FoundationHandle;
  try{next=renderNode(snapshot.tree);}catch(cause){renderAbort.abort();for(const h of handles.reverse())h.dispose();currentAbort?.abort();current?.dispose();current=null;body.replaceChildren();const failure=doc.createElement('p');failure.setAttribute('role','alert');failure.textContent='This answer could not be displayed.';body.append(failure);root.dataset.phase='error';error([{code:'RENDER',message:String(cause)}]);return;}
  const old=current;currentAbort?.abort();currentAbort=renderAbort;current=next;body.replaceChildren(next.element);old?.dispose();root.dataset.phase='ready';root.dataset.revision=String(snapshot.revision);
  if(restore){const controls=[...body.querySelectorAll<HTMLElement>('input,select,textarea,button')];const target=controls.find(el=>restore.binding?el.dataset.ifBinding===restore.binding&&(!restore.optionValue||(el as HTMLInputElement).value===restore.optionValue):el.closest<HTMLElement>('[data-if-node]')?.dataset.ifNode===restore.key&&el.tagName===restore.tag) as HTMLInputElement|undefined;
   if(target){target.focus({preventScroll:true});if(restore.selection&&typeof target.setSelectionRange==='function')try{target.setSelectionRange(restore.selection[0],restore.selection[1]);}catch{}}}
 };
 const unsubscribe=runtime.subscribe(render);
 const commit=(source:string)=>{if(disposed)return error([{code:'DISPOSED',message:'View disposed'}]);const result=runtime.commit(source);if(!result.ok)error(result.issues);return result;};
 const preview=(source:string)=>{
  if(disposed)return error([{code:'DISPOSED',message:'View disposed'}]);const result=runtime.preview(source);renderRevision++;currentAbort?.abort();current?.dispose();current=null;body.replaceChildren();root.dataset.phase='preview';
  const note=doc.createElement('p');note.className='if-status';note.textContent='Preview · interactions are disabled until the answer is complete';body.append(note);
  let count=0;const passive=(node:any,depth=0):HTMLElement=>{const el=doc.createElement('div');el.className='if-stack';if(++count>500||depth>32){el.textContent='Preview limit reached';return el;}const label=doc.createElement('p');label.textContent=typeof node?.props?.content==='string'?node.props.content:String(node?.typeName??'Pending component');el.append(label);for(const child of Array.isArray(node?.props?.children)?node.props.children:[])if(child?.type==='element')el.append(passive(child,depth+1));return el;};
  if(result.tree)body.append(passive(result.tree));return result;
 };
 const initial=commit(options.source);if(!initial.ok){const text=doc.createElement('p');text.setAttribute('role','status');text.textContent='This answer could not be rendered. '+initial.issues.map((x:any)=>x.message).join(' ');body.append(text);root.dataset.phase='error';}
 return{element:root,runtime,profile,commit,preview,getSnapshot:()=>runtime.getSnapshot(),setTheme(theme:'light'|'dark'){root.dataset.theme=theme;for(const owned of root.querySelectorAll<HTMLElement>('.if-domain-owned'))owned.dataset.theme=theme;},dispose(){if(disposed)return;disposed=true;renderRevision++;unsubscribe();currentAbort?.abort();current?.dispose();runtime.dispose();root.remove();}};
}
