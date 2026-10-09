/** Run only the current Skill contract and unique browser checks against one proven asset build. */
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const git=(root,args)=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
export function acceptanceCommands({assetRoot,coreRoot,coreRevision,lockPath,receiptPath,assetRevision,testFiles}){
 const lib=['--library',assetRoot],pinned=[...lib,'--revision',assetRevision];
 assert.ok(testFiles.length>0&&testFiles.every(f=>/^tests\/[A-Za-z0-9._-]+\.test\.mjs$/.test(f)));
 return [
  {id:'skill-tests',args:['--test',...testFiles]},
  {id:'public-api-cli-and-literals',args:['scripts/validate-examples.mjs',...lib]},
  {id:'schema-discovery-and-subsets',args:['scripts/verify-schema-index.mjs',...lib]},
  {id:'generated-inventory',args:['scripts/derive-node-support.mjs','--check',...lib]},
  {id:'foundation-guidance',args:['scripts/verify-next-guidance.mjs',...pinned]},
  {id:'primitive-guidance',args:['scripts/verify-primitive-guidance.mjs',...pinned]},
  {id:'loading-sources-guidance',args:['scripts/verify-next66-guidance.mjs',...pinned]},
  {id:'candidate-input-lock',args:['scripts/generate-pending-lock.mjs','--source-repository',assetRoot,...pinned,'--check']},
  {id:'prepared-consumer-source',args:['scripts/check-pending-browser-source.mjs',...lib]},
  {id:'accumulated-guidance',args:['scripts/verify-pending-batch.mjs',...pinned]},
  {id:'unique-cdn-and-inline-browser',browser:true,args:['scripts/verify-browser.mjs',...lib,'--screenshots','artifacts/examples','--reuse-consumer-receipt',receiptPath,'--reuse-lock',lockPath,'--consumer-core',coreRoot,'--consumer-revision',coreRevision]},
 ];
}
export async function runSkillAcceptance({skillRoot,assetRoot,coreRoot,coreRevision,lockPath,receiptPath}){
 for(const r of [skillRoot,assetRoot,coreRoot])assert.equal(git(r,['status','--porcelain']),'','Clean frozen checkout required');
 const lock=JSON.parse(await readFile(lockPath,'utf8'));assert.equal(lock.format,'inform-ui-batch-lock/1');
 assert.equal(git(coreRoot,['rev-parse','HEAD']),coreRevision);assert.equal(git(assetRoot,['rev-parse','HEAD']),lock.assetRevision);assert.equal(git(skillRoot,['rev-parse','HEAD']),lock.skillRevision);assert.equal(git(skillRoot,['rev-parse','HEAD^{tree}']),lock.skillTree);
 const contract=JSON.parse(await readFile(path.join(skillRoot,'library-contract.json'),'utf8'));assert.equal(contract.revision,lock.assetRevision,'Skill must use the exact immutable asset checkout');
 const {verifyConsumerReuse}=await import(pathToFileURL(path.join(skillRoot,'scripts/verify-consumer-reuse.mjs')).href);
 await verifyConsumerReuse({receiptPath,lockPath,coreRoot,coreRevision,libraryRoot:assetRoot,skillRoot});
 const testFiles=(await readdir(path.join(skillRoot,'tests'))).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f);
 const commands=acceptanceCommands({assetRoot,coreRoot,coreRevision,lockPath,receiptPath,assetRevision:lock.assetRevision,testFiles});
 const results=[];const report=path.join(skillRoot,'artifacts/batch-acceptance.json');await mkdir(path.dirname(report),{recursive:true});
 try{
  for(const command of commands){
   // Collect all source-only outcomes, but never spend browser execution on failed preconditions.
   if(command.browser)assert.ok(results.every(r=>r.status==='passed'),'Skill source preconditions failed; browser not executed');
   const run=spawnSync(process.execPath,command.args,{cwd:skillRoot,stdio:'inherit',timeout:command.browser?20*60_000:10*60_000});
   results.push({id:command.id,status:!run.error&&run.status===0?'passed':'failed',exitCode:run.status,error:run.error?.message??null});
  }
  assert.ok(results.every(r=>r.status==='passed'),'One or more Skill checks failed');
  for(const r of [skillRoot,assetRoot,coreRoot])assert.equal(git(r,['status','--porcelain']),'','Acceptance changed committed inputs');
  // Includes ignored build digests: a clean tracked tree alone is insufficient.
  await verifyConsumerReuse({receiptPath,lockPath,coreRoot,coreRevision,libraryRoot:assetRoot,skillRoot});
 }finally{
  await writeFile(report,JSON.stringify({format:'inform-ui-skill-batch-acceptance/1',coreRevision,coreTree:git(coreRoot,['rev-parse','HEAD^{tree}']),assetRevision:lock.assetRevision,skillRevision:lock.skillRevision,skillTree:lock.skillTree,results,historicalBlindInputs:'Retained byte-lock checks; unchanged historical runtimes/browser outputs retain their separate prior acceptance evidence.'},null,2)+'\n');
 }
 return results;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={},keys={'--skill':'skillRoot','--asset':'assetRoot','--core':'coreRoot','--revision':'coreRevision','--lock':'lockPath','--receipt':'receiptPath'};assert.equal(args.length,12);
 for(let i=0;i<args.length;i+=2){assert.ok(keys[args[i]]&&!Object.hasOwn(options,keys[args[i]]));options[keys[args[i]]]=args[i]==='--revision'?args[i+1]:path.resolve(args[i+1]);}
 await runSkillAcceptance(options);
}
