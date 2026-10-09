import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const flight=JSON.parse(await readFile(new URL('../../examples/flight-option.json',import.meta.url),'utf8')).body[0];
const artist=JSON.parse(await readFile(new URL('../../examples/artist-upcoming-events.json',import.meta.url),'utf8')).body[0];
const fixture={version:'iui/1',state:{other:0},body:[flight,artist]};
// PREPARED ONLY. No browser, server, screenshots or CI were run for the isolated handoff.
async function setup(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.travelEvents=[];host.addEventListener('iui:flight-choice',e=>window.travelEvents.push({...e.detail}));window.travelController=window.iui.mount(host,input);},{input,lang});
  return requests;
}
async function boundary(page,locator,touch=false){
  await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();expect(box).not.toBeNull();const point={x:box.x+box.width/2,y:box.y+box.height/2};
  expect(await locator.evaluate((element,point)=>element.contains(element.ownerDocument.elementFromPoint(point.x,point.y)),point)).toBe(true);
  if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`travel/events ${theme} ${width}: real mouse/keyboard, visible offsets, mounted local filter`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=await setup(page,{...fixture,theme});
  const select=page.locator('.iui-flight-select'),clear=page.locator('.iui-flight-clear'),filter=page.getByRole('combobox',{name:'Filter by month'});
  await expect(page.locator('.iui-flight-time').first()).toHaveText('2028-02-29T09:00Z');await expect(page.locator('.iui-flight-time').nth(1)).toHaveText('2028-02-29T07:00-05:00');await expect(page.locator('.iui-flight-price')).toContainText('420.5 USD');
  await clear.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(clear).toBeFocused();expect(await page.evaluate(()=>window.travelEvents)).toEqual([]);
  await select.click();await expect(select).toHaveAttribute('aria-pressed','true');await expect(select).toBeFocused();await boundary(page,select);expect(await page.evaluate(()=>window.travelEvents.length)).toBe(1);
  await page.locator('.iui-flight-details summary').first().click();await expect(page.locator('.iui-flight-details').first()).toHaveAttribute('open','');
  const details=page.locator('[data-event-id=february] details');await details.locator('summary').focus();await page.keyboard.press('Space');await expect(details).toHaveAttribute('open','');
  await page.evaluate(()=>window.savedTravelEvent=document.querySelector('[data-event-id=february]'));await filter.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(filter).toHaveValue('2028-03');await expect(filter).toBeFocused();await expect(details).toBeHidden();await expect(page.locator('.iui-events-count')).toHaveText('Showing 1 of 3 supplied events.');
  await page.evaluate(()=>window.travelController.setState({other:1}));await expect(filter).toBeFocused();await expect(filter).toHaveValue('2028-03');await filter.selectOption('');expect(await page.evaluate(()=>window.savedTravelEvent===document.querySelector('[data-event-id=february]'))).toBe(true);await expect(details).toHaveAttribute('open','');
  await clear.focus();await page.keyboard.press('Enter');await expect(clear).toBeFocused();await page.keyboard.press('Space');expect(await page.evaluate(()=>window.travelEvents)).toEqual([{id:'illustrative-flight',optionId:'example-itinerary'},{id:'illustrative-flight',optionId:null}]);
  expect(await page.locator('.iui-flight-controls button,.iui-events-filter,summary').evaluateAll(elements=>elements.every(el=>el.getBoundingClientRect().height>=44))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:`test-results/travel-events-${theme}-${width}.png`,fullPage:true});
});

test('travel/events Arabic-first RTL and long literal text, Chinese labels and narrow layout',async({page})=>{
  await page.setViewportSize({width:390,height:1000});const input={...fixture,description:'معلومات مقدمة فقط دون حجز أو شراء',body:[{...flight,label:'رحلة مقدمة '.repeat(12),description:'نص توضيحي طويل '.repeat(30),note:'ملاحظات السعر '.repeat(30)},{...artist,artist:'فنان تجريبي '.repeat(12),events:artist.events.map(e=>({...e,title:'عرض تجريبي '.repeat(12),venue:'مكان مقدم '.repeat(12),description:'وصف حرفي مقدم '.repeat(30)}))}]};const requests=await setup(page,input,'zh-CN');
  await expect(page.locator('.iui-flight-option')).toHaveCSS('direction','rtl');await expect(page.locator('.iui-artist-events')).toHaveCSS('direction','rtl');await expect(page.locator('.iui-flight-time').first()).toHaveCSS('direction','ltr');await expect(page.locator('.iui-flight-select')).toHaveText('在本地选择');await expect(page.locator('.iui-events-filter option').first()).toHaveText('所有月份');
  await page.locator('.iui-flight-select').click();await page.locator('.iui-events-filter').selectOption('2028-02');await expect(page.locator('.iui-events-count')).toHaveText('显示 3 个已提供活动中的 1 个。');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);await page.screenshot({path:'test-results/travel-events-rtl-390.png',fullPage:true});
});

test('travel/events native external reset, inherited disabled controls and forced-colors keyboard focus',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});const input={...fixture,state:{locked:true,other:0},body:[{type:'field',label:'Disabled ancestor',disabled:{$:'locked'},children:fixture.body}]};await setup(page,input);
  await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);window.travelSubmits=0;form.addEventListener('submit',e=>{e.preventDefault();window.travelSubmits++;});});
  const select=page.locator('.iui-flight-select'),clear=page.locator('.iui-flight-clear'),filter=page.locator('.iui-events-filter');await expect(select).toBeDisabled();await expect(filter).toBeDisabled();await select.evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await filter.evaluate(el=>{el.value='2028-02';el.dispatchEvent(new Event('change'));});await expect(filter).toHaveValue('');expect(await page.evaluate(()=>window.travelEvents.length)).toBe(0);
  await page.evaluate(()=>window.travelController.setState({locked:false}));await select.focus();await page.keyboard.press('Space');await expect(select).toHaveAttribute('aria-pressed','true');expect(await select.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await filter.selectOption('2028-02');await page.locator('[data-event-id=february] summary').click();
  await page.evaluate(()=>document.querySelector('form').reset());await expect(filter).toHaveValue('');await expect(page.locator('.iui-events-item:visible')).toHaveCount(3);await expect(page.locator('[data-event-id=february] details')).toHaveAttribute('open','');await expect(select).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);expect(await page.evaluate(()=>window.travelSubmits)).toBe(0);
  await clear.focus();await page.keyboard.press('Enter');await expect(clear).toBeFocused();await page.screenshot({path:'test-results/travel-events-forced-colors.png',fullPage:true});
});

test('travel/events genuine touch activates selection and clear once; native filtering stays mounted',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1000}}),page=await context.newPage();const requests=await setup(page),select=page.locator('.iui-flight-select'),clear=page.locator('.iui-flight-clear'),filter=page.locator('.iui-events-filter');
  await select.tap();await boundary(page,select,true);expect(await page.evaluate(()=>window.travelEvents.length)).toBe(1);await filter.tap();await page.keyboard.press('Escape');await filter.selectOption('2028-02');await expect(page.locator('.iui-events-item:visible')).toHaveCount(1);await clear.tap();await boundary(page,clear,true);expect(await page.evaluate(()=>window.travelEvents.length)).toBe(2);expect(requests).toEqual([]);await context.close();
});

test('travel/events offline cancellation, ordinary anchors, invalid update and synchronous retirement',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);const select=page.locator('.iui-flight-select'),clear=page.locator('.iui-flight-clear');await select.click();await page.evaluate(()=>document.getElementById('host').addEventListener('iui:flight-choice',e=>e.preventDefault(),{once:true}));await clear.click();await expect(select).toHaveAttribute('aria-pressed','true');await expect(page.locator('.iui-flight-status')).toHaveText('The local change was not accepted.');
  const anchor=page.locator('.iui-flight-option a');await expect(anchor).toHaveAttribute('target','_blank');await expect(anchor).toHaveAttribute('rel','noopener noreferrer');await expect(anchor).toContainText('Opens in a new tab');await anchor.evaluate(el=>el.addEventListener('click',e=>{window.travelSourceBlocked=e.defaultPrevented;e.preventDefault();}));await anchor.click();expect(await page.evaluate(()=>window.travelSourceBlocked)).toBe(false);
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML;try{window.travelController.update({version:'iui/1',body:[{type:'flight-option',label:'Bad',optionId:'bad',legs:[]}]});return false;}catch{return host.innerHTML===before;}})).toBe(true);
  await page.evaluate(()=>{const old=document.querySelector('.iui-flight-option'),before=old.outerHTML;document.getElementById('host').addEventListener('iui:flight-choice',()=>window.travelController.dispose(),{once:true});document.querySelector('.iui-flight-clear').click();if(old.outerHTML!==before)throw Error('Retired tree changed');});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});

test('travel/events pending Forms block forged controls and preserve local choices after settlement',async({page})=>{
  const requests=await setup(page);await page.evaluate(({flight,artist})=>{window.travelController.dispose();window.travelController=window.iui.mount(document.getElementById('host'),{version:'iui/1',state:{note:'Supplied'},body:[{type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},flight,artist]}]},{actions:{save:({values})=>{window.travelSnapshot=values;return new Promise(r=>window.travelResolve=r);}}});},{flight,artist});
  const select=page.locator('.iui-flight-select'),clear=page.locator('.iui-flight-clear'),filter=page.locator('.iui-events-filter');await select.click();await filter.selectOption('2028-02');await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('form')).toHaveAttribute('aria-busy','true');await expect(clear).toBeDisabled();await expect(filter).toBeDisabled();
  await clear.evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await filter.evaluate(el=>{el.value='2028-03';el.dispatchEvent(new Event('change'));});await expect(filter).toHaveValue('2028-02');await expect(select).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>window.travelSnapshot)).toEqual({note:'Supplied'});await page.evaluate(()=>window.travelResolve());await expect(filter).toBeEnabled();expect(requests).toEqual([]);
});
