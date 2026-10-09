// JSDOM lifecycle harness. activate() invokes a CAPTURED HANDLER TEST DOUBLE,
// never a trusted browser event. Production exposes no test trust bypass.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const source=async name=>{const result=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));};
const {renderWriting}=await source('writing.ts'),{writingEnglish,writingChinese}=await source('writing-labels.ts');
export const node=(changes={})=>({type:'writing-block',label:'Draft',value:'Original\r\ntext 😀\rfinal',...changes});
export const tick=()=>new Promise(resolve=>setImmediate(resolve));
export const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
export function setup({lang='en'}={}){
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://example.test/',pretendToBeVisual:true}),win=dom.window,doc=win.document,host=doc.createElement('div');doc.body.append(host);
 let cleanups=[],disposed=false;const handlers=new Map(),labels=lang==='zh'?writingChinese:writingEnglish;
 const c={doc,prefix:'test-',element(tag,cls='',text){const el=doc.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=String(text);return el;},cleanup(fn){cleanups.push(fn);},on(target,name,fn){target.addEventListener(name,fn);handlers.set(target,fn);cleanups.push(()=>{target.removeEventListener(name,fn);handlers.delete(target);});}};
 Object.defineProperty(win,'isSecureContext',{value:true,configurable:true});
 const mount=n=>{if(disposed)throw Error('Disposed');const out=renderWriting(c,n,labels);host.append(out);return out;};
 const clear=()=>{const list=cleanups;cleanups=[];for(const fn of list)fn();};
 return{win,doc,host,handlers,labels,mount,activate(button){handlers.get(button)?.({isTrusted:true});},clipboard(writeText){Object.defineProperty(win.navigator,'clipboard',{value:{writeText},configurable:true});},update(n){clear();host.replaceChildren();return mount(n);},dispose(){if(disposed)return;disposed=true;clear();host.remove();}};
}
export const controls=root=>({draft:root.querySelector('textarea'),copy:root.querySelector('[data-writing-action=copy]'),select:root.querySelector('[data-writing-action=select]'),revert:root.querySelector('[data-writing-action=revert]'),status:root.querySelector('[role=status]')});
export function enter(h,root,value){const {draft}=controls(root);draft.value=value;draft.dispatchEvent(new h.win.Event('input',{bubbles:true}));}
