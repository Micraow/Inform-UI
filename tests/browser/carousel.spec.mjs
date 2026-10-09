// Prepared actual-browser acceptance. Never run in this isolated delivery.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {compileHtml} from '../../dist/index.js';
const require=createRequire(import.meta.url);
const fixture=JSON.parse(await readFile(new URL('../../examples/carousel.json',import.meta.url),'utf8'));
const rtlFixture=JSON.parse(await readFile(new URL('../fixtures/carousel-rtl.json',import.meta.url),'utf8'));
const contained=JSON.parse(await readFile(new URL('../../examples/carousel-contained.json',import.meta.url),'utf8'));
const byId=(page,id)=>page.locator(`[data-iui][id$="-${id}"]`);
async function mount(page,input=fixture,lang='en'){
 await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
 const requests=[];page.on('request',request=>requests.push(request.url()));
 await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.carouselInput=input;window.carouselController=window.iui.mount(host,input);},{input,lang});return requests;
}
async function beginScroll(rail){await rail.evaluate(el=>{el.__carouselScrollDone=new Promise(resolve=>{el.addEventListener('scrollend',()=>resolve(el.scrollLeft),{once:true});});});}
async function endScroll(rail){await rail.evaluate(el=>el.__carouselScrollDone);}
async function realClick(page,button){
 await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box).not.toBeNull();const point={x:box.x+box.width/2,y:box.y+box.height/2};
 expect(await button.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),point)).toBe(true);
 await page.mouse.click(point.x,point.y);
}
async function activate(page,rail,button,key){
 const canMove=await button.getAttribute('aria-disabled')==='false';await button.focus();const before=await rail.evaluate(el=>el.scrollLeft);
 if(canMove)await beginScroll(rail);
 if(key)await button.press(key);else await realClick(page,button);
 if(canMove)await endScroll(rail);else expect(await rail.evaluate(el=>el.scrollLeft)).toBe(before);
 await expect(button).toBeFocused();
}
async function boundary(page,rail,button){for(let i=0;i<30&&await button.getAttribute('aria-disabled')==='false';i++)await activate(page,rail,button);await expect(button).toHaveAttribute('aria-disabled','true');}
async function settled(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
test.beforeEach(async({page})=>{page.__carouselErrors=[];page.on('pageerror',e=>page.__carouselErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__carouselErrors).toEqual([]));
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`carousel ${theme} ${width}: responsive finite collection`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});const requests=await mount(page,{...fixture,theme});
 const block=byId(page,'main-rail'),rail=block.locator('.iui-carousel'),prev=block.getByRole('button',{name:'Previous items'}),next=block.getByRole('button',{name:'Next items'});
 await expect(rail).toHaveAccessibleName('Original items');await expect(rail).toHaveAttribute('tabindex','0');await expect(prev).toHaveAttribute('aria-disabled','true');await expect(next).toHaveAttribute('aria-disabled','false');
 const widthAndMax=await rail.evaluate(el=>({width:el.clientWidth,max:el.scrollWidth-el.clientWidth}));await activate(page,rail,next,'Enter');expect(await rail.evaluate(el=>el.scrollLeft)).toBe(Math.min(widthAndMax.width,widthAndMax.max));
 await boundary(page,rail,next);for(const key of ['Enter','Space',undefined])await activate(page,rail,next,key);await boundary(page,rail,prev);for(const key of ['Enter','Space',undefined])await activate(page,rail,prev,key);
 await expect(byId(page,'empty-rail')).toContainText('No items');await expect(byId(page,'empty-rail').locator('button,[tabindex]')).toHaveCount(0);await expect(byId(page,'single-rail').locator('button,[tabindex]')).toHaveCount(0);
 await expect(byId(page,'native-rail').locator('button')).toHaveCount(0);await expect(byId(page,'native-rail').locator('.iui-carousel')).toHaveAttribute('tabindex','0');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(block.locator(':scope > .iui-carousel-position[aria-live],:scope > .iui-carousel[aria-current],:scope > .iui-carousel[aria-selected]')).toHaveCount(0);
 await rail.focus();expect(await rail.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 expect(requests).toEqual([]);await page.screenshot({path:info.outputPath(`carousel-${theme}-${width}.png`),fullPage:true});
});
test('native keyboard is not intercepted; controls false scrolls natively',async({page})=>{
 await mount(page);const rail=byId(page,'native-rail').locator('.iui-carousel');await rail.focus();await beginScroll(rail);await page.keyboard.press('ArrowRight');await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await rail.evaluate(el=>{el.__keys=[];el.addEventListener('keydown',event=>queueMicrotask(()=>el.__keys.push({key:event.key,prevented:event.defaultPrevented})));});
 for(const key of ['Home','End','PageUp','PageDown'])await rail.press(key);
 expect(await rail.evaluate(el=>el.__keys)).toEqual(['Home','End','PageUp','PageDown'].map(key=>({key,prevented:false})));
});
test('Arabic-leading document uses actual RTL; next advances caller order without wrapping',async({page})=>{
 await mount(page,rtlFixture,'ar');
 const block=byId(page,'main-rail'),rail=block.locator('.iui-carousel'),next=block.getByRole('button',{name:'Next items'}),prev=block.getByRole('button',{name:'Previous items'});
 expect(await rail.evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');const before=await rail.locator(':scope > *').first().boundingBox();await activate(page,rail,next);const after=await rail.locator(':scope > *').first().boundingBox();expect(after.x).toBeGreaterThan(before.x);
 await boundary(page,rail,next);await activate(page,rail,next,'Space');await boundary(page,rail,prev);await activate(page,rail,prev,'Enter');
});
test('unrelated state and scrolling preserve invalid numeric draft and running timer identity',async({page})=>{
 await mount(page);const block=byId(page,'main-rail'),rail=block.locator('.iui-carousel'),input=block.getByLabel('Quantity'),timer=block.locator('[data-kind=timer]');
 await input.fill('9');await input.blur();await expect(input).toHaveAttribute('aria-invalid','true');await timer.locator('[data-time-action=start]').click();await expect(timer).toHaveAttribute('data-status','running');
 const kept=await page.evaluate(()=>{const rail=document.querySelector('.iui-carousel'),input=rail.querySelector('input'),timer=rail.querySelector('[data-kind=timer]');input.focus();const offset=rail.scrollLeft;window.carouselController.setState({count:9});return rail===document.querySelector('.iui-carousel')&&rail.querySelector('input')===input&&rail.querySelector('[data-kind=timer]')===timer&&input.value==='9'&&document.activeElement===input&&rail.scrollLeft===offset;});expect(kept).toBe(true);
 await activate(page,rail,block.getByRole('button',{name:'Next items'}));await expect(input).toHaveValue('9');await expect(timer).toHaveAttribute('data-status','running');
});
test('nested overlay uses top layer without clipping and survives unrelated state',async({page})=>{
 await mount(page);const block=byId(page,'main-rail');await block.getByRole('button',{name:'Open details',exact:true}).click();await block.getByRole('button',{name:'Nested details',exact:true}).click();const panel=block.getByRole('dialog',{name:'Nested details',exact:true,includeHidden:true});await expect(panel).toBeVisible();
 expect(await panel.evaluate(el=>el.matches(':popover-open'))).toBe(true);await page.evaluate(()=>window.carouselController.setState({count:2}));await expect(panel).toBeVisible();
 const box=await panel.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
 await page.keyboard.press('Escape');await expect(block.getByRole('button',{name:'Nested details',exact:true})).toBeFocused();
 // Scrolling is a separate lifecycle condition: an offscreen ancestor anchor
 // must dismiss its whole branch, as required by the overlay contract.
 await block.getByRole('button',{name:'Nested details',exact:true}).click();await expect(panel).toBeVisible();
 const rail=block.locator('.iui-carousel'),offset=await rail.evaluate(el=>el.scrollLeft),max=await rail.evaluate(el=>el.scrollWidth-el.clientWidth),target=offset<max?max:0;
 if(target!==offset){await beginScroll(rail);await rail.evaluate((el,target)=>el.scrollTo({left:target,behavior:'instant'}),target);await endScroll(rail);}
 const anchorOutside=await block.getByRole('button',{name:'Open details',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return r.right<0||r.left>innerWidth||r.bottom<0||r.top>innerHeight;});
 if(anchorOutside){await expect(block.locator('.iui-overlay-surface:not([hidden])')).toHaveCount(0);await expect(block.locator(':popover-open')).toHaveCount(0);}else{await expect(panel).toBeVisible();await page.keyboard.press('Escape');await expect(block.getByRole('button',{name:'Nested details',exact:true})).toBeFocused();}
});
test('real font and resize refresh preserve scroll, children and boundary focus',async({page})=>{
 await mount(page);const block=byId(page,'main-rail'),rail=block.locator('.iui-carousel');await rail.evaluate(el=>{el.__child=el.firstElementChild;});
 const fontPath=require.resolve('katex').replace(/dist\/katex\.js$/,'dist/fonts/KaTeX_Main-Regular.woff2');const bytes=(await readFile(fontPath)).toString('base64');
 await page.evaluate(async bytes=>{const face=new FontFace('CarouselFixture',`url(data:font/woff2;base64,${bytes})`);await face.load();document.fonts.add(face);document.querySelector('.iui-carousel').style.fontFamily='CarouselFixture';await document.fonts.ready;},bytes);await settled(page);
 await page.setViewportSize({width:390,height:1000});await expect(block.getByRole('button',{name:'Next items'})).toHaveAttribute('aria-disabled','false');expect(await rail.evaluate(el=>el.firstElementChild===el.__child)).toBe(true);
 await rail.evaluate(el=>{el.style.transform='scale(.9)';el.style.transformOrigin='top left';});await settled(page);await activate(page,rail,block.getByRole('button',{name:'Next items'}));
});
test('contained weather, finance, converter and long text/code/table never overflow page',async({page},info)=>{
 await page.setViewportSize({width:390,height:1000});await mount(page,{...fixture,body:[...fixture.body,...contained.body]});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const rail of await page.locator('.iui-carousel').all())expect(await rail.evaluate(el=>el.getBoundingClientRect().right<=innerWidth)).toBe(true);
 for(const kind of ['weather','finance-quote','unit-converter'])await expect(page.locator(`[data-iui="${kind}"]`)).toBeVisible();
 await page.screenshot({path:info.outputPath('carousel-contained-narrow.png'),fullPage:true});
});
test('independent foreign hosts, atomic invalid update and disposal own resources',async({page})=>{
 await mount(page);expect(await page.evaluate(()=>{const first=document.querySelector('.iui-carousel'),host=document.createElement('div');document.body.append(host);const second=window.iui.mount(host,window.carouselInput);window.carouselController.dispose();second.setState({count:4});const rail=host.querySelector('.iui-carousel');let rejected=false;try{second.update({version:'iui/1',body:[{type:'carousel',label:'',children:[]}]});}catch{rejected=true;}const stable=rail===host.querySelector('.iui-carousel');second.dispose();second.dispose();return rejected&&stable&&!first.isConnected&&!rail.isConnected;})).toBe(true);
 await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const c=window.iui.mount(host,window.carouselInput);if([...host.querySelectorAll('*')].some(el=>el.ownerDocument!==frame.contentDocument))throw Error('Wrong owner');c.dispose();frame.remove();});
});
test('compiled offline document mounts without network requests',async({page})=>{
 const html=await compileHtml(fixture);const requests=[];page.on('request',r=>requests.push(r.url()));await page.context().setOffline(true);await page.setContent(html);await expect(byId(page,'main-rail').locator('.iui-carousel')).toHaveAccessibleName('Original items');expect(requests).toEqual([]);
});
test('native horizontal wheel scroll and range hint describe partially visible children',async({page})=>{
 await mount(page);const block=byId(page,'native-rail'),rail=block.locator('.iui-carousel');await rail.scrollIntoViewIfNeeded();const box=await rail.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await beginScroll(rail);await page.mouse.wheel(180,0);await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 const range=await rail.evaluate(el=>{const r=el.getBoundingClientRect(),scale=r.width/el.offsetWidth,left=r.left+el.clientLeft*scale,right=left+el.clientWidth*scale;const shown=[...el.children].map((c,i)=>({i,r:c.getBoundingClientRect()})).filter(({r})=>r.right>left+.5&&r.left<right-.5);return {first:shown[0].i+1,last:shown.at(-1).i+1,total:el.childElementCount};});
 await expect(block.locator('.iui-carousel-position')).toHaveText(`Items ${range.first}–${range.last} of ${range.total} visible`);
});
test.describe('touch activation',()=>{
 test.use({hasTouch:true});
 test('disabled boundary tap is an exact no-op',async({page})=>{
  await mount(page);const block=byId(page,'main-rail'),rail=block.locator('.iui-carousel'),prev=block.getByRole('button',{name:'Previous items'});await expect(prev).toHaveAttribute('aria-disabled','true');await prev.focus();await prev.scrollIntoViewIfNeeded();const box=await prev.boundingBox(),point={x:box.x+box.width/2,y:box.y+box.height/2};expect(await prev.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),point)).toBe(true);const before=await rail.evaluate(el=>el.scrollLeft);await page.touchscreen.tap(point.x,point.y);expect(await rail.evaluate(el=>el.scrollLeft)).toBe(before);await expect(prev).toBeFocused();
 });
});

test('real touch scrolling and consecutive navigation taps preserve native child order',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,hasTouch:true,isMobile:true,viewport:{width:390,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const input={version:'iui/1',body:[{type:'carousel',id:'touch-rail',label:'Touch items',children:Array.from({length:6},(_,i)=>({type:'text',value:`Original touch item ${i+1}`}))}]};
  const requests=await mount(page,input),block=byId(page,'touch-rail'),rail=block.locator('.iui-carousel'),next=block.getByRole('button',{name:'Next items'}),previous=block.getByRole('button',{name:'Previous items'});
  await expect(next).toHaveAttribute('aria-disabled','false');
  await beginScroll(rail);await next.tap();await endScroll(rail);const first=await rail.evaluate(el=>el.scrollLeft);expect(first).toBeGreaterThan(0);
  await beginScroll(rail);await next.tap();await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(first);
  await boundary(page,rail,previous);expect(await rail.evaluate(el=>el.scrollLeft)).toBe(0);
  await rail.scrollIntoViewIfNeeded();const box=await rail.boundingBox(),start={x:box.x+box.width*.8,y:box.y+box.height/2};
  const cdp=await context.newCDPSession(page);await beginScroll(rail);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let step=1;step<=5;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x-step*box.width*.12,y:start.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await endScroll(rail);expect(await rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await expect(rail.locator(':scope > *')).toHaveText(input.body[0].children.map(child=>child.value));expect(requests).toEqual([]);expect(errors).toEqual([]);
 }finally{await context.close();}
});
