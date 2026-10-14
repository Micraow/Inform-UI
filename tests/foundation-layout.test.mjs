import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import * as core from '../dist/v2/core-node.mjs';
import {createDefaultProfile} from '../dist/v2/node.mjs';
const source=await readFile('examples/v2/layered-work.openui','utf8');
// A stable expanded reference checks that authoring with nested @Each changes no rendered structure.
const expandedSource="root = Stack([Card([\n  Row([Box([Text(\"第 0 层\", \"muted\", \"start\", \"xs\")], {width: \"xs\"}), Box([Grid([Box([Text(\"8\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"})], 1, \"xs\", \"preserve\")], {width: \"grow\"}), Box([Text(\"1×8=8\", \"default\", \"end\", \"xs\")], {width: \"xs\"})], \"xs\", \"center\", {wrap: \"nowrap\"}),\n  Row([Box([Text(\"第 1 层\", \"muted\", \"start\", \"xs\")], {width: \"xs\"}), Box([Grid([Box([Text(\"4\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"4\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"})], 2, \"xs\", \"preserve\")], {width: \"grow\"}), Box([Text(\"2×4=8\", \"default\", \"end\", \"xs\")], {width: \"xs\"})], \"xs\", \"center\", {wrap: \"nowrap\"}),\n  Row([Box([Text(\"第 2 层\", \"muted\", \"start\", \"xs\")], {width: \"xs\"}), Box([Grid([Box([Text(\"2\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"2\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"2\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"2\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"info\", radius: \"sm\", minHeight: \"sm\"})], 4, \"xs\", \"preserve\")], {width: \"grow\"}), Box([Text(\"4×2=8\", \"default\", \"end\", \"xs\")], {width: \"xs\"})], \"xs\", \"center\", {wrap: \"nowrap\"}),\n  Row([Box([Text(\"第 3 层\", \"muted\", \"start\", \"xs\")], {width: \"xs\"}), Box([Grid([Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"}), Box([Text(\"1\", \"default\", \"center\", \"xs\", \"medium\")], {background: \"surface\", radius: \"sm\", minHeight: \"sm\"})], 8, \"xs\", \"preserve\")], {width: \"grow\"}), Box([Text(\"8×1=8\", \"default\", \"end\", \"xs\")], {width: \"xs\"})], \"xs\", \"center\", {wrap: \"nowrap\"}),\n  Divider(),\n  Row([Text(\"4 层 × 每层 8 次工作量\", \"default\", \"start\", \"sm\", \"semibold\"), Text(\"32\", \"default\", \"end\", \"md\", \"semibold\")], \"sm\", \"center\", {wrap: \"nowrap\", justify: \"between\"}),\n  Text(\"示意：每项基本操作计为 1，包含规模为 1 的基本情况。\", \"muted\", \"start\", \"sm\")\n], \"归并排序：每层工作量\")])\n";
function mount(source){const dom=new JSDOM('<main></main>',{url:'https://example.test'});const errors=[];const app=core.mount(dom.window.document.querySelector('main'),{source,onError:e=>errors.push(...e)});return{dom,app,doc:dom.window.document,errors,close(){app.dispose();dom.window.close();}};}
test('layered work is a real foundation-only composition in core and full profiles',()=>{
 for(const profile of [core.createBaseProfile(),createDefaultProfile()]){
  assert.equal(profile.components.Box.layer,'layout');
  assert.equal(profile.manifest().components.find(c=>c.name==='Box').moduleId,'base/layout');
  const runtime=core.createRuntime(profile);const result=runtime.commit(source);assert.equal(result.ok,true,JSON.stringify(result.issues));runtime.dispose();
 }
 const h=mount(source);try{
  assert.deepEqual(h.errors,[]);assert.deepEqual([...h.doc.querySelectorAll('.if-grid')].map(e=>e.children.length),[1,2,4,8]);
  assert.equal(h.doc.querySelectorAll('.if-grid>.if-box').length,15);
  assert.ok(h.doc.querySelector('.if-card').textContent.includes('4 层 × 每层 8 次工作量32'));
  assert.equal(h.doc.querySelectorAll('canvas,svg,img,iframe,.if-domain-view').length,0);
  assert.deepEqual([...new Set([...h.doc.querySelectorAll('[data-component]')].map(e=>e.dataset.component))].sort(),['Box','Card','Divider','Grid','Row','Stack','Text']);
 }finally{h.close();}
});
test('new layout and typography schemas match runtime, including boundaries and forbidden escape hatches',()=>{
 const p=core.createBaseProfile(),ajv=new Ajv2020({strict:false});ajv.removeKeyword('id');
 const cases={
  Text:[[{content:'x'},true],[{content:'x',align:'end',size:'xs',weight:'semibold'},true],[{content:'x',align:'left'},false],[{content:'x',size:'11px'},false],[{content:'x',weight:900},false],[{content:'x',style:'color:red'},false]],
  Grid:[...[0,1,6,7,8,9,1.5].map(columns=>[{children:[],columns},Number.isInteger(columns)&&columns>=1&&columns<=8]),[{children:[],responsive:'preserve'},true],[{children:[],responsive:'stack'},true],[{children:[],responsive:'clip'},false]],
  Row:[[{children:[]},true],[{children:[],options:{wrap:'nowrap',distribution:'equal',justify:'between'}},true],[{children:[],options:{wrap:false}},false],[{children:[],options:{style:'width:999px'}},false]],
  Box:[[{children:[]},true],[{children:[],options:{background:'info',padding:'xs',gap:'none',radius:'sm',width:'grow',minHeight:'lg'}},true],...['transparent','surface','info','success','warning','error'].map(background=>[{children:[],options:{background}},true]),...['auto','full','grow','xs','sm','md'].map(width=>[{children:[],options:{width}},true]),...[{background:'#fff'},{background:'url(https://example.test)'},{width:800},{padding:-1},{minHeight:'600px'},{radius:'50%'},{html:'<img src=x>'},{className:'escape'},{style:{color:'red'}}].map(options=>[{children:[],options},false])]
 };
 for(const [name,entries]of Object.entries(cases)){
  const validate=ajv.compile({$defs:p.schema.$defs,$ref:'#/$defs/'+name});
  for(const [props,expected]of entries){assert.equal(validate(props),expected,`${name} schema ${JSON.stringify(props)} ${JSON.stringify(validate.errors)}`);assert.equal(p.componentRules[name].validateProps(props).ok,expected,`${name} runtime ${JSON.stringify(props)}`);}
 }
 const prompt=p.prompt();for(const keyword of ['Box(children:','distribution','preserve','semibold'])assert.ok(prompt.includes(keyword),keyword);
});
test('old positional calls and omitted options keep default layout behavior',()=>{
 const h=mount('root=Stack([Text("Legacy","muted"),Row([Text("A")],"sm","center"),Grid([Text("B")],2,"md"),Card([Text("C")],"Title"),Box([Text("D")])])');try{
  assert.deepEqual(h.errors,[]);assert.equal(h.doc.querySelector('.if-row').dataset.wrap,'wrap');assert.equal(h.doc.querySelector('.if-row').dataset.distribution,'natural');assert.equal(h.doc.querySelector('.if-grid').dataset.responsive,'stack');assert.equal(h.doc.querySelector('.if-text').dataset.align,'inherit');assert.equal(h.doc.querySelector('.if-box').style.getPropertyValue('--if-padding'),'0px');
 }finally{h.close();}
});
test('options update in place, reset omitted tokens and preserve nested local edits',()=>{
 const h=mount('$active=true\n$draft=""\nroot=Stack([Box([Row([Input("Draft",$draft),Text($draft,"default",$active?"center":"start",$active?"sm":"md",$active?"semibold":"regular")],"xs","stretch",$active?{wrap:"nowrap",distribution:"equal",justify:"between"}:{}),Grid([Text("A"),Text("B")],8,"none",$active?"preserve":"stack")],$active?{background:"info",padding:"sm",gap:"xs",width:"grow",radius:"lg",minHeight:"lg"}:{}),Button("Toggle",@Set($active,!$active))])');try{
  assert.deepEqual(h.errors,[]);const box=h.doc.querySelector('.if-box'),row=h.doc.querySelector('.if-row'),grid=h.doc.querySelector('.if-grid'),input=h.doc.querySelector('input');input.focus();input.value='kept';input.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));assert.equal(h.doc.querySelector('.if-box'),box);assert.equal(h.doc.querySelector('input'),input);assert.equal(h.doc.activeElement,input);
  h.doc.querySelector('button').click();assert.equal(h.doc.querySelector('.if-box'),box);assert.equal(box.dataset.background,'transparent');assert.equal(box.dataset.width,'auto');assert.equal(box.dataset.radius,'none');assert.equal(box.dataset.minHeight,'none');assert.equal(box.style.getPropertyValue('--if-padding'),'0px');assert.equal(row.dataset.wrap,'wrap');assert.equal(row.dataset.distribution,'natural');assert.equal(row.style.justifyContent,'flex-start');assert.equal(grid.dataset.responsive,'stack');assert.equal(input.value,'kept');
  h.doc.querySelector('button').click();assert.equal(box.dataset.background,'info');assert.equal(grid.dataset.responsive,'preserve');assert.equal(row.querySelector('.if-text').dataset.align,'center');assert.deepEqual(h.errors,[]);
  h.app.preview('root=Stack([Box([Text(');assert.equal(h.app.element.dataset.phase,'preview');assert.equal(h.doc.querySelectorAll('input,button').length,0);assert.equal(h.app.commit(source).ok,true);assert.equal(h.app.element.dataset.phase,'ready');
 }finally{h.close();}
});

test('original array, step, comparison and thumbnail compositions run without a domain renderer',async()=>{
 for(const file of ['array-overview','array-steps','vertical-steps','document-comparison']){
  const source=await readFile(`examples/v2/${file}.openui`,'utf8'),h=mount(source);try{
   assert.deepEqual(h.errors,[],file);assert.equal(h.app.element.dataset.phase,'ready',file);assert.equal(h.doc.querySelectorAll('img,svg,canvas,iframe').length,0,file);
   if(file==='array-steps'){
    const [previous,next]=h.doc.querySelectorAll('button');assert.equal(previous.disabled,true);
    for(let step=1;step<=4;step++){next.click();assert.equal(h.app.getSnapshot().state.$step,step);assert.ok(h.doc.body.textContent.includes(`Step ${step+1} / 5`));}
    assert.equal(next.disabled,true);next.click();assert.equal(h.app.getSnapshot().state.$step,4);
    for(let step=3;step>=0;step--){previous.click();assert.equal(h.app.getSnapshot().state.$step,step);}
    assert.equal(previous.disabled,true);assert.equal(next.disabled,false);
   }
  }finally{h.close();}
 }
});

test('nested Each authoring is shorter while producing the exact expanded component tree',()=>{
 const p=core.createBaseProfile(),a=core.createRuntime(p),b=core.createRuntime(p);try{
  assert.equal(a.commit(source).ok,true);assert.equal(b.commit(expandedSource).ok,true);assert.deepEqual(a.getSnapshot().tree,b.getSnapshot().tree);
  const count=s=>(s.match(/\b(?:Box|Text|Row|Grid|Card|Stack|Divider)\(/g)||[]).length;
  assert.equal(expandedSource.length,2806);assert.equal(count(expandedSource),65);assert.ok(source.length<1400);assert.equal(count(source),16);
 }finally{a.dispose();b.dispose();}
});
