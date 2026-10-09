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
/** Checks actual ownership and native disabled semantics without crossing fieldset boundaries artificially. */
export const readerBlocked=(root:HTMLElement,control:HTMLElement,alive:boolean)=>!alive||!root.isConnected||!control.isConnected||!root.contains(control)||control.matches(':disabled')||blockedComposedAncestor(control);
/** Reconcile native reset only after cancellation, later input and ownership settle. */
export function readerNativeReset(c:RendererContext,root:HTMLElement,controls:readonly (HTMLInputElement|HTMLSelectElement)[],revision:()=>number,restore:()=>void,reset:()=>void):void {
 let alive=true,resetRoot:EventTarget|undefined;
 const onReset=(event:Event)=>{const form=event.target;if(!alive||!form||!controls.some(control=>root.contains(control)&&control.form===form))return;const before=revision(),allowed=controls.every(control=>control.form===form&&!readerBlocked(root,control,alive));queueMicrotask(()=>{if(!alive)return;if(!event.defaultPrevented&&allowed&&controls.every(control=>control.form===form&&!readerBlocked(root,control,alive))&&revision()===before)reset();else restore();});};
 c.doc.addEventListener('reset',onReset,true);c.bind(()=>{const tree=root.getRootNode(),next=tree!==c.doc&&tree.nodeType===11?tree:undefined;if(next===resetRoot)return;resetRoot?.removeEventListener('reset',onReset,true);resetRoot=next;resetRoot?.addEventListener('reset',onReset,true);});c.cleanup(()=>{alive=false;c.doc.removeEventListener('reset',onReset,true);resetRoot?.removeEventListener('reset',onReset,true);});
}
