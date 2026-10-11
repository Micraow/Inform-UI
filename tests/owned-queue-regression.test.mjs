import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{pathToFileURL}from'node:url';import{JSDOM}from'jsdom';
const{mount}=await import(process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME):new URL('../dist/browser.js',import.meta.url));
const fixture=JSON.parse(await readFile(new URL('../examples/fee-interest.json',import.meta.url),'utf8'));
for(const operation of ['update','dispose'])test(`queued Fee logo ${operation} compensates late source without leaking retirement`,()=>{
 const dom=new JSDOM('<main></main>'),doc=dom.window.document,host=doc.querySelector('main'),input=structuredClone(fixture),node=input.body.find(n=>n.type==='ledger-fee-interest-paid');for(const range of node.ranges)for(const row of range.transactions)delete row.logoUrl;node.ranges[0].transactions[0].logoUrl='https://example.org/queued-logo.png';
 const pending=[],nativeQueue=globalThis.queueMicrotask,descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLImageElement.prototype,'src');let controller,once=false,old;
 try{globalThis.queueMicrotask=fn=>pending.push(fn);controller=mount(host,input,{styles:false});globalThis.queueMicrotask=nativeQueue;old=host.querySelector('img');assert.ok(old);assert.ok(pending.length>0);
  Object.defineProperty(old,'src',{configurable:true,get(){return descriptor.get.call(this);},set(value){if(!once){once=true;if(operation==='update')controller.update({version:'iui/1',body:[{type:'text',value:'Newest owner'}]});else controller.dispose();}descriptor.set.call(this,value);}});
  for(const callback of pending)assert.doesNotThrow(callback);assert.equal(once,true);assert.equal(old.hasAttribute('src'),false);assert.equal(host.textContent,operation==='update'?'Newest owner':'');
 }finally{globalThis.queueMicrotask=nativeQueue;controller?.dispose();dom.window.close();}
});
