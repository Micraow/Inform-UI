import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/agenda.json',import.meta.url),'utf8'));
async function setup(page,input=fixture){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(input=>{const host=document.getElementById('host');host.lang='zh-CN';window.agendaController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},input);
  return requests;
}
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`agenda ${colorScheme} ${width}: native filter, persistent details, wrapping`,async({page})=>{
  await page.setViewportSize({width,height:950});await page.emulateMedia({colorScheme});const errors=[];page.on('pageerror',error=>errors.push(error.message));const requests=await setup(page);
  const agenda=page.locator('.iui-agenda').first(),select=agenda.getByRole('combobox',{name:'按日期筛选'}),details=agenda.locator('[data-event-id=discussion] details');
  await details.locator('summary').click();await expect(details).toHaveAttribute('open','');
  await page.evaluate(()=>window.agendaSavedItem=document.querySelector('[data-event-id=discussion]'));
  await select.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(select).toHaveValue('2026-10-09');await expect(select).toBeFocused();
  // Enter can leave the native select popup open on Linux; dismiss it without changing the selected value or focus.
  await page.keyboard.press('Escape');await expect(select).toHaveValue('2026-10-09');await expect(select).toBeFocused();
  await expect(agenda.locator('.iui-agenda-date:not([hidden])')).toHaveCount(1);await expect(agenda.locator('[data-event-id=review]')).toBeHidden();
  await select.selectOption('2026-10-16');await select.selectOption('2026-10-09');await page.evaluate(()=>window.agendaController.setState({other:1}));
  await expect(details).toHaveAttribute('open','');await expect(select).toBeFocused();expect(await page.evaluate(()=>window.agendaSavedItem===document.querySelector('[data-event-id=discussion]'))).toBe(true);
  await expect(agenda.locator('[data-event-id=cancelled]')).toContainText('已取消');await expect(agenda.locator('[data-event-id=notes]')).toContainText('未提供时间');
  await select.selectOption('');await expect(agenda.locator('.iui-agenda-date:not([hidden])')).toHaveCount(2);await expect(page.locator('.iui-agenda-empty')).toHaveText('未提供日程。');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/agenda-${colorScheme}-${width}.png`,fullPage:true});
});

test('agenda genuine Arabic-first RTL with long event content and exact LTR numeric labels',async({page})=>{
  await page.setViewportSize({width:390,height:900});const input={version:'iui/1',description:'مثال عربي أصلي لعرض المواعيد المحلية دون تحويل المنطقة الزمنية.',body:[{type:'agenda',label:'مواعيد القراءة',description:'اختر تاريخاً من القائمة لعرض السجلات المتاحة.',events:[{id:'arabic',date:'2024-02-29',title:'مناقشة القراءة '.repeat(12),start:'09:00',end:'10:00',location:'قاعة المكتبة '.repeat(30),description:'هذه ملاحظات أصلية للاختبار. '.repeat(40),status:'cancelled'},{id:'next',date:'2024-03-01',title:'متابعة القراءة'}]}]};
  await setup(page,input);const agenda=page.locator('.iui-agenda');await expect(agenda).toHaveCSS('direction','rtl');await agenda.locator('summary').click();
  await expect(agenda.locator('.iui-agenda-time time').first()).toHaveText('09:00');await expect(agenda.locator('.iui-agenda-time time').first()).toHaveCSS('direction','ltr');
  await agenda.locator('select').selectOption('2024-03-01');await agenda.locator('select').selectOption('2024-02-29');await expect(agenda.locator('details')).toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/agenda-rtl-390.png',fullPage:true});
});

test('agenda forced colors, inherited disabled controls, enclosing form keyboard without implicit submission',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const input={version:'iui/1',state:{locked:true},body:[{type:'field',label:'Lock',disabled:{$:'locked'},children:[fixture.body[0]]}]};await setup(page,input);
  await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);window.agendaSubmits=0;form.addEventListener('submit',event=>{event.preventDefault();window.agendaSubmits++;});});
  const select=page.getByRole('combobox',{name:'按日期筛选'});await expect(select).toBeDisabled();
  await select.evaluate(el=>{el.value='2026-10-16';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(select).toHaveValue('');
  await page.evaluate(()=>window.agendaController.setState({locked:false}));await select.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(select).toHaveValue('2026-10-09');
  const summary=page.locator('[data-event-id=discussion] summary');await summary.focus();await page.keyboard.press('Enter');await expect(summary.locator('..')).toHaveAttribute('open','');
  expect(await summary.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');expect(await page.evaluate(()=>window.agendaSubmits)).toBe(0);
  expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);
  await page.evaluate(()=>document.querySelector('form').reset());await expect(select).toHaveValue('2026-10-09');await expect(page.locator('.iui-agenda-date:not([hidden])')).toHaveCount(1);await expect(summary.locator('..')).toHaveAttribute('open','');
  await page.screenshot({path:'test-results/agenda-forced-colors.png',fullPage:true});
});

test('agenda touch disclosures and native select preserve mounted state',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:900}}),page=await context.newPage();await setup(page);
  const details=page.locator('[data-event-id=discussion] details'),summary=details.locator('summary');await summary.tap();await expect(details).toHaveAttribute('open','');
  const select=page.locator('.iui-agenda').first().locator('select');await select.tap();await page.keyboard.press('Escape');await select.selectOption('2026-10-16');await select.selectOption('2026-10-09');await expect(details).toHaveAttribute('open','');await summary.tap();await expect(details).not.toHaveAttribute('open','');await context.close();
});

test('agenda offline no-network, invalid update atomicity, independent ownerDocument and disposal',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);
  const agenda=page.locator('.iui-agenda').first(),select=agenda.locator('select');await select.selectOption('2026-10-09');await select.focus();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML,focus=document.activeElement;try{window.agendaController.update({version:'iui/1',body:[{type:'agenda',label:'Bad',events:[{id:'bad',date:'1900-02-29',title:'Bad'}]}]});return false;}catch{return before===host.innerHTML&&focus===document.activeElement;}})).toBe(true);
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const controller=window.iui.mount(host,{version:'iui/1',body:[{type:'agenda',label:'Other document',events:[]}]});if(host.querySelector('select').ownerDocument!==frame.contentDocument)throw Error('Incorrect ownerDocument');controller.dispose();frame.remove();});
  await expect(agenda.locator('a')).toHaveAttribute('target','_blank');await expect(agenda.locator('a')).toHaveAttribute('rel','noopener noreferrer');await expect(agenda.locator('a')).toContainText('在新标签页中打开');
  await page.evaluate(()=>{const outside=document.createElement('button');outside.textContent='Outside';document.body.append(outside);outside.focus();window.agendaController.setState({other:2});if(document.activeElement!==outside)throw Error('Stolen focus');});
  await select.selectOption('');await expect(agenda.locator('.iui-agenda-event')).toHaveCount(4);await page.evaluate(()=>{window.agendaController.dispose();window.agendaController.dispose();});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);
});
