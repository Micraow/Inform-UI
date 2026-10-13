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
interface ViewRecord {node:FoundationNode;renderer:unknown;handle:FoundationHandle;abort:AbortController;children:ViewRecord[];childIndex:number;revision:number;alive:boolean}
const bindingIdentity=(node:FoundationNode)=>JSON.stringify(Object.entries(node.bindings??{}).map(([prop,handle])=>[prop,handle.name]));
/** The host alone owns events, revisions and DOM lifecycle; schemas never execute code. */
export function mountProfile(container:HTMLElement,profile:HostProfile,runtime:HostRuntime,options:MountOptions){
 const doc=container.ownerDocument;let disposed=false,current:ViewRecord|null=null,renderRevision=0,replaceTree=false;
 const root=doc.createElement('div');root.className='if-root';root.dataset.theme=options.theme??'light';
 const style=doc.createElement('style');style.textContent=(profile.styleText??'')+foundationCSS+migratedControlCSS;const body=doc.createElement('div');root.append(style,body);container.append(root);
 const error=(issues:readonly any[])=>{options.onError?.(issues);return{ok:false,issues};};
 let units=0;
 let reconcileNode:(node:FoundationNode,path:string,previous?:ViewRecord)=>ViewRecord;
 const budget={get remaining(){return 12000-units;},consume(n=1){units+=n;if(units>12000)throw Error('DOM rendering budget exceeded');}};
 const render=(snapshot:any)=>{
  if(disposed)return;const revision=++renderRevision,active=doc.activeElement as HTMLInputElement|null;
  const restore=active&&body.contains(active)?{element:active,binding:active.dataset.ifBinding,key:active.closest<HTMLElement>('[data-if-node]')?.dataset.ifNode,tag:active.tagName,optionValue:active.type==='radio'?active.value:null,selection:typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null}:null;
  units=0;const created:ViewRecord[]=[];
  const renderNode=(node:FoundationNode,path='root',previous?:ViewRecord):ViewRecord=>{
   budget.consume();const definition=profile.components[node.typeName];if(!definition||definition.renderer.kind!=='dom')throw Error('No DOM adapter: '+node.typeName);
   // Only adapters with an explicit in-place update contract may retain their DOM.
   // A fresh snapshot refreshes the actual opaque handles, never their public names.
   let record:ViewRecord;
   if(!replaceTree&&previous?.alive&&previous.node.typeName===node.typeName&&previous.renderer===definition.renderer&&previous.handle.update&&bindingIdentity(previous.node)===bindingIdentity(node)){
    record=previous;record.node=node;record.revision=revision;record.childIndex=0;record.handle.update!(node.props);
    for(const child of record.children.splice(record.childIndex))child.handle.dispose();
   }else{
    previous?.handle.dispose();
    record={node,renderer:definition.renderer,handle:null as unknown as FoundationHandle,abort:new AbortController(),children:[],childIndex:0,revision,alive:true};created.push(record);
    const context:FoundationContext={document:doc,budget,partial:false,get bindings(){return record.node.bindings;},signal:record.abort.signal,get theme(){return root.dataset.theme as 'light'|'dark';},
     renderChild:value=>{const index=record.childIndex++,child=reconcileNode(value,path+'.'+index,record.children[index]);record.children[index]=child;return child.handle;},
     writeBinding:(prop,value)=>{if(disposed||!record.alive||record.revision!==renderRevision)return error([{code:'STALE_VIEW',message:'This view is no longer active'}]);const handle=record.node.bindings?.[prop];if(!handle)return error([{code:'UNBOUND',message:'This field is not writable'}]);const result=runtime.setBinding(handle,value);if(!result.ok){error(result.issues);return result;}return{ok:true,value:null};},
     dispatchLocal:action=>{if(disposed||!record.alive||record.revision!==renderRevision)return error([{code:'STALE_VIEW',message:'This view is no longer active'}]);const result=runtime.dispatchLocal(action);if(!result.ok){error(result.issues);return result;}return{ok:true,value:null};},
     allowImageURL:options.allowImageURL,allowAnimationURL:options.allowAnimationURL,allowMediaURL:options.allowMediaURL};
    const owned=definition.renderer.create(node.props,context) as FoundationHandle;
    record.handle={element:owned.element,...(owned.update?{update:(props:Record<string,unknown>)=>owned.update!(props)}:{}),dispose(){if(!record.alive)return;record.alive=false;record.abort.abort();owned.dispose();for(const child of record.children)child.handle.dispose();record.children=[];}};
   }
   record.handle.element.dataset.ifNode=path;
   const binding=node.bindings?.value??node.bindings?.checked;
   if(binding&&typeof binding.name==='string')for(const control of record.handle.element.querySelectorAll<HTMLElement>('input,select,textarea'))control.dataset.ifBinding=binding.name;
   return record;
  };
  reconcileNode=renderNode;
  try{
   const next=renderNode(snapshot.tree,'root',current??undefined);current=next;
   // Re-inserting even the same element detaches its input descendants and cancels
   // native range dragging. Retained roots must never pass through replaceChildren.
   if(body.firstChild!==next.handle.element)body.replaceChildren(next.handle.element);
  }catch(cause){for(const record of created.reverse()){record.abort.abort();record.handle?.dispose();for(const child of record.children)child.handle.dispose();}current?.handle.dispose();current=null;body.replaceChildren();const failure=doc.createElement('p');failure.setAttribute('role','alert');failure.textContent='This answer could not be displayed.';body.append(failure);root.dataset.phase='error';error([{code:'RENDER',message:String(cause)}]);return;}
  root.dataset.phase='ready';root.dataset.revision=String(snapshot.revision);
  if(restore&&(!restore.element.isConnected||doc.activeElement!==restore.element)){const controls=[...body.querySelectorAll<HTMLElement>('input,select,textarea,button')];const target=controls.find(el=>restore.binding?el.dataset.ifBinding===restore.binding&&(!restore.optionValue||(el as HTMLInputElement).value===restore.optionValue):el.closest<HTMLElement>('[data-if-node]')?.dataset.ifNode===restore.key&&el.tagName===restore.tag) as HTMLInputElement|undefined;
   if(target){target.focus({preventScroll:true});if(restore.selection&&typeof target.setSelectionRange==='function')try{target.setSelectionRange(restore.selection[0],restore.selection[1]);}catch{}}}
 };
 const unsubscribe=runtime.subscribe(render);
 const commit=(source:string)=>{if(disposed)return error([{code:'DISPOSED',message:'View disposed'}]);replaceTree=true;try{const result=runtime.commit(source);if(!result.ok)error(result.issues);return result;}finally{replaceTree=false;}};
 const preview=(source:string)=>{
  if(disposed)return error([{code:'DISPOSED',message:'View disposed'}]);const result=runtime.preview(source);renderRevision++;current?.handle.dispose();current=null;body.replaceChildren();root.dataset.phase='preview';
  const note=doc.createElement('p');note.className='if-status';note.textContent='Preview · interactions are disabled until the answer is complete';body.append(note);
  let count=0;const passive=(node:any,depth=0):HTMLElement=>{const el=doc.createElement('div');el.className='if-stack';if(++count>500||depth>32){el.textContent='Preview limit reached';return el;}const label=doc.createElement('p');label.textContent=typeof node?.props?.content==='string'?node.props.content:String(node?.typeName??'Pending component');el.append(label);for(const child of Array.isArray(node?.props?.children)?node.props.children:[])if(child?.type==='element')el.append(passive(child,depth+1));return el;};
  if(result.tree)body.append(passive(result.tree));return result;
 };
 const initial=commit(options.source);if(!initial.ok){const text=doc.createElement('p');text.setAttribute('role','status');text.textContent='This answer could not be rendered. '+initial.issues.map((x:any)=>x.message).join(' ');body.append(text);root.dataset.phase='error';}
 return{element:root,runtime,profile,commit,preview,getSnapshot:()=>runtime.getSnapshot(),setTheme(theme:'light'|'dark'){root.dataset.theme=theme;for(const owned of root.querySelectorAll<HTMLElement>('.if-domain-owned'))owned.dataset.theme=theme;},dispose(){if(disposed)return;disposed=true;renderRevision++;unsubscribe();current?.handle.dispose();runtime.dispose();root.remove();}};
}
