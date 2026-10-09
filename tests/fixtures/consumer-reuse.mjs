/** Strict optional inline-evidence reuse. Trusted expectations never come from receipt. */
import assert from 'node:assert/strict';
import {readFile,lstat,readdir} from 'node:fs/promises';
import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
const hex=(value,length,label)=>assert.match(value??'',new RegExp(`^[a-f0-9]{${length}}$`),label);
const equal=(a,b,label)=>assert.deepEqual(a,b,label);
const unique=(items,label)=>{assert.equal(new Set(items).size,items.length,label);};
const git=(root,args)=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
async function within(root,relative){
 assert.equal(typeof relative,'string');assert.ok(relative.length>0&&relative.length<240);
 assert.ok(!path.posix.isAbsolute(relative)&&!relative.includes('\\')&&/^[A-Za-z0-9._/-]+$/.test(relative),'Unsafe evidence path');
 const parts=relative.split('/');assert.ok(parts.every(p=>p&&p!=='.'&&p!=='..'),'Path traversal');
 let current=path.resolve(root);const initial=await lstat(current);assert.ok(initial.isDirectory()&&!initial.isSymbolicLink(),'Unsafe supplied root');
 for(const part of parts){current=path.join(current,part);const stat=await lstat(current);assert.equal(stat.isSymbolicLink(),false,'Evidence symlink refused');}
 assert.ok((await lstat(current)).isFile(),'Expected evidence file');return current;
}
async function bytes(root,relative){return readFile(await within(root,relative));}

const buildInputPaths=['src','bin','package.json','package-lock.json','tsconfig.json','LICENSE','THIRD_PARTY_NOTICES.md','scripts/build.mjs','scripts/build-cdn.mjs','scripts/math-assets.mjs','scripts/generate-schema.mjs','scripts/schema-subsets.mjs','scripts/schema-subset.mjs'];
async function runtimeFiles(root,relative='dist'){
 const directory=path.join(root,relative),stat=await lstat(directory);assert.ok(stat.isDirectory()&&!stat.isSymbolicLink(),'Runtime directory symlink refused');const out={};
 for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const at=relative+'/'+entry.name;assert.equal(entry.isSymbolicLink(),false,'Runtime symlink refused');
  if(entry.isDirectory())Object.assign(out,await runtimeFiles(root,at));else{assert.ok(entry.isFile(),'Runtime must contain only ordinary files');out[at]=hash(await bytes(root,at));}
 }return out;
}
async function verifyBuildProof({receipt,evidenceRoot,coreRoot,libraryRoot,coreRevision,lock}){
 hex(receipt.buildProofSha256,64,'Build proof hash required');
 const proofBytes=await bytes(evidenceRoot,'BUILD-EQUIVALENCE.json');equal(hash(proofBytes),receipt.buildProofSha256,'Build proof digest mismatch');
 const proof=JSON.parse(proofBytes);equal(proof.format,'inform-ui-build-equivalence/1');equal(proof.coreRevision,coreRevision,'Build proof core revision');equal(proof.assetRevision,lock.assetRevision,'Build proof asset revision');equal(proof.integritySha256,lock.integritySha256,'Build proof manifest');equal(proof.buildInputPaths,buildInputPaths,'Build proof input scope');
 for(const root of [coreRoot,libraryRoot])equal(git(root,['rev-parse','HEAD:src']),proof.sourceTree,'Build proof source tree');
 equal(git(coreRoot,['ls-tree','-r','HEAD','--',...buildInputPaths]),git(libraryRoot,['ls-tree','-r','HEAD','--',...buildInputPaths]),'Asset/core build inputs differ');
 assert.ok(proof.distSha256&&typeof proof.distSha256==='object'&&!Array.isArray(proof.distSha256),'Build proof runtime map');
 for(const required of ['dist/index.js','dist/browser.js','dist/standalone.js','dist/style.css'])hex(proof.distSha256[required],64,'Required runtime '+required);
 for(const root of [coreRoot,libraryRoot])equal(await runtimeFiles(root),proof.distSha256,'Current runtime differs from proven build');
 const manifest=JSON.parse(await bytes(libraryRoot,'cdn/integrity.json')),cdn={};assert.ok(manifest.files&&Object.keys(manifest.files).length>0,'Empty CDN manifest');
 for(const [name,expected]of Object.entries(manifest.files)){
  const relative='cdn/'+name;
  for(const root of [coreRoot,libraryRoot]){git(root,['ls-files','--error-unmatch','--',relative]);const content=await bytes(root,relative);equal(content.length,expected.bytes,'CDN byte count');equal(hash(content),expected.sha256,'CDN hash');equal('sha384-'+createHash('sha384').update(content).digest('base64'),expected.integrity,'CDN SRI');}
  cdn[relative]=expected.sha256;
 }equal(proof.cdnSha256,cdn,'Build proof CDN map');
}

export async function verifyConsumerReuse({receiptPath,lockPath,coreRoot,coreRevision,libraryRoot,skillRoot}){
 for(const root of [coreRoot,libraryRoot,skillRoot])assert.equal(typeof root,'string');hex(coreRevision,40,'Expected workflow core revision');
 const lockRelative=path.relative(path.resolve(coreRoot),path.resolve(lockPath)).split(path.sep).join('/');
 const committedLock=await within(coreRoot,lockRelative);git(coreRoot,['ls-files','--error-unmatch',lockRelative]);
 const receiptStat=await lstat(receiptPath);assert.ok(receiptStat.isFile()&&!receiptStat.isSymbolicLink()&&receiptStat.size<=2000000,'Unsafe receipt file');
 const lock=JSON.parse(await readFile(committedLock,'utf8')),receipt=JSON.parse(await readFile(receiptPath,'utf8'));
 equal(lock.format,'inform-ui-batch-lock/1');equal(receipt.format,'inform-ui-consumer-reuse/1');
 for(const name of ['assetRevision','skillRevision','assetTree','skillTree'])hex(lock[name],40,name);
 for(const name of ['integritySha256','schemaSha256'])hex(lock[name],64,name);
 equal(git(coreRoot,['rev-parse','HEAD']),coreRevision,'Workflow checkout mismatch');
 equal(git(libraryRoot,['rev-parse','HEAD']),lock.assetRevision,'Wrong asset checkout');
 equal(git(skillRoot,['rev-parse','HEAD']),lock.skillRevision,'Wrong Skill checkout');
 for(const root of [coreRoot,libraryRoot,skillRoot])equal(git(root,['status','--porcelain']),'','Reuse requires clean committed inputs');
 const coreTree=git(coreRoot,['rev-parse','HEAD^{tree}']);equal(git(libraryRoot,['rev-parse','HEAD^{tree}']),lock.assetTree);equal(git(skillRoot,['rev-parse','HEAD^{tree}']),lock.skillTree);
 for(const[name,value]of Object.entries({assetRevision:lock.assetRevision,coreRevision,coreTree,skillRevision:lock.skillRevision,skillTree:lock.skillTree,integritySha256:lock.integritySha256,schemaSha256:lock.schemaSha256}))equal(receipt[name],value,'Receipt '+name+' mismatch');
 equal(hash(await bytes(libraryRoot,'cdn/integrity.json')),lock.integritySha256,'Asset manifest mismatch');equal(hash(await bytes(coreRoot,'cdn/integrity.json')),lock.integritySha256,'Tested build/asset manifest mismatch');
 equal(hash(await bytes(libraryRoot,'src/schema/iui.schema.json')),lock.schemaSha256,'Asset schema mismatch');equal(hash(await bytes(coreRoot,'src/schema/iui.schema.json')),lock.schemaSha256,'Core schema mismatch');
 assert.ok(Array.isArray(lock.consumers)&&lock.consumers.length>0);assert.ok(Array.isArray(receipt.consumers));unique(lock.consumers.map(c=>c.id),'Duplicate planned consumer');unique(receipt.consumers.map(c=>c.id),'Duplicate recorded consumer');
 equal(receipt.consumers.map(c=>c.id).sort(),lock.consumers.map(c=>c.id).sort(),'Missing/extra consumer record');
 git(skillRoot,['ls-files','--error-unmatch','references/example-languages.json']);
 const languageMap=JSON.parse(await bytes(skillRoot,'references/example-languages.json'));
 assert.ok(languageMap && typeof languageMap==='object' && !Array.isArray(languageMap),'Committed language map required');
 for(const [name,lang] of Object.entries(languageMap)){assert.match(name,/^[a-z0-9-]{1,100}$/);assert.ok(lang==='en'||lang==='zh-CN','Only en/zh-CN example languages are supported');}
 const evidenceRoot=path.dirname(path.resolve(receiptPath)),names=new Set(),reused=[];
 await verifyBuildProof({receipt,evidenceRoot,coreRoot,libraryRoot,coreRevision,lock});
 for(const plan of lock.consumers){
  assert.match(plan.id??'',/^[a-z0-9-]{1,80}$/);hex(plan.scriptSha256,64,'Script hash');assert.ok(plan.script.startsWith('tests/consumer/'),'Only declared original consumers are reusable');
  equal(hash(await bytes(coreRoot,plan.script)),plan.scriptSha256,'Consumer script changed');equal(plan.widths,[390,768,1100]);equal(plan.themes,['light','dark']);assert.ok(Array.isArray(plan.examples)&&plan.examples.length>0);unique(plan.examples.map(e=>e.name),'Duplicate example');
  assert.ok(plan.exampleLanguages && typeof plan.exampleLanguages==='object' && !Array.isArray(plan.exampleLanguages),'Planned example languages required');
  equal(Object.keys(plan.exampleLanguages).sort(),plan.examples.map(e=>e.name).sort(),'Missing/extra planned language');
  for(const entry of plan.examples){assert.ok(Object.hasOwn(languageMap,entry.name),'Example missing from committed language map');equal(plan.exampleLanguages[entry.name],languageMap[entry.name],'Skill/plan example locale mismatch');}
  const record=receipt.consumers.find(c=>c.id===plan.id);equal(record.exampleLanguages,plan.exampleLanguages,'Receipt example locale mismatch');equal(record.status,'passed');equal(record.scriptSha256,plan.scriptSha256);hex(record.reportSha256,64,'Report hash');
  equal(record.examples,plan.examples.map(e=>({name:e.name,sha256:e.sha256})),'Recorded examples mismatch');
  const reportBytes=await bytes(evidenceRoot,record.evidenceDirectory+'/RESULTS.json');equal(hash(reportBytes),record.reportSha256,'RESULTS digest mismatch');const report=JSON.parse(reportBytes);
  equal(report.exampleLanguages,plan.exampleLanguages,'RESULTS example locale mismatch');equal(report.revision,coreRevision,'RESULTS actual revision mismatch');equal(report.browser,'chromium','Wrong browser evidence');equal(report.widths,plan.widths);equal(report.themes,plan.themes);equal(report.localCompiledViews,plan.examples.length*6,'Incomplete views');equal(report.publicCdn,'not-run','Only inline consumer reuse is supported');
  const expectedImages=[];
  for(const entry of plan.examples){
   assert.match(entry.name??'',/^[a-z0-9-]{1,100}$/);hex(entry.sha256,64,'Example hash');assert.ok(entry.corePath.startsWith('tests/consumer/'),'Consumer example path');assert.equal(names.has(entry.name),false,'Ambiguous duplicate coverage');names.add(entry.name);
   equal(hash(await bytes(coreRoot,entry.corePath)),entry.sha256,'Core example changed');equal(hash(await bytes(skillRoot,'examples/'+entry.name+'.json')),entry.sha256,'Skill/core example bytes differ');
   for(const theme of plan.themes)for(const width of plan.widths){const name=`${entry.name}-${theme}-${width}.png`;expectedImages.push(name);hex(record.screenshots?.[name],64,'Screenshot hash');const png=await bytes(evidenceRoot,record.evidenceDirectory+'/'+name);assert.ok(png.length>8&&png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Missing/invalid PNG signature');equal(hash(png),record.screenshots[name],'Screenshot digest mismatch');}
   reused.push({name:entry.name,lang:languageMap[entry.name],mode:'inline',consumer:plan.id,views:6});
  }
  equal(Object.keys(record.screenshots??{}).sort(),expectedImages.sort(),'Missing/extra screenshot record');
 }
 return {names:new Set(reused.map(r=>r.name)),records:reused,coreRevision,coreTree,assetRevision:lock.assetRevision,skillRevision:lock.skillRevision,cdnsReused:0};
}

/** A verified inline receipt can never replace a CDN-mode run, even for identical JSON. */
export function reusableInlineRecord(reuse,{name,mode,lang}) {
 assert.ok(mode==='inline'||mode==='cdn','Explicit asset mode required');
 assert.ok(lang==='en'||lang==='zh-CN','Only en/zh-CN example languages are supported');
 if(mode!=='inline'||!reuse?.names.has(name))return null;
 const record=reuse.records.find(record=>record.name===name);
 assert.ok(record,'Missing verified reuse record');equal(record.mode,'inline','Only inline record eligible');equal(record.lang,lang,'Reused inline locale mismatch');
 return record;
}
