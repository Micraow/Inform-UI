import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount,validateDocument,evaluateState,compileHtml,compileArtifact} from '../dist/index.js';
import {assertClosedReferences} from '../scripts/schema-subsets.mjs';

const comment=(id='first',extra={})=>({id,author:'Fictional Rowan',body:'Synthetic comment.\nLiteral second line.',...extra});
const thread=(comments=[comment()],extra={})=>({type:'reddit-thread-card',title:'Fictional reading discussion',author:'Fictional Mira',body:'Synthetic thread body.',source:{label:'Synthetic local fixture'},comments,...extra});
const spec=(node=thread(),extra={})=>({version:'iui/1',state:{other:0},body:[node],...extra});
const chain=(depth,index=1)=>comment('d'+index,depth>1?{replies:[chain(depth-1,index+1)]}:{});
const total=(count)=>Array.from({length:Math.min(count,50)},(_,i)=>comment('c'+i,i+50<count?{replies:[comment('r'+i)]}:{}));
const setup=(input=spec(),options={},lang='en',shell='<div id="host"></div><button id="outside">Outside</button>')=>{
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`,{url:'https://example.invalid/'});
  const host=dom.window.document.getElementById('host'),controller=mount(host,input,options);
  return {dom,host,controller};
};
const reject=(input,code,path)=>{const result=validateDocument(input);assert.equal(result.ok,false);if(code)assert.ok(result.issues.some(issue=>issue.code===code&&issue.path===path),JSON.stringify(result.issues));return result;};
const nested=()=>thread([comment('root',{score:0,replies:[comment('child',{score:-12,replies:[comment('grandchild',{score:null})]})]}),comment('last')],{community:'Fictional reading room',score:7,source:{label:'Synthetic source',url:'https://example.invalid/discussion'}});

test('thread generated full/base/document and base-node schemas are closed, strict and recursively typed',async()=>{
  const valid=[thread([],{body:''}),thread(total(100)),thread([chain(4)]),thread([comment('a',{score:-1000000000}),comment('b',{score:1000000000}),comment('c',{score:null})],{score:0,expanded:true})];
  const invalid=[
    ...['title','author','body','source','comments'].map(key=>{const n=thread();delete n[key];return n;}),
    ...[{title:''},{title:'😀'.repeat(301)},{author:''},{author:'😀'.repeat(201)},{body:'😀'.repeat(6001)},{body:{$:'other'}},{community:''},{community:'x'.repeat(201)},{expanded:1},{score:1.5},{score:1000000001},{score:-1000000001},{score:'0'},{unknown:true},{url:'https://example.invalid'},{bind:'other'},{source:{label:''}},{source:{label:'x',url:''}},{source:{label:'x',url:'x'.repeat(2049)}},{source:{label:'x',verified:true}},{source:{url:'https://example.invalid'}}].map(extra=>thread([],extra)),
    thread(Array.from({length:51},(_,i)=>comment('c'+i))),
    ...[{id:''},{id:'1bad'},{id:'x'.repeat(81)},{author:''},{author:'😀'.repeat(201)},{body:''},{body:'😀'.repeat(4001)},{body:{$:'other'}},{score:1.1},{score:1000000001},{score:-1000000001},{score:'3'},{replies:null},{replies:Array.from({length:21},(_,i)=>comment('r'+i))},{timestamp:'2026-10-09'},{vote:1},{unknown:true}].map(extra=>thread([comment('first',{replies:[comment('nested',extra)]})]))
  ];
  for(const path of ['src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/nodes/base.schema.json']){
    const schema=JSON.parse(await readFile(path,'utf8'));assertClosedReferences(schema);const validate=new Ajv({strict:true,allErrors:false}).compile(schema),input=node=>path.includes('/nodes/')?node:spec(node);
    for(const node of valid)assert.equal(validate(input(node)),true,JSON.stringify(validate.errors));
    for(const node of invalid)assert.equal(validate(input(node)),false,JSON.stringify(node));
    assert.equal(validate(input(thread([comment('u',{author:'😀'.repeat(200),body:'😀'.repeat(4000)})],{title:'😀'.repeat(300),author:'😀'.repeat(200),body:'😀'.repeat(6000)}))),true);
  }
  for(const node of invalid)reject(spec(node));
  const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners['reddit-thread-card'],'base');
  for(const group of index.groups)for(const kind of ['documentSchema','nodeSchema'])assertClosedReferences(JSON.parse(await readFile('src/schema/fragments/'+group[kind].path,'utf8')));
});

test('thread public semantics enforce exact depth, total and widget-wide identity paths',()=>{
  for(const comments of [[],[comment()],total(100),[chain(4)]])assert.equal(validateDocument(spec(thread(comments))).ok,true);
  reject(spec(thread([chain(5)])),'THREAD_DEPTH','/body/0/comments/0/replies/0/replies/0/replies/0/replies/0');
  const tooMany=total(100);tooMany[49].replies.push(comment('overflow'));reject(spec(thread(tooMany)),'THREAD_COUNT','/body/0/comments/49/replies/1');
  reject(spec(thread([comment('same',{replies:[comment('same')]})])),'DUPLICATE_ID','/body/0/comments/0/replies/0/id');
  reject(spec(thread([comment('a',{replies:[comment('same')]}),comment('same')])),'DUPLICATE_ID','/body/0/comments/1/id');
  assert.equal(validateDocument(spec(thread(),{body:[thread(),thread()]})).ok,true);
  reject(spec(undefined,{body:[{type:'section',children:[thread([chain(5)])]}]}),'THREAD_DEPTH','/body/0/children/0/comments/0/replies/0/replies/0/replies/0/replies/0');
});

test('thread source safety accepts only explicit allowed absolute HTTP(S) with exact source paths',()=>{
  for(const url of ['https://example.invalid/path?q=1#comments','HTTP://example.invalid:8080/a'])assert.equal(validateDocument(spec(thread([],{source:{label:'Synthetic',url}}))).ok,true);
  for(const url of ['javascript:alert(1)','data:text/html,x','/path','//example.invalid','#local','mailto:a@example.invalid','tel:+123','https://u:p@example.invalid','https://example.invalid/ path','https://example.invalid\\x',' https://example.invalid','https://example.invalid/\n'])reject(spec(thread([],{source:{label:'Synthetic',url}})),'UNSAFE_URL','/body/0/source/url');
});

test('thread preserves caller arrays and recursive source order, and mounts semantic articles only once',()=>{
  const input=spec(nested()),before=JSON.stringify(input),freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const validated=validateDocument(input);assert.equal(validated.ok,true);assert.ok(Object.isFrozen(validated.document.body[0].comments[0].replies));
  const x=setup(input),items=[...x.host.querySelectorAll('.iui-thread-comment-item')];assert.equal(JSON.stringify(input),before);
  assert.deepEqual(items.map(el=>el.dataset.commentId),['root','child','grandchild','last']);assert.deepEqual(items.map(el=>el.dataset.depth),['1','2','3','1']);
  assert.equal(x.host.querySelector('.iui-thread').tagName,'ARTICLE');for(const item of items){assert.equal(item.tagName,'LI');assert.equal(item.parentElement.tagName,'UL');assert.equal(item.firstElementChild.tagName,'ARTICLE');}
  assert.equal(x.host.querySelector('.iui-thread-discussion>summary').textContent,'Supplied comments and replies (4)');
  assert.equal(x.host.querySelectorAll('details').length,3);assert.equal(x.host.querySelectorAll('details[open]').length,0);
  assert.equal(x.host.querySelector('.iui-thread-replies>summary').textContent,'Supplied replies (2, including nested replies)');
  x.controller.setState({other:1});assert.deepEqual([...x.host.querySelectorAll('.iui-thread-comment-item')],items);x.controller.dispose();
});

test('thread exact missing/null/zero/negative/positive scores are plain text without voting or invented facts',()=>{
  const x=setup(spec(thread([comment('a'),comment('b',{score:null}),comment('c',{score:0}),comment('d',{score:-8}),comment('e',{score:1000000000})],{score:-1000000000})));
  assert.deepEqual([...x.host.querySelectorAll('.iui-thread-score-value')].map(el=>el.textContent),['-1000000000','Not supplied','Not supplied','0','-8','1000000000']);
  assert.match(x.host.querySelector('.iui-thread-note').textContent,/Supplied, unverified/);
  assert.equal(x.host.querySelectorAll('.iui-thread :is(button,input,select,textarea,time,img,iframe,svg,[data-bind],[role=button])').length,0);
  assert.equal(x.host.querySelectorAll('.iui-thread a').length,0);assert.doesNotMatch(x.host.querySelector('.iui-thread').textContent,/verified author|popular|upvote|downvote|login|ago/i);x.controller.dispose();
});

test('thread empty/one/hundred comments report supplied totals honestly and honor only initial expanded',()=>{
  for(const size of [0,1,100])for(const expanded of [undefined,false,true]){
    const x=setup(spec(thread(total(size),expanded===undefined?{}:{expanded})));
    assert.equal(x.host.querySelectorAll('.iui-thread-comment-item').length,size);
    if(!size){assert.equal(x.host.querySelector('details'),null);assert.equal(x.host.querySelector('.iui-thread-empty').textContent,'No comments supplied.');}
    else{assert.equal(x.host.querySelector('.iui-thread-discussion').open,expanded??false);assert.match(x.host.querySelector('.iui-thread-discussion>summary').textContent,new RegExp(`\\(${size}\\)`));assert.equal(x.host.querySelectorAll('.iui-thread-replies[open]').length,0);}x.controller.dispose();
  }
});

test('thread hostile markup, markdown, bidi and line breaks remain literal; source links are disclosed and isolated',()=>{
  const literal='<script>globalThis.pwned=1</script><img src=x> **literal**\n\u202e中文😀 & "';
  const x=setup(spec(thread([comment('x',{author:literal,body:literal})],{title:literal,author:literal,community:literal,body:literal,source:{label:literal,url:'https://example.invalid/?q=%3Cscript%3E'}})));
  for(const selector of ['.iui-thread-title','.iui-thread-author','.iui-thread-community','.iui-thread-body','.iui-thread-comment-author','.iui-thread-comment-body','.iui-thread-source-label'])assert.equal(x.host.querySelector(selector).textContent,literal);
  const link=x.host.querySelector('.iui-thread-link');assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');assert.match(link.textContent,/Opens in a new tab/);
  assert.equal(x.host.querySelectorAll('.iui-thread :is(script,img,iframe,link,em,strong)').length,0);assert.equal(x.dom.window.pwned,undefined);x.controller.dispose();
});

test('thread nested native disclosures and focused summary survive unrelated state and atomic invalid updates',()=>{
  const x=setup(spec(nested())),details=[...x.host.querySelectorAll('details')];for(const disclosure of details)disclosure.open=true;
  const summary=details.at(-1).firstElementChild;summary.focus();x.controller.setState({other:4});
  assert.equal(x.dom.window.document.activeElement,summary);assert.deepEqual([...x.host.querySelectorAll('details')],details);assert.ok(details.every(el=>el.open));
  for(const invalid of [spec(thread([chain(5)])),spec(thread([comment(),comment()])),spec(thread([],{source:{label:'x',url:'javascript:alert(1)'}}))]){
    const before=x.host.innerHTML;assert.throws(()=>x.controller.update(invalid));assert.equal(x.host.innerHTML,before);assert.equal(x.dom.window.document.activeElement,summary);
  }
  details[0].open=false;details[0].open=true;assert.ok(details.slice(1).every(el=>el.open));
  x.dom.window.document.getElementById('outside').focus();x.controller.setState({other:5});assert.equal(x.dom.window.document.activeElement.id,'outside');
  x.controller.update(spec(nested()));assert.notEqual(x.host.querySelector('details'),details[0]);assert.equal(x.host.querySelectorAll('details[open]').length,0);
  x.controller.update(spec({...nested(),expanded:true}));assert.equal(x.host.querySelector('.iui-thread-discussion').open,true);assert.equal(x.host.querySelectorAll('.iui-thread-replies[open]').length,0);x.controller.dispose();x.controller.dispose();assert.equal(x.host.childElementCount,0);assert.throws(()=>x.controller.update(spec()));
});

test('thread stays reading content in authored forms/disabled fieldsets and never enters snapshots or FormData',async()=>{
  let captured;const node={type:'form',label:'Synthetic form',action:'save',children:[{type:'input',label:'Note',kind:'text',bind:'note'},nested()]};
  const x=setup(spec(node,{state:{note:'Draft',other:0}}),{actions:{save:({values})=>{captured=values;}}}),form=x.host.querySelector('form');
  for(const details of x.host.querySelectorAll('details'))details.open=true;
  assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]); // Inform fields intentionally use registry snapshots, not named DOM controls.
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));await Promise.resolve();await Promise.resolve();assert.deepEqual({...captured},{note:'Draft'});
  assert.ok([...x.host.querySelectorAll('details')].every(el=>el.open));assert.deepEqual(evaluateState(spec(nested()),{other:2}).state,{other:2});x.controller.dispose();
  const disabled=setup(spec({type:'field',label:'Disabled form controls',disabled:true,children:[nested()]}));
  assert.equal(disabled.host.querySelector('fieldset').disabled,true);const summary=disabled.host.querySelector('summary'),link=disabled.host.querySelector('.iui-thread-link');assert.equal(summary.matches(':disabled'),false);assert.equal(link.matches(':disabled'),false);// jsdom 26 suppresses HTMLElement.click() under disabled fieldsets; actual activation is an unexecuted browser spec.
  summary.parentElement.open=true;disabled.controller.setState({other:1});assert.equal(summary.parentElement.open,true);disabled.controller.dispose();
  const outer=setup(spec(nested()),{},'en','<form id="outer"><div id="host"></div></form>'),details=outer.host.querySelector('details');details.open=true;outer.dom.window.document.querySelector('form').reset();assert.equal(details.open,true);assert.deepEqual([...new outer.dom.window.FormData(outer.dom.window.document.querySelector('form')).entries()],[]);outer.controller.dispose();
});

test('thread multiple roots and ownerDocuments keep IDs/ARIA isolated even with adversarial authored IDs',()=>{
  const x=setup(spec(nested())),doc=x.dom.window.document,first=x.host.querySelector('h2').id;const secondHost=doc.createElement('div');doc.body.append(secondHost);
  const next=mount(secondHost,spec(thread([comment('title'),comment('note'),comment('root')],{id:first})));const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const article of doc.querySelectorAll('.iui-thread,.iui-thread-comment')){const id=article.getAttribute('aria-labelledby'),target=doc.getElementById(id);assert.ok(target);assert.ok(article.contains(target));assert.match(id,/^iui-thread-internal-iui-\d+-/);}
  const other=setup(spec(nested()),{},'zh-CN');assert.equal(other.host.querySelector('h2').ownerDocument,other.dom.window.document);assert.match(other.host.querySelector('.iui-thread-note').textContent,/未经核实/);
  x.host.querySelector('details').open=true;assert.equal(secondHost.querySelector('details').open,false);assert.equal(other.host.querySelector('details').open,false);next.dispose();x.controller.dispose();other.controller.dispose();
});

test('thread compiler is deterministic, offline, literal, bounded and emits no implicit requests',async()=>{
  const input=spec(thread([chain(4)],{body:'</script><script>globalThis.pwned=1</script>',expanded:true,source:{label:'Synthetic',url:'https://example.invalid/thread'}}));
  const html=await compileHtml(input);assert.equal(html,await compileHtml(input));assert.deepEqual(await compileArtifact(input,{assets:'shared'}),await compileArtifact(input,{assets:'shared'}));assert.match(html,/connect-src &#39;none&#39;/);
  let requests=0;const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){win.fetch=()=>{requests++;throw Error('Unexpected network');};win.XMLHttpRequest=function(){requests++;throw Error('Unexpected network');};}});
  assert.equal(dom.window.document.querySelectorAll('.iui-thread-comment').length,4);assert.equal(dom.window.document.querySelector('.iui-thread-body').textContent,input.body[0].body);assert.equal(dom.window.pwned,undefined);assert.equal(requests,0);assert.equal(dom.window.document.querySelectorAll('script[src],link[href],img,iframe').length,0);
  await assert.rejects(()=>compileHtml(spec(thread([chain(5)]))));dom.window.close();
});

test('thread keeps global JSON budgets and rejects accessors/cycles before traversal',()=>{
  const huge=spec(undefined,{body:Array.from({length:7},()=>thread(total(100).map(item=>({...item,body:'x'.repeat(4000),replies:item.replies?.map(reply=>({...reply,body:'x'.repeat(4000)}))}))))});
  assert.ok(reject(huge).issues.some(issue=>issue.code==='TEXT_LIMIT'));
  const input=spec(),cyclic=comment();cyclic.replies=[cyclic];reject(spec(thread([cyclic])),'CYCLIC_INPUT','/body/0/comments/0/replies/0');
  let accessed=false;Object.defineProperty(input.body[0].comments[0],'body',{enumerable:true,get(){accessed=true;return 'bad';}});reject(input,'JSON_TYPE','/body/0/comments/0/body');assert.equal(accessed,false);
});

test('thread numeric negative zero displays as zero consistently in mount/compile without changing supplied input',async()=>{
  const input=spec(thread([comment('a',{score:-0})],{score:-0}));const x=setup(input);
  assert.ok(Object.is(input.body[0].score,-0));assert.ok(Object.is(input.body[0].comments[0].score,-0));assert.deepEqual([...x.host.querySelectorAll('.iui-thread-score-value')].map(el=>el.textContent),['0','0']);
  const dom=new JSDOM(await compileHtml(input),{runScripts:'dangerously'});assert.deepEqual([...dom.window.document.querySelectorAll('.iui-thread-score-value')].map(el=>el.textContent),['0','0']);
  assert.ok(Object.is(input.body[0].score,-0));assert.ok(Object.is(input.body[0].comments[0].score,-0));x.controller.dispose();dom.window.close();
});

test('thread inline-size containment has a bounded intrinsic basis when used as a direct flow child',async()=>{
 const styles=await readFile('src/renderer/style.css','utf8');
 assert.match(styles,/\.iui-flow\s*>\s*:is\([^)]*\.iui-thread[^)]*\)\s*\{\s*flex-basis:\s*min\(20rem,\s*100%\)/);
 const x=setup(spec({type:'flow',children:[thread([chain(4)],{expanded:true}),{type:'text',value:'Independent sibling'}]}));
 assert.equal(x.host.querySelectorAll('.iui-flow > .iui-thread').length,1);x.controller.dispose();
});
