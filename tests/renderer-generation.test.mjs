import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount,InvalidDocumentError} from '../dist/browser.js';
const spec = (label, x) => ({version:'iui/1',state:{x},body:[{type:'text',value:label}]});
function fixture() {
  const dom = new JSDOM('<!doctype html><div id="host"></div>', {url:'https://example.invalid/'});
  const document = dom.window.document;
  const host = document.getElementById('host');
  const controller = mount(host, spec('Initial', 0), {styles:false});
  return {dom,document,host,controller};
}

test('ordinary update replaces DOM and state atomically', () => {
  const f = fixture();
  try {
    f.controller.update(spec('Next', 1));
    assert.equal(f.host.querySelector('.iui-body').textContent, 'Next');
    assert.deepEqual(f.controller.getState(), {x:1});
  } finally {f.controller.dispose(); f.dom.window.close();}
});

for (const action of ['update','dispose']) {
  test(`element construction reentry ${action} prevents obsolete DOM publication`, () => {
    const f = fixture(); const original = f.document.createElement.bind(f.document);
    let armed = true;
    f.document.createElement = (...args) => {
      const result = original(...args);
      if (armed && args[0] === 'p') {
        armed = false;
        if (action === 'update') f.controller.update(spec('Newest', 2));
        else f.controller.dispose();
      }
      return result;
    };
    try {
      f.controller.update(spec('Obsolete', 1));
      assert.equal(armed, false, 'hook must actually execute');
      if (action === 'update') {
        assert.deepEqual(f.controller.getState(), {x:2});
        assert.equal(f.host.querySelectorAll('.iui-body').length, 1);
        assert.equal(f.host.querySelector('.iui-body').textContent, 'Newest');
      } else {
        assert.equal(f.host.childElementCount, 0);
        assert.throws(() => f.controller.getState(), /disposed/i);
      }
    } finally {f.document.createElement = original; f.controller.dispose(); f.dom.window.close();}
  });
}

test('cleanup callback update keeps newer DOM and state together', () => {
  const f = fixture();
  f.controller.update({version:'iui/1',state:{x:0},body:[{type:'button',label:'Old',action:{kind:'set',bind:'x',value:3}}]});
  const old = f.host.querySelector('button');
  const original = old.removeEventListener.bind(old);
  let armed = true;
  old.removeEventListener = (...args) => {
    original(...args);
    if (armed) {armed = false; f.controller.update(spec('Newest', 2));}
  };
  try {
    f.controller.update(spec('Obsolete', 1));
    assert.equal(armed, false, 'cleanup hook must execute');
    assert.deepEqual(f.controller.getState(), {x:2});
    assert.equal(f.host.querySelector('.iui-body').textContent, 'Newest');
  } finally {old.removeEventListener = original; f.controller.dispose(); f.dom.window.close();}
});

test('invalid nested update leaves the valid outer update live', () => {
  const f = fixture(); const original = f.document.createElement.bind(f.document);
  let armed = true;
  f.document.createElement = (...args) => {
    const result = original(...args);
    if (armed && args[0] === 'p') {
      armed = false;
      assert.throws(() => f.controller.update({version:'invalid',body:[]}), InvalidDocumentError);
    }
    return result;
  };
  try {
    f.controller.update(spec('Valid outer', 1));
    assert.equal(armed, false);
    assert.deepEqual(f.controller.getState(), {x:1});
    assert.equal(f.host.querySelector('.iui-body').textContent, 'Valid outer');
  } finally {f.document.createElement = original; f.controller.dispose(); f.dom.window.close();}
});

test('retired controls do not edit replacement state; disposal is idempotent', () => {
  const f = fixture();
  try {
    f.controller.update({version:'iui/1',state:{x:0},body:[{type:'button',label:'Old',action:{kind:'set',bind:'x',value:3}}]});
    const old = f.host.querySelector('button');
    f.controller.update(spec('Newest', 2)); old.click();
    assert.deepEqual(f.controller.getState(), {x:2});
    f.controller.dispose(); f.controller.dispose();
    assert.equal(f.host.childElementCount, 0);
    assert.throws(() => f.controller.getState(), /disposed/i);
  } finally {f.controller.dispose(); f.dom.window.close();}
});
