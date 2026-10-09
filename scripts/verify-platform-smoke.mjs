/** Small OS/Node gate; supplements, never replaces, primary full security/semantic tests. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
function arg(flag){const i=process.argv.indexOf(flag);if(i<0)return;const v=process.argv[i+1];assert.ok(v&&!v.startsWith('--'));return v;}
assert.ok(arg('--library'));const library=path.resolve(arg('--library')),revision=arg('--revision');assert.match(revision??'',/^[a-f0-9]{40}$/);
const head=spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'});assert.equal(head.status,0,head.stderr);assert.equal(head.stdout.trim(),revision);
const pkg=JSON.parse(await readFile(path.join(library,'package.json'),'utf8'));assert.equal(pkg.name,'@micraow/inform-ui');
const api=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].import)).href);for(const name of ['validateDocument','evaluateState','compileHtml','compileArtifact'])assert.equal(typeof api[name],'function',name);
const source='const emoji = "😀 中文";\r\n\t// literal </script> & source\r\n';
const document={version:'iui/1',title:'合成 platform smoke',state:{count:1},computed:{twice:{op:'mul',args:[{$:'count'},2]}},body:[{type:'text',value:'原创跨平台冒烟，不代表全部测试。'},{type:'metric',label:'合成值',value:{$:'twice'}},{type:'code',value:source}]};
const checked=api.validateDocument(document);assert.equal(checked.ok,true,JSON.stringify(checked.issues));assert.equal(api.evaluateState(document,{count:2}).computed.twice,4);
assert.equal(api.validateDocument({version:'iui/1',body:[{type:'link',value:'Unsafe synthetic',href:'javascript:invalid()'}]}).ok,false);
const original=JSON.stringify(document),options={assets:'inline',backend:'portable',lang:'zh-CN'},html=await api.compileHtml(document,options);assert.equal(await api.compileHtml(document,options),html);assert.equal(JSON.stringify(document),original);
const payload=html.match(/<script id="iui-data" type="application\/json">([\s\S]*?)<\/script>/);assert.ok(payload);assert.equal(JSON.parse(payload[1]).body[2].value,source);assert.equal(payload[1].includes('</script>'),false);
const temp=await mkdtemp(path.join(tmpdir(),'inform platform 中文 '));
const cli=args=>{const r=spawnSync(process.execPath,[path.join(library,'bin/iui.mjs'),...args],{encoding:'utf8',timeout:30000});assert.equal(r.error,undefined,r.error?.message);assert.equal(r.status,0,r.stderr);return r.stdout;};
const sha256=b=>createHash('sha256').update(b).digest('base64');
try{
 const input=path.join(temp,'输入 with spaces.json'),inline=path.join(temp,'结果 inline.html');await writeFile(input,JSON.stringify(document,null,2).replaceAll('\n','\r\n'));
 assert.equal(JSON.parse(cli(['validate',input,'--json'])).ok,true);cli(['build',input,'--out',inline,'--lang','zh-CN']);assert.equal(await readFile(inline,'utf8'),html);
 const sharedDir=path.join(temp,'shared 输出');await mkdir(sharedDir);const out=path.join(sharedDir,'index.html');cli(['build',input,'--out',out,'--assets','shared','--lang','zh-CN']);
 const artifact=await api.compileArtifact(document,{...options,assets:'shared'});assert.equal(await readFile(out,'utf8'),artifact.html);const entries=Object.entries(artifact.assets);assert.equal(entries.length,2);
 for(const [relative,value]of entries){assert.ok(relative.startsWith('iui-assets/')&&!relative.includes('..'));const actual=await readFile(path.join(sharedDir,relative),'utf8');assert.equal(actual,value);assert.ok(artifact.html.includes('sha256-'+sha256(actual)));assert.ok(artifact.html.includes('./'+relative));}
 const result={revision,platform:process.platform,architecture:process.arch,node:process.version,esm:'passed',api:'passed',unicodeAndCRLF:'passed',spaceAndUnicodePaths:'passed',inlineApiCliParity:'passed',sharedAssetsAndSRI:'passed',negativeSmoke:'passed',fullSecuritySuite:'run separately on primary platform',browser:'not-run'};
 if(arg('--report')){const report=path.resolve(arg('--report'));await mkdir(path.dirname(report),{recursive:true});await writeFile(report,JSON.stringify(result,null,2)+'\n');}console.log(JSON.stringify(result));
}finally{await rm(temp,{recursive:true,force:true});}
