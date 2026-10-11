import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const {mount}=await import(process.env.QA_RUNTIME??'../dist/index.js');
const sample=JSON.parse(await readFile(new URL('../examples/related-questions.json',import.meta.url)));
for(const shadow of [false,true])for(const boundary of ['form','event-target'])for(const mode of ['new-input','update','dispose'])test(`native ${shadow?'shadow':'document'} reset honors ${mode} during ${boundary} getter`,async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM('<div id="outer"></div>',{virtualConsole:vc});const doc=dom.window.document,outer=doc.querySelector('#outer'),scope=shadow?outer.attachShadow({mode:'open'}):outer;
 scope.innerHTML='<form><main></main></form>';const form=scope.querySelector('form'),host=scope.querySelector('main');
 let ctl,input,once=false;
 const interrupt=()=>{if(once)return;once=true;if(mode==='new-input')type('literal');else if(mode==='update')ctl.update({version:'iui/1',state:{latest:true},body:[{type:'text',value:'Newest'}]});else ctl.dispose();};
 if(boundary==='event-target')(shadow?scope:doc).addEventListener('reset',event=>{const descriptor=Object.getOwnPropertyDescriptor(dom.window.Event.prototype,'target');Object.defineProperty(event,'target',{configurable:true,get(){interrupt();return descriptor.get.call(this);}});},{capture:true,once:true});
 ctl=mount(host,sample,{styles:false});input=host.querySelector('input');const descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'form');
 const type=value=>{input.value=value;input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 type('scope');
 if(boundary==='form')Object.defineProperty(input,'form',{configurable:true,get(){interrupt();return descriptor.get.call(this);}});
 try{form.reset();await Promise.resolve();await Promise.resolve();assert.equal(once,true);if(mode==='new-input')assert.equal(input.value,'literal');else {assert.equal(host.textContent,mode==='update'?'Newest':'');if(mode==='update')assert.deepEqual(ctl.getState(),{latest:true});}assert.deepEqual(errors,[]);}
 finally{ctl.dispose();dom.window.close();}
});
