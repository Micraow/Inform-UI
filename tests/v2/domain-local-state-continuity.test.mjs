import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';

const source=path.resolve(process.env.INFORM_SOURCE??process.cwd());
const require=createRequire(path.join(source,'package.json'));
const {JSDOM}=require('jsdom');
const {build}=require('esbuild');
const {mount}=await import(process.env.INFORM_BUNDLE??path.join(source,'dist/v2/node.mjs'));
// Source-level contract probes are compiled in memory. INFORM_OVERLAY is only
// useful when validating an isolated patch without editing the checkout.
const overlay=process.env.INFORM_OVERLAY;
const files=new Set(['src/v2/host.ts','src/v2/foundation/types.ts','packages/domain-view-renderer/src/runtime.ts','packages/domain-view-renderer/src/types.ts']);
const built=await build({stdin:{contents:"export {mountProfile} from './src/v2/host.ts'; export {renderDomainView} from './packages/domain-view-renderer/src/runtime.ts';",resolveDir:source,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',minify:true,loader:{'.css':'text'},logLevel:'error',plugins:overlay?[{name:'isolated-retention-patch',setup(build){build.onLoad({filter:/\.ts$/},async args=>{const file=path.relative(source,args.path);if(files.has(file))return{contents:await readFile(path.join(overlay,file),'utf8'),loader:'ts',resolveDir:path.dirname(args.path)};});}}]:[]});
const {mountProfile,renderDomainView}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const checklist='ChecklistView({label:"Tasks",items:[{id:"one",label:"First"},{id:"two",label:"Second"}]})';
const staticSource='$draft=""\nroot=Stack(['+checklist+',Input("Draft",$draft)])';
function harness(code=staticSource,names=['ChecklistView']){
 const dom=new JSDOM('<main></main>',{pretendToBeVisual:true});const errors=[];
 const app=mount(dom.window.document.querySelector('main'),{source:code,select:['base/layout','base/text','base/controls','views/content'],viewNames:names,onError:issues=>errors.push(...issues)});
 assert.equal(app.element.dataset.phase,'ready',JSON.stringify(errors));
 return{dom,app,errors,type(value){const input=app.element.querySelector('input[type=text]');input.value=value;input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));},close(){app.dispose();dom.window.close();}};
}

test('Checklist local checks, filter and scroll survive repeated unrelated DSL writes',()=>{
 const h=harness();try{
  const view=h.app.element.querySelector('[data-component=ChecklistView]'),check=view.querySelector('input[type=checkbox]'),filter=view.querySelector('select'),list=view.querySelector('ul');
  check.click();filter.value='done';filter.dispatchEvent(new h.dom.window.Event('change'));list.scrollTop=37;view.scrollLeft=19;
  const input=h.app.element.querySelector('input[type=text]');input.focus();
  for(const value of ['a','ab','中文','']){h.type(value);assert.equal(h.app.element.querySelector('[data-component=ChecklistView]'),view);assert.equal(view.querySelector('input[type=checkbox]'),check);assert.equal(check.checked,true);assert.equal(filter.value,'done');assert.equal(list.scrollTop,37);assert.equal(view.scrollLeft,19);assert.equal(list.children[0].hidden,false);assert.equal(list.children[1].hidden,true);assert.equal(h.dom.window.document.activeElement,input);assert.equal(h.app.getSnapshot().state.$draft,value);}
  filter.value='all';filter.dispatchEvent(new h.dom.window.Event('change'));check.click();assert.equal(check.checked,false);assert.equal(list.children[0].dataset.complete,'false');assert.deepEqual(h.errors,[]);
 }finally{h.close();}
});

test('data-only TabbedSection preserves selection and keeps its local events alive',()=>{
 const code='$draft=""\nroot=Stack([TabbedSectionView({label:"Sections",tabs:[{id:"a",label:"A",title:"First",content:"one"},{id:"b",label:"B",title:"Second",content:"two"}]}),Input("Draft",$draft)])';
 const h=harness(code,['TabbedSectionView']);try{const view=h.app.element.querySelector('[data-component=TabbedSectionView]'),tabs=[...view.querySelectorAll('[role=tab]')],panel=view.querySelector('[role=tabpanel]');tabs[1].click();assert.equal(tabs[1].getAttribute('aria-selected'),'true');panel.scrollTop=73;for(const value of ['one','two'])h.type(value);assert.equal(h.app.element.querySelector('[data-component=TabbedSectionView]'),view);assert.equal(tabs[1].getAttribute('aria-selected'),'true');assert.equal(panel.scrollTop,73);tabs[0].click();assert.equal(tabs[0].getAttribute('aria-selected'),'true');assert.match(panel.textContent,/First/);assert.deepEqual(h.errors,[]);}finally{h.close();}
});

test('changed evaluated View data replaces local state instead of preserving stale data',()=>{
 const code='$draft="Tasks"\nroot=Stack([ChecklistView({label:$draft,items:[{id:"one",label:"First"}]}),Input("Label",$draft)])';
 const h=harness(code);try{const old=h.app.element.querySelector('[data-component=ChecklistView]');old.querySelector('input[type=checkbox]').click();old.querySelector('select').value='done';h.type('Updated');const fresh=h.app.element.querySelector('[data-component=ChecklistView]');assert.notEqual(fresh,old);assert.equal(old.isConnected,false);assert.equal(fresh.querySelector('input[type=checkbox]').checked,false);assert.equal(fresh.querySelector('select').value,'all');assert.match(fresh.textContent,/Updated/);old.querySelectorAll('button')[0].click();assert.equal(fresh.querySelector('input[type=checkbox]').checked,false);assert.deepEqual(h.errors,[]);}finally{h.close();}
});

for(const boundary of ['commit','preview'])test(boundary+' retires local DOM and stale controls before a fresh source',()=>{
 const h=harness();try{const old=h.app.element.querySelector('[data-component=ChecklistView]'),oldInput=h.app.element.querySelector('input[type=text]');old.querySelector('input[type=checkbox]').click();h.type('before');if(boundary==='preview'){h.app.preview('root=Stack([Text(');assert.equal(old.isConnected,false);assert.equal(h.app.element.querySelector('input'),null);}assert.equal(h.app.commit(staticSource).ok,true);const fresh=h.app.element.querySelector('[data-component=ChecklistView]');assert.notEqual(fresh,old);assert.equal(fresh.querySelector('input[type=checkbox]').checked,false);oldInput.value='stale';oldInput.dispatchEvent(new h.dom.window.Event('input'));old.querySelectorAll('button')[0].click();assert.equal(h.app.getSnapshot().state.$draft,'');assert.equal(fresh.querySelector('input[type=checkbox]').checked,false);assert.deepEqual(h.errors,[]);}finally{h.close();}
});

test('rejected source commits leave retained local interaction state active',()=>{const h=harness();try{const view=h.app.element.querySelector('[data-component=ChecklistView]'),check=view.querySelector('input[type=checkbox]');check.click();assert.equal(h.app.commit('root=Unknown()').ok,false);h.type('still active');assert.equal(h.app.element.querySelector('[data-component=ChecklistView]'),view);assert.equal(check.checked,true);check.click();assert.equal(check.checked,false);}finally{h.close();}});

test('bound domain Views explicitly update current opaque bindings without unchanged-retention bypass',()=>{
 const code='$draft=""\n$rating=0\nroot=Stack([RatingView({label:"Score"},$rating),Input("Draft",$draft)])';
 const h=harness(code,['RatingView']);try{const old=h.app.element.querySelector('[data-component=RatingView]'),oldBinding=h.app.getSnapshot().tree.props.children[0].bindings.value,oldRadio=old.querySelector('input');h.type('new revision');const fresh=h.app.element.querySelector('[data-component=RatingView]');assert.equal(fresh,old);assert.equal(fresh.querySelector('input'),oldRadio);assert.equal(h.app.runtime.setBinding(oldBinding,5).ok,false);oldRadio.checked=true;oldRadio.dispatchEvent(new h.dom.window.Event('change'));assert.equal(h.app.getSnapshot().state.$rating,1);const radio=fresh.querySelectorAll('input')[2];radio.checked=true;radio.dispatchEvent(new h.dom.window.Event('change'));assert.equal(h.app.getSnapshot().state.$rating,3);assert.deepEqual(h.errors,[]);}finally{h.close();}
});

test('slotted action Views reconcile and never reuse stale opaque actions',async()=>{
 const code='$draft=""\n$count=0\nroot=Stack([PressableView({label:"Act"},[Text("Body")],@Set($count,$count+1)),Input("Draft",$draft)])';
 const h=harness(code,['PressableView']);try{
  const old=h.app.element.querySelector('[data-component=PressableView]'),oldAction=h.app.getSnapshot().tree.props.children[0].props.onPress;
  old.dispatchEvent(new h.dom.window.CustomEvent('inform:view-press',{bubbles:true,cancelable:true}));h.type('x');await Promise.resolve();assert.equal(h.app.getSnapshot().state.$count,0);
  const fresh=h.app.element.querySelector('[data-component=PressableView]');assert.notEqual(fresh,old);assert.equal(h.app.runtime.dispatchLocal(oldAction).ok,false);
  fresh.dispatchEvent(new h.dom.window.CustomEvent('inform:view-press',{bubbles:true,cancelable:true}));await Promise.resolve();assert.equal(h.app.getSnapshot().state.$count,1);
  const latest=h.app.getSnapshot().tree.props.children[0].props.onPress;h.app.preview('root=Stack([Text(');assert.equal(h.app.commit(code).ok,true);assert.equal(h.app.runtime.dispatchLocal(latest).ok,false);old.dispatchEvent(new h.dom.window.CustomEvent('inform:view-press',{bubbles:true}));await Promise.resolve();assert.equal(h.app.getSnapshot().state.$count,0);assert.deepEqual(h.errors,[]);
 }finally{h.close();}
});

for(const declaration of [{slots:{children:{min:0,max:1,accepts:'all'}}},{bindings:[{prop:'value'}]},{bindingProps:['value']},{actionProps:['onPress']}])test('descriptor capabilities cannot opt into unchanged retention: '+JSON.stringify(declaration),()=>{
 const dom=new JSDOM('<main></main>');const view=renderDomainView({name:'ExampleView',oldType:'checklist',...declaration},{data:{label:'Example',items:[]}},{document:dom.window.document,budget:{consume(){}},renderChild(){return{element:dom.window.document.createElement('i'),dispose(){}};}},{});try{assert.equal(view.retainUnchanged,undefined);}finally{view.dispose();dom.window.close();}
});

test('retention predicate rejects data changes and is inert after disposal or abort',()=>{
 for(const retirement of ['dispose','abort']){const dom=new JSDOM('<main></main>'),controller=new dom.window.AbortController(),props={data:{label:'Example',items:[]}};const view=renderDomainView({name:'AnyLocalView',oldType:'checklist'},props,{document:dom.window.document,signal:controller.signal,budget:{consume(){}},renderChild(){return{element:dom.window.document.createElement('i'),dispose(){}};}},{});assert.equal(view.retainUnchanged(structuredClone(props)),true);assert.equal(view.retainUnchanged({data:{label:'Changed',items:[]}}),false);if(retirement==='dispose')view.dispose();else controller.abort();assert.equal(view.retainUnchanged(props),false);view.dispose();dom.window.close();}
});

function hostHarness({binding=false,child=false,update=false}={}){
 const dom=new JSDOM('<main></main>');let listener,version=0,creates=0,disposes=0,actions=0,updates=0;const contexts=[],owned=[];
 const node=()=>({type:'element',typeName:'Local',props:{value:'unchanged'},partial:false,...binding?{bindings:{value:{kind:'inform-binding',name:'$same',id:'binding-'+version}}}:{}});
 const runtime={commit(){version++;listener({tree:node(),revision:version});return{ok:true};},preview(){return{};},getSnapshot(){return{};},setBinding(){return{ok:true};},dispatchLocal(){actions++;return{ok:true};},subscribe(fn){listener=fn;return()=>{};},dispose(){}};
 const adapter={kind:'dom',create(_props,context){creates++;contexts.push(context);const element=dom.window.document.createElement('button');owned.push(element);if(child)element.append(context.renderChild({type:'element',typeName:'Child',props:{},partial:false}).element);return{element,retainUnchanged:()=>true,...update?{update(){updates++;}}:{},dispose(){disposes++;}};}};
 const profile={components:{Local:{renderer:adapter},Child:{renderer:{kind:'dom',create(_p,context){return{element:context.document.createElement('span'),dispose(){}};}}}}};
 const app=mountProfile(dom.window.document.querySelector('main'),profile,runtime,{source:'initial'});
 return{dom,app,contexts,owned,emit(){version++;listener({tree:node(),revision:version});},get creates(){return creates;},get disposes(){return disposes;},get actions(){return actions;},get updates(){return updates;},close(){app.dispose();dom.window.close();}};
}

test('host retention refreshes its live revision even when DOM and props are unchanged',()=>{const h=hostHarness();try{h.emit();h.emit();assert.equal(h.creates,1);assert.equal(h.disposes,0);assert.equal(h.contexts[0].dispatchLocal({}).ok,true);assert.equal(h.actions,1);h.app.dispose();assert.equal(h.disposes,1);assert.equal(h.contexts[0].dispatchLocal({}).ok,false);assert.equal(h.actions,1);}finally{h.close();}});
for(const guard of ['binding','child'])test('host refuses unchanged retention with actual '+guard+' records',()=>{const h=hostHarness({[guard]:true});try{h.emit();assert.equal(h.creates,2);assert.equal(h.disposes,1);assert.equal(h.contexts[0].dispatchLocal({}).ok,false);assert.equal(h.contexts[1].dispatchLocal({}).ok,true);}finally{h.close();}});
test('explicit update contract wins over retention and refreshes actual binding handles',()=>{const h=hostHarness({binding:true,update:true});try{const old=h.contexts[0].bindings.value;h.emit();assert.equal(h.creates,1);assert.equal(h.updates,1);assert.notEqual(h.contexts[0].bindings.value,old);assert.equal(h.contexts[0].bindings.value.name,old.name);assert.equal(h.contexts[0].bindings.value.id,'binding-2');}finally{h.close();}});
