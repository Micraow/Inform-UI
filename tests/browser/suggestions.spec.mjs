// PREPARED, NOT EXECUTED in this isolated implementation.
// Native browser acceptance belongs to the accumulated integration batch.
import {test,expect} from '@playwright/test';
const suggestion=()=>({type:'prompt-suggestions',id:'reading',label:'Choose a reading topic',description:'Supplied choices with a local event preview.',initialVisible:2,items:Array.from({length:8},(_,i)=>({id:'idea'+i,text:`Supplied reading suggestion ${i+1}`}))});
const documentFor=(node=suggestion(),theme='light')=>({version:'iui/1',theme,state:{x:1,off:false},body:[node]});
const choice=(root,index)=>root.locator('.iui-suggestions-choice').nth(index);
const action=(root,name)=>root.locator(`[data-suggestions-action="${name}"]`);
async function open(page,spec=documentFor(),lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
  await page.evaluate(({spec,lang})=>{
    document.documentElement.lang=lang;
    window.suggestions=window.iui.mount(document.getElementById('host'),spec);
    window.suggestionEvents=[];
    const preview=document.createElement('p');preview.id='event-preview';preview.setAttribute('aria-label','Host event preview');document.body.append(preview);
    document.getElementById('host').addEventListener('iui:suggestion',event=>{
      window.suggestionEvents.push({detail:event.detail,target:event.target.dataset.iui,frozen:Object.isFrozen(event.detail),composed:event.composed,bubbles:event.bubbles,cancelable:event.cancelable});
      if(event.detail.suggestionId==='idea1'){event.preventDefault();return;}
      preview.textContent='Host received a local event: '+event.detail.text;
    });
  },{spec,lang});
  return page.locator('.iui-suggestions');
}
async function nativeBoundaryPointer(page,button){
  await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box).not.toBeNull();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  expect(await button.evaluate((button,{x,y})=>button.contains(document.elementFromPoint(x,y)),{x,y})).toBe(true);await page.mouse.click(x,y);
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`suggestions ${theme} ${width}: keyboard/pointer, cancelable event consumer and local lifecycle`,async({page})=>{
  const errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173/'))external.push(request.url());});
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const root=await open(page,documentFor(suggestion(),theme)),status=root.getByRole('status'),clear=action(root,'clear'),more=action(root,'expand');
  expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(0);
  await clear.focus();await page.keyboard.press('Enter');await expect(clear).toBeFocused();await expect(status).toHaveText('');await nativeBoundaryPointer(page,clear);await expect(status).toHaveText('');
  await choice(root,0).focus();await page.keyboard.press('Space');await expect(choice(root,0)).toBeFocused();await expect(choice(root,0)).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.suggestionEvents)).toEqual([{detail:{componentId:'reading',suggestionId:'idea0',text:'Supplied reading suggestion 1'},target:'prompt-suggestions',frozen:true,composed:false,bubbles:true,cancelable:true}]);
  await choice(root,1).click();await expect(choice(root,0)).toHaveAttribute('aria-pressed','true');await expect(choice(root,1)).toHaveAttribute('aria-pressed','false');await expect(status).toContainText('not accepted');
  await more.focus();await page.keyboard.press('Enter');await expect(more).toBeFocused();await expect(more).toHaveAttribute('aria-expanded','true');await expect(choice(root,7)).toBeVisible();
  await choice(root,7).click();await choice(root,7).evaluate(button=>window.retainedSuggestion=button);
  await more.focus();await page.keyboard.press('Space');await expect(more).toBeFocused();await expect(choice(root,7)).toBeHidden();await expect(choice(root,7)).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>window.suggestions.setState({x:2}));await expect(more).toBeFocused();expect(await choice(root,7).evaluate(button=>button===window.retainedSuggestion)).toBe(true);
  await more.click();await expect(choice(root,7)).toBeVisible();expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(3);
  await expect(page.locator('#event-preview')).toHaveText('Host received a local event: Supplied reading suggestion 8');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/suggestions-event-consumer-${theme}-${width}.png`,fullPage:true});
  await clear.focus();await page.keyboard.press('Enter');await expect(clear).toBeFocused();await expect(clear).toHaveAttribute('aria-disabled','true');await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(3);
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`suggestions ${theme} ${width}: native touch selects once and preserves expansion`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:true,colorScheme:theme});const page=await context.newPage();
  const root=await open(page,documentFor(suggestion(),theme));await choice(root,0).tap();expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(1);
  await action(root,'expand').tap();await choice(root,7).tap();await expect(choice(root,7)).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(2);
  await action(root,'expand').tap();await expect(choice(root,7)).toBeHidden();await expect(choice(root,7)).toHaveAttribute('aria-pressed','true');await page.screenshot({path:`test-results/suggestions-touch-${theme}-${width}.png`,fullPage:true});await context.close();
});
test('suggestions Arabic-first RTL, exact long literal text and forced colors',async({page})=>{
  await page.setViewportSize({width:390,height:1000});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const n=suggestion();n.label='اقتراحات للقراءة';n.description='اختر اقتراحًا من القائمة';n.items[0].text='ط'.repeat(2000);n.items[1].text='مرحبا 😀\r\n<script>never()</script>';
  const root=await open(page,documentFor(n));expect(await root.evaluate(element=>getComputedStyle(element).direction)).toBe('rtl');await choice(root,0).click();await expect(choice(root,0)).toHaveAttribute('aria-pressed','true');expect(await choice(root,0).textContent()).toBe(n.items[0].text);expect(await choice(root,1).textContent()).toBe(n.items[1].text);await expect(root.locator('script,img,iframe,a')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/suggestions-rtl-forced-colors.png',fullPage:true});
});
test('suggestions Chinese UI, disabled form/no-submit and synchronous replacement/disposal',async({page})=>{
  const n=suggestion(),spec=documentFor({type:'form',label:'Local preferences',disabled:{$:'off'},children:[n]});const root=await open(page,spec,'zh-CN');
  await expect(action(root,'expand')).toHaveText('显示更多');await page.evaluate(()=>{window.formSubmits=0;document.querySelector('form').addEventListener('submit',()=>window.formSubmits++);});
  await choice(root,0).focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.formSubmits)).toBe(0);await expect(root.getByRole('status')).toContainText('宿主应用');
  await page.evaluate(()=>window.suggestions.setState({off:true}));await expect(choice(root,0)).toBeDisabled();await choice(root,0).evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(await page.evaluate(()=>window.suggestionEvents.length)).toBe(1);
  await page.evaluate(()=>window.suggestions.setState({off:false}));
  await page.evaluate(spec=>{window.oldSuggestionRoot=document.querySelector('.iui-suggestions');window.oldSuggestionHtml=window.oldSuggestionRoot.innerHTML;window.oldSuggestionRoot.addEventListener('iui:suggestion',()=>window.suggestions.update(spec),{once:true});},spec);
  await choice(root,0).click();expect(await page.evaluate(()=>window.oldSuggestionRoot.innerHTML===window.oldSuggestionHtml)).toBe(true);await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.evaluate(()=>document.querySelector('.iui-suggestions').addEventListener('iui:suggestion',()=>window.suggestions.dispose(),{once:true}));await choice(root,0).click();await expect(page.locator('#host')).toBeEmpty();
});
