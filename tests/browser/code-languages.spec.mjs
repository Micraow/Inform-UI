import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const bundle=fileURLToPath(new URL('../../dist/v2/inform-core.global.js',import.meta.url));
const samples=JSON.parse(await readFile(new URL('../fixtures/code-language-samples.json',import.meta.url),'utf8'));
for(const theme of ['light','dark'])for(const width of [320,760])test(`all bundled code languages have visible syntax colors and exact copy in ${theme} at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:850});await page.goto('/mount.html');await page.addScriptTag({path:bundle});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(({samples,theme})=>{
  const nodes=samples.map(({language,value})=>'Code({value:'+JSON.stringify(value)+',language:'+JSON.stringify(language)+'})');
  nodes.push('Code({value:"const unchanged = 7",language:"cpp",highlight:false})','Code({value:"<img src=x onerror=bad()>",language:"not-a-language"})');
  window.codeLanguageApp=InformUI.mount(document.getElementById('host'),{theme,source:'root=Stack(['+nodes.join(',')+'])'});
  window.languageCopies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(value){window.languageCopies.push(value);return Promise.resolve();}}});
 },{samples,theme});
 const blocks=page.locator('[data-component=Code]');await expect(blocks).toHaveCount(samples.length+2);
 for(let index=0;index<samples.length;index++){
  const {language,value}=samples[index],block=blocks.nth(index),code=block.locator('code');
  expect(await code.textContent(),language).toBe(value);
  const colored=await code.evaluate(el=>{const plain=getComputedStyle(el).color;return [...el.querySelectorAll('span')].filter(span=>getComputedStyle(span).color!==plain).map(span=>span.className);});
  expect(colored.length,`${language} must have actual visible color, not merely spans`).toBeGreaterThan(0);
  await block.getByRole('button',{name:'Copy code'}).click();await expect(block.getByRole('status')).toHaveText('Code copied.');
  await expect(block.locator('script,img,iframe')).toHaveCount(0);
 }
 expect(await page.evaluate(()=>window.languageCopies)).toEqual(samples.map(x=>x.value));
 for(const index of [samples.length,samples.length+1])await expect(blocks.nth(index).locator('code span')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await blocks.nth(samples.findIndex(x=>x.language==='cpp')).screenshot({path:info.outputPath(`cpp-${theme}-${width}.png`)});
});
test('C++ types, CSS selectors, diff changes and fine-grained scopes receive shared palette colors',async({page})=>{
 await page.goto('/mount.html');await page.addScriptTag({path:bundle});
 await page.evaluate(()=>{window.app=InformUI.mount(document.getElementById('host'),{source:'root=Code({value:"literal",language:"text"})'});const code=document.querySelector('code');for(const kind of ['type','title','symbol','addition','deletion','meta-keyword','meta-string','selector-class','selector-id','selector-attr','selector-pseudo','attribute','property','variable-language_','variable-constant_','title-class_-inherited__','title-function_-invoke__','meta-prompt_','char-escape_']){const token=document.createElement('span');token.className='iui-code-token-'+kind;token.textContent=kind;code.append(token);}});
 const colors=await page.locator('code').evaluate(el=>{const base=getComputedStyle(el).color;return [...el.querySelectorAll('span')].map(span=>({kind:span.className,colored:getComputedStyle(span).color!==base}));});
 expect(colors.filter(x=>!x.colored)).toEqual([]);
 await page.emulateMedia({forcedColors:'active'});
 const forced=await page.locator('code span').evaluateAll(spans=>spans.map(span=>getComputedStyle(span).color));expect(new Set(forced).size).toBe(1);
});
