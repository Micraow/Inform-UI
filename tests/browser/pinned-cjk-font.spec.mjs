import {test,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const lock=JSON.parse(await readFile(new URL('../assets/fonts/noto-cjk-sc/font-lock.json',import.meta.url)));
// Requires scripts/prepare-test-font.mjs --install and FONTCONFIG_FILE; no font download.
test('actual Chinese renderer glyphs use the pinned licensed CJK face',async({page,context})=>{
 await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);await page.evaluate(()=>{const host=document.getElementById('host');host.lang='zh-CN';window.iui.mount(host,{version:'iui/1',body:[{type:'text',value:'中文汉字漢字简体繁體测试測試'}]});});await page.evaluate(()=>document.fonts.ready);const text=page.locator('[data-iui=text]');await expect(text).toBeVisible();
 const client=await context.newCDPSession(page);await client.send('DOM.enable');await client.send('CSS.enable');const {root}=await client.send('DOM.getDocument'),{nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'[data-iui=text]'});expect(nodeId).toBeGreaterThan(0);const {fonts}=await client.send('CSS.getPlatformFontsForNode',{nodeId});await mkdir('test-results',{recursive:true});await writeFile('test-results/pinned-cjk-fonts.json',JSON.stringify({expectedFamily:lock.family,expectedFontSha256:lock.font.sha256,fonts},null,2)+'\n');const used=fonts.filter(font=>font.glyphCount>0);expect(used.length).toBeGreaterThan(0);for(const font of used)expect(font.familyName).toBe(lock.family);await page.screenshot({path:'test-results/pinned-cjk-glyphs.png',fullPage:true});await client.detach();
});
