import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { measureRail, logicalOffset, physicalOffset } from './source-harness.mjs';
import { setup, fakeRail, item, group } from './source-harness.mjs';

test('citation uses exact literal text and one native secure anchor, with caller number unchanged', () => {
  const h=setup(), hostile='<img src="https://example.invalid/pixel" onerror="bad()">';
  const node={type:'citation',title:hostile,url:'https://example.invalid:8443/paper?q=x#part',publisher:'<script>bad()</script>',description:'Line one\n'+hostile,number:17}; const before=structuredClone(node);
  const out=h.mount(node), link=out.querySelector('a');
  assert.equal(link.textContent,hostile); assert.equal(link.getAttribute('href'),node.url); assert.equal(link.target,'_blank'); assert.equal(link.rel,'noopener noreferrer'); assert.equal(link.referrerPolicy,'no-referrer');
  assert.equal(out.querySelector('.iui-source-number').textContent,'[17]'); assert.equal(out.querySelector('.iui-source-domain').textContent,'example.invalid:8443'); assert.equal(out.querySelector('bdi').dir,'ltr');
  assert.equal(out.querySelector('.iui-source-publisher').textContent,node.publisher); assert.equal(out.querySelector('p').textContent,node.description);
  assert.equal(h.doc.getElementById(link.getAttribute('aria-describedby')).textContent,'Opens in a new tab');
  assert.equal(out.querySelectorAll('a').length,1); assert.equal(out.querySelectorAll('img,script,iframe,svg').length,0); assert.equal(h.metrics.listeners,0); assert.equal(h.frames.size,0); assert.deepEqual(node,before); h.dispose();
});

test('renderer safety guard reuses core URL policy and refuses non-web schemes and malformed inputs', () => {
  const h=setup();
  for(const url of ['javascript:bad()','data:text/html,bad','ftp://example.invalid','#target','mailto:a@example.invalid','tel:+123','//example.invalid','/relative','https:example.invalid','https://user:secret@example.invalid',' https://example.invalid','https://example.invalid\n','https://exam\tple.invalid','https://exa\\mple.invalid','https://','https://example.invalid:99999',null,{},42]) assert.throws(()=>h.mount({...item(),type:'citation',url}),TypeError, String(url));
  for(const url of ['https://example.invalid','http://example.invalid/a?x=1#z','HTTPS://example.invalid/%3Cscript%3E','https://例子.invalid/路径']) assert.equal(h.mount({...item(),type:'citation',url}).querySelector('a').getAttribute('href'),url);
  assert.equal(h.metrics.listeners,0);h.dispose();
});

test('card order, duplicate data and one-anchor-per-record semantics are preserved without selection', () => {
  const h=setup({lang:'zh-Hant'}), n=group(3);n.items[2]=structuredClone(n.items[0]);const before=structuredClone(n),out=h.mount(n);
  const rail=out.querySelector('ul');assert.equal(rail.getAttribute('role'),'list');assert.deepEqual([...rail.querySelectorAll('a')].map(a=>a.textContent),n.items.map(v=>v.title));
  assert.ok([...rail.children].every(card=>card.tagName==='LI'&&card.querySelectorAll('a').length===1)); assert.equal(out.querySelectorAll('[aria-current],[aria-selected],[role=tab],[aria-live]').length,0);
  assert.equal(out.querySelector('.iui-source-previous').textContent,'上一页链接'); assert.equal(out.querySelector('.iui-source-sr').textContent,'在新标签页中打开');assert.deepEqual(n,before);h.dispose();
});

test('zero/over-limit lists and an unsafe later item allocate no listeners, frames or observers', () => {
  const h=setup();for(const n of [group(0),group(21),{...group(2),items:[item(),item('Unsafe','javascript:bad()')]}])assert.throws(()=>h.mount(n));
  assert.equal(h.root.childElementCount,0); assert.equal(h.metrics.listeners,0);assert.equal(h.frames.size,0);assert.equal(h.observers.size,0);
  assert.equal(h.mount(group(20)).querySelectorAll('li').length,20);h.dispose();
});

test('logical geometry handles LTR, RTL, subpixel edges and hidden viewports', () => {
  assert.deepEqual(measureRail({left:10,right:310},[{left:10,right:210},{left:222,right:422}],false),{previous:false,next:true,first:1,last:2});
  assert.deepEqual(measureRail({left:10,right:310},[{left:-100,right:0},{left:12,right:212},{left:224,right:424}],false),{previous:true,next:true,first:2,last:3});
  assert.deepEqual(measureRail({left:10,right:310},[{left:110,right:310},{left:-102,right:98}],true),{previous:false,next:true,first:1,last:2});
  assert.deepEqual(measureRail({left:10,right:310},[{left:210,right:410},{left:-2,right:198}],true),{previous:true,next:true,first:1,last:2});
  assert.deepEqual(measureRail({left:10,right:310},[{left:9.75,right:310.25}],false),{previous:false,next:false,first:1,last:1});
  assert.deepEqual(measureRail({left:10,right:10},[{left:10,right:210}],false),{previous:false,next:false,first:0,last:0});
});

test('all three RTL models round-trip logical offsets and clamp without rounding', () => {
  for(const rtl of [false,true])for(const model of ['negative','reverse','default'])for(const value of [0,12.125,97.5,400])assert.equal(logicalOffset(physicalOffset(value,400,rtl,model),400,rtl,model),value);
  assert.equal(physicalOffset(999,400,false,'negative'),400);assert.equal(physicalOffset(-1,400,true,'negative'),-0);
});

for(const [rtl,model] of [[false,'negative'],[true,'negative'],[true,'reverse'],[true,'default']])test(`bounded navigation preserves focus and native links for rtl=${rtl}, ${model}`, () => {
  const h=setup(),out=h.mount(group()),mock=fakeRail(h,out,{rtl,model}),prev=out.querySelector('.iui-source-previous'),next=out.querySelector('.iui-source-next');
  assert.equal(prev.getAttribute('aria-disabled'),'true');assert.equal(next.getAttribute('aria-disabled'),'false');assert.equal(mock.rail.tabIndex,0);
  next.focus(); next.click();h.flush();assert.equal(mock.logical,300);assert.equal(h.doc.activeElement,next);assert.equal(mock.calls[0].behavior,'instant');
  next.click();h.flush();assert.equal(mock.logical,mock.max);assert.equal(next.getAttribute('aria-disabled'),'true');assert.equal(h.doc.activeElement,next);const calls=mock.calls.length;
  next.click();h.flush();assert.equal(mock.logical,mock.max);assert.equal(mock.calls.length,calls);assert.equal(h.doc.activeElement,next);
  prev.focus();prev.click();h.flush();assert.equal(mock.logical,mock.max-300);prev.click();h.flush();assert.equal(mock.logical,0);assert.equal(prev.getAttribute('aria-disabled'),'true');assert.equal(h.doc.activeElement,prev);
  const anchor=mock.rail.querySelector('a');anchor.focus();mock.scroll(25.5);assert.equal(h.doc.activeElement,anchor);assert.equal(mock.rail.scrollLeft,physicalOffset(25.5,mock.max,rtl,model));
  const oldAnchor=anchor,oldScroll=mock.logical; h.resize();assert.equal(mock.rail.querySelector('a'),oldAnchor);assert.equal(mock.logical,oldScroll);assert.equal(h.doc.activeElement,anchor);h.dispose();
});

test('one-card/no-overflow removes rail tab stop; resize recalculates buttons without stealing focus', () => {
  const h=setup(),one=h.mount(group(1)),single=fakeRail(h,one,{width:500});assert.equal(single.rail.hasAttribute('tabindex'),false);
  for(const button of one.querySelectorAll('button'))assert.equal(button.getAttribute('aria-disabled'),'true');
  const out=h.mount(group(3)),mock=fakeRail(h,out),outside=h.doc.createElement('input');h.root.append(outside);outside.focus();
  mock.setWidth(1000);assert.equal(mock.rail.hasAttribute('tabindex'),false);assert.equal(h.doc.activeElement,outside);for(const button of out.querySelectorAll('button'))assert.equal(button.getAttribute('aria-disabled'),'true');
  mock.setWidth(250);assert.equal(mock.rail.tabIndex,0);assert.equal(out.querySelector('.iui-source-next').getAttribute('aria-disabled'),'false');assert.equal(h.doc.activeElement,outside);h.dispose();
});

test('scaled viewport and item rectangles agree at both boundaries without changing logical page distance', () => {
  for(const zoom of [.75,1.5,2])for(const rtl of [false,true]){
    const h=setup(),out=h.mount(group()),mock=fakeRail(h,out,{zoom,rtl}),next=out.querySelector('.iui-source-next'),prev=out.querySelector('.iui-source-previous');
    assert.equal(prev.getAttribute('aria-disabled'),'true');assert.equal(next.getAttribute('aria-disabled'),'false');next.click();h.flush();assert.equal(mock.logical,300);mock.scroll(mock.max);assert.equal(next.getAttribute('aria-disabled'),'true');
    mock.setWidth(1000);assert.equal(prev.getAttribute('aria-disabled'),'true');assert.equal(next.getAttribute('aria-disabled'),'true');assert.equal(mock.rail.hasAttribute('tabindex'),false);h.dispose();
  }
});

test('host IDs, labels and source nodes remain independent across owner documents and updates', () => {
  const main=setup(),foreignDOM=new JSDOM('<!doctype html><html><body></body></html>',{pretendToBeVisual:true}),foreign=setup({dom:foreignDOM,lang:'zh-CN',theme:'dark'});
  const a=main.mount({...group(2),id:'same'}),b=main.mount({...group(2),id:'same-other'}),f=foreign.mount({...group(1),id:'same'});fakeRail(main,a);fakeRail(main,b);fakeRail(foreign,f);
  const ids=[...main.root.querySelectorAll('[id]'),...foreign.root.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const node of f.querySelectorAll('*'))assert.equal(node.ownerDocument,foreign.doc);assert.equal(f.querySelector('.iui-source-position').textContent,'当前可见第 1–1 条，共 1 条链接');
  const kept=f.querySelector('a');kept.focus();main.dispose();assert.equal(foreign.doc.activeElement,kept);assert.equal(kept.isConnected,true);foreign.dispose();
});

test('update/dispose remove old listeners and observers; late callbacks cannot touch old UI', () => {
  const h=setup(),out=h.mount(group()),mock=fakeRail(h,out),oldObserver=[...h.observers][0];mock.scroll(50);const next=out.querySelector('.iui-source-next'),old=out.outerHTML;
  const [fresh]=h.update([group(1)]);fakeRail(h,fresh);assert.equal(h.metrics.disconnects,1);const calls=mock.calls.length;next.click();oldObserver.cb();h.flush();assert.equal(mock.calls.length,calls);assert.equal(out.outerHTML,old);
  h.dispose();h.dispose();assert.equal(h.metrics.listeners,0);assert.equal(h.metrics.disconnects,2);assert.equal(h.observers.size,0);assert.equal(h.frames.size,0);
});

test('dispose before initial animation frame cancels the pending refresh', () => {
  const h=setup(),out=h.mount(group());assert.equal(h.frames.size,1);const old=out.outerHTML;h.dispose();h.flush();assert.equal(h.frames.size,0);assert.equal(out.outerHTML,old);assert.equal(h.metrics.listeners,0);
});
