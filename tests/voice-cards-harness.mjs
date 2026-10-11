// Compiled source contract harness. Public mount coverage is an integration concern.
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({stdin:{contents:`export {renderVoiceCard} from './src/renderer/voice-cards.ts'; export {renderGeneration} from './src/renderer/generation.ts'; export {inspectVoiceCards} from './src/core/voice-cards.ts';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
export const {renderVoiceCard,renderGeneration,inspectVoiceCards}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
export const fixtureSpeak=(extra={})=>({type:'learning-speak-card',label:'Speaking practice',available:true,exercises:[{id:'one',text:'Good morning',phase:'success',playbackAvailable:true},{id:'two',text:'Good evening',phase:'idle',playbackAvailable:true}],...extra});
export const fixtureLauncher=(extra={})=>({type:'learning-voice-mode-launcher-card',label:'Voice practice',title:'Discuss the day',description:'A supplied conversation prompt.',startLabel:'Start a practice conversation',voiceSession:{id:'local-session'},available:true,...extra});
export const fixtureOffer=(extra={})=>({type:'offer-voice-conversation',label:'Conversation offer',buttonLabel:'Try a conversation',available:true,...extra});
export const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
let id=0;
export function setup(node,{markup='<form><main></main></form>',shadow=false}={}) {
 const dom=new JSDOM('<!doctype html>'+markup,{url:'https://fixture.test',pretendToBeVisual:true}),win=dom.window,doc=win.document;
 let host=doc.querySelector('main'),form=doc.querySelector('form');
 if(shadow){const target=doc.createElement('div');doc.body.append(target);const tree=target.attachShadow({mode:'open'});tree.innerHTML='<form><main></main></form>';host=tree.querySelector('main');form=tree.querySelector('form');}
 host.className='iui-root';let life,stopped=false,current,bindings=new Set(),requests=[];
 const update=next=>{
  if(stopped)return;
  const old=life;life=renderGeneration(()=>!stopped&&life===generation);const generation=life;old?.dispose();
  const c={doc,prefix:'voice-test-'+(++id),lifecycle:generation,element(tag,cls='',value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=String(value);return el;},bind(fn){bindings.add(fn);return generation.own(()=>bindings.delete(fn));},on:generation.listen,cleanup:generation.own,allocateInternalId:role=>'voice-'+role+'-'+(++id)};
  const owner=doc.createElement('article');owner.className='iui-root';current=generation.during(()=>renderVoiceCard(c,next,owner,host));owner.append(current);host.replaceChildren(owner);for(const fn of [...bindings])fn();return current;
 };
 const fail=()=>{requests.push('external');throw new Error('No external capability is permitted in this test');};
 win.fetch=fail;win.SpeechRecognition=fail;win.webkitSpeechRecognition=fail;win.SpeechSynthesisUtterance=fail;
 Object.defineProperty(win,'speechSynthesis',{configurable:true,get:fail});Object.defineProperty(win.navigator,'mediaDevices',{configurable:true,get:fail});
 update(node);
 return {dom,win,doc,host,form,requests,update,get root(){return current;},get life(){return life;},get bindings(){return bindings.size;},dispose(){if(stopped)return;stopped=true;life.dispose();host.replaceChildren();},close(){this.dispose();dom.window.close();}};
}
export const control=(s,action)=>s.host.querySelector('[data-voice-action="'+action+'"]');
