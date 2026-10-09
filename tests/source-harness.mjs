// Construction/geometry/lifecycle harness only. Never a public validator.
import { JSDOM } from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const fromSource=async name=>{const output=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
const {renderSource}=await fromSource('sources.ts');
const {sourceEnglish,sourceChinese}=await fromSource('source-labels.ts');
export const {measureRail,logicalOffset,physicalOffset}=await fromSource('source-geometry.ts');
let instance = 0;
export function setup({dom = new JSDOM('<!doctype html><html><body></body></html>', {pretendToBeVisual:true}), doc = dom.window.document, lang='en', theme='light'} = {}) {
  const win = doc.defaultView, root = doc.createElement('article'); root.className='iui-root'; root.dataset.theme=theme; root.lang=lang; doc.body.append(root);
  const labels = /^zh(?:-|$)/i.test(lang) ? sourceChinese : sourceEnglish;
  let removers=[], disposed=false, nextFrame=0; const frames=new Map(), observers=new Set();
  const metrics={listeners:0, observed:0, disconnects:0};
  win.requestAnimationFrame = cb => { const id=++nextFrame; frames.set(id,cb); return id; };
  win.cancelAnimationFrame = id => frames.delete(id);
  win.ResizeObserver = class { constructor(cb){this.cb=cb;observers.add(this);} observe(){metrics.observed++;} disconnect(){metrics.disconnects++;observers.delete(this);} };
  const c={doc,prefix:`test-source-${++instance}-`,element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},on(target,name,fn){metrics.listeners++;target.addEventListener(name,fn);removers.push(()=>{metrics.listeners--;target.removeEventListener(name,fn);});},cleanup(fn){removers.push(fn);}};
  const mount = node => {if(disposed)throw new Error('Disposed');const out=renderSource(c,node,labels);out.dataset.iui=node.type;if(node.id)out.id=c.prefix+node.id;root.append(out);return out;};
  const clear=()=>{const pending=removers;removers=[];for(const fn of pending)fn();};
  const flush=()=>{for(let rounds=0;frames.size;rounds++){if(rounds>5)throw new Error('Unexpected frame loop');const pending=[...frames];frames.clear();for(const[,fn]of pending)fn();}};
  return {dom,doc,win,root,c,labels,metrics,mount,flush,frames,observers,resize(){for(const observer of observers)observer.cb();flush();},update(nodes){clear();root.replaceChildren();return nodes.map(mount);},dispose(){if(disposed)return;disposed=true;clear();root.replaceChildren();root.remove();}};
}
export function fakeRail(h, out, {width=300, cardWidth=200, gap=12, rtl=false, model='negative', zoom=1}={}) {
  const rail=out.querySelector('.iui-source-rail'), cards=[...rail.children];
  rail.style.direction=rtl?'rtl':'ltr'; let logical=0; const calls=[];
  const total=()=>cards.length*cardWidth+Math.max(0,cards.length-1)*gap, max=()=>Math.max(0,total()-width);
  Object.defineProperties(rail,{offsetWidth:{configurable:true,get:()=>width},clientWidth:{configurable:true,get:()=>width},clientLeft:{configurable:true,get:()=>0},scrollWidth:{configurable:true,get:()=>Math.max(width,total())},scrollLeft:{configurable:true,get:()=>physicalOffset(logical,max(),rtl,model),set:raw=>{logical=logicalOffset(raw,max(),rtl,model);}}});
  const rect=(left,right)=>({left,right,width:right-left,top:0,bottom:100,height:100,x:left,y:0,toJSON(){return this;}});
  rail.getBoundingClientRect=()=>rect(20,20+width*zoom);
  cards.forEach((card,index)=>card.getBoundingClientRect=()=>{const start=index*(cardWidth+gap);return rtl?rect(20+(width+logical-start-cardWidth)*zoom,20+(width+logical-start)*zoom):rect(20+(start-logical)*zoom,20+(start-logical+cardWidth)*zoom);});
  rail.scrollTo = opts => {calls.push(opts);rail.scrollLeft=opts.left;rail.dispatchEvent(new h.win.Event('scroll'));};
  h.flush();return {rail,cards,calls,get logical(){return logical;},get max(){return max();},setWidth(value){width=value;logical=Math.min(logical,max());h.resize();},scroll(value){logical=Math.min(max(),Math.max(0,value));rail.dispatchEvent(new h.win.Event('scroll'));h.flush();}};
}
export const item=(title='Synthetic source',url='https://example.invalid/source')=>({title,url,description:'Original fictional example. Not a real source.'});
export const group=(count=4)=>({type:'web-link-cards',label:'Fictional links',items:Array.from({length:count},(_,i)=>item(`Synthetic ${i+1}`,`https://example.invalid/${i+1}`))});
