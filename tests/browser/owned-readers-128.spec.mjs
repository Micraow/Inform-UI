import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const cases=[];
for(const file of ['ledger-records','player-summaries','motorsport','boxscores']){
 const spec=JSON.parse(await readFile(new URL(`../../examples/${file}.json`,import.meta.url)));
 for(const node of spec.body)cases.push({version:'iui/1',state:spec.state??{},body:[node]});
}
for(const shadow of [false,true])test(`supplied readers permanently retire same-turn restored ancestor: shadow=${shadow}`,async({page})=>{
 await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 const results=await page.evaluate(({cases,shadow})=>cases.map(spec=>{
  const host=document.getElementById('host'),ancestor=document.createElement('section');host.replaceChildren(ancestor);
  const parent=shadow?ancestor.attachShadow({mode:'open'}):ancestor,slot=document.createElement('div');parent.append(slot);
  const controller=window.iui.mount(slot,spec),input=slot.querySelector('input[type=search]'),root=input.closest('section'),before=root.innerHTML;
  ancestor.remove();host.append(ancestor);
  input.value='no-match-ownership-probe';input.dispatchEvent(new Event('input',{bubbles:true}));
  const retiredUnchanged=root.innerHTML===before;controller.dispose();
  const fresh=window.iui.mount(slot,spec),newInput=slot.querySelector('input[type=search]'),newRoot=newInput.closest('section'),freshBefore=newRoot.innerHTML;
  newInput.value='no-match-ownership-probe';newInput.dispatchEvent(new Event('input',{bubbles:true}));
  const freshWorks=newRoot.innerHTML!==freshBefore;fresh.dispose();
  return {type:spec.body[0].type,retiredUnchanged,freshWorks};
 }),{cases,shadow});
 expect(results).toHaveLength(8);
 for(const result of results){expect(result.retiredUnchanged,result.type).toBe(true);expect(result.freshWorks,result.type).toBe(true);}
});
