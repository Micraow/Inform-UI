import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,cp,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runBatchConsumers} from '../scripts/run-batch-consumers.mjs';
import {verifyConsumerReuse} from './fixtures/consumer-reuse.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const command=(cwd,args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'}});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
async function put(root,file,body){const at=path.join(root,file);await mkdir(path.dirname(at),{recursive:true});await writeFile(at,body);}
const commit=root=>{command(root,['add','.']);command(root,['commit','-qm','Original synthetic test data']);return command(root,['rev-parse','HEAD']);};
async function fixture(t,mode='pass'){
 const root=await mkdtemp(path.join(tmpdir(),'inform-receipt-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const asset=path.join(root,'asset'),core=path.join(root,'core'),skill=path.join(root,'skill');await mkdir(asset);await mkdir(skill);command(asset,['init','-q']);command(skill,['init','-q']);
 await put(asset,'.gitignore','node_modules/\ndist/\n');
 const source='export const synthetic=true;\n',schema='{"synthetic":true}\n';await put(asset,'src/index.ts',source);await put(asset,'bin/iui.mjs','// synthetic CLI\n');await put(asset,'scripts/schema-subset.mjs','// synthetic subset CLI\n');await put(asset,'src/schema/iui.schema.json',schema);await put(asset,'package.json','{"name":"synthetic-receipt-fixture","private":true}\n');await put(asset,'package-lock.json','{}\n');
 await put(asset,'cdn/iui.js',source);const manifest=JSON.stringify({files:{'iui.js':{bytes:Buffer.byteLength(source),sha256:hash(source),integrity:'sha384-'+createHash('sha384').update(source).digest('base64')}}});await put(asset,'cdn/integrity.json',manifest);const assetRevision=commit(asset);
 const example='{"version":"iui/1","body":[]}\n';await put(skill,'examples/synthetic.json',example);await put(skill,'references/example-languages.json',JSON.stringify({synthetic:'en'}));const skillRevision=commit(skill);
 command(root,['clone','-q',asset,core]);await mkdir(path.join(core,'node_modules'));
 for(const name of ['index.js','browser.js','standalone.js','style.css'])await put(core,'dist/'+name,'synthetic fixture '+name);
 const script=`import {writeFile} from 'node:fs/promises';import path from 'node:path';const a=process.argv;const out=a[a.indexOf('--screenshots')+1],revision=a[a.indexOf('--revision')+1];const mode=${JSON.stringify(mode)};if(mode==='exit')process.exit(1);if(mode==='core-dist')await writeFile(path.join(a[a.indexOf('--library')+1],'dist/index.js'),'mutated');if(mode==='asset-dist')await writeFile(path.join(a[a.indexOf('--library')+1],'../asset/dist/index.js'),'mutated');const widths=[390,768,1100],themes=['light','dark'];for(const theme of themes)for(const width of widths){if(mode==='missing'&&theme==='dark'&&width===1100)continue;await writeFile(path.join(out,'synthetic-'+theme+'-'+width+'.png'),Buffer.from([137,80,78,71,13,10,26,10,0]));}await writeFile(path.join(out,'RESULTS.json'),JSON.stringify({revision:mode==='revision'?'a'.repeat(40):revision,browser:mode==='browser'?'fake':'chromium',widths,themes,exampleLanguages:mode==='locale-missing'?undefined:mode==='locale-extra'?{synthetic:'en',extra:'en'}:{synthetic:mode==='locale-wrong'?'zh-CN':'en'},localCompiledViews:mode==='views'?5:6,publicCdn:mode==='cdn'?'passed':'not-run'}));console.log('SYNTHETIC test files only; no browser executed');`;
 await put(core,'tests/consumer/synthetic.mjs',script);await put(core,'tests/consumer/synthetic.json',example);
 const lock={format:'inform-ui-batch-lock/1',assetRevision,assetTree:command(asset,['rev-parse','HEAD^{tree}']),skillRevision,skillTree:command(skill,['rev-parse','HEAD^{tree}']),integritySha256:hash(manifest),schemaSha256:hash(schema),consumers:[{id:'synthetic',script:'tests/consumer/synthetic.mjs',scriptSha256:hash(script),widths:[390,768,1100],themes:['light','dark'],exampleLanguages:{synthetic:'en'},examples:[{name:'synthetic',corePath:'tests/consumer/synthetic.json',sha256:hash(example)}]}]};
 await put(core,'batch-lock.json',JSON.stringify(lock));const coreRevision=commit(core);return {root,core,asset,skill,lock,options:{coreRoot:core,assetRoot:asset,skillRoot:skill,coreRevision,lockRelative:'batch-lock.json',evidenceRoot:path.join(root,'evidence')}};
}
async function relock(f){await put(f.core,'batch-lock.json',JSON.stringify(f.lock));f.options.coreRevision=commit(f.core);}
async function noReceipt(f){await assert.rejects(readFile(path.join(f.options.evidenceRoot,'RECEIPT.json')),e=>e.code==='ENOENT');}

test('synthetic producer record is accepted by strict receiver and preserves exact reusable build',async t=>{
 const f=await fixture(t);const r=await runBatchConsumers(f.options);assert.equal(r.consumers.length,1);assert.equal(Object.keys(r.consumers[0].screenshots).length,6);
 const verified=await verifyConsumerReuse({receiptPath:path.join(f.options.evidenceRoot,'RECEIPT.json'),lockPath:path.join(f.core,'batch-lock.json'),coreRoot:f.core,coreRevision:f.options.coreRevision,libraryRoot:f.asset,skillRoot:f.skill});assert.deepEqual([...verified.names],['synthetic']);assert.equal(verified.cdnsReused,0);
 const proof=JSON.parse(await readFile(path.join(f.options.evidenceRoot,'BUILD-EQUIVALENCE.json')));assert.equal(proof.assetRevision,f.lock.assetRevision);assert.equal(Object.keys(proof.distSha256).length,4);assert.equal(command(f.asset,['status','--porcelain']),'');
 await assert.rejects(runBatchConsumers(f.options),e=>e.code==='EEXIST');
});
for(const mode of ['exit','missing','revision','browser','views','cdn','locale-missing','locale-wrong','locale-extra','core-dist','asset-dist'])test('no receipt after synthetic '+mode+' failure',async t=>{const f=await fixture(t,mode);await assert.rejects(runBatchConsumers(f.options));await noReceipt(f);});
for(const mode of ['dirty','revision','script','example','skill','source','cli','subset-cli','asset-byte','build','extra-build','lock-path','traversal','duplicate','symlink','locale-missing','locale-wrong','locale-extra','locale-unsupported','locale-skill'])test('reject '+mode+' mismatch before accepting evidence',async t=>{
 const f=await fixture(t);
 if(mode==='dirty')await put(f.core,'unexpected.txt','uncommitted');
 if(mode==='revision')f.options.coreRevision='b'.repeat(40);
 if(mode==='locale-missing')delete f.lock.consumers[0].exampleLanguages;
 if(mode==='locale-wrong')f.lock.consumers[0].exampleLanguages.synthetic='zh-CN';
 if(mode==='locale-extra')f.lock.consumers[0].exampleLanguages.extra='en';
 if(mode==='locale-unsupported')f.lock.consumers[0].exampleLanguages.synthetic='fr';
 if(mode==='locale-skill'){await put(f.skill,'references/example-languages.json',JSON.stringify({synthetic:'zh-CN'}));f.lock.skillRevision=commit(f.skill);f.lock.skillTree=command(f.skill,['rev-parse','HEAD^{tree}']);}
 if(mode==='script')f.lock.consumers[0].scriptSha256='b'.repeat(64);
 if(mode==='example')f.lock.consumers[0].examples[0].sha256='b'.repeat(64);
 if(mode==='skill'){await put(f.skill,'examples/synthetic.json','{"changed":true}');f.lock.skillRevision=commit(f.skill);f.lock.skillTree=command(f.skill,['rev-parse','HEAD^{tree}']);}
 if(mode==='subset-cli')await put(f.core,'scripts/schema-subset.mjs','// changed subset CLI');
 if(mode==='cli')await put(f.core,'bin/iui.mjs','// changed synthetic CLI');
 if(mode==='source'){await put(f.core,'src/index.ts','changed runtime');}
 if(mode==='asset-byte'){await put(f.asset,'cdn/iui.js','changed asset');f.lock.assetRevision=commit(f.asset);f.lock.assetTree=command(f.asset,['rev-parse','HEAD^{tree}']);}
 if(mode==='build')await put(f.asset,'dist/index.js','different ignored runtime');
 if(mode==='extra-build')await put(f.asset,'dist/extra.js','extra ignored runtime');
 if(mode==='lock-path')f.options.lockRelative='../asset/cdn/integrity.json';
 if(mode==='traversal')f.lock.consumers[0].examples[0].corePath='tests/consumer/../../package.json';
 if(mode==='duplicate')f.lock.consumers.push(structuredClone(f.lock.consumers[0]));
 if(mode==='symlink'){await rm(path.join(f.core,'tests/consumer/synthetic.json'));await symlink(path.join(f.skill,'examples/synthetic.json'),path.join(f.core,'tests/consumer/synthetic.json'));}
 if(!['dirty','revision','build','extra-build','lock-path'].includes(mode))await relock(f);
 await assert.rejects(runBatchConsumers(f.options));await noReceipt(f);
});
