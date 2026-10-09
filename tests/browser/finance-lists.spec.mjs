import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/finance-lists.json',import.meta.url)));
// PREPARED, UNEXECUTED: no browser acceptance is claimed by the source handoff.
async function setup(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.ledgerController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},{input,lang});return requests;
}
const assets=page=>page.locator('.iui-asset-distribution').first(),transactions=page=>page.locator('.iui-transaction-list').first();
// Playwright considers aria-disabled controls disabled; use actual hit-tested input
// to verify repeat activation of the intentionally focusable reset boundary.
async function activateBoundary(page,control,touch=false){
  await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();expect(box).not.toBeNull();const p={x:box.x+box.width/2,y:box.y+box.height/2};
  expect(await control.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),p)).toBe(true);
  if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`ledger ${theme} ${width}: pointer/keyboard, raw data, preserved disclosure, repeat reset, offline`,async({page,context})=>{
  await page.setViewportSize({width,height:1100});await page.emulateMedia({colorScheme:theme});const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=await setup(page,{...fixture,theme});await context.setOffline(true);
  const asset=assets(page),transaction=transactions(page),currency=asset.getByRole('combobox',{name:'Filter by currency'}),direction=transaction.getByRole('combobox',{name:'Filter by direction'}),month=transaction.getByRole('combobox',{name:'Filter by month'}),reset=transaction.getByRole('button',{name:'Reset filters'});
  await expect(asset.locator('[data-currency=USD] .iui-ledger-subtotal')).toHaveText('Known subtotal: 5001 USD');await expect(asset.locator('[data-account-id=unknown] .iui-ledger-amount')).toHaveText('Amount not supplied');
  const details=asset.locator('[data-currency=USD] details');await details.locator('summary').focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');
  await currency.focus();await page.keyboard.press('End');await page.keyboard.press('Enter');await expect(currency).toHaveValue('JPY');await expect(currency).toBeFocused();await page.keyboard.press('Escape');await expect(currency).toHaveValue('JPY');await expect(currency).toBeFocused();await expect(asset.locator('[data-currency=USD]')).toBeHidden();
  await page.evaluate(()=>{window.savedLedgerDetails=document.querySelector('.iui-asset-distribution details');window.ledgerController.setState({other:1});});await expect(currency).toBeFocused();await currency.selectOption('');expect(await page.evaluate(()=>document.querySelector('.iui-asset-distribution details')===window.savedLedgerDetails)).toBe(true);await expect(details).toHaveAttribute('open','');
  await direction.selectOption('credit');await month.selectOption('2026-09');await expect(transaction.locator('tbody tr:visible')).toHaveCount(1);await expect(transaction.locator('tbody tr:visible')).toHaveAttribute('data-transaction-id','sep-credit');
  await reset.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(reset).toBeFocused();await expect(reset).toHaveAttribute('aria-disabled','true');await activateBoundary(page,reset);await expect(transaction.locator('tbody tr:visible')).toHaveCount(4);
  await expect(transaction.locator('[data-transaction-id=oct-credit] .iui-ledger-status')).toHaveText('Status not supplied');
  expect(await page.locator('.iui-ledger select,.iui-ledger button,.iui-ledger summary').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:`test-results/ledger-${theme}-${width}.png`,fullPage:true});
});

test('ledger genuine touch, local table scrolling and focusable reset boundary',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1000}}),page=await context.newPage(),requests=await setup(page),transaction=transactions(page);
  await transaction.locator('summary').first().tap();await expect(transaction.locator('details').first()).toHaveAttribute('open','');await transaction.locator('select').first().tap();await page.keyboard.press('Escape');await transaction.locator('select').first().selectOption('credit');await expect(transaction.locator('tbody tr:visible')).toHaveCount(2);
  const reset=transaction.getByRole('button',{name:'Reset filters'});await reset.tap();await activateBoundary(page,reset,true);await expect(transaction.locator('tbody tr:visible')).toHaveCount(4);
  const wrap=transaction.locator('.iui-ledger-table-wrap');expect(await wrap.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);await wrap.evaluate(el=>{el.scrollLeft=el.scrollWidth;});expect(await wrap.evaluate(el=>el.scrollLeft>0)).toBe(true);expect(requests).toEqual([]);await context.close();
});

test('ledger Arabic-first RTL and Chinese labels retain exact LTR dates and magnitudes, long text wraps locally',async({page})=>{
  await page.setViewportSize({width:390,height:1000});const input=structuredClone(fixture);input.description='مبالغ ومعاملات مقدمة للعرض المحلي فقط.';input.body[0].label='المبالغ المقدمة '.repeat(10);input.body[0].accounts[0].name='اسم الحساب التجريبي '.repeat(8);input.body[1].transactions[0].description='وصف أصلي طويل '.repeat(40);input.body[1].transactions[0].note='تفاصيل أصلية '.repeat(100);
  const requests=await setup(page,input,'zh-CN');await expect(assets(page)).toHaveCSS('direction','rtl');await expect(assets(page).locator('.iui-ledger-note').first()).toContainText('不进行汇率换算');await expect(transactions(page).locator('time').first()).toHaveCSS('direction','ltr');await expect(transactions(page).locator('time').first()).toHaveText('2026-10-09');await transactions(page).locator('summary').first().click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);await page.screenshot({path:'test-results/ledger-rtl-390.png',fullPage:true});
});

test('ledger forced-colors, reduced motion, inherited disabled and outer form reset',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});const requests=await setup(page,{version:'iui/1',state:{locked:true},body:[{type:'field',label:'Locked',disabled:{$:'locked'},children:fixture.body.slice(0,2)}]});
  const transaction=transactions(page),direction=transaction.locator('select').first(),reset=transaction.locator('button');await expect(direction).toBeDisabled();await direction.evaluate(el=>{el.value='credit';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(direction).toHaveValue('');
  await page.evaluate(()=>{window.ledgerController.setState({locked:false});const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);window.ledgerSubmits=0;form.addEventListener('submit',e=>{e.preventDefault();window.ledgerSubmits++;});});
  await direction.selectOption('credit');await direction.focus();expect(await direction.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await transaction.locator('summary').first().click();await page.evaluate(()=>document.querySelector('form').reset());await expect(direction).toHaveValue('');await expect(transaction.locator('tbody tr:visible')).toHaveCount(4);await expect(transaction.locator('details').first()).toHaveAttribute('open','');
  await reset.focus();await page.keyboard.press('Space');expect(await page.evaluate(()=>window.ledgerSubmits)).toBe(0);expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);expect(requests).toEqual([]);await page.screenshot({path:'test-results/ledger-forced-colors.png',fullPage:true});
});

test('ledger pending Forms, ordinary source links, atomic invalid update, stale listeners and disposal stay local',async({page})=>{
  const requests=await setup(page);await page.evaluate(nodes=>{
    window.ledgerController.dispose();window.ledgerController=window.iui.mount(document.getElementById('host'),{version:'iui/1',state:{other:'Bound'},body:[{type:'form',label:'Local',action:'save',children:[{type:'input',kind:'text',label:'Other',bind:'other'},...nodes]}]},{actions:{save:({values})=>{window.ledgerSnapshot=values;return new Promise(resolve=>{window.ledgerResolve=resolve;});}}});
  },fixture.body.slice(0,2));const transaction=transactions(page),direction=transaction.locator('select').first(),form=page.locator('form');await direction.selectOption('credit');await form.getByRole('button',{name:'Submit',exact:true}).click();await expect(direction).toBeDisabled();await transaction.locator('button').evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));await expect(direction).toHaveValue('credit');expect(await page.evaluate(()=>window.ledgerSnapshot)).toEqual({other:'Bound'});
  const link=assets(page).locator('a');await link.evaluate(el=>el.addEventListener('click',e=>{window.ledgerLinkBlocked=e.defaultPrevented;e.preventDefault();}));await link.click();expect(await page.evaluate(()=>window.ledgerLinkBlocked)).toBe(false);await expect(link).toHaveAttribute('rel','noopener noreferrer');
  await page.evaluate(()=>window.ledgerResolve());await expect(direction).toBeEnabled();expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML;try{window.ledgerController.update({version:'iui/1',body:[{type:'asset-distribution',label:'Bad',accounts:[{id:'x',name:'X',amount:-1,currency:'USD'}]}]});return false;}catch{return host.innerHTML===before;}})).toBe(true);
  await page.evaluate(()=>{const old=document.querySelector('.iui-transaction-list'),before=old.outerHTML;window.ledgerController.dispose();old.querySelector('button').click();if(old.outerHTML!==before)throw Error('Retired tree changed');});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});
