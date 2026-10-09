import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../examples/writing-block.json',import.meta.url),'utf8'));
const node=(changes={})=>({type:'writing-block',label:'Draft',value:'Original\r\ntext 😀\rfinal',...changes});
const doc=body=>({version:'iui/1',state:{count:0},body});
const controls=root=>({draft:root.querySelector('textarea'),copy:root.querySelector('[data-writing-action=copy]'),select:root.querySelector('[data-writing-action=select]'),revert:root.querySelector('[data-writing-action=revert]'),status:root.querySelector('[role=status]')});
function setup(input=doc([node()]),{lang='en',external=false}={}){const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body>${external?'<form id="outer"><input id="other" value="original">':''}<div id="host"></div>${external?'</form>':''}</body></html>`,{pretendToBeVisual:true}),win=dom.window,host=win.document.getElementById('host'),c=mount(host,input),root=host.querySelector('.iui-writing-block');return{win,host,c,root,...controls(root)};}
function enter(s,value){s.draft.value=value;s.draft.dispatchEvent(new s.win.Event('input',{bubbles:true}));}
test('single canonical base node validates public/schema subsets; fixture and compiler are deterministic and immutable',async()=>{
 const before=structuredClone(fixture);assert.equal(validateDocument(fixture).ok,true);assert.equal(await compileHtml(fixture),await compileHtml(fixture));assert.deepEqual(fixture,before);
 const index=JSON.parse(await readFile('src/schema/fragments/index.json'));assert.equal(index.nodeOwners['writing-block'],'base');assert.equal(Object.keys(index.nodeOwners).filter(k=>/writing/.test(k)).length,1);
 for(const path of ['src/schema/iui.schema.json','src/schema/fragments/base.schema.json','src/schema/fragments/forms.schema.json']){const schema=JSON.parse(await readFile(path));assert.equal(new Ajv2020({strict:true}).compile(schema)(fixture),true,path);}
});
test('required literals and finite Unicode bounds agree; expression/action/recipient/HTML/extra fields reject',()=>{
 for(const value of ['', 'a'.repeat(12000),'😀'.repeat(12000),'e\u0301','\r\n\r\t\u202e\ud800'])assert.equal(validateDocument(doc([node({value})])).ok,true);
 for(const label of ['x','😀'.repeat(200)])assert.equal(validateDocument(doc([node({label})])).ok,true);
 for(const editable of [true,false])assert.equal(validateDocument(doc([node({editable,note:'😀'.repeat(1000)})])).ok,true);
 const bad=[{value:'a'.repeat(12001)},{value:'😀'.repeat(12001)},{value:{$:'count'}},{value:42},{value:null},{label:''},{label:'😀'.repeat(201)},{label:{$:'count'}},{note:'😀'.repeat(1001)},{note:1},{editable:'true'},{editable:null},{editable:{$:'count'}}];
 for(const change of bad)assert.equal(validateDocument(doc([node(change)])).ok,false,JSON.stringify(change).slice(0,90));
 for(const name of ['label','value']){const n=node();delete n[name];assert.equal(validateDocument(doc([n])).ok,false);}
 for(const name of ['bind','recipient','to','send','save','export','upload','action','html','richText','children','onInput','spellcheck','maxLength'])assert.equal(validateDocument(doc([node({[name]:'unsupported'})])).ok,false,name);
 for(const type of ['writing','writing-draft','draft','writing-card'])assert.equal(validateDocument(doc([node({type})])).ok,false);
});
test('WRITING_FORM rejects direct and deep descendants, including lists and popovers; independent writing still allowed',()=>{
 for(const wrap of [n=>n,n=>({type:'col',children:[n]}),n=>({type:'list',items:[{type:'card',children:[n]}]}),n=>({type:'popover',label:'Open',children:[n]})]){const input=doc([{type:'form',label:'Form',children:[wrap(node())]}]),result=validateDocument(input);assert.equal(result.ok,false);assert.ok(result.issues.some(e=>e.code==='WRITING_FORM'));assert.throws(()=>setup(input),/WRITING_FORM/);}
 assert.equal(validateDocument(doc([{type:'form',label:'Form',children:[]},node()])).ok,true);
});
test('native textarea normalizes only newlines, preserves caller source, has labels, descriptions, local disclosure and empty status',()=>{
 const input=doc([node({note:'A <b>literal</b> note'})]),before=structuredClone(input),s=setup(input);assert.equal(s.draft.value,'Original\ntext 😀\nfinal');assert.equal(s.draft.defaultValue,s.draft.value);assert.deepEqual(input,before);
 assert.equal(s.draft.maxLength,24000);assert.equal(s.draft.readOnly,false);assert.equal(s.draft.name,'');assert.equal(s.draft.labels.length,1);assert.equal(s.draft.labels[0].textContent,'Draft');
 for(const id of s.draft.getAttribute('aria-describedby').split(' '))assert.ok(s.win.document.getElementById(id));assert.equal(s.status.textContent,'');assert.equal(s.status.getAttribute('aria-live'),'polite');assert.equal(s.root.dataset.dirty,'false');assert.match(s.root.textContent,/not saved or sent/);assert.equal(s.root.querySelector('b,form,input,script'),null);assert.equal(s.root.querySelectorAll('button').length,3);for(const b of s.root.querySelectorAll('button'))assert.equal(b.type,'button');s.c.dispose();
});
test('native editing updates count/dirty without repainting or moving selection; Revert restores LF original and selects only explicitly',()=>{
 const s=setup();s.draft.focus();enter(s,'😀e\u0301\ntext');s.draft.setSelectionRange(2,4,'backward');assert.match(s.root.querySelector('.iui-writing-count').textContent,/8 \/ 12000/);assert.equal(s.root.dataset.dirty,'true');assert.equal(s.draft.defaultValue,s.draft.value);
 s.c.setState({count:1});assert.equal(s.host.querySelector('textarea'),s.draft);assert.equal(s.win.document.activeElement,s.draft);assert.equal(s.draft.selectionStart,2);assert.equal(s.draft.selectionEnd,4);assert.equal(s.draft.selectionDirection,'backward');
 s.revert.click();assert.equal(s.draft.value,'Original\ntext 😀\nfinal');assert.equal(s.draft.defaultValue,s.draft.value);assert.equal(s.root.dataset.dirty,'false');assert.equal(s.win.document.activeElement,s.draft);assert.equal(s.draft.selectionStart,0);assert.equal(s.draft.selectionEnd,s.draft.value.length);assert.equal(s.status.textContent,'Original text restored.');s.c.dispose();
});
test('Select text creates actual textarea range without copying; read-only supports selection and Revert',()=>{
 const s=setup(doc([node({editable:false})]));assert.equal(s.draft.readOnly,true);s.select.click();assert.equal(s.win.document.activeElement,s.draft);assert.equal(s.draft.selectionStart,0);assert.equal(s.draft.selectionEnd,s.draft.value.length);assert.match(s.status.textContent,/Copy it manually/);assert.doesNotMatch(s.status.textContent,/copied/);s.revert.click();assert.equal(s.draft.value,'Original\ntext 😀\nfinal');s.c.dispose();
});
test('every valid 12000-codepoint draft fits maxlength; excessive drafts remain visible and Copy-disabled until edited/reverted',()=>{
 const s=setup(doc([node({value:'😀'.repeat(12000)})]));assert.equal(s.draft.value.length,24000);assert.equal(s.draft.getAttribute('aria-invalid'),'false');assert.equal(s.copy.getAttribute('aria-disabled'),'false');
 enter(s,'a'.repeat(12001));assert.equal(s.draft.value.length,12001);assert.equal(s.draft.defaultValue,s.draft.value);assert.equal(s.draft.getAttribute('aria-invalid'),'true');assert.equal(s.copy.getAttribute('aria-disabled'),'true');assert.equal(s.root.querySelector('.iui-writing-limit').hidden,false);
 enter(s,'');assert.equal(s.draft.value,'');assert.equal(s.copy.getAttribute('aria-disabled'),'false');assert.equal(s.root.querySelector('.iui-writing-limit').hidden,true);s.c.dispose();
});
test('external form reset preserves aligned local draft; all controls never submit or reset another field',()=>{
 const s=setup(undefined,{external:true}),form=s.win.document.getElementById('outer'),other=s.win.document.getElementById('other');let submitted=0;form.addEventListener('submit',e=>{submitted++;e.preventDefault();});other.value='independent';enter(s,'local edit 😀');form.reset();assert.equal(other.value,'original');assert.equal(s.draft.value,'local edit 😀');assert.equal(s.root.dataset.dirty,'true');
 other.value='keep';s.copy.click();s.select.click();s.revert.click();assert.equal(other.value,'keep');assert.equal(submitted,0);assert.equal(new s.win.FormData(form).has(s.draft.name),false);s.c.dispose();
});
test('invalid update is atomic with editing/focus/selection intact; valid update retires local draft and listeners',()=>{
 const s=setup();enter(s,'keep');s.draft.focus();s.draft.setSelectionRange(1,3);assert.throws(()=>s.c.update(doc([node({send:true})])));assert.equal(s.host.querySelector('textarea'),s.draft);assert.equal(s.draft.value,'keep');assert.equal(s.win.document.activeElement,s.draft);assert.equal(s.draft.selectionStart,1);
 s.c.update(doc([node({value:'replacement'})]));const before=s.root.outerHTML;s.select.click();s.revert.click();s.copy.click();assert.equal(s.root.outerHTML,before);assert.equal(s.root.isConnected,false);assert.equal(s.host.querySelector('textarea').value,'replacement');s.c.dispose();s.c.dispose();assert.equal(s.host.childElementCount,0);
});
test('reserved internal IDs cannot collide with authored suffixes, sibling nodes or repeated updates',()=>{
 const input=doc([node({id:'control-0'}),node({id:'iui-writing-internal-test-1-draft'})]),s=setup(input);const ids=[...s.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
 for(const input of s.host.querySelectorAll('textarea')){assert.equal(input.labels.length,1);assert.equal(input.labels[0].closest('.iui-writing-block'),input.closest('.iui-writing-block'));}
 const old=s.draft.id;s.c.update(input);assert.notEqual(s.host.querySelector('textarea').id,old);s.c.dispose();
});
test('literal script-looking content/combining marks/bidi are inert; Chinese UI and Arabic content retain own direction',async()=>{
 const value='</textarea></script><img src=x onerror=bad()>\r\nالعربية e\u0301 😀',input=doc([node({label:'مسودة <b>حرفية</b>',value,note:'<script>inert</script>'})]),s=setup(input,{lang:'zh-CN'});assert.equal(s.draft.value,value.replaceAll('\r\n','\n'));assert.equal(s.root.querySelector('img,script,b'),null);assert.equal(s.root.dir,'auto');assert.equal(s.draft.dir,'auto');assert.equal(s.copy.textContent,'复制');assert.equal(s.revert.textContent,'还原');
 const html=await compileHtml(input);assert.ok(html.includes('\\u003c/textarea\\u003e'));assert.ok(!html.includes('<img src=x onerror=bad()>'));s.c.dispose();
});

test('shared reset actions preserve local draft and selection; invalid initial mount leaves existing host untouched',()=>{
 const spec=doc([node(),{type:'button',label:'Reset shared state',action:{kind:'reset'}}]),s=setup(spec);enter(s,'independent local draft');s.draft.focus();s.draft.setSelectionRange(2,6);s.c.setState({count:4});s.host.querySelector('.iui-body>button').click();assert.equal(s.c.getState().count,0);assert.equal(s.draft.value,'independent local draft');assert.equal(s.draft.selectionStart,2);assert.equal(s.draft.selectionEnd,6);
 const host=s.win.document.createElement('div');host.textContent='existing content';assert.throws(()=>mount(host,doc([node({value:{$:'count'}})])));assert.equal(host.textContent,'existing content');s.c.dispose();
});

test('public mount keeps disabled and read-only drafts and ignores disabled action dispatch',()=>{
 const s=setup();enter(s,'accepted draft');const fieldset=s.win.document.createElement('fieldset');s.host.append(fieldset);fieldset.append(s.root);fieldset.disabled=true;
 const before=s.root.outerHTML;for(const button of [s.copy,s.select,s.revert])button.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));
 enter(s,'blocked');assert.equal(s.draft.value,'accepted draft');assert.equal(s.root.outerHTML,before);
 fieldset.disabled=false;s.revert.click();assert.equal(s.draft.value,'Original\ntext 😀\nfinal');s.c.dispose();
 const readonly=setup(doc([node({editable:false})]));enter(readonly,'forged edit');assert.equal(readonly.draft.value,'Original\ntext 😀\nfinal');assert.equal(readonly.root.dataset.dirty,'false');readonly.c.dispose();
});
