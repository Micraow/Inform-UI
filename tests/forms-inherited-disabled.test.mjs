import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM,VirtualConsole} from 'jsdom';import {mount} from '../dist/index.js';
const document={version:'iui/1',state:{note:'original',amount:6},body:[{type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},{type:'input',kind:'number',label:'Amount',bind:'amount',min:0}]}]};
function setup(t,actions={},legend=false){const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));const dom=new JSDOM('<fieldset id="outer">'+(legend?'<legend><div id="host"></div></legend>':'<div id="host"></div>')+'</fieldset>',{pretendToBeVisual:true,virtualConsole:console}),doc=dom.window.document,host=doc.getElementById('host'),outer=doc.getElementById('outer'),c=mount(host,document,{actions}),form=host.querySelector('form'),submit=host.querySelector('button[type=submit]'),cancel=host.querySelector('.iui-form-actions button[type=button]');t.after(()=>{c.dispose();dom.window.close();});return{dom,doc,host,outer,c,form,submit,cancel,errors};}
const send=(s,target,type)=>target.dispatchEvent(new s.dom.window.Event(type,{bubbles:true,cancelable:true}));
const click=(s,target)=>target.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
const turn=async()=>{await Promise.resolve();await Promise.resolve();};
function fill(s,bind,value){const input=s.host.querySelector(`[data-bind=${bind}]`);input.value=value;send(s,input,'input');return input;}

test('external native disabled fieldset blocks forged submit, Cancel and reset without changing values or drafts',async t=>{
 let calls=0;const s=setup(t,{save:()=>calls++});fill(s,'note','edited');const amount=fill(s,'amount','-1');send(s,amount,'blur');s.outer.disabled=true;
 assert.equal(s.submit.disabled,false);assert.equal(s.submit.matches(':disabled'),true);const state=s.c.getState(),html=s.host.innerHTML;
 send(s,s.form,'submit');click(s,s.cancel);s.form.reset();await turn();assert.equal(calls,0);assert.deepEqual(s.c.getState(),state);assert.equal(s.host.innerHTML,html);assert.equal(amount.value,'-1');assert.equal(s.errors.length,0);
});
test('dynamic re-enable restores native submission and cancellation with the exact accepted snapshot',async t=>{
 const values=[];const s=setup(t,{save:({values:v})=>values.push(v)});fill(s,'note','edited');s.outer.disabled=true;send(s,s.form,'submit');await turn();assert.equal(values.length,0);
 s.outer.disabled=false;send(s,s.form,'submit');await turn();assert.deepEqual(values,[{note:'edited',amount:6}]);assert.equal(s.form.dataset.status,'success');assert.equal(Object.isFrozen(values[0]),true);s.outer.disabled=true;click(s,s.cancel);assert.equal(s.c.getState().note,'edited');s.outer.disabled=false;click(s,s.cancel);assert.equal(s.c.getState().note,'original');assert.equal(s.form.dataset.status,'cancelled');
});
test('native first-legend disabled-fieldset exception remains enabled',async t=>{
 let calls=0;const s=setup(t,{save:()=>calls++},true);s.outer.disabled=true;assert.equal(s.submit.matches(':disabled'),false);send(s,s.form,'submit');await turn();assert.equal(calls,1);assert.equal(s.form.dataset.status,'success');
});
test('pending outer disable does not accept forged Cancel/reset; enabled Cancel aborts once and late completion is inert',async t=>{
 let resolve,signal,calls=0,events=0;const s=setup(t,{save:context=>{calls++;signal=context.signal;return new Promise(yes=>resolve=yes);}});s.host.addEventListener('iui:submit',()=>events++);fill(s,'note','edited');send(s,s.form,'submit');s.outer.disabled=true;const html=s.host.innerHTML;click(s,s.cancel);s.form.reset();send(s,s.form,'submit');assert.equal(calls,1);assert.equal(signal.aborted,false);assert.equal(s.host.innerHTML,html);assert.equal(s.c.getState().note,'edited');s.outer.disabled=false;click(s,s.cancel);assert.equal(signal.aborted,true);assert.equal(s.form.dataset.status,'cancelled');resolve();await turn();assert.equal(events,0);assert.equal(s.form.dataset.status,'cancelled');
});
test('inherited-disabled neighboring button cannot defer another form field blur validation',t=>{
 const s=setup(t);const root=s.host.querySelector('.iui-root'),fieldset=s.doc.createElement('fieldset'),button=s.doc.createElement('button');fieldset.disabled=true;button.type='button';button.textContent='Unavailable neighbor';fieldset.append(button);root.append(fieldset);const amount=fill(s,'amount','-1');amount.focus();const pointer=new s.dom.window.Event('pointerdown',{bubbles:true,cancelable:true});Object.defineProperties(pointer,{button:{value:0},isPrimary:{value:true},pointerId:{value:1}});button.dispatchEvent(pointer);amount.dispatchEvent(new s.dom.window.FocusEvent('blur',{relatedTarget:button}));assert.equal(amount.getAttribute('aria-invalid'),'true');assert.match(s.host.querySelectorAll('.iui-field-error')[1].textContent,/minimum/);
});
for(const mode of ['dispose','update'])test(`adapter getter ${mode} cannot start a retired action or repaint the retired form`,async t=>{
 let s,calls=0,signal;const actions={get save(){if(mode==='dispose')s.c.dispose();else s.c.update(document);return context=>{calls++;signal=context.signal;return new Promise(()=>{});};}};s=setup(t,actions);const old=s.form,before=old.outerHTML;send(s,old,'submit');await turn();assert.equal(calls,0);assert.equal(signal,undefined);assert.equal(old.outerHTML,before);if(mode==='dispose')assert.equal(s.host.childElementCount,0);else assert.equal(s.host.querySelector('form').dataset.status,'idle');assert.equal(s.errors.length,0);
});
test('throwing and reentrant adapter getters settle locally without duplicate operations and recover on retry',async t=>{
 let s,gets=0,calls=0,throws=true;const actions={get save(){gets++;if(throws)throw Error('Synthetic lookup failure');if(gets===2)send(s,s.form,'submit');return()=>calls++;}};s=setup(t,actions);send(s,s.form,'submit');await turn();assert.equal(calls,0);assert.equal(s.form.dataset.status,'error');assert.equal(s.errors.length,0);throws=false;send(s,s.form,'submit');await turn();assert.equal(gets,2);assert.equal(calls,1);assert.equal(s.form.dataset.status,'success');
});
test('adapter getter that disables the ancestor cannot begin a newly disabled operation',async t=>{
 let s,calls=0;const actions={get save(){s.outer.disabled=true;return()=>calls++;}};s=setup(t,actions);send(s,s.form,'submit');await turn();assert.equal(calls,0);assert.equal(s.form.dataset.status,'idle');
});
test('synchronous abort listeners cannot start a nested operation midway through Cancel reset',async t=>{
 let s,calls=0;const actions={save:({signal})=>{calls++;signal.addEventListener('abort',()=>send(s,s.form,'submit'),{once:true});return new Promise(()=>{});}};s=setup(t,actions);fill(s,'note','edited');send(s,s.form,'submit');click(s,s.cancel);await turn();assert.equal(calls,1);assert.equal(s.form.dataset.status,'cancelled');assert.equal(s.c.getState().note,'original');assert.equal(s.form.getAttribute('aria-busy'),'false');
});
