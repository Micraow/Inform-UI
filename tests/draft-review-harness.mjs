// Captured-handler TEST DOUBLE only. Never a genuine trusted browser event.
// The production email renderer delegates to unmodified renderWriting.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
async function source(name){const result=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
const {renderEmailDraft}=await source('email-draft.ts'),{draftReviewEnglish}=await source('draft-review-labels.ts'),{writingEnglish}=await source('writing-labels.ts');
export const email=(change={})=>({type:'email-draft',label:'Email',to:['a@example.invalid'],subject:'Do not copy this header',body:'First\r\nsecond\rthird 😀',...change});
export const tick=()=>new Promise(resolve=>setImmediate(resolve));
export function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
export function setup(){
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://example.invalid',pretendToBeVisual:true}),win=dom.window,doc=win.document,host=doc.createElement('div');doc.body.append(host);let cleanups=[],disposed=false;const handlers=new Map();
 const c={doc,prefix:'email-test-',element(tag,cls='',text){const node=doc.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=String(text);return node;},cleanup(fn){cleanups.push(fn);},on(node,name,fn){node.addEventListener(name,fn);handlers.set(node,fn);cleanups.push(()=>{node.removeEventListener(name,fn);handlers.delete(node);});}};
 Object.defineProperty(win,'isSecureContext',{value:true,configurable:true});
 const mount=n=>{if(disposed)throw Error('Disposed');const root=renderEmailDraft(c,n,draftReviewEnglish,writingEnglish);host.append(root);return root;};
 const clear=()=>{for(const cleanup of cleanups)cleanup();cleanups=[];};
 return {win,doc,host,handlers,mount,activate(button){handlers.get(button)?.({isTrusted:true});},clipboard(fn){Object.defineProperty(win.navigator,'clipboard',{value:{writeText:fn},configurable:true});},update(n){clear();host.replaceChildren();return mount(n);},dispose(){if(disposed)return;disposed=true;clear();host.remove();}};
}
export const controls=root=>({draft:root.querySelector('textarea'),copy:root.querySelector('[data-writing-action=copy]'),select:root.querySelector('[data-writing-action=select]'),revert:root.querySelector('[data-writing-action=revert]'),status:root.querySelector('[role=status]')});
export function enter(h,root,value){const text=controls(root).draft;text.value=value;text.dispatchEvent(new h.win.Event('input',{bubbles:true}));}
