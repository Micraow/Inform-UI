import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const source=path.resolve(process.env.INFORM_SOURCE??process.cwd());
const require=createRequire(path.join(source,'package.json'));
const {JSDOM}=require('jsdom');
const {mount,migrationMap}=await import(process.env.INFORM_BUNDLE??path.join(source,'dist/v2/node.mjs'));
const definitions={
 SegmentedView:{initial:'"a"',view:'SegmentedView({label:"Pick",options:[{label:"A",value:"a"},{label:"B",value:"b"},{label:"C",value:"c"}]},$pick)',values:['a','b','c']},
 RatingView:{initial:'1',view:'RatingView({label:"Rating"},$pick)',values:[1,2,3,4,5]}
};
function harness(name,view=definitions[name].view){
 const dom=new JSDOM('<main></main>',{pretendToBeVisual:true}),errors=[];
 dom.window.addEventListener('error',event=>errors.push({code:'UNCAUGHT',message:event.message}));
 const code='$pick='+definitions[name].initial+'\n$other=0\n$alternate='+definitions[name].initial+'\nroot=Stack(['+view+',Text("Other: "+$other),Button("Other",@Set($other,$other+1))])';
 const app=mount(dom.window.document.querySelector('main'),{source:code,select:['base/layout','base/text','base/controls','views/content'],viewNames:[name],onError:issues=>errors.push(...issues)});
 assert.equal(app.element.dataset.phase,'ready',JSON.stringify(errors));
 return{dom,app,code,errors,select(input){input.checked=true;input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));},other(){[...app.element.querySelectorAll('button')].find(b=>b.textContent==='Other').click();},close(){app.dispose();dom.window.close();}};
}
test('bound migration controls are the two actual catalog Views; editors and sliders are public bases',()=>{
 assert.deepEqual(migrationMap.entries.filter(x=>x.bindings.length).map(x=>x.name).sort(),['RatingView','SegmentedView']);
 for(const name of ['Input','Textarea','Slider'])assert.equal(migrationMap.entries.find(x=>x.name===name).classification,'base');
 for(const name of ['InputView','TextareaView','SliderView'])assert.equal(migrationMap.entries.some(x=>x.name===name),false);
});
for(const name of Object.keys(definitions)){
 test(name+' retains exact radios, focus, scroll and real current opaque bindings across writes',()=>{const h=harness(name);try{
  const owner=h.app.element.querySelector('[data-component='+name+']'),inputs=[...owner.querySelectorAll('input')];owner.scrollTop=27;
  for(let i=0;i<15;i++){
   const index=i%inputs.length,input=inputs[index],oldBinding=h.app.getSnapshot().tree.props.children[0].bindings.value;
   input.focus();h.select(input);
   assert.equal(h.app.element.querySelector('[data-component='+name+']'),owner);
   assert.deepEqual([...owner.querySelectorAll('input')],inputs);
   assert.equal(h.dom.window.document.activeElement,input);
   assert.equal(owner.scrollTop,27);
   assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[index]);
   assert.equal(h.app.runtime.setBinding(oldBinding,'stale').ok,false);
   assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[index]);
  }
  h.other();assert.deepEqual([...owner.querySelectorAll('input')],inputs);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});
 for(const boundary of ['commit','preview','dispose'])test(name+' '+boundary+' retires stale DOM events and opaque bindings',()=>{const h=harness(name);try{
  const owner=h.app.element.querySelector('[data-component='+name+']'),input=owner.querySelectorAll('input')[1],binding=h.app.getSnapshot().tree.props.children[0].bindings.value;
  if(boundary==='dispose')h.app.dispose();else{if(boundary==='preview')h.app.preview('root=Stack([');assert.equal(h.app.commit(h.code).ok,true);}
  assert.equal(input.isConnected,false);assert.equal(h.app.runtime.setBinding(binding,definitions[name].values[1]).ok,false);h.select(input);
  if(boundary!=='dispose'){assert.notEqual(h.app.element.querySelector('[data-component='+name+']'),owner);assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[0]);assert.deepEqual(h.errors,[]);}
 }finally{h.close();}});
 test(name+' changed binding identity retires prior controls instead of reusing old authority',()=>{const h=harness(name,'$other<1?'+definitions[name].view+':'+definitions[name].view.replace('$pick','$alternate'));try{
  const old=h.app.element.querySelectorAll('input')[1];h.other();const current=h.app.element.querySelectorAll('input')[1];assert.notEqual(current,old);h.select(old);assert.equal(h.app.getSnapshot().state.$alternate,definitions[name].values[0]);h.select(current);assert.equal(h.app.getSnapshot().state.$alternate,definitions[name].values[1]);assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[0]);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});
}
test('SegmentedView refreshes labels, option metadata, required, hint, error and disabled without replacing radios',()=>{const view='SegmentedView({label:"Pick "+$other,options:[{label:"A "+$other,value:"a"},{label:"B "+$other,value:"b",disabled:$other>0}],hint:$other>0?"Helpful":"",error:$other>0?"Problem":"",required:$other>0,disabled:$other>1},$pick)',h=harness('SegmentedView',view);try{
 const owner=h.app.element.querySelector('[data-component=SegmentedView]'),inputs=[...owner.querySelectorAll('input')],hint=owner.querySelector('.iui-field-hint');
 h.other();assert.deepEqual([...owner.querySelectorAll('input')],inputs);assert.match(owner.querySelector('legend').textContent,/Pick 1/);assert.equal(hint.hidden,false);assert.equal(hint.textContent,'Helpful');assert.equal(inputs[0].required,true);assert.equal(inputs[1].disabled,true);assert.equal(owner.querySelector('.iui-choice-text').textContent,'A 1');assert.equal(owner.querySelector('.iui-field-error').textContent,'Problem');assert.ok(inputs[0].getAttribute('aria-describedby').split(' ').includes(hint.id));
 h.select(inputs[1]);assert.equal(h.app.getSnapshot().state.$pick,'a');h.other();assert.equal(inputs[0].matches(':disabled'),true);assert.equal(owner.querySelector('.iui-field-error').hidden,true);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});
test('RatingView refreshes label, hint and disabled without replacing radios',()=>{const h=harness('RatingView','RatingView({label:"Rating "+$other,hint:$other>0?"Helpful":"",disabled:$other>0},$pick)');try{
 const owner=h.app.element.querySelector('[data-component=RatingView]'),inputs=[...owner.querySelectorAll('input')],hint=owner.querySelector('.iui-rating-hint');h.other();assert.deepEqual([...owner.querySelectorAll('input')],inputs);assert.equal(owner.querySelector('legend').textContent,'Rating 1');assert.equal(hint.hidden,false);assert.equal(hint.textContent,'Helpful');assert.ok(inputs[0].getAttribute('aria-describedby').split(' ').includes(hint.id));assert.equal(inputs[1].matches(':disabled'),true);h.select(inputs[1]);assert.equal(h.app.getSnapshot().state.$pick,1);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});
test('SegmentedView option value topology retires listeners and preserves current validated option values',()=>{const h=harness('SegmentedView','SegmentedView({label:"Pick",options:$other<1?[{label:"A",value:"a"},{label:"B",value:"b"}]:[{label:"A",value:"a"},{label:"C",value:"c"}]},$pick)');try{
 const owner=h.app.element.querySelector('[data-component=SegmentedView]'),old=owner.querySelectorAll('input')[1];h.other();const fresh=owner.querySelectorAll('input')[1];assert.notEqual(fresh,old);assert.equal(old.isConnected,false);h.select(old);assert.equal(h.app.getSnapshot().state.$pick,'a');h.select(fresh);assert.equal(h.app.getSnapshot().state.$pick,'c');assert.equal(owner.querySelectorAll('input')[1],fresh);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});
test('RatingView max and clearability topology retire old listeners',()=>{const h=harness('RatingView','RatingView({label:"Rating",max:$other<1?5:3,clearable:$other<1},$pick)');try{
 const owner=h.app.element.querySelector('[data-component=RatingView]'),old=owner.querySelectorAll('input')[4],clear=owner.querySelector('button');h.other();assert.equal(old.isConnected,false);assert.equal(clear.isConnected,false);assert.equal(owner.querySelectorAll('input').length,3);assert.equal(owner.querySelector('button'),null);h.select(old);clear.click();assert.equal(h.app.getSnapshot().state.$pick,1);const fresh=owner.querySelectorAll('input')[2];h.select(fresh);assert.equal(h.app.getSnapshot().state.$pick,3);assert.equal(owner.querySelectorAll('input')[2],fresh);assert.deepEqual(h.errors,[]);
 }finally{h.close();}});

const settle=async()=>{await Promise.resolve();await Promise.resolve();};
for(const name of ['SegmentedView'])test(name+' retained controls preserve containing FormView pending completion',async()=>{
 const dom=new JSDOM('<main></main>'),source='$pick='+definitions[name].initial+'\n$other=0\nroot=Stack([FormView({label:"Form"},['+definitions[name].view+'],@Set($other,$other+1))])',errors=[];
 const app=mount(dom.window.document.querySelector('main'),{source,select:['base/layout','base/text','base/controls','views/content'],viewNames:[name,'FormView'],onError:issues=>errors.push(...issues)});
 try{assert.equal(app.element.dataset.phase,'ready',JSON.stringify(errors));const form=app.element.querySelector('form'),inputs=[...form.querySelectorAll('input')];form.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.equal(app.getSnapshot().state.$other,1);assert.equal(form.dataset.status,'busy');assert.deepEqual([...form.querySelectorAll('input')],inputs);await settle();assert.equal(form.dataset.status,'success');assert.deepEqual(errors,[]);}finally{app.dispose();dom.window.close();}
});
test('real bound View contracts and runtime transactions work with dynamic code and network disabled',async()=>{
 const {spawnSync}=await import('node:child_process');
 const bundle=process.env.INFORM_BUNDLE??path.join(source,'dist/v2/node.mjs');
 const result=spawnSync(process.execPath,['--disallow-code-generation-from-strings','--input-type=module','-e',`
 import assert from 'node:assert/strict';
 let attempts=0;globalThis.Function=globalThis.eval=globalThis.fetch=()=>{attempts++;throw Error('Forbidden dynamic code or network')};
 const {createProfile,createRuntime}=await import(${JSON.stringify(bundle)});
 const profile=createProfile({select:['base/layout','base/controls','views/content'],viewNames:['RatingView','SegmentedView']});
 const runtime=createRuntime(profile);
 let result=runtime.commit('$rating=1\\n$choice="a"\\nroot=Stack([RatingView({label:"Rating"},$rating),SegmentedView({label:"Pick",options:[{label:"A",value:"a"},{label:"B",value:"b"}]},$choice)])');
 assert.equal(result.ok,true,JSON.stringify(result));
 for(let i=0;i<20;i++){const children=runtime.getSnapshot().tree.props.children;assert.equal(runtime.setBinding(children[0].bindings.value,i%5+1).ok,true);assert.equal(runtime.setBinding(runtime.getSnapshot().tree.props.children[1].bindings.value,i%2?'a':'b').ok,true);}
 assert.equal(attempts,0);runtime.dispose();
 `],{cwd:source,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
});

// Direct adapter lifecycle checks use ordinary value props, never fabricated
// opaque bindings. Real runtime-issued authority is exercised above.
const {readFile}=await import('node:fs/promises'),{build}=require('esbuild');
const changed=new Set(['packages/domain-view-renderer/src/runtime.ts','packages/domain-view-renderer/src/internal/renderer/forms.ts','packages/domain-view-renderer/src/internal/renderer/rating.ts']);
const fixture=await build({stdin:{contents:"export {renderDomainView} from './packages/domain-view-renderer/src/runtime.ts'; export {testGenerations} from './packages/domain-view-renderer/src/internal/renderer/generation.ts';",resolveDir:source,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',minify:true,loader:{'.css':'text'},logLevel:'error',plugins:[{name:'bound-lifecycle-fixture',setup(b){b.onLoad({filter:/\.ts$/},async args=>{const file=path.relative(source,args.path);if(file==='packages/domain-view-renderer/src/internal/renderer/generation.ts'){const original=await readFile(args.path,'utf8'),instrumented=original.replace('return {current, check, during, guard, own, acquire, listen, fork, dispose, get size() { return releases.size; }};','const result={current, check, during, guard, own, acquire, listen, fork, dispose, get size() { return releases.size; }}; testGenerations.push(result); return result;');assert.notEqual(instrumented,original);return{contents:instrumented+'\nexport const testGenerations: RenderGeneration[] = [];\n',loader:'ts',resolveDir:path.dirname(args.path)};}if(process.env.INFORM_OVERLAY&&changed.has(file))return{contents:await readFile(path.join(process.env.INFORM_OVERLAY,file),'utf8'),loader:'ts',resolveDir:path.dirname(args.path)};});}}]});
const {renderDomainView,testGenerations}=await import('data:text/javascript;base64,'+Buffer.from(fixture.outputFiles[0].text).toString('base64'));
function directHarness(name){
 const dom=new JSDOM('<main></main>'),document=dom.window.document,controller=new AbortController(),handles=[];let active=[],index=0;
 const descriptor=migrationMap.entries.find(x=>x.name===name),props={data:name==='SegmentedView'?{label:'Choices',options:[{value:'a',label:'A'},{value:'b',label:'B'}]}:{label:'Rating',max:5},value:definitions[name].values[0]};
 const external={document,signal:controller.signal,budget:{consume(){}},renderChild(node){const i=index++,previous=active[i];if(previous&&!previous.disposed)return previous;const element=document.createElement('span');element.dataset.icon=node.props.name;const handle={element,disposed:0,dispose(){if(this.disposed)return;this.disposed++;element.remove();}};handles.push(handle);active[i]=handle;return handle;}};
 const view=renderDomainView(descriptor,props,external,{});document.querySelector('main').append(view.element);
 return{dom,view,controller,props,handles,update(next){index=0;view.update(next);},close(){view.dispose();dom.window.close();}};
}
for(const name of Object.keys(definitions))test(name+' stable/structural updates bound cleanup registrations and abort retires them all',()=>{
 const start=testGenerations.length,h=directHarness(name),root=testGenerations[start];try{assert.equal(h.view.retainUnchanged,undefined);const initialSize=root.size,inputs=[...h.view.element.querySelectorAll('input')];
  for(let i=0;i<60;i++)h.update({...h.props,data:{...h.props.data,label:'Current '+i},value:definitions[name].values[i%2]});
  assert.equal(root.size,initialSize);assert.deepEqual([...h.view.element.querySelectorAll('input')],inputs);if(name==='RatingView')assert.equal(h.handles.length,5);
  const sizes=new Map();for(let i=0;i<40;i++){const data=name==='RatingView'?{...h.props.data,max:i%2?3:5}:{...h.props.data,options:i%2?[...h.props.data.options,{value:'c',label:'C'}]:h.props.data.options};h.update({...h.props,data});if(sizes.has(i%2))assert.equal(root.size,sizes.get(i%2));else sizes.set(i%2,root.size);assert.ok(root.size<=initialSize+1);}h.update(h.props);assert.equal(root.size,initialSize);
  const fresh=[...h.view.element.querySelectorAll('input')];h.controller.abort();assert.equal(h.view.element.isConnected,false);assert.equal(root.size,0);assert.ok(testGenerations.slice(start).every(x=>x.size===0));assert.ok(h.handles.every(x=>x.disposed===1));h.update(h.props);assert.deepEqual([...h.view.element.querySelectorAll('input')],fresh);
 }finally{h.close();}
});
test('SegmentedView retires a queued native reset on structural update and abort',async()=>{
 const h=directHarness('SegmentedView');try{const form=h.dom.window.document.createElement('form');h.view.element.replaceWith(form);form.append(h.view.element);h.update({...h.props,value:'b'});form.reset();h.update({...h.props,value:'b',data:{...h.props.data,options:[...h.props.data.options,{value:'c',label:'C'}]}});await new Promise(resolve=>h.dom.window.setTimeout(resolve,20));assert.equal(h.view.element.querySelectorAll('input')[1].checked,true);form.reset();h.controller.abort();await new Promise(resolve=>h.dom.window.setTimeout(resolve,20));assert.equal(h.view.element.isConnected,false);}finally{h.close();}
});
for(const [name,view]of [
 ['SegmentedView','SegmentedView({label:"Pick",options:$pick=="a"?[{label:"A",value:"a"},{label:"B",value:"b"}]:[{label:"A",value:"a"},{label:"B",value:"b"},{label:"C",value:"c"}]},$pick)'],
 ['RatingView','RatingView({label:"Rating",max:$pick<2?5:3},$pick)']
])test(name+' structural update during its own change retires the original event generation',()=>{const h=harness(name,view);try{const old=h.app.element.querySelectorAll('input')[1];h.select(old);const fresh=h.app.element.querySelectorAll('input')[1];assert.notEqual(fresh,old);assert.equal(old.isConnected,false);assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[1]);h.select(old);assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[1]);h.select(h.app.element.querySelectorAll('input')[0]);assert.equal(h.app.getSnapshot().state.$pick,definitions[name].values[0]);assert.deepEqual(h.errors,[]);}finally{h.close();}});
