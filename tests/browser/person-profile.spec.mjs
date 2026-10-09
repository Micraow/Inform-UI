// Prepared acceptance cases only. Listing this file is not browser execution evidence.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/person-profile.json',import.meta.url),'utf8'));
async function setup(page,input=fixture){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(input=>{const host=document.getElementById('host');host.lang='en';window.personController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},input);
  return requests;
}
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`person-profile ${colorScheme} ${width}: native pointer/keyboard, focus and wrapping`,async({page})=>{
  await page.setViewportSize({width,height:950});await page.emulateMedia({colorScheme});const requests=await setup(page),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const profile=page.locator('.iui-person-profile').first(),summary=profile.locator('summary'),details=profile.locator('details');
  await expect(profile).toHaveAccessibleName('Alex River (fictional)');await expect(profile).toHaveAccessibleDescription('This information was supplied and has not been independently verified.');
  await summary.click();await expect(details).toHaveAttribute('open','');await page.evaluate(()=>window.savedPersonDetails=document.querySelector('.iui-person-biography'));
  await summary.focus();await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open','');await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');
  await page.evaluate(()=>window.personController.setState({other:1}));await expect(summary).toBeFocused();await expect(details).toHaveAttribute('open','');expect(await page.evaluate(()=>window.savedPersonDetails===document.querySelector('.iui-person-biography'))).toBe(true);
  await expect(page.locator('.iui-person-profile').nth(1).locator('details')).toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/person-profile-${colorScheme}-${width}.png`,fullPage:true});
});

test('person-profile true Arabic-first RTL preserves authored fact order and long wrapping',async({page})=>{
  await page.setViewportSize({width:390,height:900});
  await setup(page,{version:'iui/1',description:'مثال عربي خيالي أصلي لعرض المعلومات المقدمة دون التحقق من الهوية.',body:[{type:'person-profile',name:'شخصية خيالية للاختبار',role:'قارئ خيالي',organization:'مجموعة خيالية',location:'مدينة خيالية',biography:'هذه سيرة خيالية أصلية للاختبار فقط. '.repeat(60),facts:[{id:'first',label:'الموضوع',value:'القراءة والمناقشة '.repeat(30)},{id:'second',label:'التنسيق',value:'مجموعة صغيرة'}],links:[{id:'reading',label:'صفحة توضيحية',url:'https://example.com/reading'}]}]});
  const profile=page.locator('.iui-person-profile');await expect(profile).toHaveCSS('direction','rtl');await profile.locator('summary').click();
  await expect(profile.locator('.iui-person-fact').first()).toHaveAttribute('data-fact-id','first');await expect(profile.locator('.iui-person-fact').nth(1)).toHaveAttribute('data-fact-id','second');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/person-profile-arabic-390.png',fullPage:true});
});

test('person-profile forced colors/reduced motion and native reading in a busy form',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await setup(page);await page.evaluate(input=>{
    window.personController.dispose();window.personSubmits=0;
    window.personController=window.iui.mount(document.getElementById('host'),{version:'iui/1',body:[{type:'form',label:'Synthetic form',action:'save',children:[input.body[0]]}]},{actions:{save:()=>{window.personSubmits++;return new Promise(resolve=>window.releasePersonSave=resolve);}}});
  },fixture);
  const summary=page.locator('.iui-person-profile summary'),details=page.locator('.iui-person-profile details');
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('.iui-form-fields')).toHaveJSProperty('disabled',true);expect(await page.locator('.iui-form-fields').evaluate(el=>el.matches(':disabled'))).toBe(true);
  await summary.click();await expect(details).toHaveAttribute('open','');await summary.focus();await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open','');await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');
  expect(await summary.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');expect(await page.evaluate(()=>window.personSubmits)).toBe(1);
  expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);
  await expect(page.locator('.iui-person-profile a').first()).not.toHaveAttribute('aria-disabled','true');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(details).toHaveAttribute('open','');
  await page.evaluate(()=>window.releasePersonSave());await page.screenshot({path:'test-results/person-profile-forced-colors.png',fullPage:true});
});

test('person-profile touch uses native disclosure without action handlers',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:900}}),page=await context.newPage();await setup(page);
  const details=page.locator('.iui-person-profile').first().locator('details'),summary=details.locator('summary');await summary.tap();await expect(details).toHaveAttribute('open','');await page.evaluate(()=>window.personController.setState({other:1}));await expect(details).toHaveAttribute('open','');await summary.tap();await expect(details).not.toHaveAttribute('open','');await context.close();
});

test('person-profile links open a disclosed new context with locally intercepted fixtures and no referrer/opener',async({page,context})=>{
  const outbound=[];await context.route('https://example.com/**',async route=>{outbound.push({url:route.request().url(),headers:route.request().headers()});await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Local synthetic destination</title><p>Locally intercepted fixture.</p>'});});
  const requests=await setup(page);expect(requests).toEqual([]);
  for(const link of [page.locator('.iui-person-links a').first(),page.locator('.iui-person-source a')]){
    await expect(link).toContainText('Opens in a new tab');const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()]);await popup.waitForLoadState();await expect(popup).toHaveTitle('Local synthetic destination');
    expect(await popup.evaluate(()=>window.opener===null)).toBe(true);expect(await popup.evaluate(()=>document.referrer)).toBe('');await popup.close();
  }
  expect(outbound.length).toBe(2);for(const request of outbound)expect(request.headers.referer).toBeUndefined();
});

test('person-profile offline lifecycle, invalid update atomicity, foreign document and detached disclosure isolation',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);const summary=page.locator('.iui-person-profile').first().locator('summary');await summary.click();await summary.focus();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),html=host.innerHTML,focus=document.activeElement;try{window.personController.update({version:'iui/1',body:[{type:'person-profile',name:'Bad',source:{label:'Bad',url:'mailto:fictional@example.com'}}]});return false;}catch{return html===host.innerHTML&&focus===document.activeElement;}})).toBe(true);
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const controller=window.iui.mount(host,{version:'iui/1',body:[{type:'person-profile',name:'Synthetic foreign profile',biography:'Synthetic.'}]});for(const el of host.querySelectorAll('*'))if(el.ownerDocument!==frame.contentDocument)throw Error('Incorrect ownerDocument');controller.dispose();frame.remove();});
  await page.evaluate(input=>{const old=document.querySelector('.iui-person-biography');window.personController.update(input);old.querySelector('summary').click();if(document.querySelector('.iui-person-biography').open)throw Error('Old disclosure affected replacement');window.personController.dispose();window.personController.dispose();},fixture);
  await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});
