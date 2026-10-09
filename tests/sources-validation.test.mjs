// Copy into the core tests/ after integration. Syntax checked only here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';
const fixture=JSON.parse(await readFile('examples/source-cards.json','utf8'));
const invalid=JSON.parse(await readFile('tests/fixtures/invalid-source-cases.json','utf8'));
const record={title:'Synthetic source',url:'https://example.invalid/sample'};
const cite={type:'citation',...record};
const cards=items=>({type:'web-link-cards',label:'Fictional links',items});
const doc=body=>({version:'iui/1',state:{count:0},body});
const setup=input=>{const dom=new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>',{pretendToBeVisual:true});const host=dom.window.document.getElementById('host');return {dom,host,controller:mount(host,input)};};

test('source schema accepts finite literal bounds, preserves Unicode limits and rejects extra fields',()=>{
  assert.equal(validateDocument(fixture).ok,true);
  for(const node of [cite,{...cite,number:1},{...cite,number:999},{...cite,title:'😀'.repeat(300),publisher:'发'.repeat(200),description:'描'.repeat(1000)},cards([record]),cards(Array.from({length:20},()=>({...record})))])assert.equal(validateDocument(doc([node])).ok,true);
  for(const {node}of invalid)assert.equal(validateDocument(doc([node])).ok,false);
  for(const node of [{...cite,title:'x'.repeat(301)},{...cite,publisher:''},{...cite,publisher:'x'.repeat(201)},{...cite,description:''},{...cite,description:'x'.repeat(1001)},{...cite,title:{$:'count'}},{...cite,number:1.5},{...cite,number:1000},{...cite,number:null},{...cite,description:null},cards(Array.from({length:21},()=>record)),{...cards([record]),label:''},{...cards([record]),label:'x'.repeat(201)},cards([{...record,id:'unexpected'}]),cards([{...record,children:[]}])])assert.equal(validateDocument(doc([node])).ok,false,JSON.stringify(node));
});

test('all source URLs use core policy with HTTP(S)-only restriction and precise issue paths',()=>{
  const bad=['javascript:bad()','data:text/html,bad','ftp://example.invalid','mailto:a@example.invalid','tel:+123','#local','//example.invalid','/relative','https:example.invalid','https://user:secret@example.invalid',' https://example.invalid','https://example.invalid\n','https://exam\tple.invalid','https://exa\\mple.invalid','https://','https://example.invalid:99999'];
  for(const url of bad)for(const [node,path]of [[{...cite,url},'/body/0/url'],[cards([{...record,url}]),'/body/0/items/0/url']]){const result=validateDocument(doc([node]));assert.equal(result.ok,false,url);assert.ok(result.issues.some(issue=>issue.code==='UNSAFE_URL'&&issue.path===path),JSON.stringify(result));}
  for(const url of ['http://example.invalid/source','https://example.invalid:8443/source?q=1#part','HTTPS://example.invalid/source','https://例子.invalid/路径'])assert.equal(validateDocument(doc([{...cite,url}])).ok,true,url);
});

test('literal source content, repeated titles and authored numbering use native secure anchors',()=>{
  const literal='<img src="https://example.invalid/pixel" onerror="bad()">',input=doc([{...cite,title:literal,description:literal,number:17},cards([{...record,title:literal},{...record,title:literal}])]);
  const before=structuredClone(input),{host,controller}=setup(input);assert.equal(host.querySelectorAll('a').length,3);assert.equal(host.querySelectorAll('img,script,iframe').length,0);assert.equal(host.querySelector('.iui-source-number').textContent,'[17]');
  for(const a of host.querySelectorAll('a')){assert.equal(a.textContent,literal);assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.ok(host.querySelector(`[id="${a.getAttribute('aria-describedby')}"]`));}
  assert.equal(host.querySelectorAll('[aria-selected],[aria-current],[aria-live]').length,0);assert.deepEqual(input,before);controller.dispose();
});

test('unrelated state preserves source identity and focus; invalid updates preserve old state/DOM',()=>{
  const {dom,host,controller}=setup(fixture),anchor=host.querySelector('.iui-source-title'),rail=host.querySelector('.iui-source-rail');anchor.focus();rail.scrollLeft=37;
  for(let count=1;count<=20;count++)controller.setState({count});assert.equal(host.querySelector('.iui-source-title'),anchor);assert.equal(host.querySelector('.iui-source-rail'),rail);assert.equal(dom.window.document.activeElement,anchor);assert.equal(rail.scrollLeft,37);
  const html=host.innerHTML,state=controller.getState();for(const{node}of invalid){assert.throws(()=>controller.update(doc([node])));assert.equal(host.innerHTML,html);assert.deepEqual(controller.getState(),state);assert.equal(dom.window.document.activeElement,anchor);}
  controller.update(doc([cite]));assert.equal(anchor.isConnected,false);controller.dispose();controller.dispose();assert.equal(host.childElementCount,0);
});

test('multiple hosts and foreign ownerDocument own all labels, nodes and IDs independently',()=>{
  const first=setup(fixture),second=setup(fixture),foreign=second.dom.window.document;first.controller.dispose();
  const anchor=second.host.querySelector('a');for(const el of second.host.querySelectorAll('.iui-source-rail,.iui-source-controls button,.iui-source-title'))assert.equal(el.ownerDocument,foreign);
  second.controller.setState({count:7});assert.equal(second.host.querySelector('a'),anchor);second.controller.dispose();
});

test('source compilation is deterministic and supports offline source content without retrieval',async()=>{
  const html=await compileHtml(fixture);assert.equal(html,await compileHtml(fixture));assert.ok(html.includes('connect-src'));assert.ok(html.includes('example.invalid'));assert.equal(validateDocument(doc([{type:'made-up-source',title:'Synthetic'}])).ok,false);
});
