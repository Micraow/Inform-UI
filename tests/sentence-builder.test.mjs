import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount, validateDocument, compileHtml, evaluateState} from '../dist/index.js';

const node = () => ({type:'sentence-builder', title:'Put the tokens in order', prompt:'Arrange the supplied identities.', tokens:[{id:'first',text:'I'},{id:'second',text:'I'},{id:'verb',text:'am'}], answer:['first','verb','second'], explanation:'An original finite exercise.'});
const spec = (n=node()) => ({version:'iui/1', state:{x:1}, body:[n]});
function setup(input=spec(), lang='en', wrapper='div') {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><body><${wrapper}><div id="host"></div></${wrapper}></body></html>`);
  const host = dom.window.document.getElementById('host'), controller=mount(host,input);
  return {dom,host,controller,root:host.querySelector('.iui-sentence-builder')};
}
const act=(root,action,id) => [...root.querySelectorAll(`button[data-sentence-action="${action}"]`)].find(b=>id===undefined || b.dataset.tokenId===id);
const choose=(root,...ids)=>ids.forEach(id=>act(root,'add',id).click());
const order=root=>[...root.querySelectorAll('.iui-sentence-builder-chosen>li')].map(li=>li.dataset.tokenId);
const bank=root=>[...root.querySelectorAll('.iui-sentence-builder-bank>button')].filter(b=>!b.hidden).map(b=>b.dataset.tokenId);
const live=root=>root.querySelector('[role="status"]');
function invalid(mutate, expected='SCHEMA') {const input=spec();mutate(input.body[0],input);const result=validateDocument(input);assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code===expected),JSON.stringify(result));}

test('public finite contract accepts bounds, optional prompt, duplicate visible strings, joiners and learning subset ownership',async()=>{
  for(const joiner of [undefined,'',' ']) {const n=node();delete n.prompt;if(joiner!==undefined)n.joiner=joiner;assert.equal(validateDocument(spec(n)).ok,true);}
  for(const count of [1,30]) {const n=node();n.tokens=Array.from({length:count},(_,i)=>({id:'a'+i,text:'😀'.repeat(200)}));n.answer=n.tokens.map(t=>t.id);n.title='😀'.repeat(200);n.prompt='😀'.repeat(2000);n.explanation='😀'.repeat(2000);assert.equal(validateDocument(spec(n)).ok,true);}
  const schema=JSON.parse(await readFile('src/schema/fragments/learning.schema.json','utf8'));
  const validate=new Ajv2020({strict:true}).compile(schema);assert.equal(validate(spec()),true);
  const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners['sentence-builder'],'learning');
  const fixture=JSON.parse(await readFile('examples/sentence-builder.json','utf8'));assert.equal(validateDocument(fixture).ok,true);
});

test('strict schema rejects every finite boundary, incorrect type, unknown data and unsupported capability',()=>{
  const cases=[n=>delete n.title,n=>n.title='',n=>n.title='x'.repeat(201),n=>n.prompt='x'.repeat(2001),n=>n.explanation='x'.repeat(2001),n=>delete n.tokens,n=>n.tokens=[],n=>n.tokens=Array.from({length:31},(_,i)=>({id:'a'+i,text:'a'})),n=>n.tokens[0].text='',n=>n.tokens[0].text='😀'.repeat(201),n=>n.tokens[0].text=5,n=>n.tokens[0].id='a'.repeat(81),n=>n.tokens[0].id='',n=>n.tokens[0].id='not an id',n=>n.tokens[0].extra=true,n=>delete n.answer,n=>n.answer=[],n=>n.answer=Array(31).fill('first'),n=>n.answer=[4],n=>n.joiner='\n',n=>n.joiner=null,n=>n.prompt={},n=>n.explanation={},n=>n.score=1,n=>n.bind='x',n=>n.status='loading',n=>n.match='fuzzy',n=>n.src='https://example.invalid',n=>n.type='learning-sentence-builder-card'];
  for(const mutate of cases)invalid(mutate);
});

test('semantic identity permutation rejects duplicate, missing, unknown and repeated answer identities',()=>{
  for(const mutate of [n=>n.tokens[1].id='first',n=>n.answer=['first','verb','verb'],n=>n.answer=['first','verb'],n=>n.answer=['first','verb','unknown'],n=>n.answer=['first','verb','second','unknown']])invalid(mutate,'SENTENCE_BUILDER_ID');
  const n=node();n.tokens[0].id='__proto__';n.answer[0]='__proto__';assert.equal(validateDocument(spec(n)).ok,true);
});

test('practice is forbidden at every form descendant path, including layout and list, but independent siblings are valid',()=>{
  for(const wrap of [n=>n,n=>({type:'box',children:[n]}),n=>({type:'list',items:[{type:'section',children:[n]}]})]) {
    const result=validateDocument({version:'iui/1',body:[{type:'form',label:'Author form',children:[wrap(node())]}]});
    assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code==='LEARNING_FORM'));
  }
  assert.equal(validateDocument({version:'iui/1',body:[{type:'form',label:'Unrelated form',children:[]},node()]}).ok,true);
});

test('global text, depth and JSON safety budgets apply before component rendering',()=>{
  const n=node();n.tokens=Array.from({length:30},(_,i)=>({id:'a'+i,text:'😀'.repeat(200)}));n.answer=n.tokens.map(t=>t.id);n.prompt='😀'.repeat(2000);n.explanation='😀'.repeat(2000);
  const many={version:'iui/1',body:Array.from({length:150},()=>structuredClone(n))};
  const result=validateDocument(many);assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code==='TEXT_LIMIT'));
  let deep=node();for(let i=0;i<70;i++)deep={type:'box',children:[deep]};const tooDeep=validateDocument({version:'iui/1',body:[deep]});assert.equal(tooDeep.ok,false);assert.ok(tooDeep.issues.some(i=>i.code==='DEPTH_LIMIT'));
  let called=false;const getter=node();Object.defineProperty(getter,'prompt',{enumerable:true,get(){called=true;return 'Never';}});assert.equal(validateDocument(spec(getter)).ok,false);assert.equal(called,false);
  invalid(n=>n.callback=()=>{},'JSON_TYPE');
});

test('bank is authored order, unique identities append once, native explicit controls and incomplete check is not graded',()=>{
  const {root,controller,dom}=setup();assert.deepEqual(bank(root),['first','second','verb']);
  assert.equal(live(root).textContent,'');assert.equal(root.dataset.component,'learning-sentence-builder-card');
  assert.equal(root.querySelectorAll('[role="status"]').length,1);
  assert.equal(root.querySelector('form,input,script,img,iframe'),null);
  for(const b of root.querySelectorAll('button'))assert.equal(b.type,'button');
  act(root,'check').focus();act(root,'check').click();assert.match(live(root).textContent,/Choose every token/);assert.equal(root.dataset.attempt,'draft');assert.equal(dom.window.document.activeElement,act(root,'check'));
  const first=act(root,'add','first');first.focus();first.click();first.click();assert.deepEqual(order(root),['first']);assert.equal(dom.window.document.activeElement,act(root,'add','second'));
  choose(root,'verb');assert.deepEqual(order(root),['first','verb']);assert.equal(act(root,'earlier','first').getAttribute('aria-disabled'),'true');assert.equal(act(root,'later','verb').getAttribute('aria-disabled'),'true');
  assert.match(act(root,'remove','first').getAttribute('aria-label'),/Remove: I, position 1/);
  controller.dispose();
});

test('reordering uses stable nodes and focus, boundary actions are strict no-ops, Remove restores original bank position',()=>{
  const {root,controller,dom}=setup();choose(root,'first','second','verb');
  const entry=root.querySelector('[data-token-id="second"].iui-sentence-builder-item'),move=act(root,'later','second');move.focus();move.click();
  assert.deepEqual(order(root),['first','verb','second']);assert.equal(root.querySelector('[data-token-id="second"].iui-sentence-builder-item'),entry);assert.equal(dom.window.document.activeElement,move);
  const status=live(root).textContent;move.click();assert.deepEqual(order(root),['first','verb','second']);assert.equal(live(root).textContent,status);assert.equal(dom.window.document.activeElement,move);
  act(root,'earlier','first').focus();act(root,'earlier','first').click();assert.deepEqual(order(root),['first','verb','second']);assert.equal(live(root).textContent,status);
  act(root,'remove','second').click();assert.deepEqual(bank(root),['second']);assert.equal(dom.window.document.activeElement,act(root,'add','second'));
  act(root,'remove','first').click();assert.deepEqual(bank(root),['first','second']);choose(root,'first');assert.deepEqual(order(root),['verb','first']);
  controller.dispose();
});

test('Check matches exact IDs, edits clear stale judgement, and Reveal never turns subsequent checks into independent correctness',()=>{
  const {root,controller,dom}=setup();choose(root,'second','verb','first');act(root,'check').focus();act(root,'check').click();
  assert.equal(root.dataset.attempt,'incorrect');assert.equal(dom.window.document.activeElement,act(root,'check'));
  act(root,'remove','second').click();assert.equal(root.dataset.attempt,'draft');assert.doesNotMatch(live(root).textContent,/does not match/);
  act(root,'retry').click();choose(root,'first','verb','second');act(root,'check').click();assert.equal(root.dataset.attempt,'correct');assert.equal(live(root).textContent,'Correct order.');
  act(root,'earlier','second').click();assert.equal(root.dataset.attempt,'draft');act(root,'check').click();assert.equal(root.dataset.attempt,'incorrect');
  const before=order(root);act(root,'reveal').focus();act(root,'reveal').click();assert.deepEqual(order(root),before);assert.equal(root.dataset.attempt,'revealed');assert.equal(dom.window.document.activeElement,act(root,'reveal'));
  assert.match(live(root).textContent,/not an independently correct/);assert.equal(root.querySelector('.iui-sentence-builder-reference').hidden,false);
  act(root,'later','second').click();assert.equal(root.dataset.attempt,'revealed');act(root,'check').click();assert.match(live(root).textContent,/matches the revealed answer/);assert.equal(root.dataset.attempt,'revealed');
  act(root,'retry').click();assert.deepEqual(order(root),[]);assert.deepEqual(bank(root),['first','second','verb']);assert.equal(root.dataset.attempt,'draft');assert.equal(root.querySelector('.iui-sentence-builder-reference').hidden,true);assert.equal(act(root,'reveal').getAttribute('aria-expanded'),'false');assert.equal(dom.window.document.activeElement,act(root,'add','first'));
  choose(root,'first','verb','second');act(root,'check').click();assert.equal(root.dataset.attempt,'correct');controller.dispose();
});

test('unrelated and same-value host state preserve the complete DOM, text selection, focus, order, reference and live region',()=>{
  const {root,controller,dom}=setup();choose(root,'first','verb');act(root,'reveal').click();
  const focused=act(root,'earlier','verb');focused.focus();const selected=root.querySelector('.iui-sentence-builder-token');
  const range=dom.window.document.createRange();range.selectNodeContents(selected);dom.window.getSelection().removeAllRanges();dom.window.getSelection().addRange(range);assert.equal(dom.window.getSelection().toString(),'I');
  const html=root.innerHTML,status=live(root).textContent;const observer=new dom.window.MutationObserver(()=>{});observer.observe(root,{attributes:true,childList:true,subtree:true,characterData:true});
  controller.setState({x:1});controller.setState({x:2});assert.deepEqual(controller.getState(),{x:2});
  assert.equal(root.innerHTML,html);assert.equal(live(root).textContent,status);assert.equal(dom.window.document.activeElement,focused);assert.equal(dom.window.getSelection().toString(),'I');assert.equal(observer.takeRecords().length,0);
  observer.disconnect();controller.dispose();
});

test('invalid controller.update preserves old session atomically; valid update resets it and removes old listeners',()=>{
  const input=spec(),copy=structuredClone(input),{root,host,controller}=setup(input);choose(root,'first');act(root,'reveal').click();
  const oldAdd=act(root,'add','second'),oldHTML=root.innerHTML;const bad=spec();bad.body[0].answer=['missing'];
  assert.throws(()=>controller.update(bad));assert.equal(host.querySelector('.iui-sentence-builder'),root);assert.equal(root.innerHTML,oldHTML);
  assert.equal(evaluateState(input,{x:2}).ok,true);assert.deepEqual(input,copy);
  controller.update(spec());const replacement=host.querySelector('.iui-sentence-builder');assert.notEqual(replacement,root);assert.deepEqual(order(replacement),[]);
  oldAdd.click();assert.deepEqual(order(root),['first']);assert.equal(root.innerHTML,oldHTML);
  const oldCheck=act(replacement,'check'),status=live(replacement).textContent;controller.dispose();oldCheck.click();assert.equal(live(replacement).textContent,status);assert.equal(host.childElementCount,0);controller.dispose();assert.throws(()=>controller.update(spec()),/disposed/);
});

test('independent mounts and ownerDocuments stay isolated, repeated update/dispose do not affect siblings',()=>{
  const a=setup(),b=setup(spec(),'zh-CN');choose(a.root,'first');assert.deepEqual(order(b.root),[]);
  assert.match(act(b.root,'check').textContent,/检查顺序/);assert.notEqual(a.root.getAttribute('aria-labelledby'),b.root.getAttribute('aria-labelledby'));
  for(let i=0;i<6;i++){a.controller.update(spec());choose(a.host.querySelector('.iui-sentence-builder'),'second');}
  a.controller.dispose();assert.ok(b.host.querySelector('.iui-sentence-builder'));choose(b.root,'verb');assert.deepEqual(order(b.root),['verb']);b.controller.dispose();
});

test('raw Unicode and CRLF remain literal, caller joiner is exact, script-looking strings never create markup, compile is deterministic',async()=>{
  const n=node();n.title='عنوان عربي 😀';n.prompt='<img src=x onerror=alert(1)>\r\nمثال';n.explanation='</script><script>alert(1)</script>';
  n.tokens=[{id:'first',text:'A\r\nB'},{id:'second',text:'<script>evil()</script>'},{id:'verb',text:'😀中文'}];n.joiner='';
  const input=spec(n),{root,controller}=setup(input);choose(root,'first','verb','second');
  const texts=[...root.querySelectorAll('.iui-sentence-builder-chosen .iui-sentence-builder-token')].map(e=>e.textContent);assert.deepEqual(texts,[n.tokens[0].text,n.tokens[2].text,n.tokens[1].text]);
  assert.equal(root.querySelector('.iui-sentence-builder-group [aria-label="Text preview"]').textContent,texts.join(''));
  assert.equal(root.querySelector('script,img,iframe,a'),null);assert.equal(root.dir,'auto');assert.equal(root.querySelector('h2').textContent,n.title);
  const html=await compileHtml(input,{lang:'en'});assert.equal(html,await compileHtml(input,{lang:'en'}));assert.ok(!html.includes('</script><script>alert(1)</script>'));assert.match(html,/sentence-builder/);
  controller.dispose();
});

test('native controls have no author-form submit side effects',()=>{
  const {root,controller,dom}=setup(spec(),'en','form');let submitted=0;dom.window.document.querySelector('form').addEventListener('submit',event=>{submitted++;event.preventDefault();});
  choose(root,'first','verb','second');for(const action of ['check','reveal','retry'])act(root,action).click();assert.equal(submitted,0);controller.dispose();
});

test('hiding and revealing a host preserves original controls and local session without announcing again',()=>{
  const {root,host,controller}=setup();choose(root,'first','verb');act(root,'reveal').click();const control=act(root,'earlier','verb'),html=root.innerHTML;
  host.hidden=true;controller.setState({x:2});host.hidden=false;
  assert.equal(act(root,'earlier','verb'),control);assert.equal(root.innerHTML,html);assert.deepEqual(order(root),['first','verb']);assert.equal(root.dataset.attempt,'revealed');controller.dispose();
});

test('bundled invalid fixtures are rejected by the public validator and never emitted as legal examples',async()=>{
  for(const name of ['unknown-id','duplicate-answer','form-nesting']) {
    const input=JSON.parse(await readFile(`tests/fixtures/sentence-builder-invalid/${name}.json`,'utf8'));
    const result=validateDocument(input);assert.equal(result.ok,false);assert.ok(result.issues.some(i=>['SENTENCE_BUILDER_ID','LEARNING_FORM'].includes(i.code)));
  }
});
