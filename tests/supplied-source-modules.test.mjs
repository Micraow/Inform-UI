import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import {SCHEMA_MODULES} from '../scripts/schema-source/catalog.mjs';
import {buildSelection,createSchemaRegistry} from '../scripts/schema-source/registry.mjs';
import {buildCanonicalSchema} from '../scripts/schema-source/canonical.mjs';
import {assertClosedReferences} from '../scripts/schema-subsets.mjs';
import {SUPPLIED_SOURCE_MODULES,TEST_MODULES,LEGACY_BLOCKS} from './supplied-source-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const select=ids=>buildSelection(ids,{modules:TEST_MODULES,sourceIdentity:{algorithm:'sha256',value:'original-supplied-source-test'}});
const examples=new Map(await Promise.all(SUPPLIED_SOURCE_MODULES.map(async m=>[m.id,JSON.parse(await read(m.examplePaths[0]))])));
const validators=new Map(SUPPLIED_SOURCE_MODULES.map(m=>[m.id,new Ajv2020({strict:true,allErrors:true}).compile(select([m.id]).schema)]));
const owner=type=>SUPPLIED_SOURCE_MODULES.find(m=>m.nodeTypes.includes(type)).id;
const example=type=>structuredClone([...examples.values()].flatMap(d=>d.body).find(n=>n.type===type));
const structural=n=>validators.get(owner(n.type))({version:'iui/1',body:[n]});
const dataURL=js=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64');

// Focused unchanged-domain inspection, not a substitute for full public validation or browser QA.
// No renderer bundle or generated artifact is built by this test.
const inspectorURLs=new Map();
async function inspector(name){
 if(!inspectorURLs.has(name)){
  let js=ts.transpileModule(await read('src/core/'+name+'.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  for(const dep of ['travel-events','extensions','units'])if(js.includes("'./"+dep+".js'"))js=js.replaceAll("'./"+dep+".js'",JSON.stringify(await inspector(dep)));
  if(name==='units')js=js.replace("'../data/units.json'",JSON.stringify(dataURL('export default '+await read('src/data/units.json')+';')));
  inspectorURLs.set(name,dataURL(js));
 }
 return inspectorURLs.get(name);
}
const inspectors={};
for(const [name,exportName,types] of [
 ['flight-discovery','inspectFlightDiscovery',['flight-search-form','flight-results']],
 ['activity-planning','inspectActivityPlanning',['shared-activity-planner','event-sidebar']],
 ['vocabulary','inspectVocabulary',['word-card','copy-words']],
 ['source-citations','inspectSourceCitation',['code-cite','file-cite']],
 ['entity-facts','inspectEntityFacts',['sidebar-fact-table','entity-thumbnail-list']],
 ['thread','inspectThread',['reddit-thread-card']],
 ['converters','inspectConverters',['unit-converter','currency-converter']],
 ['weather-sidebar','inspectWeatherSidebar',['weather-sidebar-title']],
]){const module=await import(await inspector(name));for(const type of types)inspectors[type]=module[exportName];}
const indexSource=await read('src/core/index.ts');
const safeSource=indexSource.slice(indexSource.indexOf('export function isSafeURL('),indexSource.indexOf('\nconst svgNumeric'));
const {isSafeURL}=await import(dataURL(ts.transpileModule(safeSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText));
const issues=n=>{const out=[];inspectors[n.type](n,'/body/0',i=>out.push(i),isSafeURL,url=>isSafeURL(url,'image'));return out;};
const accepts=n=>{assert.equal(structural(n),true,JSON.stringify(validators.get(owner(n.type)).errors));assert.deepEqual(issues(n),[]);};
const rejects=(n,code)=>{assert.equal(structural(n),true,'negative must reach semantic inspector');assert.ok(issues(n).some(i=>i.code===code),JSON.stringify(issues(n)));};

test('fourteen supplied source declarations preserve exact providers, ownership and dependency contracts',async()=>{
 const full=await buildCanonicalSchema();
 for(const m of SUPPLIED_SOURCE_MODULES){
  const registry=createSchemaRegistry(TEST_MODULES);registry.use(m.id);registry.finalize();
  for(const name of m.provides)assert.deepEqual(registry.defs[name],full.schema.$defs[name],name);
  for(const type of m.nodeTypes)assert.equal(registry.owners[type],type.endsWith('-converter')?'converters':type==='weather-sidebar-title'?'weather':'base');
  const registered=SCHEMA_MODULES.find(x=>x.id===m.id);if(registered)for(const field of ['dependsOn','provides','nodeTypes','contractPath','semanticContractPaths','examplePaths','sourcePath'])assert.deepEqual(registered[field],m[field],m.id+' '+field);
  const source=await read(m.sourcePath);assert.doesNotMatch(source,/canonical\.mjs|iui\.schema|buildCanonical/);
  if(m.id!=='converters/local')assert.doesNotMatch(source,/readFile|JSON\.parse/);
  else assert.match(source,/new URL\('\.\.\/\.\.\/\.\.\/src\/data\/units\.json',import\.meta\.url\)/);
  for(const path of [...m.semanticContractPaths,...m.examplePaths])assert.ok((await read(path.split('#')[0])).length>0,path);
 }
 assert.equal(SUPPLIED_SOURCE_MODULES.flatMap(m=>m.nodeTypes).length,14);
});

test('proposed source-block replacements preserve the complete 219-node schema byte for byte',async()=>{
 const url=new URL('../scripts/schema-source/canonical.mjs',import.meta.url);let source=await readFile(url,'utf8');
 for(const {id,start,end} of LEGACY_BLOCKS){
  const a=source.indexOf(start);if(a<0){assert.ok(source.includes(`registry.use('${id}')`),'missing block or registration '+id);continue;}
  const b=source.indexOf(end,a);assert.ok(b>a,id);source=source.slice(0,a)+`registry.use('${id}');\n`+source.slice(b);
 }
 source=source.replace('const registry=createSchemaRegistry();','const registry=createSchemaRegistry(TEST_MODULES);');
 source=source.replaceAll('import.meta.url',JSON.stringify(url.href));
 source=source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,(_,quote,path)=>'from '+JSON.stringify(new URL(path,url).href));
 source=`import {TEST_MODULES} from ${JSON.stringify(new URL('./supplied-source-fixture.mjs',import.meta.url).href)};\n`+source;
 const {buildCanonicalSchema:proposed}=await import(dataURL(source)),actual=await proposed();
 assert.equal(actual.nodes.length,219);assert.equal(Object.keys(actual.owners).length,219);
 assert.equal(JSON.stringify(actual.schema,null,2)+'\n',await read('src/schema/iui.schema.json'));
});

test('eight original examples validate as isolated real source selections with exact dependency nodes',()=>{
 const counts={'travel/discovery':10,'activities/supplied':6,'vocabulary/supplied':6,'citations/supplied':6,'entities/facts':6,'readers/discussion':1,'converters/local':2,'weather/sidebar':5};
 for(const m of SUPPLIED_SOURCE_MODULES){
  const {schema,manifest}=select([m.id]);assertClosedReferences(schema);assert.equal(manifest.components.length,counts[m.id]);
  assert.equal(validators.get(m.id)(examples.get(m.id)),true,JSON.stringify(validators.get(m.id).errors));
  for(const node of examples.get(m.id).body)accepts(node);
  assert.equal(validators.get(m.id)({version:'iui/1',body:[{type:'timer',durationMs:1000}]}),false);
 }
});

test('combined selection with text is deterministic and excludes unrelated base domains',()=>{
 const ids=SUPPLIED_SOURCE_MODULES.map(m=>m.id).concat('foundations/text'),a=select(ids),b=select([...ids].reverse());assert.deepEqual(a,b);assert.equal(a.manifest.components.length,25);
 assert.equal(a.manifest.sha256,createHash('sha256').update(JSON.stringify(a.schema,null,2)+'\n').digest('hex'));
 const validate=new Ajv2020({strict:true,allErrors:true}).compile(a.schema);assert.equal(validate({version:'iui/1',body:[{type:'text',value:'Original supplied examples'},...[...examples.values()].flatMap(d=>d.body)]}),true,JSON.stringify(validate.errors));
 assert.equal(a.schema.$defs.OpenaiNode,undefined);assert.equal(a.schema.$defs.CalculatorQsofaScoreNode,undefined);
});

test('unit enumeration and description derive directly from the maintained unit registry',async()=>{
 const data=JSON.parse(await read('src/data/units.json')),node=select(['converters/local']).schema.$defs.UnitConverterNode;
 assert.deepEqual(node.properties.from.enum,[...new Set(Object.values(data).flatMap(c=>c.units.map(u=>u.id)))]);
 assert.equal(node.properties.from.description,Object.entries(data).map(([name,c])=>name+': '+c.units.map(u=>u.id).join(', ')).join('; '));
 assert.deepEqual(node.properties.from,node.properties.to);
});

test('all fourteen domains preserve structural text lengths without inventing nonblank trimming',()=>{
 for(const type of Object.keys(inspectors)){
  const n=example(type),key=type==='word-card'?'term':type==='reddit-thread-card'||type.endsWith('-converter')?'title':'label';n[key]=' ';accepts(n);n[key]='';assert.equal(structural(n),false,type);
 }
 const code=example('code-cite');code.lines=[''];delete code.citedStart;delete code.citedEnd;accepts(code);
 const fact=example('sidebar-fact-table');fact.facts[0].value='';accepts(fact);
 const word=example('word-card');word.translation='';word.examples[0].translation='';accepts(word);
});

test('flight search permits incomplete initial drafts and same-day return but validates supplied choices',()=>{
 const n=example('flight-search-form');delete n.initialOrigin;delete n.initialDestination;accepts(n);
 n.initialOrigin='AAA';n.initialDestination='AAA';rejects(n,'SEARCH_ROUTE');n.initialDestination='CCC';rejects(n,'SEARCH_AIRPORT');n.initialDestination='BBB';
 n.airports.push({...n.airports[0]});rejects(n,'DUPLICATE_ID');n.airports.pop();delete n.initialDepartureDate;rejects(n,'SEARCH_RETURN');
 n.initialDepartureDate='2028-03-01';rejects(n,'SEARCH_RETURN');n.initialDepartureDate='2027-02-29';rejects(n,'SEARCH_DATE');
 n.initialDepartureDate='2028-02-29';accepts(n);n.initialTravelers=10;assert.equal(structural(n),false);
});

test('flight results preserve exact leg-local IDs and offset chronology without route inference',()=>{
 const n=example('flight-results'),r=n.results[0],leg=r.legs[0];
 r.legs.push({...structuredClone(leg),id:'leg_b',departure:{airport:'CCC',at:'2028-02-29T13:00+01:00'},arrival:{airport:'DDD',at:'2028-02-29T14:00+01:00'}});accepts(n);
 r.legs[1].departure.at='2028-02-29T12:59+01:00';rejects(n,'FLIGHT_ORDER');r.legs[1].departure.at='2028-02-29T13:00+01:00';
 r.legs[1].id=leg.id;rejects(n,'DUPLICATE_ID');r.legs.pop();n.results.push({...structuredClone(r),id:'route_b'});accepts(n);
 n.results[1].id=r.id;rejects(n,'DUPLICATE_ID');n.results.pop();leg.arrival.at=leg.departure.at;rejects(n,'FLIGHT_ORDER');
});

test('flight prices are optional supplied labels with exact range and key syntax',()=>{
 const n=example('flight-results');delete n.results[0].price;accepts(n);n.results[0].price={amount:1e12,currency:'ZZZ'};accepts(n);
 n.results[0].price.amount=1e12+1;assert.equal(structural(n),false);n.results[0].price.amount=0;n.results[0].price.currency='USD\n';assert.equal(structural(n),false);
 n.results[0].price.currency='USD';n.results[0].id+='\n';assert.equal(structural(n),false);
});

test('activity availability is sparse and scoped without inferring conflict or consent',()=>{
 const n=example('shared-activity-planner'),o=n.options[0];o.id=n.participants[0].id;accepts(n);o.availability=[];accepts(n);
 o.availability=[{participantId:'missing',status:'unknown'}];rejects(n,'ACTIVITY_PARTICIPANT');o.availability=[{participantId:'person_a',status:'available'},{participantId:'person_a',status:'unavailable'}];rejects(n,'DUPLICATE_ID');
 o.availability=[];n.options.push({...structuredClone(o),id:'other'});accepts(n);o.endsAt='2028-02-29T11:00+01:00';rejects(n,'ACTIVITY_ORDER');o.endsAt='2027-02-29T12:00Z';rejects(n,'ACTIVITY_TIME');
});

test('event agenda intervals allow overlap and boundary equality but must fit the event',()=>{
 const n=example('event-sidebar');accepts(n);n.agenda[0].startsAt='2028-02-29T09:59Z';rejects(n,'EVENT_AGENDA_RANGE');n.agenda[0].startsAt=n.startsAt;
 n.agenda[0].endsAt='2028-02-29T12:01Z';rejects(n,'EVENT_AGENDA_RANGE');n.agenda[0].endsAt=n.endsAt;accepts(n);
 n.agenda[1].id=n.agenda[0].id;rejects(n,'DUPLICATE_ID');
});

test('vocabulary keeps repeated literal text and distinguishes omitted from empty initial selections',()=>{
 const n=example('copy-words');n.initialSelectedIds=[];accepts(n);delete n.initialSelectedIds;accepts(n);
 n.initialSelectedIds=['first','first'];rejects(n,'DUPLICATE_ID');n.initialSelectedIds=['missing'];rejects(n,'COPY_WORD_ID');delete n.initialSelectedIds;n.words[1].id='first';rejects(n,'DUPLICATE_ID');
 const word=example('word-card');word.definition=' ';accepts(word);word.definition='';assert.equal(structural(word),false);word.definition='Sample';word.examples[0].text='';assert.equal(structural(word),false);
});

test('code citations retain inclusive absolute bounds and literal empty lines',()=>{
 const n=example('code-cite');n.citedStart=11;n.citedEnd=11;accepts(n);delete n.citedEnd;rejects(n,'CITE_LINE_RANGE');
 delete n.citedStart;n.startLine=10000000;n.lines=[''];accepts(n);n.lines.push('literal');rejects(n,'CITE_LINE_RANGE');
 n.startLine=10;n.citedStart=11;n.citedEnd=10;rejects(n,'CITE_LINE_RANGE');n.citedStart=9;n.citedEnd=10;rejects(n,'CITE_LINE_RANGE');
});

test('file citations permit gaps and supplied order but require unique in-range selected pages',()=>{
 const n=example('file-cite');accepts(n);n.totalPages=7;rejects(n,'CITE_PAGE_RANGE');delete n.totalPages;accepts(n);
 n.initialPage=1;rejects(n,'CITE_PAGE_RANGE');delete n.initialPage;n.pages.push(structuredClone(n.pages[0]));rejects(n,'DUPLICATE_PAGE');n.pages.pop();n.pages[0].text=' ';accepts(n);n.pages[0].text='';assert.equal(structural(n),false);
});

test('facts and entity fields preserve null versus empty values and their independent ID scopes',()=>{
 const n=example('sidebar-fact-table');n.facts[0].value=null;accepts(n);n.facts[1].id=n.facts[0].id;rejects(n,'DUPLICATE_ID');n.facts.pop();n.facts[0].observedAt='2027-02-29T10:00Z';rejects(n,'FACT_TIME');
 const e=example('entity-thumbnail-list');e.initialSelectedId='missing';rejects(e,'ENTITY_SELECTION');e.initialSelectedId='cedar';e.entities[1].id='cedar';rejects(e,'DUPLICATE_ID');e.entities.pop();e.entities[0].fields[0].value=null;assert.equal(structural(e),false);
});

test('entity image policy validates embedded source syntax rather than making a decode claim',()=>{
 const n=example('entity-thumbnail-list');n.entities[0].image={src:'data:image/png;base64,AA==',alt:' '};accepts(n);
 for(const src of ['https://example.invalid/image.png','data:image/gif;base64,AA==','data:image/svg+xml;base64,AA==','data:image/png;base64,']){n.entities[0].image.src=src;rejects(n,'ENTITY_IMAGE');}
 n.entities[0].image={src:'data:image/webp;base64,AA==',alt:''};assert.equal(structural(n),false);
});

const comment=(id,replies)=>({id,author:'Original author',body:'Original sample',...(replies?{replies}: {})});
test('discussion recursive structure retains whole-tree unique IDs and four semantic levels',()=>{
 const n=example('reddit-thread-card');n.body='';n.comments=[comment('one',[comment('two',[comment('three',[comment('four')])])])];accepts(n);
 n.comments[0].replies[0].replies[0].replies[0].replies=[comment('five')];rejects(n,'THREAD_DEPTH');delete n.comments[0].replies[0].replies[0].replies[0].replies;
 n.comments.push(comment('four'));rejects(n,'DUPLICATE_ID');
});

test('discussion total bound counts nested supplied comments independently of array bounds',()=>{
 const n=example('reddit-thread-card');n.comments=Array.from({length:50},(_,i)=>comment('root_'+i));
 n.comments[0].replies=Array.from({length:20},(_,i)=>comment('a_'+i));n.comments[1].replies=Array.from({length:20},(_,i)=>comment('b_'+i));n.comments[2].replies=Array.from({length:10},(_,i)=>comment('c_'+i));accepts(n);
 n.comments[2].replies.push(comment('c_10'));rejects(n,'THREAD_COUNT');
 assert.equal(issues(n).filter(i=>i.code==='THREAD_COUNT').length,1);
});

test('unit conversion validates category membership and temperature-mode presence, not only enum spelling',()=>{
 const n=example('unit-converter');n.category='length';n.from='m';n.to='kg';delete n.temperatureMode;rejects(n,'UNIT_ID');n.to='cm';n.amount=-10;accepts(n);
 n.temperatureMode='absolute';rejects(n,'UNIT_MODE');n.category='temperature';n.from='C';n.to='F';n.amount=-273.15;accepts(n);n.amount=-273.16;rejects(n,'UNIT_RANGE');n.temperatureMode='difference';accepts(n);
});

test('unit numerical overflow and nonzero underflow are rejected without rounding away raw values',()=>{
 const n=example('unit-converter');n.category='length';delete n.temperatureMode;n.from='km';n.to='mm';n.amount=Number.MAX_VALUE;rejects(n,'UNIT_RANGE');
 n.from='mm';n.to='km';n.amount=Number.MIN_VALUE;rejects(n,'UNIT_RANGE');n.amount=0;accepts(n);n.precision=13;assert.equal(structural(n),false);
});

test('currency keeps missing cross-rates unknown, same-currency identity and explicit base-one rule',()=>{
 const n=example('currency-converter');accepts(n);n.from='DEF';n.to='DEF';n.amount=-5;accepts(n);
 n.rates.push({currency:n.base,rate:null});rejects(n,'CURRENCY_RATE');n.rates.at(-1).rate=1;accepts(n);
 n.rates.push({currency:'ABC',rate:2});rejects(n,'CURRENCY_ID');n.rates.pop();n.from='NOP';rejects(n,'CURRENCY_ID');n.from=n.base;n.to='ABC';n.rates[0].rate=0;assert.equal(structural(n),false);
});

test('currency preserves general timestamp and source-link exceptions without relaxing supplied readers',()=>{
 const n=example('currency-converter');n.asOf='2028-02-29T12:00:30.125+15:00';n.source.url='#supplied';accepts(n);n.source.url='';accepts(n);n.asOf='2027-02-29T12:00Z';rejects(n,'CURRENCY_DATE');
 n.asOf='2028-02-29T12:00Z';n.source.url='https://user:secret@example.invalid/';rejects(n,'UNSAFE_URL');
 const weather=example('weather-sidebar-title');weather.places[0].observedAt='2028-02-29T12:00:30.125Z';assert.equal(structural(weather),false);
});

test('currency numerical range checks retain cancellation of finite extreme intermediate ratios',()=>{
 const n=example('currency-converter');n.from='ABC';n.to='DEF';n.amount=1e-300;n.rates=[{currency:'ABC',rate:1e-300},{currency:'DEF',rate:1e300}];accepts(n);
 n.amount=1;rejects(n,'CURRENCY_RANGE');n.from=n.base;n.to='ABC';n.amount=1e-300;rejects(n,'CURRENCY_RANGE');
 n.rates[0].rate=null;accepts(n);
});

test('weather sidebar permits supplied extreme temperatures and independent unknowns but validates references',()=>{
 const n=example('weather-sidebar-title');n.places[0].temperature=-1000000;n.places[0].condition=null;n.places[0].observedAt=null;accepts(n);
 n.places[0].timezone='Invalid/Timezone';rejects(n,'TIMEZONE');n.places[0].timezone='UTC';n.initialPlaceId='missing';rejects(n,'WEATHER_PLACE');n.initialPlaceId='cedar';n.places[1].id='cedar';rejects(n,'DUPLICATE_ID');
 n.places.pop();n.places[0].observedAt='2027-02-29T12:00Z';rejects(n,'WEATHER_TIME');n.places[0].observedAt=null;n.places[0].temperature=-1000001;assert.equal(structural(n),false);
});

test('every supplied source scope enforces its existing absolute HTTP(S) rule',()=>{
 const source={label:'Original source',url:'mailto:test@example.invalid'};
 const cases=[['flight-results',n=>n.source=source],['flight-results',n=>n.results[0].source=source],['shared-activity-planner',n=>n.options[0].source=source],['event-sidebar',n=>n.source=source],['word-card',n=>n.source=source],['code-cite',n=>n.source=source],['file-cite',n=>n.pages[0].source=source],['sidebar-fact-table',n=>n.facts[0].source=source],['entity-thumbnail-list',n=>n.entities[0].source=source],['reddit-thread-card',n=>n.source=source],['weather-sidebar-title',n=>n.places[0].source=source]];
 for(const [type,change] of cases){const n=example(type);change(n);rejects(n,'UNSAFE_URL');}
 const thread=example('reddit-thread-card');thread.source.url='';assert.equal(structural(thread),false);delete thread.source.url;accepts(thread);
});
