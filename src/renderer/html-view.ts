import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import type {HtmlViewNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {htmlViewDocument} from '../core/html-view.js';
/** The only authored-HTML sink is this scriptable, opaque-origin srcdoc frame. */
export function renderHtmlView(c:RendererContext,n:HtmlViewNode,renderOwner:HTMLElement,host:HTMLElement):HTMLElement {
 const root=c.element('div','iui-html-view');c=suppliedReaderContext(c,root);root.style.height=`${n.height??360}px`;root.style.width=typeof n.width==='number'?`${n.width}px`:n.width??'100%';root.dataset.loaded='false';
 let alive=true,frame:HTMLIFrameElement|null=null,scheduled=false,started=false,inserted=false;
 function retire(){alive=false;const old=frame;frame=null;old?.remove();}
 const owner=c.doc;let mounted=false,parent:ParentNode|null=null;
 const owned=()=>{if(!alive||!c.lifecycle.current())return false;if(renderOwner.parentNode!==host||!renderOwner.contains(root)||parent&&root.parentNode!==parent||inserted&&frame?.parentNode!==root){retire();return false;}return true;};
 const current=()=>{if(!owned())return false;if(!root.isConnected){if(mounted)retire();return false;}mounted=true;return true;};
 const attached=(candidate:HTMLIFrameElement)=>current()&&frame===candidate&&root.contains(candidate);
 function mount(){
  if(started||!current())return;started=true;
  let candidate:HTMLIFrameElement|null=null,complete=false;
  try {
   candidate=c.element('iframe','iui-html-view-frame');if(!current())return;frame=candidate;
   candidate.setAttribute('sandbox','allow-scripts');if(!current())return;
   candidate.title=n.title??'DIL HTML view';if(!current())return;
   candidate.referrerPolicy='no-referrer';if(!current())return;
   const target=candidate;c.on(target,'load',()=>{if(attached(target))root.dataset.loaded='true';});
   inserted=true;root.append(target);if(!attached(target))return;
   c.lifecycle.acquire(()=>{target.srcdoc=htmlViewDocument(n.html);return target;},frame=>{frame.removeAttribute('srcdoc');frame.remove();});if(!attached(target))return;
   complete=true;
  } catch {if(current())root.dataset.phase='error';} finally {if(!complete&&candidate){if(frame===candidate)frame=null;candidate.remove();}}
 }
 function schedule(){if(scheduled||started||!alive)return;scheduled=true;queueMicrotask(c.lifecycle.guard(()=>{scheduled=false;mount();}));}
 c.bind(()=>{if(!parent&&renderOwner.contains(root))parent=root.parentNode;schedule();});schedule();
 c.cleanup(retire);
 return root;
}
