import type {RendererContext} from './context.js';
/** Attribute visibility/inertness follows the composed tree, including slots and shadow hosts. */
function blockedComposedAncestor(control:HTMLElement):boolean {
 const seen=new Set<Node>();let current:Node|null=control;
 while(current){
  if(seen.has(current))return true;seen.add(current);
  if(current.nodeType===1){const element=current as Element;if(element.hasAttribute('hidden')||element.hasAttribute('inert'))return true;if(element.assignedSlot){current=element.assignedSlot;continue;}}
  if(current.parentNode){current=current.parentNode;continue;}
  current=current.nodeType===11?(current as ShadowRoot).host??null:null;
 }
 return false;
}
/** Checks ownership, native disabled semantics and the control's explicit ARIA state. Ancestor ARIA state is not synthesized into native fieldset semantics. */
export const readerBlocked=(root:HTMLElement,control:HTMLElement,alive:boolean)=>!alive||!root.isConnected||!control.isConnected||!root.contains(control)||control.matches(':disabled')||control.getAttribute('aria-disabled')==='true'||blockedComposedAncestor(control);
/** Reconcile native reset only after cancellation, later input and ownership settle.
 * Registrations belong to a child generation, so late host registration is
 * compensated and releases remain idempotent when the shadow target changes.
 */
export function readerNativeReset(c:RendererContext,root:HTMLElement,controls:readonly (HTMLInputElement|HTMLSelectElement)[],revision:()=>number,restore:()=>void,reset:()=>void):void {
 const life=c.lifecycle.fork();
 let resetRoot:EventTarget|undefined,releaseShadow:(()=>void)|undefined;
 const onReset=(event:Event)=>{
  // Snapshot intent before host getters can synchronously deliver newer input.
  const before=life.during(revision);
  const form=life.during(()=>event.target);
  if(!form||!life.during(()=>controls.some(control=>root.contains(control)&&control.form===form)))return;
  const allowed=life.during(()=>controls.every(control=>control.form===form&&!readerBlocked(root,control,life.current())));
  queueMicrotask(life.guard(()=>{
   if(!life.during(()=>event.defaultPrevented)&&allowed&&life.during(()=>controls.every(control=>control.form===form&&!readerBlocked(root,control,life.current())))&&life.during(revision)===before)life.during(reset);
   else life.during(restore);
  }));
 };
 life.listen(c.doc,'reset',onReset,true);
 life.own(c.bind(life.guard(()=>{
  const next=life.during(()=>{const tree=root.getRootNode();return tree!==c.doc&&tree.nodeType===11?tree:undefined;});
  if(next===resetRoot)return;
  if(releaseShadow)life.during(releaseShadow);
  releaseShadow=undefined;resetRoot=next;
  if(next)releaseShadow=life.listen(next,'reset',onReset,true);
 })));
}
