import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const bundle=fileURLToPath(new URL('../../dist/v2/inform-core.global.js',import.meta.url));
const value='#!/bin/bash\r\necho "$HOME"\t# literal <script>alert(1)</script>\n';
async function mount(page,theme='light'){
 await page.goto('/mount.html');await page.addScriptTag({path:bundle});
 await page.evaluate(({value,theme})=>{const host=document.getElementById('host');host.replaceChildren();window.foundationApp=InformUI.mount(host,{theme,source:'$draft=""\nroot=Stack([Code({value:'+JSON.stringify(value)+',language:"bash"}),CodeView({value:"no controls",copy:false,highlight:false,showLanguage:false}),Code({value:"inline  space",inline:true}),Input("Draft",$draft)])'});},{value,theme});
}
for(const theme of ['light','dark'])for(const width of [390,1100])test(`foundation Code defaults and inline in ${theme} at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});await mount(page,theme);
 const code=page.locator('[data-component=Code]').first();
 await expect(code.locator('.iui-code-language')).toHaveText('bash');await expect(code.getByRole('button',{name:'Copy code'})).toBeVisible();
 expect(await code.locator('code').textContent()).toBe(value);await expect(code.locator('.iui-code-token-built_in')).toHaveText('echo');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('[data-component=CodeView]')).toHaveJSProperty('tagName','PRE');
 expect(await page.locator('.iui-inline-code').evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('break-spaces');
 expect(await page.locator('.iui-inline-code').evaluate(e=>getComputedStyle(e).overflowWrap)).toBe('anywhere');
 await code.locator('pre').focus();expect(await code.locator('pre').evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
 await expect(code.locator('script,img')).toHaveCount(0);
});
test('STUB: foundation trusted copy, pending retention, retry and stale completion',async({page})=>{
 await mount(page);await page.evaluate(()=>{window.writes=[];window.pending=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(text){window.writes.push(text);return new Promise((resolve,reject)=>window.pending.push({resolve,reject}));}}});});
 const code=page.locator('[data-component=Code]').first(),button=code.getByRole('button');
 await button.evaluate(e=>e.click());expect(await page.evaluate(()=>window.writes)).toEqual([]);
 await button.click();await expect(code.getByRole('status')).toHaveText('Copying…');expect(await page.evaluate(()=>window.writes)).toEqual([value]);
 await code.evaluate(e=>{window.savedCode=e;e.querySelector('pre').scrollLeft=20;});
 await page.getByRole('textbox',{name:'Draft'}).fill('local edit');
 expect(await code.evaluate(e=>e===window.savedCode)).toBe(true);await expect(code.getByRole('status')).toHaveText('Copying…');
 await page.evaluate(()=>window.pending[0].resolve());await expect(code.getByRole('status')).toHaveText('Code copied.');
 await button.focus();await page.keyboard.press('Enter');await page.evaluate(()=>window.pending[1].reject(Error('denied')));await expect(code.getByRole('status')).toContainText('Could not copy');
 await page.keyboard.press('Space');expect(await page.evaluate(()=>window.writes.length)).toBe(3);
 await page.evaluate(()=>{window.foundationApp.commit('root=Stack([Code({value:"replacement"})])');window.pending[2].resolve();});
 await expect(page.locator('.iui-code-status')).toHaveText('');await expect(page.locator('.iui-code-language')).toHaveText('Plain text');
});
