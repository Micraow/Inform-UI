// Run from any directory. Real browser input only: no programmatic range values.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const repo=process.env.INFORM_REPO??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.join(repo,'package.json'))('playwright');
const targetArg=process.argv[2]??'http://127.0.0.1:4177/';
const target=/^https?:\/\//.test(targetArg)?targetArg:pathToFileURL(path.resolve(targetArg)).href;
const artifactIndex=process.argv.indexOf('--artifact');
const file=artifactIndex>=0?path.resolve(process.argv[artifactIndex+1]):target.startsWith('file:')?path.resolve(targetArg):null;
const expectedSha=file?createHash('sha256').update(await readFile(file)).digest('hex'):null;
const output=path.resolve(process.argv[3]??'test-results/slider-pointer-regression.json');
const expectPass=process.argv.includes('--expect-pass');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={target,file,sha256:expectedSha,mode:'trusted Playwright mouse/keyboard events',cases:[],errors:[]};
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
  const response=await page.goto(target);if(response){const servedSha=createHash('sha256').update(await response.body().catch(async error=>{if(!String(error).includes('evicted from inspector cache'))throw error;report.artifactVerification='Independent HTTP GET after Chromium inspector body eviction';const fetched=await fetch(target);if(!fetched.ok)throw Error('Artifact HTTP verification failed');return Buffer.from(await fetched.arrayBuffer());})).digest('hex');if(expectedSha&&servedSha!==expectedSha)throw Error('Served bytes differ from --artifact');report.sha256=servedSha;}await page.waitForSelector('html[data-ready="true"]');
  for(const sample of ['Slider','Answer']){
   if(sample==='Slider')await page.locator('.component-link[data-name="Slider"]').click();else await page.locator('#answer-nav').click();
   const selector='#preview input[type=range]';await page.locator(selector).scrollIntoViewIfNeeded();if(sample==='Answer')await page.locator('#preview [data-chart=BarChart],#preview [data-component=BarChart]').waitFor({state:'attached'});
   await page.evaluate(selector=>{
    const original=document.querySelector(selector),events=[],samples=[];window.__sliderTrace={original,events,samples};
    const ids=new WeakMap();let n=0;const id=e=>{if(!e)return null;if(!ids.has(e))ids.set(e,++n);return ids.get(e);};
    const read=()=>{const current=document.querySelector(selector);let tree;try{tree=JSON.parse(document.querySelector('#json').textContent);}catch{}const find=(n,type='Slider')=>{if(n?.typeName===type)return n;for(const v of Object.values(n?.props??{})){for(const child of Array.isArray(v)?v:[]){const found=find(child,type);if(found)return found;}}};const node=find(tree),chartNode=find(tree,'BarChart'),chart=document.querySelector('#preview [data-chart=BarChart],#preview [data-component=BarChart]'),chartRows=chart?[...chart.querySelectorAll('tbody tr')].map(row=>[...row.querySelectorAll('td')].map(cell=>cell.textContent)):null,expectedChartRows=chartNode?chartNode.props.labels.map((label,index)=>[label,...chartNode.props.series.map(series=>String(series.values[index]))]):null;return{value:current?.value,valueAsNumber:current?.valueAsNumber,nodeId:id(current),originalId:id(original),sameNode:current===original,originalConnected:original.isConnected,focused:document.activeElement===original,output:current?.parentElement.querySelector('output')?.value,revision:document.querySelector('#preview .if-root')?.dataset.revision,bindingValue:node?.props.value,bindingId:node?.bindings?.value?.id,previewText:document.querySelector('#preview')?.textContent.slice(-1500),chartRows,expectedChartRows};};
    window.__sliderTrace.read=read;
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture','input','change','keydown','keyup'])document.addEventListener(type,e=>{if(e.target===original||e.target.matches?.(selector)){const item={type,trusted:e.isTrusted,value:e.target.value,nodeId:id(e.target),pointerId:e.pointerId,buttons:e.buttons,capture:e.pointerId?e.target.hasPointerCapture(e.pointerId):null,time:performance.now()};events.push(item);queueMicrotask(()=>Object.assign(item,{after:read(),settledAfterMs:performance.now()-item.time}));}},true);
    samples.push(read());
   },selector);
   const box=await page.locator(selector).boundingBox();const range=await page.locator(selector).evaluate(e=>({value:e.valueAsNumber,min:Number(e.min),max:Number(e.max),step:Number(e.step)}));
   const start=box.x+10+(box.width-20)*(range.value-range.min)/(range.max-range.min),y=box.y+box.height/2;
   await page.mouse.move(start,y);await page.mouse.down();
   const fractions=[.45,.5,.6,.7,.8,.9,.95,.85,.7,.55,.4,.25,.1];
   for(const fraction of fractions){await page.mouse.move(box.x+10+(box.width-20)*fraction,y,{steps:3});await page.waitForTimeout(25);await page.evaluate(()=>window.__sliderTrace.samples.push(window.__sliderTrace.read()));}
   await page.mouse.up();await page.waitForTimeout(50);
   const drag=await page.evaluate(()=>({events:window.__sliderTrace.events,samples:window.__sliderTrace.samples,final:window.__sliderTrace.read()}));
   await page.locator(selector).focus();await page.keyboard.press('End');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
   const final=await page.evaluate(()=>window.__sliderTrace.read());
   const inputs=drag.events.filter(e=>e.type==='input'),states=drag.samples.map(s=>s.bindingValue),uniqueValues=[...new Set(states)];
   const checks={originalRemainsConnected:drag.samples.every(s=>s.originalConnected),sameNodeThroughout:drag.samples.every(s=>s.sameNode),multipleDragInputs:inputs.length>=10,distinctLiveBindings:uniqueValues.length>=6,liveDOMMatchesBinding:drag.samples.every(s=>s.valueAsNumber===s.bindingValue&&Number(s.output)===s.bindingValue),noPointerCancel:!drag.events.some(e=>e.type==='pointercancel'),captureNotLostBeforePointerUp:!drag.events.some((e,i)=>e.type==='lostpointercapture'&&!drag.events.slice(0,i).some(before=>before.type==='pointerup')),pointerCompletesOnOriginal:drag.events.some(e=>e.type==='pointerup'&&e.nodeId===drag.final.originalId),nativeInputTrusted:inputs.length>0&&inputs.every(e=>e.trusted),derivedTextChanges:new Set(drag.samples.map(s=>s.previewText)).size>=6,chartUpdates:sample!=='Answer'||new Set(drag.samples.map(s=>JSON.stringify(s.chartRows))).size>1,chartMatchesDSL:sample!=='Answer'||drag.samples.every(s=>s.chartRows&&JSON.stringify(s.chartRows)===JSON.stringify(s.expectedChartRows)),keyboardExpected:final.valueAsNumber===range.min+range.step,keyboardBindingMatches:final.valueAsNumber===final.bindingValue,keyboardFocused:final.focused};
   report.cases.push({width,sample,range,box,checks,pass:Object.values(checks).every(Boolean),uniqueValues,inputCount:inputs.length,maxSynchronousSettleMs:Math.max(0,...inputs.map(e=>e.settledAfterMs??0)),drag,keyboardFinal:final});
  }await page.close();
 }
 report.pass=report.errors.length===0&&report.cases.every(c=>c.pass);
}catch(error){report.pass=false;report.errors.push(String(error?.stack??error));throw error;}finally{await browser.close();await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2));}
console.log(JSON.stringify({file,output,sha256:report.sha256,pass:report.pass,errors:report.errors,cases:report.cases.map(({width,sample,checks,uniqueValues})=>({width,sample,checks,uniqueValues}))},null,2));
if(expectPass&&!report.pass)process.exitCode=1;
