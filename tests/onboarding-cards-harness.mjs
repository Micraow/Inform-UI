// Compiled component harness; public registry validation belongs to integration.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({stdin:{contents:`export {renderOnboardingCards} from './src/renderer/onboarding-cards.ts';export {renderGeneration} from './src/renderer/generation.ts';export {inspectOnboardingCards} from './src/core/onboarding-cards.ts';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
export const {renderOnboardingCards,renderGeneration,inspectOnboardingCards}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
export const features=(extra={})=>({type:'onboarding-feature-card',label:'Explore features',title:'More ways to work',features:[{id:'thinking',featureId:'intelligence',title:'Think carefully',description:'Consider a supplied problem.'},{id:'image',featureId:'images',title:'Imagine something',description:'Describe an idea.'}],benefits:[{id:'work',title:'Work on a plan',description:'A useful planning space.',featureId:'work'},{id:'info',title:'Included tools',description:'Supplied information.'}],...extra});
export const plugins=(extra={})=>({type:'onboarding-plugin-suggestions',label:'Suggested apps',title:'Connect useful apps',canConnect:true,canBrowse:true,browseLabel:'Browse apps',plugins:[{id:'notes',label:'Notes app',status:'available',connectLabel:'Connect notes'},{id:'calendar',label:'Calendar app',status:'connected'},{id:'files',label:'Files app',status:'unavailable',statusLabel:'Not offered'}],...extra});
export const tasks=(extra={})=>({type:'onboarding-starter-tasks',label:'Starter ideas',heading:'Choose an idea',tasks:[{id:'outline',label:'Outline a plan',prompt:'Prepare a sample outline.',completed:true},{id:'preview',label:'Preview an idea',prompt:'Preview this example.',requiresSitePreview:true}],...extra});
export const selection=(extra={})=>tasks({variant:'selection',tasks:[{id:'one',label:'First idea'},{id:'two',label:'Second idea'}],...extra});
export const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
let id=0;
export function setup(node,{markup='<form><main></main></form>',shadow=false,theme='light'}={}){
 const dom=new JSDOM('<!doctype html>'+markup,{url:'https://fixture.test',pretendToBeVisual:true}),win=dom.window,doc=win.document;let host=doc.querySelector('main'),form=doc.querySelector('form');
 if(shadow){const holder=doc.createElement('div');doc.body.append(holder);const tree=holder.attachShadow({mode:'open'});tree.innerHTML='<form><main></main></form>';host=tree.querySelector('main');form=tree.querySelector('form');}
 let life,stopped=false,current,bindings=new Set(),requests=[];
 const update=node=>{if(stopped)return;const old=life;const generation=renderGeneration(()=>!stopped&&life===generation);life=generation;old?.dispose();
  const c={doc,prefix:'onboarding-test-'+(++id),lifecycle:generation,allocateInternalId:role=>'onboarding-'+role+'-'+(++id),element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},on:generation.listen,cleanup:generation.own,bind(fn){bindings.add(fn);return generation.own(()=>bindings.delete(fn));}};
  const owner=doc.createElement('article');owner.className='iui-root';owner.dataset.theme=theme;current=generation.during(()=>renderOnboardingCards(c,node,owner,host));owner.append(current);host.replaceChildren(owner);for(const fn of [...bindings])fn();return current;
 };
 const fail=()=>{requests.push('external');throw new Error('No service is available');};win.fetch=fail;win.open=fail;win.XMLHttpRequest=fail;win.WebSocket=fail;update(node);
 return {dom,win,doc,host,form,requests,update,get root(){return current;},get bindings(){return bindings.size;},dispose(){if(stopped)return;stopped=true;life.dispose();host.replaceChildren();},close(){this.dispose();dom.window.close();}};
}
