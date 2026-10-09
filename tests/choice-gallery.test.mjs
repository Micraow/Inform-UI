import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
import {mount as browserMount,validateDocument as browserValidate} from '../dist/browser.js';

const image=(extra={})=>({id:'one',src:'https://example.invalid/one.png',alt:'Supplied first photo',caption:'Supplied caption',...extra});
const place=(extra={})=>({id:'one',label:'Example courtyard',address:'1 Example Lane',description:'Supplied entrance details',...extra});
const choice=(extra={})=>({type:'location-choice-request',id:'places',label:'Supplied places',options:[place(),place({id:'two',label:'Example terrace',address:undefined})].map(p=>Object.fromEntries(Object.entries(p).filter(([,v])=>v!==undefined))),...extra});
const gallery=(extra={})=>({type:'business-gallery',label:'Supplied gallery',images:[image(),image({id:'two',src:'https://example.invalid/two.png',alt:'Supplied second photo'})],...extra});
const spec=(node=choice(),extra={})=>({version:'iui/1',state:{other:0},body:[node],...extra});
const setup=(input=spec(),options={},lang='en',mountFn=mount)=>{
  const dom=new JSDOM(`<html lang="${lang}"><body><div id="host"></div><button id="outside">Outside</button></body></html>`),doc=dom.window.document,host=doc.getElementById('host'),controller=mountFn(host,input,options);
  return {dom,doc,host,controller,root:host.querySelector('.iui-location-choice'),clear:host.querySelector('.iui-location-choice-clear'),status:host.querySelector('.iui-location-choice-status'),selection:host.querySelector('.iui-location-choice-selection')};
};
const button=(x,id='one')=>x.host.querySelector(`[data-option-id=${id}]`);
const media=(x,id='one')=>x.host.querySelector(`[data-image-id=${id}]`);
const load=(x,id='one')=>media(x,id).querySelector('button');
const click=(x,el)=>el.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
const chosen=x=>[...x.host.querySelectorAll('.iui-location-choice-option[aria-pressed=true]')].map(el=>el.dataset.optionId);
const reject=(input,code,path)=>{const r=validateDocument(input);assert.equal(r.ok,false);if(code)assert.ok(r.issues.some(i=>i.code===code&&i.path===path),JSON.stringify(r.issues));return r;};
const many=(factory,n=12)=>Array.from({length:n},(_,i)=>factory({id:`item${i}`}));

test('choice/gallery canonical Base schemas enforce bounds and strict literal shapes',async()=>{
  const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
  for(const [type,name] of [['location-choice-request','LocationChoiceRequestNode'],['business-gallery','BusinessGalleryNode']]){assert.equal(index.nodeOwners[type],'base');assert.equal(full.$defs.Node.oneOf.filter(n=>n.$ref===`#/$defs/${name}`).length,1);}
  const good=[choice({options:many(place)}),gallery({images:many(image)}),choice({label:'😀'.repeat(200),description:'😀'.repeat(2000),options:[place({label:'😀'.repeat(200),address:'😀'.repeat(1000),description:'😀'.repeat(1000)})],source:{label:'😀'.repeat(200),url:'https://example.com'}}),gallery({label:'😀'.repeat(200),description:'😀'.repeat(2000),images:[image({alt:'😀'.repeat(2000),caption:'😀'.repeat(2000),src:'x'.repeat(500000)})]})];
  const bad=[];
  for(const make of [choice,gallery])for(const patch of [{label:''},{label:'😀'.repeat(201)},{label:{$:'other'}},{description:'😀'.repeat(2001)},{description:null},{unknown:true},{bind:'other'},{action:'lookup'},{provider:'service'},{disabled:true},{initial:'one'}])bad.push(make(patch));
  for(const options of [[],many(place,13),null])bad.push(choice({options}));
  for(const images of [[],many(image,13),null])bad.push(gallery({images}));
  for(const patch of [{id:''},{id:'1bad'},{id:'x'.repeat(81)},{id:'one\n'},{label:''},{label:'😀'.repeat(201)},{address:'😀'.repeat(1001)},{description:'😀'.repeat(1001)},{address:null},{description:{$:'other'}},{coordinates:[0,0]},{distance:1},{url:'https://example.com'}])bad.push(choice({options:[place(patch)]}));
  for(const patch of [{id:''},{id:'1bad'},{id:'x'.repeat(81)},{id:'one\n'},{src:''},{src:'x'.repeat(500001)},{src:null},{alt:''},{alt:'😀'.repeat(2001)},{caption:'😀'.repeat(2001)},{caption:null},{alt:{$:'other'}},{width:100},{fit:'cover'},{url:'https://example.com'}])bad.push(gallery({images:[image(patch)]}));
  for(const source of [{label:''},{label:'😀'.repeat(201)},{label:'x',url:''},{label:'x',url:'x'.repeat(2049)},{label:'x',unknown:true},null])bad.push(choice({source}));
  for(const file of ['iui.schema.json','fragments/base.schema.json','fragments/nodes/base.schema.json']){
    const schema=JSON.parse(await readFile(`src/schema/${file}`,'utf8')),validate=new Ajv({strict:true}).compile(schema),wrap=n=>file.includes('/nodes/')?n:spec(n);
    for(const n of good)assert.equal(validate(wrap(n)),true,JSON.stringify(validate.errors));
    for(const n of bad)assert.equal(validate(wrap(n)),false,JSON.stringify(n).slice(0,100));
  }
  for(const n of bad)reject(spec(n));
});

test('choice/gallery required fields, non-JSON values and duplicate paths are public errors',()=>{
  for(const [make,fields,record,list] of [[choice,['label','options'],place,'options'],[gallery,['label','images'],image,'images']]){
    for(const field of fields){const n=make();delete n[field];reject(spec(n));reject(spec(make({[field]:null})));}
    for(const field of ['id',...(list==='options'?['label']:['src','alt'])]){const entry=record();delete entry[field];reject(spec(make({[list]:[entry]})));}
    reject(spec(make({[list]:[record(),record()]})),'DUPLICATE_ID',`/body/0/${list}/1/id`);
    reject(spec({type:'section',children:[make({[list]:[record(),record()]})]}),'DUPLICATE_ID',`/body/0/children/0/${list}/1/id`);
    assert.equal(validateDocument(spec(undefined,{body:[make(),make({id:undefined})].map(n=>Object.fromEntries(Object.entries(n).filter(([,v])=>v!==undefined)))})).ok,true);
    reject(spec(make({label:()=>{}})));reject(spec(make({description:Infinity})));
  }
  assert.equal(evaluateState(spec(),{other:1}).ok,true);
});

test('choice source URLs and gallery image URLs reuse exact public policies and paths',()=>{
  for(const url of ['https://example.com/path?q=1#read','HTTP://example.com:8080/read'])assert.equal(validateDocument(spec(choice({source:{label:'Source',url}}))).ok,true);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:a@example.com','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','https://example.com/\n','data:text/html,x'])reject(spec(choice({source:{label:'Source',url}})),'UNSAFE_URL','/body/0/source/url');
  for(const src of ['https://example.com/a.png','http://example.com/a.png','data:image/png;base64,AAAA','data:image/jpeg;base64,AAAA','data:image/gif;base64,AAAA','data:image/webp;base64,AAAA','javascript:alert(1)','file:///x','//example.com/a.png','/a.png','https://u:p@example.com/a.png','data:image/svg+xml;base64,PHN2Zz4=','data:text/html;base64,AAAA','https://example.com/a b','https://example.com/a\n','data:image/png;base64,invalid!']){
    const same=validateDocument(spec({type:'image',src,alt:'Supplied'})).ok,r=validateDocument(spec(gallery({images:[image({src})]})));assert.equal(r.ok,same,src);
    if(!same)reject(spec(gallery({images:[image({src})]})),'UNSAFE_URL','/body/0/images/0/src');
  }
});

test('choice exact frozen owner-window event is cancelable bubbling noncomposed and repeated explicit choices are allowed',()=>{
  for(const mountFn of [mount,browserMount]){
    const x=setup(spec(),{},'en',mountFn);let event,calls=0,cancel=false;x.host.addEventListener('iui:location-choice',e=>{event=e;calls++;if(cancel)e.preventDefault();});
    assert.equal(calls,0);assert.deepEqual(chosen(x),[]);assert.equal(x.clear.getAttribute('aria-disabled'),'true');
    button(x).click();assert.ok(event instanceof x.dom.window.CustomEvent);assert.equal(event.target,x.root);assert.equal(event.bubbles,true);assert.equal(event.cancelable,true);assert.equal(event.composed,false);assert.deepEqual(event.detail,{componentId:'places',optionId:'one',label:'Example courtyard',address:'1 Example Lane'});assert.equal(Object.isFrozen(event.detail),true);assert.throws(()=>event.detail.optionId='two',TypeError);
    button(x).click();assert.equal(calls,2);cancel=true;button(x,'two').click();assert.equal(calls,3);assert.deepEqual(chosen(x),['one']);assert.equal(x.status.textContent,'The local choice was not accepted.');assert.equal(x.root.dataset.status,'not-accepted');
    cancel=false;button(x,'two').click();assert.equal(event.detail.address,null);assert.deepEqual(chosen(x),['two']);assert.equal(x.status.textContent,'Local choice selected.');assert.equal(browserValidate(spec()).ok,true);x.controller.dispose();
  }
  const n=choice();delete n.id;const x=setup(spec(n));x.host.addEventListener('iui:location-choice',e=>assert.equal(e.detail.componentId,null));button(x).click();x.controller.dispose();
});

test('choice canceled initial action and empty Clear are strict no-ops; focus, selection and DOM survive unrelated updates',()=>{
  const x=setup();let calls=0;const stop=e=>{calls++;e.preventDefault();};x.host.addEventListener('iui:location-choice',stop);
  const initial=x.root.outerHTML;x.clear.focus();x.clear.click();assert.equal(x.root.outerHTML,initial);assert.equal(x.doc.activeElement,x.clear);
  button(x).click();assert.deepEqual(chosen(x),[]);const rejected=x.root.outerHTML;x.clear.click();assert.equal(x.root.outerHTML,rejected);assert.equal(calls,1);x.host.removeEventListener('iui:location-choice',stop);
  button(x).click();const nodes=[...x.root.querySelectorAll('*')],before=x.root.outerHTML;button(x).focus();x.controller.setState({other:1});assert.equal(x.root.outerHTML,before);assert.deepEqual([...x.root.querySelectorAll('*')],nodes);assert.equal(x.doc.activeElement,button(x));
  x.clear.focus();x.clear.click();assert.deepEqual(chosen(x),[]);assert.equal(x.clear.getAttribute('aria-disabled'),'true');assert.equal(x.status.textContent,'');assert.equal(x.doc.activeElement,x.clear);x.controller.dispose();
});

test('choice blocks synchronous nested choices, Clear and constructor reentry',()=>{
  const x=setup();button(x).click();let calls=0;
  x.host.addEventListener('iui:location-choice',()=>{calls++;button(x).click();click(x,button(x,'two'));x.clear.click();});button(x,'two').click();assert.equal(calls,1);assert.deepEqual(chosen(x),['two']);
  const Original=x.dom.window.CustomEvent;Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,value:class extends Original{constructor(...args){super(...args);button(x).click();x.clear.click();}}});button(x).click();assert.equal(calls,2);assert.deepEqual(chosen(x),['one']);x.controller.dispose();
});

test('choice inherited native disabled and hidden ancestors reject forged action and Clear',()=>{
  const x=setup();let calls=0;x.host.addEventListener('iui:location-choice',()=>calls++);button(x).click();const before=x.root.outerHTML;
  const fieldset=x.doc.createElement('fieldset');x.host.replaceWith(fieldset);fieldset.append(x.host);fieldset.disabled=true;click(x,button(x,'two'));click(x,x.clear);assert.equal(calls,1);assert.equal(x.root.outerHTML,before);
  fieldset.disabled=false;x.root.hidden=true;click(x,button(x,'two'));click(x,x.clear);assert.equal(calls,1);x.root.hidden=false;button(x,'two').disabled=true;click(x,button(x,'two'));assert.equal(calls,1);button(x,'two').disabled=false;button(x,'two').click();assert.equal(calls,2);x.controller.dispose();
});

test('choice host update/dispose during dispatch or CustomEvent getter/construction cannot dispatch or paint stale trees',()=>{
  for(const hook of ['listener','getter','constructor'])for(const action of ['update','dispose'])for(const canceled of [false,true]){
    const x=setup(),old=x.root,btn=button(x),before=old.outerHTML,Original=x.dom.window.CustomEvent;let calls=0;
    const replace=()=>action==='update'?x.controller.update(spec()):x.controller.dispose();
    old.addEventListener('iui:location-choice',e=>{calls++;if(canceled)e.preventDefault();if(hook==='listener')replace();});
    if(hook==='getter')Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,get(){replace();return Original;}});
    if(hook==='constructor')Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,value:class extends Original{constructor(...args){super(...args);replace();}}});
    btn.click();assert.equal(calls,hook==='listener'?1:0);assert.equal(old.outerHTML,before);assert.equal(old.isConnected,false);assert.deepEqual(chosen(x),[]);x.controller.dispose();
  }
});

test('choice/gallery invalid replacement is atomic; valid replacement/disposal removes retained controls',()=>{
  for(const make of [choice,gallery])for(const action of ['update','dispose']){
    const x=setup(spec(make())),root=x.host.querySelector(make===choice?'.iui-location-choice':'.iui-business-gallery'),control=root.querySelector('button');control.focus();const before=x.host.innerHTML;
    assert.throws(()=>x.controller.update(spec(make({label:''}))));assert.equal(x.host.innerHTML,before);assert.equal(x.doc.activeElement,control);assert.throws(()=>mount(x.host,spec(make({label:''}))));assert.equal(x.host.innerHTML,before);
    const old=root.outerHTML;if(action==='update')x.controller.update(spec(make()));else x.controller.dispose();click(x,control);assert.equal(root.outerHTML,old);assert.equal(root.isConnected,false);assert.equal(x.host.querySelector('img'),null);assert.deepEqual(chosen(x),[]);x.controller.dispose();x.controller.dispose();
  }
});

test('choice/gallery Forms never submit or add names/values; pending actions block every local control',async()=>{
  let resolve,values,calls=0;const input=spec({type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},choice(),gallery()]},{state:{other:0,note:'supplied'}});
  const x=setup(input,{actions:{save:ctx=>{calls++;values=ctx.values;return new Promise(r=>resolve=r);}}});let events=0;x.host.addEventListener('iui:location-choice',()=>events++);
  const form=x.host.querySelector('form');button(x).click();x.clear.click();assert.equal(calls,0);assert.equal(events,1);assert.equal(x.host.querySelector('.iui-business-gallery [name],.iui-location-choice [name],.iui-business-gallery [data-bind],.iui-location-choice [data-bind]'),null);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.deepEqual(values,{note:'supplied'});assert.equal(button(x).matches(':disabled'),true);assert.equal(load(x).matches(':disabled'),true);click(x,button(x));click(x,x.clear);click(x,load(x));assert.equal(events,1);assert.equal(x.host.querySelector('img'),null);
  resolve();await Promise.resolve();await Promise.resolve();button(x).click();load(x).click();assert.equal(events,2);assert.equal(media(x).querySelectorAll('img').length,1);assert.equal(calls,1);x.controller.dispose();
});

test('choice/gallery outer form reset preserves local state and has no FormData',()=>{
  const x=setup(spec(undefined,{body:[choice(),gallery()]})),form=x.doc.createElement('form');x.host.replaceWith(form);form.append(x.host);button(x).click();load(x).click();const before=x.host.innerHTML;form.reset();assert.equal(x.host.innerHTML,before);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);x.controller.dispose();
});

test('choice/gallery literal markup, Unicode and ordinary disclosed source reading remain inert',()=>{
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)> 😀 العربية 中文';
  const x=setup(spec(undefined,{body:[choice({label:literal,description:literal,options:[place({label:literal,address:literal,description:literal})],source:{label:literal,url:'https://example.com/?q=%3Cscript%3E'}}),gallery({label:literal,description:literal,images:[image({alt:literal,caption:literal})]})]}));
  for(const cls of ['.iui-location-choice-title','.iui-location-choice-description','.iui-location-choice-label','.iui-location-choice-address','.iui-location-choice-detail','.iui-business-gallery-title','.iui-business-gallery-description','.iui-business-gallery-caption'])assert.equal(x.host.querySelector(cls).textContent,literal);
  assert.equal(x.host.querySelector('script,img,iframe,svg'),null);const link=x.host.querySelector('a');assert.equal(link.href,'https://example.com/?q=%3Cscript%3E');assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');assert.match(link.textContent,/Opens in a new tab/);
  const fieldset=x.doc.createElement('fieldset');fieldset.disabled=true;x.host.replaceWith(fieldset);fieldset.append(x.host);let prevented;link.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault();});click(x,link);assert.equal(prevented,false);fieldset.disabled=false;load(x).click();assert.equal(media(x).querySelector('img').alt,literal);assert.equal(media(x).querySelector('figcaption').textContent,literal);x.controller.dispose();
  const y=setup(spec(choice({source:{label:'Label only'}})));assert.equal(y.host.querySelector('a'),null);assert.equal(y.host.querySelector('.iui-location-choice-source').textContent,'Source: Label only');y.controller.dispose();
});

test('gallery remote media has no preload URLs, stays ordered and has independent one-shot explicit consent',()=>{
  for(const mountFn of [mount,browserMount]){
    const x=setup(spec(gallery()),{},'en',mountFn);assert.equal(x.host.querySelector('img,[src],[srcset],[poster],link,iframe'),null);assert.equal(x.host.querySelector('.iui-business-gallery-images').tagName,'OL');assert.equal(x.host.querySelectorAll('figure').length,2);
    assert.deepEqual([...x.host.querySelectorAll('[data-image-id]')].map(el=>el.dataset.imageId),['one','two']);const first=load(x),caption=media(x).querySelector('figcaption');first.click();
    const img=media(x).querySelector('img');assert.equal(img.src,'https://example.invalid/one.png');assert.equal(img.alt,'Supplied first photo');assert.equal(img.loading,'lazy');assert.equal(img.decoding,'async');assert.equal(img.referrerPolicy,'no-referrer');assert.equal(img.style.objectFit,'contain');assert.equal(media(x).querySelector('figcaption'),caption);assert.equal(media(x,'two').querySelector('img'),null);
    const before=media(x).innerHTML;click(x,first);assert.equal(media(x).innerHTML,before);load(x,'two').click();assert.equal(x.host.querySelectorAll('img').length,2);x.controller.dispose();
  }
});

test('gallery focus, consent, caption and loaded DOM survive unrelated state and other choices',()=>{
  const x=setup(spec(undefined,{body:[gallery(),choice()]}));const first=load(x),second=load(x,'two'),caption=media(x).querySelector('figcaption');second.focus();x.controller.setState({other:1});assert.equal(x.doc.activeElement,second);assert.equal(load(x),first);assert.equal(media(x).querySelector('figcaption'),caption);
  first.click();const img=media(x).querySelector('img');button(x).click();x.controller.setState({other:2});assert.equal(media(x).querySelector('img'),img);assert.equal(media(x).querySelector('figcaption'),caption);assert.equal(load(x,'two'),second);assert.equal(media(x,'two').querySelector('img'),null);x.controller.dispose();
});

test('shared image gate rejects forged disabled/hidden/detached clicks for both direct image and gallery',()=>{
  for(const n of [{type:'image',src:'https://example.invalid/direct.png',alt:'Direct'},gallery()]){
    const x=setup(spec(n)),btn=x.host.querySelector('button'),fieldset=x.doc.createElement('fieldset');x.host.replaceWith(fieldset);fieldset.append(x.host);fieldset.disabled=true;click(x,btn);assert.equal(x.host.querySelector('img'),null);
    fieldset.disabled=false;btn.disabled=true;click(x,btn);assert.equal(x.host.querySelector('img'),null);btn.disabled=false;x.host.hidden=true;click(x,btn);assert.equal(x.host.querySelector('img'),null);x.host.hidden=false;
    const parent=btn.parentElement;btn.remove();click(x,btn);assert.equal(x.host.querySelector('img'),null);parent.append(btn);const root=x.host.parentElement;x.host.remove();click(x,btn);assert.equal(x.host.querySelector('img'),null);root.append(x.host);btn.click();assert.equal(x.host.querySelectorAll('img').length,1);x.controller.dispose();
  }
});

test('shared image gate does not assign src after lifecycle replacement during createElement or on retained old buttons',()=>{
  for(const n of [{type:'image',src:'https://example.invalid/direct.png',alt:'Direct'},gallery()])for(const action of ['update','dispose']){
    const x=setup(spec(n)),btn=x.host.querySelector('button'),old=x.host.firstElementChild,html=old.outerHTML,create=x.doc.createElement.bind(x.doc);let images=0;const created=[];
    x.doc.createElement=(name,...args)=>{const el=create(name,...args);if(name==='img'){images++;created.push(el);if(action==='update')x.controller.update(spec(n));else x.controller.dispose();}return el;};
    btn.click();assert.equal(images,1);assert.equal(created[0].hasAttribute('src'),false);assert.equal(old.outerHTML,html);assert.equal(x.host.querySelector('img'),null);click(x,btn);assert.equal(images,1);x.controller.dispose();
  }
});

test('shared image gate suppresses synchronous creation reentry and repeated retained action',()=>{
  const x=setup(spec(gallery())),btn=load(x),create=x.doc.createElement.bind(x.doc);let count=0;x.doc.createElement=(name,...args)=>{if(name==='img'){count++;click(x,btn);}return create(name,...args);};btn.click();assert.equal(count,1);click(x,btn);assert.equal(count,1);x.controller.dispose();
});

test('gallery load/error never removes meaningful alt/caption or paints after disposal',()=>{
  const x=setup(spec(gallery())),caption=media(x).querySelector('figcaption');load(x).click();const img=media(x).querySelector('img'),figure=img.closest('figure');assert.equal(figure.dataset.imageStatus,'loading');img.dispatchEvent(new x.dom.window.Event('error'));assert.equal(figure.dataset.imageStatus,'error');assert.equal(img.alt,'Supplied first photo');assert.equal(media(x).querySelector('figcaption'),caption);assert.equal(media(x,'two').querySelector('img'),null);
  x.controller.setState({other:1});assert.equal(figure.dataset.imageStatus,'error');x.controller.dispose();const before=figure.outerHTML;img.dispatchEvent(new x.dom.window.Event('load'));assert.equal(figure.outerHTML,before);
  const y=setup(spec(gallery()));load(y).click();const loaded=media(y).querySelector('img');loaded.dispatchEvent(new y.dom.window.Event('load'));assert.equal(loaded.closest('figure').dataset.imageStatus,'loaded');y.controller.dispose();
});

test('original deterministic inline raster uses ordinary image renderer without external consent',async()=>{
  const input=JSON.parse(await readFile('examples/business-gallery.json','utf8')),n=input.body[0],src=n.images.find(i=>i.src.startsWith('data:')).src;assert.equal(validateDocument(input).ok,true);const x=setup(input),img=x.host.querySelector('img');assert.equal(img.src,src);assert.equal(img.alt,n.images.find(i=>i.src===src).alt);assert.equal(img.style.objectFit,'contain');assert.equal(x.host.querySelectorAll('button').length,2);assert.equal(Buffer.from(src.split(',')[1],'base64').subarray(1,4).toString(),'PNG');x.controller.dispose();
});

test('choice/gallery ownerDocument, null defaultView fallback, shadow isolation and multiple roots',()=>{
  const x=setup(spec(undefined,{body:[choice(),gallery()]})),y=setup(spec(undefined,{body:[choice(),gallery()]}));const ids=[...x.host.querySelectorAll('[id]'),...y.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const el of x.host.querySelectorAll('[aria-labelledby],[aria-describedby]'))for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(attr)||'').split(' ').filter(Boolean))assert.ok(x.doc.getElementById(id));
  button(x).click();load(x).click();assert.deepEqual(chosen(y),[]);assert.equal(y.host.querySelector('img'),null);x.controller.dispose();y.controller.dispose();
  const dom=new JSDOM('<iframe></iframe><div id="parent"></div>');for(const doc of [dom.window.document.querySelector('iframe').contentDocument,dom.window.document.implementation.createHTMLDocument('No window')]){
    const host=doc.createElement('div');doc.body.append(host);const controller=mount(host,spec(undefined,{body:[choice(),gallery()]}));let event;host.addEventListener('iui:location-choice',e=>event=e);host.querySelector('[data-option-id=one]').click();assert.equal(event.detail.optionId,'one');assert.equal(event.composed,false);host.querySelector('.iui-business-gallery button').click();assert.ok([...host.querySelectorAll('*')].every(el=>el.ownerDocument===doc));controller.dispose();
  }
  const parent=dom.window.document.getElementById('parent'),shadow=parent.attachShadow({mode:'open'}),host=dom.window.document.createElement('div');shadow.append(host);const controller=mount(host,spec());let inside=0,outside=0;host.addEventListener('iui:location-choice',()=>inside++);parent.addEventListener('iui:location-choice',()=>outside++);host.querySelector('[data-option-id=one]').click();assert.equal(inside,1);assert.equal(outside,0);controller.dispose();
});

test('choice/gallery local disclosures follow host language without changing supplied Arabic-first text or focus',()=>{
  const x=setup(spec(undefined,{body:[choice({label:'اختر المكان',options:[place({label:'الفناء',address:'العنوان'})]}),gallery({label:'صور مقدمة'})]}),{},'zh-CN');assert.equal(x.root.dir,'auto');assert.equal(x.host.querySelector('.iui-business-gallery').dir,'auto');assert.equal(x.clear.textContent,'清除本地选择');assert.match(x.host.querySelector('.iui-location-choice-note').textContent,/当前页面/);assert.match(x.host.querySelector('.iui-business-gallery-note').textContent,/未经核实/);assert.equal(load(x).textContent,'加载外部图片');assert.equal(x.host.querySelector('.iui-location-choice-title').textContent,'اختر المكان');const outside=x.doc.getElementById('outside');outside.focus();x.controller.setState({other:1});button(x).click();assert.equal(x.doc.activeElement,outside);x.controller.dispose();
});

test('choice/gallery deterministic standalone compiler performs no network, location, storage or timer work',async()=>{
  const input=spec(undefined,{body:[choice({label:'</script><script>window.pwned=1</script>'}),gallery()]});const html=await compileHtml(input);assert.equal(html,await compileHtml(input));let calls=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){for(const name of ['fetch','XMLHttpRequest','WebSocket'])win[name]=()=>{calls++;throw Error('network');};for(const name of ['localStorage','sessionStorage'])Object.defineProperty(win,name,{get(){calls++;throw Error('storage');}});Object.defineProperty(win.navigator,'geolocation',{get(){calls++;throw Error('location');}});win.setInterval=()=>{calls++;throw Error('timer');};}});
  const doc=dom.window.document;let events=0;doc.addEventListener('iui:location-choice',()=>events++);doc.querySelector('[data-option-id=one]').click();doc.querySelector('.iui-location-choice-clear').click();assert.equal(events,1);assert.equal(calls,0);assert.equal(dom.window.pwned,undefined);assert.equal(doc.querySelector('img,[src],iframe'),null);assert.deepEqual(JSON.parse(doc.getElementById('iui-data').textContent),validateDocument(input).document);
  await assert.rejects(()=>compileHtml(spec(gallery({images:[image({src:'data:image/svg+xml;base64,AAAA'})]}))));dom.window.close();
});

test('choice/gallery generated closed subsets match ownership, metrics and all example bytes without stale counts',async()=>{
  const {createHash}=await import('node:crypto'),{readdir}=await import('node:fs/promises');
  const {assertOwners,assertClosedReferences,createSchemaSubset,encodeSchema,schemaMetrics,SCHEMA_GROUPS}=await import('../scripts/schema-subsets.mjs');
  const text=await readFile('src/schema/iui.schema.json','utf8'),full=JSON.parse(text),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
  const owned=assertOwners(full,index.nodeOwners);assert.equal(new Set(index.groups.flatMap(g=>g.ownedNodeTypes)).size,owned.length);assert.equal(index.groups.reduce((n,g)=>n+g.ownedNodeTypes.length,0),owned.length);assert.equal(index.fullSchema.sha256,createHash('sha256').update(text).digest('hex'));
  for(const group of index.groups)for(const kind of ['documentSchema','nodeSchema']){
    const entry=group[kind],bytes=await readFile('src/schema/fragments/'+entry.path,'utf8'),schema=JSON.parse(bytes);assertClosedReferences(schema);assert.deepEqual(schemaMetrics(bytes),Object.fromEntries(Object.entries(entry).filter(([k])=>!['path','rootKind'].includes(k))));
    const validate=new Ajv({strict:true}).compile(schema);for(const node of [choice(),gallery()]){const input=kind==='nodeSchema'?node:spec(node);assert.equal(validate(input),kind==='documentSchema'||group.id==='base',entry.path);const invalid=structuredClone(input);if(kind==='nodeSchema')invalid.unknown=true;else invalid.body[0].unknown=true;assert.equal(validate(invalid),false,entry.path);}
  }
  const before=encodeSchema(full),all=createSchemaSubset(full,index.nodeOwners,Object.keys(SCHEMA_GROUPS)),a=createSchemaSubset(full,index.nodeOwners,['base','forms']),b=createSchemaSubset(full,index.nodeOwners,['forms','base','forms']);assert.equal(encodeSchema(a),encodeSchema(b));assert.equal(encodeSchema(full),before);
  const validate=new Ajv({strict:true}).compile(all);for(const file of (await readdir('examples')).filter(f=>f.endsWith('.json'))){const input=JSON.parse(await readFile('examples/'+file,'utf8'));assert.equal(validate(input),true,file);assert.equal(validateDocument(input).ok,true,file);}
});

test('ordinary image remains blocked during native pending Forms and survives unrelated state',async()=>{
  let resolve;const input=spec({type:'form',label:'Save',action:'save',children:[{type:'image',src:'https://example.invalid/direct.png',alt:'Ordinary image'}]});
  const x=setup(input,{actions:{save:()=>new Promise(r=>resolve=r)}}),button=x.host.querySelector('.iui-image button'),form=x.host.querySelector('form');button.focus();x.controller.setState({other:1});assert.equal(x.doc.activeElement,button);assert.equal(x.host.querySelector('.iui-image button'),button);
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(button.matches(':disabled'),true);click(x,button);assert.equal(x.host.querySelector('img'),null);resolve();await Promise.resolve();await Promise.resolve();assert.equal(button.matches(':disabled'),false);button.click();assert.equal(x.host.querySelector('img').src,'https://example.invalid/direct.png');x.controller.dispose();
});

test('shared image renderer honors case-insensitive inline raster policy and stops painting after a synchronous src hook',()=>{
  for(const n of [{type:'image',src:'DATA:image/png;base64,AAAA',alt:'Inline'},gallery({images:[image({src:'DATA:image/png;base64,AAAA'})]})]){const x=setup(spec(n));assert.equal(x.host.querySelectorAll('img').length,1);assert.equal(x.host.querySelector('button'),null);x.controller.dispose();}
  for(const action of ['update','dispose']){
    const x=setup(spec(gallery())),btn=load(x),old=media(x),descriptor=Object.getOwnPropertyDescriptor(x.dom.window.HTMLImageElement.prototype,'src');let after;
    Object.defineProperty(x.dom.window.HTMLImageElement.prototype,'src',{configurable:true,get:descriptor.get,set(value){descriptor.set.call(this,value);if(action==='update')x.controller.update(spec(gallery()));else x.controller.dispose();after=old.outerHTML;}});
    btn.click();assert.equal(old.outerHTML,after);assert.equal(old.querySelector('img'),null);assert.equal(x.host.querySelector('img'),null);x.controller.dispose();
  }
});

test('choice/gallery maximum literal bounds, optional empty text, scoped IDs and frozen inputs stay unchanged',()=>{
  const prefix='https://example.invalid/',maxSrc=prefix+'a'.repeat(500000-prefix.length);
  const nodes=[choice({label:'😀'.repeat(200),description:'😀'.repeat(2000),options:[place({id:'k'.repeat(80),label:'😀'.repeat(200),address:'😀'.repeat(1000),description:'😀'.repeat(1000)})]}),gallery({label:'😀'.repeat(200),description:'😀'.repeat(2000),images:[image({id:'k'.repeat(80),src:maxSrc,alt:'😀'.repeat(2000),caption:'😀'.repeat(2000)})]})];
  for(const node of nodes){const input=spec(node),before=JSON.stringify(input),freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);const result=validateDocument(input);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(Object.isFrozen(result.document.body[0]),true);assert.equal(JSON.stringify(input),before);}
  const x=setup(spec(undefined,{body:[choice({description:'',options:[place({address:'',description:''})]}),gallery({description:'',images:[image({caption:''})]})]}));let detail;x.host.addEventListener('iui:location-choice',e=>detail=e.detail);button(x).click();assert.equal(detail.address,'');assert.equal(media(x).querySelector('figcaption').textContent,'');x.controller.dispose();
});
