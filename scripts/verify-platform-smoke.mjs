/** Small OS/Node DSL package gate; no browser or network is used. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
function arg(flag){const i=process.argv.indexOf(flag);if(i<0)return;const value=process.argv[i+1];assert.ok(value&&!value.startsWith('--'));return value;}
assert.ok(arg('--library'));const library=path.resolve(arg('--library')),revision=arg('--revision');assert.match(revision??'',/^[a-f0-9]{40}$/);
const head=spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'});assert.equal(head.status,0,head.stderr);assert.equal(head.stdout.trim(),revision);
const pkg=JSON.parse(await readFile(path.join(library,'package.json'),'utf8'));assert.equal(pkg.name,'@micraow/inform-ui');
const api=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].default)).href);
assert.deepEqual(Object.keys(api),['createBaseProfile','createDefaultProfile','createProfile','createRuntime','mount','prompt','version']);
const literal='const emoji = "😀 中文";\r\n\t// literal </script> & source\r\n';
const source='root=Stack([Text("Original platform smoke"),Code({value:'+JSON.stringify(literal)+',language:"javascript"})])';
const runtime=api.createRuntime(api.createDefaultProfile());
try{const result=runtime.commit(source);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(runtime.commit('{"version":"iui/1","body":[]}').ok,false);assert.equal(runtime.commit({version:'iui/1',body:[]}).ok,false);}finally{runtime.dispose();}
const temp=await mkdtemp(path.join(tmpdir(),'inform platform 中文 '));
const cli=args=>{const result=spawnSync(process.execPath,[path.join(library,'bin/iui.mjs'),...args],{encoding:'utf8',timeout:30000});assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,result.stderr);return result.stdout;};
try{
 const input=path.join(temp,'输入 with spaces.openui'),out=path.join(temp,'结果.html');await writeFile(input,source);
 assert.equal(JSON.parse(cli(['check',input,'--json'])).ok,true);assert.equal(JSON.parse(cli(['inspect',input])).tree.typeName,'Stack');
 cli(['build',input,'--out',out,'--lang','zh-CN']);const html=await readFile(out,'utf8');
 const payload=html.match(/id="inform-source" type="application\/json">([\s\S]*?)<\/script>/)?.[1];assert.ok(payload);assert.equal(JSON.parse(payload).source,source);assert.equal(payload.includes('</script>'),false);
 for(const name of ['inform-ui.global.js','THIRD_PARTY_NOTICES.txt'])assert.deepEqual(await readFile(path.join(temp,name)),await readFile(path.join(library,'dist/v2',name)));
 const result={revision,platform:process.platform,architecture:process.arch,node:process.version,esm:'passed',dslAPI:'passed',unicodeAndCRLF:'passed',spaceAndUnicodePaths:'passed',cliAndLocalAssets:'passed',licenseNotices:'passed',legacyJSONRejected:'passed',browser:'not-run'};
 if(arg('--report')){const report=path.resolve(arg('--report'));await mkdir(path.dirname(report),{recursive:true});await writeFile(report,JSON.stringify(result,null,2)+'\n');}console.log(JSON.stringify(result));
}finally{await rm(temp,{recursive:true,force:true});}
