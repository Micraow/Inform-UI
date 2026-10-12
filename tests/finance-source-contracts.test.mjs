import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire,Module} from 'node:module';
import {build} from 'esbuild';
import Ajv2020 from 'ajv/dist/2020.js';
import {SCHEMA_MODULES} from '../scripts/schema-source/catalog.mjs';
import {buildCanonicalSchema} from '../scripts/schema-source/canonical.mjs';
import {buildSelection,createSchemaRegistry} from '../scripts/schema-source/registry.mjs';
import {financeModules} from './helpers/finance-source-catalog.mjs';

const root=new URL('../',import.meta.url).pathname;
const require=createRequire(import.meta.url),structural=require('../src/schema/validator.cjs');
const compiled=await build({entryPoints:[root+'src/core/index.ts'],bundle:true,write:false,format:'cjs',platform:'node',target:'node22'});
const core=new Module(root+'finance-source-contract-core.cjs');
core.filename=root+'finance-source-contract-core.cjs';core.paths=Module._nodeModulePaths(root);
core._compile(compiled.outputFiles[0].text,core.filename);
const validate=core.exports.validateDocument;
const files=['finance-snapshots','ledger-lists','ledger-records','ledger-correction','ledger-income','ledger-spend','ledger-upcoming'];
const documents=files.map(name=>JSON.parse(readFileSync(new URL('../examples/schema-modules/'+name+'.json',import.meta.url))));
const nodes=documents.flatMap(doc=>doc.body);
const get=type=>structuredClone(nodes.find(n=>n.type===type));
const check=(node,ok,code,path)=>{
  const doc={version:'iui/1',body:[node]};
  assert.equal(structural(doc),true,JSON.stringify(structural.errors));
  const result=validate(doc);assert.equal(result.ok,ok,JSON.stringify(result));
  if(code)assert.ok(result.issues.some(i=>i.code===code&&(!path||i.path==='/body/0'+path)),JSON.stringify(result));
};
const candidateModules=[SCHEMA_MODULES.find(m=>m.id==='shared/value'),...financeModules];

test('central catalog registrations match the separately authored candidate contract',()=>{for(const proposed of financeModules){const actual=SCHEMA_MODULES.find(m=>m.id===proposed.id);assert.ok(actual,proposed.id);for(const key of ['provides','nodeTypes','dependsOn'])assert.deepEqual(actual[key],proposed[key],proposed.id+' '+key);assert.equal(actual.install,proposed.install)}});

test('twelve original examples pass unchanged full structural and semantic validation',()=>{
  assert.equal(new Set(nodes.map(n=>n.type)).size,12);
  for(const doc of documents){assert.equal(structural(doc),true,JSON.stringify(structural.errors));assert.equal(validate(doc).ok,true,JSON.stringify(validate(doc)));}
});
test('candidate installers preserve every maintained definition and finance owner byte-for-byte',async()=>{
  const full=await buildCanonicalSchema();
  const registry=createSchemaRegistry(candidateModules);
  for(const module of financeModules)registry.use(module.id);
  registry.finalize();
  for(const[name,definition]of Object.entries(registry.defs))if(name!=='Node')assert.equal(JSON.stringify(definition),JSON.stringify(full.schema.$defs[name]),name);
  assert.equal(registry.nodes.length,12);
  for(const[type,owner]of Object.entries(registry.owners)){assert.equal(owner,'finance');assert.equal(owner,full.owners[type]);}
  assert.equal(full.nodes.length,218);
});
test('selected source closures validate independent examples without unrelated node inflation',()=>{
  for(const [index,id] of ['finance/snapshots','finance/ledger-lists','finance/ledger-records','finance/ledger-correction','finance/ledger-income','finance/ledger-spend','finance/ledger-upcoming'].entries()){
    const result=buildSelection([id],{modules:candidateModules});
    const validator=new Ajv2020({strict:true,allErrors:true}).compile(result.schema);
    assert.equal(validator(documents[index]),true,JSON.stringify(validator.errors));
    assert.deepEqual(result.manifest.components,documents[index].body.map(n=>n.type));
    assert.equal(validator({version:'iui/1',body:[{type:'text',value:'Not selected'}]}),false);
    assert.equal(result.schema.$defs.FinanceQuoteNode!==undefined,id==='finance/snapshots');
  }
  const ids=financeModules.filter(m=>m.nodeTypes.length).map(m=>m.id);
  assert.deepEqual(buildSelection(ids,{modules:candidateModules}),buildSelection([...ids].reverse(),{modules:candidateModules}));
  assert.equal(buildSelection(ids,{modules:candidateModules}).manifest.components.length,12);
});
test('shared sources have no node dependency and do not load canonical/generated JSON',()=>{
  for(const module of financeModules){
    const source=readFileSync(new URL('../scripts/schema-source/modules/'+({'shared/finance-source':'finance-source','finance/snapshots':'finance-snapshots'}[module.id]??module.id.split('/')[1])+'.mjs',import.meta.url),'utf8');
    assert.doesNotMatch(source,/readFile|canonical|iui\.schema\.json|fragments\/|JSON\.parse/);
    if(module.id.startsWith('shared/'))assert.deepEqual(module.nodeTypes,[]);
  }
});
test('snapshot strings retain older non-trimming and optional-empty source URL behavior',()=>{
  const n=get('finance-quote');n.title=' ';n.message='';n.source.label=' ';n.source.url='';n.instrument.symbol=' ';n.instrument.name=' ';check(n,true);
  n.source.url=' ';check(n,false,'UNSAFE_URL','/source/url');
});
test('finance history, ranges and baselines compare real offset instants',()=>{
  let n=get('finance-chart');n.instrument.history=[{time:'2026-10-01T12:00+02:00',price:0},{time:'2026-10-01T11:00Z',price:null}];check(n,true);
  n.instrument.history[1].time='2026-10-01T10:00Z';check(n,false,'FINANCE_ORDER','/instrument/history/1/time');
  n=get('finance-chart');n.initialRange='absent';check(n,false,'FINANCE_RANGE','/initialRange');
  n=get('finance-comparison');check(n,true);n.baselineAt='2026-10-02T12:00Z';check(n,true);
  n.instruments[1].id=n.instruments[0].id;check(n,false,'FINANCE_ID','/instruments/1/id');
  n=get('finance-quote');n.instrument.asOf='2026-02-30T10:00Z';check(n,false,'FINANCE_DATE','/instrument/asOf');
});
test('finance overflow, heatmap time/filter and zero/unknown keep distinct semantics',()=>{
  let n=get('finance-quote');n.instrument.price=1e308;n.instrument.previousClose=1e-308;check(n,false,'FINANCE_VALUE');
  n=get('finance-heatmap');check(n,true);n.status='loading';n.cells[0].asOf='2026-10-02T14:00Z';check(n,false,'FINANCE_DATE','/cells/0/asOf');
  n=get('finance-heatmap');n.initialSector='Absent';check(n,false,'FINANCE_FILTER','/initialSector');
});
test('numeric ledger dates, source schemes and local IDs keep existing boundaries',()=>{
  let n=get('asset-distribution');n.label=' ';n.observedAt='Not a parsed date';n.source.label=' ';n.description='';check(n,true);
  n.accounts.push(structuredClone(n.accounts[0]));check(n,false,'LEDGER_ID','/accounts/2/id');
  n=get('transaction-list');n.transactions[0].date='2100-02-29';check(n,false,'LEDGER_DATE','/transactions/0/date');
  n=get('asset-distribution');n.source.url='/relative';check(n,false,'UNSAFE_URL','/source/url');
});
test('exact-money preserves negative zero and trailing zeros without numeric coercion',()=>{
  for(const amount of ['-0.0000','999999999999999999.000000000000000001',null]){const n=get('ledger-accounts');n.accounts[0].balance.amount=amount;check(n,true);}
  for(const amount of [1.23,'1e2','+1','01',' 1','1\n']){const n=get('ledger-accounts');n.accounts[0].balance.amount=amount;assert.equal(structural({version:'iui/1',body:[n]}),false,String(amount));}
});
test('account and recurring records preserve blank-label exceptions and scoped references',()=>{
  let n=get('ledger-accounts');n.label=' ';n.accounts[0].label=' ';n.accounts[0].institution=' ';check(n,true);
  n.accounts[0].observedAt='2026-02-30T10:00Z';check(n,false,'LEDGER_OBSERVATION','/accounts/0/observedAt');
  n=get('ledger-recurring-transactions');n.initialReviewedIds=['absent'];check(n,false,'RECURRING_REVIEW_ID','/initialReviewedIds/0');
  n.initialReviewedIds=['sample','sample'];check(n,false,'LEDGER_RECORD_ID','/initialReviewedIds/1');
  n=get('ledger-recurring-transactions');n.records[0].nextDate='2100-02-29';check(n,false,'RECURRING_DATE','/records/0/nextDate');
});
test('category correction preserves nulls, independent namespaces and explicit references',()=>{
  let n=get('ledger-low-confidence-category-correction');n.categories[0].id=n.transactions[0].id;n.transactions[0].suggestedCategoryId=n.categories[0].id;n.label=' ';n.categories[0].label=' ';check(n,true);
  n.transactions[0].originalCategoryId='absent';check(n,false,'CORRECTION_CATEGORY','/transactions/0/originalCategoryId');
  n=get('ledger-low-confidence-category-correction');n.transactions[0].date='2100-02-29';check(n,false,'CORRECTION_DATE','/transactions/0/date');
  n=get('ledger-low-confidence-category-correction');n.transactions.push(structuredClone(n.transactions[0]));check(n,false,'CORRECTION_ID','/transactions/1/id');
});
test('income requires conditional labels but permits unknown or empty paycheck objects',()=>{
  let n=get('ledger-income-tracker');delete n.estimatedMonthlyIncomeLabel;check(n,false,'INCOME_LABEL','/estimatedMonthlyIncomeLabel');
  n.hasIncome=false;check(n,true);n.incomeSourcesLabel=' ';check(n,false,'INCOME_LABEL','/incomeSourcesLabel');
  for(const next of [null,{}, {name:null,amountLabel:null,nextPayment:null,frequency:null,accountDetail:null}]){n=get('ledger-income-tracker');n.nextPaycheck=next;n.source.label=' ';check(n,true);}
  n=get('ledger-income-tracker');n.nextPaycheck.name=' ';check(n,false,'INCOME_LABEL','/nextPaycheck/name');
  n=get('ledger-income-tracker');n.hasIncome=false;n.nextPaycheck.logoUrl='javascript:invalid()';check(n,false,'UNSAFE_URL','/nextPaycheck/logoUrl');
});
test('spending trims only declared fields and does not infer numeric/display consistency',()=>{
  let n=get('ledger-spend-so-far-this-month');n.comparisonLabel=' ';n.fallback=' ';n.months[0].totalLabel=' ';n.months[0].groupLabel=' ';n.months[0].totalValue=-10;n.months[0].points.push({day:2,value:20,label:null});check(n,true);
  n.months[0].points[0].label=' ';check(n,false,'SPEND_LABEL','/months/0/points/0/label');
  n=get('ledger-spend-so-far-this-month');n.categories[0].label=' ';check(n,false,'SPEND_LABEL','/categories/0/label');
});
test('spending month references, reserved IDs, elapsed bounds and point order remain semantic',()=>{
  let n=get('ledger-spend-so-far-this-month');n.comparison='average';check(n,false,'SPEND_COMPARISON','/comparison');
  n=get('ledger-spend-so-far-this-month');n.comparison=n.selectedMonth;check(n,false,'SPEND_COMPARISON','/comparison');
  n=get('ledger-spend-so-far-this-month');delete n.months[0].daysElapsed;check(n,false,'SPEND_DAY','/months/0/daysElapsed');
  n=get('ledger-spend-so-far-this-month');n.months[0].points[1].day=0;check(n,false,'SPEND_DAY','/months/0/points/1/day');
  n=get('ledger-spend-so-far-this-month');n.months[0].id='previous';delete n.selectedMonth;delete n.comparison;check(n,false,'SPEND_MONTH_ID','/months/0/id');
});
test('upcoming IDs are per alternate list, with top collisions rejected even in hidden data',()=>{
  let n=get('ledger-upcoming-activity');check(n,true);n.flows.outgoing.items[0].id='top';check(n,true);
  n.status='pending';n.flows.incoming.expandedItems[0].id='top';check(n,false,'UPCOMING_ID','/flows/incoming/expandedItems/0/id');
  n=get('ledger-upcoming-activity');n.flows.incoming.items.push(structuredClone(n.flows.incoming.items[0]));check(n,false,'UPCOMING_ID','/flows/incoming/items/1/id');
});
test('upcoming keeps literal-date unknowns and exact optional-label trim exceptions',()=>{
  let n=get('ledger-upcoming-activity');n.emptyLabel=' ';n.fallback='';n.moreLabel=' ';n.activities[0].dateLabel='Not a parsed date';check(n,true);
  n.activities[0].amountLabel=' ';check(n,false,'UPCOMING_LABEL','/activities/0/amountLabel');
  n=get('ledger-upcoming-activity');n.flows.outgoing.items[0].iconSrc='javascript:invalid()';check(n,false,'UPCOMING_SOURCE','/flows/outgoing/items/0/iconSrc');
});
test('mandatory contracts document parser, trim and unknown-value exceptions explicitly',()=>{
  const docs=['finance-snapshot-contract','ledger-source-contract','supplied-finance-display-contract'].map(name=>readFileSync(new URL('../docs/'+name+'.md',import.meta.url),'utf8'));
  for(const token of ['trim()','FINANCE_ORDER','FINANCE_RANGE','FINANCE_VALUE','FINANCE_FILTER','incomparable'])assert.ok(docs[0].includes(token),token);
  for(const token of ['LEDGER_ID','LEDGER_RECORD_ID','RECURRING_REVIEW_ID','CORRECTION_CATEGORY','negative zero','Exact money'])assert.ok(docs[1].includes(token),token);
  for(const token of ['INCOME_LABEL','SPEND_MONTH_ID','SPEND_COMPARISON','UPCOMING_ID','inactive','no required fields','series `totalLabel`'])assert.ok(docs[2].includes(token),token);
});
