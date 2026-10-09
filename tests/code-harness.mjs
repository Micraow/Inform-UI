// JSDOM structure/lifecycle harness. trustedActivation invokes the captured handler
// with a test double, NOT a trusted browser event. Production has no such seam.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const fromSource=async name=>{const output=await build({entryPoints:[fileURLToPath(new URL('../src/renderer/'+name,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));};
const {renderCode}=await fromSource('code.ts');
const {codeEnglish,codeChinese}=await fromSource('code-labels.ts');
export const {scanCode}=await fromSource('code-lexer.ts');
export function setup({lang='en',dom=new JSDOM('<!doctype html><body></body>',{url:'https://example.test/',pretendToBeVisual:true})}={}) {
 const win=dom.window,doc=win.document,host=doc.createElement('div');doc.body.append(host);
 const labels={code:lang==='zh'?'代码':'code',codeUI:lang==='zh'?codeChinese:codeEnglish};
 let cleanups=[],disposed=false;const handlers=new Map();
 const c={doc,element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},cleanup(fn){cleanups.push(fn);},on(target,name,fn){target.addEventListener(name,fn);handlers.set(target,fn);cleanups.push(()=>{target.removeEventListener(name,fn);handlers.delete(target);});}};
 Object.defineProperty(win,'isSecureContext',{value:true,configurable:true});
 const mount=n=>{if(disposed)throw new Error('Disposed');const out=renderCode(c,n,labels);out.dataset.iui=n.type;if(n.id)out.id=`test-${n.id}`;host.append(out);return out;};
 const clear=()=>{const list=cleanups;cleanups=[];for(const fn of list)fn();};
 return {win,doc,host,labels,c,mount,handlers,trustedActivation(button){handlers.get(button)?.({isTrusted:true});},clipboard(writeText){Object.defineProperty(win.navigator,'clipboard',{value:{writeText},configurable:true});},update(n){clear();host.replaceChildren();return mount(n);},dispose(){if(disposed)return;disposed=true;clear();host.remove();}};
}
export const node=(changes={})=>({type:'code',value:'const answer = 42;\r\n\t// 原文 😀\n',language:'js',copy:true,highlight:true,...changes});
export const tick=()=>new Promise(resolve=>setImmediate(resolve));
export const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej;});return{promise,resolve,reject};};
