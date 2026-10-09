// JSDOM adapter tests are construction/lifecycle evidence, not browser-layout QA.
import { JSDOM } from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const fromSource=async name=>{const output=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
export const {renderPrimitive}=await fromSource('primitives.ts');
export const {primitiveEnglish,primitiveChinese}=await fromSource('primitive-labels.ts');
let instance = 0;
export const icons = ['info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'];
export const states = ['idle','busy','success','warning','error'];
export function setup({ dom = new JSDOM('<!doctype html><html><body></body></html>', {pretendToBeVisual:true}), lang = 'en', theme = 'light' } = {}) {
  const doc = dom.window.document, prefix = `test-primitive-${++instance}-`;
  const host = doc.createElement('section'); host.lang = lang;
  const root = doc.createElement('article'); root.className = 'iui-root'; root.dataset.theme = theme;
  host.append(root); doc.body.append(host);
  let state = {text:'Draft',count:0,other:0}, bindings = [], removers = [], disposed = false;
  const metrics = {children:[],bindings:0,listeners:0,cleanups:0};
  const labels = /^zh(?:-|$)/i.test(host.closest('[lang]')?.lang ?? doc.documentElement.lang) ? primitiveChinese : primitiveEnglish;
  const element = (tag, cls = '', value) => { const el = doc.createElement(tag); el.className = cls; if(value!==undefined) el.textContent = String(value); return el; };
  const bind = fn => { metrics.bindings++; bindings.push(fn); fn(); };
  const on = (target, name, listener) => { metrics.listeners++; target.addEventListener(name, listener); removers.push(()=>target.removeEventListener(name,listener)); };
  const context = {
    doc, prefix, element,
    svg(tag, attrs = {}) { const el = doc.createElementNS('http://www.w3.org/2000/svg',tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v)); return el; },
    bind, on, cleanup(fn) {metrics.cleanups++;removers.push(fn);},
    render(node) {
      metrics.children.push(node);
      let el;
      if(['flow','icon','pulse-indicator'].includes(node.type)) el = renderPrimitive(context,node,labels);
      else if(node.type==='input') {
        el = element('input'); el.setAttribute('aria-label',node.label); el.type='text'; el.disabled=Boolean(node.disabled);
        bind(()=>{ const next = String(state[node.bind]); if(el.value!==next)el.value=next; });
        on(el,'input',()=>{state[node.bind]=el.value;});
      } else if(node.type==='button') {
        el = element('button','',node.label); el.type='button'; on(el,'click',()=>{state.count++;});
      } else if(node.type==='link') { el=element('a','',node.value);el.setAttribute('href',node.href); }
      else if(['text','caption'].includes(node.type)) { el=element('p','iui-text');bind(()=>el.textContent=String(node.value&&typeof node.value==='object'?state[node.value.$]:node.value)); }
      else throw new TypeError('Harness unknown child');
      el.dataset.iui=node.type; if(node.id)el.id=prefix+node.id;return el;
    }
  };
  const clear = () => {for(const remove of removers)remove();removers=[];bindings=[];root.replaceChildren();};
  return {dom,doc,host,root,context,metrics,labels,
    mount(node) { if(disposed)throw new Error('Disposed');const el=context.render(node);root.append(el);return el; },
    setState(patch) {if(disposed)throw new Error('Disposed');state={...state,...patch};for(const refresh of bindings)refresh();},
    getState() {return {...state};},
    update(nodes) {if(disposed)throw new Error('Disposed');clear();nodes.forEach(node=>root.append(context.render(node)));},
    dispose() {if(disposed)return;disposed=true;clear();host.remove();}
  };
}
