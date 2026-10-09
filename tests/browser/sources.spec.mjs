// Portable acceptance specification for the integrator's next browser batch.
// This candidate has NOT executed a real browser or produced screenshots.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { compileHtml } from '../../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../../examples/source-cards.json',import.meta.url),'utf8'));
const rtlFixture=JSON.parse(await readFile(new URL('../fixtures/source-rtl.json',import.meta.url),'utf8'));
const byId=(page,id)=>page.locator(`[data-iui][id$="-${id}"]`);
async function mount(page,input=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.sourceSpec=input;window.sourceController=window.iui.mount(host,input);},{input,lang});
  return requests;
}
async function beginScroll(rail){
  // Register completion BEFORE the action. Only use for actions proven to have
  // room to move. Boundary/no-overflow actions take the explicit no-scroll path.
  await rail.evaluate(el=>{el.__sourceScrollDone=new Promise(resolve=>{const end=()=>{el.removeEventListener('scrollend',end);resolve(el.scrollLeft);};el.addEventListener('scrollend',end);});});
}
async function endScroll(rail){await rail.evaluate(el=>el.__sourceScrollDone);}
async function pointerButton(button,touch=false){
  // aria-disabled retains native focus/click semantics, but Playwright locator
  // actionability refuses it. Exercise a real visible pointer hit instead.
  await button.scrollIntoViewIfNeeded();const rect=await button.boundingBox();expect(rect).not.toBeNull();
  const point={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
  expect(await button.evaluate((el,p)=>el.ownerDocument.elementFromPoint(p.x,p.y)?.closest('button')===el,point)).toBe(true);
  if(touch)await button.page().touchscreen.tap(point.x,point.y);else await button.page().mouse.click(point.x,point.y);
}
async function activate(rail,button,key){
  const canMove=await button.getAttribute('aria-disabled')==='false';
  const before=await rail.evaluate(el=>el.scrollLeft);
  await button.focus();if(canMove)await beginScroll(rail);
  if(key)await button.press(key);else if(canMove)await button.click();else await pointerButton(button);
  if(canMove)await endScroll(rail);else expect(await rail.evaluate(el=>el.scrollLeft)).toBe(before);
  await expect(button).toBeFocused();
}
async function goBoundary(rail,button){
  const count=await rail.locator('li').count();
  for(let i=0;i<count&&await button.getAttribute('aria-disabled')==='false';i++)await activate(rail,button);
  await expect(button).toHaveAttribute('aria-disabled','true');
}
test.beforeEach(async({page})=>{page.__sourceErrors=[];page.on('pageerror',error=>page.__sourceErrors.push(error.message));});
test.afterEach(async({page})=>expect(page.__sourceErrors).toEqual([]));

for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`sources ${theme} ${width}px: responsive native links, bounded navigation and stable state`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:1050});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});const requests=await mount(page,{...fixture,theme});
  const block=byId(page,'sample-links'),rail=block.getByRole('list',{name:'Fictional source links'}),previous=block.getByRole('button',{name:'Previous links'}),next=block.getByRole('button',{name:'Next links'});
  await expect(block).toHaveAccessibleName('Fictional source links');await expect(previous).toHaveAttribute('aria-disabled','true');await expect(next).toHaveAttribute('aria-disabled','false');await expect(rail).toHaveAttribute('tabindex','0');
  await expect(rail.locator('li')).toHaveCount(7);await expect(rail.locator('a')).toHaveCount(7);await expect(rail.getByRole('link',{name:'Duplicate fictional title',exact:true})).toHaveCount(2);
  const citation=byId(page,'sample-citation');await expect(citation.locator('.iui-source-number')).toHaveText('[7]');await expect(citation.getByRole('link',{name:'Synthetic citation'})).toHaveAccessibleDescription('Opens in a new tab');
  for(const link of await page.locator('.iui-source-title').all()){await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');}
  expect(await page.locator('.iui-source-title').first().evaluate(el=>getComputedStyle(el).color)).toBe(theme==='dark'?'rgb(255, 255, 255)':'rgb(13, 13, 13)');
  const geometry=await rail.evaluate(el=>({width:el.clientWidth,before:el.scrollLeft,max:el.scrollWidth-el.clientWidth}));
  await activate(rail,next,'Enter');const after=await rail.evaluate(el=>el.scrollLeft);expect(Math.abs(after-Math.min(geometry.max,geometry.before+geometry.width))).toBeLessThanOrEqual(1);
  await goBoundary(rail,next);const end=await rail.evaluate(el=>({offset:el.scrollLeft,max:el.scrollWidth-el.clientWidth}));expect(Math.abs(end.offset-end.max)).toBeLessThanOrEqual(1);
  await activate(rail,next,'Enter');await activate(rail,next,'Space');await activate(rail,next);await goBoundary(rail,previous);expect(await rail.evaluate(el=>el.scrollLeft)).toBe(0);await activate(rail,previous,'Space');
  await rail.focus();expect(await rail.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  const first=rail.locator('a').first();await first.focus();await expect(first).toBeFocused();expect(await first.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  const stable=await page.evaluate(()=>{const root=document.querySelector('[id$="-sample-links"]'),rail=root.querySelector('ul'),anchor=rail.querySelector('a'),offset=rail.scrollLeft;window.sourceController.setState({count:4});window.sourceController.setState({count:4});return root.querySelector('ul')===rail&&rail.querySelector('a')===anchor&&document.activeElement===anchor&&rail.scrollLeft===offset;});expect(stable).toBe(true);
  const textBounds=await page.locator('.iui-source-card,.iui-citation').evaluateAll(nodes=>nodes.map(el=>{const bounds=el.getBoundingClientRect();const range=el.ownerDocument.createRange();range.selectNodeContents(el.querySelector('.iui-source-content'));return {overflow:el.scrollWidth>el.clientWidth+1,bounds:{left:bounds.left,right:bounds.right},fragments:[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>({left:r.left,right:r.right}))};}));
  for(const measured of textBounds){expect(measured.overflow).toBe(false);for(const fragment of measured.fragments){expect(fragment.left).toBeGreaterThanOrEqual(measured.bounds.left-1);expect(fragment.right).toBeLessThanOrEqual(measured.bounds.right+1);}}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.iui-source-card [aria-selected],.iui-source-card [aria-current],.iui-web-link-cards [aria-live]')).toHaveCount(0);
  expect(requests).toEqual([]);await page.screenshot({path:testInfo.outputPath(`sources-${theme}-${width}.png`),fullPage:true});
});

test('native keyboard scrolling and link activation retain browser semantics',async({page})=>{
  await mount(page);const block=byId(page,'sample-links'),rail=block.locator('ul'),next=block.getByRole('button',{name:'Next links'});await expect(next).toHaveAttribute('aria-disabled','false');
  await rail.focus();await beginScroll(rail);await page.keyboard.press('ArrowRight');await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await expect(rail).toBeFocused();
  // PageDown is left to the browser, including any native ancestor scrolling.
  // Verify it is not cancelled or mapped into an artificial selected-slide state.
  await rail.evaluate(el=>{el.__pageKey=null;el.addEventListener('keydown',event=>{if(event.key==='PageDown')queueMicrotask(()=>{el.__pageKey={prevented:event.defaultPrevented,key:event.key};});},{once:true});});await page.keyboard.press('PageDown');expect(await rail.evaluate(el=>el.__pageKey)).toEqual({prevented:false,key:'PageDown'});await expect(rail).toBeFocused();
  await goBoundary(rail,block.getByRole('button',{name:'Previous links'}));const first=rail.locator('a').first();await first.focus();
  // The only activated URL is fully intercepted synthetic content; it cannot
  // reach an external source. Popup observation is registered before Enter.
  await page.context().route('https://example.invalid/first',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic intercepted target</title><p>Original test fixture</p>'}));
  const popupPromise=page.waitForEvent('popup');await first.press('Enter');const popup=await popupPromise;await popup.waitForLoadState();expect(popup.url()).toBe('https://example.invalid/first');expect(await popup.evaluate(()=>window.opener)).toBe(null);await popup.close();
});

test('RTL logical next/previous move through caller order and do not wrap',async({page})=>{
  await mount(page,rtlFixture,'ar');const block=byId(page,'sample-links'),rail=block.locator('ul'),prev=block.getByRole('button',{name:'Previous links'}),next=block.getByRole('button',{name:'Next links'});
  expect(await rail.evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');await expect(next).toHaveAttribute('aria-disabled','false');const start=await rail.evaluate(el=>el.firstElementChild.getBoundingClientRect().right);
  await activate(rail,next,'Space');expect(await rail.evaluate(el=>el.firstElementChild.getBoundingClientRect().right)).toBeGreaterThan(start);await goBoundary(rail,next);await expect(rail.locator('a').last()).toBeInViewport();await activate(rail,next,'Enter');
  await goBoundary(rail,prev);await expect(rail.locator('a').first()).toBeInViewport();await rail.focus();await beginScroll(rail);await page.keyboard.press('ArrowLeft');await endScroll(rail);expect(await rail.evaluate(el=>el.firstElementChild.getBoundingClientRect().right)).toBeGreaterThan(start);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('no-overflow, host resizing and zoom-like font changes recompute boundaries without focus theft',async({page})=>{
  await mount(page);const single=byId(page,'single-link'),singleRail=single.locator('ul');await expect(singleRail).not.toHaveAttribute('tabindex');for(const button of await single.getByRole('button').all()){await expect(button).toHaveAttribute('aria-disabled','true');await activate(singleRail,button,'Space');}
  await single.evaluate(el=>el.style.zoom='1.5');await expect(singleRail).not.toHaveAttribute('tabindex');for(const button of await single.getByRole('button').all())await expect(button).toHaveAttribute('aria-disabled','true');
  // Use exactly two finite cards so a wider real host removes overflow.
  await page.evaluate(()=>{const host=document.createElement('div');host.id='resize-host';host.style.inlineSize='300px';document.body.append(host);window.resizeSources=window.iui.mount(host,{version:'iui/1',body:[{type:'web-link-cards',label:'Resize fixture',items:[{title:'One synthetic card',url:'https://example.invalid/one'},{title:'Two synthetic card',url:'https://example.invalid/two'}]}]});});
  const resize=page.locator('#resize-host'),rail=resize.locator('ul'),next=resize.getByRole('button',{name:'Next links'}),focus=byId(page,'sample-citation').locator('a');await expect(next).toHaveAttribute('aria-disabled','false');await focus.focus();
  await resize.evaluate(el=>el.style.inlineSize='1000px');await expect(next).toHaveAttribute('aria-disabled','true');await expect(rail).not.toHaveAttribute('tabindex');await expect(focus).toBeFocused();
  await resize.evaluate(el=>el.style.inlineSize='300px');await expect(next).toHaveAttribute('aria-disabled','false');await expect(rail).toHaveAttribute('tabindex','0');await expect(focus).toBeFocused();
  await resize.evaluate(el=>{el.style.inlineSize='1000px';el.querySelector('.iui-root').style.fontSize='28px';});await expect(rail).not.toHaveAttribute('tabindex');await expect(focus).toBeFocused();
  await page.evaluate(()=>window.resizeSources.dispose());
});

test('forced colors and motion preferences keep meaningful labels and bounded focus visible',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await mount(page);const block=byId(page,'sample-links'),rail=block.locator('ul');await expect(block.getByRole('button',{name:'Next links'})).toHaveAttribute('aria-disabled','false');await rail.focus();expect(await rail.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');expect(await rail.evaluate(el=>getComputedStyle(el).scrollBehavior)).toBe('auto');
  await expect(block.locator('.iui-source-label')).toBeVisible();expect(await block.locator('li').first().evaluate(el=>getComputedStyle(el).borderTopStyle)).toBe('solid');await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});expect(await rail.evaluate(el=>getComputedStyle(el).scrollBehavior)).toBe('auto');
});

test('foreign ownerDocument and multiple hosts keep IDs, language, theme and lifecycle independent',async({page})=>{
  await mount(page);const result=await page.evaluate(()=>{
    const second=document.createElement('div');second.id='second-source-host';second.lang='zh-Hant';document.body.append(second);const other=window.iui.mount(second,{...window.sourceSpec,theme:'dark'});
    const frame=document.createElement('iframe');frame.title='Foreign source document';document.body.append(frame);const foreign=frame.contentDocument.createElement('div');foreign.lang='en';frame.contentDocument.body.append(foreign);const foreignController=window.iui.mount(foreign,window.sourceSpec);
    const own=[...foreign.querySelectorAll('.iui-source-title,.iui-source-rail,.iui-source-controls button')].every(el=>el.ownerDocument===frame.contentDocument),ids=[...document.querySelectorAll('[id]')].map(el=>el.id);const local=second.querySelector('.iui-source-title');local.focus();window.sourceController.dispose();other.setState({count:2});
    const answer={own,unique:new Set(ids).size===ids.length,focused:document.activeElement===local,label:second.querySelector('.iui-source-next').textContent,color:getComputedStyle(local).color};other.dispose();foreignController.dispose();return answer;
  });expect(result).toEqual({own:true,unique:true,focused:true,label:'下一页链接',color:'rgb(255, 255, 255)'});
});

test('invalid updates are atomic and detached controls cannot affect replacement source rails',async({page})=>{
  await mount(page);const next=byId(page,'sample-links').getByRole('button',{name:'Next links'});await expect(next).toHaveAttribute('aria-disabled','false');await next.focus();
  const result=await page.evaluate(()=>{const c=window.sourceController,host=document.getElementById('host'),root=host.firstElementChild,focus=document.activeElement,state=JSON.stringify(c.getState()),html=root.outerHTML;const bad=[{type:'citation',title:'Synthetic',url:'javascript:bad()'},{type:'web-link-cards',label:'Bad empty',items:[]}];const rejected=bad.map(node=>{try{c.update({version:'iui/1',body:[node]});return false;}catch{return host.firstElementChild===root&&root.outerHTML===html&&document.activeElement===focus&&JSON.stringify(c.getState())===state;}});const oldRail=root.querySelector('ul'),oldButton=root.querySelector('.iui-source-next'),oldOffset=oldRail.scrollLeft;c.update(window.sourceSpec);oldButton.click();const detached=oldRail.scrollLeft===oldOffset&&!oldRail.isConnected;const current=host.querySelector('ul');c.dispose();c.dispose();return {rejected,detached,empty:host.childElementCount===0,removed:!current.isConnected};});expect(result).toEqual({rejected:[true,true],detached:true,empty:true,removed:true});
});

test('compiled source document stays offline until intentional link activation and escapes literal data',async({page})=>{
  const literal='</script><img src="https://example.invalid/pixel" onerror="bad()">';const html=await compileHtml({version:'iui/1',body:[{type:'citation',title:literal,url:'https://example.invalid/synthetic',description:literal},{type:'web-link-cards',label:'离线合成示例',items:[{title:literal,url:'https://example.invalid/card'}]}]},{lang:'zh-CN'});
  const requests=[];page.on('request',request=>requests.push(request.url()));await page.route('**/sources-portable.html',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('/sources-portable.html');await expect(page.locator('.iui-source-title')).toHaveText([literal,literal]);await expect(page.locator('.iui-source-next')).toHaveText('下一页链接');await expect(page.locator('img,iframe,svg use,svg image')).toHaveCount(0);expect(requests.filter(url=>!url.endsWith('/sources-portable.html')&&!url.endsWith('/favicon.ico'))).toEqual([]);
});

test('touch buttons and native rail swipes preserve bounded link-card navigation',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,hasTouch:true,isMobile:true,viewport:{width:390,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    const requests=await mount(page),block=byId(page,'sample-links'),rail=block.locator('ul'),next=block.getByRole('button',{name:'Next links'}),previous=block.getByRole('button',{name:'Previous links'});
    await expect(next).toHaveAttribute('aria-disabled','false');
    await beginScroll(rail);await next.tap();await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
    await beginScroll(rail);await previous.tap();await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBe(0);
    await pointerButton(previous,true);expect(await rail.evaluate(el=>el.scrollLeft)).toBe(0);
    await rail.scrollIntoViewIfNeeded();const bounds=await rail.boundingBox(),start={x:bounds.x+bounds.width*.8,y:bounds.y+Math.min(50,bounds.height/2)};
    const cdp=await context.newCDPSession(page);await beginScroll(rail);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    for(let step=1;step<=5;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x-step*bounds.width*.12,y:start.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await endScroll(rail);
    expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await expect(previous).toHaveAttribute('aria-disabled','false');
    const single=byId(page,'single-link'),smallRail=single.locator('ul'),still=await smallRail.evaluate(el=>el.scrollLeft);
    await pointerButton(single.getByRole('button',{name:'Next links'}),true);expect(await smallRail.evaluate(el=>el.scrollLeft)).toBe(still);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);
  }finally{await context.close();}
});
