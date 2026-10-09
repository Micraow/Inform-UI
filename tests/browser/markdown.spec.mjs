// Prepared later-batch browser acceptance; not executed by the isolated worker.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/markdown-subset.json',import.meta.url),'utf8'));
const rtlFixture=JSON.parse(await readFile(new URL('../fixtures/markdown-rtl.json',import.meta.url),'utf8'));
async function mount(page,value=fixture,dir='ltr') {
 await page.goto('/mount.html'); await page.waitForFunction(()=>Boolean(window.iui));
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.evaluate(({value,dir})=>{const host=document.getElementById('host');host.dir=dir;window.mdController=window.iui.mount(host,value);},{value,dir});return requests;
}
for(const theme of ['light','dark']) for(const width of [390,768,1100]) test(`Markdown ${theme} ${width}: native flow/selection and local overflow`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1100});const input=structuredClone(width===768?rtlFixture:fixture);input.theme=theme;input.body.push({type:'markdown',value:'```\n'+ 'long_code_'.repeat(200)+'\n```\n\n'+'longword'.repeat(100)});
 const requests=await mount(page,input,width===768?'rtl':'ltr');
 await expect(page.locator('.iui-root')).toHaveCSS('direction',width===768?'rtl':'ltr');await expect(page.locator('.iui-markdown h1')).toHaveText('Markdown notes');await expect(page.locator('.iui-markdown img')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const overflowCode=page.locator('.iui-markdown .iui-code').last();expect(await overflowCode.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);await overflowCode.focus();await expect(overflowCode).toBeFocused();await page.keyboard.press('ArrowRight');await expect.poll(()=>overflowCode.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await expect(overflowCode).toBeFocused();
 const code=page.locator('.iui-code code').first();const selected=await code.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);return selection.toString();});expect(selected).toContain('中文 😀');
 const link=page.getByRole('link',{name:/Example source/});await link.focus();await expect(link).toBeFocused();expect(await link.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
 expect(requests).toEqual([]);await page.screenshot({path:testInfo.outputPath(`markdown-${theme}-${width}.png`),fullPage:true});
});
test('safe synthetic link native keyboard activation, isolated owner document, repeated replacement/dispose',async({page,context})=>{
 const destinationHeaders=[];await context.route('https://example.test/**',route=>{destinationHeaders.push(route.request().headers());return route.fulfill({status:200,contentType:'text/html',body:'Synthetic destination'});});
 const requests=await mount(page);const link=page.getByRole('link',{name:/Example source/});await link.focus();
 const popup=context.waitForEvent('page');await page.keyboard.press('Enter');const destination=await popup;await destination.waitForLoadState();expect(destination.url()).toBe('https://example.test/read');expect(await destination.evaluate(()=>window.opener===null)).toBe(true);expect(destinationHeaders[0].referer).toBeUndefined();await destination.close();
 await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const c=window.iui.mount(host,{version:'iui/1',body:[{type:'markdown',value:'**Other**'}]});if(host.querySelector('strong').ownerDocument!==frame.contentDocument)throw Error('Owner document mismatch');c.dispose();frame.remove();for(let i=0;i<20;i++)window.mdController.update({version:'iui/1',body:[{type:'markdown',value:'**'+i+'**'}]});});
 await expect(page.locator('.iui-markdown strong')).toHaveText('19');await page.evaluate(()=>{window.mdController.dispose();window.mdController.dispose();});await expect(page.locator('.iui-markdown')).toHaveCount(0);expect(requests).toEqual([]);
});
test('HTML, images, malformed delimiters and budget fallback remain inert without requests',async({page})=>{
 const raw='<script>window.pwned=true</script>\n![x](https://example.test/image.png)\n[unsafe](javascript:alert(1))\n```unclosed\n中文\r\n';
 const requests=await mount(page,{version:'iui/1',body:[{type:'markdown',value:raw},{type:'markdown',value:'*x* '.repeat(3000)}]});
 await expect(page.locator('.iui-markdown img,.iui-markdown script,.iui-markdown a')).toHaveCount(0);expect(await page.evaluate(()=>window.pwned)).toBeUndefined();await expect(page.locator('[data-markdown-fallback="budget"]')).toHaveText('*x* '.repeat(3000));expect(requests).toEqual([]);
});
