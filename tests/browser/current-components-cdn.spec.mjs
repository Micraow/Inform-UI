import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {exerciseCurrentDemo} from './helpers/current-demo.mjs';
const lock=JSON.parse(await readFile('cdn-lock.json','utf8'));
const fontURLs=Object.keys(lock.integrity).filter(n=>n.endsWith('.woff2')).map(n=>new URL(n,lock.css).href);
const allowed=new Set([lock.js,lock.css,lock.schema,...fontURLs]);
test.use({serviceWorkers:'block'});
test('fixed CDN pin matches every freshly rebuilt source asset exactly',async()=>{
  const built=JSON.parse(await readFile('cdn/integrity.json','utf8')),schema=JSON.parse(await readFile('cdn/iui.schema.json','utf8'));
  expect(built.files).toEqual(lock.integrity);expect(schema.$defs.Node.oneOf.length).toBe(lock.nodeCount);
});
for(const theme of ['light','dark'])for(const width of [390,1100]) {
  test(`current file CDN ${theme} ${width}: fixed assets, valid-state budgets and controls`,async({page})=>{
    await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    const transport=[],requests=[],errors=[],assets={},pending=[];
    cdp.on('Network.responseReceived',({response:r})=>{if(allowed.has(r.url))transport.push({url:r.url,status:r.status,mime:r.mimeType,disk:r.fromDiskCache===true,worker:r.fromServiceWorker===true});});
    page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
    await page.route('**/*',route=>route.request().url().startsWith('file:')||allowed.has(route.request().url())?route.continue():route.abort('blockedbyclient'));
    page.on('response',r=>{if(allowed.has(r.url()))pending.push((async()=>{const bytes=await r.body();assets[r.url()]={status:r.status(),headers:await r.allHeaders(),sha256:createHash('sha256').update(bytes).digest('hex')};})());});
    await page.goto(pathToFileURL(resolve('examples/browser/current-components.html')).href);await expect(page.locator('#status')).toBeEmpty();
    await exerciseCurrentDemo(page);
    const schema=await page.evaluate(async url=>{const r=await fetch(url,{cache:'no-store'}),schema=await r.json();return{status:r.status,nodes:schema.$defs.Node.oneOf.length};},lock.schema);
    expect(schema).toEqual({status:200,nodes:lock.nodeCount});
    await page.waitForLoadState('networkidle');await Promise.all(pending);
    for(const [name,url] of [['iui.global.min.js',lock.js],['iui.css',lock.css],['iui.schema.json',lock.schema]]) {
      expect(assets[url]?.status).toBe(200);expect(assets[url]?.sha256).toBe(lock.integrity[name].sha256);
      expect(assets[url]?.headers['access-control-allow-origin']).toBe('*');expect(assets[url]?.headers['cache-control']).toContain('immutable');
      expect(assets[url]?.headers['content-type']).toMatch(name.endsWith('.js')?/javascript/:name.endsWith('.css')?/text\/css/:/application\/json/);
      expect(transport.some(r=>r.url===url&&r.status===200&&!r.disk&&!r.worker)).toBe(true);
    }
    expect(errors).toEqual([]);expect(requests.filter(u=>u.startsWith('http')).every(u=>allowed.has(u))).toBe(true);
    expect(await page.locator('#answer style').count()).toBe(0);
    await writeFile(`test-results/current-components-cdn-${theme}-${width}.json`,JSON.stringify({commit:lock.commit,transport,requests,errors,assets,schema},null,2));
    await page.screenshot({path:`test-results/current-components-cdn-${theme}-${width}.png`,fullPage:true});
  });
}
