import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount,validateDocument,evaluateState,compileHtml} from '../dist/index.js';

const record=(extra={})=>({id:'a',author:'Fictional reader Aster',body:'Synthetic supplied review.',rating:5,...extra});
const reviews=(items=[record()],extra={})=>({type:'entity-reviews',label:'Supplied reviews',items,...extra});
const spec=(node=reviews(),extra={})=>({version:'iui/1',state:{other:0},body:[node],...extra});
const setup=(input=spec(),options={},lang='en',shell='<div id="host"></div><button id="outside">Outside</button>')=>{
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`),host=dom.window.document.getElementById('host'),controller=mount(host,input,options);
  return {dom,host,controller,filter:host.querySelector('.iui-reviews-filter'),sort:host.querySelector('.iui-reviews-sort')};
};
const dispatch=(x,el,type='change')=>el.dispatchEvent(new x.dom.window.Event(type,{bubbles:true,cancelable:true}));
const change=(x,el,value)=>{el.value=value;dispatch(x,el);};
const ids=(x,visible=false)=>[...x.host.querySelectorAll(`.iui-reviews-item${visible?':not([hidden])':''}`)].map(el=>el.dataset.reviewId);
const reject=(input,code,path)=>{const result=validateDocument(input);assert.equal(result.ok,false,JSON.stringify(input));if(code)assert.ok(result.issues.some(i=>i.code===code&&i.path===path),JSON.stringify(result.issues));};
const mixed=()=>reviews([
  record({id:'missing',rating:null}),record({id:'low',rating:1,date:'2024-02-29',url:'https://example.com/low'}),
  record({id:'five',rating:5,date:'2026-01-01'}),record({id:'tied',rating:5,date:'2026-01-01'}),
  record({id:'undated',rating:3}),record({id:'unrated',rating:null,date:'0001-01-01'})
]);

test('entity reviews full and official Base schemas enforce required fields, unknowns and Unicode bounds',async()=>{
  const valid=[reviews([]),reviews(),reviews(Array.from({length:50},(_,i)=>record({id:'r'+i,rating:i%2?1:null}))),reviews([record({author:'😀'.repeat(200),body:'😀'.repeat(4000),title:'😀'.repeat(200),url:'https://e.test/'+ 'x'.repeat(2033)})],{label:'😀'.repeat(200),description:'😀'.repeat(2000),source:{label:'😀'.repeat(200)}})];
  const invalid=[
    reviews(undefined,{label:''}),reviews(undefined,{label:'😀'.repeat(201)}),reviews(undefined,{description:'😀'.repeat(2001)}),reviews(undefined,{items:undefined}),reviews(undefined,{bind:'other'}),reviews(undefined,{disabled:true}),reviews(undefined,{url:'https://example.com'}),reviews(undefined,{overallRating:4}),reviews(undefined,{reviewCount:1000}),reviews(undefined,{source:{}}),reviews(undefined,{source:{label:''}}),reviews(undefined,{source:{label:'x'.repeat(201)}}),reviews(undefined,{source:{label:'Source',url:''}}),reviews(undefined,{source:{label:'Source',url:'x'.repeat(2049)}}),reviews(undefined,{source:{label:'Source',verified:true}}),
    reviews(Array.from({length:51},(_,i)=>record({id:'r'+i}))),
    ...[{id:''},{id:'1bad'},{id:'a'.repeat(81)},{id:'a\n'},{author:''},{author:'😀'.repeat(201)},{author:{$:'other'}},{body:''},{body:'😀'.repeat(4001)},{body:{$:'other'}},{rating:undefined},{rating:0},{rating:6},{rating:1.5},{rating:'5'},{rating:{$:'other'}},{title:''},{title:'😀'.repeat(201)},{title:{$:'other'}},{url:''},{url:'x'.repeat(2049)},{date:'2024-02-29\n'},{date:'2024-2-29'},{date:'0000-01-01'},{verified:true},{helpful:3},{media:[]},{unknown:'x'}].map(x=>reviews([record(x)]))
  ];
  for(const path of ['../src/schema/iui.schema.json','../src/schema/fragments/base.schema.json']){
    const schema=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8')),validate=new Ajv({strict:true,allErrors:true}).compile(schema);
    for(const node of valid){assert.equal(validate(spec(node)),true,JSON.stringify(validate.errors));assert.equal(validateDocument(spec(node)).ok,true);}
    for(const node of invalid){assert.equal(validate(spec(node)),false,JSON.stringify(node));reject(spec(node));}
  }
});

test('entity reviews explicit null/1/5, Gregorian dates and local duplicate IDs have exact semantic paths',()=>{
  for(const rating of [null,1,5])assert.equal(validateDocument(spec(reviews([record({rating})]))).ok,true);
  for(const date of ['0001-01-01','0099-12-31','1900-02-28','2000-02-29','9999-12-31'])assert.equal(validateDocument(spec(reviews([record({date})]))).ok,true,date);
  for(const date of ['1900-02-29','2001-02-29','2024-02-30','2024-04-31'])reject(spec(reviews([record({date})])),'REVIEW_DATE','/body/0/items/0/date');
  for(const date of ['',null,0,{},'0000-01-01','10000-01-01','2024-00-01','2024-13-01','2024-01-00','2024-01-32','2024-01-01T00:00:00Z',' 2024-01-01'])reject(spec(reviews([record({date})])));
  reject(spec(reviews([record(),record()])),'DUPLICATE_ID','/body/0/items/1/id');
  assert.equal(validateDocument(spec(undefined,{body:[reviews(),reviews()]})).ok,true);
  reject(spec(undefined,{body:[{type:'section',children:[reviews([record({date:'1900-02-29'})])]}]}),'REVIEW_DATE','/body/0/children/0/items/0/date');
});

test('entity reviews source and item URLs require absolute core-safe HTTP(S), with exact paths',()=>{
  for(const url of ['https://example.com/review?q=1#text','HTTP://example.com:8080/review'])assert.equal(validateDocument(spec(reviews([record({url})],{source:{label:'Synthetic',url}}))).ok,true);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:x@example.com','tel:+123','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','data:text/html,x','https://example.com/\n']){
    reject(spec(reviews([record({url})])),'UNSAFE_URL','/body/0/items/0/url');
    reject(spec(reviews(undefined,{source:{label:'Synthetic',url}})),'UNSAFE_URL','/body/0/source/url');
  }
});

test('entity reviews all finite filter choices are exact; filtered count is honest and rows are retained',()=>{
  const x=setup(spec(mixed())),rows=[...x.host.querySelectorAll('.iui-reviews-item')];
  assert.deepEqual([...x.filter.options].map(el=>el.value),['all','rated','unrated','5','4','3','2','1']);
  for(const [value,expected] of [['rated',['low','five','tied','undated']],['unrated',['missing','unrated']],['5',['five','tied']],['4',[]],['3',['undated']],['2',[]],['1',['low']],['all',['missing','low','five','tied','undated','unrated']]]){
    change(x,x.filter,value);assert.deepEqual(ids(x,true),expected);assert.equal(x.host.querySelector('.iui-reviews-count').textContent,`${expected.length} of 6 supplied reviews shown`);assert.equal(x.host.querySelector('.iui-reviews-empty').hidden,expected.length>0);assert.deepEqual([...x.host.querySelectorAll('.iui-reviews-item')],rows);
  }
  change(x,x.filter,'4');assert.equal(x.host.querySelector('.iui-reviews-empty').textContent,'No supplied reviews match this filter.');x.controller.dispose();
});

test('entity reviews stable sort handles ties, missing dates and null ratings last in either rating direction',()=>{
  const input=spec(mixed()),before=JSON.stringify(input),freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const result=validateDocument(input);assert.equal(result.ok,true);assert.equal(Object.isFrozen(result.document.body[0].items),true);const x=setup(input);
  assert.deepEqual([...x.sort.options].map(el=>el.value),['supplied','newest','highest','lowest']);
  for(const [value,expected] of [['newest',['five','tied','low','unrated','missing','undated']],['highest',['five','tied','undated','low','missing','unrated']],['lowest',['low','undated','five','tied','missing','unrated']],['supplied',['missing','low','five','tied','undated','unrated']]]){change(x,x.sort,value);assert.deepEqual(ids(x),expected);}
  change(x,x.filter,'rated');change(x,x.sort,'newest');assert.deepEqual(ids(x,true),['five','tied','low','undated']);change(x,x.filter,'5');change(x,x.sort,'lowest');assert.deepEqual(ids(x,true),['five','tied']);assert.equal(JSON.stringify(input),before);assert.equal(result.document.body[0].items[0].rating,null);assert.equal(result.document.body[0].items[0].date,undefined);x.controller.dispose();
});

test('entity reviews sorting/filtering retains real nodes and open disclosures through repeated flows and host state',()=>{
  const x=setup(spec(mixed())),rows=new Map([...x.host.querySelectorAll('.iui-reviews-item')].map(el=>[el.dataset.reviewId,el])),details=rows.get('five').querySelector('details');details.open=true;
  x.sort.focus();for(let i=0;i<5;i++){change(x,x.sort,'lowest');change(x,x.filter,'1');change(x,x.sort,'newest');change(x,x.filter,'all');}
  assert.equal(x.dom.window.document.activeElement,x.sort);assert.equal(details.open,true);
  for(const row of x.host.querySelectorAll('.iui-reviews-item'))assert.equal(row,rows.get(row.dataset.reviewId));
  const before=[...x.host.querySelectorAll('.iui-reviews-item')],summary=details.querySelector('summary');summary.focus();x.controller.setState({other:7});assert.equal(x.dom.window.document.activeElement,summary);assert.deepEqual([...x.host.querySelectorAll('.iui-reviews-item')],before);assert.equal(details.open,true);assert.equal(x.sort.value,'newest');assert.equal(x.filter.value,'all');assert.deepEqual(x.controller.getState(),{other:7});assert.deepEqual(evaluateState(spec(mixed()),{other:1}).state,{other:1});x.controller.dispose();
});

test('entity reviews only recovers a hidden focused review control to the responsible selector and never steals outside focus',()=>{
  const x=setup(spec(mixed())),summary=x.host.querySelector('[data-review-id=five] summary'),link=x.host.querySelector('[data-review-id=low] a');
  summary.focus();change(x,x.sort,'lowest');assert.equal(x.dom.window.document.activeElement,summary);
  change(x,x.filter,'1');assert.equal(x.dom.window.document.activeElement,x.filter);
  link.focus();change(x,x.filter,'unrated');assert.equal(x.dom.window.document.activeElement,x.filter);
  const outside=x.dom.window.document.getElementById('outside');outside.focus();change(x,x.filter,'rated');change(x,x.sort,'highest');assert.equal(x.dom.window.document.activeElement,outside);
  x.sort.focus();change(x,x.filter,'4');assert.equal(x.dom.window.document.activeElement,x.sort);x.controller.dispose();
});

test('entity reviews explicit no-data, singleton and 50 records preserve every full body without arbitrary truncation',()=>{
  const empty=setup(spec(reviews([])));assert.equal(empty.filter.disabled,true);assert.equal(empty.sort.disabled,true);assert.equal(empty.host.querySelector('.iui-reviews-count').textContent,'0 of 0 supplied reviews shown');assert.equal(empty.host.querySelector('.iui-reviews-empty').textContent,'No reviews supplied.');assert.equal(empty.host.querySelectorAll('li').length,0);change(empty,empty.filter,'rated');assert.equal(empty.filter.value,'all');empty.controller.dispose();
  for(const size of [1,50]){const x=setup(spec(reviews(Array.from({length:size},(_,i)=>record({id:'r'+i,rating:null,body:'😀'.repeat(4000)})))));assert.equal(x.host.querySelectorAll('li').length,size);assert.equal(x.host.querySelectorAll('details').length,size);for(const d of x.host.querySelectorAll('details')){assert.equal(d.open,false);assert.equal(d.querySelector('p').textContent,'😀'.repeat(4000));}assert.equal(x.host.querySelector('.iui-reviews-rating').textContent,'Rating not supplied');x.controller.dispose();}
});

test('entity reviews author/title/body/source are literal, dates are exact time elements, and links disclose a safe new tab',()=>{
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)>\n😀 中文 & "';
  const x=setup(spec(reviews([record({author:literal,title:literal,body:literal,date:'0001-01-01',url:'https://example.com/review'})],{label:literal,description:literal,source:{label:literal,url:'https://example.com/source'}})));
  for(const selector of ['.iui-reviews-label','.iui-reviews-description','.iui-reviews-author','.iui-reviews-title','.iui-reviews-body'])assert.equal(x.host.querySelector(selector).textContent,literal);
  assert.equal(x.host.querySelectorAll('script,img,iframe,svg,link,form,input,button').length,0);assert.equal(x.host.querySelector('time').dateTime,'0001-01-01');assert.equal(x.host.querySelector('time').textContent,'0001-01-01');assert.equal(x.host.querySelector('time').dir,'ltr');
  for(const a of x.host.querySelectorAll('a')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.match(a.textContent,/Opens in a new tab/);}
  assert.equal(x.host.querySelector('.iui-reviews-rating').textContent,'Rating: 5 of 5');x.controller.dispose();
  const noLink=setup(spec(reviews(undefined,{source:{label:literal}})));assert.equal(noLink.host.querySelector('.iui-reviews-source-label').textContent,literal);assert.equal(noLink.host.querySelector('a,time,.iui-reviews-title'),null);noLink.controller.dispose();
});

test('entity reviews English/Chinese labels, first-visible Arabic and private ID namespace are independent',()=>{
  const x=setup(spec(reviews([record({rating:null})]),{description:'مراجعات خيالية باللغة العربية.'}),{},'zh-CN');assert.equal(x.host.querySelector('.iui-root').dir,'auto');assert.equal(x.host.querySelector('.iui-description').textContent,'مراجعات خيالية باللغة العربية.');assert.equal(x.host.querySelector('.iui-reviews-filter').labels[0].textContent,'按所提供的评分筛选');assert.equal(x.host.querySelector('summary').textContent,'完整评论');assert.equal(x.host.querySelector('.iui-reviews-rating').textContent,'未提供评分');assert.equal(x.host.querySelector('.iui-reviews-count').textContent,'显示 1 条，共提供 1 条评论');
  for(const el of x.host.querySelectorAll('.iui-reviews [id]'))assert.match(el.id,/^iui-reviews-internal-iui-\d+-\d+-/);
  for(const el of x.host.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const attribute of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(attribute)||'').split(' ').filter(Boolean))assert.ok(x.dom.window.document.getElementById(id),id);x.controller.dispose();
});

test('entity reviews own disabled and inherited fieldsets block forged changes and restore values',()=>{
  const x=setup(spec(mixed(),{state:{other:0,locked:true},body:[{type:'field',label:'Lock',disabled:{$:'locked'},children:[mixed()]}]}));
  for(const el of [x.filter,x.sort])assert.equal(el.matches(':disabled'),true);change(x,x.filter,'1');change(x,x.sort,'highest');assert.equal(x.filter.value,'all');assert.equal(x.sort.value,'supplied');assert.deepEqual(ids(x),['missing','low','five','tied','undated','unrated']);
  x.controller.setState({locked:false});change(x,x.filter,'rated');change(x,x.sort,'lowest');const before=ids(x);x.controller.setState({locked:true});change(x,x.filter,'unrated');change(x,x.sort,'newest');assert.equal(x.filter.value,'rated');assert.equal(x.sort.value,'lowest');assert.deepEqual(ids(x),before);
  x.controller.setState({locked:false});x.filter.disabled=true;x.sort.disabled=true;change(x,x.filter,'all');change(x,x.sort,'supplied');assert.equal(x.filter.value,'rated');assert.equal(x.sort.value,'lowest');x.controller.dispose();
});

test('entity reviews controls in enclosing native forms are nameless and reset stays in sync with local view',()=>{
  const x=setup(spec(mixed()),{},'en','<form id="outer"><div id="host"></div></form>'),form=x.dom.window.document.getElementById('outer');let submits=0;form.addEventListener('submit',e=>{e.preventDefault();submits++;});
  change(x,x.filter,'rated');change(x,x.sort,'lowest');const details=x.host.querySelector('details');details.open=true;const before=ids(x);
  for(const select of [x.filter,x.sort]){assert.equal(select.hasAttribute('name'),false);assert.equal(select.hasAttribute('data-bind'),false);assert.equal([...select.options].find(o=>o.defaultSelected).value,select.value);}
  assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);form.reset();assert.equal(x.filter.value,'rated');assert.equal(x.sort.value,'lowest');assert.deepEqual(ids(x),before);assert.equal(details.open,true);assert.equal(submits,0);x.controller.dispose();
});

test('entity reviews pending author Forms block selector forgeries without contributing values or submitting on disclosure',async()=>{
  let calls=0,values,resolve,signal;const x=setup(spec(mixed(),{body:[{type:'form',label:'Host form',action:'save',children:[mixed()]}]}),{actions:{save:args=>{calls++;({values,signal}=args);return new Promise(r=>resolve=r);}}});
  const form=x.host.querySelector('form');change(x,x.filter,'rated');change(x,x.sort,'lowest');x.host.querySelector('[data-review-id=low] summary').click();assert.equal(calls,0);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);dispatch(x,form,'submit');assert.equal(calls,1);assert.deepEqual(values,{});
  assert.equal(x.filter.matches(':disabled'),true);assert.equal(x.sort.matches(':disabled'),true);change(x,x.filter,'unrated');change(x,x.sort,'highest');assert.equal(x.filter.value,'rated');assert.equal(x.sort.value,'lowest');x.controller.setState({other:1});assert.equal(x.host.querySelector('[data-review-id=low] details').open,true);
  x.host.querySelector('button[type=button]').click();assert.equal(signal.aborted,true);assert.equal(x.filter.matches(':disabled'),false);assert.equal(x.sort.matches(':disabled'),false);resolve();await Promise.resolve();await Promise.resolve();x.controller.dispose();
});

test('entity reviews invalid/forged selection values cannot alter local state, order or focused content',()=>{
  const x=setup(spec(mixed()));change(x,x.filter,'rated');change(x,x.sort,'highest');const before=ids(x),summary=x.host.querySelector('[data-review-id=five] summary');summary.focus();
  for(const el of [x.filter,x.sort]){const option=x.dom.window.document.createElement('option');option.value='remote-provider';el.append(option);change(x,el,'remote-provider');}
  assert.equal(x.filter.value,'rated');assert.equal(x.sort.value,'highest');assert.deepEqual(ids(x),before);assert.equal(x.dom.window.document.activeElement,summary);x.controller.dispose();
});

test('entity reviews multiple roots and ownerDocuments avoid author ID collisions; replace/dispose removes old listeners',()=>{
  const input=spec(mixed(),{body:[mixed(),reviews(undefined,{id:'reviews-internal-iui-1-1-filter'})]}),a=setup(input),b=setup(input);assert.notEqual(a.filter.id,b.filter.id);for(const el of a.host.querySelectorAll('.iui-reviews *'))assert.equal(el.ownerDocument,a.dom.window.document);const idsAll=[...a.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(idsAll).size,idsAll.length);
  change(a,a.filter,'rated');change(a,a.sort,'lowest');const oldFilter=a.filter,oldSort=a.sort,oldRows=[...a.host.querySelector('.iui-reviews-list').children],oldOrder=oldRows.map(el=>el.dataset.reviewId);oldFilter.focus();const before=a.host.innerHTML;
  assert.throws(()=>a.controller.update(spec(reviews([record({date:'1900-02-29'})]))));assert.equal(a.host.innerHTML,before);assert.equal(a.dom.window.document.activeElement,oldFilter);assert.throws(()=>mount(a.host,spec(reviews([record({url:'javascript:x'})]))));assert.equal(a.host.innerHTML,before);
  a.controller.update(spec(mixed()));change(a,oldFilter,'unrated');change(a,oldSort,'highest');assert.deepEqual(oldRows.map(el=>el.dataset.reviewId),oldOrder);assert.equal(oldRows.find(el=>el.dataset.reviewId==='missing').hidden,true);assert.equal(a.host.querySelector('select').value,'all');
  const filter=a.host.querySelector('.iui-reviews-filter'),sort=a.host.querySelector('.iui-reviews-sort'),list=a.host.querySelector('.iui-reviews-list');a.controller.dispose();a.controller.dispose();change(a,filter,'1');change(a,sort,'highest');assert.equal(list.querySelectorAll('[hidden]').length,0);assert.deepEqual([...list.children].map(el=>el.dataset.reviewId),['missing','low','five','tied','undated','unrated']);assert.equal(a.host.childElementCount,0);change(b,b.filter,'1');assert.deepEqual([...b.host.querySelector('.iui-reviews-list').querySelectorAll('li:not([hidden])')].map(el=>el.dataset.reviewId),['low']);b.controller.dispose();
});

test('entity reviews public compile is deterministic, runs standalone offline and rejects invalid documents atomically',async()=>{
  const input=spec(reviews([record({body:'</script><script>window.pwned=1</script>',rating:null,url:'https://example.com/review'}),record({id:'b',date:'9999-12-31',rating:1})]));const html=await compileHtml(input);assert.equal(await compileHtml(input),html);let fetches=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){win.fetch=()=>{fetches++;throw Error('Unexpected request');};win.XMLHttpRequest=class{constructor(){fetches++;throw Error('Unexpected request');}};}});
  const filter=dom.window.document.querySelector('.iui-reviews-filter');filter.value='unrated';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(dom.window.document.querySelectorAll('.iui-reviews-item:not([hidden])').length,1);assert.equal(dom.window.document.querySelector('.iui-reviews-body').textContent,input.body[0].items[0].body);assert.equal(dom.window.pwned,undefined);assert.equal(fetches,0);assert.equal(dom.window.document.querySelectorAll('script[src],link[href],img,iframe').length,0);
  for(const extra of [{rating:0},{date:'1900-02-29'},{url:'javascript:x'}])await assert.rejects(()=>compileHtml(spec(reviews([record(extra)]))));dom.window.close();
});

test('entity reviews synchronous host update/dispose during focus recovery stops retired-tree paints',()=>{
  for(const action of ['update','dispose']){
    const x=setup(spec(mixed())),oldCount=x.host.querySelector('.iui-reviews-count'),oldEmpty=x.host.querySelector('.iui-reviews-empty'),oldSummary=x.host.querySelector('[data-review-id=five] summary');oldSummary.focus();
    const countBefore=oldCount.textContent,emptyBefore=oldEmpty.hidden;
    x.filter.addEventListener('focus',()=>{if(action==='update')x.controller.update(spec(reviews([], {label:'Replacement'})));else x.controller.dispose();},{once:true});
    change(x,x.filter,'1');assert.equal(oldCount.textContent,countBefore);assert.equal(oldEmpty.hidden,emptyBefore);
    if(action==='update'){assert.equal(x.host.querySelector('.iui-reviews-label').textContent,'Replacement');assert.equal(x.host.querySelector('.iui-reviews-count').textContent,'0 of 0 supplied reviews shown');}else assert.equal(x.host.childElementCount,0);
    x.controller.dispose();
  }
});
