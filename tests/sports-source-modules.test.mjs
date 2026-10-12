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
import {SPORTS_SOURCE_MODULES,TEST_MODULES} from './sports-source-fixture.mjs';

const sourceIdentity={algorithm:'sha256',value:'original-sports-source-test'};
const select=ids=>buildSelection(ids,{modules:TEST_MODULES,sourceIdentity});
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const examples=new Map(await Promise.all(SPORTS_SOURCE_MODULES.map(async m=>[m.id,JSON.parse(await read(m.examplePaths[0]))])));
const validators=new Map(SPORTS_SOURCE_MODULES.map(m=>[m.id,new Ajv2020({strict:true,allErrors:true}).compile(select([m.id]).schema)]));
const example=type=>structuredClone([...examples.values()].flatMap(d=>d.body).find(n=>n.type===type));
const structural=(id,node)=>validators.get(id)({version:'iui/1',body:[node]});
const moduleFor=type=>SPORTS_SOURCE_MODULES.find(m=>m.nodeTypes.includes(type)).id;

// Transpile only unchanged semantic inspectors, with no renderer/build/bundle step.
// These focused checks do not substitute for public validateDocument or browser acceptance.
const inspectorURLs=new Map();
async function inspector(name){
 if(!inspectorURLs.has(name)){
  let js=ts.transpileModule(await read('src/core/'+name+'.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  for(const dep of ['travel-events','extensions'])if(js.includes("'./"+dep+".js'"))js=js.replaceAll("'./"+dep+".js'",JSON.stringify(await inspector(dep)));
  inspectorURLs.set(name,'data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 }
 return inspectorURLs.get(name);
}
const imports=await Promise.all(['motorsport','sports','match-scores','supplied-results','boxscores','player-summaries'].map(async name=>import(await inspector(name))));
const inspectByType={};
for(const [types,fn] of [
 [['f1-races','f1-standings'],imports[0].inspectMotorsport],
 [['sports-schedule','sports-scoreboard','sports-standings'],imports[1].inspectSports],
 [['nba-scores','soccer-games','american-football-games'],imports[2].inspectMatchScores],
 [['basketball-tournament','election-results'],imports[3].inspectSuppliedResults],
 [['nba-game-boxscore','cricket-match-boxscore'],imports[4].inspectBoxscore],
 [['nba-player-summary','tennis-player-summary'],imports[5].inspectPlayerSummary],
])for(const type of types)inspectByType[type]=fn;
// The exact unchanged public safe-link function, without evaluating the rest of core/index.
const indexSource=await read('src/core/index.ts');
const safeSource=indexSource.slice(indexSource.indexOf('export function isSafeURL('),indexSource.indexOf('\nconst svgNumeric'));
const safeJS=ts.transpileModule(safeSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {isSafeURL}=await import('data:text/javascript;base64,'+Buffer.from(safeJS).toString('base64'));
const issues=node=>{const out=[];inspectByType[node.type](node,'/body/0',i=>out.push(i),isSafeURL);return out;};
const accepts=node=>{assert.equal(structural(moduleFor(node.type),node),true,JSON.stringify(validators.get(moduleFor(node.type)).errors));assert.deepEqual(issues(node),[]);};
const rejects=(node,code)=>{assert.equal(structural(moduleFor(node.type),node),true,'negative must reach unchanged semantic inspector');assert.ok(issues(node).some(i=>i.code===code),JSON.stringify(issues(node)));};

test('sports source registrations declare exact original providers and output groups',async()=>{
 const full=await buildCanonicalSchema();
 for(const m of SPORTS_SOURCE_MODULES){
  const registry=createSchemaRegistry(TEST_MODULES);registry.use(m.id);registry.finalize();
  for(const name of m.provides)assert.deepEqual(registry.defs[name],full.schema.$defs[name],name);
  for(const type of m.nodeTypes)assert.equal(registry.owners[type],type==='election-results'?'base':'sports');
  const registered=SCHEMA_MODULES.find(x=>x.id===m.id);
  if(registered)for(const field of ['dependsOn','provides','nodeTypes','contractPath','semanticContractPaths','examplePaths','sourcePath'])assert.deepEqual(registered[field],m[field],m.id+' '+field);
  const code=await read(m.sourcePath);assert.doesNotMatch(code,/readFile|canonical\.mjs|iui\.schema|buildCanonical|JSON\.parse/);
  for(const path of [...m.semanticContractPaths,...m.examplePaths])assert.ok((await read(path)).length>0,path);
 }
 assert.equal(SPORTS_SOURCE_MODULES.flatMap(m=>m.nodeTypes).length,14);
});

test('proposed canonical replacements retain the exact 218-node full serialized schema',async()=>{
 const canonicalURL=new URL('../scripts/schema-source/canonical.mjs',import.meta.url);
 let source=await readFile(canonicalURL,'utf8');
 for(const m of SPORTS_SOURCE_MODULES){
  const module=await read(m.sourcePath),start=module.indexOf('export function install({defs,node}){\n')+'export function install({defs,node}){\n'.length;
  const original=module.slice(start,-2);
  if(source.includes(original))source=source.replace(original,`registry.use('${m.id}');\n`);
  else assert.ok(source.includes(`registry.use('${m.id}')`),'missing original source block or installation '+m.id);
 }
 source=source.replace('const registry=createSchemaRegistry();','const registry=createSchemaRegistry(TEST_MODULES);');
 source=source.replaceAll('import.meta.url',JSON.stringify(canonicalURL.href));
 source=source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,(_,quote,path)=>'from '+JSON.stringify(new URL(path,canonicalURL).href));
 source=`import {TEST_MODULES} from ${JSON.stringify(new URL('./sports-source-fixture.mjs',import.meta.url).href)};\n`+source;
 const {buildCanonicalSchema:proposed}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const actual=await proposed();
 assert.equal(actual.nodes.length,218);assert.equal(Object.keys(actual.owners).length,218);
 assert.equal(JSON.stringify(actual.schema,null,2)+'\n',await read('src/schema/iui.schema.json'));
});

test('five isolated examples are closed and include exactly their stated dependency nodes',()=>{
 for(const m of SPORTS_SOURCE_MODULES){
  const {schema,manifest}=select([m.id]);assertClosedReferences(schema);
  assert.equal(validators.get(m.id)(examples.get(m.id)),true,JSON.stringify(validators.get(m.id).errors));
  assert.equal(manifest.components.length,m.nodeTypes.length+(m.id==='sports/model'?0:4));
  assert.deepEqual(manifest.resolvedModules,m.id==='sports/model'?['shared/value',m.id]:['shared/value','travel/snapshots',m.id]);
  for(const n of examples.get(m.id).body)accepts(n);
  assert.equal(validators.get(m.id)({version:'iui/1',body:[{type:'timer',durationMs:1000}]}),false);
 }
});

test('all sports families compose deterministically with text and no unrelated base inflation',()=>{
 const ids=SPORTS_SOURCE_MODULES.map(m=>m.id).concat('foundations/text'),a=select(ids),b=select([...ids].reverse());
 assert.deepEqual(a,b);assert.equal(a.manifest.components.length,21);
 const encoded=JSON.stringify(a.schema,null,2)+'\n';assert.equal(a.manifest.sha256,createHash('sha256').update(encoded).digest('hex'));
 const validate=new Ajv2020({strict:true,allErrors:true}).compile(a.schema);
 const doc={version:'iui/1',body:[{type:'text',value:'Original fictional supplied data'},...[...examples.values()].flatMap(d=>d.body)]};
 assert.equal(validate(doc),true,JSON.stringify(validate.errors));
 assert.equal(a.schema.$defs.OpenaiNode,undefined);assert.equal(a.schema.$defs.CalculatorQsofaScoreNode,undefined);
});

test('short text is not secretly trimmed and optional empty text is preserved across all 14 nodes',()=>{
 for(const type of Object.keys(inspectByType)){
  const n=example(type);if('label'in n)n.label=' ';else n.data.league.name=' ';
  if('description'in n||!type.startsWith('sports-'))n.description='';
  accepts(n);
  if('label'in n){n.label='';assert.equal(structural(moduleFor(type),n),false,type);}
 }
});

test('both ID families reject trailing newlines while keeping their original pattern definitions',()=>{
 const n=example('f1-races');n.races[0].id+='\n';assert.equal(structural('sports/motorsport',n),false);
 const legacy=example('sports-scoreboard');legacy.data.league.id+='\n';assert.equal(structural('sports/model',legacy),false);
 assert.notEqual(select(['sports/model']).schema.$defs.SportsTeam.properties.id.pattern,select(['sports/motorsport']).schema.$defs.MotorsportRace.properties.id.pattern);
});

test('motorsport IDs and rounds are locally unique, not globally coupled',()=>{
 const n=example('f1-races'),race=structuredClone(n.races[0]);race.id='other';race.round=2;n.races.push(race);accepts(n);
 n.races[1].round=1;rejects(n,'MOTORSPORT_ROUND');n.races[1].round=2;n.races[1].id=n.races[0].id;rejects(n,'DUPLICATE_ID');
 n.races.pop();n.races[0].sessions.push(structuredClone(n.races[0].sessions[0]));rejects(n,'DUPLICATE_ID');
});

test('motorsport interval uses offset-adjusted instants and nullable start needs no fabricated time',()=>{
 const n=example('f1-races'),s=n.races[0].sessions[0];s.startsAt='2028-02-29T10:00Z';s.endsAt='2028-02-29T11:00+01:00';rejects(n,'MOTORSPORT_INTERVAL');
 s.endsAt='2028-02-29T11:01+01:00';accepts(n);s.startsAt=null;rejects(n,'MOTORSPORT_INTERVAL');delete s.endsAt;accepts(n);
 s.startsAt='2027-02-29T10:00Z';rejects(n,'MOTORSPORT_TIME');
});

test('motorsport ranks points and wins retain precise numerical bounds and ties',()=>{
 const n=example('f1-standings');n.standings[0].points=-0.5;n.standings[1].rank=1;accepts(n);
 n.standings[0].rank=0;assert.equal(structural('sports/motorsport',n),false);n.standings[0].rank=null;n.standings[0].points=1000001;assert.equal(structural('sports/motorsport',n),false);
});

test('legacy sports timestamp and source exceptions do not leak into strict supplied match readers',()=>{
 const n=example('sports-scoreboard');n.data.updatedAt='2028-02-29T12:00:30.123+15:00';n.data.source.url='#supplied';accepts(n);
 n.data.source.url='';accepts(n);n.data.source.url='https://user:secret@example.invalid/';rejects(n,'UNSAFE_URL');
 const strict=example('nba-scores');strict.observedAt='2028-02-29T12:00:30.123Z';assert.equal(structural('sports/match-scores',strict),false);
 strict.observedAt='2028-02-29T12:00+15:00';assert.equal(structural('sports/match-scores',strict),false);
 strict.observedAt='2028-02-29T12:00Z';strict.source.url='#supplied';rejects(strict,'UNSAFE_URL');
});

test('sports model validates participant references and scheduled scores only where intended',()=>{
 const n=example('sports-scoreboard'),g=n.data.games[0];g.homeScore=0;rejects(n,'SPORTS_STATUS');g.status='postponed';accepts(n);
 g.winnerTeamId='cedar';rejects(n,'SPORTS_RESULT');delete g.winnerTeamId;g.tieBreak={label:'Supplied tie break',home:0,away:null};rejects(n,'SPORTS_STATUS');delete g.tieBreak;
 g.homeTeam='missing';rejects(n,'SPORTS_TEAM');g.homeTeam='harbor';rejects(n,'SPORTS_TEAM');
});

test('sports model records and filters keep exact cross-field rules and zero/null exceptions',()=>{
 const n=example('sports-standings'),row=n.data.standings[0];row.played=2;rejects(n,'SPORTS_RECORD');row.drawn=null;accepts(n);row.won=3;rejects(n,'SPORTS_RECORD');row.played=null;accepts(n);
 n.initialGroup='missing';rejects(n,'SPORTS_FILTER');n.initialGroup='Sample';n.initialTeamId='missing';rejects(n,'SPORTS_FILTER');
 const schedule=example('sports-schedule');schedule.initialDate='2027-02-29';rejects(schedule,'SPORTS_DATE');schedule.initialDate='2028-02-29';schedule.initialStage='missing';rejects(schedule,'SPORTS_FILTER');
});

test('sports periods and stats each enforce only their own label uniqueness',()=>{
 const n=example('sports-scoreboard'),g=n.data.games[1];g.stats[0].label=g.periodScores[0].label;accepts(n);
 g.periodScores.push(structuredClone(g.periodScores[0]));rejects(n,'SPORTS_PERIOD');g.periodScores.pop();g.stats.push(structuredClone(g.stats[0]));rejects(n,'SPORTS_STAT');
});

test('match scores preserve supplied scheduled outcomes but still check team and leader/event references',()=>{
 for(const type of ['nba-scores','soccer-games','american-football-games']){
  const n=example(type),g=n.games[0];g.status='scheduled';g.homeScore=10;g.awayScore=20;g.outcome='home-win';g.startsAt=null;accepts(n);
  g.awayTeamId='missing';rejects(n,'SCORE_TEAM');
 }
 const nba=example('nba-scores');nba.games[0].leaders[0].teamId='missing';rejects(nba,'SCORE_PARTICIPANT');
 const soccer=example('soccer-games');soccer.games[0].events[0].teamId='missing';rejects(soccer,'SCORE_PARTICIPANT');
});

test('football period positions, event links and nullable situation remain distinct constraints',()=>{
 const n=example('american-football-games'),g=n.games[0];g.periods[0].number=5;rejects(n,'FOOTBALL_QUARTER');g.periods[0].kind='overtime';accepts(n);
 g.periods.push({...g.periods[0],id:'different'});rejects(n,'FOOTBALL_PERIOD');g.periods.pop();g.events[0].periodId='missing';rejects(n,'FOOTBALL_PERIOD');g.events[0].periodId=null;g.possessionTeamId=null;g.situation=null;accepts(n);
});

test('strict supplied Gregorian validation rejects civil rollover without requiring array chronology',()=>{
 for(const type of ['f1-standings','nba-scores','election-results','nba-game-boxscore','nba-player-summary']){
  const n=example(type);n.observedAt='2027-02-29T12:00Z';assert.ok(issues(n).some(i=>i.code.endsWith('_TIME')),type);
  n.observedAt='2028-02-29T12:00+14:00';accepts(n);
 }
});

test('tournament matches have global IDs and later-round references without inferring progression',()=>{
 const n=example('basketball-tournament'),m=n.rounds[0].matches[0];m.status='scheduled';m.participants[0].score=0;m.participants[1].score=100;accepts(n);
 m.advancesTo=m.id;rejects(n,'RESULT_ADVANCE');m.advancesTo='missing';rejects(n,'RESULT_ADVANCE');m.advancesTo='later';
 n.rounds[1].matches[0].id=m.id;rejects(n,'DUPLICATE_ID');
});

test('tournament unknown slots, winner membership and team membership remain explicit',()=>{
 const n=example('basketball-tournament'),m=n.rounds[0].matches[0];m.participants[1].teamId=m.participants[0].teamId;rejects(n,'RESULT_PARTICIPANT');
 m.participants[1].teamId='missing';rejects(n,'RESULT_TEAM');m.participants[1].teamId=null;m.winnerTeamId='harbor';rejects(n,'RESULT_WINNER');
 m.winnerTeamId=null;m.participants[0].teamId=null;accepts(n);
});

test('election counts and percentages are bounded without total or status inference',()=>{
 const n=example('election-results'),c=n.contests[0];c.status='complete';c.totalVotes=0;c.reportedPercent=null;c.candidates[0].votes=Number.MAX_SAFE_INTEGER;c.candidates[0].voteShare=99.5;c.candidates[0].outcome='elected';accepts(n);
 c.candidates[1].id=c.candidates[0].id;rejects(n,'DUPLICATE_ID');c.candidates[1].id='candidate_b';n.contests.push({...structuredClone(c),id:'another'});accepts(n);
 c.candidates[0].votes=Number.MAX_SAFE_INTEGER+1;assert.equal(structural('results/supplied',n),false);c.candidates[0].votes=0;c.candidates[0].voteShare=100.01;assert.equal(structural('results/supplied',n),false);
});

test('boxscore IDs are per collection and supplied totals, text and statuses are not recalculated',()=>{
 const n=example('nba-game-boxscore');n.status='scheduled';n.teams[0].score=999;n.teams[1].players=[structuredClone(n.teams[0].players[0])];n.periods.push(structuredClone(n.periods[0]));accepts(n);
 n.teams[0].players.push(structuredClone(n.teams[0].players[0]));rejects(n,'DUPLICATE_ID');n.teams[0].players.pop();n.teams[0].players[0].plusMinus=-1000001;assert.equal(structural('sports/statistics',n),false);
 const cricket=example('cricket-match-boxscore');cricket.innings[0].wickets=11;cricket.innings[0].overs='opaque supplied text';accepts(cricket);cricket.innings[0].teamId='missing';rejects(cricket,'BOXSCORE_TEAM');
});

test('player statistics keep nullable unknowns, duplicate periods and opaque cross-field totals',()=>{
 const n=example('tennis-player-summary');n.records.push({...structuredClone(n.records[0]),id:'other'});accepts(n);n.records[1].id=n.records[0].id;rejects(n,'DUPLICATE_ID');n.records.pop();n.records[0].rank=0;assert.equal(structural('sports/statistics',n),false);
 const nba=example('nba-player-summary');nba.records[0].pointsPerGame=10000;accepts(nba);nba.records[0].pointsPerGame=10000.01;assert.equal(structural('sports/statistics',nba),false);nba.records[0].pointsPerGame=null;delete nba.records[0].games;assert.equal(structural('sports/statistics',nba),false);
});

test('every supplied family enforces safe absolute HTTP(S) source links',()=>{
 for(const type of Object.keys(inspectByType).filter(type=>!type.startsWith('sports-'))){
  const n=example(type);if(type==='f1-races')n.races[0].source={label:'source',url:'mailto:test@example.invalid'};else if(type==='f1-standings')n.standings[0].source={label:'source',url:'mailto:test@example.invalid'};else n.source={label:'source',url:'mailto:test@example.invalid'};
  rejects(n,'UNSAFE_URL');
 }
});
test('integrated central registrations match all authored sports metadata',()=>{for(const proposed of SPORTS_SOURCE_MODULES){const actual=SCHEMA_MODULES.find(m=>m.id===proposed.id);assert.ok(actual,proposed.id);for(const key of ['provides','nodeTypes','dependsOn','semanticContractPaths'])assert.deepEqual(actual[key],proposed[key],proposed.id+' '+key);assert.equal(actual.install,proposed.install)}});
