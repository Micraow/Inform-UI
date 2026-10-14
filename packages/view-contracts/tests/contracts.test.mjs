import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL}from'node:url';
import {migrationMap,viewSpecs,viewExamples,createViewModules,createMigrationCoverage,validateDataSchema}from'../dist/index.mjs';
import{contractProfile,fixtures}from'../scripts/profile.mjs';
const parser=fs.existsSync('../parser-runtime/dist/index.js')?'../parser-runtime':'../inform-v2-parser';
const {createRuntime}=await import(pathToFileURL(path.resolve(parser,'dist/index.js')));
const profile=contractProfile();const copy=name=>structuredClone(viewExamples[name].props);
const valid=(name,props)=>profile.componentRules[name].validateProps(props);
function reject(name,props,code){const result=valid(name,props);assert.equal(result.ok,false,name+' must reject');if(code)assert.ok(result.issues.some(x=>x.code===code),JSON.stringify(result.issues));return result;}

test('all 219 old types have exactly one explicit destination and 194 independent strict data records',()=>{
 assert.equal(migrationMap.entries.length,219);assert.equal(new Set(migrationMap.entries.map(x=>x.oldType)).size,219);assert.equal(viewSpecs.length,194);assert.equal(new Set(viewSpecs.map(x=>x.name)).size,194);
 assert.deepEqual(migrationMap.entries.reduce((a,x)=>(a[x.classification]=(a[x.classification]??0)+1,a),{}),{base:24,view:173,refusal:1,host:21});
 for(const spec of viewSpecs){assert.equal(profile.schema.$defs[spec.name].additionalProperties,false);assert.equal(profile.schema.$defs[spec.dataName].additionalProperties,false);assert.equal(profile.data[spec.dataName].name,spec.dataName);assert.equal(profile.components[spec.dataName],undefined);}
});
test('coverage never treats schema fixtures, source dispatcher cases, or planned composition as migration completion',()=>{
 const c=createMigrationCoverage();assert.equal(c.actualAdapterBound,0);assert.equal(c.publicBaseComposed,0);assert.equal(c.browserVerified,0);assert.equal(c.entries.filter(x=>x.oldRendererPresent).length,218);
 const e=createMigrationCoverage({AgendaView:{actualAdapterBound:true,sources:['verified-test']}});assert.equal(e.actualAdapterBound,1);assert.equal(e.publicBaseComposed,0);
 assert.throws(()=>fixtures.AgendaView.create(),/not a renderer/);
});
test('all 194 supplied examples pass full schema, pure domain semantics, and new DSL runtime commit',()=>{
 for(const spec of viewSpecs){const runtime=createRuntime(profile);try{const result=runtime.commit(viewExamples[spec.name].source);assert.equal(result.ok,true,spec.name+': '+JSON.stringify(result));assert.equal(runtime.getSnapshot().tree.typeName,'Stack');}finally{runtime.dispose();}}
});
test('contracts retain explicit bounded slots and only adapters with a proven binding protocol expose bindings',()=>{
 for(const s of viewSpecs){assert.deepEqual(profile.componentRules[s.name].bindingProps,s.bindings.map(x=>x.prop));assert.deepEqual(profile.componentRules[s.name].actionProps,s.actions.map(x=>x.prop));}
 assert.deepEqual(viewSpecs.filter(s=>s.bindings.length).map(s=>s.name),['RatingView','SegmentedView']);
 assert.deepEqual(profile.componentRules.TabGroupView.slots.children.accepts,['TabPanelView']);
 assert.equal(profile.componentRules.FormView.actionProps[0],'onSubmit');assert.equal(profile.componentRules.PressableView.actionProps[0],'onPress');
});
test('unknown props, legacy envelope, old references and old executable action descriptors fail closed',()=>{
 reject('AgendaView',{...copy('AgendaView'),type:'agenda'},'unknown-prop');
 const p=copy('AgendaView');p.data.type='agenda';reject('AgendaView',p,'schema');
 const metric=copy('MetricView');metric.data.value={$:'balance'};reject('MetricView',metric,'schema');metric.data.value={op:'add',args:[1,2]};reject('MetricView',metric,'schema');
 reject('PressableView',{...copy('PressableView'),onPress:{kind:'set',bind:'x',value:1}},'action-not-authorized');
 const checklist=copy('ChecklistView');checklist.data.items[0].bind='legacyState';reject('ChecklistView',checklist,'schema');
});
test('conditional resolved/pending data variants and nested unknown keys remain strict',()=>{
 assert.ok(profile.schema.$defs.AskUserFilesData.if);assert.ok(profile.schema.$defs.AskUserFilesData.else.required.includes('kind'));assert.ok(profile.schema.$defs.RecommendationCardData.oneOf);
 const p=copy('AskUserFilesView');p.data={label:'Files',status:'resolved'};reject('AskUserFilesView',p,'schema');p.data={label:'Files',status:'pending'};assert.equal(valid('AskUserFilesView',p).ok,true);
 const r=copy('RecommendationCardView');r.data={label:'Recommendation',status:'resolved',canOpenConversation:true,data:{conversationId:'c',title:'T',description:'D',arbitrary:'x'}};reject('RecommendationCardView',r,'schema');
});
test('binding transactions revalidate domain ranges and preserve the prior committed state on failure',()=>{
 const runtime=createRuntime(profile);assert.equal(runtime.commit(viewExamples.RatingView.source).ok,true);const snapshot=runtime.getSnapshot(),node=snapshot.tree.props.children[0],max=node.props.data.max??5;
 const ok=runtime.setBinding(node.bindings.value,Math.min(1,max));assert.equal(ok.ok,true);
 const before=runtime.getSnapshot();const next=before.tree.props.children[0];const bad=runtime.setBinding(next.bindings.value,max+1);assert.equal(bad.ok,false);assert.deepEqual(runtime.getSnapshot(),before);runtime.dispose();
});
test('SVG policy rejects active attributes, unsafe paint URLs and infinite geometry',()=>{
 for(const attrs of [{onload:'alert(1)'},{href:'javascript:alert(1)'},{style:'background:url(x)'},{fill:'url(https://example.com/a.svg)'},{width:'1e999'}]){const p=copy('SvgView');p.data.shapes=[{tag:'rect',attrs}];reject('SvgView',p);}
 const p=copy('SvgView');p.data.viewBox='0 0 0 10';reject('SvgView',p,'SVG_VIEWBOX');
});
test('URL checks reject script, credential-bearing, relative, control-character, and SVG-data destinations',()=>{
 for(const url of ['javascript:alert(1)','https://user:pass@example.com/x','/relative','https://example.com/\nx','data:image/svg+xml,<svg/>']){const p=copy('CitationView');p.data.url=url;reject('CitationView',p,'UNSAFE_URL');}
});
test('domain semantic invariants survive the schema migration',()=>{
 const agenda=copy('AgendaView');agenda.data.events.push(structuredClone(agenda.data.events[0]));reject('AgendaView',agenda);
 const weather=copy('WeatherView');weather.data.location.timezone='Not/A_Timezone';reject('WeatherView',weather,'TIMEZONE');
 const topology=copy('TopologyView');topology.data.links[0].from='missing-node';reject('TopologyView',topology,'TOPOLOGY_ENDPOINT');
 const choices=copy('SegmentedView');choices.data.options.push(structuredClone(choices.data.options[0]));reject('SegmentedView',choices,'DUPLICATE_OPTION');
 const tabs=copy('TabGroupView');tabs.data.initialIndex=19;reject('TabGroupView',tabs,'TAB_SELECTION');
});
test('a foreign element cannot enter a restricted slot and data constructors cannot render',()=>{
 const tabs=copy('TabGroupView');tabs.children=[{type:'element',typeName:'Text',props:{content:'Wrong slot'},partial:false}];reject('TabGroupView',tabs,'invalid-child');
 assert.equal(profile.validateTree({type:'element',typeName:'AgendaData',props:{},partial:false}).ok,false);
});
test('prototype injection, cycles, getters, non-finite numbers and bounded validation all fail safely',()=>{
 let reads=0;const p=copy('MetricView');Object.defineProperty(p.data,'value',{enumerable:true,get(){reads++;return 1;}});reject('MetricView',p,'non-json');assert.equal(reads,0);
 const q=copy('MetricView');q.data.value=Infinity;reject('MetricView',q,'non-finite');
 const r=copy('AgendaView');r.data.constructor='x';reject('AgendaView',r);
 const cyc={};cyc.self=cyc;assert.ok(validateDataSchema({type:'object'},cyc).length);
 const budget={remaining:0,consume(){throw Error('Budget exhausted');}};assert.ok(validateDataSchema({type:'string'},'x',budget).length);
});
test('unknown View selections reject and missing adapters remain visibly unbound',()=>{
 assert.throws(()=>createViewModules({adapters:{},names:['NotAView']}),/Unknown/);
 const modules=createViewModules({adapters:{},names:['AgendaView']});assert.equal(modules[0].components[0].renderer.kind,'unbound');
 assert.equal(createViewModules({adapters:{},includeHost:false}).flatMap(x=>x.components).length,173);
});
test('gallery sources contain ordinary samples and a verified public video identifier',()=>{
 for(const e of Object.values(viewExamples))assert.doesNotMatch(e.source,/<script|onerror=|javascript:/i);
 assert.equal(viewExamples.YoutubeView.data.videoId,'DQacCB9tDaw');assert.match(viewExamples.YoutubeView.provenance,/https:\/\/www.youtube.com\/watch\?v=DQacCB9tDaw/);
 assert.doesNotMatch(viewExamples.HtmlViewView.data.html,/<script|onclick=/i);
});
