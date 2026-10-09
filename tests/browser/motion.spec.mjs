// PREPARED, NOT EXECUTED. Uses actual browser WAAPI, native keyboard/pointer/touch,
// and emulated platform preferences. Controlled timelines wrap the native animate
// method only to capture/pause its REAL Animation. No fabricated API results.
// One separate natural-completion test does not pause the timeline.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/motion.json',import.meta.url),'utf8'));
const root=(page,type='animate')=>page.locator(`[data-iui=${type}]`).first();
const preview=(page,type='animate')=>root(page,type).locator('.iui-motion-preview');
const stop=(page,type='animate')=>root(page,type).locator('.iui-motion-stop');
async function mount(page,input=fixture,lang='en',controlled=true){
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(({input,lang,controlled})=>{
    const nativeAnimate=Element.prototype.animate;window.motionAnimations=[];window.motionCompletions=[];
    Element.prototype.animate=function(...args){const animation=nativeAnimate.apply(this,args);window.motionAnimations.push(animation);window.motionCompletions.push(animation.finished);if(controlled)animation.pause();return animation;};
    const host=document.getElementById('host');host.lang=lang;window.motionInput=input;window.motionController=window.iui.mount(host,input);
  },{input,lang,controlled});
}
async function pointer(page,control){await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();expect(box).not.toBeNull();const p={x:box.x+box.width/2,y:box.y+box.height/2};expect(await control.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),p)).toBe(true);await page.mouse.click(p.x,p.y);}
async function running(page,type='animate'){return root(page,type).evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running'||a.playState==='paused').length);}
const longFixture=()=>{const input=structuredClone(fixture);input.body[0].duration=1000;input.body[1].duration=1800;return input;};
test.beforeEach(async({page})=>{page.__motionErrors=[];page.on('pageerror',error=>page.__motionErrors.push(error.message));});
test.afterEach(async({page})=>expect(page.__motionErrors).toEqual([]));

test('real WAAPI is initially idle, pointer preview is single-flight, Stop is persistent and native Enter/Space retry',async({page})=>{
  await mount(page,longFixture());expect(await running(page)).toBe(0);await expect(root(page).getByRole('status')).toHaveText('');
  await pointer(page,preview(page));await expect(preview(page)).toBeFocused();expect(await running(page)).toBe(1);
  await page.evaluate(()=>window.savedMotion=document.querySelector('.iui-motion-content').getAnimations()[0]);await page.keyboard.press('Enter');await page.keyboard.press('Space');
  expect(await page.evaluate(()=>document.querySelector('.iui-motion-content').getAnimations()[0]===window.savedMotion)).toBe(true);
  await root(page).evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>{a.currentTime=Number(a.effect.getComputedTiming().duration)/2;}));await page.screenshot({path:'test-results/motion-animate-controlled-midphase.png'});
  await page.keyboard.press('Tab');await expect(stop(page)).toBeFocused();await page.keyboard.press('Space');await expect(root(page)).toHaveAttribute('data-status','stopped');expect(await running(page)).toBe(0);await expect(stop(page)).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(preview(page)).toBeFocused();await page.keyboard.press('Enter');await expect(root(page)).toHaveAttribute('data-status','playing');
  await root(page).evaluate(el=>el.getAnimations({subtree:true}).forEach(animation=>animation.finish()));
  await expect(root(page)).toHaveAttribute('data-status','completed');expect(await root(page).locator('.iui-motion-content').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  await expect(preview(page)).toBeFocused();
});

test('real celebration uses six local animations, controlled finish, explicit native cancellation and supplied-message note',async({page})=>{
  await mount(page,longFixture());await expect(root(page,'celebration').locator('.iui-motion-note')).toContainText('not a verified achievement');expect(await running(page,'celebration')).toBe(0);
  await pointer(page,preview(page,'celebration'));expect(await running(page,'celebration')).toBe(6);await root(page,'celebration').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>{a.currentTime=Number(a.effect.getComputedTiming().duration)/2;}));await page.screenshot({path:'test-results/motion-celebration-controlled-midphase.png'});await root(page,'celebration').evaluate(el=>el.getAnimations({subtree:true}).forEach(animation=>animation.finish()));await expect(root(page,'celebration')).toHaveAttribute('data-status','completed');expect(await running(page,'celebration')).toBe(0);
  await preview(page,'celebration').focus();await page.keyboard.press('Space');await pointer(page,stop(page,'celebration'));await expect(root(page,'celebration')).toHaveAttribute('data-status','stopped');
  const layer=root(page,'celebration').locator('.iui-celebration-decoration');await expect(layer).toHaveAttribute('aria-hidden','true');expect(await layer.evaluate(el=>getComputedStyle(el).overflow)).toBe('hidden');expect(await layer.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
  expect(await root(page,'celebration').evaluate(el=>getComputedStyle(el).overflow)).toBe('visible');
});

test('real animation external rejection, update and dispose cancel without retired writes or page errors',async({page})=>{
  await mount(page,longFixture());await pointer(page,preview(page));await page.evaluate(()=>document.querySelector('.iui-motion-content').getAnimations()[0].cancel());await expect(root(page)).toHaveAttribute('data-status','failed');
  await pointer(page,preview(page));await page.evaluate(()=>{window.retiredMotion=document.querySelector('.iui-animate');window.retiredHTML=window.retiredMotion.outerHTML;window.retiredAnimation=window.retiredMotion.getAnimations({subtree:true})[0];window.motionController.update(window.motionInput);});
  expect(await page.evaluate(()=>window.retiredAnimation.playState)).toBe('idle');expect(await page.evaluate(()=>window.retiredMotion.outerHTML===window.retiredHTML)).toBe(true);await expect(root(page)).toHaveAttribute('data-status','idle');
  await pointer(page,preview(page));await page.evaluate(()=>{window.retiredAnimation=document.querySelector('.iui-animate').getAnimations({subtree:true})[0];window.motionController.dispose();});expect(await page.evaluate(()=>window.retiredAnimation.playState)).toBe('idle');await expect(page.locator('.iui-motion')).toHaveCount(0);
});

test('real preference changes cancel an in-progress preview and reduced motion never starts WAAPI',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await mount(page,longFixture());await pointer(page,preview(page,'celebration'));expect(await running(page,'celebration')).toBe(6);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(root(page,'celebration')).toHaveAttribute('data-status','reduced');expect(await running(page,'celebration')).toBe(0);await preview(page).focus();await page.keyboard.press('Enter');await expect(root(page)).toHaveAttribute('data-status','reduced');expect(await running(page)).toBe(0);expect(await page.evaluate(()=>window.motionAnimations.length)).toBe(6);await expect(preview(page)).toBeFocused();
});

for(const theme of ['light','dark'])for(const width of [320,768,1100])test(`real ${theme} ${width} static reading, 44px focusable controls and bounded decoration`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});const input=longFixture();input.theme=theme;input.body[1].message='A long supplied message, always readable. '.repeat(20);await mount(page,input);
  await preview(page).focus();expect(await preview(page).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');await page.keyboard.press('Enter');await expect(root(page)).toHaveAttribute('data-status','reduced');
  expect(await page.evaluate(()=>window.motionAnimations.length)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const control of [preview(page),stop(page),preview(page,'celebration'),stop(page,'celebration')]){expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);await expect(control).toBeVisible();}
  await page.screenshot({path:info.outputPath(`motion-${theme}-${width}.png`),fullPage:true});
});

test('true Arabic-first content controls layout direction and forced colors preserve focus/text/ornament bounds',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const input={version:'iui/1',body:[{type:'animate',label:'معاينة الحركة',children:[{type:'text',value:'هذا المحتوى يبقى قابلاً للقراءة دون تشغيل تلقائي.'}]},{type:'celebration',label:'رسالة مقدمة',message:'هذه الرسالة مقدمة من الكاتب ولا تؤكد إنجازاً.'}]};
  await mount(page,input,'ar');expect(await root(page).evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');const p=await preview(page).boundingBox(),s=await stop(page).boundingBox();expect(p.x).toBeGreaterThan(s.x);
  await preview(page).focus();await page.keyboard.press('Tab');await expect(stop(page)).toBeFocused();expect(await stop(page).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test.describe('touch',()=>{test.use({hasTouch:true,viewport:{width:390,height:844}});test('real taps explicitly preview and Stop without moving to overlays or sending requests',async({page})=>{
  await mount(page,longFixture());const requests=[];page.on('request',request=>requests.push(request.url()));await preview(page,'celebration').tap();expect(await running(page,'celebration')).toBe(6);await stop(page,'celebration').tap();await expect(root(page,'celebration')).toHaveAttribute('data-status','stopped');expect(requests).toEqual([]);
});});

test('real form draft, selected tabs, timer and focus survive preview/stop/unrelated state without form submission',async({page})=>{
  const input={version:'iui/1',state:{amount:6,other:0},body:[{type:'animate',label:'Persistent content',duration:1000,children:[{type:'form',label:'Form',children:[{type:'input',kind:'number',label:'Amount',bind:'amount',min:0}]},{type:'tab-group',label:'Views',children:[{type:'tab-panel',id:'one',label:'One',children:[{type:'text',value:'One'}]},{type:'tab-panel',id:'two',label:'Two',children:[{type:'text',value:'Two'}]}]},{type:'timer',durationMs:10000}]}]};
  await mount(page,input);await page.getByLabel('Amount',{exact:true}).fill('-1');await page.getByRole('tab',{name:'Two',exact:true}).click();await page.locator('[data-time-action=start]').click();
  await page.evaluate(()=>{window.keptInput=document.querySelector('input');window.motionSubmits=0;document.querySelector('form').addEventListener('submit',()=>window.motionSubmits++);});
  await pointer(page,preview(page));await page.evaluate(()=>window.motionController.setState({other:1}));await pointer(page,stop(page));await expect(page.getByLabel('Amount',{exact:true})).toHaveValue('-1');await expect(page.getByRole('tab',{name:'Two',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.iui-time')).toHaveAttribute('data-status','running');expect(await page.evaluate(()=>window.keptInput===document.querySelector('input'))).toBe(true);expect(await page.evaluate(()=>window.motionSubmits)).toBe(0);
});


test('real unpaused WAAPI completes naturally through captured finished promises without sleeps',async({page})=>{
  const input=structuredClone(fixture);input.body[1].duration=300;await mount(page,input,'en',false);
  await pointer(page,preview(page,'celebration'));expect(await page.evaluate(()=>window.motionAnimations.length)).toBe(6);
  await page.evaluate(()=>Promise.all(window.motionCompletions));await expect(root(page,'celebration')).toHaveAttribute('data-status','completed');
  expect(await running(page,'celebration')).toBe(0);
});

test('reduced motion starts strictly zero native animation calls across both preview buttons',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await mount(page);await pointer(page,preview(page));await pointer(page,preview(page,'celebration'));
  expect(await page.evaluate(()=>window.motionAnimations.length)).toBe(0);await expect(root(page)).toHaveAttribute('data-status','reduced');await expect(root(page,'celebration')).toHaveAttribute('data-status','reduced');
});
