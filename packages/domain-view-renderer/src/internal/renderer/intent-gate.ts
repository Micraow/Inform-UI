import type {RenderGeneration} from './generation.js';

/** A synchronous component-local intent transaction. Take admission before any
 * lifecycle/owner/DOM access: those reads may synchronously dispatch another event.
 * This does not serialize asynchronous work or own external resources. */
export function intentGate(life:RenderGeneration) {
 let busy=false;
 return {
  get busy(){return busy;},
  run<T>(work:()=>T):T|undefined {
   if(busy)return undefined;
   busy=true;
   try{return life.guard(work)();}
   finally{busy=false;}
  }
 };
}
