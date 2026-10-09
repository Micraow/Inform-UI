import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount, validateDocument, evaluateState, compileHtml} from '../dist/index.js';

const article = (extra={}) => ({type:'news-article',headline:'An original synthetic article',source:{label:'Fictional source'},...extra});
const spec = (node=article(), extra={}) => ({version:'iui/1',state:{other:0},body:[node],...extra});
const full = (extra={}) => article({headline:'A supplied headline',source:{label:'Original demonstration source',url:'https://example.com/article?q=1#section'},author:'Synthetic Author',published:'2024-02-29',tags:['First','Second'],summary:'Supplied summary.',paragraphs:['First paragraph.','Second paragraph.'],...extra});
const setup = (input=spec(full()), options={}, lang='en', shell='<div id="host"></div><button id="outside">Outside</button>') => {
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`),host=dom.window.document.getElementById('host');
  const controller=mount(host,input,options);return{dom,host,controller};
};
const reject = (input,code,path) => {const result=validateDocument(input);assert.equal(result.ok,false);if(code)assert.ok(result.issues.some(issue=>issue.code===code&&issue.path===path),JSON.stringify(result.issues));};
const freeze = input => {if(input&&typeof input==='object'){Object.values(input).forEach(freeze);Object.freeze(input);}return input;};

test('news canonical full/Base/node schemas accept exact optional and Unicode bounds and reject unsupported fields',async()=>{
  for(const path of ['../src/schema/iui.schema.json','../src/schema/fragments/base.schema.json','../src/schema/fragments/nodes/base.schema.json']){
    const schema=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
    const validate=new Ajv({strict:true,allErrors:false}).compile(schema);
    const root=node=>path.includes('/nodes/')?node:spec(node);
    const maximum=article({headline:'😀'.repeat(300),source:{label:'😀'.repeat(200),url:'https://example.com/'+ 'x'.repeat(2048 - 'https://example.com/'.length)},summary:'😀'.repeat(4000),author:'😀'.repeat(200),published:'9999-12-31',paragraphs:Array.from({length:30},()=> '😀'.repeat(4000)),tags:Array.from({length:8},()=> '😀'.repeat(40)),expanded:true});
    for(const node of [article(),full(),article({summary:'',paragraphs:[],tags:[],expanded:false}),maximum]){assert.equal(validate(root(node)),true,JSON.stringify(validate.errors));assert.equal(validateDocument(spec(node)).ok,true);}
    const bad=[
      ...['headline','source'].map(key=>{const node=article();delete node[key];return node;}),
      ...[{headline:''},{headline:'😀'.repeat(301)},{headline:{$:'other'}},{source:{}},{source:{label:''}},{source:{label:'😀'.repeat(201)}},{source:{label:{$:'other'}}},{source:{label:'Source',url:''}},{source:{label:'Source',url:'x'.repeat(2049)}},{source:{label:'Source',verified:true}},
        {summary:'😀'.repeat(4001)},{summary:{$:'other'}},{author:''},{author:'😀'.repeat(201)},{author:{$:'other'}},{published:'0000-01-01'},{published:'2024-2-29'},{published:2},{paragraphs:['']},{paragraphs:['😀'.repeat(4001)]},{paragraphs:Array(31).fill('x')},{paragraphs:[{$:'other'}]},{paragraphs:[{type:'text',value:'No'}]},{tags:['']},{tags:['😀'.repeat(41)]},{tags:Array(9).fill('x')},{tags:[{$:'other'}]},{expanded:'true'},{expanded:{$:'other'}},{bind:'other'},{children:[]},{disabled:true},{image:'https://example.com/a.png'},{live:true},{credibility:10},{action:'save'},{unknown:true}].map(article)
    ];
    for(const node of bad){assert.equal(validate(root(node)),false,JSON.stringify(node));reject(spec(node));}
  }
});

test('news public structural validation reports exact bad field paths',()=>{
  for(const [patch,path] of [[{headline:''},'/headline'],[{expanded:'true'},'/expanded'],[{paragraphs:['']},'/paragraphs/0'],[{source:{label:'Source',url:''}},'/source/url'],[{tags:['']},'/tags/0'],[{summary:{$:'other'}},'/summary']])reject(spec(article(patch)),'SCHEMA','/body/0'+path);
});

test('news publication date semantics are strict floating Gregorian endpoints with exact nested paths',()=>{
  for(const published of ['0001-01-01','0099-12-31','1900-02-28','2000-02-29','2024-02-29','9999-12-31'])assert.equal(validateDocument(spec(article({published}))).ok,true,published);
  for(const published of ['1900-02-29','2023-02-29','2024-02-30','2024-04-31'])reject(spec(article({published})),'NEWS_DATE','/body/0/published');
  for(const published of ['',null,'0000-01-01','10000-01-01','2024-00-01','2024-13-01','2024-01-00','2024-01-32','2024-01-01\n',' 2024-01-01','2024-01-01T00:00:00Z'])reject(spec(article({published})));
  reject(spec({type:'section',children:[article({published:'2023-02-29'})]}),'NEWS_DATE','/body/0/children/0/published');
});

test('news source URL shares safe absolute HTTP(S) policy and preserves citation destination',()=>{
  for(const url of ['https://example.com/a?q=1#cite','HTTP://example.com:8080/path','https://example.com/%F0%9F%93%96'])assert.equal(validateDocument(spec(article({source:{label:'Source',url}}))).ok,true,url);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#citation','mailto:a@example.com','tel:+123','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','data:text/html,x','file:///a','https://example.com/\n'])reject(spec(article({source:{label:'Source',url}})),'UNSAFE_URL','/body/0/source/url');
  reject(spec({type:'col',children:[article({source:{label:'Source',url:'//example.com'}})]}),'UNSAFE_URL','/body/0/children/0/source/url');
});

test('news non-JSON input cannot execute getters; existing global text/node budgets still apply',()=>{
  let reads=0;const node=article();Object.defineProperty(node.source,'url',{enumerable:true,get(){reads++;return'https://example.com';}});reject(spec(node),'JSON_TYPE','/body/0/source/url');assert.equal(reads,0);
  const cycle=article();cycle.source.loop=cycle;reject(spec(cycle));
  const huge=spec(article(),{body:Array.from({length:17},()=>article({paragraphs:Array(30).fill('x'.repeat(4000))}))});const text=validateDocument(huge);assert.equal(text.ok,false);assert.equal(text.issues[0].code,'TEXT_LIMIT');
  const lots=spec(article(),{body:Array.from({length:4},()=>({type:'col',children:Array.from({length:500},()=>article())}))});const nodes=validateDocument(lots);assert.equal(nodes.ok,false);assert.equal(nodes.issues[0].code,'NODE_LIMIT');
});

test('news semantic article preserves supplied order, literal text, exact date and unverified provenance without mutation',()=>{
  const input=freeze(spec(full())),before=JSON.stringify(input),x=setup(input);const out=x.host.querySelector('.iui-news-article');
  assert.equal(out.getAttribute('aria-labelledby'),x.host.querySelector('h2').id);assert.equal(x.dom.window.document.getElementById(out.getAttribute('aria-describedby')).textContent,'Supplied article content and source details are unverified.');
  assert.deepEqual([...x.host.querySelectorAll('dt')].map(el=>el.textContent),['Supplied source','Supplied author','Publication date']);
  assert.equal(x.host.querySelector('time').textContent,'2024-02-29');assert.equal(x.host.querySelector('time').dateTime,'2024-02-29');assert.equal(x.host.querySelector('time').dir,'ltr');
  assert.deepEqual([...x.host.querySelectorAll('.iui-news-tag')].map(el=>el.textContent),['First','Second']);assert.deepEqual([...x.host.querySelectorAll('.iui-news-paragraph')].map(el=>el.textContent),input.body[0].paragraphs);
  assert.equal(x.host.querySelector('details').open,false);assert.equal(x.host.querySelector('summary').textContent,'Read supplied article');
  assert.equal(JSON.stringify(input),before);const result=validateDocument(input);assert.equal(Object.isFrozen(result.document.body[0].paragraphs),true);assert.equal(result.document.body[0].expanded,undefined);x.controller.dispose();
});

test('news markup and expressions remain inert in every supplied text field; links expose their new context',()=>{
  const literal='<img src=x onerror=alert(1)> </script> **text** {$:other}\n😀 العربية & "';
  const input=spec(article({headline:literal,source:{label:literal,url:'https://example.com/?q=%3Cscript%3E'},author:literal,summary:literal,paragraphs:[literal],tags:['<b>Tag</b>']}));
  const x=setup(input);for(const selector of ['.iui-news-headline','.iui-news-source-label','.iui-news-author','.iui-news-summary','.iui-news-paragraph'])assert.equal(x.host.querySelector(selector).textContent,literal);
  assert.equal(x.host.querySelector('.iui-news-tag').textContent,'<b>Tag</b>');assert.equal(x.host.querySelectorAll('img,svg,iframe,script,link,b').length,0);
  const a=x.host.querySelector('a');assert.equal(a.getAttribute('href'),input.body[0].source.url);assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.match(a.textContent,/Opens in a new tab/);x.controller.dispose();
});

test('news absent and empty optional data invent no body, date, verification, source URL or controls',()=>{
  for(const extra of [{},{paragraphs:[],tags:[],expanded:true},{summary:''}]){
    const x=setup(spec(article(extra)));assert.equal(x.host.querySelector('.iui-news-source').textContent,'Fictional source');
    assert.equal(x.host.querySelectorAll('a,time,details,summary,ul,input,button,img').length,0);assert.equal(x.host.querySelector('.iui-news-author'),null);assert.match(x.host.querySelector('.iui-news-article').textContent,/unverified/);assert.doesNotMatch(x.host.querySelector('.iui-news-article').textContent,/ago|just now|breaking|trending|credibility/i);x.controller.dispose();
  }
});

test('news maximum body is rendered whole with repeated/unsorted tags and no hidden truncation',()=>{
  const paragraphs=Array.from({length:30},(_,i)=>String(i).padStart(2,'0')+'😀'.repeat(3998)),tags=['Z','A','Z'];
  const x=setup(spec(article({paragraphs,tags,expanded:true})));assert.deepEqual([...x.host.querySelectorAll('.iui-news-paragraph')].map(el=>el.textContent),paragraphs);assert.deepEqual([...x.host.querySelectorAll('.iui-news-tag')].map(el=>el.textContent),tags);assert.equal(x.host.querySelector('details').open,true);assert.equal(x.host.querySelectorAll('[hidden],button').length,0);x.controller.dispose();
});

test('news repeated native disclosure and host changes preserve DOM/open state/focus and own no state',()=>{
  const input=spec(full()),x=setup(input),details=x.host.querySelector('details'),summary=details.querySelector('summary'),paragraph=x.host.querySelector('.iui-news-paragraph');
  summary.focus();for(let i=0;i<6;i++){summary.click();assert.equal(details.open,i%2===0);x.controller.setState({other:i+1});assert.equal(x.host.querySelector('details'),details);assert.equal(x.host.querySelector('.iui-news-paragraph'),paragraph);assert.equal(x.dom.window.document.activeElement,summary);}
  details.open=true;const outside=x.dom.window.document.getElementById('outside');outside.focus();x.controller.setState({other:7});assert.equal(x.dom.window.document.activeElement,outside);assert.equal(details.open,true);
  assert.deepEqual(x.controller.getState(),{other:7});assert.deepEqual(evaluateState(input,{other:8}).state,{other:8});assert.equal(x.host.querySelectorAll('[name],[data-bind]').length,0);x.controller.dispose();
});

test('news inside authored forms never submits or enters snapshots, even while disabled/busy',async()=>{
  let calls=0,values,resolve,signal;const input=spec(article(),{state:{other:0,note:'draft',locked:true},body:[{type:'form',label:'Host form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},{type:'field',label:'Busy reading area',disabled:{$:'locked'},children:[full()]}]}]});
  const x=setup(input,{actions:{save:args=>{calls++;({values,signal}=args);return new Promise(r=>resolve=r);}}}),form=x.host.querySelector('form'),summary=x.host.querySelector('summary'),details=x.host.querySelector('details');
  summary.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(details.open,true);assert.equal(calls,0);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls,1);assert.deepEqual(values,{note:'draft'});summary.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(details.open,false);assert.equal(calls,1);
  x.controller.setState({other:1,locked:false});assert.equal(x.host.querySelector('details'),details);summary.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(details.open,true);assert.equal(calls,1);
  x.host.querySelector('button[type=button]').click();assert.equal(signal.aborted,true);resolve();await Promise.resolve();await Promise.resolve();assert.equal(form.dataset.status,'cancelled');assert.equal(details.open,true);x.controller.dispose();
});

test('news external native form reset preserves disclosure and creates no FormData entries',()=>{
  const x=setup(spec(full()),{},'en','<form id="outer"><div id="host"></div></form>'),form=x.dom.window.document.getElementById('outer'),details=x.host.querySelector('details');details.open=true;form.reset();assert.equal(details.open,true);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);x.controller.dispose();
});

test('news localized reserved labels and namespaced IDs avoid authored IDs, roots and ownerDocument collisions',()=>{
  const x=setup(spec(full()),{},'zh-CN'),doc=x.dom.window.document;
  assert.equal(x.host.querySelector('summary').textContent,'阅读所提供的文章');assert.match(x.host.querySelector('.iui-news-note').textContent,/未经核实/);assert.match(x.host.querySelector('a').textContent,/在新标签页中打开/);
  const existingIds=[...x.host.querySelectorAll('[id]')].map(el=>el.id);const host=doc.createElement('div');doc.body.append(host);const other=mount(host,spec(article(),{body:[full({id:existingIds[0]}),full({id:'news-internal-iui-1-1-headline'})]}));
  const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const article of doc.querySelectorAll('.iui-news-article'))for(const key of ['aria-labelledby','aria-describedby']){const target=doc.getElementById(article.getAttribute(key));assert.ok(article.contains(target));assert.match(target.id,/^iui-news-internal-iui-\d+-\d+-/);}
  const frame=doc.createElement('iframe');doc.body.append(frame);const frameHost=frame.contentDocument.createElement('div');frame.contentDocument.body.append(frameHost);const child=mount(frameHost,spec(full()));for(const el of frameHost.querySelectorAll('*'))assert.equal(el.ownerDocument,frame.contentDocument);
  child.dispose();other.dispose();assert.ok(x.host.querySelector('article'));x.controller.dispose();
});

test('news invalid mount/update stays atomic; valid replacement resets defaults and disposed native nodes stay detached',()=>{
  const x=setup(),details=x.host.querySelector('details'),summary=x.host.querySelector('summary');details.open=true;summary.focus();const before=x.host.innerHTML;
  for(const invalid of [full({published:'2023-02-29'}),full({source:{label:'Source',url:'javascript:x'}}),full({paragraphs:['']})]){assert.throws(()=>x.controller.update(spec(invalid)));assert.throws(()=>mount(x.host,spec(invalid)));assert.equal(x.host.innerHTML,before);assert.equal(x.host.querySelector('details'),details);assert.equal(x.dom.window.document.activeElement,summary);}
  x.controller.update(spec(full()));const next=x.host.querySelector('details');assert.notEqual(next,details);assert.equal(next.open,false);summary.click();assert.equal(next.open,false);
  x.controller.update(spec(full({expanded:true})));assert.equal(x.host.querySelector('details').open,true);const old=x.host.querySelector('summary');x.controller.dispose();x.controller.dispose();old.click();assert.equal(x.host.childElementCount,0);assert.throws(()=>x.controller.setState({other:9}),/disposed/);assert.throws(()=>x.controller.update(spec()),/disposed/);
});

test('news actual compiler is deterministic, offline and literal and rejects invalid semantic data',async()=>{
  const input=spec(full({headline:'</script><script>window.pwned=1</script>',paragraphs:['Literal first','Literal last'],expanded:true}));const html=await compileHtml(input);assert.equal(await compileHtml(input),html);let fetches=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){win.fetch=()=>{fetches++;throw Error('Unexpected request');};win.XMLHttpRequest=class{constructor(){throw Error('Unexpected XHR');}};}}),doc=dom.window.document;
  assert.equal(doc.querySelector('.iui-news-headline').textContent,input.body[0].headline);assert.equal(dom.window.pwned,undefined);assert.equal(doc.querySelector('details').open,true);doc.querySelector('summary').click();assert.equal(doc.querySelector('details').open,false);assert.equal(fetches,0);assert.equal(doc.querySelectorAll('script[src],link[href],img,iframe').length,0);
  await assert.rejects(()=>compileHtml(spec(full({published:'1900-02-29'}))));await assert.rejects(()=>compileHtml(spec(full({source:{label:'Unsafe',url:'//example.com'}}))));dom.window.close();
});

test('news source has no custom disclosure handlers, refreshers, media, state/storage/network or animation',async()=>{
  const source=await readFile(new URL('../src/renderer/news.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/c\.(?:on|bind|cleanup|change|fromControl|getState)\s*\(|\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|setTimeout|setInterval|requestAnimationFrame)\s*[.(]/);
  const css=await readFile(new URL('../src/renderer/style.css',import.meta.url),'utf8');const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(match=>/\.iui-news(?:-|\b)/.test(match[1]));assert.ok(rules.length>0);
  // Check every actual news rule, not the stylesheet tail (which also contains
  // unrelated components appended after this module during integration).
  const block=rules.map(match=>match[0]).join('\n');assert.doesNotMatch(block,/line-clamp|text-overflow|overflow:\s*hidden|animation:|transition:/);assert.match(css,/@media\s*\(forced-colors:active\)\s*\{\.iui-root \.iui-news/);assert.match(block,/unicode-bidi:plaintext/);
});
