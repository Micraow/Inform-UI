import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setup,fakeRail,group} from './carousel-harness.mjs';
import {measureRail,logicalOffset,physicalOffset} from './carousel-harness.mjs';
const buttons=out=>[out.querySelector('.iui-carousel-previous'),out.querySelector('.iui-carousel-next')];
test('carousel and source cards import the same geometry module',async()=>{for(const name of ['carousel','sources'])assert.match(await readFile('src/renderer/'+name+'.ts','utf8'),/from ['"]\.\/source-geometry\.js['"]/);});
test('mixed fractional rects, partial visibility and gaps in one transformed coordinate space',()=>{
 assert.deepEqual(measureRail({left:20,right:320},[{left:-30,right:49.25},{left:65.75,right:208.5},{left:225,right:600}],false),{previous:true,next:true,first:1,last:3});
 assert.deepEqual(measureRail({left:20,right:320},[{left:290,right:350},{left:150,right:270},{left:-40,right:130}],true),{previous:true,next:true,first:1,last:3});
 assert.deepEqual(measureRail({left:0,right:0},[{left:0,right:20}],false),{previous:false,next:false,first:0,last:0});
});
for(const rtl of [false,true])for(const model of ['negative','reverse','default'])test(`bounded viewport movement ${rtl?'RTL':'LTR'} ${model}`,()=>{
 const h=setup(),out=h.mount(group(5)),r=fakeRail(h,out,{rtl,model,zoom:1.25,width:253.5,cardWidth:174.25,gap:13.5}),[prev,next]=buttons(out);
 assert.equal(prev.getAttribute('aria-disabled'),'true');assert.equal(next.getAttribute('aria-disabled'),'false');
 next.focus();next.click();assert.equal(r.logical,253.5);assert.equal(h.doc.activeElement,next);
 for(let i=0;i<8;i++)next.click();assert.equal(r.logical,r.max);assert.equal(next.getAttribute('aria-disabled'),'true');
 const calls=r.calls.length;next.click();assert.equal(r.calls.length,calls);assert.equal(h.doc.activeElement,next);
 for(let i=0;i<8;i++)prev.click();assert.equal(r.logical,0);assert.equal(prev.getAttribute('aria-disabled'),'true');h.dispose();
});
test('pure offset transforms invert and clamp all models',()=>{for(const rtl of [false,true])for(const model of ['negative','reverse','default'])for(const logical of [-50,0,23.75,100,1000])assert.equal(logicalOffset(physicalOffset(logical,100,rtl,model),100,rtl,model),Math.max(0,Math.min(100,logical)));});
test('empty is explicit, no dead rail focus or controls; single has no rail tab stop',()=>{
 const h=setup(),empty=h.mount(group(0));assert.equal(empty.querySelector('.iui-carousel-position').textContent,'No items');assert.equal(empty.querySelectorAll('button,[tabindex]').length,0);
 const single=h.mount(group(1));fakeRail(h,single);assert.equal(single.querySelectorAll('button,[tabindex]').length,0);h.dispose();
});
test('controls false preserves native overflow rail and DOM order without button interception',()=>{
 const h=setup(),out=h.mount({...group(),controls:false}),r=fakeRail(h,out);assert.equal(out.querySelectorAll('button').length,0);assert.equal(r.rail.tabIndex,0);assert.deepEqual(r.cards.map(x=>x.textContent),['Item 1','Item 2','Item 3','Item 4']);
 const event=new h.win.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});r.rail.dispatchEvent(event);assert.equal(event.defaultPrevented,false);assert.equal(r.calls.length,0);h.dispose();
});
test('resize removes only rail tab stop, never moves focus from disabled controls',()=>{const h=setup(),out=h.mount(group()),r=fakeRail(h,out),[,next]=buttons(out);next.focus();r.setWidth(2000);assert.equal(r.rail.hasAttribute('tabindex'),false);assert.equal(next.getAttribute('aria-disabled'),'true');assert.equal(h.doc.activeElement,next);next.click();assert.equal(r.calls.length,0);h.dispose();});
test('scroll refresh does not reconstruct children or input drafts',()=>{const h=setup();let rendered=0;h.c.render=n=>{rendered++;const input=h.doc.createElement('input');input.value=n.value;return input;};const out=h.mount(group()),r=fakeRail(h,out);r.cards[0].value='uncommitted -';r.cards[0].focus();r.scroll(70);h.resize();assert.equal(rendered,4);assert.equal(r.cards[0].value,'uncommitted -');assert.equal(h.doc.activeElement,r.cards[0]);assert.equal(r.logical,70);h.dispose();});
test('update/dispose remove owner resources and late callbacks are harmless',()=>{const h=setup(),out=h.mount(group()),r=fakeRail(h,out),late=[...h.observers][0].cb;assert.ok(h.metrics.listeners>0);r.rail.dispatchEvent(new h.win.Event('scroll'));assert.equal(h.frames.size,1);h.update([group(0)]);assert.equal(h.frames.size,0);assert.equal(h.metrics.listeners,0);assert.equal(h.metrics.disconnects,1);late();out.querySelector('button').click();assert.equal(h.frames.size,0);assert.equal(r.calls.length,0);h.dispose();h.dispose();});
test('foreign owner documents, IDs, local Chinese names and markup remain isolated',()=>{const a=setup(),b=setup({lang:'zh-CN',theme:'dark'});const first=a.mount(group()),second=b.mount({...group(),label:'<img src=x>'});assert.notEqual(first.querySelector('.iui-carousel').id,second.querySelector('.iui-carousel').id);assert.equal(second.querySelector('img'),null);assert.equal(second.querySelector('button').textContent,'上一组内容');for(const el of second.querySelectorAll('*'))assert.equal(el.ownerDocument,b.doc);a.dispose();assert.equal(second.isConnected,true);b.dispose();});
test('SVG children are ordinary render outputs without wrappers or reconstruction',()=>{const h=setup();h.c.render=()=>h.doc.createElementNS('http://www.w3.org/2000/svg','svg');const out=h.mount(group(2));const r=fakeRail(h,out);assert.equal(r.cards[0].namespaceURI,'http://www.w3.org/2000/svg');assert.equal(out.querySelectorAll('.iui-carousel > svg').length,2);h.resize();assert.equal(out.querySelector('svg'),r.cards[0]);h.dispose();});
test('font and visual viewport listeners belong to owner lifecycle',()=>{const h=setup();const fonts=new h.win.EventTarget(),viewport=new h.win.EventTarget();Object.defineProperty(h.doc,'fonts',{value:fonts,configurable:true});Object.defineProperty(h.win,'visualViewport',{value:viewport,configurable:true});const out=h.mount(group());fakeRail(h,out);fonts.dispatchEvent(new h.win.Event('loadingdone'));viewport.dispatchEvent(new h.win.Event('resize'));assert.equal(h.frames.size,1);h.flush();h.dispose();fonts.dispatchEvent(new h.win.Event('loadingdone'));viewport.dispatchEvent(new h.win.Event('resize'));assert.equal(h.frames.size,0);assert.equal(h.metrics.listeners,0);});
