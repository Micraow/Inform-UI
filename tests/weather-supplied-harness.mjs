// Exercise domain sources independently of central schema/registry integration.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('../',import.meta.url));
const result=await build({stdin:{contents:`export {renderWeather,weatherTemperature,weatherHours,weatherCoordinates} from './src/renderer/weather.ts';export {renderGeneration} from './src/renderer/generation.ts';export {presentationLabels} from './src/renderer/presentation.ts';export {inspectWeatherSupplied} from './src/core/weather-supplied.ts';export {inspectExtension} from './src/core/extensions.ts';`,resolveDir:base},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
export const {renderWeather,renderGeneration,presentationLabels,inspectWeatherSupplied,inspectExtension,weatherTemperature,weatherHours,weatherCoordinates}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const original=JSON.parse(await readFile(new URL('../examples/weather.json',import.meta.url),'utf8')).body[0];
export const fixture=(extra={})=>({...structuredClone(original),...extra});
export const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
let id=0;
export function setup(node,{markup='<form><main></main></form>',shadow=false}={}) {
 const dom=new JSDOM('<!doctype html>'+markup,{url:'https://fixture.test',pretendToBeVisual:true}),win=dom.window,doc=win.document;
 let host=doc.querySelector('main'),form=doc.querySelector('form');
 if(shadow){const tree=doc.body.appendChild(doc.createElement('div')).attachShadow({mode:'open'});tree.innerHTML='<form><main></main></form>';host=tree.querySelector('main');form=tree.querySelector('form');}
 host.className='iui-root';let life,stopped=false,current;const bindings=new Set(),requests=[];
 const update=next=>{if(stopped)return;const old=life,generation=renderGeneration(()=>!stopped&&life===generation);life=generation;old?.dispose();
 const c={doc,prefix:'weather-test-'+(++id),lifecycle:generation,labels:()=>presentationLabels(host),element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},svg(tag,attrs={}){const el=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const[key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;},bind(fn){bindings.add(fn);return generation.own(()=>bindings.delete(fn));},on:generation.listen,cleanup:generation.own,allocateInternalId:role=>'weather-'+role+'-'+(++id)};
 current=generation.during(()=>renderWeather(c,next));host.replaceChildren(current);for(const fn of [...bindings])fn();return current;};
 const fail=()=>{requests.push('external');throw new Error('Unexpected external capability');};win.fetch=fail;win.XMLHttpRequest=fail;Object.defineProperty(win.navigator,'geolocation',{configurable:true,get:fail});Object.defineProperty(win.navigator,'share',{configurable:true,get:fail});Object.defineProperty(win.navigator,'clipboard',{configurable:true,get:fail});
 update(node);return {dom,win,doc,host,form,requests,update,get root(){return current;},get bindings(){return bindings.size;},dispose(){if(stopped)return;stopped=true;life.dispose();host.replaceChildren();},close(){this.dispose();dom.window.close();}};
}
export const control=(s,action,value)=>s.host.querySelector('[data-weather-action="'+action+'"]'+(value===undefined?'':'[data-value="'+value+'"]'));
