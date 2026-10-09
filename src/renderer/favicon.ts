import type {FaviconNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {FaviconLabels} from './favicon-labels.js';
/** Only an explicit supplied asset, never a hostname-to-icon service. */
export function renderFavicon(c:RendererContext,n:FaviconNode,t:FaviconLabels):HTMLElement{
 const e=c.element,root=e('div','iui-favicon'),visual=e('span','iui-favicon-visual'),fallback=e('span','iui-favicon-fallback',n.fallback??'↗');root.dataset.size=n.size??'md';
 visual.setAttribute('role','img');visual.setAttribute('aria-label',n.label);fallback.setAttribute('aria-hidden','true');visual.append(fallback);root.append(visual);
 let alive=true,pending=false,generation=0,image:HTMLImageElement|undefined,detach=()=>{};
 const status=e('span','iui-favicon-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const load=e('button','iui-favicon-load',t.load);load.type='button';
 const remote=!!n.src&&!/^data:/i.test(n.src);
 if(remote){const controls=e('div','iui-favicon-controls');controls.append(load,e('span','iui-caption',t.disclosure(new URL(n.src!).hostname)));root.append(controls);}
 if(n.src)root.append(status);
 const finish=(success:boolean,own:number,img:HTMLImageElement)=>{
  if(!alive||own!==generation||img!==image)return;pending=false;root.dataset.state=success?'loaded':'error';fallback.hidden=success;img.hidden=!success;load.textContent=success?t.loaded:t.retry;load.setAttribute('aria-disabled',String(success));status.textContent=success?t.loaded:t.failed;
 };
 const start=()=>{
  if(!alive||pending||root.dataset.state==='loaded'||load.matches(':disabled')||!n.src)return;pending=true;const own=++generation;
  detach();image?.remove();fallback.hidden=false;root.dataset.state='loading';status.textContent=t.loading;load.setAttribute('aria-disabled','true');
  const img=e('img');image=img;img.alt='';img.setAttribute('aria-hidden','true');img.hidden=true;img.referrerPolicy='no-referrer';img.decoding='async';
  const loaded=()=>finish(img.naturalWidth>0,own,img),failed=()=>finish(false,own,img);img.addEventListener('load',loaded);img.addEventListener('error',failed);detach=()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',failed);};visual.append(img);img.src=n.src;
 };
 root.dataset.state='fallback';c.on(load,'click',start);c.cleanup(()=>{alive=false;generation++;detach();});if(n.src&&!remote)start();return root;
}
