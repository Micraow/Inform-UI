import type {RenderGeneration} from './generation.js';
/** Owned WAAPI presence transition. No timers, observers or retained global animation arrays. */
export function animateChecklistDetails(owner:RenderGeneration,element:HTMLElement,phase:'enter'|'exit',height:number,onFinish:()=>void=()=>{}):()=>void {
 const motion=owner.fork(),write=motion.during;let done=false;
 const finish=()=>{if(done||!motion.current())return;done=true;try{write(onFinish);}finally{motion.dispose();}};
 try{
  const media=write(()=>element.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)'));
  const animate=write(()=>element.animate);
  if(media?.matches||typeof animate!=='function'){finish();return motion.dispose;}
  if(media)motion.listen(media,'change',()=>{if(media.matches)finish();});
  const enter=phase==='enter',size=Math.max(0,Number.isFinite(height)?height:0);
  motion.acquire(()=>animate.call(element,enter?[{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0px)'}]:[{opacity:1,transform:'translateY(0px)'},{opacity:0,transform:'translateY(-4px)'}],{duration:enter?180:120,easing:'ease',fill:'both'}),animation=>animation.cancel());
  const layout=motion.acquire(()=>animate.call(element,enter?[{height:'0px'},{height:`${size}px`}]:[{height:`${size}px`},{height:'0px'}],{duration:enter?220:160,easing:'ease',fill:'both'}),animation=>animation.cancel());
  motion.listen(layout,'finish',finish);
  if(write(()=>layout.playState)==='finished')finish();
 }catch(error){motion.dispose();throw error;}
 return motion.dispose;
}
