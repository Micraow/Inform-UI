// PREPARED, NOT EXECUTED LOCALLY. These require real Chromium input/layout.
// No screenshots, keyboard/pointer/touch acceptance, or visual passes are claimed.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {compileHtml} from '../../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../../examples/vocab-card.json',import.meta.url),'utf8'));
const rtl=JSON.parse(await readFile(new URL('../fixtures/vocab-rtl.json',import.meta.url),'utf8'));
const card=page=>page.locator('.iui-vocab-card').first();
const action=(root,name)=>root.locator(`[data-vocab-action="${name}"]`);
async function mount(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.vocabInput=input;window.vocabController=window.iui.mount(host,input);},{input,lang});
}
async function pointer(page,button){
  await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box).not.toBeNull();
  const p={x:box.x+box.width/2,y:box.y+box.height/2};
  expect(await button.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),p)).toBe(true);
  await page.mouse.click(p.x,p.y);
}
test.beforeEach(async({page})=>{page.__vocabErrors=[];page.on('pageerror',e=>page.__vocabErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__vocabErrors).toEqual([]));

for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`vocab ${theme} ${width}: native reveal/rating/reset and screenshot`,async({page},info)=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await mount(page,{...fixture,theme});
  const root=card(page),reveal=action(root,'reveal'),again=action(root,'again'),familiar=action(root,'familiar'),reset=action(root,'reset'),details=root.locator('.iui-vocab-details');
  await expect(details).toBeHidden();await expect(again).toBeHidden();await expect(reveal).toHaveAccessibleName('Show meaning');
  await page.screenshot({path:info.outputPath(`vocab-${theme}-${width}-closed.png`),fullPage:true});
  await reveal.focus();await page.keyboard.press('Enter');await expect(details).toBeVisible();await expect(reveal).toBeFocused();
  await expect(again).toHaveAttribute('aria-pressed','false');await expect(familiar).toHaveAttribute('aria-pressed','false');
  await page.keyboard.press('Space');await expect(details).toBeHidden();await expect(reveal).toBeFocused();
  await pointer(page,reveal);await again.focus();await page.keyboard.press('Space');await expect(again).toHaveAttribute('aria-pressed','true');
  await pointer(page,familiar);await expect(again).toHaveAttribute('aria-pressed','false');await expect(familiar).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Enter');await expect(familiar).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{window.savedVocabDetails=document.querySelector('.iui-vocab-details');window.vocabController.setState({unrelated:4});});
  await expect(familiar).toBeFocused();expect(await page.evaluate(()=>window.savedVocabDetails===document.querySelector('.iui-vocab-details'))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`vocab-${theme}-${width}-revealed.png`),fullPage:true});
  await reset.focus();await page.keyboard.press('Enter');await expect(reset).toBeFocused();await expect(details).toBeHidden();
  await expect(again).toHaveAttribute('aria-pressed','false');await expect(familiar).toHaveAttribute('aria-pressed','false');
  expect(await reset.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
});

test('vocab: actual first-visible Arabic RTL and exact supplied order',async({page},info)=>{
  await page.setViewportSize({width:390,height:950});await mount(page,rtl,'ar');
  const root=card(page);expect(await page.locator('.iui-description').textContent()).toBe(rtl.description);
  expect(await page.locator('.iui-root').evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');
  expect(await root.evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');
  await pointer(page,action(root,'reveal'));
  expect(await root.locator('.iui-vocab-examples li').allTextContents()).toEqual(rtl.body[0].senses[0].examples);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('vocab-arabic-rtl-390.png'),fullPage:true});
});

test('vocab: Chinese labels, max emoji term and unbroken literal long content reflow',async({page},info)=>{
  const input=structuredClone(fixture);input.body[0].term='😀'.repeat(200);input.body[0].senses[0].meaning='字'.repeat(2000);input.body[0].senses[0].examples=['x'.repeat(2000),'<script>literal</script>'];
  await page.setViewportSize({width:390,height:950});await mount(page,input,'zh-CN');const root=card(page);
  await expect(action(root,'reveal')).toHaveText('显示释义');await pointer(page,action(root,'reveal'));await expect(action(root,'familiar')).toHaveText('熟悉');
  expect(await root.locator('.iui-vocab-term').textContent()).toBe(input.body[0].term);await expect(root.locator('script,img')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('vocab-long-chinese-390.png'),fullPage:true});
});

test('vocab: forced colors and reduced motion retain focus and visible selected state',async({page},info)=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await mount(page);
  const root=card(page);await action(root,'reveal').focus();await page.keyboard.press('Enter');await action(root,'again').focus();await page.keyboard.press('Space');
  await expect(action(root,'again')).toHaveAttribute('aria-pressed','true');
  expect(await action(root,'again').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  expect(await root.evaluate(el=>[el,...el.querySelectorAll('*')].every(node=>getComputedStyle(node).animationName==='none'))).toBe(true);
  await page.screenshot({path:info.outputPath('vocab-forced-colors.png'),fullPage:true});
});

test('vocab: hiding a region never leaves focus inside it; no parent form submission',async({page})=>{
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(input=>{window.formSaves=0;window.formSubmits=0;window.vocabController=window.iui.mount(document.getElementById('host'),{version:'iui/1',body:[{type:'form',label:'Review',action:'save',children:[input.body[0]]}]},{actions:{save(){window.formSaves++;}}});document.querySelector('form').addEventListener('submit',()=>window.formSubmits++);},fixture);
  const root=card(page),reveal=action(root,'reveal');await pointer(page,reveal);await action(root,'again').focus();await page.keyboard.press('Enter');
  // Intentional synthetic hide exercises the defensive focus fallback.
  await reveal.evaluate(el=>el.click());await expect(reveal).toBeFocused();await expect(root.locator('.iui-vocab-details')).toBeHidden();
  await page.keyboard.press('Space');await action(root,'familiar').focus();await page.keyboard.press('Space');await pointer(page,action(root,'reset'));await expect(action(root,'reset')).toBeFocused();
  expect(await page.evaluate(()=>[window.formSaves,window.formSubmits])).toEqual([0,0]);
});

test('vocab: atomic invalid update, successful reset and detached controls cannot mutate replacement',async({page})=>{
  await mount(page);const root=card(page);await pointer(page,action(root,'reveal'));await pointer(page,action(root,'again'));
  expect(await page.evaluate(()=>{const old=document.querySelector('.iui-vocab-card'),before=old.outerHTML,invalid=structuredClone(window.vocabInput);invalid.body[0].senses.push(invalid.body[0].senses[0]);let rejected=false;try{window.vocabController.update(invalid);}catch{rejected=true;}window.oldVocab=old;return rejected&&old.outerHTML===before&&old===document.querySelector('.iui-vocab-card');})).toBe(true);
  await page.evaluate(()=>window.vocabController.update(window.vocabInput));await expect(card(page).locator('.iui-vocab-details')).toBeHidden();
  expect(await page.evaluate(()=>{const replacement=document.querySelector('.iui-vocab-card'),current=replacement.outerHTML,old=window.oldVocab.outerHTML;for(const b of window.oldVocab.querySelectorAll('button'))b.click();return replacement.outerHTML===current&&window.oldVocab.outerHTML===old;})).toBe(true);
  expect(await page.evaluate(()=>{const old=document.querySelector('.iui-vocab-card'),before=old.outerHTML;window.vocabController.dispose();for(const b of old.querySelectorAll('button'))b.click();return !old.isConnected&&old.outerHTML===before;})).toBe(true);
});

test('vocab: owner iframe language, focus, ids and teardown are independent',async({page})=>{
  await mount(page);
  await page.evaluate(input=>{const frame=document.createElement('iframe');frame.id='vocab-frame';document.body.append(frame);const doc=frame.contentDocument;doc.documentElement.lang='zh-CN';const host=doc.createElement('div');doc.body.append(host);window.frameVocabController=window.iui.mount(host,input);},fixture);
  const frame=page.frameLocator('#vocab-frame'),root=frame.locator('.iui-vocab-card');await root.getByRole('button',{name:'显示释义'}).click();await root.getByRole('button',{name:'熟悉',exact:true}).click();
  await expect(root.getByRole('button',{name:'熟悉',exact:true})).toBeFocused();await expect(action(card(page),'reveal')).toHaveAttribute('aria-expanded','false');
  await page.evaluate(()=>window.vocabController.dispose());await root.getByRole('button',{name:'重置复习'}).click();await expect(root.getByRole('button',{name:'重置复习'})).toBeFocused();
});

test('vocab: public compiler hydrates offline without vocabulary requests',async({page})=>{
  const html=await compileHtml(fixture),requests=[];page.on('request',r=>requests.push(r.url()));await page.context().setOffline(true);await page.setContent(html);const root=card(page);
  await pointer(page,action(root,'reveal'));await expect(root.locator('.iui-vocab-meaning').first()).toHaveText(fixture.body[0].senses[0].meaning);expect(requests).toEqual([]);
});

test.describe('vocab touch',()=>{
  test.use({hasTouch:true,viewport:{width:390,height:950}});
  test('real touch reveal/rate/change/reset',async({page})=>{
    await mount(page);const root=card(page);await action(root,'reveal').tap();await expect(root.locator('.iui-vocab-details')).toBeVisible();await action(root,'again').tap();await action(root,'familiar').tap();await expect(action(root,'familiar')).toHaveAttribute('aria-pressed','true');await action(root,'reset').tap();await expect(root.locator('.iui-vocab-details')).toBeHidden();await expect(action(root,'familiar')).toHaveAttribute('aria-pressed','false');
  });
});

test('vocab: authored node ids cannot steal an internal accessibility reference',async({page})=>{
  const input=structuredClone(fixture);input.body.push({type:'box',children:Array.from({length:100},(_,i)=>['term','details','meanings','assessment'].map(suffix=>({type:'text',id:`vocab-${i+1}-${suffix}`,value:'Authored content'}))).flat()});
  await mount(page,input);const root=card(page);await pointer(page,action(root,'reveal'));
  expect(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.length===new Set(ids).size;})).toBe(true);
  expect(await action(root,'reveal').evaluate(el=>el.ownerDocument.getElementById(el.getAttribute('aria-controls'))===el.closest('.iui-vocab-card').querySelector('.iui-vocab-details'))).toBe(true);
});

test('vocab: inherited disabled and async form busy state reject forged clicks',async({page})=>{
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(input=>{window.vocabSaves=0;window.vocabController=window.iui.mount(document.getElementById('host'),{version:'iui/1',state:{locked:false},body:[{type:'form',label:'Review',action:'save',disabled:{$:'locked'},children:[input.body[0]]}]},{actions:{save(){window.vocabSaves++;return new Promise(resolve=>window.finishVocabSave=resolve);}}});},fixture);
  const root=card(page);await pointer(page,action(root,'reveal'));await pointer(page,action(root,'again'));const before=await root.evaluate(el=>el.outerHTML);
  await page.evaluate(()=>window.vocabController.setState({locked:true}));await expect(action(root,'reveal')).toBeDisabled();
  for(const name of ['reveal','again','familiar','reset'])await action(root,name).dispatchEvent('click');expect(await root.evaluate(el=>el.outerHTML)).toBe(before);
  await page.evaluate(()=>window.vocabController.setState({locked:false}));await page.locator('button[type=submit]').click();await expect(action(root,'reset')).toBeDisabled();
  for(const name of ['reveal','again','familiar','reset'])await action(root,name).dispatchEvent('click');expect(await root.evaluate(el=>el.outerHTML)).toBe(before);expect(await page.evaluate(()=>window.vocabSaves)).toBe(1);
  await page.evaluate(()=>window.finishVocabSave());await expect(action(root,'familiar')).toBeEnabled();await pointer(page,action(root,'familiar'));await expect(action(root,'familiar')).toHaveAttribute('aria-pressed','true');
});
