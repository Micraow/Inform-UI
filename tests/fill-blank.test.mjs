import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../examples/fill-blank-practice.json',import.meta.url)));
const fresh=()=>structuredClone(fixture);
const simple=(answer='Case')=>({version:'iui/1',state:{n:1},body:[{type:'fill-blank',title:'Local practice',parts:['Use ',{blank:'word'},'.'],blanks:[{id:'word',label:'Word',answers:[answer],hint:'A supplied word',explanation:'A literal match'}]}]});
function setup(spec=fresh(),lang='zh-CN'){
 const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body><div id="host"></div></body></html>`),host=dom.window.document.getElementById('host'),controller=mount(host,spec),root=host.querySelector('.iui-fill-blank');
 return{dom,host,controller,root,inputs:[...root.querySelectorAll('input')],status:root.querySelector('[role=status]'),button:name=>root.querySelector(`[data-fill-blank-action="${name}"]`)};
}
function enter(s,index,value){const input=s.inputs[index];input.value=value;input.dispatchEvent(new s.dom.window.Event('input',{bubbles:true}));}
const result=s=>[...s.root.querySelectorAll('.iui-fill-blank-row')].map(row=>row.dataset.result);
test('fill-blank fixture validates, compiles deterministically, remains immutable and is owned by learning',async()=>{
 const before=fresh();assert.equal(validateDocument(fixture).ok,true);assert.deepEqual(fixture,before);
 assert.equal(await compileHtml(fixture),await compileHtml(fixture));
 const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners['fill-blank'],'learning');
 const learning=JSON.parse(await readFile('src/schema/fragments/learning.schema.json','utf8'));
 assert.equal(new Ajv2020({strict:true}).compile(learning)(fixture),true);
 const base=JSON.parse(await readFile('src/schema/fragments/base.schema.json','utf8'));
 assert.equal(new Ajv2020({strict:true}).compile(base)(fixture),false);
});
test('blank fields are truly embedded, ordered by parts, label-associated, and described without startup announcements',()=>{
 const spec=fresh();spec.body[0].blanks.reverse();const s=setup(spec);
 assert.deepEqual(s.inputs.map(input=>input.dataset.blankId),['synthetic','reference','case']);
 assert.equal(s.root.querySelector('.iui-fill-blank-passage').childNodes[0].textContent,'这是一份');
 for(const input of s.inputs){assert.equal(input.labels.length,1);assert.ok(input.labels[0].textContent);assert.equal(input.maxLength,400);for(const id of input.getAttribute('aria-describedby').split(' '))assert.ok(s.dom.window.document.getElementById(id));}
 assert.equal(s.status.textContent,'');assert.equal(s.status.getAttribute('aria-live'),'polite');assert.equal(s.root.querySelector('form'),null);s.controller.dispose();
});
test('missing answers are unscored, retain drafts and focus the first missing field in passage order',()=>{
 const spec=fresh();spec.body[0].blanks.reverse();const s=setup(spec);enter(s,2,'不同');s.button('check').click();
 assert.equal(s.root.dataset.state,'incomplete');assert.deepEqual(result(s),['missing','missing','unreviewed']);assert.equal(s.dom.window.document.activeElement,s.inputs[0]);assert.match(s.status.textContent,/尚未计算/);assert.doesNotMatch(s.status.textContent,/0 \/ 3/);assert.equal(s.inputs[2].value,'不同');s.controller.dispose();
});
test('exact trimmed answers support alternatives, keep raw drafts, reject case folding and do not normalize Unicode',()=>{
 const s=setup(simple('Case'),'en');enter(s,0,'  Case\t');s.button('check').click();assert.deepEqual(result(s),['correct']);assert.equal(s.inputs[0].value,'  Case\t');assert.match(s.status.textContent,/1 \/ 1/);
 enter(s,0,'case');assert.deepEqual(result(s),['unreviewed']);assert.match(s.status.textContent,/Check again/);s.button('check').click();assert.deepEqual(result(s),['incorrect']);
 s.controller.update(simple('é'));s.inputs=[...s.host.querySelectorAll('input')];s.root=s.host.querySelector('.iui-fill-blank');enter(s,0,'e\u0301');s.root.querySelector('[data-fill-blank-action=check]').click();assert.equal(s.root.querySelector('li').dataset.result,'incorrect');s.controller.dispose();
 const a=setup();enter(a,0,'原创合成');enter(a,1,'参考');enter(a,2,'不相同');a.button('check').click();assert.deepEqual(result(a),['correct','correct','correct']);a.controller.dispose();
});
test('edits clear only their field feedback and invalidate the aggregate result; repeated checks never accumulate a score',()=>{
 const s=setup();['合成','wrong','不同'].forEach((v,i)=>enter(s,i,v));s.button('check').click();assert.deepEqual(result(s),['correct','incorrect','correct']);assert.match(s.status.textContent,/2 \/ 3/);
 enter(s,1,'参考');assert.deepEqual(result(s),['correct','unreviewed','correct']);assert.equal(s.inputs[1].hasAttribute('aria-invalid'),false);assert.equal(s.root.dataset.state,'editing');assert.doesNotMatch(s.status.textContent,/2 \/ 3/);
 for(let i=0;i<5;i++)s.button('check').click();assert.match(s.status.textContent,/3 \/ 3/);s.controller.dispose();
});
test('review shows supplied references without changing drafts or reporting a scored attempt; retry fully resets',()=>{
 const s=setup();enter(s,0,'my draft');s.button('reveal').click();assert.deepEqual(result(s),['reference','reference','reference']);assert.equal(s.inputs[0].value,'my draft');assert.equal(s.inputs[1].value,'');assert.match(s.status.textContent,/不计作答/);assert.equal(s.button('check').disabled,true);assert.equal(s.dom.window.document.activeElement,s.button('retry'));
 enter(s,1,'a changed draft');s.button('check').click();assert.equal(s.root.dataset.state,'reference');assert.match(s.status.textContent,/不计作答/);
 s.button('retry').click();assert.deepEqual(s.inputs.map(input=>input.value),['','','']);assert.deepEqual(result(s),['unreviewed','unreviewed','unreviewed']);assert.equal(s.button('check').disabled,false);assert.equal(s.button('reveal').disabled,false);assert.equal(s.dom.window.document.activeElement,s.inputs[0]);assert.equal(s.root.dataset.state,'editing');s.controller.dispose();
});
test('200 Unicode code points are accepted while overlength drafts are preserved and unscored',()=>{
 const answer='😀'.repeat(200);assert.equal(validateDocument(simple(answer)).ok,true);assert.equal(validateDocument(simple(answer+'😀')).ok,false);
 const s=setup(simple(answer),'en');enter(s,0,answer);s.button('check').click();assert.deepEqual(result(s),['correct']);
 const long='a'.repeat(201);enter(s,0,long);s.button('check').click();assert.deepEqual(result(s),['too-long']);assert.equal(s.inputs[0].value,long);assert.match(s.status.textContent,/No result/);assert.equal(s.dom.window.document.activeElement,s.inputs[0]);s.controller.dispose();
});
test('Enter checks once, repeated Enter prevents implicit actions, and IME composition is not prematurely checked',()=>{
 const s=setup(simple(),'en');enter(s,0,'Case');
 const ime=new s.dom.window.KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});s.inputs[0].dispatchEvent(ime);assert.equal(s.root.dataset.state,'editing');assert.equal(ime.defaultPrevented,false);
 const enterKey=new s.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});s.inputs[0].dispatchEvent(enterKey);assert.equal(s.root.dataset.state,'checked');assert.equal(enterKey.defaultPrevented,true);
 enter(s,0,'case');const repeat=new s.dom.window.KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true});s.inputs[0].dispatchEvent(repeat);assert.equal(s.root.dataset.state,'editing');assert.equal(repeat.defaultPrevented,true);s.controller.dispose();
});
test('unrelated host state, document reset action and hidden ancestors preserve local drafts, result, selection and DOM',()=>{
 const spec=simple();spec.body.push({type:'button',label:'Reset shared state',action:{kind:'reset'}});const s=setup(spec,'en');enter(s,0,'Case');s.button('check').click();s.inputs[0].focus();s.inputs[0].setSelectionRange(1,3);s.controller.setState({n:2});assert.equal(s.host.querySelector('input'),s.inputs[0]);assert.equal(s.dom.window.document.activeElement,s.inputs[0]);assert.equal(s.inputs[0].selectionStart,1);assert.equal(s.inputs[0].selectionEnd,3);assert.equal(s.root.dataset.state,'checked');
 s.host.hidden=true;s.controller.setState({n:3});s.host.hidden=false;assert.equal(s.inputs[0].value,'Case');s.host.querySelector('.iui-body>button').click();assert.equal(s.controller.getState().n,1);assert.equal(s.root.dataset.state,'checked');assert.deepEqual(result(s),['correct']);s.controller.dispose();
});
test('valid update resets; invalid update is atomic; old listeners are detached and dispose does not affect sibling mounts',()=>{
 const s=setup(simple(),'en');enter(s,0,'Case');s.button('check').click();const old=s.root,oldCheck=s.button('check'),oldInput=s.inputs[0];const bad=simple();bad.body[0].parts=[{blank:'absent'}];assert.throws(()=>s.controller.update(bad));assert.equal(s.host.querySelector('.iui-fill-blank'),old);assert.equal(old.dataset.state,'checked');
 const siblingHost=s.dom.window.document.createElement('div');s.dom.window.document.body.append(siblingHost);const sibling=mount(siblingHost,simple());assert.notEqual(siblingHost.querySelector('input').id,oldInput.id);
 s.controller.update(simple());assert.notEqual(s.host.querySelector('.iui-fill-blank'),old);assert.equal(s.host.querySelector('input').value,'');oldInput.value='wrong';oldCheck.click();assert.equal(old.dataset.state,'checked');
 s.controller.dispose();assert.equal(s.host.childElementCount,0);assert.ok(siblingHost.querySelector('input'));sibling.dispose();
});
test('all supplied teaching text stays inert, including HTML-like answers and closing-script sequences',async()=>{
 const payload='<img src=x onerror=alert(1)></script>';const spec=simple(payload);spec.body[0].title=payload;spec.body[0].parts=[payload,{blank:'word'}];spec.body[0].blanks[0].hint=payload;const s=setup(spec,'en');s.button('reveal').click();assert.equal(s.root.querySelector('img,script,iframe,a'),null);assert.ok(s.root.textContent.includes(payload));assert.ok((await compileHtml(spec)).includes('\\u003c'));s.controller.dispose();
});
test('finite structural boundaries and every additional field are rejected by the actual public validator',()=>{
 const mutations=[n=>n.parts=[],n=>n.parts=Array(51).fill('x'),n=>n.blanks=[],n=>n.blanks=Array.from({length:13},(_,i)=>({...n.blanks[0],id:'b'+i})),n=>n.description='x'.repeat(2001),n=>n.parts=['x'.repeat(2001),{blank:'word'}],n=>n.blanks[0].hint='x'.repeat(1001),n=>n.blanks[0].explanation='x'.repeat(2001),n=>n.title='',n=>n.title='x'.repeat(201),n=>n.parts=[{blank:'word',html:'x'}],n=>n.parts=[42],n=>n.blanks[0].id='bad id',n=>n.blanks[0].label='',n=>n.blanks[0].answers=[],n=>n.blanks[0].answers=Array(9).fill('a'),n=>n.blanks[0].answers=[''],n=>n.blanks[0].answers=['a'.repeat(201)],n=>n.blanks[0].answers=[true],n=>n.blanks[0].bind='x',n=>n.parts=[{blank:'word',children:[]}],n=>n.status='loading',n=>n.match='fuzzy',n=>n.onCheck='save',n=>delete n.parts,n=>delete n.blanks,n=>delete n.title];
 for(const [index,mutate] of mutations.entries()){const spec=simple();mutate(spec.body[0]);const result=validateDocument(spec);assert.equal(result.ok,false,'mutation '+index);}
});
test('semantic references, trimmed duplicate answers, blank answers and impossible multiline answers reject with precise codes',()=>{
 const cases=[['FILL_BLANK_ID',n=>n.blanks.push(structuredClone(n.blanks[0]))],['FILL_BLANK_REFERENCE',n=>n.parts.push({blank:'word'})],['FILL_BLANK_REFERENCE',n=>n.parts=[{blank:'unknown'}]],['FILL_BLANK_REFERENCE',n=>n.parts=['no blank']],['FILL_BLANK_ANSWER',n=>n.blanks[0].answers=['Case',' Case ']],['FILL_BLANK_ANSWER',n=>n.blanks[0].answers=[' \t ']],['FILL_BLANK_ANSWER',n=>n.blanks[0].answers=['first\nsecond']]];
 for(const [code,mutate]of cases){const spec=simple();mutate(spec.body[0]);const r=validateDocument(spec);assert.equal(r.ok,false);assert.ok(r.issues.some(issue=>issue.code===code),JSON.stringify(r));assert.throws(()=>setup(spec));}
});
test('forms reject direct and deeply nested autonomous practice while independent exercises may reuse blank ids',()=>{
 for(const wrap of [n=>n,n=>({type:'col',children:[n]}),n=>({type:'list',items:[n]}),n=>({type:'popover',label:'Open',children:[n]})]){const spec=simple();spec.body=[{type:'form',label:'No nested practice',children:[wrap(spec.body[0])]}];const r=validateDocument(spec);assert.equal(r.ok,false);assert.ok(r.issues.some(issue=>issue.code==='LEARNING_FORM'));}
 const spec=simple();spec.body.push(structuredClone(spec.body[0]));assert.equal(validateDocument(spec).ok,true);const s=setup(spec);assert.equal(s.host.querySelectorAll('input').length,2);assert.notEqual(...[...s.host.querySelectorAll('input')].map(input=>input.id));s.controller.dispose();
});
test('upper bounds, literal CRLF passage and 2000-code-point text remain within the shared semantic budget',async()=>{
 const spec=simple();spec.body[0].parts=Array(49).fill('');spec.body[0].parts.push({blank:'word'});assert.equal(validateDocument(spec).ok,true);
 spec.body[0].parts=['😀'.repeat(2000),{blank:'word'}];assert.equal(validateDocument(spec).ok,true);spec.body[0].parts[0]+='😀';assert.equal(validateDocument(spec).ok,false);
 const many=simple();many.body[0].blanks=Array.from({length:12},(_,i)=>({id:'b'+i,label:'Blank '+i,answers:Array.from({length:8},(_,j)=>'answer '+j)}));many.body[0].parts=many.body[0].blanks.map(blank=>({blank:blank.id}));assert.equal(validateDocument(many).ok,true);
 const crlf=simple();crlf.body[0].parts=['first\r\nsecond\t',{blank:'word'},'\r\n'];const local=setup(crlf,'en');assert.equal(local.root.querySelector('.iui-fill-blank-passage').firstChild.textContent,'first\r\nsecond\t');const parsed=new JSDOM(await compileHtml(crlf));assert.deepEqual(JSON.parse(parsed.window.document.getElementById('iui-data').textContent),validateDocument(crlf).document);local.controller.dispose();
 const r=evaluateState(simple(),{n:2});assert.equal(r.ok,true);assert.equal(r.state.n,2);
});
test('independent owner documents and hostile-looking keys do not share drafts or access storage/network',()=>{
 const spec=simple();spec.body[0].blanks[0].id='__proto__';spec.body[0].parts=[{blank:'__proto__'}];assert.equal(validateDocument(spec).ok,true);
 const a=setup(spec,'en'),b=setup(spec,'en');enter(a,0,'Case');a.button('check').click();assert.equal(a.root.dataset.state,'checked');assert.equal(b.root.dataset.state,'editing');assert.equal(b.inputs[0].value,'');assert.equal(a.root.ownerDocument,a.dom.window.document);assert.equal(b.root.ownerDocument,b.dom.window.document);
 a.dom.window.fetch=()=>{throw Error('network must not be used');};Object.defineProperty(a.dom.window,'localStorage',{get(){throw Error('storage must not be used');}});Object.defineProperty(a.dom.window,'sessionStorage',{get(){throw Error('storage must not be used');}});
 a.controller.update(spec);a.controller.dispose();assert.equal(b.root.isConnected,true);b.controller.dispose();
});
