// Isolated native-platform shim: state/cleanup coverage, not browser-layout evidence.
import { JSDOM } from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const fromSource=async name=>{const output=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
const {renderOverlay}=await fromSource('overlays.ts');
const {overlayEnglish,overlayChinese}=await fromSource('overlay-labels.ts');
export const tooltip = (label = 'Help', value = 'Original explanation') => ({ type: 'tooltip', label, value });
export const popover = (label = 'Open details', children = [{type:'text',value:'Original details'}]) => ({ type: 'popover', label, children });
export function setup({ native = false, lang = 'en', theme = 'light', dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true }), prefix = 'iui-test-1-' } = {}) {
  const {document: doc} = dom.window, win = dom.window;
  const host = doc.createElement('section'); host.lang = lang; doc.body.append(host);
  const root = doc.createElement('article'); root.className = 'iui-root'; root.dataset.theme = theme; host.append(root);
  const labels = /^zh/.test(lang) ? overlayChinese : overlayEnglish;
  const metrics = { shows: 0, hides: 0, observers: 0, frames: 0 };
  if (native) {
    const shown = new WeakSet(), proto = win.HTMLElement.prototype, matches = proto.matches;
    proto.showPopover = function () { if (!this.isConnected) throw new Error('detached'); shown.add(this); metrics.shows++; };
    proto.hidePopover = function () { shown.delete(this); metrics.hides++; const e = new win.Event('toggle'); e.newState = 'closed'; this.dispatchEvent(e); };
    proto.matches = function (s) { return s === ':popover-open' ? shown.has(this) : matches.call(this, s); };
    win.ResizeObserver = class { constructor(callback) { this.callback = callback; metrics.observers++; this.active=true; } observe() {} disconnect() { if(this.active) metrics.observers--; this.active=false; } };
    const rect = (left,top,width,height) => ({ left, top, width, height, right:left+width, bottom:top+height, x:left, y:top, toJSON(){ return this; } });
    proto.getClientRects = function () { return [this.getBoundingClientRect()]; };
    proto.getBoundingClientRect = function () { return this.classList.contains('iui-overlay-surface') ? rect(0,0,280,150) : rect(80,80,100,44); };
  }
  let state = { text: 'Draft', count: 0, unrelated: 0 }, removers = [], bindings = [];
  const element = (tag, cls = '', text) => { const el = doc.createElement(tag); el.className = cls; if(text!==undefined) el.textContent=String(text); return el; };
  const context = {
    doc, prefix, element,
    on(target,name,fn) { target.addEventListener(name,fn); removers.push(()=>target.removeEventListener(name,fn)); },
    cleanup(fn) { removers.push(fn); }, bind(fn) { bindings.push(fn); fn(); },
    getState:()=>state, value:v=>v&&typeof v==='object'&&'$'in v?state[v.$]:v,
    display:v=>String(v), showValue:(el,v)=>el.textContent=String(v),
    render(node) {
      let el;
      if (['tooltip','popover'].includes(node.type)) el = renderOverlay(context,node,labels);
      else if(node.type==='input') { el=element('input'); el.setAttribute('aria-label',node.label); context.bind(()=>{const next=String(state[node.bind]); if(el.value!==next)el.value=next;}); context.on(el,'input',()=>{state[node.bind]=el.value;}); }
      else if(node.type==='button') { el=element('button','',node.label); el.type='button'; context.on(el,'click',()=>context.change({[node.action.bind]:node.action.value})); }
      else { el=element('p'); context.bind(()=>{el.textContent=String(context.value(node.value));}); }
      if(node.id) el.id=prefix+node.id; el.dataset.iui=node.type; return el;
    },
    change(patch) { state={...state,...patch}; for(const fn of bindings)fn(); },
    fromControl(patch) { context.change(patch); }, actions: {}, labels:()=>({}), svg:()=>{}
  };
  const clear = () => { for(const fn of removers)fn(); removers=[]; bindings=[]; root.replaceChildren(); };
  return {dom,doc,win,host,root,context,metrics,
    mount(node) { const el=context.render(node); root.append(el); return el; },
    setState:context.change,
    update(nodes) { clear(); nodes.forEach(n=>root.append(context.render(n))); },
    dispose() { clear(); host.remove(); },
    event(target,name,props={}) { const e=new win.Event(name,{bubbles:true,cancelable:true,composed:true});Object.assign(e,props);target.dispatchEvent(e);return e; }
  };
}
export const parts = el => ({ trigger:el.querySelector(':scope > .iui-overlay-trigger'), surface:el.querySelector(':scope > .iui-overlay-surface'), close:el.querySelector(':scope > .iui-overlay-surface > .iui-popover-header > .iui-overlay-close') });
export const pause = (ms=0) => new Promise(r=>setTimeout(r,ms));
