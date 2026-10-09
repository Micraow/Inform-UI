// Prepared for combined browser acceptance. Isolated news work does not execute these cases.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/news-article.json',import.meta.url),'utf8'));
async function setup(page,input=fixture){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(input=>{const host=document.getElementById('host');host.lang='zh-CN';window.newsController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},input);return requests;
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`news ${theme} ${width}: keyboard/pointer disclosure, whole content, intercepted source`,async({page,context})=>{
  await page.setViewportSize({width,height:960});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=await setup(page,{...fixture,theme});
  const article=page.locator('.iui-news-article').first(),details=article.locator('details'),summary=details.locator('summary');
  await expect(article).toHaveAttribute('aria-labelledby',/iui-news-internal/);await expect(details).not.toHaveAttribute('open','');
  await summary.focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');await expect(summary).toBeFocused();await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open','');
  await summary.click();await expect(details).toHaveAttribute('open','');await page.evaluate(()=>{window.newsSavedDetails=document.querySelector('.iui-news-details');window.newsSavedParagraph=document.querySelector('.iui-news-paragraph');});
  await summary.focus();await page.evaluate(()=>window.newsController.setState({other:1}));await expect(summary).toBeFocused();await expect(details).toHaveAttribute('open','');expect(await page.evaluate(()=>window.newsSavedDetails===document.querySelector('.iui-news-details')&&window.newsSavedParagraph===document.querySelector('.iui-news-paragraph'))).toBe(true);
  await expect(article.locator('.iui-news-paragraph')).toHaveText(fixture.body[0].paragraphs);await expect(article.locator('time')).toHaveText('2024-02-29');await expect(page.locator('.iui-news-article').nth(1).locator('details')).toHaveCount(0);await expect(page.locator('.iui-news-article').nth(2).locator('details')).toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);
  const link=article.locator('a');await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');await expect(link).toContainText('在新标签页中打开');
  let intercepted=0;await context.route('https://example.com/synthetic-reading-corner',async route=>{intercepted++;expect(route.request().headers().referer).toBeUndefined();await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Intercepted synthetic destination</title>'});});
  const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await expect(popup).toHaveTitle('Intercepted synthetic destination');expect(await popup.evaluate(()=>window.opener)).toBe(null);expect(intercepted).toBe(1);await popup.close();await expect(details).toHaveAttribute('open','');
  await summary.click();await summary.click();await expect(details).toHaveAttribute('open','');expect(errors).toEqual([]);await page.screenshot({path:`test-results/news-${theme}-${width}.png`,fullPage:true});
});

test('news genuine Arabic-first RTL and long literal text preserve paragraph and LTR publication date',async({page})=>{
  await page.setViewportSize({width:390,height:960});const input={version:'iui/1',description:'هذا مثال عربي أصلي لعرض مقال مُقدَّم، وليس خبراً حقيقياً أو موثقاً.',body:[{type:'news-article',headline:'زاوية القراءة في المكتبة الخيالية',source:{label:'نشرة خيالية للاختبار'},author:'كاتب خيالي',published:'0001-01-01',summary:'هذه قصة أصلية خيالية لاختبار القراءة. '.repeat(35),paragraphs:['هذه فقرة طويلة من المثال العربي. '.repeat(80),'نصمتصل'.repeat(200)],tags:['مثال','قراءة'],expanded:true}]};
  const requests=await setup(page,input);const article=page.locator('.iui-news-article');await expect(article).toHaveCSS('direction','rtl');await expect(article.locator('time')).toHaveCSS('direction','ltr');await expect(article.locator('time')).toHaveText('0001-01-01');await expect(article.locator('.iui-news-paragraph')).toHaveText(input.body[0].paragraphs);
  await article.locator('summary').click();await article.locator('summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);await page.screenshot({path:'test-results/news-rtl-390.png',fullPage:true});
});

test('news forced colors and native reading within disabled authored forms do not submit or affect snapshots',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await setup(page,{version:'iui/1',state:{locked:true},body:[{type:'form',label:'Local form',disabled:{$:'locked'},children:[fixture.body[0]]}]});
  const details=page.locator('.iui-news-details'),summary=details.locator('summary');await page.evaluate(()=>{window.newsSubmits=0;document.querySelector('form').addEventListener('submit',event=>{event.preventDefault();window.newsSubmits++;});});
  await summary.focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open','');await summary.click();await expect(details).toHaveAttribute('open','');
  await summary.focus();expect(await summary.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');expect(await page.evaluate(()=>window.newsSubmits)).toBe(0);expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);
  await page.evaluate(()=>{document.querySelector('form').reset();window.newsController.setState({locked:false});});await expect(details).toHaveAttribute('open','');await expect(summary).toBeFocused();await page.screenshot({path:'test-results/news-forced-colors.png',fullPage:true});
});

test('news touch disclosure repeats without changing article data or unrelated host state',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:960}}),page=await context.newPage();const requests=await setup(page);const details=page.locator('.iui-news-details').first(),summary=details.locator('summary');
  await summary.tap();await expect(details).toHaveAttribute('open','');await page.evaluate(()=>window.newsController.setState({other:1}));await expect(details).toHaveAttribute('open','');await summary.tap();await expect(details).not.toHaveAttribute('open','');await summary.tap();await expect(details).toHaveAttribute('open','');expect(requests).toEqual([]);await context.close();
});

test('news offline atomic updates, independent ownerDocument and disposal retain expected lifecycle',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);const summary=page.locator('.iui-news-details').first().locator('summary');await summary.click();await summary.focus();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML,focus=document.activeElement;try{window.newsController.update({version:'iui/1',body:[{type:'news-article',headline:'Bad',source:{label:'Source'},published:'1900-02-29'}]});return false;}catch{return before===host.innerHTML&&focus===document.activeElement;}})).toBe(true);
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);const doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);const controller=window.iui.mount(host,{version:'iui/1',body:[{type:'news-article',headline:'Other document',source:{label:'Source'},paragraphs:['Original body'],expanded:true}]});if(host.querySelector('details').ownerDocument!==doc)throw Error('Wrong ownerDocument');controller.dispose();frame.remove();});
  await page.evaluate(()=>{const outside=document.createElement('button');outside.textContent='Outside';document.body.append(outside);outside.focus();window.newsController.setState({other:2});if(document.activeElement!==outside)throw Error('Stolen focus');});
  await page.evaluate(input=>window.newsController.update(input),fixture);await expect(page.locator('.iui-news-details').first()).not.toHaveAttribute('open','');await expect(page.locator('.iui-news-details').nth(1)).toHaveAttribute('open','');await page.evaluate(()=>{window.newsController.dispose();window.newsController.dispose();});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});
