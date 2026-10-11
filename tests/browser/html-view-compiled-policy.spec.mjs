import {test,expect} from '@playwright/test';
import {compileArtifact} from '../../dist/index.js';

// Native-only acceptance. JSDOM cannot prove inherited CSP or opaque-origin isolation.
// Copy this file into tests/browser for the next authorized unified CI run.
for(const assets of ['inline','shared'])test(`HTML View ${assets}: actual compiled CSP runs supplied code in an opaque child`,async({page},testInfo)=>{
 const errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173/')&&!request.url().startsWith('data:')&&!request.url().startsWith('about:'))external.push(request.url());});
 const html='<button id="run" type="button" onclick="document.getElementById(&quot;counter&quot;).textContent=String(++count)">Run local counter</button><output id="counter">0</output><output id="isolation"></output><script>let count=0;try{parent.document.documentElement;document.getElementById("isolation").textContent="leaked";}catch{document.getElementById("isolation").textContent="opaque";}</script>';
 const artifact=await compileArtifact({version:'iui/1',body:[{type:'html-view',title:'Isolated supplied counter',html}]},{assets});
 for(const [name,body]of Object.entries(artifact.assets))await page.route(`http://127.0.0.1:4173/${name}`,route=>route.fulfill({status:200,contentType:name.endsWith('.css')?'text/css':'text/javascript',body}));
 await page.route('http://127.0.0.1:4173/qa-html-policy.html',route=>route.fulfill({status:200,contentType:'text/html',body:artifact.html}));
 await page.goto('/qa-html-policy.html');
 const frame=page.locator('iframe[title="Isolated supplied counter"]');await expect(frame).toHaveAttribute('sandbox','allow-scripts');
 const child=page.frameLocator('iframe[title="Isolated supplied counter"]');await expect(child.locator('#isolation')).toHaveText('opaque');
 await child.getByRole('button',{name:'Run local counter'}).click();await expect(child.locator('#counter')).toHaveText('1');
 await child.getByRole('button',{name:'Run local counter'}).focus();await page.keyboard.press('Enter');await expect(child.locator('#counter')).toHaveText('2');
 expect(await frame.evaluate(node=>node.contentDocument===null)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);expect(external).toEqual([]);
 await page.screenshot({path:testInfo.outputPath(`html-view-${assets}-opaque.png`),fullPage:true});
});
