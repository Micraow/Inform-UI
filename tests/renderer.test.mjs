import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {mount,compileHtml,compileArtifact,validateDocument} from '../dist/index.js';
const fixture=async name=>JSON.parse(await readFile(new URL(`../examples/${name}.json`,import.meta.url)));
const dom=()=>new JSDOM('<!doctype html><div id="host"></div>',{url:'https://example.com/'});
const host=d=>d.window.document.getElementById('host');
test('all fixtures validate and render without model HTML execution',async()=>{
  for(const name of ['hpcc','rtt','wifi','shortlist','kitchen-sink']){
    const input=await fixture(name),result=validateDocument(input);assert.equal(result.ok,true,JSON.stringify(result));
    const d=dom(),controller=mount(host(d),input);assert.ok(host(d).querySelector('[data-iui]'));assert.equal(host(d).querySelectorAll('script').length,0);controller.dispose();assert.equal(host(d).childElementCount,0);
  }
});
test('HPCC binding updates topology, math metrics, input focus, then resets',async()=>{
  const d=dom(),h=host(d),c=mount(h,await fixture('hpcc')),input=h.querySelector('input[type=range]');
  assert.match(h.textContent,/84\.2/);input.focus();input.value='0.6';input.dispatchEvent(new d.window.Event('input',{bubbles:true}));
  assert.equal(c.getState().U2,0.6);assert.match(h.textContent,/110\.6/);assert.equal(d.window.document.activeElement,input);assert.equal(h.querySelector('[data-link-index="2"]').dataset.bottleneck,'true');
  h.querySelector('button').click();assert.equal(c.getState().U2,1.2);assert.match(h.textContent,/84\.2/);c.dispose();
});
test('state rejection and invalid update are atomic; dispose removes old handlers',async()=>{
  const d=dom(),h=host(d),c=mount(h,await fixture('hpcc')),button=h.querySelector('button'),before=h.textContent;
  assert.throws(()=>c.setState({U2:100}));assert.equal(c.getState().U2,1.2);assert.equal(h.textContent,before);
  assert.throws(()=>c.update({version:'wrong',body:[]}));assert.equal(h.textContent,before);
  c.update({version:'iui/1',body:[{type:'text',value:'new'}]});assert.equal(h.textContent.includes('new'),true);button.click();assert.deepEqual(c.getState(),{});c.dispose();assert.throws(()=>c.setState({x:1}));c.dispose();
});
test('RTT gaps remain separate SVG segments, switches preserve truth and data table',async()=>{
  const d=dom(),h=host(d),c=mount(h,await fixture('rtt'));
  const group=h.querySelector('[data-series]');assert.ok(group.querySelectorAll('path').length>=2);
  assert.match(h.textContent,/Missing/);const count=h.querySelectorAll('[data-series]').length;h.querySelector('input[type=checkbox]').click();assert.equal(h.querySelectorAll('[data-series]').length,count-1);c.dispose();
});
test('external images require a user gesture and send no referrer',()=>{
  const d=dom(),h=host(d),c=mount(h,{version:'iui/1',body:[{type:'image',src:'https://example.com/a.png',alt:'Example image'}]});
  assert.equal(h.querySelector('img'),null);h.querySelector('button').click();assert.equal(h.querySelector('img').referrerPolicy,'no-referrer');c.dispose();
});
test('HTML compiler is deterministic, escapes data and uses script CSP hashes',async()=>{
  const spec={version:'iui/1',title:'<attack>',body:[{type:'text',value:'</script><script>globalThis.pwned=true</script>'}]};
  const a=await compileHtml(spec),b=await compileHtml(spec);assert.equal(a,b);assert.ok(a.includes('sha256-'));assert.ok(a.includes('\\u003c/script\\u003e'));assert.ok(!a.includes('<title><attack>'));
  const artifact=await compileArtifact(spec,{assets:'shared'});assert.equal(Object.keys(artifact.assets).length,2);assert.ok(!artifact.html.includes('globalThis.pwned=true</script>'));assert.ok(artifact.html.length<a.length);
  await assert.rejects(()=>compileHtml(spec,{assets:'shared'}));await assert.rejects(()=>compileArtifact(spec,{assetBase:'../bad/'}));
});
test('text and code keep arbitrary markup inert',()=>{
  const d=dom(),h=host(d),c=mount(h,{version:'iui/1',body:[{type:'text',value:'<img src=x onerror=alert(1)>'},{type:'code',value:'<script>bad()</script>'},{type:'markdown',value:'<b>literal</b>'}]});
  assert.equal(h.querySelectorAll('img,script,b').length,0);assert.match(h.textContent,/<b>literal<\/b>/);c.dispose();
});
test('math renders genuine MathML and hostile TeX never creates executable HTML',()=>{
  const d=dom(),h=host(d),c=mount(h,{version:'iui/1',body:[{type:'math',latex:'x=\\frac{1}{2}'},{type:'math',latex:'\\href{javascript:alert(1)}{click}'}]});
  assert.ok(h.querySelector('math'));assert.ok(h.querySelector('mfrac'));assert.equal(h.querySelectorAll('a[href^="javascript"],script,img').length,0);c.dispose();
});
test('toggle/select/set/reset controls retain exact state types',()=>{
  const d=dom(),h=host(d),spec={version:'iui/1',state:{enabled:false,choice:1},body:[{type:'toggle',label:'Enabled',bind:'enabled'},{type:'select',label:'Choice',bind:'choice',options:[{label:'One',value:1},{label:'Two',value:2}]},{type:'button',label:'Set',action:{kind:'set',bind:'choice',value:2}},{type:'button',label:'Reset',action:{kind:'reset'}}]};
  const c=mount(h,spec);h.querySelector('input').click();assert.equal(c.getState().enabled,true);const select=h.querySelector('select');select.value='1';select.dispatchEvent(new d.window.Event('change'));assert.equal(c.getState().choice,2);h.querySelectorAll('button')[1].click();assert.deepEqual(c.getState(),{enabled:false,choice:1});h.querySelectorAll('button')[0].click();assert.equal(c.getState().choice,2);c.dispose();
});
test('slider marks reflect numeric positions; topology subtitle is visible',()=>{
  const d=dom(),h=host(d),c=mount(h,{version:'iui/1',state:{x:2},body:[{type:'slider',label:'X',bind:'x',min:0,max:10,step:1,marks:[{value:2,label:'Two'},{value:8,label:'Eight'}]},{type:'topology',nodes:[{id:'a',label:'A',subtitle:'Source'},{id:'b',label:'B'}],links:[{from:'a',to:'b'}]}]});
  assert.equal(h.querySelector('[data-value="2"]').style.left,'20%');assert.equal(h.querySelector('[data-value="8"]').style.left,'80%');assert.ok([...h.querySelectorAll('svg text')].some(e=>e.textContent==='Source'));c.dispose();
});
