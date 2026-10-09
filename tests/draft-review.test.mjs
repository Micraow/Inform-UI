import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
const email=(changes={})=>({type:'email-draft',label:'Email',to:[' A <a@example.invalid> ','duplicate@example.invalid','duplicate@example.invalid'],cc:['copy@example.invalid'],subject:' Subject\r\n😀 ',body:'Hello\r\nworld\rnext 😀',...changes});
const step=(changes={})=>({id:'read',title:'Read first',description:'Supplied text',details:'More supplied text',...changes});
const plan=(changes={})=>({type:'task-expansion-card',title:'Plan',steps:[step({reviewed:true}),step({id:'next',title:'Read next'})],...changes});
const doc=(body=[email(),plan()],state={count:0,locked:false})=>({version:'iui/1',state,body});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(input=doc(),{lang='en',external=false,actions={}}={}) {
 const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body>${external?'<form id="outer"><input name="outside" id="other" value="original">':''}<div id="host"></div>${external?'</form>':''}</body></html>`,{url:'https://example.invalid',pretendToBeVisual:true});
 const win=dom.window,host=win.document.getElementById('host'),c=mount(host,input,{actions});
 return {win,host,c,email:host.querySelector('.iui-email-draft'),plan:host.querySelector('.iui-task-expansion-card')};
}
const boxes=s=>[...s.plan.querySelectorAll('input')],count=s=>s.plan.querySelector('.iui-task-review-count'),reset=s=>s.plan.querySelector('.iui-task-review-reset');
const enter=(s,value)=>{const textarea=s.email.querySelector('textarea');textarea.value=value;textarea.dispatchEvent(new s.win.Event('input',{bubbles:true}));return textarea;};
const invalid=(value,code,path)=>{const r=validateDocument(value);assert.equal(r.ok,false);if(code)assert.ok(r.issues.some(i=>i.code===code&&(!path||i.path===path)),JSON.stringify(r.issues));return r;};

test('two canonical base nodes: public fixture, closed subsets, immutable deterministic compiler',async()=>{
 const fixtures=await Promise.all(['email-draft','task-expansion-card'].map(async name=>JSON.parse(await readFile(`examples/${name}.json`))));
 const index=JSON.parse(await readFile('src/schema/fragments/index.json'));for(const name of ['email-draft','task-expansion-card'])assert.equal(index.nodeOwners[name],'base');
 const validators=await Promise.all(['src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/forms.schema.json'].map(async path=>new Ajv2020({strict:true}).compile(JSON.parse(await readFile(path)))));
 for(const fixture of fixtures){const before=structuredClone(fixture);assert.equal(validateDocument(fixture).ok,true);for(const validate of validators)assert.equal(validate(fixture),true);assert.equal(await compileHtml(fixture),await compileHtml(fixture));assert.deepEqual(fixture,before);}
 const baseNode=new Ajv2020({strict:true}).compile(JSON.parse(await readFile('src/schema/fragments/nodes/base.schema.json')));assert.equal(baseNode(email()),true);assert.equal(baseNode(plan()),true);
});
test('email literals: required fields, every finite Unicode bound, empty subject/body and exact recipient counts',()=>{
 for(const node of [email({to:[],cc:[],subject:'',body:'',note:''}),email({label:'😀'.repeat(200),subject:'😀'.repeat(300),body:'😀'.repeat(12000),note:'😀'.repeat(1000),to:Array(20).fill('😀'.repeat(320)),cc:Array(20).fill('😀'.repeat(320))})])assert.equal(validateDocument(doc([node])).ok,true);
 for(const key of ['label','subject','body','to']){const n=email();delete n[key];invalid(doc([n]));}
 for(const change of [{label:''},{label:'😀'.repeat(201)},{subject:'😀'.repeat(301)},{body:'😀'.repeat(12001)},{note:'😀'.repeat(1001)},{to:Array(21).fill('a')},{cc:Array(21).fill('a')},{to:['']},{cc:['']},{to:['😀'.repeat(321)]},{cc:['😀'.repeat(321)]},{subject:null},{body:42},{editable:'true'},{to:'a'},{cc:[null]},{note:{$:'count'}},{body:{$:'count'}},{label:{$:'count'}}])invalid(doc([email(change)]));
});
test('email and task reject unsupported service/execution fields and aliases',()=>{
 for(const name of ['send','mailto','attachments','account','provider','action','bind','html','children','download','export','onChange','disabled'])invalid(doc([email({[name]:true})]));
 for(const name of ['execute','agent','schedule','deadline','provider','action','bind','children','onChange','completed'])invalid(doc([plan({[name]:true})]));
 for(const type of ['email','email-card','task-card','task-list','checklist-card'])invalid(doc([{...email(),type}]));
});
test('plan has 1..20 steps, strict required fields, local IDs, Unicode bounds and duplicate paths',()=>{
 for(const length of [1,20])assert.equal(validateDocument(doc([plan({steps:Array.from({length},(_,i)=>step({id:`s${i}`}))})])).ok,true);
 for(const length of [0,21])invalid(doc([plan({steps:Array.from({length},(_,i)=>step({id:`s${i}`}))})]));
 assert.equal(validateDocument(doc([plan({title:'😀'.repeat(200),summary:'😀'.repeat(2000),steps:[step({title:'😀'.repeat(200),description:'😀'.repeat(2000),details:'😀'.repeat(6000),reviewed:false})]})])).ok,true);
 for(const change of [{title:''},{title:'😀'.repeat(201)},{summary:'😀'.repeat(2001)},{summary:{$:'count'}},{steps:[{id:'s',title:'Only title'}]}]){const r=validateDocument(doc([plan(change)]));assert.equal(r.ok,Boolean(change.steps));}
 for(const change of [{id:''},{id:'9bad'},{id:'x'.repeat(81)},{title:''},{title:'😀'.repeat(201)},{description:'😀'.repeat(2001)},{details:'😀'.repeat(6001)},{reviewed:1},{reviewed:{$:'locked'}},{details:{$:'count'}},{completed:true},{extra:true}])invalid(doc([plan({steps:[step(change)]})]));
 for(const key of ['id','title']){const n=step();delete n[key];invalid(doc([plan({steps:[n]})]));}
 for(const key of ['title','steps']){const n=plan();delete n[key];invalid(doc([n]));}
 invalid(doc([plan({steps:[step(),step()]})]),'TASK_REVIEW_ID','/body/0/steps/1/id');
 assert.equal(validateDocument(doc([plan(),plan()])).ok,true,'step IDs are local to their plan');
});
test('plan disabled uses strict common boolean evaluation and atomic state patches',()=>{
 for(const disabled of [true,false,{$:'locked'},{op:'gt',args:[{$:'count'},1]}])assert.equal(validateDocument(doc([plan({disabled})])).ok,true);
 for(const disabled of [1,'false',null,{$:'count'}])invalid(doc([plan({disabled})]),'INPUT_TYPE','/body/0/disabled');
 invalid(doc([plan({disabled:{$:'missing'}})]));
 const s=setup(doc([plan({disabled:{op:'if',args:[{$:'locked'},true,{$:'count'}]}})],{count:false,locked:false}));
 assert.throws(()=>s.c.setState({count:2}));assert.deepEqual(s.c.getState(),{count:false,locked:false});assert.equal(s.plan.disabled,false);s.c.dispose();
 assert.equal(evaluateState(doc([plan({disabled:{$:'locked'}})]),{locked:true}).ok,true);
});
test('EMAIL_FORM rejects direct/deep/list/popover descendants; plan is allowed in authored Forms',()=>{
 for(const wrap of [n=>n,n=>({type:'col',children:[n]}),n=>({type:'list',items:[{type:'card',children:[n]}]}),n=>({type:'popover',label:'Open',children:[n]})])invalid(doc([{type:'form',label:'Form',children:[wrap(email())]}]),'EMAIL_FORM','/body/0/children');
 assert.equal(validateDocument(doc([{type:'form',label:'Form',children:[plan()]},email()])).ok,true);
});
test('email metadata is read-only, ordered/duplicate-preserving literal text with no links or HTML interpretation',()=>{
 const recipients=[' mailto:x@example.invalid ','<img src=x onerror=bad()>','javascript:bad()','\tduplicate@example.invalid\n','\tduplicate@example.invalid\n'];
 const s=setup(doc([email({label:'<b>Email</b>',to:recipients,subject:'<script>literal</script>',note:'<b>note</b>'})]));
 assert.equal(s.email.tagName,'SECTION');assert.equal(s.email.querySelector('.iui-email-subject').textContent,'<script>literal</script>');
 assert.deepEqual([...s.email.querySelector('.iui-email-recipients').children].map(n=>n.textContent),recipients);
 assert.equal(s.email.querySelectorAll('input').length,0);assert.equal(s.email.querySelector('a,img,script,b,form'),null);
 assert.equal(s.email.querySelectorAll('dt').length,3);assert.match(s.email.textContent,/Supplied recipients; delivery is not checked\./);assert.match(s.email.textContent,/Local draft only/);assert.equal(s.email.querySelector('textarea').labels[0].textContent,'Message body');s.c.dispose();
});
test('email permits zero recipients and exact empty authored subject/body',()=>{
 const s=setup(doc([email({to:[],cc:[],subject:'',body:''})]));assert.equal(s.email.querySelector('.iui-email-subject').textContent,'');assert.equal(s.email.querySelector('textarea').value,'');assert.equal(s.email.querySelectorAll('.iui-email-empty').length,2);assert.equal(s.email.querySelector('.iui-email-empty').textContent,'No recipients supplied');s.c.dispose();
});
test('email directly composes writing: LF parity, local editing, explicit selection/revert, state identity',()=>{
 const input=doc([email(),{type:'writing-block',label:'Plain writing',value:email().body}]),before=structuredClone(input),s=setup(input),text=s.email.querySelector('textarea');
 assert.equal(text.value,'Hello\nworld\nnext 😀');assert.equal(text.value,s.host.querySelectorAll('textarea')[1].value);assert.equal(text.defaultValue,text.value);assert.deepEqual(input,before);
 enter(s,'Edited 😀');text.focus();text.setSelectionRange(1,5,'backward');s.c.setState({count:2});assert.equal(s.email.querySelector('textarea'),text);assert.equal(s.win.document.activeElement,text);assert.deepEqual([text.selectionStart,text.selectionEnd,text.selectionDirection],[1,5,'backward']);
 s.email.querySelector('[data-writing-action=select]').click();assert.deepEqual([text.selectionStart,text.selectionEnd],[0,text.value.length]);assert.match(s.email.querySelector('[role=status]').textContent,/manually/);
 s.email.querySelector('[data-writing-action=revert]').click();assert.equal(text.value,'Hello\nworld\nnext 😀');assert.equal(s.win.document.activeElement,text);assert.equal(text.selectionEnd,text.value.length);s.c.dispose();
});
test('email inherits writing Unicode budget/readOnly/disabled protection; synthetic copy has no Clipboard access',()=>{
 const s=setup(doc([email({body:'😀'.repeat(12000)})]));let clipboard=0;Object.defineProperty(s.win.navigator,'clipboard',{get(){clipboard++;throw Error('not requested');}});
 const text=enter(s,'😀'.repeat(12001)),copy=s.email.querySelector('[data-writing-action=copy]');assert.equal(text.getAttribute('aria-invalid'),'true');assert.equal(copy.getAttribute('aria-disabled'),'true');copy.click();assert.equal(clipboard,0);
 enter(s,'accepted');const fs=s.win.document.createElement('fieldset');s.host.before(fs);fs.append(s.host);fs.disabled=true;
 for(const button of s.email.querySelectorAll('button'))button.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));enter(s,'forged');assert.equal(text.value,'accepted');assert.equal(clipboard,0);s.c.dispose();
 const ro=setup(doc([email({editable:false})]));enter(ro,'forged');assert.equal(ro.email.querySelector('textarea').value,'Hello\nworld\nnext 😀');ro.email.querySelector('[data-writing-action=select]').click();assert.equal(ro.win.document.activeElement,ro.email.querySelector('textarea'));ro.c.dispose();
});
test('plan is a literal ordered native review list; initial marks never claim performed tasks',()=>{
 const s=setup(doc([plan({title:'<b>plan</b>',steps:[step({reviewed:true,description:'<img src=x>',details:'<script>literal</script>'}),step({id:'empty',details:''}),{id:'none',title:'No details'}]})]));
 assert.equal(s.plan.tagName,'FIELDSET');assert.equal(s.plan.querySelector('ol').children.length,3);assert.deepEqual([...s.plan.querySelector('ol').children].map(n=>n.dataset.step),['read','empty','none']);
 assert.equal(s.plan.querySelectorAll('details').length,1);assert.equal(s.plan.querySelector('details').open,false);assert.equal(s.plan.querySelector('script,img,b'),null);
 assert.equal(count(s).textContent,'1 of 3 steps marked reviewed');assert.match(s.plan.textContent,/not that tasks were performed/);assert.equal(reset(s).type,'button');assert.equal(reset(s).disabled,false);assert.equal(reset(s).getAttribute('aria-disabled'),'true');
 for(const input of boxes(s)){assert.equal(input.name,'');assert.equal(input.dataset.bind,undefined);assert.equal(input.labels.length,1);for(const id of input.getAttribute('aria-labelledby').split(' '))assert.ok(s.win.document.getElementById(id));assert.equal(input.defaultChecked,input.checked);}s.c.dispose();
});
test('native plan toggles only local flags; Reset restores supplied flags without disclosure/focus/other changes',()=>{
 const s=setup(),inputs=boxes(s),details=s.plan.querySelector('details');details.open=true;const textarea=enter(s,'Keep body');inputs[1].focus();inputs[1].click();assert.equal(count(s).textContent,'2 of 2 steps marked reviewed');assert.equal(s.win.document.activeElement,inputs[1]);assert.equal(inputs[1].defaultChecked,true);assert.deepEqual(s.c.getState(),{count:0,locked:false});
 const rows=[...s.plan.querySelectorAll('li')],status=count(s);s.c.setState({count:1});assert.deepEqual([...s.plan.querySelectorAll('li')],rows);assert.equal(count(s),status);assert.equal(details.open,true);assert.equal(s.win.document.activeElement,inputs[1]);
 reset(s).focus();reset(s).click();assert.deepEqual(inputs.map(n=>n.checked),[true,false]);assert.equal(count(s).textContent,'1 of 2 steps marked reviewed');assert.equal(details.open,true);assert.equal(s.win.document.activeElement,reset(s));assert.equal(textarea.value,'Keep body');assert.equal(reset(s).getAttribute('aria-disabled'),'true');const before=s.plan.outerHTML;reset(s).click();assert.equal(s.plan.outerHTML,before);s.c.dispose();
});
test('review count updates once per state-changing native activation, never on refresh or boundary Reset',async()=>{
 const s=setup(doc([plan()])),status=count(s),mutations=[];const observer=new s.win.MutationObserver(list=>mutations.push(...list));observer.observe(status,{subtree:true,childList:true,characterData:true});
 s.c.setState({count:1});reset(s).click();await tick();assert.equal(mutations.length,0);
 boxes(s)[1].click();await tick();assert.equal(mutations.length,1);boxes(s)[1].dispatchEvent(new s.win.Event('change',{bubbles:true}));s.c.setState({count:2});await tick();assert.equal(mutations.length,1);observer.disconnect();s.c.dispose();
});
test('plan own/inherited disabled guards reject forged input and changes, restoring prior native checked values',()=>{
 for(const kind of ['own','field','external']){
  const n=plan({...(kind==='own'?{disabled:{$:'locked'}}:{})}),s=setup(doc(kind==='field'?[{type:'field',label:'Wrapper',disabled:{$:'locked'},children:[n]}]:[n]));
  const input=boxes(s)[1];input.click();let external;if(kind==='external'){external=s.win.document.createElement('fieldset');s.host.before(external);external.append(s.host);external.disabled=true;}else s.c.setState({locked:true});
  assert.equal(input.matches(':disabled'),true);for(const event of ['input','change']){input.checked=false;input.dispatchEvent(new s.win.Event(event,{bubbles:true}));assert.equal(input.checked,true);assert.equal(input.defaultChecked,true);}
  reset(s).dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));assert.equal(count(s).textContent,'2 of 2 steps marked reviewed');
  if(external)external.disabled=false;else s.c.setState({locked:false});reset(s).click();assert.equal(input.checked,false);s.c.dispose();
 }
});
test('authored pending Forms suppress local plan changes/reset and omit plan from submitted snapshot',async()=>{
 let resolve,snapshot,calls=0;const pending=new Promise(r=>resolve=r),input=doc([{type:'form',label:'Host form',action:'save',children:[{type:'input',kind:'text',label:'Other',bind:'other'},plan()]}],{other:'supplied',count:0,locked:false});
 const s=setup(input,{actions:{save:({values})=>{calls++;snapshot=values;return pending;}}}),form=s.host.querySelector('form'),check=boxes(s)[1];check.click();const data=new s.win.FormData(form);assert.deepEqual([...data.keys()],[]);
 form.dispatchEvent(new s.win.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls,1);assert.deepEqual(snapshot,{other:'supplied'});assert.equal(check.matches(':disabled'),true);
 check.checked=false;check.dispatchEvent(new s.win.Event('input',{bubbles:true}));reset(s).dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));assert.equal(check.checked,true);assert.equal(count(s).textContent,'2 of 2 steps marked reviewed');
 resolve();await tick();assert.equal(check.matches(':disabled'),false);reset(s).click();assert.equal(check.checked,false);s.c.dispose();
});
test('external native form.reset keeps independent review marks/body aligned and component buttons never submit',()=>{
 const s=setup(undefined,{external:true}),form=s.win.document.getElementById('outer'),other=s.win.document.getElementById('other');let submits=0,custom=0;form.addEventListener('submit',event=>{submits++;event.preventDefault();});for(const name of ['iui:change','iui:action','iui:submit','iui:suggestion'])s.host.addEventListener(name,()=>custom++);
 boxes(s)[1].click();enter(s,'local body');other.value='changed';form.reset();assert.equal(other.value,'original');assert.equal(boxes(s)[1].checked,true);assert.equal(count(s).textContent,'2 of 2 steps marked reviewed');assert.equal(s.email.querySelector('textarea').value,'local body');
 other.value='keep';reset(s).click();for(const button of s.email.querySelectorAll('button'))button.click();assert.equal(other.value,'keep');assert.equal(submits,0);assert.equal(custom,0);assert.deepEqual([...new s.win.FormData(form).keys()],['outside']);s.c.dispose();
});
test('invalid replacement and bad state remain atomic; valid update resets local body/marks and retires listeners',()=>{
 const s=setup(),text=enter(s,'keep'),input=boxes(s)[1],details=s.plan.querySelector('details');input.click();details.open=true;text.focus();text.setSelectionRange(1,3);
 assert.throws(()=>s.c.update(doc([email({send:true}),plan()])));assert.throws(()=>s.c.update(doc([email(),plan({steps:[step(),step()]})])));assert.equal(s.host.querySelector('textarea'),text);assert.equal(text.value,'keep');assert.equal(input.checked,true);assert.equal(details.open,true);assert.equal(s.win.document.activeElement,text);assert.deepEqual([text.selectionStart,text.selectionEnd],[1,3]);
 const retired=[s.email,s.plan];s.c.update(doc([email({body:'new'}),plan({steps:[step({reviewed:false})]})]));const old=retired.map(n=>n.outerHTML);reset(s).click();input.dispatchEvent(new s.win.Event('change',{bubbles:true}));s.email.querySelector('[data-writing-action=revert]').click();assert.deepEqual(retired.map(n=>n.outerHTML),old);assert.ok(retired.every(n=>!n.isConnected));assert.equal(s.host.querySelector('textarea').value,'new');assert.equal(s.host.querySelector('input').checked,false);s.c.dispose();s.c.dispose();assert.equal(s.host.childElementCount,0);
});
test('multiple roots/owner documents reserve IDs, preserve independent state and clean only their own mount',()=>{
 const s=setup(doc([email({id:'iui-email-internal-iui-1-1-title'}),email(),plan({id:'iui-task-review-internal-iui-1-1-note'}),plan()]));const other=s.win.document.createElement('div');s.win.document.body.append(other);const second=mount(other,doc());const frame=s.win.document.createElement('iframe');s.win.document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const third=mount(host,doc());
 const ids=[...s.win.document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const node of host.querySelectorAll('*'))assert.equal(node.ownerDocument,frame.contentDocument);
 boxes(s)[1].click();assert.equal(other.querySelectorAll('.iui-task-expansion-card input')[1].checked,false);s.c.dispose();assert.ok(other.querySelector('.iui-email-draft'));assert.ok(host.querySelector('.iui-task-expansion-card'));second.dispose();third.dispose();
});
test('Chinese interface and genuine Arabic-first literal content preserve direction and inert compilation',async()=>{
 const body='نص عربي\n</textarea><script>bad()</script>😀',input=doc([email({label:'مسودة',subject:'موضوع عربي',body}),plan({title:'خطة',summary:'اقرأ النص',steps:[step({title:'قراءة',details:'تفاصيل عربية'})]})]),s=setup(input,{lang:'zh-CN'});
 assert.equal(s.email.dir,'auto');assert.equal(s.plan.dir,'auto');assert.equal(s.email.querySelector('textarea').dir,'auto');assert.equal(s.email.querySelector('textarea').labels[0].textContent,'邮件正文');assert.equal(reset(s).textContent,'重置阅读标记');assert.equal(s.email.querySelector('[data-writing-action=copy]').textContent,'复制');
 const html=await compileHtml(input);assert.ok(!html.includes('<script>bad()'));assert.ok(html.includes('\\u003c/script\\u003e'));s.c.dispose();
});
test('invalid initial mount leaves preexisting DOM intact; local controls do not fetch, store or access accounts',()=>{
 const s=setup();let calls=0;for(const name of ['fetch','WebSocket','XMLHttpRequest'])Object.defineProperty(s.win,name,{configurable:true,value:()=>{calls++;throw Error('No network');}});for(const name of ['localStorage','sessionStorage'])Object.defineProperty(s.win,name,{configurable:true,get(){calls++;throw Error('No storage');}});
 s.c.update(doc());s.plan=s.host.querySelector('.iui-task-expansion-card');s.email=s.host.querySelector('.iui-email-draft');boxes(s)[1].click();reset(s).click();enter(s,'local');s.c.setState({count:2});assert.equal(calls,0);
 const existing=s.win.document.createElement('div');existing.textContent='keep';assert.throws(()=>mount(existing,doc([email({body:null})])));assert.equal(existing.textContent,'keep');s.c.dispose();
});

test('full and base/forms structural schemas reject the same unsupported fields and Unicode overflows',async()=>{
 const validators=await Promise.all(['src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/forms.schema.json'].map(async path=>new Ajv2020({strict:true}).compile(JSON.parse(await readFile(path)))));
 const valid=[email({to:[],subject:'',body:''}),email({subject:'😀'.repeat(300),to:['😀'.repeat(320)]}),plan({steps:[{id:'s'.repeat(80),title:'x',description:'',details:'',reviewed:false}]})];
 const invalidNodes=[email({subject:'😀'.repeat(301)}),email({body:'😀'.repeat(12001)}),email({to:['😀'.repeat(321)]}),email({cc:Array(21).fill('x')}),email({send:true}),email({body:{$:'count'}}),plan({steps:[]}),plan({steps:[step({id:'s'.repeat(81)})]}),plan({steps:[step({reviewed:'true'})]}),plan({steps:[step({details:'😀'.repeat(6001)})]}),plan({execute:true})];
 for(const validate of validators){for(const node of valid)assert.equal(validate(doc([node])),true);for(const node of invalidNodes)assert.equal(validate(doc([node])),false);}
});
