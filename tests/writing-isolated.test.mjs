import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,node,tick,deferred,controls,enter} from './writing-harness.mjs';

test('synthetic Copy never reads clipboard or reports success; input and mount have no clipboard access',()=>{
 const h=setup();let reads=0;Object.defineProperty(h.win.navigator,'clipboard',{get(){reads++;throw Error('No startup access');},configurable:true});
 const root=h.mount(node()),u=controls(root);enter(h,root,'edited');u.copy.click();u.copy.dispatchEvent(new h.win.MouseEvent('click',{bubbles:true}));
 assert.equal(reads,0);assert.equal(u.status.textContent,'');h.dispose();
});
test('STUB captured handler: exact LF visible payload, single flight, native focus stays on Copy',async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred(),writes=[];
 h.clipboard(function(value){assert.equal(this,h.win.navigator.clipboard);writes.push(value);return d.promise;});
 u.copy.focus();h.activate(u.copy);h.activate(u.copy);u.copy.click();assert.deepEqual(writes,['Original\ntext 😀\nfinal']);assert.equal(u.copy.disabled,false);assert.equal(u.copy.getAttribute('aria-disabled'),'true');assert.equal(u.status.textContent,'Copying…');assert.equal(h.doc.activeElement,u.copy);
 d.resolve();await tick();assert.equal(u.status.textContent,'Current draft copied.');assert.equal(h.doc.activeElement,u.copy);assert.equal(u.copy.getAttribute('aria-disabled'),'false');h.activate(u.copy);await tick();assert.equal(writes.length,2);h.dispose();
});
for(const edit of ['input','revert'])test(`STUB captured handler: ${edit} during pending stays serialized and reports an earlier copied version`,async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred(),writes=[];enter(h,root,'snapshot');h.clipboard(v=>{writes.push(v);return d.promise;});h.activate(u.copy);
 if(edit==='input')enter(h,root,'new draft');else u.revert.click();h.activate(u.copy);assert.deepEqual(writes,['snapshot']);assert.equal(u.status.textContent,'Copying…');assert.equal(u.copy.getAttribute('aria-disabled'),'true');
 const focus=h.doc.activeElement;d.resolve();await tick();assert.equal(u.status.textContent,'An earlier version was copied. Your current draft has changed.');assert.equal(h.doc.activeElement,focus);h.dispose();
});
test('STUB captured handler: returning to exact snapshot before completion reports current text, later edits clear success',async()=>{
 const h=setup(),root=h.mount(node({value:'snapshot'})),u=controls(root),d=deferred();h.clipboard(()=>d.promise);h.activate(u.copy);enter(h,root,'temporary');u.revert.click();d.resolve();await tick();assert.equal(u.status.textContent,'Current draft copied.');enter(h,root,'after completion');assert.equal(u.status.textContent,'');h.dispose();
});
test('STUB captured handler: overlimit draft is preserved and blocked, including mutations without input, then recoverable',async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root);let writes=0;h.clipboard(()=>{writes++;return Promise.resolve();});
 for(const text of ['a'.repeat(12001),'😀'.repeat(12001)]){u.draft.value=text;h.activate(u.copy);assert.equal(writes,0);assert.equal(u.draft.value,text);assert.equal(u.draft.getAttribute('aria-invalid'),'true');assert.equal(u.copy.getAttribute('aria-disabled'),'true');assert.match(u.status.textContent,/exceeds/);}
 enter(h,root,'😀'.repeat(12000));h.activate(u.copy);await tick();assert.equal(writes,1);assert.equal(u.status.textContent,'Current draft copied.');h.dispose();
});
test('STUB captured handler: overlimit edit during pending does not lose draft or unblock Copy on completion',async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred();h.clipboard(()=>d.promise);h.activate(u.copy);enter(h,root,'x'.repeat(12001));d.resolve();await tick();assert.equal(u.draft.value.length,12001);assert.equal(u.copy.getAttribute('aria-disabled'),'true');assert.match(u.status.textContent,/earlier version/);u.revert.click();assert.equal(u.copy.getAttribute('aria-disabled'),'false');h.dispose();
});
for(const kind of ['insecure','missing','denied','throwing-clipboard-getter','throwing-method-getter','synchronous-throw'])test(`STUB captured handler: ${kind} is honest and retryable`,async()=>{
 const h=setup({lang:'zh'}),root=h.mount(node()),u=controls(root);
 if(kind==='insecure')Object.defineProperty(h.win,'isSecureContext',{value:false,configurable:true});
 if(kind==='denied')h.clipboard(()=>Promise.reject(Error('NotAllowedError')));
 if(kind==='synchronous-throw')h.clipboard(()=>{throw Error('Denied');});
 if(kind==='throwing-clipboard-getter')Object.defineProperty(h.win.navigator,'clipboard',{get(){throw Error('Denied');},configurable:true});
 if(kind==='throwing-method-getter')Object.defineProperty(h.win.navigator,'clipboard',{value:{get writeText(){throw Error('Denied');}},configurable:true});
 u.copy.focus();h.activate(u.copy);await tick();assert.equal(u.status.textContent,h.labels.failed);assert.equal(h.doc.activeElement,u.copy);assert.equal(u.copy.getAttribute('aria-disabled'),'false');
 Object.defineProperty(h.win,'isSecureContext',{value:true,configurable:true});let writes=0;h.clipboard(()=>{writes++;return Promise.resolve();});h.activate(u.copy);await tick();assert.equal(writes,1);assert.equal(u.status.textContent,h.labels.copied);h.dispose();
});
for(const action of ['update','dispose'])for(const finish of ['resolve','reject'])test(`STUB captured handler: pending ${action}/${finish} cannot mutate retired or replacement DOM`,async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred();let writes=0;h.clipboard(()=>{writes++;return d.promise;});const late=[u.copy,u.select,u.revert,u.draft].map(el=>h.handlers.get(el));h.activate(u.copy);
 const replacement=action==='update'?h.update(node({value:'replacement'})):(h.dispose(),null),before=root.outerHTML;for(const handler of late)handler({isTrusted:true});d[finish]();await tick();
 assert.equal(root.outerHTML,before);assert.equal(root.isConnected,false);assert.equal(writes,1);if(replacement)assert.equal(controls(replacement).status.textContent,'');h.dispose();assert.equal(h.handlers.size,0);
});
for(const access of ['secure','clipboard','method'])for(const action of ['update','dispose'])test(`STUB captured handler: reentrant ${access} getter ${action} aborts before writing`,async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root);let writes=0,replacement,before;
 const reenter=()=>{if(action==='update')replacement=h.update(node({value:'new'}));else h.dispose();before=root.outerHTML;};
 const clipboard={writeText(){writes++;return Promise.resolve();}};
 if(access==='secure'){h.clipboard(clipboard.writeText);Object.defineProperty(h.win,'isSecureContext',{get(){reenter();return true;},configurable:true});}
 if(access==='clipboard')Object.defineProperty(h.win.navigator,'clipboard',{get(){reenter();return clipboard;},configurable:true});
 if(access==='method')Object.defineProperty(h.win.navigator,'clipboard',{value:{get writeText(){reenter();return clipboard.writeText;}},configurable:true});
 h.activate(u.copy);await tick();assert.equal(writes,0);assert.equal(root.outerHTML,before);if(replacement)assert.equal(controls(replacement).status.textContent,'');h.dispose();
});
for(const action of ['update','dispose'])test(`STUB captured handler: writeText itself may reenter ${action}; issued write cannot be revoked`,async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred();let writes=0,before,replacement;
 h.clipboard(()=>{writes++;if(action==='update')replacement=h.update(node({value:'new'}));else h.dispose();before=root.outerHTML;return d.promise;});h.activate(u.copy);assert.equal(writes,1);d.resolve();await tick();assert.equal(root.outerHTML,before);if(replacement)assert.equal(controls(replacement).status.textContent,'');h.dispose();
});
for(const action of ['select','revert'])test(`explicit ${action} focus reentrancy never selects retired DOM`,()=>{
 const h=setup(),root=h.mount(node()),u=controls(root);enter(h,root,'a changed draft');let selection;
 u.draft.addEventListener('focus',()=>{h.update(node({value:'replacement'}));selection=[u.draft.selectionStart,u.draft.selectionEnd];});u[action].click();assert.deepEqual([u.draft.selectionStart,u.draft.selectionEnd],selection);assert.equal(h.doc.activeElement,h.doc.body);h.dispose();
});
test('STUB captured handler: detached root ignores settlement and disconnected activation',async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred();let writes=0;h.clipboard(()=>{writes++;return d.promise;});h.activate(u.copy);root.remove();const before=root.outerHTML;d.resolve();await tick();h.activate(u.copy);assert.equal(root.outerHTML,before);assert.equal(writes,1);h.dispose();
});
test('STUB captured handler: ownerDocument and sibling mounts have independent clipboard requests',async()=>{
 const a=setup(),b=setup({lang:'zh'}),one=a.mount(node({value:'A'})),two=a.mount(node({value:'B'})),three=b.mount(node({value:'C'})),da=deferred(),db=deferred(),writesA=[],writesB=[];
 a.clipboard(v=>{writesA.push(v);return da.promise;});b.clipboard(v=>{writesB.push(v);return db.promise;});for(const root of [one,two])a.activate(controls(root).copy);b.activate(controls(three).copy);assert.deepEqual(writesA,['A','B']);assert.deepEqual(writesB,['C']);assert.equal(controls(three).draft.ownerDocument,b.doc);da.resolve();await tick();assert.equal(controls(one).status.textContent,a.labels.copied);assert.equal(controls(three).status.textContent,b.labels.copying);a.dispose();db.resolve();await tick();assert.equal(controls(three).status.textContent,b.labels.copied);b.dispose();
});

test('STUB captured handler: an empty normalized draft is an exact valid copy payload',async()=>{
 const h=setup(),root=h.mount(node({value:''})),u=controls(root),writes=[];h.clipboard(v=>{writes.push(v);return Promise.resolve();});h.activate(u.copy);await tick();assert.deepEqual(writes,['']);assert.equal(u.status.textContent,'Current draft copied.');h.dispose();
});
test('STUB captured handler: rejecting an older snapshot after editing reports failure and keeps current text',async()=>{
 const h=setup(),root=h.mount(node()),u=controls(root),d=deferred();h.clipboard(()=>d.promise);h.activate(u.copy);enter(h,root,'current text');u.draft.focus();d.reject(Error('Denied'));await tick();assert.equal(u.status.textContent,h.labels.failed);assert.equal(u.draft.value,'current text');assert.equal(h.doc.activeElement,u.draft);h.dispose();
});

test('native disabled ancestors block every writing action and forged input before recovering',()=>{
 const h=setup(),root=h.mount(node()),s=controls(root);enter(h,root,'keep local draft');
 const fieldset=h.doc.createElement('fieldset');h.host.append(fieldset);fieldset.append(root);fieldset.disabled=true;let writes=0;h.clipboard(()=>{writes++;return Promise.resolve();});
 h.doc.body.tabIndex=-1;h.doc.body.focus();const before=root.outerHTML;
 for(const action of [s.select,s.revert,s.copy]){action.dispatchEvent(new h.win.MouseEvent('click',{bubbles:true}));h.activate(action);}
 assert.equal(s.draft.value,'keep local draft');assert.equal(writes,0);assert.equal(root.outerHTML,before);assert.equal(h.doc.activeElement,h.doc.body);
 s.draft.value='forged';s.draft.dispatchEvent(new h.win.Event('input',{bubbles:true}));assert.equal(s.draft.value,'keep local draft');assert.equal(root.outerHTML,before);
 fieldset.disabled=false;s.revert.click();assert.equal(s.draft.value,node().value.replace(/\r\n?/g,'\n'));h.dispose();
});
