import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
const fromSource=async name=>{const result=await build({entryPoints:['src/renderer/'+name+'.ts'],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));};
const {renderPie,pieSectors,pieHitTest,pieSectorPath}=await fromSource('pie');
const {pieEnglish,pieChinese}=await fromSource('pie-labels');
const {presentationLabels,formatNumber}=await fromSource('presentation');
const chart=(data=[{x:'A',y:1},{x:'B',y:3},{x:'Zero',y:0},{x:'Missing',y:null}],extra={})=>({type:'chart',kind:'pie',xKey:'x',series:[{key:'y',label:'Amount'}],data,...extra});
function setup(n=chart(),language='en'){
  const dom=new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}),doc=dom.window.document,host=doc.querySelector('#host');host.lang=language;
  const listeners=[],bindings=[];let state={amount:1,other:0};
  const display=value=>typeof value==='number'?formatNumber(value):String(value??'');
  const context={doc,prefix:'test',labels:()=>presentationLabels(host),element:(tag,cls='',value)=>{const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=display(value);return el;},svg:(tag,attrs={})=>{const el=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;},on:(target,name,listener)=>{target.addEventListener(name,listener);listeners.push(()=>target.removeEventListener(name,listener));},bind:fn=>{bindings.push(fn);fn();},value:value=>value&&typeof value==='object'?state[value.$]:value,display,showValue:(target,value)=>{target.textContent=display(value);}};
  host.append(renderPie(context,n,language==='en'?pieEnglish:pieChinese));
  const svg=host.querySelector('svg'),details=host.querySelector('details'),output=host.querySelector('output');
  svg.getBoundingClientRect=()=>({left:0,top:0,width:640,height:240});
  return {dom,host,svg,details,output,update:patch=>{state={...state,...patch};bindings.forEach(fn=>fn());},key:key=>svg.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),pointer:(x,y,type='pointermove')=>svg.dispatchEvent(new dom.window.MouseEvent(type,{clientX:x,clientY:y,bubbles:true})),dispose:()=>{listeners.forEach(fn=>fn());bindings.length=0;host.replaceChildren();}};
}
test('angles preserve order, halves, full circle, zeros and absent observations',()=>{
 assert.deepEqual(pieSectors([1,3,0,null]).map(s=>[s.index,s.share]),[[0,.25],[1,.75]]);
 const full=pieSectors([null,0,7])[0];assert.equal(full.index,2);assert.equal(full.end,2*Math.PI);assert.equal((pieSectorPath(full,0,0,10).match(/ A /g)||[]).length,2);
 const halves=pieSectors([1,1]);assert.equal(halves[0].end,Math.PI);assert.equal(halves[1].start,Math.PI);
 for(const values of [[],[null],[0,0],[Number.MAX_VALUE,Number.MAX_VALUE]])assert.deepEqual(pieSectors(values),[]);
});
test('polar hit testing respects actual wedge not nearest x and rejects center/outside',()=>{
 const sectors=pieSectors([1,1,1,1]);assert.equal(pieHitTest(sectors,10,-10,85),0);assert.equal(pieHitTest(sectors,10,10,85),1);assert.equal(pieHitTest(sectors,-10,10,85),2);assert.equal(pieHitTest(sectors,-10,-10,85),3);
 for(const p of [[0,0],[86,0],[NaN,0],[Infinity,1]])assert.equal(pieHitTest(sectors,...p,85),null);
});
test('literal data, duplicate names and tiny shares never fabricate exact zero percentages',()=>{
 const n=chart([{x:'<img src=x>',y:Number.MIN_VALUE},{x:'same',y:1e308},{x:'same',y:null},{x:'Zero',y:0}],{title:'<script>x</script>',note:'<b>literal</b>'});const original=JSON.stringify(n),s=setup(n);
 assert.equal(JSON.stringify(n),original);assert.equal(s.host.querySelector('img,script,b'),null);assert.equal(s.host.querySelectorAll('tbody tr').length,4);assert.match(s.host.querySelector('tbody').textContent,/5e-324/);s.key('Home');assert.match(s.output.value,/<0.1% of known values/);assert.doesNotMatch(s.svg.innerHTML,/NaN|Infinity/);assert.equal(s.host.querySelectorAll('[data-share]').length,2);s.dispose();
});
test('all authored rows remain keyboard-addressable with clamped boundaries and visible selection',()=>{
 const s=setup();s.svg.focus();assert.match(s.output.value,/A · Amount: 1/);assert.equal(s.svg.querySelectorAll('.iui-point-active').length,1);s.key('ArrowLeft');assert.match(s.output.value,/A ·/);s.key('ArrowRight');assert.match(s.output.value,/B ·/);s.key('ArrowRight');assert.match(s.output.value,/Zero · Amount: 0/);assert.equal(s.svg.querySelectorAll('.iui-point-active').length,0);s.key('End');assert.match(s.output.value,/Missing/);s.key('ArrowRight');assert.match(s.output.value,/Missing/);s.key('Home');assert.match(s.output.value,/A ·/);s.dispose();
});
test('pointer and native click select wedges without stealing focus, including letterboxing',()=>{
 const s=setup(chart([{x:'NE',y:1},{x:'SE',y:1},{x:'SW',y:1},{x:'NW',y:1}]));s.pointer(350,82);assert.match(s.output.value,/NE/);s.pointer(350,142,'click');assert.match(s.output.value,/SE/);s.pointer(290,142);assert.match(s.output.value,/SW/);s.pointer(290,82);assert.match(s.output.value,/NW/);assert.notEqual(s.dom.window.document.activeElement,s.svg);const prior=s.output.value;s.pointer(320,112);s.pointer(0,0);assert.equal(s.output.value,prior);
 s.svg.getBoundingClientRect=()=>({left:10,top:20,width:320,height:200});s.pointer(185,131,'click');assert.match(s.output.value,/SE/);s.dispose();
});
test('owner SVG inverse matrix is used for transformed coordinates',()=>{
 const s=setup();s.svg.getScreenCTM=()=>({inverse:()=>({})});s.svg.createSVGPoint=()=>({x:0,y:0,matrixTransform:()=>({x:350,y:142})});s.pointer(1,1);assert.match(s.output.value,/B/);s.dispose();
});
test('bound updates retain SVG, open details, focus and authored active index',()=>{
 const s=setup(chart([{x:'A',y:{$:'amount'}},{x:'B',y:3}]));const svg=s.svg,details=s.details;s.details.open=true;s.svg.focus();s.key('End');s.update({other:2,amount:3});assert.equal(s.host.querySelector('svg'),svg);assert.equal(s.host.querySelector('details'),details);assert.equal(details.open,true);assert.equal(s.dom.window.document.activeElement,svg);assert.match(s.output.value,/B.*50.0%/);assert.deepEqual([...svg.querySelectorAll('[data-share]')].map(e=>Number(e.dataset.share)),[.5,.5]);s.dispose();
});
test('empty/missing/zero/loading/error states retain table without invented geometry',()=>{
 for(const data of [[],[{x:'Missing',y:null}],[{x:'Zero',y:0}]]){const s=setup(chart(data));assert.equal(s.svg.querySelectorAll('path').length,0);assert.match(s.host.querySelector('.iui-data-status').textContent,/No positive/);assert.equal(s.details.hidden,false);assert.equal(s.host.querySelectorAll('tbody tr').length,data.length);s.dispose();}
 for(const status of ['loading','error']){const s=setup(chart(undefined,{status,message:'<b>Original status</b>'}));assert.equal(s.svg.querySelectorAll('path').length,0);assert.equal(s.details.hidden,true);assert.equal(s.host.querySelector('.iui-data-status').textContent,'<b>Original status</b>');assert.equal(s.host.querySelector('figure').getAttribute('aria-busy'),String(status==='loading'));s.dispose();}
});
test('300 rows and finite extremes keep valid geometry with complete table',()=>{
 for(const data of [Array.from({length:300},(_,i)=>({x:`Item ${i}`,y:i+1})),[{x:'A',y:Number.MAX_VALUE}],[{x:'A',y:Number.MIN_VALUE},{x:'B',y:Number.MIN_VALUE}]]){const s=setup(chart(data));assert.equal(s.host.querySelectorAll('tbody tr').length,data.length);assert.doesNotMatch(s.svg.innerHTML,/NaN|Infinity/);assert.equal(s.svg.querySelectorAll('path').length,data.length);s.dispose();}
});
test('nearest-host labels, detached owner documents and disposed listeners are isolated',()=>{
 const en=setup(),zh=setup(undefined,'zh-CN');assert.equal(en.svg.ownerDocument,en.dom.window.document);assert.equal(zh.svg.ownerDocument,zh.dom.window.document);assert.match(zh.host.querySelector('summary').textContent,/查看/);zh.key('Home');assert.match(zh.output.value,/已知数值/);const output=en.output;en.key('Home');const value=output.value;en.dispose();en.key('End');assert.equal(output.value,value);assert.equal(en.host.children.length,0);assert.equal(zh.host.querySelectorAll('path').length,2);zh.dispose();
});
