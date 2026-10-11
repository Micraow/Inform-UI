import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{JSDOM,VirtualConsole}from'jsdom';import{mount}from'../dist/index.js';
const cases=[
 ['follow-up','follow-up-card-group',0,'.iui-follow-up-card','iui:follow-up-card'],
 ['recommendation','recommendation-card',0,'.iui-recommendation-card button','iui:recommendation-card'],
 ['recurring','ledger-records',1,'.iui-recurring-review','iui:recurring-review'],
 ['transaction','transaction-detail',0,'.iui-transaction-detail-related-item','iui:transaction-detail']
];
for(const[name,file,index,selector,eventName]of cases)test(`${name} admission getter reentry is single-flight`,async()=>{const spec=JSON.parse(await readFile(new URL(`../examples/${file}.json`,import.meta.url)));spec.body=[spec.body[index]];const errors=[],v=new VirtualConsole();v.on('jsdomError',e=>errors.push(e));const dom=new JSDOM('<main></main>',{virtualConsole:v}),host=dom.window.document.querySelector('main'),c=mount(host,spec,{styles:false}),b=host.querySelector(selector);assert.ok(b,selector);const get=b.getAttribute.bind(b);let reentered=false,count=0;b.getAttribute=function(name){if(name==='aria-disabled'&&!reentered){reentered=true;b.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));}return get(name);};host.addEventListener(eventName,()=>count++);try{b.click();assert.equal(reentered,true);assert.equal(count,1);}finally{c.dispose();dom.window.close();assert.deepEqual(errors,[]);}});

for(const[name,file,index,selector,eventName]of cases)for(const mode of ['update','dispose'])test(`${name} ${mode} in admission does not emit and a fresh generation remains usable`,async()=>{
 const spec=JSON.parse(await readFile(new URL(`../examples/${file}.json`,import.meta.url)));spec.body=[spec.body[index]];
 const errors=[],v=new VirtualConsole();v.on('jsdomError',e=>errors.push(e));const dom=new JSDOM('<main></main>',{virtualConsole:v}),host=dom.window.document.querySelector('main'),c=mount(host,spec,{styles:false}),b=host.querySelector(selector),get=b.getAttribute.bind(b);let entered=false,count=0;
 host.addEventListener(eventName,()=>count++);b.getAttribute=function(key){if(key==='aria-disabled'&&!entered){entered=true;mode==='update'?c.update({version:'iui/1',state:{newest:1},body:[{type:'text',value:'Newest'}]}):c.dispose();}return get(key);};
 try{b.click();assert.equal(entered,true);assert.equal(count,0);assert.equal(host.textContent,mode==='update'?'Newest':'');if(mode==='update'){assert.deepEqual(c.getState(),{newest:1});c.update(spec);host.querySelector(selector).click();assert.equal(count,1);}else{const fresh=mount(host,spec,{styles:false});try{host.querySelector(selector).click();assert.equal(count,1);}finally{fresh.dispose();}}}finally{c.dispose();dom.window.close();assert.deepEqual(errors,[]);}
});
for(const[name,file,index,selector,eventName]of cases)test(`${name} blocked and canceled admission releases for the next deliberate activation`,async()=>{
 const spec=JSON.parse(await readFile(new URL(`../examples/${file}.json`,import.meta.url)));spec.body=[spec.body[index]];const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),c=mount(host,spec,{styles:false}),b=host.querySelector(selector);let count=0;
 host.addEventListener(eventName,e=>{count++;if(count===1)e.preventDefault();});try{b.setAttribute('aria-disabled','true');b.click();assert.equal(count,0);b.removeAttribute('aria-disabled');b.click();assert.equal(count,1);b.click();assert.equal(count,2);}finally{c.dispose();dom.window.close();}
});
for(const[name,file,index,selector,eventName]of cases)for(const stage of ['constructor','dispatch'])test(`${name} ${stage} real event reentry cannot bypass the component gate`,async()=>{
 const spec=JSON.parse(await readFile(new URL(`../examples/${file}.json`,import.meta.url)));spec.body=[spec.body[index]];const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),c=mount(host,spec,{styles:false}),b=host.querySelector(selector),Ctor=dom.window.CustomEvent;let count=0,constructions=0,reentered=false;
 const reenter=()=>{if(!reentered){reentered=true;b.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));}};
 dom.window.CustomEvent=class extends Ctor{constructor(...args){super(...args);constructions++;if(stage==='constructor')reenter();}};
 host.addEventListener(eventName,()=>{count++;if(stage==='dispatch')reenter();});try{b.click();assert.equal(reentered,true);assert.equal(count,1);assert.equal(constructions,1);}finally{c.dispose();dom.window.close();}
});
