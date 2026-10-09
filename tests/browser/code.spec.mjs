// PREPARED, NOT RUN. Copy into integrated repository tests/browser/.
// Trusted browser clicks/keys are real. Clipboard stub suites explicitly use a stub.
// No permissions are requested, no clipboard reads, and no real clipboard success is assumed.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {compileHtml} from '../../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../../examples/code.json',import.meta.url),'utf8'));
const contained=JSON.parse(await readFile(new URL('../../examples/code-contained.json',import.meta.url),'utf8'));
const byId=(page,id)=>page.locator(`[data-iui][id$="-${id}"]`);
const source=fixture.body.find(n=>n.id==='main-code').value;
async function mount(page,input=fixture,lang='en'){
 await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
 await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.codeInput=input;window.codeController=window.iui.mount(host,input);},{input,lang});
}
async function stub(page){await page.evaluate(()=>{window.codeWrites=[];window.codePending=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(value){window.codeWrites.push(value);return new Promise((resolve,reject)=>window.codePending.push({resolve,reject}));}}});});}
async function finish(page,result='resolve',index=0){await page.evaluate(({result,index})=>window.codePending[index][result](result==='reject'?new Error('NotAllowedError'):undefined),{result,index});}
async function pointer(page,b){await b.scrollIntoViewIfNeeded();const rect=await b.boundingBox();expect(rect).not.toBeNull();const point={x:rect.x+rect.width/2,y:rect.y+rect.height/2};expect(await b.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),point)).toBe(true);await page.mouse.click(point.x,point.y);}
// Locator.click respects aria-disabled; raw mouse is intentional for repeated busy activation.
async function repeatBusyPointer(page,b){const rect=await b.boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);}
test.beforeEach(async({page})=>{page.__codeErrors=[];page.on('pageerror',e=>page.__codeErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__codeErrors).toEqual([]));
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`code ${theme} ${width}: local overflow, full-code native selection, keyboard focus`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await mount(page,{...fixture,theme});
 const out=byId(page,'main-code'),pre=out.locator('pre');expect(await pre.locator('code').textContent()).toBe(source);
 expect(await pre.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await pre.focus();await expect(pre).toBeFocused();await page.keyboard.press('ArrowRight');await expect.poll(()=>pre.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 expect(await pre.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 // Select the entire native DOM range. Its source text is exact; the browser
 // may normalize line endings in rendered Selection.toString()/OS copying.
 expect(await pre.locator('code').evaluate(el=>{const s=el.ownerDocument.getSelection(),r=el.ownerDocument.createRange();r.selectNodeContents(el);s.removeAllRanges();s.addRange(r);if(s.isCollapsed||s.rangeCount!==1)throw Error('Full selection missing');return s.getRangeAt(0).toString();})).toBe(source);
 await page.screenshot({path:info.outputPath(`code-${theme}-${width}.png`),fullPage:true});
});
test('contained cards/grid never create body overflow; reduced motion and forced colors',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await mount(page,contained);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const b=byId(page,'main-code').getByRole('button');await b.focus();await page.keyboard.press('Tab');await expect(byId(page,'main-code').locator('pre')).toBeFocused();
 expect(await byId(page,'main-code').locator('pre').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
});
test('STUB: real pointer, Enter, Space; repeated busy activation does not duplicate; explicit retries',async({page})=>{
 await mount(page);await stub(page);const out=byId(page,'main-code'),b=out.getByRole('button',{name:'Copy code'}),status=out.getByRole('status');
 await pointer(page,b);await expect(b).toHaveAttribute('aria-disabled','true');await expect(b).toBeFocused();await repeatBusyPointer(page,b);await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.codeWrites)).toEqual([source]);
 await finish(page);await expect(status).toHaveText('Code copied.');await expect(b).toBeFocused();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.codeWrites.length)).toBe(2);await finish(page,'reject',1);await expect(status).toHaveText('Could not copy. Select the code and copy it manually.');await expect(b).toBeFocused();
 await page.keyboard.press('Space');expect(await page.evaluate(()=>window.codeWrites)).toEqual([source,source,source]);await finish(page,'resolve',2);await expect(status).toHaveText('Code copied.');
});
test('STUB: synthetic click rejected, no startup access, two per-instance requests',async({page})=>{
 await mount(page);await stub(page);const first=byId(page,'main-code'),second=byId(page,'python-code');
 await first.getByRole('button').evaluate(el=>el.click());expect(await page.evaluate(()=>window.codeWrites)).toEqual([]);
 await pointer(page,first.getByRole('button'));await pointer(page,second.getByRole('button'));expect(await page.evaluate(()=>window.codeWrites.length)).toBe(2);
 await finish(page);await expect(first.getByRole('status')).toHaveText('Code copied.');await expect(second.getByRole('status')).toHaveText('Copying…');await finish(page,'reject',1);await expect(second.getByRole('status')).toContainText('Could not copy');
});
for(const action of ['update','dispose'])for(const result of ['resolve','reject'])test(`STUB: ${action} while pending ${result} has no late DOM writes`,async({page})=>{
 await mount(page);await stub(page);const b=byId(page,'main-code').getByRole('button');await pointer(page,b);
 await page.evaluate(action=>{window.oldCode=document.querySelector('.iui-code-block');window.oldCodeHTML=window.oldCode.outerHTML;if(action==='update')window.codeController.update(window.codeInput);else window.codeController.dispose();},action);
 await finish(page,result);expect(await page.evaluate(()=>!window.oldCode.isConnected&&window.oldCode.outerHTML===window.oldCodeHTML)).toBe(true);
 if(action==='update')await expect(byId(page,'main-code').getByRole('status')).toHaveText('');
});
test('Chinese/RTL labels stay literal and header follows surrounding direction',async({page})=>{
 await mount(page,{...fixture,description:'مثال برمجي أصلي للاختبار.'},'zh-CN');const out=byId(page,'main-code');await expect(out.getByRole('button')).toHaveText('复制代码');
 expect(await out.locator('.iui-code-header').evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');expect(await out.locator('pre').evaluate(el=>getComputedStyle(el).direction)).toBe('ltr');
 const unknown=byId(page,'unknown-code');await expect(unknown.locator('.iui-code-language')).toHaveText('<unknown>');expect(await unknown.locator('code').textContent()).toBe(fixture.body.find(n=>n.id==='unknown-code').value);await expect(unknown.locator('script,img')).toHaveCount(0);
});
test('STUB: owner iframe clipboard is used, parent clipboard is untouched',async({page})=>{
 await mount(page);await page.evaluate(()=>{window.parentWrites=0;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(){window.parentWrites++;return Promise.reject(Error('Wrong owner'));}}});const frame=document.createElement('iframe');frame.id='code-frame';document.body.append(frame);const doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);frame.contentWindow.frameWrites=[];Object.defineProperty(frame.contentWindow.navigator,'clipboard',{configurable:true,value:{writeText(value){frame.contentWindow.frameWrites.push(value);return Promise.resolve();}}});window.frameCodeController=window.iui.mount(host,window.codeInput);});
 const b=page.frameLocator('#code-frame').locator('[id$="-main-code"] button');await b.click();await expect(page.frameLocator('#code-frame').locator('[id$="-main-code"] [role=status]')).toHaveText('Code copied.');expect(await page.evaluate(()=>window.parentWrites)).toBe(0);expect(await page.evaluate(()=>document.getElementById('code-frame').contentWindow.frameWrites)).toEqual([source]);
});
test('real clipboard API smoke: report permission outcome without requesting permission',async({page},info)=>{
 await mount(page);const out=byId(page,'main-code');await pointer(page,out.getByRole('button'));await expect(out.getByRole('status')).toHaveText(/^(Code copied\.|Could not copy\. Select the code and copy it manually\.)$/);
 info.annotations.push({type:'native clipboard outcome',description:await out.getByRole('status').textContent()});expect(await out.locator('code').textContent()).toBe(source);await expect(out.getByRole('button')).toBeFocused();
});
test('public compiler offline hydration preserves exact code without code-related requests',async({page})=>{
 const html=await compileHtml(fixture),requests=[];page.on('request',r=>requests.push(r.url()));await page.context().setOffline(true);await page.setContent(html);expect(await byId(page,'main-code').locator('code').textContent()).toBe(source);expect(requests).toEqual([]);await expect(byId(page,'unknown-code').locator('img,script')).toHaveCount(0);
});
