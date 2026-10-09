import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
import {createSchemaSubset} from '../scripts/schema-subsets.mjs';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const node=(extra={})=>({type:'favicon',label:'Supplied source',...extra});
const spec=(extra={})=>({version:'iui/1',state:{other:0},body:[node(extra)]});
const setup=(s=spec())=>{const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host'),c=mount(host,s);return {dom,host,c,root:host.querySelector('.iui-favicon')};};
const event=(x,target,name)=>target.dispatchEvent(new x.dom.window.Event(name,{bubbles:false}));
const finish=(x,image=x.root.querySelector('img'),width=16)=>{Object.defineProperty(image,'naturalWidth',{configurable:true,value:width});event(x,image,'load');};

test('favicon strict bounds, immutable base schema ownership and safe provided-image policy',async()=>{
 const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));const validate=new Ajv({strict:true}).compile(createSchemaSubset(full,index.nodeOwners,['base']));
 for(const extra of [{},{fallback:'UI',size:'sm'},{fallback:'😀',size:'lg'},{src:png},{src:'https://example.com/icon.png'}]){assert.equal(validate(spec(extra)),true);assert.equal(validateDocument(spec(extra)).ok,true);}
 for(const extra of [{label:''},{fallback:''},{fallback:'abc'},{size:'large'},{src:''},{src:'x'.repeat(12001)},{onClick:'bad'},{url:'https://example.com'}]){assert.equal(validate(spec(extra)),false);assert.equal(validateDocument(spec(extra)).ok,false);}
 for(const src of ['relative.png','//example.com/x.png','javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,','https://user:pass@example.com/x.png','https://example.com/\nimg','file:///tmp/a.png']){const result=validateDocument(spec({src}));assert.equal(result.ok,false);assert.ok(result.issues.some(e=>e.code==='UNSAFE_URL'&&e.path==='/body/0/src'),src);}
});
test('missing image renders only a local labelled fallback, no image/action/request URL',()=>{
 const x=setup(spec({fallback:'UI'}));assert.equal(x.root.dataset.state,'fallback');assert.equal(x.root.querySelector('[role=img]').getAttribute('aria-label'),'Supplied source');assert.equal(x.root.querySelector('.iui-favicon-fallback').textContent,'UI');assert.equal(x.root.querySelector('img,button,a'),null);assert.equal(x.root.querySelector('[src]'),null);x.c.dispose();
});
test('remote image is absent until explicit activation; disclosure names supplied host and no discovery service',()=>{
 const x=setup(spec({src:'https://example.com/supplied/icon.png'}));assert.equal(x.root.querySelector('img'),null);assert.match(x.root.textContent,/request to example.com/);const button=x.root.querySelector('button');button.focus();button.click();const image=x.root.querySelector('img');assert.equal(image.src,'https://example.com/supplied/icon.png');assert.equal(image.referrerPolicy,'no-referrer');assert.equal(image.alt,'');assert.equal(image.getAttribute('aria-hidden'),'true');assert.equal(image.hidden,true);assert.equal(x.root.dataset.state,'loading');assert.equal(button.getAttribute('aria-disabled'),'true');assert.equal(x.dom.window.document.activeElement,button);x.c.dispose();
});
test('pending and already loaded controls are strict no-ops with fixed image identity and focus',()=>{
 const x=setup(spec({src:'https://example.com/icon.png'})),button=x.root.querySelector('button');button.focus();button.click();const image=x.root.querySelector('img');button.click();assert.equal(x.root.querySelector('img'),image);finish(x);button.click();assert.equal(x.root.querySelector('img'),image);assert.equal(x.root.dataset.state,'loaded');assert.equal(image.hidden,false);assert.equal(x.root.querySelector('.iui-favicon-fallback').hidden,true);assert.equal(button.getAttribute('aria-disabled'),'true');assert.equal(x.dom.window.document.activeElement,button);x.c.dispose();
});
test('error retains local fallback and supports one explicit retry; stale images cannot affect replacement',()=>{
 const x=setup(spec({src:'https://example.com/icon.png'})),button=x.root.querySelector('button');button.click();const old=x.root.querySelector('img');event(x,old,'error');assert.equal(x.root.dataset.state,'error');assert.equal(old.hidden,true);assert.match(x.root.textContent,/local fallback/);button.click();const current=x.root.querySelector('img');assert.notEqual(current,old);finish(x,old);assert.equal(x.root.dataset.state,'loading');finish(x,current);assert.equal(x.root.dataset.state,'loaded');event(x,old,'error');assert.equal(x.root.dataset.state,'loaded');x.c.dispose();
});
test('load without a decoded intrinsic image is an honest error, not success',()=>{
 const x=setup(spec({src:png}));assert.equal(x.root.dataset.state,'loading');finish(x,undefined,0);assert.equal(x.root.dataset.state,'error');assert.equal(x.root.querySelector('.iui-favicon-fallback').hidden,false);assert.match(x.root.textContent,/unavailable/);x.c.dispose();
});
test('case-insensitive allowed data URI stays local, without false empty-host disclosure',()=>{
 for(const src of [png,png.replace('data:image/png','DATA:IMAGE/PNG')]){const x=setup(spec({src}));assert.ok(x.root.querySelector('img'));assert.equal(x.root.querySelector('button'),null);assert.doesNotMatch(x.root.textContent,/request to/);finish(x);assert.equal(x.root.dataset.state,'loaded');x.c.dispose();}
});
test('unrelated state, resizing notifications and literal content preserve image/consent state',()=>{
 const x=setup(spec({label:'<img onerror="bad()">',src:'https://example.com/icon.png'})),button=x.root.querySelector('button');button.click();finish(x);const image=x.root.querySelector('img');button.focus();x.c.setState({other:1});assert.equal(x.root.querySelector('img'),image);assert.equal(x.root.dataset.state,'loaded');assert.equal(x.dom.window.document.activeElement,button);assert.equal(x.root.querySelector('script'),null);assert.equal(x.root.querySelector('[role=img]').getAttribute('aria-label'),'<img onerror="bad()">');x.c.dispose();
});
test('disabled enclosing form blocks forged loads and never receives icon-action submission',()=>{
 const s=spec();s.state.locked=true;s.body=[{type:'form',label:'Outer',disabled:{$:'locked'},children:[node({src:'https://example.com/icon.png'})]}];const x=setup(s),button=x.root.querySelector('button'),form=x.host.querySelector('form');let submits=0;form.addEventListener('submit',()=>submits++);event(x,button,'click');assert.equal(x.root.querySelector('img'),null);x.c.setState({locked:false});button.click();assert.ok(x.root.querySelector('img'));assert.equal(submits,0);assert.equal(form.dataset.status,'idle');x.c.dispose();
});
test('foreign owners, atomic rejected updates, accepted replacement and disposal keep stale events inert',()=>{
 const a=setup(spec({src:'https://example.com/icon.png'})),b=setup(spec());a.root.querySelector('button').click();const old=a.root,image=old.querySelector('img');assert.equal(image.ownerDocument,a.dom.window.document);assert.throws(()=>a.c.update(spec({src:'javascript:bad()'})));assert.equal(a.host.querySelector('.iui-favicon'),old);assert.equal(old.dataset.state,'loading');a.c.update(spec({fallback:'X'}));event(a,image,'error');assert.equal(old.dataset.state,'loading');assert.equal(a.host.querySelector('.iui-favicon').dataset.state,'fallback');a.c.dispose();b.c.dispose();
});
test('repeated retry drops previous image handlers instead of accumulating live detached targets',()=>{
 const x=setup(spec({src:'https://example.com/icon.png'})),button=x.root.querySelector('button'),old=[];for(let i=0;i<20;i++){button.click();const image=x.root.querySelector('img');old.push(image);event(x,image,'error');}button.click();for(const image of old){finish(x,image);event(x,image,'error');}assert.equal(x.root.dataset.state,'loading');assert.equal(x.root.querySelectorAll('img').length,1);const current=x.root.querySelector('img');x.c.dispose();finish(x,current);assert.equal(x.root.dataset.state,'loading');
});
test('public compiler stays deterministic and does not hydrate remote img.src before consent',async()=>{
 const s=spec({src:'https://example.com/icon.png'}),before=JSON.stringify(s),html=await compileHtml(s);assert.equal(await compileHtml(s),html);assert.equal(JSON.stringify(s),before);const dom=new JSDOM(html,{runScripts:'dangerously'});assert.equal(dom.window.document.querySelector('.iui-favicon img'),null);assert.ok(dom.window.document.querySelector('.iui-favicon button'));dom.window.close();await assert.rejects(()=>compileHtml(spec({src:'data:text/html;base64,eA=='})));
});
