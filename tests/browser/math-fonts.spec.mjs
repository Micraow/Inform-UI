import {test,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
import{glyphEvidence}from'./math-evidence.mjs';
for(const theme of ['light','dark'])for(const width of [390,1100])test(`offline math fonts ${theme} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.route('http{,s}://**/*',r=>r.abort());await page.goto(pathToFileURL(resolve('output/math-fonts.html')).href);await expect(page.locator('.katex-html')).toHaveCount(5);const evidence=await glyphEvidence(page);expect(requests.some(u=>/^https?:/.test(u))).toBe(false);expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await mkdir('test-results',{recursive:true});await writeFile(`test-results/math-offline-${theme}-${width}.json`,JSON.stringify(evidence,null,2));await page.screenshot({path:`test-results/math-offline-${theme}-${width}.png`,fullPage:true});
});

