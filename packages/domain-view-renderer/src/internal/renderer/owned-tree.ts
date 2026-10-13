import type {RendererContext} from './context.js';
import type {RenderGeneration} from './generation.js';

type Edge = {node:Node; parent:Node|null; slot:HTMLSlotElement|null; host:Element|null};
/** A connected component permanently retires after any observed loss of its original
 * composed ancestry. Resources, registration compensation and callbacks stay in
 * the shared generation; this module owns only DOM membership observation. */
export function ownedTree(c:RendererContext,root:HTMLElement,onConnected?:()=>void):RenderGeneration {
 const resources=c.lifecycle.fork();
 const observers=new Map<Node,MutationObserver>();
 const pending:MutationRecord[]=[];
 let edges:Edge[]|undefined,lost=false,checking=false,connectionQueued=false;
 let life:RenderGeneration;
 resources.own(()=>{lost=true;observers.clear();pending.length=0;edges=undefined;});
 const retire=()=>{lost=true;resources.dispose();};
 const path=():Edge[]=>{
  const out:Edge[]=[],seen=new Set<Node>();let node:Node|null=root;
  while(node&&!seen.has(node)){
   seen.add(node);
   const parent=resources.during(()=>node!.parentNode);
   const slot=resources.during(()=>node!.nodeType===1?(node as Element).assignedSlot:null);
   const host=resources.during(()=>node!.nodeType===11?(node as ShadowRoot).host??null:null);
   out.push({node,parent,slot,host});node=slot??parent??host;
  }
  return out;
 };
 const removedOwner=():boolean=>{
  for(const observer of observers.values())pending.push(...resources.during(()=>observer.takeRecords()));
  const records=pending.splice(0),owned=edges;
  return !!owned&&records.some(record=>resources.during(()=>[...record.removedNodes]).some(removed=>owned.some(edge=>edge.node===removed||resources.during(()=>removed.contains(edge.node)))));
 };
 const inspect=():boolean=>{
  if(lost||checking||!resources.current())return false;
  checking=true;let valid=false;
  try{resources.guard(()=>{
   for(const observer of observers.values())pending.push(...resources.during(()=>observer.takeRecords()));
   if(!edges&&resources.during(()=>root.isConnected)){
    edges=path();for(const edge of edges)if(edge.node.nodeType===11)observe(edge.node);
   }
   if(edges){
    if(removedOwner()){retire();return;}
    if(!resources.during(()=>root.isConnected)){retire();return;}
    const current=path();
    if(current.length!==edges.length||current.some((edge,i)=>edge.node!==edges![i].node||edge.parent!==edges![i].parent||edge.slot!==edges![i].slot||edge.host!==edges![i].host)){retire();return;}
    // A host ancestry getter may remove and restore an owner before returning.
    if(removedOwner()){retire();return;}
   }else pending.length=0;
   valid=true;
  })();}finally{checking=false;}
  const accepted=valid&&!lost&&resources.current();
  if(accepted&&edges&&onConnected&&!connectionQueued){
   connectionQueued=true;
   // Deliver after construction, with pending ownership records rechecked.
   queueMicrotask(resources.guard(()=>life.guard(onConnected)()));
  }
  return accepted;
 };
 const observe=(target:Node)=>{
  if(observers.has(target))return;
  const Observer=resources.during(()=>c.doc.defaultView?.MutationObserver);
  if(!Observer)return;
  const observer=resources.acquire(()=>new Observer(resources.guard(records=>{pending.push(...records);inspect();})),value=>value.disconnect());
  observers.set(target,observer);
  resources.during(()=>observer.observe(target,{childList:true,subtree:true}));
 };
 try{
  life=resources.fork(inspect);
  life.own(()=>resources.dispose());
  observe(c.doc);
  resources.own(c.bind(resources.guard(inspect)));
  return life;
 }catch(error){
  try{resources.dispose();}catch(cleanupError){throw new AggregateError([error,cleanupError],'Owner registration and cleanup failed');}
  throw error;
 }
}
