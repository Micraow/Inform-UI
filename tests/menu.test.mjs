import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
import {assertClosedReferences} from '../scripts/schema-subsets.mjs';

const menu=()=>({type:'restaurant-menu',title:'Original menu',currency:'XYZ',description:'Supplied example',source:{label:'Synthetic source',url:'https://example.invalid/menu'},sections:[
 {id:'first',title:'First',items:[{id:'tea',name:'Jasmine TEA',description:'Warm floral infusion',price:0,tags:['Warm','é'],status:'available'},{id:'rice',name:'Rice',description:'Long supplied description. '.repeat(20),price:null,tags:['Grain'],status:'unavailable'}]},
 {id:'second',title:'Second',items:[{id:'iced',name:'Iced tea',description:'Cold infusion',price:0.0000001,tags:['Chilled']},{id:'snack',name:'Snack',price:0.30000000000000004,tags:['Warm']}]},
 {id:'empty',title:'Empty',items:[]}
]});
const spec=(node=menu())=>({version:'iui/1',state:{x:1},body:[node]});
function setup(input=spec(),lang='en',wrapper='div'){
 const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body><button id="outside">Outside</button><${wrapper}><div id="host"></div></${wrapper}></body></html>`,{url:'https://host.invalid/'});
 const host=dom.window.document.getElementById('host'),controller=mount(host,input),root=host.querySelector('.iui-menu');
 return {dom,host,controller,root,search:root.querySelector('input'),category:root.querySelector('select'),clear:root.querySelector('button'),count:root.querySelector('.iui-menu-count')};
}
const visible=s=>[...s.root.querySelectorAll('.iui-menu-item')].filter(e=>!e.hidden).map(e=>e.dataset.itemId);
const input=(s,value)=>{s.search.value=value;s.search.dispatchEvent(new s.dom.window.Event('input',{bubbles:true}));};
const choose=(s,value)=>{s.category.value=value;s.category.dispatchEvent(new s.dom.window.Event('change',{bubbles:true}));};
function invalid(mutate,code='SCHEMA') {const d=spec();mutate(d.body[0],d);const r=validateDocument(d);assert.equal(r.ok,false);assert.ok(r.issues.some(i=>i.code===code),JSON.stringify(r));}

test('public contract validates original fixture and closed base document/node subsets',async()=>{
 const fixture=JSON.parse(await readFile('examples/restaurant-menu.json','utf8'));assert.equal(validateDocument(fixture).ok,true);
 const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners['restaurant-menu'],'base');
 for(const path of ['base.schema.json','nodes/base.schema.json']) {const schema=JSON.parse(await readFile('src/schema/fragments/'+path,'utf8'));assertClosedReferences(schema);const v=new Ajv2020({strict:true}).compile(schema);assert.equal(v(path.startsWith('nodes/')?menu():spec()),true);}
 assert.equal(evaluateState(spec(),{x:2}).ok,true);
});

test('zero and 200 items pass, 201 fail and identifiers have menu-local separate namespaces',()=>{
 for(const count of [0,200,201]){const n=menu();n.sections=Array.from({length:Math.ceil(count/40)},(_,s)=>({id:'s'+s,title:'Section '+s,items:Array.from({length:Math.min(40,count-s*40)},(_,i)=>({id:'i'+(s*40+i),name:'Item',price:0}))}));const result=validateDocument(spec(n));assert.equal(result.ok,count<=200);if(count===201)assert.ok(result.issues.some(i=>i.code==='MENU_LIMIT'));}
 const n=menu();n.sections[0].items[0].id='first';assert.equal(validateDocument({version:'iui/1',body:[n,structuredClone(n)]}).ok,true);
 invalid(n=>n.sections[1].id='first','MENU_ID');invalid(n=>n.sections[1].items[0].id='tea','MENU_ID');
 const hostile=menu();hostile.sections[0].id='__proto__';hostile.sections[0].items[0].id='constructor';assert.equal(validateDocument(spec(hostile)).ok,true);
});

test('strict public schema rejects bounds, unknown fields, incorrect types and unsupported capabilities',()=>{
 const changes=[n=>delete n.title,n=>n.title='',n=>n.title='😀'.repeat(201),n=>n.description='x'.repeat(2001),n=>delete n.currency,n=>n.currency='usd',n=>n.currency='US',n=>n.currency='USDD',n=>n.currency='ＵＳＤ',n=>n.currency='USD\n',n=>delete n.sections,n=>n.sections=Array.from({length:21},(_,i)=>({id:'s'+i,title:'S',items:[]})),n=>n.sections[0].items=Array.from({length:41},(_,i)=>({id:'i'+i,name:'I',price:1})),n=>n.sections[0].title='',n=>n.sections[0].id='bad id',n=>n.sections[0].id='x'.repeat(81),n=>n.sections[0].extra=true,n=>delete n.sections[0].items[0].price,n=>n.sections[0].items[0].price=-1,n=>n.sections[0].items[0].price='0',n=>n.sections[0].items[0].price=true,n=>n.sections[0].items[0].name='',n=>n.sections[0].items[0].name='x'.repeat(201),n=>n.sections[0].items[0].description='x'.repeat(2001),n=>n.sections[0].items[0].tags=Array(9).fill('x'),n=>n.sections[0].items[0].tags=[''],n=>n.sections[0].items[0].tags=['x'.repeat(41)],n=>n.sections[0].items[0].tags=[2],n=>n.sections[0].items[0].status='recommended',n=>n.sections[0].items[0].image='https://example.invalid/photo',n=>n.source.label='',n=>n.source.url='',n=>n.source.url='https://example.invalid/'+'x'.repeat(2048),n=>n.source.verified=true,n=>n.bind='x',n=>n.children=[],n=>n.onSearch='fetch',n=>n.cart=[],n=>n.order={},n=>n.payment={},n=>n.status='loading'];
 for(const [i,change]of changes.entries()){try{invalid(change);}catch(e){throw Error('case '+i,{cause:e});}}
 for(const price of [NaN,Infinity,-Infinity])invalid(n=>n.sections[0].items[0].price=price,'NON_FINITE');
});

test('maximal Unicode text and finite price extremes preserve contract boundaries',()=>{
 const n=menu();n.title='😀'.repeat(200);n.description='😀'.repeat(2000);n.source={label:'😀'.repeat(200)};n.sections=Array.from({length:20},(_,i)=>({id:'s'+i,title:'😀'.repeat(200),items:i===0?[{id:'i',name:'😀'.repeat(200),description:'😀'.repeat(2000),price:Number.MAX_VALUE,tags:Array(8).fill('😀'.repeat(40))}]:[]}));assert.equal(validateDocument(spec(n)).ok,true);
 for(const value of [Number.MIN_VALUE,0,-0,null]){n.sections[0].items[0].price=value;assert.equal(validateDocument(spec(n)).ok,true);}
});

test('source HTTP(S) policy rejects unsafe schemes, credentials, whitespace and source fragments',()=>{
 for(const url of ['javascript:alert(1)','mailto:menu@example.invalid','tel:123','#tea','/menu','https://a:b@example.invalid','https://example.invalid/has space',' https://example.invalid','https:\\example.invalid'])invalid(n=>n.source.url=url,'UNSAFE_URL');
 for(const source of [{label:'No URL'},{label:'HTTPS',url:'https://example.invalid/menu?day=1#today'},{label:'HTTP',url:'http://example.invalid/menu'}]){const n=menu();n.source=source;assert.equal(validateDocument(spec(n)).ok,true);}
});

test('prepared negative fixtures fail with their precise public validation codes',async()=>{
 for(const fixture of JSON.parse(await readFile('tests/fixtures/restaurant-menu-invalid.json','utf8'))){const result=validateDocument(fixture.document);assert.equal(result.ok,false,fixture.name);assert.ok(result.issues.some(i=>i.code===fixture.code),fixture.name);}
});

test('exact prices distinguish zero, missing and tiny values without invented rounding or totals',()=>{
 const s=setup();assert.deepEqual([...s.root.querySelectorAll('.iui-menu-price')].map(n=>n.textContent),['0 XYZ','Price not supplied','1e-7 XYZ','0.30000000000000004 XYZ']);assert.deepEqual([...s.root.querySelectorAll('.iui-menu-price')].map(n=>n.dataset.price),['supplied','missing','supplied','supplied']);assert.doesNotMatch(s.root.textContent,/Free|Total|Recommended/);assert.match(s.root.textContent,/Available \(supplied status\)/);assert.match(s.root.textContent,/Unavailable \(supplied status\)/);assert.match(s.root.textContent,/Status not supplied/);
 const anchor=s.root.querySelector('a');assert.equal(anchor.href,'https://example.invalid/menu');assert.equal(anchor.rel,'noopener noreferrer');assert.equal(anchor.target,'_blank');s.controller.dispose();
});

test('native labels, headings, semantic lists, descriptions and localized controls are present',()=>{
 for(const lang of ['en','zh-CN']){const s=setup(spec(),lang);for(const control of [s.search,s.category])assert.ok(s.root.querySelector(`label[for="${control.id}"]`));assert.equal(s.search.type,'search');assert.equal(s.search.hasAttribute('name'),false);assert.equal(s.category.hasAttribute('name'),false);assert.equal(s.clear.type,'button');assert.equal(s.count.getAttribute('aria-live'),'polite');assert.equal(s.root.querySelectorAll('.iui-menu-item h4').length,4);assert.equal(s.root.querySelectorAll('.iui-menu-items[role=list]').length,3);for(const id of s.search.getAttribute('aria-describedby').split(' '))assert.ok(s.dom.window.document.getElementById(id));assert.equal(s.root.querySelector('form'),null);if(lang==='zh-CN'){assert.equal(s.clear.textContent,'清除搜索');assert.match(s.count.textContent,/4 \/ 4/);}s.controller.dispose();}
});

test('search names descriptions tags using trim/lowercase only, intersects categories and keeps original order',()=>{
 const s=setup();assert.deepEqual(visible(s),['tea','rice','iced','snack']);input(s,'  TEA  ');assert.deepEqual(visible(s),['tea','iced']);assert.equal(s.search.value,'  TEA  ');choose(s,'second');assert.deepEqual(visible(s),['iced']);assert.equal(s.count.textContent,'1 of 4 items shown');input(s,'warm');assert.deepEqual(visible(s),['snack']);choose(s,'');assert.deepEqual(visible(s),['tea','snack']);input(s,'INFUSION');assert.deepEqual(visible(s),['tea','iced']);input(s,'e\u0301');assert.deepEqual(visible(s),[]);input(s,'É');assert.deepEqual(visible(s),['tea']);input(s,'teaa');assert.deepEqual(visible(s),[]);s.controller.dispose();
});

test('no matches and empty sections hide only results, counts stay honest and explicit clear resets both controls',()=>{
 const s=setup();choose(s,'empty');assert.equal(s.root.dataset.state,'no-match');assert.equal(s.root.querySelectorAll('.iui-menu-section:not([hidden])').length,0);assert.equal(s.root.querySelector('.iui-menu-controls').hidden,false);assert.equal(s.root.querySelector('.iui-menu-empty').hidden,false);assert.equal(s.count.textContent,'0 of 4 items shown');input(s,'rice');s.clear.click();assert.deepEqual(visible(s),['tea','rice','iced','snack']);assert.equal(s.search.value,'');assert.equal(s.category.value,'');assert.equal(s.dom.window.document.activeElement,s.search);assert.equal(s.root.querySelector('[data-section-id=empty]').hidden,true);s.controller.dispose();
 for(const sections of [[],[{id:'empty',title:'Empty',items:[]}]]){const n=menu();n.sections=sections;const z=setup(spec(n));assert.equal(z.root.dataset.state,'empty');assert.equal(z.count.textContent,'0 of 0 items shown');assert.equal(z.root.querySelector('.iui-menu-empty').textContent,'No menu items supplied.');z.controller.dispose();}
});

test('200 Unicode query points pass; oversized draft is retained with explicit last-valid-query feedback',()=>{
 const n=menu();n.sections[0].items[0].name='😀'.repeat(200);const s=setup(spec(n));input(s,'😀'.repeat(200));assert.deepEqual(visible(s),['tea']);assert.equal(s.search.hasAttribute('aria-invalid'),false);input(s,'😀'.repeat(201));assert.equal(s.search.value,'😀'.repeat(201));assert.equal(s.search.getAttribute('aria-invalid'),'true');assert.equal(s.root.dataset.state,'query-too-long');assert.match(s.root.querySelector('.iui-menu-limit').textContent,/last valid search/);assert.equal(s.root.querySelector('.iui-menu-limit').hidden,false);assert.deepEqual(visible(s),['tea']);choose(s,'second');assert.deepEqual(visible(s),[]);assert.equal(s.count.textContent,'0 of 4 items shown');assert.equal(s.root.querySelector('.iui-menu-empty').hidden,true);s.clear.click();assert.equal(s.search.value,'');assert.equal(s.search.hasAttribute('aria-invalid'),false);s.controller.dispose();
});

test('Enter cancellation is limited to unmodified noncomposing Enter; arrows and modifiers stay native',()=>{
 const s=setup(spec(),'en','form');assert.ok(s.search.form);
 for(const options of [{key:'Enter'},{key:'Enter',repeat:true},{key:'Enter',altKey:true},{key:'Enter',ctrlKey:true},{key:'Enter',metaKey:true},{key:'Enter',shiftKey:true},{key:'Enter',isComposing:true},{key:'Enter',keyCode:229},{key:'ArrowDown'},{key:'Home'}]){const event=new s.dom.window.KeyboardEvent('keydown',{...options,bubbles:true,cancelable:true});s.search.dispatchEvent(event);assert.equal(event.defaultPrevented,options.key==='Enter'&&!options.altKey&&!options.ctrlKey&&!options.metaKey&&!options.shiftKey&&!options.isComposing&&options.keyCode!==229,JSON.stringify(options));}
 input(s,'tea');choose(s,'second');s.search.form.reset();assert.equal(s.search.value,'tea');assert.equal(s.category.value,'second');assert.deepEqual(visible(s),['iced']);assert.deepEqual([...new s.dom.window.FormData(s.search.form)],[]);s.controller.dispose();
});

test('form descendants reject autonomous menu text entry through nested layouts, lists and disclosures',()=>{
 for(const wrap of [n=>n,n=>({type:'col',children:[n]}),n=>({type:'list',items:[{type:'row',children:[n]}]}),n=>({type:'details',summary:'More',children:[n]}),n=>({type:'popover',label:'Open',children:[n]})]){const d=spec();d.body=[{type:'form',label:'Author form',children:[wrap(d.body[0])]}];const r=validateDocument(d);assert.equal(r.ok,false);assert.ok(r.issues.some(i=>i.code==='MENU_FORM'));assert.throws(()=>setup(d),/MENU_FORM/);}
});

test('external disabled fieldset guards forged input/change/click events, then resumes without host state changes',()=>{
 const s=setup(spec(),'en','fieldset');input(s,'tea');choose(s,'second');const fieldset=s.host.closest('fieldset');fieldset.disabled=true;input(s,'rice');choose(s,'first');s.clear.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(s.search.value,'tea');assert.equal(s.category.value,'second');assert.deepEqual(visible(s),['iced']);assert.deepEqual(s.controller.getState(),{x:1});fieldset.disabled=false;s.clear.click();assert.deepEqual(visible(s),['tea','rice','iced','snack']);s.controller.dispose();
});

test('unrelated host state keeps DOM, open details, drafts, selection and outside focus untouched',()=>{
 const d=spec();d.body.push({type:'button',label:'Host reset',action:{kind:'reset'}});const s=setup(d),details=s.root.querySelector('details'),summary=details.querySelector('summary'),row=s.root.querySelector('[data-item-id=rice]');details.open=true;summary.focus();s.controller.setState({x:2});assert.equal(s.root.querySelector('details'),details);assert.equal(details.open,true);assert.equal(s.dom.window.document.activeElement,summary);
 input(s,'rice');s.search.focus();s.search.setSelectionRange(1,3);s.controller.setState({x:3});assert.equal(s.host.querySelector('input'),s.search);assert.equal(s.search.selectionStart,1);assert.equal(s.search.selectionEnd,3);assert.deepEqual(visible(s),['rice']);const outside=s.dom.window.document.getElementById('outside');outside.focus();s.controller.setState({x:4});assert.equal(s.dom.window.document.activeElement,outside);assert.equal(s.root.querySelector('[data-item-id=rice]'),row);input(s,'tea');assert.equal(row.hidden,true);s.clear.click();assert.equal(details.open,true);s.host.querySelector('.iui-body>button').click();assert.equal(details.open,true);assert.equal(s.controller.getState().x,1);s.controller.dispose();
});

test('invalid update is atomic, valid update resets local state, listeners detach and sibling owners stay independent',()=>{
 const s=setup();input(s,'tea');choose(s,'second');const old={root:s.root,input:s.search,select:s.category,clear:s.clear,count:s.count};const bad=spec();bad.body[0].sections[1].items[0].id='tea';assert.throws(()=>s.controller.update(bad));assert.equal(s.host.querySelector('.iui-menu'),old.root);assert.equal(old.input.value,'tea');
 const siblingHost=s.dom.window.document.createElement('div');s.dom.window.document.body.append(siblingHost);const sibling=mount(siblingHost,spec());assert.notEqual(siblingHost.querySelector('input').id,old.input.id);assert.equal(old.root.ownerDocument,s.dom.window.document);
 s.controller.update(spec());assert.notEqual(s.host.querySelector('.iui-menu'),old.root);assert.equal(s.host.querySelector('input').value,'');old.clear.click();input(s,'rice');choose(s,'first');assert.equal(old.count.textContent,'1 of 4 items shown');assert.equal(s.host.querySelector('.iui-menu-count').textContent,'4 of 4 items shown');
 const current=s.host.querySelector('.iui-menu'),clear=current.querySelector('button');s.controller.dispose();clear.click();assert.equal(s.host.childElementCount,0);assert.ok(siblingHost.querySelector('.iui-menu'));sibling.dispose();
 const foreign=setup();assert.equal(foreign.root.ownerDocument,foreign.dom.window.document);foreign.controller.dispose();
});

test('literal markup in every supplied field is inert and deterministic compiler safely embeds exact source values',async()=>{
 const payload='<img src=x onerror=alert(1)></script>';const n=menu();n.title=payload;n.description=payload;n.source.label=payload;n.sections[0].title=payload;Object.assign(n.sections[0].items[0],{name:payload,description:payload,tags:[payload]});const d=spec(n),s=setup(d);assert.equal(s.root.querySelector('img,script,iframe,svg'),null);assert.ok(s.root.textContent.includes(payload));
 const html=await compileHtml(d),again=await compileHtml(d);assert.equal(html,again);assert.ok(html.includes('\\u003c'));const parsed=new JSDOM(html);assert.deepEqual(JSON.parse(parsed.window.document.getElementById('iui-data').textContent),validateDocument(d).document);s.controller.dispose();
});

test('no local action accesses fetch, storage or sends host state events',()=>{
 const s=setup();let changes=0;s.host.addEventListener('iui:state',()=>changes++);s.dom.window.fetch=()=>{throw Error('network forbidden');};for(const name of ['localStorage','sessionStorage'])Object.defineProperty(s.dom.window,name,{get(){throw Error('storage forbidden');}});
 input(s,'tea');choose(s,'second');s.clear.click();s.controller.update(spec());assert.deepEqual(s.controller.getState(),{x:1});assert.equal(changes,0);s.controller.dispose();
});


test('negative zero has the same truthful numeric display before and after compiled JSON transport',async()=>{
 const n=menu();n.sections[0].items[0].price=-0;const d=spec(n),s=setup(d);
 assert.equal(s.root.querySelector('.iui-menu-price').textContent,'0 XYZ');
 const html=await compileHtml(d);const compiled=new JSDOM(html,{runScripts:'dangerously',url:'https://host.invalid/'});
 assert.equal(compiled.window.document.querySelector('.iui-menu-price').textContent,'0 XYZ');
 assert.equal(s.root.querySelector('a').referrerPolicy,'no-referrer');assert.match(s.root.querySelector('a').textContent,/opens in a new tab/);
 assert.equal(Object.is(d.body[0].sections[0].items[0].price,-0),true);s.controller.dispose();compiled.window.close();
});
