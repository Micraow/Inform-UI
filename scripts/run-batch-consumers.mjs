/** Original exact-input inline consumer runner. No workflow is activated by this module. */
import assert from 'node:assert/strict';
import {readFile,writeFile,lstat,mkdir,readdir,copyFile,symlink,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(actual,expected,why)=>assert.deepEqual(actual,expected,why);
const hex=(value,size)=>assert.match(value??'',new RegExp(`^[a-f0-9]{${size}}$`));
const git=(root,args)=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const portable=relative=>{assert.equal(typeof relative,'string');assert.ok(relative.length>0&&relative.length<240&&!path.posix.isAbsolute(relative)&&!relative.includes('\\')&&/^[A-Za-z0-9._/-]+$/.test(relative),'Unsafe relative path');assert.ok(relative.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Path traversal');return relative;};
async function inside(root,relative,{file=true,missing=false}={}){
 portable(relative);let current=path.resolve(root);const initial=await lstat(current);assert.ok(initial.isDirectory()&&!initial.isSymbolicLink(),'Unsafe root');
 const parts=relative.split('/');for(let i=0;i<parts.length;i++){current=path.join(current,parts[i]);let stat;try{stat=await lstat(current);}catch(error){if(missing&&error.code==='ENOENT')continue;throw error;}assert.equal(stat.isSymbolicLink(),false,'Symlink refused');if(i<parts.length-1)assert.ok(stat.isDirectory());else if(file)assert.ok(stat.isFile(),'Expected file');else assert.ok(stat.isDirectory(),'Expected directory');}return current;
}
const bytes=async(root,relative)=>readFile(await inside(root,relative));
async function tracked(root,relative){const file=await inside(root,relative);git(root,['ls-files','--error-unmatch','--',relative]);return file;}
async function files(root,relative){
 const directory=await inside(root,relative,{file:false}),out={};
 for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const at=relative+'/'+entry.name;assert.equal(entry.isSymbolicLink(),false,'Build symlink refused');if(entry.isDirectory())Object.assign(out,await files(root,at));else{assert.ok(entry.isFile());out[at]=hash(await bytes(root,at));}}
 return out;
}
const buildInputs=['src','bin','package.json','package-lock.json','tsconfig.json','LICENSE','THIRD_PARTY_NOTICES.md','scripts/build.mjs','scripts/build-cdn.mjs','scripts/math-assets.mjs','scripts/generate-schema.mjs','scripts/schema-subsets.mjs','scripts/schema-subset.mjs'];

/** Compare committed source and actual CDN bytes, then share one previously built runtime. */
export async function proveAndReuseBuild(coreRoot,assetRoot){
 for(const root of [coreRoot,assetRoot])equal(git(root,['status','--porcelain']),'','Committed clean build input required');
 equal(git(coreRoot,['ls-tree','-r','HEAD','--',...buildInputs]),git(assetRoot,['ls-tree','-r','HEAD','--',...buildInputs]),'Asset/core build inputs differ');
 const manifest=await bytes(coreRoot,'cdn/integrity.json');equal(await bytes(assetRoot,'cdn/integrity.json'),manifest,'CDN manifest differs');
 const integrity=JSON.parse(manifest);assert.ok(integrity.files&&Object.keys(integrity.files).length>0);
 const assetFiles={};
 for(const [name,expected]of Object.entries(integrity.files)){
  portable(name);const relative='cdn/'+name;await tracked(coreRoot,relative);await tracked(assetRoot,relative);
  const a=await bytes(coreRoot,relative),b=await bytes(assetRoot,relative);equal(a,b,'CDN bytes differ: '+name);equal(a.length,expected.bytes,'CDN byte count: '+name);equal(hash(a),expected.sha256,'CDN digest: '+name);
  equal('sha384-'+createHash('sha384').update(a).digest('base64'),expected.integrity,'CDN SRI: '+name);assetFiles[relative]=hash(a);
 }
 const built=await files(coreRoot,'dist');for(const required of ['dist/index.js','dist/browser.js','dist/standalone.js','dist/style.css'])assert.ok(built[required],'Missing built runtime '+required);
 // Only create missing files or verify equal existing files; never overwrite another build.
 for(const [relative,digest]of Object.entries(built)){
  const target=await inside(assetRoot,relative,{missing:true});let existing;
  try{existing=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(existing!==undefined)equal(hash(existing),digest,'Existing asset runtime differs: '+relative);
  else{await mkdir(path.dirname(target),{recursive:true});await copyFile(await inside(coreRoot,relative),target);}
 }
 equal(await files(assetRoot,'dist'),built,'Unexpected or different asset runtime files');
 // Dependencies are installed once from the same locked package.json/package-lock.json.
 const modules=path.join(assetRoot,'node_modules'),coreModules=path.join(coreRoot,'node_modules');
 assert.ok((await stat(coreModules)).isDirectory(),'Core dependencies must already be installed');
 // Keep node_modules a real ignored directory: a root symlink is not covered by
 // the repositories' node_modules/ ignore rule. Link each installed package only.
 try{const existing=await lstat(modules);assert.ok(existing.isDirectory()&&!existing.isSymbolicLink(),'Asset dependency root must be a directory');}
 catch(error){if(error.code!=='ENOENT')throw error;await mkdir(modules);}
 const installed=await readdir(coreModules);
 for(const name of installed){const target=path.join(modules,name),original=await realpath(path.join(coreModules,name));
  try{await lstat(target);equal(await realpath(target),original,'Existing asset dependency differs: '+name);}
  catch(error){if(error.code!=='ENOENT')throw error;await symlink(original,target,(await stat(original)).isDirectory()?'dir':'file');}
 }
 equal((await readdir(modules)).sort(),installed.sort(),'Unexpected asset dependencies');
 return {format:'inform-ui-build-equivalence/1',coreRevision:git(coreRoot,['rev-parse','HEAD']),assetRevision:git(assetRoot,['rev-parse','HEAD']),sourceTree:git(coreRoot,['rev-parse','HEAD:src']),buildInputPaths:buildInputs,distSha256:built,cdnSha256:assetFiles,integritySha256:hash(manifest)};
}

export async function runBatchConsumers({coreRoot,assetRoot,skillRoot,coreRevision,lockRelative,evidenceRoot}){
 for(const root of [coreRoot,assetRoot,skillRoot])assert.equal(git(root,['status','--porcelain']),'','Committed clean input required');
 hex(coreRevision,40);equal(git(coreRoot,['rev-parse','HEAD']),coreRevision,'Actual workflow revision mismatch');
 const lock=JSON.parse(await readFile(await tracked(coreRoot,lockRelative),'utf8'));equal(lock.format,'inform-ui-batch-lock/1');
 for(const field of ['assetRevision','skillRevision','assetTree','skillTree'])hex(lock[field],40);for(const field of ['schemaSha256','integritySha256'])hex(lock[field],64);
 equal(git(assetRoot,['rev-parse','HEAD']),lock.assetRevision,'Wrong asset revision');equal(git(assetRoot,['rev-parse','HEAD^{tree}']),lock.assetTree,'Wrong asset tree');equal(git(skillRoot,['rev-parse','HEAD']),lock.skillRevision,'Wrong Skill revision');equal(git(skillRoot,['rev-parse','HEAD^{tree}']),lock.skillTree,'Wrong Skill tree');
 for(const root of [coreRoot,assetRoot]){equal(hash(await bytes(root,'src/schema/iui.schema.json')),lock.schemaSha256,'Schema mismatch');equal(hash(await bytes(root,'cdn/integrity.json')),lock.integritySha256,'Integrity mismatch');}
 const exampleLanguages=JSON.parse(await readFile(await tracked(skillRoot,'references/example-languages.json'),'utf8'));
 assert.ok(exampleLanguages&&typeof exampleLanguages==='object'&&!Array.isArray(exampleLanguages),'Skill locale map required');
 assert.ok(Array.isArray(lock.consumers)&&lock.consumers.length>0);const names=new Set(),ids=new Set();
 // Validate the whole batch before running any script or writing evidence.
 for(const plan of lock.consumers){assert.match(plan.id??'',/^[a-z0-9-]{1,80}$/);assert.ok(!ids.has(plan.id),'Duplicate consumer');ids.add(plan.id);assert.ok(plan.script.startsWith('tests/consumer/'));hex(plan.scriptSha256,64);equal(hash(await readFile(await tracked(coreRoot,plan.script))),plan.scriptSha256,'Consumer script changed');equal(plan.widths,[390,768,1100]);equal(plan.themes,['light','dark']);assert.ok(Array.isArray(plan.examples)&&plan.examples.length>0);
  assert.ok(plan.exampleLanguages&&typeof plan.exampleLanguages==='object'&&!Array.isArray(plan.exampleLanguages),'Consumer locale map required');equal(Object.keys(plan.exampleLanguages).sort(),plan.examples.map(e=>e.name).sort(),'Consumer locale names differ');
  for(const [name,lang]of Object.entries(plan.exampleLanguages)){assert.ok(['en','zh-CN'].includes(lang),'Unsupported consumer locale');equal(lang,exampleLanguages[name],'Skill consumer locale differs: '+name);}
  for(const example of plan.examples){assert.match(example.name??'',/^[a-z0-9-]{1,100}$/);assert.ok(!names.has(example.name),'Duplicate example');names.add(example.name);assert.ok(example.corePath.startsWith('tests/consumer/'));hex(example.sha256,64);equal(hash(await readFile(await tracked(coreRoot,example.corePath))),example.sha256,'Core example changed');equal(hash(await readFile(await tracked(skillRoot,'examples/'+example.name+'.json'))),example.sha256,'Skill example changed');}
 }
 const proof=await proveAndReuseBuild(coreRoot,assetRoot);
 const unchangedBuild=async()=>{for(const root of [coreRoot,assetRoot])equal(await files(root,'dist'),proof.distSha256,'Ignored runtime changed after equivalence');};
 // Reject reuse of an old output directory: success must belong to fresh executions.
 const parent=path.dirname(path.resolve(evidenceRoot));assert.equal(await realpath(parent),parent,'Evidence parent must be a real directory');await mkdir(evidenceRoot);
 const coreTree=git(coreRoot,['rev-parse','HEAD^{tree}']);const receipt={format:'inform-ui-consumer-reuse/1',assetRevision:lock.assetRevision,coreRevision,coreTree,skillRevision:lock.skillRevision,skillTree:lock.skillTree,integritySha256:lock.integritySha256,schemaSha256:lock.schemaSha256,consumers:[]};
 for(const plan of lock.consumers){await unchangedBuild();const directory=path.join(evidenceRoot,plan.id);await mkdir(directory);const run=spawnSync(process.execPath,[await tracked(coreRoot,plan.script),'--library',path.resolve(coreRoot),'--revision',coreRevision,'--screenshots',path.resolve(directory)],{cwd:coreRoot,stdio:'inherit'});assert.equal(run.error,undefined);assert.equal(run.status,0,'Consumer failed: '+plan.id);await unchangedBuild();
  const reportBytes=await bytes(evidenceRoot,plan.id+'/RESULTS.json'),report=JSON.parse(reportBytes);equal(report.revision,coreRevision);equal(report.browser,'chromium');equal(report.widths,plan.widths);equal(report.themes,plan.themes);equal(report.exampleLanguages,plan.exampleLanguages,'Report locale mismatch');equal(report.localCompiledViews,plan.examples.length*6,'Incomplete views');equal(report.publicCdn,'not-run','Inline evidence only');
  const screenshots={};for(const example of plan.examples)for(const theme of plan.themes)for(const width of plan.widths){const name=`${example.name}-${theme}-${width}.png`,png=await bytes(evidenceRoot,plan.id+'/'+name);assert.ok(png.length>8&&png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid PNG signature');screenshots[name]=hash(png);}
  const actual=(await readdir(directory)).filter(name=>name.endsWith('.png')).sort();equal(actual,Object.keys(screenshots).sort(),'Unexpected screenshot');
  receipt.consumers.push({id:plan.id,status:'passed',exampleLanguages:plan.exampleLanguages,scriptSha256:plan.scriptSha256,evidenceDirectory:plan.id,reportSha256:hash(reportBytes),examples:plan.examples.map(({name,sha256})=>({name,sha256})),screenshots});
 }
 await unchangedBuild();
 // A script mutating any checkout invalidates the whole receipt.
 for(const root of [coreRoot,assetRoot,skillRoot])equal(git(root,['status','--porcelain']),'','Consumer changed committed inputs');
 const proofBytes=JSON.stringify(proof,null,2)+'\n';receipt.buildProofSha256=hash(proofBytes);
 await writeFile(path.join(evidenceRoot,'BUILD-EQUIVALENCE.json'),proofBytes,{flag:'wx'});
 await writeFile(path.join(evidenceRoot,'RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};const keys={'--core':'coreRoot','--asset':'assetRoot','--skill':'skillRoot','--revision':'coreRevision','--lock':'lockRelative','--evidence':'evidenceRoot'};
 assert.equal(args.length,12,'Require --core --asset --skill --revision --lock --evidence');for(let i=0;i<args.length;i+=2){assert.ok(keys[args[i]]&&!Object.hasOwn(options,keys[args[i]]),'Unknown/duplicate option');options[keys[args[i]]]=args[i+1];}await runBatchConsumers(options);
}
