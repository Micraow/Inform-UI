/** Original loading/source consumers. Prepared checks, run only in authorized browser CI. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile,writeFile,mkdtemp,mkdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function arg(flag){const i=process.argv.indexOf(flag);if(i<0)return;const v=process.argv[i+1];assert.ok(v&&!v.startsWith('--'));return v;}
assert.ok(arg('--library'),'Pass a built frozen --library PATH');const library=path.resolve(arg('--library')),revision=arg('--revision');assert.match(revision??'',/^[a-f0-9]{40}$/,'Explicit frozen --revision SHA required');
const head=spawnSync('git',['-C',library,'rev-parse','HEAD'],{encoding:'utf8'});assert.equal(head.status,0,head.stderr);assert.equal(head.stdout.trim(),revision);
const require=createRequire(path.join(library,'package.json')),{chromium,expect}=require('@playwright/test');
const pkg=JSON.parse(await readFile(path.join(library,'package.json'),'utf8'));
const {validateDocument,compileHtml}=await import(pathToFileURL(path.resolve(library,pkg.exports['.'].import)).href);
const names=['loading-numeric-progress','loading-placeholder-shapes','supplied-source-reading'];
const screenshots=path.resolve(arg('--screenshots')??path.join(root,'artifacts/next66-browser'));await mkdir(screenshots,{recursive:true});
const temporary=await mkdtemp(path.join(tmpdir(),'inform-next66-'));let browser,count=0;
try{
 browser=await chromium.launch({headless:true,...(process.env.IUI_BROWSER_EXECUTABLE?{executablePath:process.env.IUI_BROWSER_EXECUTABLE}:{})});
 for(const name of names)for(const theme of ['light','dark'])for(const width of [390,768,1100]){
  const document=JSON.parse(await readFile(path.join(root,'examples',name+'.json'),'utf8')),checked=validateDocument(document);assert.equal(checked.ok,true,JSON.stringify(checked.issues));
  const label=`${name}-${theme}-${width}`,file=path.join(temporary,label+'.html');
  await writeFile(file,await compileHtml({...document,theme},{backend:'portable',assets:'inline',lang:'zh-CN'}));
  const page=await browser.newPage({viewport:{width,height:1050},colorScheme:theme,reducedMotion:'reduce'}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(file).href);await page.waitForSelector('.iui-root');await page.evaluate(()=>document.fonts.ready);
  if(name==='loading-numeric-progress'){
   const known=page.getByRole('progressbar',{name:'合成样本处理比例',exact:true}),unknown=page.getByRole('progressbar',{name:'另一个合成任务：未提供进度',exact:true});
   await expect(known).toHaveAttribute('aria-valuenow','15.625');await expect(unknown).not.toHaveAttribute('aria-valuenow');await expect(unknown.locator('.iui-loading-hint')).toHaveText('未提供进度');
   const slider=page.getByRole('slider',{name:'合成已完成样本数',exact:true});await slider.focus();await page.keyboard.press('Home');await expect(known).toHaveAttribute('aria-valuenow','0');await expect(slider).toBeFocused();
   await page.keyboard.press('End');await expect(known).toHaveAttribute('aria-valuenow','100');await expect(slider).toBeFocused();
   const ratio=await known.evaluate(el=>{const t=el.querySelector('.iui-loading-track').getBoundingClientRect().width,f=el.querySelector('.iui-loading-fill').getBoundingClientRect().width;return {t,f};});assert.ok(ratio.t>0);assert.ok(Math.abs(ratio.t-ratio.f)<.1);
   await expect(unknown).not.toHaveAttribute('aria-valuenow');assert.equal(await unknown.locator('svg').evaluate(el=>getComputedStyle(el).animationName),'none');
  }
  if(name==='loading-placeholder-shapes'){
   const blocks=page.locator('.iui-loading-block');await expect(blocks).toHaveCount(3);
   await expect(blocks.nth(0).locator('.iui-loading-block-line')).toHaveCount(4);await expect(blocks.nth(1).locator('.iui-loading-block-piece')).toHaveCount(3);await expect(blocks.nth(2).locator('.iui-loading-block-circle')).toHaveCount(1);
   const data=await blocks.evaluateAll(nodes=>nodes.map(el=>({label:el.querySelector('.iui-loading-block-label').textContent,role:el.getAttribute('role'),hiddenLabel:!!el.querySelector('.iui-loading-block-label').closest('[aria-hidden=true]'),pieces:[...el.querySelectorAll('.iui-loading-block-piece')].map(p=>({animation:getComputedStyle(p).animationName,hidden:!!p.closest('[aria-hidden=true]')}))})));
   for(const d of data){assert.ok(d.label);assert.equal(d.role,null);assert.equal(d.hiddenLabel,false);for(const p of d.pieces){assert.equal(p.animation,'none');assert.equal(p.hidden,true);}}
   assert.equal(await page.locator('.iui-loading-block[aria-live],[aria-busy]').count(),0);
  }
  if(name==='supplied-source-reading'){
   const block=page.locator('.iui-web-link-cards'),rail=block.getByRole('list',{name:'四份虚构参考资料，保留作者顺序',exact:true});
   const previous=block.getByRole('button',{name:'上一页链接',exact:true}),next=block.getByRole('button',{name:'下一页链接',exact:true});
   await expect(rail.locator('li')).toHaveCount(4);await expect(rail.getByRole('link',{name:'合成资料乙：理解缺测',exact:true})).toHaveCount(2);
   await expect(page.locator('.iui-citation .iui-source-number')).toHaveText('[7]');
   for(const link of await page.locator('.iui-source-title').all()){await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');await expect(link).toHaveAccessibleDescription('在新标签页中打开');}
   await expect(previous).toHaveAttribute('aria-disabled','true');await expect(next).toHaveAttribute('aria-disabled','false');await expect(rail).toHaveAttribute('tabindex','0');
   const geometry=await rail.evaluate(el=>({before:el.scrollLeft,width:el.clientWidth,max:el.scrollWidth-el.clientWidth}));
   await next.focus();await page.keyboard.press('Enter');await expect(next).toBeFocused();await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeCloseTo(Math.min(geometry.max,geometry.before+geometry.width),0);
   for(let i=0;i<4&&await next.getAttribute('aria-disabled')==='false';i++){await next.click();await expect(next).toBeFocused();}
   await expect(next).toHaveAttribute('aria-disabled','true');const end=await rail.evaluate(el=>el.scrollLeft);
   await page.keyboard.press('Space');await expect(next).toBeFocused();assert.equal(await rail.evaluate(el=>el.scrollLeft),end);
   // A legitimate manual value update preserves source DOM and scroll. It does not
   // mark links read or create a source-service relationship.
   await rail.evaluate(el=>{window.next66Rail=el;window.next66First=el.querySelector('a');window.next66Offset=el.scrollLeft;});
   const progress=page.getByRole('progressbar',{name:'手动数值的合成比例，不代表网页已读',exact:true}),input=page.getByLabel('手动提供的演示完成份数',{exact:false});
   await input.fill('2');await expect(progress).toHaveAttribute('aria-valuenow','50');await expect(input).toBeFocused();
   assert.equal(await rail.evaluate(el=>el===window.next66Rail&&el.querySelector('a')===window.next66First&&el.scrollLeft===window.next66Offset),true);
   await input.fill('5');await page.getByRole('button',{name:'检查输入',exact:true}).click();await expect(input).toHaveAttribute('aria-invalid','true');await expect(progress).toHaveAttribute('aria-valuenow','50');
   await page.getByRole('button',{name:'恢复演示初值',exact:true}).click();await expect(input).toHaveValue('1');await expect(progress).toHaveAttribute('aria-valuenow','25');
   await page.getByRole('button',{name:'明确写回2份合成进度',exact:true}).click();await expect(input).toHaveValue('2');await expect(progress).toHaveAttribute('aria-valuenow','50');
   for(let i=0;i<4&&await previous.getAttribute('aria-disabled')==='false';i++)await previous.click();await expect(previous).toHaveAttribute('aria-disabled','true');assert.equal(await rail.evaluate(el=>el.scrollLeft),0);
   await previous.focus();await page.keyboard.press('Enter');await expect(previous).toBeFocused();assert.equal(await rail.evaluate(el=>el.scrollLeft),0);
   const first=rail.getByRole('link').first();await first.focus();await expect(first).toBeFocused();
   assert.equal(await page.locator('.iui-source-card [aria-selected],.iui-source-card [aria-current],.iui-web-link-cards [aria-live]').count(),0);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': whole-page overflow');
  assert.deepEqual(errors,[],label+': browser errors');assert.deepEqual(requests,[],label+': unsolicited requests');
  await page.screenshot({path:path.join(screenshots,label+'.png'),fullPage:true});await page.close();count++;console.log(`PASS ${label}`);
 }
 await writeFile(path.join(screenshots,'RESULTS.json'),JSON.stringify({revision,localCompiledViews:count,widths:[390,768,1100],themes:['light','dark'],browser:'chromium',publicCdn:'not-run',externalLinkActivation:'not-run; consumers do not navigate fictional links',screenReader:'not-run',screenshotReview:'pending-human-review'},null,2)+'\n');
 console.log(`PASS ${count} inline Chromium views; public CDN, manual screenshot and assistive-technology review are separate.`);
}finally{await browser?.close();await rm(temporary,{recursive:true,force:true});}
