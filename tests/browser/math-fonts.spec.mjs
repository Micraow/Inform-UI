import {test,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
async function glyphEvidence(page){
  await page.evaluate(()=>document.fonts.ready);const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');const results={};
  for(const selector of ['.katex-html .mathnormal','.katex-html .mathbb','.katex-html .op-symbol','.katex-html .delimsizing']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});expect(nodeId,selector).toBeGreaterThan(0);results[selector]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;expect(results[selector].some(f=>f.isCustomFont&&f.glyphCount>0&&f.familyName.startsWith('KaTeX_')),JSON.stringify(results)).toBe(true);}
  const faces=await page.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX')).map(f=>({family:f.family,style:f.style,weight:f.weight,status:f.status})));expect(faces.some(f=>f.family==='KaTeX_Math'&&f.style==='italic'&&f.status==='loaded')).toBe(true);expect(faces.some(f=>f.family==='KaTeX_AMS'&&f.status==='loaded')).toBe(true);
  return {platformFonts:results,fontFaces:faces,computed:await page.locator('.katex-html .mathnormal').first().evaluate(el=>({family:getComputedStyle(el).fontFamily,style:getComputedStyle(el).fontStyle}))};
}
for(const theme of ['light','dark'])for(const width of [390,1100])test(`offline math fonts ${theme} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.route('http{,s}://**/*',r=>r.abort());await page.goto(pathToFileURL(resolve('output/math-fonts.html')).href);await expect(page.locator('.katex-html')).toHaveCount(5);const evidence=await glyphEvidence(page);expect(requests.some(u=>/^https?:/.test(u))).toBe(false);expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await mkdir('test-results',{recursive:true});await writeFile(`test-results/math-offline-${theme}-${width}.json`,JSON.stringify(evidence,null,2));await page.screenshot({path:`test-results/math-offline-${theme}-${width}.png`,fullPage:true});
});
export {glyphEvidence};
