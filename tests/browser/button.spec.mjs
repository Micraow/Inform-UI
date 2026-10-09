// PREPARED, NOT EXECUTED. Local host callbacks are explicit test stubs only.
// No real external operation, browser acceptance or component-count promotion.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/button-actions.json',import.meta.url),'utf8'));
const root=page=>page.locator('[data-iui=button][id$="-host-action"]');
const main=page=>root(page).locator('.iui-button');
const cancel=page=>root(page).locator('.iui-button-cancel');
const status=page=>root(page).getByRole('status');
async function mount(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(({input,lang})=>{
    const host=document.getElementById('host');host.lang=lang;
    const outside=document.createElement('button');outside.id='button-outside';outside.textContent='Outside';document.body.append(outside);
    window.buttonCalls=[];window.buttonPending=[];window.buttonInput=input;
    window.buttonController=window.iui.mount(host,input,{actions:{run:context=>{
      window.buttonCalls.push(context);return new Promise((resolve,reject)=>window.buttonPending.push({resolve,reject}));
    }}});
  },{input,lang});
}
async function finish(page,result='resolve',index=0){await page.evaluate(({result,index})=>window.buttonPending[index][result](result==='reject'?Error('local stub failure'):undefined),{result,index});}
async function pointer(page,control){await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();expect(box).not.toBeNull();const p={x:box.x+box.width/2,y:box.y+box.height/2};expect(await control.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),p)).toBe(true);await page.mouse.click(p.x,p.y);}
test.beforeEach(async({page})=>{page.__buttonErrors=[];page.on('pageerror',error=>page.__buttonErrors.push(error.message));});
test.afterEach(async({page})=>expect(page.__buttonErrors).toEqual([]));

test('STUB real pointer/Enter/Space use one native path and pending repeats are ignored',async({page})=>{
  await mount(page);await pointer(page,main(page));await expect(main(page)).toBeFocused();await expect(main(page)).toHaveAttribute('aria-disabled','true');
  await pointer(page,main(page));await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.buttonCalls.length)).toBe(1);
  await finish(page);await expect(status(page)).toHaveText('Action completed.');await expect(main(page)).toBeFocused();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.buttonCalls.length)).toBe(2);
  await finish(page,'reject',1);await expect(status(page)).toHaveText('Action failed. Try again.');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.buttonCalls.length)).toBe(3);await finish(page,'resolve',2);
});

test('STUB Cancel returns focus, keeps state, and ignores stale failures after restart',async({page})=>{
  await mount(page);await pointer(page,main(page));await page.evaluate(()=>window.buttonController.setState({count:2}));await page.keyboard.press('Tab');await expect(cancel(page)).toBeFocused();await page.keyboard.press('Enter');
  await expect(main(page)).toBeFocused();await expect(status(page)).toContainText('may not be undone');expect(await page.evaluate(()=>window.buttonCalls[0].signal.aborted)).toBe(true);expect(await page.evaluate(()=>window.buttonController.getState().count)).toBe(2);
  await page.keyboard.press('Space');await finish(page,'reject',0);await expect(main(page)).toHaveAttribute('aria-busy','true');await finish(page,'resolve',1);await expect(status(page)).toHaveText('Action completed.');
});

test('STUB completion preserves outside focus; disappearing Cancel falls back to disabled status',async({page})=>{
  await mount(page);await pointer(page,main(page));await page.locator('#button-outside').focus();await finish(page);await expect(page.locator('#button-outside')).toBeFocused();
  await pointer(page,main(page));await page.evaluate(()=>window.buttonController.setState({locked:true}));await cancel(page).focus();await finish(page,'resolve',1);await expect(status(page)).toBeFocused();await expect(main(page)).toBeDisabled();
  await page.evaluate(()=>window.buttonController.setState({locked:false}));await pointer(page,main(page));await page.evaluate(()=>window.buttonController.setState({locked:true}));await cancel(page).focus();await page.keyboard.press('Space');await expect(status(page)).toBeFocused();
});

for(const action of ['update','dispose'])test(`STUB ${action} aborts and late result never paints replacement or steals focus`,async({page})=>{
  await mount(page);await pointer(page,main(page));await page.locator('#button-outside').focus();await page.evaluate(action=>{
    window.oldButton=document.querySelector('.iui-button-host');window.oldButtonHTML=window.oldButton.outerHTML;
    if(action==='update')window.buttonController.update(window.buttonInput);else window.buttonController.dispose();
  },action);
  expect(await page.evaluate(()=>window.buttonCalls[0].signal.aborted)).toBe(true);await finish(page,'reject');expect(await page.evaluate(()=>window.oldButton.outerHTML===window.oldButtonHTML)).toBe(true);await expect(page.locator('#button-outside')).toBeFocused();
  if(action==='update')await expect(status(page)).toHaveText('');
});

for(const theme of ['light','dark'])for(const width of [320,768,1100])test(`STUB ${theme} ${width} wraps controls, exposes focus and respects theme`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});const input=structuredClone(fixture);input.theme=theme;input.body.find(n=>n.id==='host-action').hint='Long literal hint '.repeat(50);await mount(page,input);
  await main(page).focus();expect(await main(page).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');await page.keyboard.press('Enter');await expect(cancel(page)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const button of [main(page),cancel(page)])expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:info.outputPath(`button-${theme}-${width}.png`),fullPage:true});await finish(page);
});

test('STUB Chinese/RTL and forced colors keep labels and native focus usable',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});const input=structuredClone(fixture);input.description='مثال أصلي';await mount(page,input,'zh-CN');
  expect(await root(page).evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');await main(page).focus();await page.keyboard.press('Enter');await expect(cancel(page)).toHaveText('取消操作');await expect(status(page)).toHaveText('操作进行中。');await page.keyboard.press('Tab');await expect(cancel(page)).toBeFocused();
  expect(await cancel(page).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');await page.keyboard.press('Space');await expect(main(page)).toBeFocused();
});

test.describe('touch',()=>{
  test.use({hasTouch:true,viewport:{width:390,height:844}});
  test('STUB a real tap starts once and Cancel remains reachable',async({page})=>{
    await mount(page);await main(page).tap();await expect(cancel(page)).toBeVisible();const box=await main(page).boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);expect(await page.evaluate(()=>window.buttonCalls.length)).toBe(1);
    await cancel(page).tap();expect(await page.evaluate(()=>window.buttonCalls[0].signal.aborted)).toBe(true);await expect(status(page)).toContainText('cancelled here');
  });
});

test('STUB independent host button in a form preserves invalid numeric drafts and never submits it',async({page})=>{
  const input={version:'iui/1',state:{amount:6},body:[{type:'form',label:'Form',action:'formRun',children:[{type:'input',kind:'number',label:'Amount',bind:'amount',min:0},{type:'button',id:'host-action',label:'Run action',action:{kind:'host',name:'run'}}]}]};
  await mount(page,input);await page.evaluate(()=>{window.formSubmits=0;document.querySelector('form').addEventListener('submit',()=>window.formSubmits++);});
  await page.getByLabel('Amount',{exact:true}).fill('-1');await pointer(page,main(page));expect(await page.evaluate(()=>window.buttonCalls.length)).toBe(1);await expect(page.getByLabel('Amount',{exact:true})).toHaveValue('-1');
  await pointer(page,cancel(page));await expect(page.getByLabel('Amount',{exact:true})).toHaveValue('-1');expect(await page.evaluate(()=>window.formSubmits)).toBe(0);expect(await page.evaluate(()=>window.buttonController.getState().amount)).toBe(6);
});
