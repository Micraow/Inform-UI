import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
const {mount}=await import(process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME).href:new URL('../dist/browser.js',import.meta.url).href);
for(const action of ['update','dispose'])test('mounted carousel compensates RAF returned after '+action,()=>{
 const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),doc=body=>({version:'iui/1',body:[body]});
 const ctl=mount(host,doc({type:'text',value:'Initial'}),{styles:false}),canceled=[];let calls=0;
 dom.window.requestAnimationFrame=()=>{calls++;action==='update'?ctl.update(doc({type:'text',value:'Replacement'})):ctl.dispose();return 909;};
 dom.window.cancelAnimationFrame=id=>canceled.push(id);
 try{ctl.update(doc({type:'carousel',label:'Ordinary collection',children:[{type:'text',value:'One'},{type:'text',value:'Two'}]}));assert.equal(calls,1);assert.deepEqual(canceled,[909]);assert.equal(host.textContent,action==='update'?'Replacement':'');}finally{ctl.dispose();dom.window.close();}
});
