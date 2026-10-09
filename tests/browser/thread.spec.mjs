// Prepared acceptance specifications. UNEXECUTED in the isolated component handoff.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/reddit-thread-card.json',import.meta.url),'utf8'));
async function setup(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.threadController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},{input,lang});
  return requests;
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`thread ${theme} ${width}: native pointer/keyboard disclosures and persistent nested state`,async({page})=>{
  await page.setViewportSize({width,height:950});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',error=>errors.push(error.message));const requests=await setup(page,{...fixture,theme});
  const card=page.locator('.iui-thread').first(),top=card.locator('.iui-thread-discussion'),replies=card.locator('.iui-thread-replies');
  await expect(top).not.toHaveAttribute('open','');await top.locator(':scope > summary').click();await expect(top).toHaveAttribute('open','');
  for(const summary of await replies.locator(':scope > summary').all()){await summary.focus();await page.keyboard.press('Enter');await expect(summary.locator('..')).toHaveAttribute('open','');}
  await expect(card.locator('.iui-thread-comment')).toHaveCount(5);await expect(top.locator(':scope > summary')).toHaveText('Supplied comments and replies (5)');
  await page.evaluate(()=>window.threadNodes=[...document.querySelectorAll('.iui-thread *')]);const finalSummary=replies.last().locator(':scope > summary');await finalSummary.focus();
  await page.evaluate(()=>window.threadController.setState({other:1}));await expect(finalSummary).toBeFocused();
  expect(await page.evaluate(()=>window.threadNodes.every((node,index)=>node===document.querySelectorAll('.iui-thread *')[index]))).toBe(true);
  await top.locator(':scope > summary').click();await top.locator(':scope > summary').click();await expect(card.locator('.iui-thread-replies[open]')).toHaveCount(3);
  await finalSummary.focus();await page.keyboard.press('Space');await expect(replies.last()).not.toHaveAttribute('open','');await page.keyboard.press('Space');await expect(replies.last()).toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/thread-${theme}-${width}.png`,fullPage:true});
});

test('thread genuine Arabic-first long content reflows through four levels and forced colors',async({page})=>{
  await page.setViewportSize({width:320,height:1000});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const make=(depth)=>({id:'d'+depth,author:'شخصية خيالية',body:'هذا تعليق عربي خيالي أُعد للاختبار فقط. '.repeat(45)+'كلمة'.repeat(160),score:depth===1?-12:null,...(depth<4?{replies:[make(depth+1)]}:{})});
  const input={version:'iui/1',description:'مثال عربي خيالي لمناقشة قراءة دون اتصال بخدمة خارجية.',body:[{type:'reddit-thread-card',title:'مناقشة خيالية '.repeat(12),author:'شخصية خيالية',community:'مجموعة قراءة خيالية',body:'نص عربي خيالي للاختبار.\n'.repeat(80),source:{label:'مصدر خيالي محلي'},comments:[make(1)]}]};
  const requests=await setup(page,input,'ar');const card=page.locator('.iui-thread');await expect(card).toHaveCSS('direction','rtl');
  for(const summary of await card.locator('summary').all()){await summary.focus();await page.keyboard.press('Enter');}
  await expect(card.locator('[data-depth="4"]')).toBeVisible();await expect(card.locator('[data-comment-id="d1"] > article > .iui-thread-score bdi')).toHaveText('-12');
  const summary=card.locator('summary').last();await expect(summary).toBeFocused();expect(await summary.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);
  await page.screenshot({path:'test-results/thread-arabic-forced-colors-320.png',fullPage:true});
});

test('thread touch opens and closes every native nested level without resetting descendants',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:950}}),page=await context.newPage();const requests=await setup(page);const card=page.locator('.iui-thread').first();
  for(const summary of await card.locator('summary').all())await summary.tap();await expect(card.locator('details[open]')).toHaveCount(4);
  const top=card.locator('.iui-thread-discussion > summary');await top.tap();await top.tap();await expect(card.locator('details[open]')).toHaveCount(4);expect(requests).toEqual([]);await context.close();
});

test('thread disabled native fieldsets preserve reading disclosure/link keyboard and form independence',async({page})=>{
  const input={version:'iui/1',state:{locked:true},body:[{type:'form',label:'Synthetic form',disabled:{$:'locked'},children:[fixture.body[0]]}]};await setup(page,input);
  await page.evaluate(()=>{window.threadSubmits=0;document.querySelector('form').addEventListener('submit',event=>{event.preventDefault();window.threadSubmits++;});});
  const top=page.locator('.iui-thread-discussion > summary');await top.focus();await page.keyboard.press('Enter');await expect(top.locator('..')).toHaveAttribute('open','');await expect(top).toBeFocused();
  const link=page.locator('.iui-thread-link');await link.focus();await expect(link).toBeFocused();await expect(link).not.toBeDisabled();
  expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);expect(await page.evaluate(()=>window.threadSubmits)).toBe(0);
  await page.evaluate(()=>document.querySelector('form').reset());await expect(top.locator('..')).toHaveAttribute('open','');
});

test('thread source link opens only on activation with an intercepted local destination and no referrer',async({page,context})=>{
  const seen=[];await context.route('https://example.invalid/**',route=>{seen.push({url:route.request().url(),referer:route.request().headers().referer});return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Local intercepted synthetic source</title><p>Local fixture only.</p>'});});
  const requests=await setup(page);expect(seen).toEqual([]);expect(requests).toEqual([]);const link=page.locator('.iui-thread-link');await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');await expect(link).toContainText('Opens in a new tab');
  const popupPromise=context.waitForEvent('page');await link.click();const popup=await popupPromise;await popup.waitForLoadState();await expect(popup).toHaveTitle('Local intercepted synthetic source');expect(seen).toEqual([{url:'https://example.invalid/synthetic-discussion',referer:undefined}]);expect(await popup.evaluate(()=>window.opener===null)).toBe(true);await popup.close();
});

test('thread offline update atomicity, independent ownerDocument and disposal',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);await page.locator('.iui-thread-discussion > summary').click();await page.locator('.iui-thread-replies > summary').first().click();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML,focus=document.activeElement;try{window.threadController.update({version:'iui/1',body:[{type:'reddit-thread-card',title:'Invalid',author:'A',body:'B',source:{label:'S',url:'javascript:alert(1)'},comments:[]}]});return false;}catch{return before===host.innerHTML&&focus===document.activeElement;}})).toBe(true);
  await page.evaluate(input=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const controller=window.iui.mount(host,input);if(host.querySelector('.iui-thread').ownerDocument!==frame.contentDocument)throw Error('Wrong ownerDocument');controller.dispose();frame.remove();},fixture);
  await page.evaluate(()=>{const outside=document.createElement('button');outside.textContent='Outside';document.body.append(outside);outside.focus();window.threadController.setState({other:2});if(document.activeElement!==outside)throw Error('Focus changed');window.threadController.dispose();window.threadController.dispose();});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});

for(const width of [390,768,1100])test(`thread bounded flow containment ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const input=structuredClone(fixture);input.body=[{type:'flow',children:[{...fixture.body[0],expanded:true},{type:'text',value:'Independent supplied sibling'}]}];
 await setup(page,input);const card=page.locator('.iui-flow > .iui-thread');for(const summary of await card.locator('.iui-thread-replies > summary').all())await summary.click();
 const bounds=await card.boundingBox();expect(bounds).not.toBeNull();expect(bounds.width).toBeGreaterThanOrEqual(200);expect(bounds.width).toBeLessThanOrEqual(width);
 expect(await card.evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/thread-flow-${width}.png`,fullPage:true});
});
