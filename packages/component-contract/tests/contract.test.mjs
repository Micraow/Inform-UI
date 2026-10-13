import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { z } from 'zod/v4';
import { createCatalog, buildProfile, resources, createBudget, inspectData, barChartAdapter, textAdapter } from '../dist/index.mjs';

const names = ['Text','Heading','Badge','Divider','Alert','Table','Stack','Row','Grid','Card','Button','Input','Textarea','Select','RadioGroup','Checkbox','Switch','Slider','BarChart','WeatherCard','Icon','Image'];
// Registration-only fixtures. These do not count as renderer implementation coverage.
const fixtures = Object.fromEntries(names.map(name => [name, { kind: 'dom', key: name, create() { throw Error('Registration-only test fixture: do not render.'); } }]));
const catalog = () => createCatalog({ adapters: fixtures, iconNames: ['check', 'info'] });
const make = (select = ['base/layout','base/controls','base/charts','base/icon','base/media','domain/weather']) => buildProfile({ id: 'inform/test', root: 'Stack', modules: catalog(), resources, select });
const elem = (typeName, props) => ({ type: 'element', typeName, props, partial: false });
const expectIssue = (result, code) => { assert.equal(result.ok, false); assert.ok(result.issues.some(issue => issue.code === code), JSON.stringify(result)); };

test('one definition generates strict schema, positional signature, bindings and renderer metadata', () => {
  const profile = make();
  assert.deepEqual(Object.keys(profile.schema.$defs.Input.properties), ['label','value','placeholder','disabled']);
  assert.equal(profile.schema.$defs.Input.additionalProperties, false);
  assert.deepEqual(profile.componentRules.Input.bindingProps, ['value']);
  assert.deepEqual(profile.componentRules.Button.actionProps, ['onPress']);
  assert.match(profile.prompt(), /Input\(label: string, value: \$binding<string>/);
  assert.equal(profile.manifest().components.find(item => item.name === 'Input').renderer.key, 'Input');
});
test('schema and runtime dependency closures are separate and complete', () => {
  const p = make(['base/layout','domain/weather']);
  assert.deepEqual(p.modules, ['base/text','base/layout','domain/weather']);
  assert.deepEqual(p.runtimeResources, ['inform/safety-kernel','inform/tokens','inform/foundation','inform/weather']);
  assert.ok(p.components.WeatherCard); assert.equal(p.components.BarChart, undefined);
  assert.doesNotMatch(p.prompt(), /BarChart\(/);
});
test('data constructors are closed definitions and never renderable components', () => {
  const p = make(); for (const name of ['Series','Slice','Point']) {
    assert.ok(p.schema.$defs[name]); assert.equal(p.schema.properties[name], undefined); assert.equal(p.components[name], undefined);
  }
  assert.deepEqual(p.dataShapeRules.Series.validateProps({ name: 'Revenue', values: [1,2] }), { ok: true, value: { name: 'Revenue', values: [1,2] } });
  expectIssue(p.validateTree(elem('Stack', { children: [elem('Series', { name: 'R', values: [1] })] })), 'invalid-child');
});
test('undeclared adapters are excluded by a hard registration error', () => {
  const modules = createCatalog({ adapters: { Text: textAdapter } });
  assert.throws(() => buildProfile({ id: 'i/test', root:'Text', modules, resources, select:['base/text'] }), /trusted renderer/);
});
test('duplicate definition, module ID and unknown requested module are rejected', () => {
  const modules = catalog();
  assert.throws(() => buildProfile({ id:'i/test',root:'Text',modules:[...modules, modules[0]],resources,select:['base/text'] }), /Duplicate module/);
  assert.throws(() => buildProfile({ id:'i/test',root:'Text',modules:[...modules,{...modules[0],id:'base/duplicate'}],resources,select:['base/text','base/duplicate'] }), /Duplicate definition/);
  assert.throws(() => make(['no/such-module']), /Unknown module/);
});
test('module cycles, layer inversion and missing runtime resources are rejected', () => {
  const base = catalog()[0];
  assert.throws(() => buildProfile({ id:'i/test',root:'Text',modules:[{...base,dependsOn:['base/cycle']},{...base,id:'base/cycle',dependsOn:['base/text'],components:[]}],resources,select:['base/text'] }), /Cycle/);
  const mods = catalog().map(mod => mod.id==='base/text' ? {...mod,dependsOn:['domain/weather']} : mod.id==='domain/weather' ? {...mod,dependsOn:[]} : mod);
  assert.throws(() => buildProfile({ id:'i/test',root:'Text',modules:mods,resources,select:['base/text'] }), /depends on a domain/);
  assert.throws(() => buildProfile({ id:'i/test',root:'Text',modules:catalog(),resources:[],select:['base/text'] }), /Unknown runtime resource/);
});
test('parameter order, loose schemas and reserved names reject before output', () => {
  const base = catalog()[0], text = base.components[0];
  const check = def => buildProfile({ id:'i/test',root:def.name,modules:[{...base,components:[def]}],resources,select:['base/text'] });
  assert.throws(() => check({...text,orderedProps:['tone','content']}), /orderedProps/);
  assert.throws(() => check({...text,props:()=>z.object({content:z.string(),tone:z.string().optional()})}), /strictObject/);
  assert.throws(() => check({...text,name:'Query'}), /Reserved name/);
});
test('unknown props, prototype keys, getter properties and non-finite data fail closed', () => {
  const p = make();
  expectIssue(p.componentRules.Text.validateProps({content:'x',onclick:'bad'}), 'unknown-prop');
  expectIssue(p.componentRules.Text.validateProps(JSON.parse('{"content":"x","__proto__":{}}')), 'unknown-prop');
  let reads = 0; const props = Object.defineProperty({},'content',{get(){reads++;return 'x';},enumerable:true});
  expectIssue(p.componentRules.Text.validateProps(props), 'non-json'); assert.equal(reads,0);
  expectIssue(p.componentRules.WeatherCard.validateProps({location:'X',temperatureC:Infinity,condition:'Clear'}),'non-finite');
});
test('cyclic data, non-plain records and validation budget are rejected', () => {
  const cyclic = {}; cyclic.self = cyclic;
  assert.equal(inspectData(cyclic,createBudget())[0].code,'cyclic-data');
  assert.equal(inspectData(new Date(),createBudget())[0].code,'non-json');
  expectIssue(make().componentRules.Text.validateProps({content:'Hello'}, {budget:createBudget(1)}), 'budget-exceeded');
});
test('partial, unknown, wrong children and recursive limits are rejected', () => {
  const p = make();
  expectIssue(p.validateTree({...elem('Text',{content:'x'}),partial:true}),'invalid-element');
  expectIssue(p.validateTree(elem('NotReal',{})),'invalid-element');
  expectIssue(p.validateTree(elem('Stack',{children:[{content:'text'}]})),'invalid-child');
  let node = elem('Text',{content:'x'}); for(let i=0;i<5;i++) node=elem('Stack',{children:[node]});
  expectIssue(p.validateTree(node,{maxDepth:2}),'tree-limit');
  assert.equal(p.validateTree(node).ok,true);
});
test('cross-field semantics are applied after structural schema checks', () => {
  const p = make();
  expectIssue(p.componentRules.Slider.validateProps({label:'N',value:20,min:0,max:10}), 'invalid-range');
  expectIssue(p.componentRules.Select.validateProps({label:'N',value:'b',options:[{label:'A',value:'a'}]}), 'invalid-selection');
  expectIssue(p.componentRules.RadioGroup.validateProps({label:'N',value:'a',options:[{label:'A',value:'a'},{label:'B',value:'a'}]}), 'duplicate-option');
  expectIssue(p.componentRules.BarChart.validateProps({title:'T',labels:['A','B'],series:[{name:'S',values:[1]}]}), 'chart-length');
  expectIssue(p.componentRules.Table.validateProps({columns:[{key:'a',label:'A'}],rows:[{a:1,b:2}]}), 'unknown-column');
});
test('local action literal fails without runtime identity verification', () => {
  const p = make(), handle = Object.freeze({kind:'inform-action',id:'a1'}), issued = new WeakSet([handle]);
  expectIssue(p.componentRules.Button.validateProps({label:'Go',onPress:handle}),'action-not-authorized');
  assert.equal(p.componentRules.Button.validateProps({label:'Go',onPress:handle},{isActionHandle:value=>issued.has(value)}).ok,true);
  expectIssue(p.componentRules.Button.validateProps({label:'Go',onPress:{...handle}},{isActionHandle:value=>issued.has(value)}),'action-not-authorized');
});
test('icon schema only exposes bundled canonical IDs; media excludes executable formats', () => {
  const p = make(); assert.deepEqual(p.schema.$defs.Icon.properties.name.enum,['check','info']);
  expectIssue(p.componentRules.Icon.validateProps({name:'remote-url'}),'schema');
  expectIssue(p.componentRules.Image.validateProps({src:'javascript:alert(1)',alt:'x'}),'unsafe-media-url');
  expectIssue(p.componentRules.Image.validateProps({src:'data:image/svg+xml,<svg/>',alt:'x'}),'unsafe-media-url');
});
test('prompt teaches bindings without enabling service tools and uses correct root examples', () => {
  const p = make(), prompt=p.prompt();
  assert.match(prompt,/\$binding<string>/); assert.match(prompt,/Undeclared \$variables are errors/);
  assert.doesNotMatch(prompt,/Query\(toolName/); assert.doesNotMatch(prompt,/root = (Text|Input|BarChart|WeatherCard)\(/);
  assert.match(prompt,/root = Stack\(\[BarChart\(/); assert.match(prompt,/Series\(name: string, values: number\[\]\)/);
  assert.deepEqual(p.manifest().externalServices,[]);
});
test('representative Text renderer treats HTML as inert text', () => {
  const dom = new JSDOM('<body>'), ctx={document:dom.window.document,renderChild(){throw Error('no child')},budget:createBudget()};
  const h=textAdapter.create({content:'<img src=x onerror=alert(1)>'},ctx); dom.window.document.body.append(h.element);
  assert.equal(h.element.querySelector('img'),null); assert.equal(h.element.textContent,'<img src=x onerror=alert(1)>');
  h.dispose(); assert.equal(dom.window.document.body.children.length,0); dom.window.close();
});
test('representative BarChart renders positive, negative and zero series with accessible data', () => {
  const p=make(), props={title:'Revenue',labels:['A','B','C'],series:[{name:'Net',values:[-5,0,10]}]};
  assert.equal(p.componentRules.BarChart.validateProps(props).ok,true);
  const dom=new JSDOM('<body>'), ctx={document:dom.window.document,renderChild(){throw Error('no child')},budget:createBudget()};
  const h=barChartAdapter.create(props,ctx); assert.equal(h.element.querySelectorAll('rect').length,3);
  for(const rect of h.element.querySelectorAll('rect')) for(const key of ['x','y','width','height']) assert.ok(Number.isFinite(Number(rect.getAttribute(key))));
  assert.match(h.element.querySelector('table').textContent,/-5/); assert.equal(h.element.querySelector('svg').getAttribute('aria-label'),'Revenue');
  assert.equal(h.element.querySelector('svg').textContent.includes('NaN'),false); dom.window.close();
});
test('each supplied-data example structurally validates; action example is DSL-only', () => {
  const p=make();
  for(const [name,def] of Object.entries(p.components)) for(const ex of def.examples) {
    if (!ex.props) { assert.equal(name,'Button'); continue; }
    const result=p.componentRules[name].validateProps(ex.props);
    assert.equal(result.ok,true,`${name}: ${JSON.stringify(result)}`);
  }
});
test('metadata snapshots cannot be mutated after profile registration', () => {
  const p=make(); assert.throws(()=>p.componentRules.Input.bindingProps.push('label'),TypeError);
  assert.throws(()=>p.components.Input.orderedProps.push('surprise'),TypeError);
  assert.throws(()=>p.components.Input.examples[0].props.value='changed',TypeError);
  assert.throws(()=>p.modules.push('domain/untrusted'),TypeError);
});
test('child and root accessor properties are not executed by traversal', () => {
  let reads=0;
  const root=Object.defineProperty({props:{content:'x'},partial:false},'type',{get(){reads++;return 'element';},enumerable:true});
  const p=make(); expectIssue(p.validateTree(root),'invalid-element'); assert.equal(reads,0);
  expectIssue(p.componentRules.Stack.validateProps({children:[root]}),'invalid-child'); assert.equal(reads,0);
  const hidden=Object.defineProperty({content:'x'},'tone',{value:'muted',enumerable:false});
  expectIssue(p.componentRules.Text.validateProps(hidden),'non-json');
});
test('non-index array properties are rejected instead of being silently stripped', () => {
  const data=[1];data.extra='untrusted'; assert.equal(inspectData(data,createBudget())[0].code,'non-json');
});
test('evaluated validation never skips static semantics', () => {
  const module=catalog()[0], text=module.components[0];
  const p=buildProfile({id:'i/test',root:'Text',resources,select:['base/text'],modules:[{...module,components:[{...text,semantics:{static:[()=>[{code:'static-check',path:'',message:'Always checked.'}]],evaluated:[]}}]}]});
  expectIssue(p.componentRules.Text.validateProps({content:'x'}),'static-check');
});
test('unknown element-envelope fields fail instead of being silently discarded', () => {
  const p=make(), node={...elem('Text',{content:'x'}),onload:'unexpected'};
  expectIssue(p.validateTree(node),'invalid-element');
  expectIssue(p.componentRules.Stack.validateProps({children:[node]}),'invalid-child');
});
test('weather-only profile includes the layout components used by its foundation renderer', () => {
  const p=buildProfile({id:'i/weather',root:'WeatherCard',modules:catalog(),resources,select:['domain/weather']});
  assert.deepEqual(p.modules,['base/text','base/layout','domain/weather']);
  for(const name of ['Card','Row','Heading','Text']) assert.ok(p.components[name]);
});
