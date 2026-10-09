import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('current browser examples share the exact locked runtime, stylesheet and SRI',async()=>{
  const lock=JSON.parse(await readFile('cdn-lock.json','utf8'));assert.match(lock.commit,/^[0-9a-f]{40}$/);
  for(const name of ['cdn-minimal','cdn-invalid','converters-preview','domains-preview','finance-preview','math-fonts','phase-one','current-components']) {
    const dom=new JSDOM(await readFile(`examples/browser/${name}.html`,'utf8'));
    try {
      const doc=dom.window.document,css=doc.querySelector('link[rel=stylesheet]'),js=doc.querySelector('script[src]');
      assert.equal(css.getAttribute('href'),lock.css,name);assert.equal(css.getAttribute('integrity'),lock.integrity['iui.css'].integrity,name);
      assert.equal(js.getAttribute('src'),lock.js,name);assert.equal(js.getAttribute('integrity'),lock.integrity['iui.global.min.js'].integrity,name);
      assert.equal(css.getAttribute('crossorigin'),'anonymous');assert.equal(js.getAttribute('crossorigin'),'anonymous');
      assert.equal(doc.querySelectorAll('script[src]').length,1,name);
      if(name==='current-components')assert.deepEqual(JSON.parse(doc.getElementById('spec').textContent),JSON.parse(await readFile('examples/current-components.json','utf8')));
    } finally {dom.window.close();}
  }
});
