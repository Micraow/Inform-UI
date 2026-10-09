import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/restaurant-availability.json',import.meta.url),'utf8'));
// Prepared acceptance only: isolated component development does not launch browsers.
async function setup(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({input,lang})=>{
    const host=document.getElementById('host');host.lang=lang;
    window.availabilityEvents=[];host.addEventListener('iui:reservation-choice',e=>window.availabilityEvents.push({...e.detail}));
    window.availabilityController=window.iui.mount(host,{...input,state:{other:0,...input.state}});
  },{input,lang});return requests;
}
// aria-disabled keeps a native boundary button focusable; locator.click/tap intentionally
// waits for ARIA-enabledness, so boundary activation uses real hit-tested input.
async function activateBoundary(page,control,touch=false){
  await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();expect(box).not.toBeNull();
  const point={x:box.x+box.width/2,y:box.y+box.height/2};
  expect(await control.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),point)).toBe(true);
  if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
const first=page=>page.locator('.iui-availability').first();
const choice=(root,id)=>root.locator(`[data-slot-id=${id}] button`);
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`availability ${theme} ${width}: native pointer/keyboard, persistent choice, clear boundary, no requests`,async({page})=>{
  await page.setViewportSize({width,height:950});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=await setup(page,{...fixture,theme});
  const root=first(page),select=root.getByRole('combobox',{name:'Filter by date'}),clear=root.getByRole('button',{name:'Clear local selection'});
  await expect(root.locator('.iui-availability-slot')).toHaveCount(4);await expect(root.locator('.iui-availability-counts')).toHaveText('Showing 4 supplied options: 3 available; 1 unavailable.');
  await clear.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(clear).toBeFocused();await expect(clear).toHaveAttribute('aria-disabled','true');expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(0);
  await choice(root,'early').click();await expect(choice(root,'early')).toHaveAttribute('aria-pressed','true');await expect(root.locator('.iui-availability-status')).toContainText('No reservation has been made');
  await select.focus();await page.keyboard.press('End');await page.keyboard.press('Enter');await expect(select).toHaveValue('2026-10-10');await expect(select).toBeFocused();await expect(choice(root,'early')).toBeHidden();await expect(root.locator('.iui-availability-selection')).toContainText('2026-10-09 18:00');
  await choice(root,'next').focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(3);
  await page.evaluate(()=>{window.availabilitySavedSlot=document.querySelector('[data-slot-id=early]');window.availabilityController.setState({other:1});});await expect(choice(root,'next')).toBeFocused();
  await select.selectOption('');expect(await page.evaluate(()=>window.availabilitySavedSlot===document.querySelector('[data-slot-id=early]'))).toBe(true);await expect(choice(root,'unavailable')).toBeDisabled();await expect(choice(root,'unavailable')).toContainText('Unavailable');
  await clear.click();await expect(clear).toBeFocused();await expect(clear).toHaveAttribute('aria-disabled','true');await activateBoundary(page,clear);expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(3);
  await expect(page.locator('.iui-availability').nth(1).locator('.iui-availability-empty')).toHaveText('No time options supplied.');
  expect(await root.locator('button,select').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:`test-results/availability-${theme}-${width}.png`,fullPage:true});
});

test('availability Arabic-first RTL, long labels, original exact wall times and Chinese disclosure',async({page})=>{
  await page.setViewportSize({width:390,height:1000});const input={version:'iui/1',description:'خيارات وقت عشاء مقدمة دون حجز أو تحويل المنطقة الزمنية.',body:[{...fixture.body[0],title:'اختر وقت العشاء '.repeat(10),venue:'المطعم التجريبي '.repeat(10),description:'نص أصلي طويل لخيارات محلية فقط. '.repeat(40),timeZoneLabel:'توقيت المكان كما ورد',source:{label:'معلومات مقدمة '.repeat(10)}}]};
  const requests=await setup(page,input,'zh-CN'),root=first(page);await expect(root).toHaveCSS('direction','rtl');await expect(root.locator('.iui-availability-note')).toContainText('不会进行预订');await expect(choice(root,'early').locator('.iui-availability-time')).toHaveCSS('direction','ltr');await expect(choice(root,'early').locator('.iui-availability-time')).toHaveText('18:00');
  await choice(root,'early').click();await root.locator('select').selectOption('2026-10-10');await expect(root.locator('.iui-availability-selection')).toContainText('2026-10-09 18:00');await expect(root.locator('.iui-availability-time-zone')).toHaveText('توقيت المكان كما ورد');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);await page.screenshot({path:'test-results/availability-rtl-390.png',fullPage:true});
});

test('availability forced colors, inherited disabled controls and outer-form reset stay local',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await setup(page,{version:'iui/1',state:{locked:true},body:[{type:'field',label:'Locked controls',disabled:{$:'locked'},children:[fixture.body[0]]}]});
  await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);window.availabilitySubmits=0;form.addEventListener('submit',e=>{e.preventDefault();window.availabilitySubmits++;});});
  const root=first(page),select=root.locator('select'),clear=root.locator('.iui-availability-clear');await expect(select).toBeDisabled();await expect(clear).toBeDisabled();
  await choice(root,'early').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await select.evaluate(el=>{el.value='2026-10-10';el.dispatchEvent(new Event('change'));});await expect(select).toHaveValue('');expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(0);
  await page.evaluate(()=>window.availabilityController.setState({locked:false}));await choice(root,'early').focus();await page.keyboard.press('Space');await expect(choice(root,'early')).toHaveAttribute('aria-pressed','true');expect(await choice(root,'early').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await select.selectOption('2026-10-10');await page.evaluate(()=>document.querySelector('form').reset());await expect(select).toHaveValue('2026-10-10');await expect(choice(root,'early')).toBeHidden();await expect(root.locator('.iui-availability-selection')).toContainText('2026-10-09 18:00');
  await clear.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(clear).toBeFocused();await expect(clear).toHaveAttribute('aria-disabled','true');expect(await page.evaluate(()=>window.availabilitySubmits)).toBe(0);expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);await page.screenshot({path:'test-results/availability-forced-colors.png',fullPage:true});
});

test('availability genuine touch activates once, native selector filters and clear boundary remains focusable',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:950}}),page=await context.newPage();const requests=await setup(page),root=first(page),select=root.locator('select'),clear=root.locator('.iui-availability-clear');
  await choice(root,'early').tap();await expect(choice(root,'early')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(1);
  await select.tap();await page.keyboard.press('Escape');await select.selectOption('2026-10-10');await expect(choice(root,'early')).toBeHidden();await choice(root,'next').tap();await expect(choice(root,'next')).toHaveAttribute('aria-pressed','true');await clear.tap();await expect(clear).toHaveAttribute('aria-disabled','true');await activateBoundary(page,clear,true);expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(2);expect(requests).toEqual([]);await context.close();
});

test('availability host cancellation, repeated event, pending forms, ordinary source link and lifecycle offline',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);const root=first(page);
  await choice(root,'early').click();await page.evaluate(()=>{document.getElementById('host').addEventListener('iui:reservation-choice',e=>{e.preventDefault();document.querySelector('[data-slot-id=late] button').click();},{once:true});});await choice(root,'late').click();await expect(choice(root,'early')).toHaveAttribute('aria-pressed','true');await expect(root.locator('.iui-availability-status')).toHaveText('The local choice was not accepted.');expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(2);
  await expect(root.locator('a')).toHaveAttribute('target','_blank');await expect(root.locator('a')).toHaveAttribute('rel','noopener noreferrer');await expect(root.locator('a')).toContainText('Opens in a new tab');
  await root.locator('a').evaluate(el=>el.addEventListener('click',e=>{window.availabilitySourceWasBlocked=e.defaultPrevented;e.preventDefault();}));await root.locator('a').click();expect(await page.evaluate(()=>window.availabilitySourceWasBlocked)).toBe(false);
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML;try{window.availabilityController.update({version:'iui/1',body:[{type:'restaurant-availability',title:'Bad',venue:'Bad',partySize:0,timeZoneLabel:'Bad',slots:[]}]});return false;}catch{return before===host.innerHTML;}})).toBe(true);
  await page.evaluate(()=>{const old=document.querySelector('.iui-availability'),before=old.outerHTML;document.getElementById('host').addEventListener('iui:reservation-choice',()=>window.availabilityController.dispose(),{once:true});document.querySelector('[data-slot-id=early] button').click();if(old.outerHTML!==before)throw Error('Detached tree painted');});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});

test('availability pending authored forms disable every local control while source reading remains independent',async({page})=>{
  const requests=await setup(page,{version:'iui/1',state:{note:'Example'},body:[{type:'text',value:'Prepare form'}]});
  await page.evaluate(node=>{
    window.availabilityController.update({version:'iui/1',state:{note:'Example'},body:[{type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},node]}]});
    window.availabilityController.dispose();
    window.availabilityController=window.iui.mount(document.getElementById('host'),{version:'iui/1',state:{note:'Example'},body:[{type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},node]}]},{actions:{save:({values})=>{window.availabilitySnapshot=values;return new Promise(resolve=>window.availabilityResolve=resolve);}}});
  },fixture.body[0]);
  const root=first(page),form=page.locator('form');await choice(root,'early').click();await root.locator('select').selectOption('2026-10-10');await form.getByRole('button',{name:'Submit',exact:true}).click();await expect(form).toHaveAttribute('aria-busy','true');await expect(root.locator('select')).toBeDisabled();await expect(root.locator('.iui-availability-clear')).toBeDisabled();
  await choice(root,'next').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await root.locator('.iui-availability-clear').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(await page.evaluate(()=>window.availabilityEvents.length)).toBe(1);expect(await page.evaluate(()=>window.availabilitySnapshot)).toEqual({note:'Example'});
  await root.locator('a').evaluate(el=>el.addEventListener('click',e=>{window.availabilitySourceWasBlocked=e.defaultPrevented;e.preventDefault();}));await root.locator('a').click();expect(await page.evaluate(()=>window.availabilitySourceWasBlocked)).toBe(false);
  await page.evaluate(()=>window.availabilityResolve());await expect(form).toHaveAttribute('aria-busy','false');await expect(root.locator('select')).toHaveValue('2026-10-10');await expect(root.locator('.iui-availability-selection')).toContainText('2026-10-09 18:00');
  await page.evaluate(node=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const c=window.iui.mount(host,{version:'iui/1',body:[node]});let received;host.addEventListener('iui:reservation-choice',e=>received=e);host.querySelector('[data-slot-id=early] button').click();if(!(received instanceof frame.contentWindow.CustomEvent))throw Error('Wrong event realm');c.dispose();frame.remove();},fixture.body[0]);expect(requests).toEqual([]);
});
