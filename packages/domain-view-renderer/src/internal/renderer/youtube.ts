import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {intentGate} from './intent-gate.js';
import type {YoutubeNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {youtubeEmbedURL} from '../core/youtube.js';
import {readerBlocked} from './reader-controls.js';

/** Reference direct-load default, optional demand gate, and revocable fixed-origin iframe. */
export function renderYouTube(c:RendererContext,n:YoutubeNode):HTMLElement {
 const root=c.element('section','iui-youtube');c=suppliedReaderContext(c,root,()=>scheduleDirect());const intent=intentGate(c.lifecycle),direct=n.loadMode!=='on-demand',e=c.element,t=c.labels().youtubeUI,id=c.allocateInternalId?.('youtube')??`${c.prefix}-youtube`;
 const notice=e('p','iui-youtube-notice',t.notice),viewport=e('div','iui-youtube-viewport'),actions=e('div','iui-youtube-actions'),load=e('button','iui-youtube-load',t.load),unload=e('button','iui-youtube-unload',t.unload),status=e('p','iui-youtube-status',t.idle);
 root.setAttribute('aria-label',n.label);root.tabIndex=-1;root.dir='auto';root.dataset.phase='idle';root.dataset.loadMode=direct?'direct':'on-demand';notice.id=id+'-notice';status.id=id+'-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 load.type=unload.type='button';load.setAttribute('aria-describedby',notice.id+' '+status.id);unload.hidden=true;viewport.hidden=!direct;notice.hidden=status.hidden=actions.hidden=direct;actions.append(load,unload);
 if(n.caption!==undefined)root.append(e('p','iui-youtube-caption',n.caption));root.append(notice,viewport,actions,status);
 let lastDisabled:boolean|undefined;
 let alive=true,busy=false,scheduled=false,revision=0,frame:HTMLIFrameElement|null=null;
 const owned=(item:HTMLElement)=>alive&&root.contains(item);
 const disabled=()=>n.disabled!==undefined&&c.value(n.disabled)===true;
 const allowed=(control:HTMLButtonElement)=>c.lifecycle.current()&&!readerBlocked(root,control,alive)&&root.contains(viewport)&&root.contains(actions)&&actions.contains(control);
 const canLoad=()=>c.lifecycle.current()&&(direct?!readerBlocked(root,viewport,alive)&&root.contains(actions)&&actions.contains(load)&&!load.matches(':disabled'):allowed(load));
 // Observe only this pending player's composed ancestors; unrelated page changes cannot retry a failed load.
 let observer:MutationObserver|undefined,wasAllowed=false;
 function watchAncestors(){
  observer?.disconnect();if(!direct||!alive||frame)return;
  const Observer=c.doc.defaultView?.MutationObserver;if(!Observer)return;
  wasAllowed=canLoad()&&!disabled();
  observer=new Observer(()=>{const next=alive&&canLoad()&&!disabled(),becameAllowed=!wasAllowed&&next;wasAllowed=next;if(becameAllowed)scheduleDirect();});
  const seen=new Set<Node>();let item:Node|null=viewport;
  while(item&&!seen.has(item)){seen.add(item);if(item.nodeType===1){observer.observe(item,{attributes:true,attributeFilter:['disabled','hidden','inert']});const slot:HTMLSlotElement|null=(item as Element).assignedSlot;if(slot){item=slot;continue;}}item=item.parentNode??(item.nodeType===11?(item as ShadowRoot).host:null);}
 }
 function scheduleDirect(){if(!direct||!alive||scheduled||frame)return;scheduled=true;queueMicrotask(c.lifecycle.guard(()=>{scheduled=false;if(!alive)return;watchAncestors();loadPlayer();}));}
 const current=(ticket:number)=>ticket===revision&&canLoad()&&!disabled();
 function removeFrame(){const old=frame;frame=null;if(old){old.removeAttribute('src');old.remove();}}
 function feedback(phase:string,text:string,ticket:number){if(!alive||ticket!==revision)return;root.dataset.phase=phase;if(owned(status)&&ticket===revision)status.textContent=text;}
 function idle(ticket:number){if(!alive||ticket!==revision)return;if(owned(viewport))viewport.hidden=!direct;if(!alive||ticket!==revision)return;if(owned(unload))unload.hidden=true;if(!alive||ticket!==revision)return;if(owned(load))load.hidden=false;feedback('idle',t.idle,ticket);}
 c.bind(()=>{
  if(!alive)return;
  const ticket=++revision,off=disabled(),becameEnabled=lastDisabled===undefined||lastDisabled&&!off;
  lastDisabled=off;
  if(busy){removeFrame();idle(ticket);}if(!alive||ticket!==revision)return;
  if(owned(load))load.disabled=off;if(alive)root.dataset.disabled=String(off);
  // Unrelated refreshes must not create an unbounded automatic retry loop through host DOM hooks.
  if(direct&&becameEnabled&&!off)scheduleDirect();
 });
 function loadPlayer(){intent.run(()=>{
  if(busy||frame||!canLoad()||disabled())return;
  busy=true;const ticket=revision,focusBefore=c.doc.activeElement;let candidate:HTMLIFrameElement|null=null,completed=false;
  try {
   candidate=e('iframe','iui-youtube-frame');if(!current(ticket))return;
   frame=candidate;candidate.title=n.label;candidate.width='640';candidate.height='360';
   candidate.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
   candidate.setAttribute('allow',n.fullscreen===false?'encrypted-media':'encrypted-media; fullscreen');
   candidate.referrerPolicy='strict-origin-when-cross-origin';if(n.fullscreen!==false)candidate.setAttribute('allowfullscreen','');
   if(!current(ticket))return;
   viewport.append(candidate);if(!current(ticket)||!viewport.contains(candidate))return;
   // The sole remote sink follows the chosen load mode and a fresh ownership check.
   const target=candidate;c.lifecycle.acquire(()=>{target.src=youtubeEmbedURL(n);return target;},frame=>{frame.removeAttribute('src');frame.remove();});
   if(!current(ticket)||!viewport.contains(candidate))return;
   viewport.hidden=false;if(!current(ticket))return;unload.hidden=direct;if(!current(ticket))return;
   // Keep the load control in the tree for ownership checks; hide it only after all guarded writes.
   feedback('requested',t.requested,ticket);if(!current(ticket))return;const keepFocus=c.doc.activeElement===focusBefore;load.hidden=true;completed=true;observer?.disconnect();
   if(!direct&&keepFocus&&alive&&ticket===revision&&allowed(unload)&&(c.doc.activeElement===focusBefore||focusBefore===load&&c.doc.activeElement===c.doc.body))unload.focus();
  } catch {if(current(ticket))feedback('error',t.failed,ticket);}
  finally {if(!completed&&candidate){if(frame===candidate)frame=null;candidate.remove();if(alive&&ticket===revision){if(owned(viewport))viewport.hidden=true;if(alive&&ticket===revision&&owned(unload))unload.hidden=true;if(alive&&ticket===revision&&owned(load))load.hidden=false;}}busy=false;}
 });}
 c.on(load,'click',event=>{if(!direct&&!event.defaultPrevented)loadPlayer();});
 c.on(unload,'click',event=>{if(event.defaultPrevented||direct||busy||!allowed(unload))return;busy=true;const ticket=++revision;try{removeFrame();idle(ticket);if(alive&&ticket===revision&&root.isConnected){if(!disabled()&&allowed(load))load.focus();else if(owned(load)&&!root.closest('[hidden],[inert]'))root.focus();}}finally{busy=false;}});
 c.cleanup(()=>{alive=false;revision++;observer?.disconnect();removeFrame();});return root;
}
