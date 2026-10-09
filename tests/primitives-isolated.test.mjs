import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {renderPrimitive,primitiveEnglish,primitiveChinese,setup,icons,states} from './primitive-harness.mjs';

test('flow uses each original child once, in author order, with finite default layout data', () => {
  const h=setup(), children=[{type:'icon',name:'info'},{type:'text',value:'First'},{type:'input',label:'Draft',bind:'text'},{type:'button',label:'Continue'}];
  const flow=h.mount({type:'flow',children});
  assert.deepEqual([...flow.children].map(n=>n.dataset.iui),children.map(n=>n.type));
  children.forEach(child=>assert.equal(h.metrics.children.filter(n=>n===child).length,1));
  assert.equal(flow.dataset.gap,'md');assert.equal(flow.dataset.align,'center');assert.equal(flow.dataset.justify,'start');
  assert.equal(flow.children.length,4);assert.equal(flow.getAttribute('role'),null);assert.equal(flow.getAttribute('tabindex'),null);h.dispose();
});
test('flow presents all option combinations without inline style injection or wrappers', () => {
  const h=setup();
  for(const gap of ['none','sm','md','lg']) for(const align of ['start','center','end']) for(const justify of ['start','center','end','between']) {
    const flow=h.mount({type:'flow',gap,align,justify,children:[{type:'text',value:'unchanged'}]});
    assert.deepEqual([flow.dataset.gap,flow.dataset.align,flow.dataset.justify],[gap,align,justify]);
    assert.equal(flow.firstElementChild.tagName,'P');assert.equal(flow.getAttribute('style'),null);
  }h.dispose();
});
test('fifty flow children keep identities, input focus and selection across unrelated state refresh', () => {
  const h=setup(),children=[{type:'input',label:'Draft',bind:'text'},...Array.from({length:49},(_,i)=>({type:'text',value:`Item ${i}`}))];
  const flow=h.mount({type:'flow',children}),before=[...flow.children],input=before[0];input.focus();input.setSelectionRange(1,3);
  h.setState({other:9});assert.deepEqual([...flow.children],before);assert.equal(h.doc.activeElement,input);assert.equal(input.selectionStart,1);assert.equal(input.selectionEnd,3);h.dispose();
});
test('nested flow leaves disabled state and child value updates with child renderer', () => {
  const h=setup(),flow=h.mount({type:'flow',children:[{type:'flow',children:[{type:'input',label:'Locked',bind:'text',disabled:true},{type:'text',value:{$:'count'}}]}]});
  const input=flow.querySelector('input'),text=flow.querySelector('p');h.setState({count:4});
  assert.equal(input.disabled,true);assert.equal(text.textContent,'4');assert.equal(flow.querySelector('input'),input);h.dispose();
});
test('ten original finite glyphs are safe SVG geometry and are all distinct', () => {
  const h=setup(),shapes=[];
  for(const name of icons) {
    const icon=h.mount({type:'icon',name});shapes.push(icon.innerHTML);
    assert.equal(icon.namespaceURI,'http://www.w3.org/2000/svg');assert.equal(icon.ownerDocument,h.doc);
    assert.equal(icon.getAttribute('viewBox'),'0 0 24 24');assert.equal(icon.getAttribute('width'),'20');assert.equal(icon.getAttribute('height'),'20');
    assert.equal(icon.getAttribute('aria-hidden'),'true');assert.equal(icon.getAttribute('role'),null);assert.equal(icon.getAttribute('aria-label'),null);
    assert.equal(icon.getAttribute('focusable'),'false');assert.equal(icon.hasAttribute('tabindex'),false);
    assert.ok(icon.children.length>0);
    for(const shape of icon.children) {
      assert.ok(['path','circle','line','polyline'].includes(shape.localName));
      assert.equal(shape.namespaceURI,icon.namespaceURI);
      for(const attribute of shape.attributes) assert.ok(!/^(on|href|xlink:|style|id)/.test(attribute.name));
    }
  }
  assert.equal(new Set(shapes).size,10);assert.equal(h.root.querySelectorAll('use,image,script,foreignObject,title,[id]').length,0);h.dispose();
});
test('named glyphs have exactly the supplied accessible label without executing markup', () => {
  const h=setup(),label='<img src=x onerror=alert(1)> & "Text"',icon=h.mount({type:'icon',name:'warning',label});
  assert.equal(icon.getAttribute('role'),'img');assert.equal(icon.getAttribute('aria-label'),label);assert.equal(icon.hasAttribute('aria-hidden'),false);
  assert.equal(icon.querySelector('img'),null);assert.equal(icon.hasAttribute('tabindex'),false);h.dispose();
});
test('icon sizes and semantic tones stay finite declarative presentation', () => {
  const h=setup();for(const [size,pixels] of [['sm',16],['md',20],['lg',24]])for(const tone of ['default','muted','info','success','warning','danger']) {
    const icon=h.mount({type:'icon',name:'plus',size,tone});assert.equal(icon.getAttribute('width'),String(pixels));assert.equal(icon.getAttribute('height'),String(pixels));assert.equal(icon.dataset.tone,tone);assert.equal(icon.getAttribute('style'),null);
  }h.dispose();
});
test('unrecognized or inherited icon names and unknown primitive nodes fail closed', () => {
  const h=setup();for(const name of ['constructor','__proto__','toString','download','https://example.invalid/icon.svg'])assert.throws(()=>renderPrimitive(h.context,{type:'icon',name},h.labels),/Unsupported primitive icon/);
  assert.throws(()=>renderPrimitive(h.context,{type:'html',value:'injected'},h.labels),/Unsupported primitive node/);h.dispose();
});
test('pulse states show caller label and localized text, never color alone or a live region', () => {
  for(const [lang,labels]of [['en',primitiveEnglish],['zh-CN',primitiveChinese]]) {
    const h=setup({lang});for(const status of states) {
      const pulse=h.mount({type:'pulse-indicator',label:'Local example',status});
      assert.equal(pulse.textContent,`Local example ${labels[status]}`);assert.equal(pulse.dataset.status,status);assert.equal(pulse.dataset.animate,'true');
      assert.equal(pulse.querySelector('.iui-pulse-dot').getAttribute('aria-hidden'),'true');
      assert.equal(pulse.querySelectorAll('[role],[aria-live],[aria-busy],[tabindex]').length,0);assert.equal(pulse.getAttribute('role'),null);
    }h.dispose();
  }
});
test('pulse state is explicit, animate false is retained and setState cannot implicitly change it', () => {
  const h=setup(),pulse=h.mount({type:'pulse-indicator',label:'Local example',status:'busy',animate:false});
  h.setState({other:100});assert.equal(pulse.dataset.status,'busy');assert.equal(pulse.dataset.animate,'false');assert.equal(pulse.textContent,'Local example Busy');
  h.update([{type:'pulse-indicator',label:'Local example',status:'success'}]);assert.equal(h.root.firstElementChild.textContent,'Local example Success');assert.equal(pulse.isConnected,false);h.dispose();
});
test('primitive construction installs no bindings, listeners, cleanups, global styles or IDs', () => {
  const h=setup(),bodyStyle=h.doc.body.getAttribute('style');
  for(const node of [{type:'icon',name:'clock',label:'Clock symbol'},{type:'pulse-indicator',label:'Supplied',status:'idle'}])renderPrimitive(h.context,node,h.labels);
  assert.deepEqual([h.metrics.bindings,h.metrics.listeners,h.metrics.cleanups],[0,0,0]);assert.equal(h.doc.querySelectorAll('style').length,0);assert.equal(h.doc.body.getAttribute('style'),bodyStyle);h.dispose();
});
test('same document and foreign ownerDocument hosts keep independent language, theme, and caller IDs', () => {
  const a=setup({lang:'en',theme:'light'}),b=setup({dom:a.dom,lang:'zh-Hant',theme:'dark'}),foreign=setup({lang:'zh-CN',theme:'light'});
  for(const h of [a,b,foreign])h.mount({type:'flow',id:'same',children:[{type:'icon',id:'icon',name:'info',label:'Info'},{type:'pulse-indicator',id:'status',label:'Local',status:'busy'}]});
  assert.match(a.root.textContent,/Busy/);assert.match(b.root.textContent,/忙碌/);assert.match(foreign.root.textContent,/忙碌/);
  assert.equal(a.root.dataset.theme,'light');assert.equal(b.root.dataset.theme,'dark');
  const ids=[...a.doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
  for(const h of [a,b,foreign])for(const child of h.root.querySelectorAll('*'))assert.equal(child.ownerDocument,h.doc);
  a.dispose();assert.equal(b.root.isConnected,true);b.dispose();foreign.dispose();
});
test('safe labels, Unicode, mixed-direction text and long strings stay plain text', () => {
  const h=setup(),payload='<script>alert(1)</script> مرحبا 中文 👩‍🔬 '+ 'long'.repeat(30);
  const flow=h.mount({type:'flow',children:[{type:'text',value:payload},{type:'pulse-indicator',label:payload,status:'warning'}]});
  assert.equal(flow.children[0].textContent,payload);assert.equal(flow.querySelector('.iui-pulse-label').textContent,payload);assert.equal(flow.querySelector('script'),null);h.dispose();
});
test('disposing delegates existing child handler cleanup without primitive residual resources', () => {
  const h=setup(),flow=h.mount({type:'flow',children:[{type:'button',label:'Count'},{type:'pulse-indicator',label:'Explicit',status:'busy'}]}),button=flow.querySelector('button');
  button.click();assert.equal(h.getState().count,1);h.dispose();button.click();assert.equal(h.getState().count,1);assert.equal(flow.isConnected,false);assert.throws(()=>h.setState({other:5}),/Disposed/);h.dispose();
});
test('English and Chinese status dictionaries are complete frozen presentation labels', () => {
  assert.deepEqual(Object.keys(primitiveEnglish).sort(),states.toSorted());assert.deepEqual(Object.keys(primitiveChinese).sort(),states.toSorted());
  assert.ok(Object.isFrozen(primitiveEnglish));assert.ok(Object.isFrozen(primitiveChinese));for(const label of Object.values(primitiveChinese))assert.match(label,/\p{Script=Han}/u);
});
test('CSS includes wrap, logical constraints, semantic palette and exact busy-only motion guard', async () => {
  const shared=await readFile(new URL('../src/renderer/style.css',import.meta.url),'utf8'),start=shared.indexOf('/* Original finite primitives.');assert.ok(start>=0);const tail=shared.slice(start),end=tail.indexOf('\n/* Original',1),css=end<0?tail:tail.slice(0,end);
  assert.ok(!css.includes('iui-source-sr')); // Do not inspect a later renderer module's unrelated screen-reader styles.
  assert.match(css,/flex-flow: row wrap/);assert.match(css,/overflow-wrap: anywhere/);assert.match(css,/max-inline-size: 100%/);
  assert.match(css,/\.iui-flow > :is\(\.iui-time, \.iui-weather, \.iui-finance, \.iui-converter, \.iui-thread\) \{ flex-basis: min\(20rem, 100%\)/);
  assert.ok(!/(?:position:\s*absolute|\border:|grid-auto-flow|url\(|@import)/.test(css));
  assert.match(css,/\[data-status=busy\]\[data-animate=true\].*animation:/);assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);assert.match(css,/animation: none; opacity: 1/);
  for(const token of ['ink','muted','info','success','warning','danger'])assert.ok(css.includes(`var(--iui-${token})`));
});
