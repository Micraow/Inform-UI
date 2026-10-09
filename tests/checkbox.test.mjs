import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Ajv from 'ajv/dist/2020.js';
import {readFile} from 'node:fs/promises';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
const box=(bind='checked',extra={})=>({type:'input',kind:'checkbox',label:'Practice switch',bind,...extra});
const spec=(extra={},state={checked:false,other:0},children=[box('checked',extra)])=>({version:'iui/1',state,body:[{type:'form',label:'Practice',action:'save',children}]});
const setup=(s=spec(),options={})=>{const dom=new JSDOM('<div id="host"></div>');const host=dom.window.document.querySelector('#host');const c=mount(host,s,options);return {dom,host,c,input:host.querySelector('input'),form:host.querySelector('form')};};
const event=(x,target,type)=>target.dispatchEvent(new x.dom.window.Event(type,{bubbles:true,cancelable:true}));
const change=(x,value)=>{x.input.checked=value;event(x,x.input,'change');};
const submit=x=>event(x,x.form,'submit');
const error=x=>x.host.querySelector('.iui-field-error').textContent;
const settle=async()=>{await Promise.resolve();await Promise.resolve();};

test('strict schema rejects every text/numeric-only checkbox attribute; public validator binds booleans only',async()=>{
 const schema=JSON.parse(await readFile(new URL('../src/schema/iui.schema.json',import.meta.url)));const validate=new Ajv({strict:true,allErrors:true}).compile(schema);
 for(const value of [false,true])assert.equal(validateDocument(spec({}, {checked:value})).ok,true);
 for(const value of ['',0,1,'false',null,[],{}])assert.equal(validateDocument(spec({}, {checked:value})).ok,false,JSON.stringify(value));
 for(const [key,value] of Object.entries({placeholder:'',min:0,max:1,step:1,minLength:0,maxLength:1})) {const s=spec({[key]:value});assert.equal(validate(s),false,key);assert.equal(validateDocument(s).ok,false,key);}
 for(const extra of [{disabled:'true'},{error:false},{indeterminate:true}])assert.equal(validateDocument(spec(extra)).ok,false);
});
test('real Forms registry validates required, first-invalid focus, values boolean, and label/hint associations',async()=>{
 let values;const x=setup(spec({required:true,hint:'Local practice'}),{actions:{save:args=>{values=args.values;}}});
 assert.equal(x.input.type,'checkbox');assert.equal(x.input.required,true);assert.equal(x.host.querySelector('label').htmlFor,x.input.id);
 for(const id of x.input.getAttribute('aria-describedby').split(' '))assert.ok(x.dom.window.document.getElementById(id));
 submit(x);assert.equal(x.form.dataset.status,'invalid');assert.equal(x.dom.window.document.activeElement,x.input);assert.match(error(x),/required/);
 change(x,true);assert.equal(x.c.getState().checked,true);assert.equal(error(x),'');submit(x);await settle();assert.deepEqual(values,{checked:true});assert.equal(x.form.dataset.status,'success');
 change(x,false);assert.equal(x.c.getState().checked,false);assert.equal(x.form.dataset.status,'idle');assert.match(error(x),/required/);x.c.dispose();
});
test('native label click publishes exactly once and unrelated updates preserve identity/focus',()=>{
 let calls=0;const x=setup(spec(),{});x.input.addEventListener('change',()=>calls++);x.input.focus();x.host.querySelector('label').click();assert.equal(x.c.getState().checked,true);assert.equal(calls,1);
 x.c.setState({other:1});assert.equal(x.host.querySelector('input'),x.input);assert.equal(x.dom.window.document.activeElement,x.input);assert.equal(x.input.checked,true);x.c.dispose();
});
test('host false remains valid, same-value overwrite clears errors, required stays touched until reset',()=>{
 const x=setup(spec({required:true}));change(x,true);x.c.setState({checked:false});assert.equal(x.input.checked,false);assert.match(error(x),/required/);x.c.setState({checked:false});assert.match(error(x),/required/);
 x.form.reset();assert.equal(error(x),'');change(x,true);x.host.querySelector('button[type=button]').click();assert.equal(x.input.checked,false);assert.equal(error(x),'');change(x,true);x.c.update(spec({required:true}));assert.equal(x.host.querySelector('input').checked,false);assert.equal(error(x),'');x.c.dispose();
});
test('inherited disabled fieldsets restore forged checks and do not block submission or leak values',async()=>{
 let values;const s=spec({}, {checked:false,locked:true},[{type:'field',label:'Group',disabled:{$:'locked'},children:[box('checked',{required:true})]}]);const x=setup(s,{actions:{save:args=>{values=args.values;}}});assert.equal(x.input.matches(':disabled'),true);change(x,true);assert.equal(x.c.getState().checked,false);assert.equal(x.input.checked,false);submit(x);await settle();assert.deepEqual(values,{});assert.equal(x.form.dataset.status,'success');x.c.setState({locked:false});submit(x);assert.equal(x.form.dataset.status,'invalid');x.c.dispose();
});
test('bound host error and disabled maintain established validation semantics',()=>{
 const x=setup(spec({error:{$:'server'},disabled:{$:'locked'}},{checked:false,server:'Try again',locked:false}));assert.equal(error(x),'Try again');change(x,true);assert.equal(error(x),'Try again');x.c.setState({locked:true});assert.equal(error(x),'');x.c.setState({server:'',locked:false});assert.equal(error(x),'');x.c.dispose();
});
test('globally rejected derived progress change restores accepted checked state and focus atomically',()=>{
 const s=spec({}, {checked:false,other:1});s.body.push({type:'loading',label:'Progress',progress:{op:'if',args:[{$:'checked'},101,0]}});const x=setup(s);x.input.focus();change(x,true);assert.deepEqual(x.c.getState(),{checked:false,other:1});assert.equal(x.input.checked,false);assert.equal(x.dom.window.document.activeElement,x.input);assert.notEqual(error(x),'');x.c.setState({checked:false});assert.equal(error(x),'');assert.throws(()=>x.c.setState({checked:true,other:2}));assert.deepEqual(x.c.getState(),{checked:false,other:1});x.c.dispose();
});
test('pending submit ignores repeats, cancel aborts and stale completion does not overwrite status',async()=>{
 let resolve,signal,calls=0;const work=new Promise(r=>resolve=r);const x=setup(spec(),{actions:{save:args=>{calls++;signal=args.signal;return work;}}});change(x,true);submit(x);submit(x);assert.equal(calls,1);assert.equal(x.input.matches(':disabled'),true);change(x,false);assert.equal(x.c.getState().checked,true);x.host.querySelector('button[type=button]').click();assert.equal(signal.aborted,true);assert.equal(x.input.checked,false);resolve();await settle();assert.equal(x.form.dataset.status,'cancelled');x.c.dispose();
});
test('independent foreign documents have unique label IDs and teardown removes listeners',()=>{
 const a=setup(spec()),b=setup(spec());assert.notEqual(a.input.id,b.input.id);a.c.dispose();change(a,true);assert.throws(()=>a.c.getState(),/disposed/);change(b,true);assert.equal(b.c.getState().checked,true);b.c.dispose();
});
test('compiler executes offline checkbox through actual standalone and rejects invalid contract',async()=>{
 const s=spec({required:true});delete s.body[0].action;const html=await compileHtml(s);const dom=new JSDOM(html,{runScripts:'dangerously'});const input=dom.window.document.querySelector('input');assert.ok(input);assert.equal(input.checked,false);dom.window.document.querySelector('label').click();assert.equal(input.checked,true);const form=dom.window.document.querySelector('form');form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.equal(form.dataset.status,'success');await assert.rejects(()=>compileHtml(spec({placeholder:'no'})));dom.window.close();
});
test('document reset button uses the real shared reset lifecycle and first invalid follows field order',()=>{
 const s=spec({}, {checked:false,second:false},[box('checked',{required:true}),box('second',{required:true}),{type:'button',label:'Reset document',action:{kind:'reset'}}]);const x=setup(s);submit(x);assert.equal(x.dom.window.document.activeElement,x.input);change(x,true);submit(x);assert.equal(x.dom.window.document.activeElement,x.host.querySelector('[data-bind=second]'));const second=x.host.querySelector('[data-bind=second]');second.checked=true;event(x,second,'change');x.host.querySelector('[data-iui=button]').click();assert.deepEqual(x.c.getState(),{checked:false,second:false});assert.equal(x.input.checked,false);assert.equal(second.checked,false);for(const err of x.host.querySelectorAll('.iui-field-error'))assert.equal(err.textContent,'');x.c.dispose();
});
test('standalone checkbox and readonly host state type authority use same field semantics',()=>{
 const s={version:'iui/1',state:{checked:false},body:[box('checked',{required:true})]};const x=setup(s);change(x,true);assert.equal(x.c.getState().checked,true);for(const wrong of [0,1,'true',null])assert.throws(()=>x.c.setState({checked:wrong}));assert.equal(x.input.checked,true);change(x,false);assert.match(error(x),/required/);x.c.dispose();
});
