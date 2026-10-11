import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount} from '../dist/browser.js';

for(const operation of ['mount','update']) test(`${operation} construction error releases already-registered resources`,()=>{
  const dom=new JSDOM('<div id="host"></div>'),document=dom.window.document,host=document.getElementById('host');
  const controller=operation==='update'?mount(host,{version:'iui/1',body:[{type:'text',value:'Initial'}]},{styles:false}):undefined;
  const original=document.createElement.bind(document),active=new Set(),error=new Error('host construction failed');
  document.createElement=(...args)=>{
    if(args[0]==='p')throw error;
    const element=original(...args);
    if(args[0]==='button'){
      const add=element.addEventListener.bind(element),remove=element.removeEventListener.bind(element);
      element.addEventListener=(name,fn,...rest)=>{active.add(fn);return add(name,fn,...rest);};
      element.removeEventListener=(name,fn,...rest)=>{active.delete(fn);return remove(name,fn,...rest);};
    }
    return element;
  };
  const input={version:'iui/1',state:{x:0},body:[{type:'button',label:'Registered first',action:{kind:'set',bind:'x',value:1}},{type:'text',value:'Throw second'}]};
  try {
    assert.throws(()=>operation==='mount'?mount(host,input,{styles:false}):controller.update(input),x=>x===error);
    assert.equal(active.size,0,'no unreachable partial-generation listener remains after the error');
  } finally {document.createElement=original;controller?.dispose();dom.window.close();}
});

test('listener registration which adds then throws is compensated',()=>{
  const dom=new JSDOM('<div></div>'),document=dom.window.document,host=document.querySelector('div');
  const create=document.createElement.bind(document),active=new Set(),error=new Error('register then fail');
  document.createElement=(...args)=>{
    const element=create(...args);
    if(args[0]==='button'){
      const add=element.addEventListener.bind(element),remove=element.removeEventListener.bind(element);
      element.addEventListener=(name,fn,...rest)=>{add(name,fn,...rest);active.add(fn);throw error;};
      element.removeEventListener=(name,fn,...rest)=>{active.delete(fn);return remove(name,fn,...rest);};
    }
    return element;
  };
  try {
    assert.throws(()=>mount(host,{version:'iui/1',body:[{type:'button',label:'Reset',action:{kind:'reset'}}]},{styles:false}),x=>x===error);
    assert.equal(active.size,0);
  } finally {document.createElement=create;dom.window.close();}
});

test('an ordinary error after reentry does not retire the newer successful owner',()=>{
  const dom=new JSDOM('<div></div>'),host=dom.window.document.querySelector('div'),error=new Error('older factory failed');
  let armed=false,controller;
  const options={styles:false,get actions(){if(armed){armed=false;controller.update({version:'iui/1',state:{x:2},body:[{type:'text',value:'Newest'}]});throw error;}return {};}};
  controller=mount(host,{version:'iui/1',body:[{type:'text',value:'Initial'}]},options);
  try {
    armed=true;assert.throws(()=>controller.update({version:'iui/1',state:{x:1},body:[{type:'text',value:'Obsolete'}]}),x=>x===error);
    assert.deepEqual(controller.getState(),{x:2});assert.equal(host.querySelector('.iui-body').textContent,'Newest');
    controller.setState({x:3});assert.deepEqual(controller.getState(),{x:3});
  } finally {controller.dispose();dom.window.close();}
});
