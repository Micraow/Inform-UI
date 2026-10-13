import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
test('import, schema generation, prompt generation and validation execute with Function/eval disabled', () => {
  const source = `
    let dynamicCalls = 0;
    globalThis.Function = function () { dynamicCalls++; throw new Error('Dynamic code forbidden'); };
    globalThis.eval = function () { dynamicCalls++; throw new Error('Eval forbidden'); };
    const {createCatalog, buildProfile, resources, textAdapter, barChartAdapter} = await import('./dist/index.mjs');
    const catalog = createCatalog({adapters:{Text:textAdapter,BarChart:barChartAdapter}});
    const modules=catalog.map(mod=>mod.id==='base/text'?{...mod,components:mod.components.filter(def=>def.name==='Text')}:mod);
    const profile=buildProfile({id:'csp/probe',root:'Text',modules,resources,select:['base/text','base/charts']});
    if(!profile.componentRules.Text.validateProps({content:'safe'}).ok) throw new Error('Validation failed');
    if(!profile.componentRules.BarChart.validateProps({title:'T',labels:['A'],series:[{name:'S',values:[1]}]}).ok) throw new Error('Chart validation failed');
    if(!profile.prompt().includes('BarChart')) throw new Error('Prompt failed');
    if(dynamicCalls!==0) throw new Error('Attempted dynamic code: '+dynamicCalls);
    console.log('CSP-safe: zero dynamic-code attempts');
  `;
  const result=spawnSync(process.execPath,['--disallow-code-generation-from-strings','--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/zero dynamic-code attempts/);
});
