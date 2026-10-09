/** Original compiled consumers. Prepared only; clipboard is a named test stub. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
function arg(flag){const i=process.argv.indexOf(flag);if(i<0)return;const v=process.argv[i+1];assert.ok(v&&!v.startsWith('--'));return v;}
assert.ok(arg('--library'),'Pass a built frozen --library PATH');
const library=path.resolve(arg('--library')),revision=arg('--revision');
assert.match(revision??'',/^[a-f0-9]{40}$/,'Explicit actual --revision SHA required');
const head=spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'});
assert.equal(head.status,0,head.stderr);assert.equal(head.stdout.trim(),revision);
const pkg=JSON.parse(await readFile(path.join(library,'package.json'),'utf8'));
const {validateDocument,compileHtml}=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].import)).href);
const require=createRequire(path.join(library,'package.json')),{chromium,expect}=require('@playwright/test');
const screenshots=path.resolve(arg('--screenshots')??path.join(root,'artifacts/browser'));
await mkdir(screenshots,{recursive:true});
const temporary=await mkdtemp(path.join(tmpdir(),'inform-code-consumer-'));
const name='local-code-explanation',input=JSON.parse(await readFile(path.join(root,'examples',name+'.json'),'utf8'));
const checked=validateDocument(input);assert.equal(checked.ok,true,JSON.stringify(checked.issues));
const source=input.body.find(n=>n.id==='copy-example').value;
const unknown=input.body.find(n=>n.id==='plain-unknown').value;
let browser,count=0;

// Locator.click intentionally waits on aria-disabled. Hit testing plus the real
// mouse lets us exercise a busy, focusable native button without force/DOM click.
async function pointer(page,button){
 await button.scrollIntoViewIfNeeded();const rect=await button.boundingBox();assert.ok(rect);
 const point={x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 assert.equal(await button.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),point),true);
 await page.mouse.click(point.x,point.y);
}
async function finish(page,index,result){
 await page.evaluate(({index,result})=>window.consumerCopyPending[index][result](result==='reject'?new Error('Synthetic denial'):undefined),{index,result});
}
try{
 browser=await chromium.launch({headless:true,...(process.env.IUI_BROWSER_EXECUTABLE?{executablePath:process.env.IUI_BROWSER_EXECUTABLE}:{})});
 for(const theme of ['light','dark'])for(const width of [390,768,1100]){
  const label=`${name}-${theme}-${width}`,file=path.join(temporary,label+'.html');
  await writeFile(file,await compileHtml({...input,theme},{assets:'inline',backend:'portable',lang:'zh-CN'}));
  const page=await browser.newPage({viewport:{width,height:1050},colorScheme:theme,reducedMotion:'reduce'}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  // This never asks for permissions and never writes/reads the system clipboard.
  await page.addInitScript(()=>{
   window.consumerCopyReads=0;window.consumerCopyWrites=[];window.consumerCopyPending=[];
   const stub={writeText(value){window.consumerCopyWrites.push(value);return new Promise((resolve,reject)=>window.consumerCopyPending.push({resolve,reject}));}};
   Object.defineProperty(navigator,'clipboard',{configurable:true,get(){window.consumerCopyReads++;return stub;}});
  });
  await page.goto(pathToFileURL(file).href);await page.waitForSelector('.iui-root');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>window.isSecureContext),true,'file consumer must exercise the secure-context path');
  const owner=id=>page.locator(`[data-iui=code][id$="-${id}"]`),block=owner('copy-example'),pre=block.locator('pre.iui-code'),code=pre.locator('code');
  const button=block.getByRole('button',{name:'复制代码',exact:true}),status=block.getByRole('status');
  assert.equal(await code.textContent(),source);assert.ok(await code.locator('[class*=iui-code-token-]').count()>0);
  assert.equal(await owner('plain-unknown').locator('code').textContent(),unknown);
  await expect(owner('plain-unknown').locator('[class*=iui-code-token-],button,script,img')).toHaveCount(0);
  await expect(owner('inline-example')).toHaveText('mean');await expect(owner('inline-example').locator('button')).toHaveCount(0);
  await expect(status).toHaveText('');assert.equal(await page.evaluate(()=>window.consumerCopyReads),0);
  assert.deepEqual(await page.evaluate(()=>window.consumerCopyWrites),[]);
  // A negative assertion only: programmatic clicks must never write.
  await button.evaluate(el=>el.click());assert.equal(await page.evaluate(()=>window.consumerCopyReads),0);
  await pointer(page,button);await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-disabled','true');
  await expect(button).toHaveAccessibleName('复制代码');await expect(status).toHaveText('正在复制…');
  await pointer(page,button);await page.keyboard.press('Enter');await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>window.consumerCopyWrites),[source]);
  await finish(page,0,'resolve');await expect(status).toHaveText('代码已复制。');await expect(button).toBeFocused();
  await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>window.consumerCopyWrites),[source,source]);
  await finish(page,1,'reject');await expect(status).toHaveText('无法复制。请选中代码并手动复制。');await expect(button).toBeFocused();
  assert.equal(await code.textContent(),source);
  await page.keyboard.press('Space');assert.deepEqual(await page.evaluate(()=>window.consumerCopyWrites),[source,source,source]);
  await finish(page,2,'resolve');await expect(status).toHaveText('代码已复制。');await expect(button).toBeFocused();
  // Explicitly simulated unavailable API, separate from actual browser permission.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
  await pointer(page,button);await expect(status).toHaveText('无法复制。请选中代码并手动复制。');
  assert.deepEqual(await page.evaluate(()=>window.consumerCopyWrites),[source,source,source]);
  // Selection.toString() can normalize visible line endings. The selected DOM
  // Range and original text remain exact; OS clipboard encoding is separate.
  const selected=await code.evaluate(el=>{const selection=el.ownerDocument.getSelection(),range=el.ownerDocument.createRange();range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);const result={collapsed:selection.isCollapsed,rangeCount:selection.rangeCount,value:selection.getRangeAt(0).toString()};selection.removeAllRanges();return result;});
  assert.equal(selected.collapsed,false);assert.equal(selected.rangeCount,1);assert.equal(selected.value,source);assert.equal(await code.textContent(),source);
  await button.focus();await page.keyboard.press('Tab');await expect(pre).toBeFocused();
  assert.equal(await pre.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  const geometry=await pre.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(geometry.client>0);
  if(geometry.scroll>geometry.client){await page.keyboard.press('ArrowRight');await expect.poll(()=>pre.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': whole-page overflow');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(screenshots,label+'.png'),fullPage:true});await page.close();count++;console.log(`PASS ${label} (clipboard stub only)`);
 }
 await writeFile(path.join(screenshots,'RESULTS.json'),JSON.stringify({revision,exampleLanguages:{"local-code-explanation":"zh-CN"},localCompiledViews:count,widths:[390,768,1100],themes:['light','dark'],browser:'chromium',clipboard:'stub only; trusted pointer/Enter/Space; exact argument and busy/retry/failure UI verified',systemClipboard:'not-read; not-written; no permission requested',publicCdn:'not-run',lifecycle:'covered separately by canonical public tests, not this compiled-consumer script',screenReader:'not-run',screenshotReview:'pending-human-review'},null,2)+'\n');
}finally{await browser?.close();await rm(temporary,{recursive:true,force:true});}
