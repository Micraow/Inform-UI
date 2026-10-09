import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const places=JSON.parse(await readFile(new URL('../../examples/location-choice-request.json',import.meta.url),'utf8'));
const photos=JSON.parse(await readFile(new URL('../../examples/business-gallery.json',import.meta.url),'utf8'));
const png=Buffer.from(photos.body[0].images[2].src.split(',')[1],'base64');
const fixture={version:'iui/1',body:[places.body[0],photos.body[0]]};
// Prepared acceptance only; no browser is launched in isolated component development.
async function setup(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.route('https://example.invalid/*.png',route=>route.fulfill({status:200,contentType:'image/png',body:png}));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.choiceEvents=[];host.addEventListener('iui:location-choice',e=>window.choiceEvents.push({...e.detail}));window.choiceController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},{input,lang});
  return requests;
}
const choice=(page,id='courtyard')=>page.locator(`[data-option-id=${id}]`);
const media=(page,id='courtyard')=>page.locator(`[data-image-id=${id}]`);
// Playwright locator.click treats aria-disabled as disabled; use a genuine hit-tested
// pointer action to verify the intentionally focusable native boundary button.
async function boundaryClick(page,locator){const b=await locator.boundingBox();expect(b).not.toBeNull();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`choice/gallery ${theme} ${width}: pointer, keyboard, independent consent and responsive figures`,async({page})=>{
  await page.setViewportSize({width,height:1100});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=await setup(page,{...fixture,theme});
  const clear=page.locator('.iui-location-choice-clear');await expect(media(page).locator('img')).toHaveCount(0);await expect(media(page,'terrace').locator('img')).toHaveCount(0);expect(requests).toEqual([]);
  await clear.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await boundaryClick(page,clear);await expect(clear).toBeFocused();expect(await page.evaluate(()=>window.choiceEvents)).toEqual([]);
  await choice(page).click();await expect(choice(page)).toHaveAttribute('aria-pressed','true');await choice(page,'lobby').focus();await page.keyboard.press('Space');await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.choiceEvents.length)).toBe(3);await expect(page.locator('.iui-location-choice-selection')).toContainText('Example lobby');
  await clear.click();await expect(clear).toHaveAttribute('aria-disabled','true');await boundaryClick(page,clear);await expect(clear).toBeFocused();expect(await page.evaluate(()=>window.choiceEvents.length)).toBe(3);
  const caption=media(page).locator('figcaption');await expect(caption).toHaveText('Fictional supplied courtyard view.');await media(page).getByRole('button',{name:'Load external image'}).focus();await page.keyboard.press('Enter');await expect(media(page).locator('figure')).toHaveAttribute('data-image-status','loaded');
  await expect(media(page).locator('img')).toHaveAttribute('referrerpolicy','no-referrer');await expect(media(page).locator('img')).toHaveCSS('object-fit','contain');await expect(caption).toHaveText('Fictional supplied courtyard view.');await expect(media(page,'terrace').locator('img')).toHaveCount(0);expect(requests).toEqual(['https://example.invalid/courtyard.png']);
  const second=media(page,'terrace').getByRole('button');await second.focus();await page.evaluate(()=>{window.savedGalleryCaption=document.querySelector('[data-image-id=courtyard] figcaption');window.savedGalleryImage=document.querySelector('[data-image-id=courtyard] img');window.choiceController.setState({other:1});});await expect(second).toBeFocused();expect(await page.evaluate(()=>window.savedGalleryCaption===document.querySelector('[data-image-id=courtyard] figcaption')&&window.savedGalleryImage===document.querySelector('[data-image-id=courtyard] img'))).toBe(true);
  await second.click();await expect(media(page,'terrace').locator('figure')).toHaveAttribute('data-image-status','loaded');expect(requests).toEqual(['https://example.invalid/courtyard.png','https://example.invalid/terrace.png']);
  expect(await page.locator('.iui-location-choice button').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await page.screenshot({path:`test-results/choice-gallery-${theme}-${width}.png`,fullPage:true});
});

test('choice/gallery Arabic-first RTL, long alt/caption, failed media and forced colors retain readable focus',async({page})=>{
  await page.setViewportSize({width:390,height:1000});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const input={version:'iui/1',body:[{...places.body[0],label:'اختر مكان الاجتماع',description:'أماكن مقدمة فقط. '.repeat(50),options:[{id:'courtyard',label:'الفناء التجريبي '.repeat(10),address:'العنوان المقدم '.repeat(30)}]},{...photos.body[0],label:'صور المكان المقدمة',images:[{id:'courtyard',src:'https://example.invalid/missing.png',alt:'صورة مقدمة غير متاحة '.repeat(50),caption:'وصف طويل مقدم دون تحقق '.repeat(50)}]}]};
  const requests=await setup(page,input,'zh-CN');await page.route('https://example.invalid/missing.png',route=>route.fulfill({status:404,contentType:'text/plain',body:'Synthetic unavailable image'}));
  await expect(page.locator('.iui-location-choice')).toHaveCSS('direction','rtl');await expect(page.locator('.iui-business-gallery')).toHaveCSS('direction','rtl');await expect(page.locator('.iui-business-gallery-note')).toContainText('未经核实');
  await choice(page).focus();await page.keyboard.press('Space');await expect(choice(page)).toHaveAttribute('aria-pressed','true');expect(await choice(page).evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await media(page).getByRole('button',{name:'加载外部图片'}).click();await expect(media(page).locator('figure')).toHaveAttribute('data-image-status','error');await expect(media(page).locator('img')).toHaveAttribute('alt',input.body[1].images[0].alt);await expect(media(page).locator('figcaption')).toHaveText(input.body[1].images[0].caption);expect((await media(page).boundingBox()).height).toBeGreaterThanOrEqual(160);expect(requests).toEqual(['https://example.invalid/missing.png']);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/choice-gallery-rtl-forced-colors.png',fullPage:true});
});

test('choice/gallery genuine touch keeps one request per image and clear boundary harmless',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1000}}),page=await context.newPage();const requests=await setup(page);await choice(page).tap();await expect(choice(page)).toHaveAttribute('aria-pressed','true');await page.locator('.iui-location-choice-clear').tap();const box=await page.locator('.iui-location-choice-clear').boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);expect(await page.evaluate(()=>window.choiceEvents.length)).toBe(1);
  await media(page).getByRole('button').tap();await expect(media(page).locator('figure')).toHaveAttribute('data-image-status','loaded');await expect(media(page,'terrace').locator('img')).toHaveCount(0);expect(requests).toEqual(['https://example.invalid/courtyard.png']);await context.close();
});

test('choice/gallery cancelled requests, pending form and detached buttons cannot trigger hidden work',async({page})=>{
  const input={version:'iui/1',state:{note:'supplied'},body:[{type:'form',label:'Plan',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},...fixture.body]}]};const requests=await setup(page,input);
  await choice(page).click();await page.evaluate(()=>document.getElementById('host').addEventListener('iui:location-choice',e=>{e.preventDefault();document.querySelector('[data-option-id=courtyard]').click();},{once:true}));await choice(page,'terrace').click();await expect(choice(page)).toHaveAttribute('aria-pressed','true');await expect(page.locator('.iui-location-choice-status')).toHaveText('The local choice was not accepted.');expect(await page.evaluate(()=>window.choiceEvents.length)).toBe(2);
  await page.evaluate(input=>{window.choiceController.dispose();window.choiceController=window.iui.mount(document.getElementById('host'),input,{actions:{save:ctx=>{window.choiceSavedValues=ctx.values;return new Promise(resolve=>window.choiceResolve=resolve);}}});},input);
  await page.locator('button[type=submit]').click();await expect(choice(page)).toBeDisabled();await expect(media(page).getByRole('button')).toBeDisabled();await choice(page).evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await media(page).getByRole('button').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await expect(media(page).locator('img')).toHaveCount(0);expect(requests).toEqual([]);expect(await page.evaluate(()=>window.choiceSavedValues)).toEqual({note:'supplied'});
  await page.evaluate(()=>window.choiceResolve());await expect(choice(page)).toBeEnabled();await choice(page).click();await expect(choice(page)).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>{const old=document.querySelector('.iui-business-gallery'),button=old.querySelector('button'),before=old.outerHTML;window.choiceController.dispose();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));return old.outerHTML===before&&!old.querySelector('img[src^="https:"]');})).toBe(true);expect(requests).toEqual([]);
});

test('choice/gallery atomic invalid update and iframe ownership retain local controls',async({page})=>{
  const requests=await setup(page);await choice(page).click();await media(page).getByRole('button').focus();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML,focused=document.activeElement;try{window.choiceController.update({version:'iui/1',body:[{type:'business-gallery',label:'Bad',images:[{id:'one',alt:'Bad',src:'data:image/svg+xml;base64,AAAA'}]}]});return false;}catch{return host.innerHTML===before&&document.activeElement===focused;}})).toBe(true);
  expect(await page.evaluate(input=>{const frame=document.createElement('iframe');document.body.append(frame);const doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);const controller=window.iui.mount(host,input);let seen;host.addEventListener('iui:location-choice',e=>seen=e);host.querySelector('[data-option-id=courtyard]').click();const valid=seen instanceof frame.contentWindow.CustomEvent&&[...host.querySelectorAll('*')].every(el=>el.ownerDocument===doc);controller.dispose();frame.remove();return valid;},fixture)).toBe(true);
  expect(requests.filter(url=>url!=='about:blank')).toEqual([]);
});
