import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('parser and real contract imports, evaluation and interaction attempt no dynamic code or fetch',()=>{
 const result=spawnSync(process.execPath,['--disallow-code-generation-from-strings','--input-type=module','-e',`
 import assert from 'node:assert/strict';
 let attempts=0;
 globalThis.Function=function(){attempts++;throw Error('Dynamic code forbidden')};
 globalThis.eval=function(){attempts++;throw Error('Dynamic code forbidden')};
 globalThis.fetch=function(){attempts++;throw Error('Network forbidden')};
 const {createRuntime}=await import('./dist/index.js');
 const {createCatalog,resources,buildProfile}=await import('../component-contract/dist/index.mjs');
 const raw=createCatalog({adapters:{}});
 const adapters=Object.fromEntries(raw.flatMap(m=>m.components.map(c=>[c.name,{kind:'dom',key:c.name,create(){throw Error('No renderer used')}}])));
 const modules=createCatalog({adapters});
 const profile=buildProfile({id:'csp',root:'Stack',modules,select:['base/layout','base/controls'],resources});
 const r=createRuntime(profile);let result=r.commit('$x=1\\nroot=Stack([Slider("Value",$x,0,10),Button("Add",@Set($x,$x+1))])');
 assert.equal(result.ok,true,JSON.stringify(result));result=r.dispatchLocal(result.snapshot.tree.props.children[1].props.onPress);assert.equal(result.ok,true);assert.equal(result.snapshot.state.$x,2);assert.equal(attempts,0);
 `],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
