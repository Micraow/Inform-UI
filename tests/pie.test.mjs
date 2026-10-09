import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
const pie=(extra={})=>({type:'chart',kind:'pie',xKey:'category',series:[{key:'amount',label:'Amount'}],data:[{category:'A',amount:{$:'amount'}},{category:'B',amount:3},{category:'Zero',amount:0},{category:'Missing',amount:null}],...extra});
const doc=(node=pie())=>({version:'iui/1',title:'Original finite pie fixture',state:{amount:1,other:0},body:[node]});
const setup=(input=doc(),lang='en')=>{const d=new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}),h=d.window.document.querySelector('#host');h.lang=lang;const c=mount(h,input);return{d,h,c};};
test('public schema and semantic validation accept bounded pie with exact literal roundtrip',()=>{
 const input=doc(pie({title:'<b>Literal</b>',data:[{category:'same',amount:1},{category:'same',amount:null},{category:'<script>',amount:0}]})),before=JSON.stringify(input),result=validateDocument(input);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(JSON.stringify(input),before);assert.deepEqual(result.document.body,input.body);
 for(const data of [[],[{category:'Zero',amount:0}],Array.from({length:300},(_,i)=>({category:`Row ${i}`,amount:i}))])assert.equal(validateDocument(doc(pie({data}))).ok,true);
});
test('public negatives reject misleading axes/series/bounds/negative/sum and invalid references',()=>{
 for(const extra of [{xScale:'linear'},{xScale:'time'},{xMin:0},{xMax:2},{yMin:0},{yMax:4},{series:[{key:'amount',label:'Amount'},{key:'other',label:'Other'}]},{data:[{category:'A',amount:-1}]},{data:[{category:'A',amount:Number.MAX_VALUE},{category:'B',amount:Number.MAX_VALUE}]}]){const result=validateDocument(doc(pie(extra)));assert.equal(result.ok,false);assert.ok(result.issues.some(issue=>issue.code==='CHART_PIE'),JSON.stringify(result));}
 for(const extra of [{data:[{category:'A',amount:'4'}]},{data:[{category:'A',amount:{$:'unknown'}}]},{data:Array.from({length:301},()=>({category:'A',amount:1}))},{arbitrary:true}])assert.equal(validateDocument(doc(pie(extra))).ok,false);
 const negative=validateDocument(doc(pie({data:[{category:'A',amount:-1}]})));assert.ok(negative.issues.some(i=>i.code==='CHART_PIE'&&i.path==='/body/0/data/0/amount'),JSON.stringify(negative));
});
test('actual public mount preserves focus details index and atomic invalid updates',()=>{
 const{d,h,c}=setup(),svg=h.querySelector('svg'),details=h.querySelector('details'),output=h.querySelector('output');details.open=true;svg.focus();svg.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));c.setState({amount:3,other:1});assert.equal(h.querySelector('svg'),svg);assert.equal(h.querySelector('details'),details);assert.equal(details.open,true);assert.equal(d.window.document.activeElement,svg);assert.match(output.value,/B.*50.0%/);const before=h.innerHTML,state=c.getState();assert.throws(()=>c.setState({amount:-1}));assert.deepEqual(c.getState(),state);assert.equal(h.innerHTML,before);assert.equal(evaluateState(doc(),{amount:-1}).ok,false);assert.throws(()=>c.update(doc(pie({xScale:'linear'}))));assert.equal(h.innerHTML,before);
 c.update(doc());const oldValue=output.value;svg.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'End'}));assert.equal(output.value,oldValue);assert.equal(details.isConnected,false);const nextSvg=h.querySelector('svg'),nextOutput=h.querySelector('output');c.dispose();const nextValue=nextOutput.value;nextSvg.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'End'}));assert.equal(nextOutput.value,nextValue);assert.equal(h.childElementCount,0);
});
test('literal markup, missing/zero/tiny values and nearest-host language survive public mount',()=>{
 const {h,c}=setup(doc(pie({title:'<img src=x>',note:'<script>x</script>',data:[{category:'Tiny',amount:Number.MIN_VALUE},{category:'Large',amount:1e308},{category:'Zero',amount:0},{category:'Missing',amount:null}]})),'zh-CN');assert.equal(h.querySelector('img,script'),null);assert.match(h.querySelector('summary').textContent,/查看/);assert.equal(h.querySelectorAll('tbody tr').length,4);assert.match(h.querySelector('tbody').textContent,/5e-324/);assert.match(h.querySelector('svg title').textContent,/<0.1%/);assert.doesNotMatch(h.querySelector('svg').innerHTML,/NaN|Infinity/);c.dispose();
});
test('compiled output deterministically retains original pie payload and standalone rendering',async()=>{
 const input=doc(pie({data:[{category:'<literal>',amount:0},{category:'Missing',amount:null}]})),html=await compileHtml(input);assert.equal(html,await compileHtml(input));assert.match(html,/"kind":"pie"/);assert.match(html,/"amount":null/);assert.match(html,/iui-pie/);
});

test('finite extreme single and subnormal distributions pass the actual public API and render full data',()=>{
 for(const data of [[{category:'Maximum',amount:Number.MAX_VALUE}],[{category:'Tiny A',amount:Number.MIN_VALUE},{category:'Tiny B',amount:Number.MIN_VALUE}]]){
  const d=doc(pie({data})),checked=validateDocument(d);assert.equal(checked.ok,true,JSON.stringify(checked.issues));const {h,c}=setup(d);assert.equal(h.querySelectorAll('path').length,data.length);assert.equal(h.querySelectorAll('tbody tr').length,data.length);assert.doesNotMatch(h.querySelector('svg').innerHTML,/NaN|Infinity/);c.dispose();
 }
});
