import type {RendererContext} from './context.js';
import type {RenderGeneration} from './generation.js';
import {ownedTree} from './owned-tree.js';
export {readerNativeReset as suppliedReaderReset} from './reader-controls.js';

export function suppliedReaderContext(parent:RendererContext,root:HTMLElement,onConnected?:()=>void):RendererContext {
 const life=ownedTree(parent,root,onConnected);
 const c:RendererContext={...parent,lifecycle:life,on:life.listen,cleanup:life.own,bind:fn=>life.own(parent.bind(life.guard(fn))),element:(tag,cls,value)=>life.during(()=>parent.element(tag,cls,value))};
 return c;
}
/** Each synchronous paint retires older work, including reentrant same-generation input. */
export function suppliedReaderPainter(c:RendererContext) {
 let revision=0,latest:((scope:RenderGeneration)=>void)|undefined;
 const run=(draw:(scope:RenderGeneration)=>void):void=>{latest=draw;const ticket=++revision,scope=c.lifecycle.fork(()=>ticket===revision);try{scope.guard(()=>draw(scope))();}finally{scope.dispose();
  // A host setter can perform the older native write after newer input finished.
  // Reconcile only the newest paint while the same component still owns the DOM.
  if(ticket!==revision&&c.lifecycle.current()&&latest)run(latest);
 }};return run;
}
/** Read-side callbacks also need a ticket: newer input can arrive inside a getter. */
export function suppliedReaderInput(c:RendererContext) {
 let revision=0;
 return {retire:()=>{revision++;},run:(work:(scope:RenderGeneration)=>void)=>{const ticket=++revision,scope=c.lifecycle.fork(()=>ticket===revision);try{scope.guard(()=>work(scope))();}finally{scope.dispose();}}};
}
