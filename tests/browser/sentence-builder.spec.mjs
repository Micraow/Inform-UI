// PREPARED, NOT EXECUTED in the isolated implementation environment.
// Native browser acceptance belongs to the later combined canonical batch.
import {test,expect} from '@playwright/test';
const exercise=()=>({type:'sentence-builder',title:'Arrange the words',prompt:'Use every supplied token.',tokens:[{id:'first',text:'I'},{id:'second',text:'I'},{id:'verb',text:'am'}],answer:['first','verb','second'],explanation:'Repeated words retain separate identities.'});
const documentFor=(node=exercise(),theme='light')=>({version:'iui/1',theme,state:{x:1},body:[node]});
const action=(root,name,id)=>root.locator(`button[data-sentence-action="${name}"]${id?`[data-token-id="${id}"]`:''}`);
async function open(page,spec=documentFor()) {
  await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
  await page.evaluate(spec=>{document.documentElement.lang='en';window.sentence=window.iui.mount(document.getElementById('host'),spec);},spec);
  return page.locator('.iui-sentence-builder');
}
const order=async root=>root.locator('.iui-sentence-builder-chosen>li').evaluateAll(items=>items.map(item=>item.dataset.tokenId));
async function pointerBoundary(page,button) {
  // Playwright locator.click waits for aria-disabled to clear; use a hit-tested native pointer instead.
  await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box).not.toBeNull();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  expect(await button.evaluate((button,{x,y})=>button.contains(document.elementFromPoint(x,y)),{x,y})).toBe(true);
  await page.mouse.click(x,y);
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`sentence builder ${theme} ${width}: native keyboard, pointer, lifecycle and stable focus`,async({page})=>{
  const errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173/'))external.push(request.url());});
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const root=await open(page,documentFor(exercise(),theme)),status=root.getByRole('status');
  await action(root,'check').focus();await page.keyboard.press('Enter');await expect(status).toContainText('Choose every token');await expect(root).toHaveAttribute('data-attempt','draft');
  await action(root,'add','first').focus();await page.keyboard.press('Space');await expect(action(root,'add','second')).toBeFocused();
  await action(root,'add','second').click();await action(root,'add','verb').click();await expect(action(root,'check')).toBeFocused();
  expect(await order(root)).toEqual(['first','second','verb']);
  const move=action(root,'later','second');await move.focus();await page.keyboard.press('Enter');await expect(move).toBeFocused();expect(await order(root)).toEqual(['first','verb','second']);
  await expect(move).toHaveAttribute('aria-disabled','true');const text=await status.textContent();
  await page.keyboard.press('Space');expect(await order(root)).toEqual(['first','verb','second']);await expect(status).toHaveText(text);await expect(move).toBeFocused();
  await pointerBoundary(page,move);expect(await order(root)).toEqual(['first','verb','second']);await expect(status).toHaveText(text);
  await action(root,'check').focus();await page.keyboard.press('Enter');await expect(root).toHaveAttribute('data-attempt','correct');await expect(action(root,'check')).toBeFocused();
  await action(root,'remove','second').click();await expect(action(root,'add','second')).toBeFocused();await expect(root).toHaveAttribute('data-attempt','draft');
  await action(root,'reveal').click();await expect(root).toHaveAttribute('data-attempt','revealed');expect(await order(root)).toEqual(['first','verb']);
  await action(root,'add','second').click();await action(root,'check').click();await expect(status).toContainText('not an independently correct attempt');await expect(root).toHaveAttribute('data-attempt','revealed');
  await move.focus();await move.evaluate(button=>window.retainedMove=button);
  await page.evaluate(()=>window.sentence.setState({x:2}));await expect(move).toBeFocused();expect(await move.evaluate(button=>button===window.retainedMove)).toBe(true);
  await page.setViewportSize({width:width+1,height:950});await expect(move).toBeFocused();await page.setViewportSize({width,height:1000});
  await expect(status).toHaveAttribute('aria-live','polite');await expect(root.getByRole('status')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/sentence-builder-${theme}-${width}.png`,fullPage:true});
  await action(root,'retry').click();await expect(action(root,'add','first')).toBeFocused();expect(await order(root)).toEqual([]);await expect(root.locator('.iui-sentence-builder-reference')).toBeHidden();
  expect(errors).toEqual([]);expect(external).toEqual([]);
});

test('sentence builder literal Arabic RTL, long tokens, empty joiner and forced colors',async({page})=>{
  await page.setViewportSize({width:390,height:1000});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const n=exercise();n.title='ترتيب الكلمات';n.prompt='رتّب الكلمات الأصلية';n.tokens=[{id:'first',text:'مرحبا'},{id:'second',text:'ط'.repeat(200)},{id:'verb',text:'😀\r\n中文 <script>never()</script>'}];n.joiner='';
  const root=await open(page,documentFor(n));
  expect(await root.evaluate(element=>getComputedStyle(element).direction)).toBe('rtl');
  await action(root,'add','first').click();await action(root,'add','verb').click();await action(root,'add','second').click();await action(root,'check').click();
  await expect(root).toHaveAttribute('data-attempt','correct');await expect(root.locator('script,img,iframe')).toHaveCount(0);
  expect(await root.locator('.iui-sentence-builder-chosen .iui-sentence-builder-token').nth(1).evaluate(element=>element.textContent)).toBe(n.tokens[2].text);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const earlier=action(root,'earlier','first');await earlier.focus();await page.keyboard.press('Enter');await expect(earlier).toBeFocused();
  await page.screenshot({path:'test-results/sentence-builder-rtl-forced-colors.png',fullPage:true});
});

for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`sentence builder native touch ${theme} ${width}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:true,isMobile:true,colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/mount.html');await page.waitForFunction(()=>window.iui);
  await page.evaluate(spec=>window.sentence=window.iui.mount(document.getElementById('host'),spec),documentFor(exercise(),theme));const root=page.locator('.iui-sentence-builder');
  await action(root,'add','first').tap();await action(root,'add','second').tap();await action(root,'add','verb').tap();await action(root,'later','second').tap();await action(root,'check').tap();await expect(root).toHaveAttribute('data-attempt','correct');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await action(root,'remove','verb').tap();expect(await order(root)).toEqual(['first','second']);await action(root,'retry').tap();expect(await order(root)).toEqual([]);await context.close();
});

test('sentence builder Enter inside external author form does not submit; invalid update is atomic and detached controls inert',async({page})=>{
  const root=await open(page);await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.before(form);form.append(host);window.submitted=0;form.addEventListener('submit',event=>{event.preventDefault();window.submitted++;});});
  for(const id of ['first','verb','second']){await action(root,'add',id).focus();await page.keyboard.press('Enter');}
  await action(root,'check').focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.submitted)).toBe(0);
  const result=await page.evaluate(()=>{const node=document.querySelector('.iui-sentence-builder');try{window.sentence.update({version:'iui/1',body:[{type:'sentence-builder',title:'Invalid',tokens:[],answer:[]}]});return false;}catch{return document.querySelector('.iui-sentence-builder')===node;}});expect(result).toBe(true);await expect(root).toHaveAttribute('data-attempt','correct');
  await page.evaluate(spec=>{window.oldRoot=document.querySelector('.iui-sentence-builder');window.oldRetry=window.oldRoot.querySelector('[data-sentence-action="retry"]');window.sentence.update(spec);window.oldRetry.click();},documentFor());
  expect(await page.evaluate(()=>window.oldRoot.querySelectorAll('.iui-sentence-builder-chosen>li').length)).toBe(3);expect(await order(root)).toEqual([]);
  await page.evaluate(()=>window.sentence.dispose());await expect(page.locator('#host')).toBeEmpty();
});

test('sentence builder inside tab panel preserves exact session and controls when hidden',async({page})=>{
  const n=exercise(),spec={version:'iui/1',state:{x:1},body:[{type:'tab-group',label:'Practice pages',children:[{type:'tab-panel',id:'practice',label:'Practice',children:[n]},{type:'tab-panel',id:'other',label:'Other',children:[{type:'text',value:'Other content'}]}]}]};
  await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
  const supported=await page.evaluate(spec=>window.iui.validateDocument(spec).ok,spec);
  expect(supported, 'Integrated tabs must remain supported; this case cannot silently skip').toBe(true);
  await page.evaluate(spec=>window.sentence=window.iui.mount(document.getElementById('host'),spec),spec);const root=page.locator('.iui-sentence-builder');
  await action(root,'add','first').click();await action(root,'reveal').click();await root.evaluate(root=>window.originalPractice=root);
  await page.getByRole('tab',{name:'Other',exact:true}).click();await expect(root).toBeHidden();await page.evaluate(()=>window.sentence.setState({x:2}));
  await page.getByRole('tab',{name:'Practice',exact:true}).click();await expect(root).toBeVisible();expect(await root.evaluate(root=>root===window.originalPractice)).toBe(true);expect(await order(root)).toEqual(['first']);await expect(root).toHaveAttribute('data-attempt','revealed');
});
