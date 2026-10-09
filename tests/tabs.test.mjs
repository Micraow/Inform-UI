import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {mount,validateDocument,compileHtml} from '../dist/index.js';
const panel=(id,label=id,children=[],extra={})=>({type:'tab-panel',id,label,children,...extra});
const tabs=(extra={})=>({type:'tab-group',label:'Local views',children:[panel('first','First',[{type:'text',value:'one'}]),panel('off','Disabled',[],{disabled:true}),panel('last','Last',[{type:'text',value:'two'}])],...extra});
const doc=node=>({version:'iui/1',state:{count:0,other:0},body:[node]});
const setup=(n=tabs())=>{const dom=new JSDOM('<main></main>',{pretendToBeVisual:true}),host=dom.window.document.querySelector('main'),c=mount(host,doc(n));return{dom,host,c,buttons:[...host.querySelectorAll('[role=tab]')],panels:[...host.querySelectorAll('[role=tabpanel]')]};};
const key=(x,index,value,extra={})=>x.buttons[index].dispatchEvent(new x.dom.window.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...extra}));

test('tabs schema and semantics enforce native structure, finite panels and enabled initial selection',()=>{
 for(const n of [tabs(),tabs({initial:'last'}),tabs({children:[panel('only')]})])assert.equal(validateDocument(doc(n)).ok,true);
 for(const n of [panel('orphan'),tabs({children:[]}),tabs({children:[{type:'text',value:'wrong'}]}),tabs({children:Array.from({length:21},(_,i)=>panel('p'+i))}),tabs({children:[panel('off','Off',[],{disabled:true})]}),tabs({initial:'off'}),tabs({initial:'missing'}),tabs({children:[panel('same'),panel('same')]}),tabs({orientation:'vertical'}),tabs({children:[panel('a','',[])]})])assert.equal(validateDocument(doc(n)).ok,false,JSON.stringify(n));
 assert.equal(validateDocument(doc(tabs({children:Array.from({length:20},(_,i)=>panel('p'+i))}))).ok,true);
});
test('hidden panel ordinary semantics are enforced and a form cannot split across tab panels',()=>{
 const hidden=tabs();hidden.children[2].children=[{type:'text',value:{$:'missing'}}];assert.equal(validateDocument(doc(hidden)).ok,false);
 const form={type:'form',label:'Safe local',children:[{type:'input',kind:'text',label:'Text',bind:'s'}]};assert.equal(validateDocument({...doc(tabs({children:[panel('a','A',[form])]})),state:{s:''}}).ok,true);
 const bad={version:'iui/1',state:{s:''},body:[{type:'form',label:'Outer',children:[tabs({children:[panel('a','A',[{type:'input',kind:'text',label:'Text',bind:'s'}])]} )]}]};const checked=validateDocument(bad);assert.equal(checked.ok,false);assert.ok(checked.issues.some(i=>i.code==='TAB_FORM'));
});
test('native roles, IDs and single tab stop reflect exact selection; panels retain authored IDs',()=>{
 const x=setup(tabs({initial:'last'}));assert.equal(x.host.querySelector('[role=tablist]').getAttribute('aria-label'),'Local views');assert.deepEqual(x.buttons.map(b=>b.tabIndex),[-1,-1,0]);assert.deepEqual(x.panels.map(p=>p.hidden),[true,true,false]);
 x.buttons.forEach((b,i)=>{assert.equal(b.type,'button');assert.equal(b.getAttribute('aria-controls'),x.panels[i].id);assert.equal(x.panels[i].getAttribute('aria-labelledby'),b.id);assert.ok(x.panels[i].id.endsWith('-'+['first','off','last'][i]));});assert.equal(x.buttons[1].disabled,true);assert.notEqual(x.dom.window.document.activeElement,x.buttons[2]);x.c.dispose();
});
test('pointer and native keyboard navigation wrap enabled tabs; modifiers and unrelated keys do nothing',()=>{
 const x=setup();x.buttons[0].focus();key(x,0,'ArrowRight');assert.equal(x.buttons[2].getAttribute('aria-selected'),'true');assert.equal(x.dom.window.document.activeElement,x.buttons[2]);key(x,2,'ArrowRight');assert.equal(x.dom.window.document.activeElement,x.buttons[0]);key(x,0,'End');assert.equal(x.dom.window.document.activeElement,x.buttons[2]);key(x,2,'Home');assert.equal(x.dom.window.document.activeElement,x.buttons[0]);key(x,0,'ArrowRight',{ctrlKey:true});assert.equal(x.buttons[0].getAttribute('aria-selected'),'true');key(x,0,'ArrowDown');assert.equal(x.buttons[0].getAttribute('aria-selected'),'true');x.buttons[2].click();assert.equal(x.panels[2].hidden,false);x.buttons[1].dispatchEvent(new x.dom.window.Event('click'));assert.equal(x.panels[2].hidden,false);x.c.dispose();
});
test('RTL arrow direction is logical, while Home/End retain authored order',()=>{
 const x=setup(),native=x.dom.window.getComputedStyle.bind(x.dom.window);x.dom.window.getComputedStyle=el=>el.getAttribute?.('role')==='tablist'?{direction:'rtl'}:native(el);x.buttons[0].focus();key(x,0,'ArrowLeft');assert.equal(x.dom.window.document.activeElement,x.buttons[2]);key(x,2,'Home');assert.equal(x.dom.window.document.activeElement,x.buttons[0]);key(x,0,'End');assert.equal(x.dom.window.document.activeElement,x.buttons[2]);x.c.dispose();
});
test('state, numeric drafts, running timers and DOM survive hidden panels without focus theft',async()=>{
 const first=panel('first','Edit',[{type:'form',label:'Practice',children:[{type:'input',kind:'number',label:'Count',bind:'count',min:0,max:10,step:2}]},{type:'timer',durationMs:10000},{type:'popover',label:'Help',children:[{type:'text',value:'Local'}]}]);
 const x=setup(tabs({children:[first,panel('last','Other',[{type:'text',value:{$:'count'}}])]})),input=x.host.querySelector('input'),timer=x.host.querySelector('.iui-time'),overlay=x.host.querySelector('.iui-overlay-popover');input.value='3';input.dispatchEvent(new x.dom.window.Event('input',{bubbles:true}));timer.querySelector('[data-time-action=start]').click();overlay.querySelector('.iui-overlay-trigger').click();assert.equal(overlay.dataset.open,'true');x.buttons[1].click();await new Promise(r=>x.dom.window.queueMicrotask(r));assert.equal(overlay.dataset.open,'false');assert.equal(timer.dataset.status,'running');assert.equal(x.c.getState().count,0);x.c.setState({other:1});assert.equal(x.dom.window.document.activeElement,x.buttons[1]);x.buttons[0].click();assert.equal(x.host.querySelector('input'),input);assert.equal(input.value,'3');assert.equal(x.host.querySelector('.iui-time'),timer);assert.equal(timer.dataset.status,'running');x.c.dispose();x.dom.window.close();
});
test('foreign documents, atomic updates and disposal retain established controller lifecycle',()=>{
 const a=setup(),b=setup();assert.notEqual(a.buttons[0].id,b.buttons[0].id);assert.equal(a.buttons[0].ownerDocument,a.dom.window.document);a.buttons[2].click();const root=a.host.firstElementChild,html=a.host.innerHTML;assert.throws(()=>a.c.update(doc(tabs({initial:'off'}))));assert.equal(a.host.firstElementChild,root);assert.equal(a.host.innerHTML,html);assert.equal(a.dom.window.document.activeElement,a.buttons[2]);a.c.setState({count:1});assert.equal(a.dom.window.document.activeElement,a.buttons[2]);a.c.update(doc(tabs()));assert.equal(root.isConnected,false);a.buttons[2].click();assert.equal(a.host.querySelector('.iui-tab-group').dataset.active,'first');a.c.dispose();b.c.dispose();assert.equal(a.host.childElementCount,0);
});
test('compiled tabs are deterministic and execute without remote assets or host adapters',async()=>{
 const input=doc(tabs()),before=structuredClone(input),html=await compileHtml(input);assert.equal(await compileHtml(input),html);assert.deepEqual(input,before);const dom=new JSDOM(html,{runScripts:'dangerously'}),buttons=dom.window.document.querySelectorAll('[role=tab]');assert.equal(buttons.length,3);buttons[2].click();assert.equal(dom.window.document.querySelector('.iui-tab-group').dataset.active,'last');dom.window.close();
});

for(const direction of ['ltr','negative','reverse','default'])test(`tab keyboard reveals only its local rail under ${direction} and scaled coordinates`,()=>{
 const x=setup(),list=x.host.querySelector('[role=tablist]'),isRTL=direction!=='ltr';let raw=isRTL&&direction==='default'?200:0;
 Object.defineProperties(list,{clientWidth:{value:100},offsetWidth:{value:100},clientLeft:{value:0},scrollWidth:{value:300},scrollLeft:{get:()=>raw,set:v=>{raw=direction==='negative'?Math.max(-200,Math.min(0,v)):Math.max(0,Math.min(200,v));}}});
 const logical=()=>!isRTL?raw:direction==='negative'?-raw:direction==='default'?200-raw:raw;
 list.getBoundingClientRect=()=>({left:10,right:210,width:200});x.buttons.forEach((b,i)=>{b.getBoundingClientRect=()=>{const left=10+(!isRTL?i*100-logical():logical()-i*100)*2;return{left,right:left+200,width:200};};});
 const get=x.dom.window.getComputedStyle.bind(x.dom.window);x.dom.window.getComputedStyle=el=>el===list?{direction:isRTL?'rtl':'ltr'}:get(el);
 x.buttons[0].focus();key(x,0,'End');assert.equal(logical(),200);assert.equal(x.dom.window.document.activeElement,x.buttons[2]);const kept=raw;x.c.setState({other:1});assert.equal(raw,kept);key(x,2,'Home');assert.equal(logical(),0);assert.equal(x.dom.window.scrollX,0);assert.equal(x.dom.window.scrollY,0);x.c.dispose();
});
