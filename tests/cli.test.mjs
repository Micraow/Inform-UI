import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const run=(...args)=>spawnSync(process.execPath,['bin/iui.mjs',...args],{encoding:'utf8',timeout:30000});
const source='root=Stack([Text("Original DSL answer")])';

test('DSL CLI check, inspect, catalog and prompt use the current profile',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iui-cli-'));
 try{
  const file=join(dir,'answer.openui');await writeFile(file,source);
  const checked=run('check',file,'--json');assert.equal(checked.status,0,checked.stderr);assert.equal(JSON.parse(checked.stdout).language,'openui');
  const inspected=run('inspect',file);assert.equal(inspected.status,0,inspected.stderr);assert.equal(JSON.parse(inspected.stdout).tree.typeName,'Stack');
  const catalog=run('catalog','--select','base/layout,base/text');assert.equal(catalog.status,0,catalog.stderr);assert.ok(JSON.parse(catalog.stdout));
  const prompt=run('prompt','--select','base/layout,base/text');assert.equal(prompt.status,0,prompt.stderr);assert.match(prompt.stdout,/Text/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('DSL CLI build preserves source and copies the matching runtime with notices',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'inform CLI 中文 '));
 try{
  const literal='const emoji = "😀 中文";\r\n\t// literal </script> & source\r\n';
  const value='root=Stack([Code({value:'+JSON.stringify(literal)+',language:"javascript"})])';
  const file=join(dir,'输入 with spaces.openui'),out=join(dir,'结果.html');await writeFile(file,value);
  const result=run('build',file,'--out',out,'--lang','zh-CN','--title','<Original> & "title"','--theme','dark');assert.equal(result.status,0,result.stderr);
  const html=await readFile(out,'utf8');assert.match(html,/<!doctype html>/);assert.match(html,/&lt;Original&gt; &amp; &quot;title&quot;/);
  const payload=html.match(/id="inform-source" type="application\/json">([\s\S]*?)<\/script>/)?.[1];assert.ok(payload);assert.equal(payload.includes('</script>'),false);assert.equal(JSON.parse(payload).source,value);assert.equal(JSON.parse(payload).theme,'dark');
  assert.deepEqual(await readFile(join(dir,'inform-ui.global.js')),await readFile('dist/v2/inform-ui.global.js'));
  assert.deepEqual(await readFile(join(dir,'THIRD_PARTY_NOTICES.txt')),await readFile('dist/v2/THIRD_PARTY_NOTICES.txt'));
  assert.equal(await readFile(file,'utf8'),value);
  assert.equal(run('build',file,'--out',file).status,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('DSL CLI rejects JSON authoring, invalid DSL and old command/options',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iui-cli-invalid-'));
 try{
  const file=join(dir,'answer.openui');await writeFile(file,'{"version":"iui/1","body":[]}');
  const invalid=run('check',file,'--json');assert.equal(invalid.status,1);assert.equal(JSON.parse(invalid.stdout).ok,false);
  await writeFile(file,'root=MissingComponent("no")');assert.equal(run('check',file).status,1);
  await writeFile(file,source);
  for(const args of [['validate',file],['doctor'],['build',file,'--out',join(dir,'out.html'),'--assets','inline'],['check',file,'--unknown'],['check',file,'--json','--json']])assert.equal(run(...args).status,2,args.join(' '));
  for(const url of ['javascript:alert(1)','https://user:password@example.com/a.js','//example.com/a.js'])assert.equal(run('build',file,'--out',join(dir,'out.html'),'--runtime-url',url).status,2,url);
  assert.equal(run('build',file,'--out',join(dir,'out.html'),'--runtime-url','https://example.com/runtime.js').status,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
