import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM, ResourceLoader} from 'jsdom';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
const spec = value => ({version:'iui/1',body:[{type:'markdown',value}]});
function render(value, language='en') {
  const requests=[]; class NoFetch extends ResourceLoader { fetch(url) { requests.push(url); return null; } }
  const dom=new JSDOM('<!doctype html><div id="host"></div>',{url:'https://example.test/',resources:new NoFetch()});
  const host=dom.window.document.getElementById('host'); host.lang=language;
  const controller=mount(host,spec(value)), root=host.querySelector('.iui-markdown');
  return {dom,host,controller,root,requests};
}
test('public finite example validates and all supported native blocks render',async()=>{
  const input=JSON.parse(await readFile(new URL('../examples/markdown-subset.json',import.meta.url)));
  assert.equal(validateDocument(input).ok,true); const d=new JSDOM('<main/>'); const h=d.window.document.querySelector('main'),c=mount(h,input);
  for(const selector of ['h1','h2','h3','h4','h5','h6','ul li','ol li','blockquote','pre > code','p > code','em','strong','a']) assert.ok(h.querySelector(selector),selector);
  assert.equal(h.querySelector('ol li').value,3); c.dispose();
});
test('empty input and exact Unicode/CRLF code text with literal language',()=>{
  assert.equal(render('').root.childElementCount,0);
  const code='中文 😀 e\u0301\r\n<tag>\\`*x*\r\n'; const r=render('```<literal>\r\n'+code+'```');
  assert.equal(r.root.querySelector('pre code').textContent,code); assert.equal(r.root.querySelector('pre').tabIndex,0); assert.equal(r.root.querySelector('pre').getAttribute('aria-label'),'<literal> code'); assert.equal(r.root.querySelector('.iui-markdown-language').textContent,'<literal>');
  assert.equal(r.root.querySelector('tag'),null); assert.equal(r.root.querySelector('button'),null);
  assert.equal(render('`a\\`').root.querySelector('code').textContent,'a\\');
  assert.equal(render('`a|b <tag>`').root.querySelector('code').textContent,'a|b <tag>');
  assert.equal(render('中文 😀\r\nעברית').root.textContent,'中文 😀\r\nעברית');
});
test('flat emphasis/code and escaped delimiters preserve authored text',()=>{
  const r=render('*em* **strong** _em_ __strong__ `*literal*` \\*safe\\*');
  assert.equal(r.root.querySelectorAll('em').length,2); assert.equal(r.root.querySelectorAll('strong').length,2);
  assert.equal(r.root.querySelector('code').textContent,'*literal*'); assert.match(r.root.textContent,/\*safe\*$/);
  for(const value of ['***nested***','**a *b* c**','word_inside_word','unclosed *word','```js\r\nx\r\n','~~~~\ntext\n~~~~','  - nested','>> nested','> > nested','> >nested','``*nested*``','***a *nested* b***','- [ ] task','1. [x] task','| a | b |','<script>*x*</script>','![alt *x*](https://example.test/a.png)','[broken *label*']) assert.equal(render(value).root.textContent.replace(/\r?\n/g,''),value.replace(/\r?\n/g,''),value);
});
test('safe links reuse core policy, anchors scoped, external hint localized',()=>{
  const r=render('[site](https://example.test/read) [jump](#target) [mail](mailto:hello@example.test) [phone](tel:+1234)','zh');
  const anchors=[...r.root.querySelectorAll('a')]; assert.equal(anchors.length,4);
  assert.equal(anchors[0].target,'_blank'); assert.equal(anchors[0].rel,'noopener noreferrer'); assert.equal(anchors[0].referrerPolicy,'no-referrer'); assert.match(anchors[0].textContent,/新标签页/);
  assert.match(anchors[1].getAttribute('href'),/^#iui-\d+-target$/); assert.equal(anchors[1].hasAttribute('target'),false); assert.match(anchors[2].textContent,/外部应用/); assert.match(anchors[3].textContent,/外部应用/); assert.deepEqual(r.requests,[]);
});
test('unsafe and unsupported links/images stay literal without resource requests',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,test','https://u:p@example.test','https://example.test/\\x','https://example.test/\tbad','mailto:x@y?body=foo','//example.test','/relative','ftp://example.test']) {
    const value=`[link](${href})`,r=render(value); assert.equal(r.root.querySelector('a'),null,href); assert.equal(r.root.textContent,value); assert.deepEqual(r.requests,[]);
  }
  const raw='<img src="https://example.test/x" onerror="pwned=1">\n![x](https://example.test/i)\n<script>pwned=1</script>';
  const r=render(raw); assert.equal(r.root.querySelectorAll('img,script,iframe,video,audio').length,0); assert.deepEqual(r.requests,[]); assert.equal(r.dom.window.pwned,undefined);
});
test('all defensive budgets fall back losslessly, delimiter runs terminate',()=>{
  for(const value of ['*'.repeat(12000),'['.repeat(12000),'*'.repeat(4000)+'x'+'*'.repeat(3999)+'x'+'*'.repeat(3999),'_'.repeat(12000),'\n'.repeat(5000),'*x* '.repeat(3000)]) {
    const r=render(value); assert.equal(validateDocument(spec(value)).ok,true); if(r.root.dataset.markdownFallback) assert.equal(r.root.textContent,value);
    assert.ok(r.root.querySelectorAll('*').length<=4098);
  }
  assert.equal(render('\n'.repeat(5000)).root.dataset.markdownFallback,'budget');
  assert.equal(render('*x* '.repeat(3000)).root.dataset.markdownFallback,'budget');
  assert.equal(validateDocument(spec('a'.repeat(12001))).ok,false);
});
test('deterministic compiler, exact input escaping, owner documents and repeated lifecycle',async()=>{
  const value='## 中文 😀\n\n```\r\n</script><script>globalThis.pwned=1</script>\r\n```';
  const a=await compileHtml(spec(value)),b=await compileHtml(spec(value)); assert.equal(a,b); assert.ok(!a.includes('</script><script>globalThis.pwned'));
  const r=render(value),other=render('*other*');
  for(const element of r.root.querySelectorAll('*')) assert.equal(element.ownerDocument,r.dom.window.document);
  for(let i=0;i<20;i++) { r.controller.update(spec(`**${i}**`)); assert.equal(r.host.querySelector('strong').textContent,String(i)); }
  r.controller.dispose(); r.controller.dispose(); assert.equal(r.host.childElementCount,0); assert.equal(other.root.querySelector('em').textContent,'other'); other.controller.dispose();
});

test('12000 emoji public schema and semantic acceptance agree after Unicode repair',()=>{
 const value='😀'.repeat(12000); assert.equal(validateDocument(spec(value)).ok,true); assert.equal(render(value).root.textContent,value);
});

test('Markdown RTL fixture supplies actual first visible Arabic and code stays native LTR',async()=>{const input=JSON.parse(await readFile(new URL('./fixtures/markdown-rtl.json',import.meta.url))),dom=new JSDOM('<main/>'),host=dom.window.document.querySelector('main'),c=mount(host,input);assert.equal(host.querySelector('.iui-root').dir,'auto');assert.match(host.querySelector('.iui-description').textContent,/^\p{Script=Arabic}/u);assert.equal(host.querySelector('.iui-code').tabIndex,0);c.dispose();});
