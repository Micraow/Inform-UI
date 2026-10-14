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
 const code=page.locator('[data-component=Code]').first(),button=code.getByRole('button',{name:/^(Copy code|复制代码)$/});
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

test('wrap is keyboard-accessible, persistent across local edits, and does not change copied text',async({page})=>{
 await page.setViewportSize({width:390,height:850});await mount(page);
 const code=page.locator('[data-component=Code]').first(),pre=code.locator('pre'),wrap=code.getByRole('button',{name:'Wrap lines'});
 await expect(wrap).toHaveAttribute('aria-pressed','false');expect(await pre.evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('pre');
 await wrap.focus();await page.keyboard.press('Enter');await expect(wrap).toBeFocused();await expect(wrap).toHaveAttribute('aria-pressed','true');expect(await pre.evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('pre-wrap');
 expect(await pre.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);expect(await pre.locator('code').textContent()).toBe(value);
 await page.getByRole('textbox',{name:'Draft'}).fill('keep wrap');await expect(wrap).toHaveAttribute('aria-pressed','true');
 await wrap.focus();await page.keyboard.press('Space');await expect(wrap).toHaveAttribute('aria-pressed','false');await wrap.click();await expect(wrap).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{window.wrappedWrites=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(text){window.wrappedWrites.push(text);return Promise.resolve();}}});});
 await code.getByRole('button',{name:'Copy code'}).click();expect(await page.evaluate(()=>window.wrappedWrites)).toEqual([value]);await expect(code.getByRole('status')).toHaveText('Code copied.');await expect(code.locator('.iui-code-copy [data-iui-icon=Check]')).toHaveCount(1);
});
for(const theme of ['light','dark'])test(`shared ${theme} syntax palette meets small-text contrast`,async({page})=>{
 await mount(page,theme);const colors=await page.locator('.iui-code-block').first().evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,colors:['pink','green','orange','purple','comment'].map(name=>s.getPropertyValue('--iui-code-'+name).trim())};});
 const luminance=color=>{const components=color.startsWith('#')?color.slice(1).match(/../g).map(x=>parseInt(x,16)):color.match(/[\d.]+/g).slice(0,3).map(Number);const c=components.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 for(const color of colors.colors){const a=luminance(colors.background),b=luminance(color);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);}
});

test('core all-false plain code stays bounded and scrollable',async({page})=>{
 await page.setViewportSize({width:390,height:850});await mount(page);
 const text='unwrapped plain text '.repeat(100);
 await page.evaluate(text=>window.foundationApp.commit('root=Stack([Code({value:'+JSON.stringify(text)+',copy:false,highlight:false,showLanguage:false})])'),text);
 const pre=page.locator('[data-component=Code]');await expect(pre).toHaveJSProperty('tagName','PRE');await expect(pre.locator('button')).toHaveCount(0);
 expect(await pre.textContent()).toBe(text);expect(await pre.evaluate(e=>getComputedStyle(e).overflowX)).toBe('auto');expect(await pre.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('empty copy feedback stays an accessible live region',async({page})=>{
 await mount(page);const status=page.locator('.iui-code-status').first();await expect(page.getByRole('status')).toHaveCount(1);
 expect(await status.evaluate(e=>getComputedStyle(e).display)).not.toBe('none');expect(await status.evaluate(e=>getComputedStyle(e).visibility)).toBe('visible');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await page.getByRole('button',{name:'Copy code'}).click();await expect(status).toContainText('Could not copy');
});
