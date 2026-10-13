import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {pages} from '../../showcase/gallery-data.js';
const samples=pages.flatMap(p=>p.columns.flat());
const ready=async page=>{await page.goto('/gallery.html');await expect(page.locator('html')).toHaveAttribute('data-ready','true');};
for(const width of [390,768,1440,1800])test(`gallery renders all compositions at ${width}px without external requests or card overflow`,async({page})=>{
 await page.setViewportSize({width,height:1200});const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:4176|data:|blob:)/.test(r.url()))external.push(r.url());});
 await ready(page);await expect(page.locator('.tile[data-status=mounted]')).toHaveCount(samples.length);await expect(page.locator('.tile-host > .iui-root')).toHaveCount(samples.length);
 for(const id of ['create','explore','compose']){await page.locator(`nav a[href="#${id}"]`).click();await expect.poll(()=>page.locator('.collection').evaluate(el=>Math.round(el.scrollLeft))).toBe(width*['create','explore','compose'].indexOf(id));}
 const overflow=await page.locator('.tile').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.dataset.sample));expect(overflow).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('gallery interactions, navigation and exact document download work',async({page})=>{
 await page.setViewportSize({width:1800,height:1200});await ready(page);
 const slider=page.locator('[data-sample=reading-plan] input[type=range]');await slider.focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-sample=reading-plan] .iui-metric')).toContainText('30');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download SLIDER · LIVE STATE JSON'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe('reading-plan.json');expect(JSON.parse(await readFile(await download.path(),'utf8'))).toEqual(samples.find(s=>s.id==='reading-plan').document);
 await page.locator('nav a[href="#compose"]').click();await page.locator('[data-sample=tabs]').getByRole('tab',{name:'Sunday'}).click();await expect(page.locator('[data-sample=tabs]')).toContainText('Make something from it.');
 const oldUrl=page.url();await page.locator('[data-sample=flight] .tile-host a').click();expect(page.url()).toBe(oldUrl);expect(page.context().pages()).toHaveLength(1);await expect(page.locator('#toast')).toBeVisible();
 await page.goBack();await expect(page.locator('.navigation nav a[href="#create"]')).toHaveAttribute('aria-current','page');
});
test('capture plates fit landscape frames without cropping their live cards',async({page})=>{
 await page.setViewportSize({width:2160,height:1440});await page.goto('/gallery.html?capture');await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 for(const id of ['create','explore','compose']){const panel=page.locator(`#${id}`);const box=await panel.boundingBox();expect(box.height).toBe(1440);const max=await panel.locator('.tile').evaluateAll(els=>Math.max(...els.map(el=>el.getBoundingClientRect().bottom)));expect(max).toBeLessThan(1410);}
});
