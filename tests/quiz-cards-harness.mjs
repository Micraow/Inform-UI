import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('../',import.meta.url));
const built=await build({stdin:{contents:`export {renderQuizCards} from './src/renderer/quiz-cards.ts';export {inspectQuizCards,suppliedQuizCorrect} from './src/core/quiz-cards.ts';export {renderGeneration} from './src/renderer/generation.ts';`,resolveDir:base},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
export const {renderQuizCards,inspectQuizCards,suppliedQuizCorrect,renderGeneration}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
export const questions=()=>[{id:'one',prompt:'Pick a setting',choices:[{id:'garden',label:'A quiet garden'},{id:'gallery',label:'A lively gallery'}]},{id:'two',prompt:'Pick an activity',choices:[{id:'walk',label:'An easy walk'},{id:'draw',label:'Sketching'}]}];
export const followup=(extra={})=>({type:'follow-up-quiz',label:'Plan preferences',title:'A few choices',questions:questions(),submitLabel:'Use these answers',submitQueryPrefix:'Use these supplied preferences:',...extra});
export const multiple=(extra={})=>({type:'multiple-choice-block-v2',label:'A supplied self-check',options:[{id:'a',label:'Three'},{id:'b',label:'Four'}],correctChoiceId:'b',...extra});
export const personality=(extra={})=>({type:'personality-quiz',label:'An outing idea quiz',title:'Choose an outing idea',description:'An informal, supplied example with no personality inference.',questions:questions(),generationComplete:true,available:true,started:false,initialIndex:0,initialAnswers:[],progressRevision:0,savedRevision:0,...extra});
export const completed=(extra={})=>personality({started:true,initialIndex:2,initialAnswers:[{questionId:'one',choiceId:'garden'},{questionId:'two',choiceId:'draw'}],progressRevision:3,savedRevision:3,resultRevision:3,resultStatus:'complete',result:{name:'A supplied outing suggestion',description:'This description was supplied by the author.',quote:'Make time for a small adventure.',paragraphs:['Try a short visit to a local garden.']},canCopy:true,copyText:'A supplied outing suggestion',canShare:true,canCreate:true,createPrompt:'Create an example about weekend plans',...extra});
export const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
let serial=0;
export function setup(node,{markup='<form><main></main></form>',shadow=false}={}){
 const dom=new JSDOM('<!doctype html>'+markup,{url:'https://fixture.test',pretendToBeVisual:true}),win=dom.window,doc=win.document;let host=doc.querySelector('main'),form=doc.querySelector('form');
 if(shadow){const tree=doc.body.appendChild(doc.createElement('div')).attachShadow({mode:'open'});tree.innerHTML='<form><main></main></form>';host=tree.querySelector('main');form=tree.querySelector('form');}
 let life,stopped=false,current;const bindings=new Set(),requests=[];
 const update=node=>{if(stopped)return;const old=life,generation=renderGeneration(()=>!stopped&&life===generation);life=generation;old?.dispose();
 const c={doc,prefix:'quiz-'+(++serial),lifecycle:generation,allocateInternalId:role=>'quiz-'+role+'-'+(++serial),element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},on:generation.listen,cleanup:generation.own,bind(fn){bindings.add(fn);return generation.own(()=>bindings.delete(fn));}};
 const owner=doc.createElement('article');owner.className='iui-root';current=generation.during(()=>renderQuizCards(c,node,owner,host));owner.append(current);host.replaceChildren(owner);for(const fn of [...bindings])fn();return current;};
 const fail=()=>{requests.push('external');throw new Error('External service accessed');};win.fetch=fail;win.XMLHttpRequest=fail;win.WebSocket=fail;win.open=fail;for(const name of ['share','clipboard','geolocation'])Object.defineProperty(win.navigator,name,{configurable:true,get:fail});update(node);
 return {dom,win,doc,host,form,requests,update,get root(){return current;},get bindings(){return bindings.size;},dispose(){if(stopped)return;stopped=true;life.dispose();host.replaceChildren();},close(){this.dispose();dom.window.close();}};
}
export const visible=element=>{for(let el=element;el;el=el.parentElement)if(el.hidden)return false;return true;};
export const control=(s,action)=>[...s.host.querySelectorAll('[data-quiz-action="'+action+'"]')].find(visible);
export const choice=(s,id)=>[...s.host.querySelectorAll('[data-quiz-choice="'+id+'"]')].find(visible);
