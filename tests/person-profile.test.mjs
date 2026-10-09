import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
import {assertClosedReferences} from '../scripts/schema-subsets.mjs';

const fact=(extra={})=>({id:'topic',label:'Topic',value:'Reading',...extra});
const link=(extra={})=>({id:'reading',label:'Example reading',url:'https://example.com/reading',...extra});
const person=(extra={})=>({type:'person-profile',name:'Alex River (fictional)',...extra});
const spec=(node=person(),extra={})=>({version:'iui/1',state:{other:0},body:[node],...extra});
const rich=()=>person({role:'Reader',organization:'Fictional circle',location:'Example City',biography:'Original synthetic biography.\nSecond line.',facts:[fact(),fact({id:'format',label:'Format',value:'Discussion'})],links:[link(),link({id:'second',label:'Second page',url:'http://example.com/second'})],source:{label:'Original synthetic fixture',url:'https://example.com/fixture'}});
const setup=(input=spec(rich()),options={},lang='en',shell='<div id="host"></div><button id="outside">Outside</button>')=>{
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`),host=dom.window.document.getElementById('host');
  const controller=mount(host,input,options);return {dom,host,controller};
};
const reject=(input,code,path)=>{const result=validateDocument(input);assert.equal(result.ok,false,'Expected invalid document');if(code)assert.ok(result.issues.some(i=>i.code===code&&(path===undefined||i.path===path)),JSON.stringify(result.issues));};

const optional={role:'Reader',organization:'Example',location:'Fictional City',biography:'',expanded:true,facts:[fact()],links:[link()],source:{label:'Synthetic'}};
const combinations=()=>Array.from({length:256},(_,mask)=>person(Object.fromEntries(Object.entries(optional).filter((_,i)=>mask&(1<<i)))));

test('person-profile canonical full/Base schemas have closed refs and accept every optional combination',async()=>{
  const all=combinations();
  for(const path of ['../src/schema/iui.schema.json','../src/schema/fragments/base.schema.json']){
    const schema=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));assertClosedReferences(schema);
    const validate=new Ajv({strict:true,allErrors:false}).compile(schema);
    for(const node of [...all,person({facts:[],links:[]}),rich()])assert.equal(validate(spec(node)),true,JSON.stringify(validate.errors));
    assert.equal(validate(spec(person({name:'😀'.repeat(200),biography:'😀'.repeat(6000),role:'😀'.repeat(200),organization:'😀'.repeat(200),location:'😀'.repeat(200),facts:Array.from({length:12},(_,i)=>fact({id:'f'+i,label:'😀'.repeat(200),value:'😀'.repeat(2000)})),links:Array.from({length:8},(_,i)=>link({id:'l'+i,label:'😀'.repeat(200),url:'https://example.com/'+ 'a'.repeat(2028)})),source:{label:'😀'.repeat(200)}}))),true);
  }
  for(const node of all)assert.equal(validateDocument(spec(node)).ok,true);
  assert.equal(validateDocument(spec(person({name:'😀'.repeat(200)}))).ok,true);
  assert.equal(validateDocument(spec(person({biography:'😀'.repeat(6000),facts:[fact({value:'😀'.repeat(2000)})]}))).ok,true);
  const index=JSON.parse(await readFile(new URL('../src/schema/fragments/index.json',import.meta.url),'utf8'));assert.equal(index.nodeOwners['person-profile'],'base');
  assert.equal(Object.hasOwn(index.nodeOwners,'entity-card'),false);assert.equal(Object.hasOwn(index.nodeOwners,'entity-overview'),false);
});

test('person-profile every optional combination renders only supplied fields and never fabricates metadata',()=>{
  const all=combinations(),x=setup(spec({type:'col',children:all}));
  [...x.host.querySelectorAll('.iui-person-profile')].forEach((profile,i)=>{
    const node=all[i];assert.equal(profile.tagName,'ARTICLE');assert.equal(profile.querySelector('h2').textContent,node.name);
    for(const field of ['role','organization','location'])assert.equal(profile.querySelector('.iui-person-'+field)?.querySelector('.iui-person-field-value').textContent,node[field]);
    assert.equal(!!profile.querySelector('details'),node.biography!==undefined);
    if(node.biography!==undefined){assert.equal(profile.querySelector('details').open,node.expanded??false);assert.equal(profile.querySelector('.iui-person-biography-text').textContent,node.biography);}
    assert.equal(profile.querySelectorAll('.iui-person-fact').length,node.facts?.length??0);assert.equal(profile.querySelectorAll('.iui-person-links a').length,node.links?.length??0);
    assert.equal(!!profile.querySelector('.iui-person-source'),node.source!==undefined);
    assert.equal(profile.querySelector('.iui-person-note').textContent,'This information was supplied and has not been independently verified.');
    assert.equal(profile.querySelectorAll('img,svg,iframe,video,audio,input,button,time,[data-status],[aria-live],[role=status]').length,0);
  });x.controller.dispose();x.dom.window.close();
});

test('person-profile strict unknown fields, literal bounds, nested required fields and types reject publicly',async()=>{
  const invalid=[
    person({name:undefined}),person({name:''}),person({name:'😀'.repeat(201)}),
    ...['role','organization','location'].flatMap(field=>[person({[field]:''}),person({[field]:'x'.repeat(201)}),person({[field]:{$:'other'}})]),
    person({name:{$:'other'}}),person({biography:'x'.repeat(6001)}),person({biography:null}),person({expanded:'true'}),person({expanded:{$:'other'}}),
    ...['bind','avatar','image','audio','search','verified','status','email','phone','action','onClick','children','unknown'].map(field=>person({[field]:'unsupported'})),
    person({facts:Array.from({length:13},(_,i)=>fact({id:'f'+i}))}),person({links:Array.from({length:9},(_,i)=>link({id:'l'+i}))}),
    ...[{id:''},{id:'1bad'},{id:'x'.repeat(81)},{id:'bad/key'},{label:''},{label:'x'.repeat(201)},{value:''},{value:'x'.repeat(2001)},{value:{$:'other'}},{value:undefined},{unknown:true}].map(p=>person({facts:[fact(p)]})),
    ...[{id:''},{id:'1bad'},{id:'x'.repeat(81)},{label:''},{label:'x'.repeat(201)},{url:''},{url:'x'.repeat(2049)},{url:undefined},{url:{$:'other'}},{unknown:true}].map(p=>person({links:[link(p)]})),
    ...[{}, {label:''},{label:'x'.repeat(201)},{label:{$:'other'}},{label:'X',url:''},{label:'X',url:'x'.repeat(2049)},{label:'X',unknown:true}].map(source=>person({source}))
  ];
  for(const node of invalid)reject(spec(node));
  for(const path of ['../src/schema/iui.schema.json','../src/schema/fragments/base.schema.json']){
    const schema=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8')),validate=new Ajv({strict:true}).compile(schema);
    for(const node of invalid)assert.equal(validate(spec(node)),false,JSON.stringify(node));
  }
});

test('person-profile duplicate IDs are rejected per list, with exact nested paths and no cross-list collision',()=>{
  reject(spec(person({facts:[fact(),fact()]})),'DUPLICATE_ID','/body/0/facts/1/id');
  reject(spec(person({links:[link(),link()]})),'DUPLICATE_ID','/body/0/links/1/id');
  reject(spec({type:'section',children:[person({links:[link(),link()]})]}),'DUPLICATE_ID','/body/0/children/0/links/1/id');
  assert.equal(validateDocument(spec(person({facts:[fact({id:'same'})],links:[link({id:'same'})]}))).ok,true);
  assert.equal(validateDocument(spec(undefined,{body:[rich(),rich()]})).ok,true);
  reject(spec(undefined,{body:[person({id:'duplicate'}),person({id:'duplicate'})]}),'DUPLICATE_ID','/body/1/id');
});

test('person-profile absolute HTTP(S) URL policy checks both sources and links with exact issue paths',()=>{
  for(const url of ['https://example.com/a?q=%3Cscript%3E#section','HTTP://example.com:8080/path'])assert.equal(validateDocument(spec(person({links:[link({url})],source:{label:'Fixture',url}}))).ok,true);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:a@example.com','tel:+123','data:text/html,x','file:///tmp/a','ftp://example.com','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','https://example.com/\n','https:///','https://']){
    reject(spec(person({links:[link({url})]})),'UNSAFE_URL','/body/0/links/0/url');
    reject(spec(person({source:{label:'Fixture',url}})),'UNSAFE_URL','/body/0/source/url');
  }
});

test('person-profile public global budgets and JSON hygiene apply before rendering',()=>{
  reject(spec(undefined,{body:Array.from({length:340},()=>person({biography:'x'.repeat(6000)}))}),'TEXT_LIMIT');
  reject(spec(undefined,{body:Array.from({length:2001},()=>person())}),'NODE_LIMIT');
  reject(spec(undefined,{body:Array.from({length:650},()=>person({facts:Array.from({length:12},(_,i)=>fact({id:'f'+i})),links:Array.from({length:8},(_,i)=>link({id:'l'+i}))}))}),'VALUE_LIMIT');
  let deep=person();for(let i=0;i<65;i++)deep={type:'col',children:[deep]};reject(spec(deep),'DEPTH_LIMIT');
  let calls=0;const node=person();Object.defineProperty(node,'biography',{enumerable:true,get(){calls++;return 'Never';}});reject(spec(node),'JSON_TYPE');assert.equal(calls,0);
});

test('person-profile supplied HTML-looking text and source-order facts/links remain exact without media or verification claims',()=>{
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)> 😀 中文 & "\n';
  const input=spec(person({name:literal,role:literal,organization:literal,location:literal,biography:literal,facts:[fact({id:'z',label:literal,value:literal}),fact({id:'a'})],links:[link({id:'z',label:literal}),link({id:'a'})],source:{label:literal,url:'https://example.com/source'}}));
  const before=JSON.stringify(input),freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const result=validateDocument(input);assert.equal(result.ok,true);assert.ok(Object.isFrozen(result.document.body[0].facts));
  const x=setup(input);assert.equal(JSON.stringify(input),before);
  for(const selector of ['.iui-person-name','.iui-person-role .iui-person-field-value','.iui-person-organization .iui-person-field-value','.iui-person-location .iui-person-field-value','.iui-person-biography-text','.iui-person-facts dt','.iui-person-facts dd','.iui-person-link-label'])assert.equal(x.host.querySelector(selector).textContent,literal);
  assert.deepEqual([...x.host.querySelectorAll('.iui-person-fact')].map(el=>el.dataset.factId),['z','a']);assert.deepEqual([...x.host.querySelectorAll('[data-link-id]')].map(el=>el.dataset.linkId),['z','a']);
  assert.equal(x.host.querySelectorAll('script,img,svg,iframe,link,button,input').length,0);
  for(const a of x.host.querySelectorAll('a')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.equal(a.querySelector('.iui-person-link-hint').textContent,' (Opens in a new tab)');}
  const bare=setup(spec(person({facts:[],links:[]})));assert.equal(bare.host.querySelector('dl,details,a,.iui-person-source,.iui-person-role,.iui-person-organization,.iui-person-location'),null);
  assert.equal(bare.host.querySelectorAll('.iui-person-profile *').length,2);bare.controller.dispose();x.controller.dispose();
});

test('person-profile native disclosure identity, open state and focus persist across unrelated host patches',()=>{
  const x=setup(),details=x.host.querySelector('details'),summary=details.querySelector('summary'),anchors=[...x.host.querySelectorAll('a')];
  assert.equal(details.open,false);summary.click();assert.equal(details.open,true);summary.focus();
  for(let i=1;i<5;i++){x.controller.setState({other:i});assert.equal(x.host.querySelector('details'),details);assert.equal(details.open,true);assert.equal(x.dom.window.document.activeElement,summary);assert.deepEqual([...x.host.querySelectorAll('a')],anchors);}
  summary.click();assert.equal(details.open,false);x.controller.setState({other:5});assert.equal(details.open,false);
  anchors[0].focus();x.controller.setState({other:6});assert.equal(x.dom.window.document.activeElement,anchors[0]);
  const outside=x.dom.window.document.getElementById('outside');outside.focus();x.controller.setState({other:7});assert.equal(x.dom.window.document.activeElement,outside);
  assert.deepEqual(x.controller.getState(),{other:7});assert.deepEqual(evaluateState(spec(rich()),{other:8}).state,{other:8});x.controller.dispose();
});

test('person-profile invalid mounts/updates are atomic; full valid updates reset expanded only after validation',()=>{
  const x=setup(),details=x.host.querySelector('details'),summary=details.querySelector('summary');summary.click();summary.focus();const html=x.host.innerHTML;
  for(const bad of [person({name:''}),person({source:{label:'Bad',url:'javascript:x'}}),person({facts:[fact(),fact()]})]){
    assert.throws(()=>x.controller.update(spec(bad)));assert.equal(x.host.innerHTML,html);assert.equal(x.host.querySelector('details'),details);assert.equal(details.open,true);assert.equal(x.dom.window.document.activeElement,summary);
    assert.throws(()=>mount(x.host,spec(bad)));assert.equal(x.host.innerHTML,html);
  }
  x.controller.update(spec(rich()));assert.notEqual(x.host.querySelector('details'),details);assert.equal(x.host.querySelector('details').open,false);assert.equal(details.isConnected,false);
  const current=x.host.querySelector('details');summary.click();assert.equal(current.open,false);x.controller.setState({other:2});assert.equal(current.open,false);
  x.controller.update(spec({...rich(),expanded:true}));assert.equal(x.host.querySelector('details').open,true);
  x.controller.update(spec(person()));assert.equal(x.host.querySelector('details'),null);summary.click();assert.deepEqual(x.controller.getState(),{other:0});x.controller.dispose();
});

test('person-profile native form boundaries add no values, submission or disabled-reading behavior',async()=>{
  let calls=0,release,signal,submitted;
  const input=spec(undefined,{body:[{type:'form',label:'Local form',action:'save',children:[rich()]}]});
  const x=setup(input,{actions:{save:args=>{calls++;({signal,values:submitted}=args);return new Promise(resolve=>release=resolve);}}});
  const form=x.host.querySelector('form'),details=x.host.querySelector('details'),summary=details.querySelector('summary');summary.click();assert.equal(calls,0);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls,1);assert.deepEqual(submitted,{});
  assert.equal(summary.closest('fieldset').disabled,true);assert.equal(summary.matches(':disabled'),false);assert.equal(summary.hasAttribute('aria-disabled'),false);
  // JSDOM suppresses all .click() activation under disabled fieldsets. Native activation is a prepared browser case.
  details.open=false;x.controller.setState({other:1});assert.equal(details.open,false);details.open=true;
  for(const a of x.host.querySelectorAll('.iui-person-profile a')){assert.equal(a.hasAttribute('aria-disabled'),false);assert.equal(a.hasAttribute('tabindex'),false);assert.equal(a.matches(':disabled'),false);}
  x.controller.setState({other:1});assert.equal(details.open,true);form.reset();assert.equal(details.open,true);
  x.host.querySelector('button[type=button]').click();assert.equal(signal.aborted,true);release();await Promise.resolve();await Promise.resolve();assert.equal(calls,1);x.controller.dispose();
  const outer=setup(spec(rich()),{},'en','<form id="outer"><div id="host"></div></form>');outer.host.querySelector('details').open=true;outer.dom.window.document.getElementById('outer').reset();assert.equal(outer.host.querySelector('details').open,true);assert.deepEqual([...new outer.dom.window.FormData(outer.dom.window.document.getElementById('outer')).entries()],[]);outer.controller.dispose();
});

test('person-profile independent roots, ownerDocuments and reserved internal IDs survive authored lookalikes and disposal',()=>{
  const a=setup(),doc=a.dom.window.document,second=doc.createElement('div');doc.body.append(second);
  const savedId=a.host.querySelector('h2').id;const controller2=mount(second,spec({...rich(),id:savedId}));
  const b=setup(spec({...rich(),id:savedId}));
  for(const host of [a.host,second,b.host]){
    for(const el of host.querySelectorAll('.iui-person-profile [id]'))assert.match(el.id,/^iui-person-internal-iui-\d+-\d+-(?:name|note|links)$/);
    for(const el of host.querySelectorAll('.iui-person-profile *'))assert.equal(el.ownerDocument,host.ownerDocument);
    for(const el of host.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const name of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(name)??'').split(' ').filter(Boolean))assert.ok(host.ownerDocument.getElementById(id));
  }
  const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  const aDetails=a.host.querySelector('details'),bDetails=b.host.querySelector('details');aDetails.open=true;assert.equal(bDetails.open,false);a.controller.dispose();a.controller.dispose();assert.equal(a.host.childElementCount,0);aDetails.querySelector('summary').click();assert.equal(bDetails.open,false);assert.throws(()=>a.controller.setState({other:1}),/disposed/);assert.throws(()=>a.controller.update(spec()),/disposed/);controller2.dispose();b.controller.dispose();
});

test('person-profile Chinese labels and Arabic-first source order keep authored content unchanged',()=>{
  const input=spec(rich(),{description:'مثال عربي خيالي أصلي لقراءة ملف شخصي.'}),x=setup(input,{},'zh-CN');
  assert.equal(x.host.querySelector('.iui-root').dir,'auto');assert.equal(x.host.querySelector('.iui-description').textContent,input.description);
  assert.equal(x.host.querySelector('summary').textContent,'简介');assert.equal(x.host.querySelector('.iui-person-note').textContent,'此信息由外部提供，未经独立核实。');assert.equal(x.host.querySelector('.iui-person-links-title').textContent,'链接');assert.match(x.host.querySelector('a').textContent,/在新标签页中打开/);assert.equal(x.host.querySelector('h2').textContent,input.body[0].name);x.controller.dispose();
});

test('person-profile standalone compiler is deterministic, literal and offline; unsafe profiles fail before HTML',async()=>{
  const input=spec({...rich(),name:'</script><script>window.pwned=1</script>'});const html=await compileHtml(input);assert.equal(await compileHtml(input),html);let fetches=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){win.fetch=()=>{fetches++;throw Error('Unexpected request');};}}),profile=dom.window.document.querySelector('.iui-person-profile');
  assert.equal(profile.querySelector('h2').textContent,input.body[0].name);assert.equal(dom.window.pwned,undefined);assert.equal(fetches,0);assert.equal(dom.window.document.querySelectorAll('script[src],link[href],img,iframe').length,0);
  profile.querySelector('summary').click();assert.equal(profile.querySelector('details').open,true);profile.querySelector('summary').click();assert.equal(profile.querySelector('details').open,false);
  for(const bad of [person({name:''}),person({links:[link({url:'mailto:fictional@example.com'})]}),person({facts:[fact(),fact()]})])await assert.rejects(()=>compileHtml(spec(bad)));dom.window.close();
});
