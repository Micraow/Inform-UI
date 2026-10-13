import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import path from 'node:path';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><html><head></head><body><main class="if-root" style="font:400 16px/24px system-ui;--if-font:system-ui"></main></body></html>',{pretendToBeVisual:true});
const w=dom.window;
for(const key of ['window','document','HTMLElement','SVGElement','Element','MutationObserver','Node','MouseEvent','KeyboardEvent'])globalThis[key]=key==='window'?w:w[key];
// jsdom has no inherited custom properties or complete font inheritance. Resolve those browser behaviors
// explicitly; the real ThemeProvider still creates/removes its actual CSS rules.
const computed=w.getComputedStyle.bind(w);
globalThis.getComputedStyle=el=>new Proxy(computed(el),{get(style,key){
 if(key==='getPropertyValue')return name=>{for(let node=el;node;node=node.parentElement){const value=computed(node).getPropertyValue(name);if(value||!name.startsWith('--'))return value;}return '';};
 if(['fontSize','lineHeight','fontFamily'].includes(key)){for(let node=el;node;node=node.parentElement){const value=computed(node)[key];if(value&&value!=='inherit')return value;}return ''; }
 return Reflect.get(style,key);
}});
globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);globalThis.cancelAnimationFrame=w.cancelAnimationFrame.bind(w);
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;}observe(){this.callback([{contentRect:{width:280,height:280}}]);}disconnect(){}};
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
Object.defineProperty(w.document,'fonts',{value:{status:'loaded',ready:Promise.resolve()}});
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 280;}});
Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return 280;}});
const measured=[];
w.HTMLCanvasElement.prototype.getContext=()=>({font:'10px sans-serif',measureText(value){measured.push(this.font);return{width:String(value).length*Number(this.font.match(/([\d.]+)px/)?.[1]??10)*.6};}});
const built=await build({stdin:{contents:`
 import React from 'react';
 import {useTheme} from './packages/chart-extension/vendor/openui/packages/react-ui/src/components/ThemeProvider/ThemeProvider';
 export {createChartAdapters,readChartTheme} from './packages/chart-extension/src/renderers.tsx';
 export {BarChart} from './packages/chart-extension/vendor/openui/packages/react-ui/src/components/Charts/BarChart/BarChart';
 export {typography,themeTokens} from './src/v2/foundation/tokens.ts';
 export const observedThemes=[];
 export function ThemeProbe(){const {theme}=useTheme();observedThemes.push(theme);return React.createElement('span',null,'Chart probe');}
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',nodePaths:[path.resolve('packages/chart-extension/node_modules')],loader:{'.css':'text'},define:{'process.env.NODE_ENV':'"production"'}});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const host=document.querySelector('main');
const flush=()=>new Promise(resolve=>setTimeout(resolve,60));

test('Intelligent caption, small and body roles stay distinct from inherited 16px body size',()=>{
 const element=document.createElement('figure');host.append(element);
 for(const mode of ['light','dark']){
  host.dataset.theme=mode;
  const result=api.readChartTheme(element),theme=result.theme;
  assert.equal(result.mode,mode);
  assert.equal(theme.textLabelXs,`${api.typography.regular} ${api.typography.caption}px/${api.typography.lineHeight} system-ui`);
  assert.equal(theme.textLabelXsHeavy,`${api.typography.semibold} ${api.typography.caption}px/${api.typography.lineHeight} system-ui`);
  assert.match(theme.textLabelSm,/ 14px\/1\.5 /);assert.equal(theme.textLabelSm,theme.textBodySm);
  assert.match(theme.textBodyDefault,/ 16px\/1\.5 /);assert.equal(theme.textLabelDefault,theme.textBodyDefault);
  assert.equal(theme.barChartPalette[0],api.themeTokens[mode].chart1);
 }
 host.style.setProperty('--if-font','"Host Font", sans-serif');host.style.setProperty('--if-chart-1','#123456');
 const theme=api.readChartTheme(element).theme;
 assert.match(theme.textLabelXs,/"Host Font", sans-serif$/);assert.equal(theme.barChartPalette[0],'#123456');
 host.style.setProperty('--if-font','system-ui');host.style.removeProperty('--if-chart-1');host.dataset.theme='light';element.remove();
});

test('charts mount with the resolved host typography and palette on their first render',async()=>{
 const handle=api.createChartAdapters({Probe:api.ThemeProbe}).Probe.create({title:'Probe',values:[1]},{document});host.append(handle.element);await flush();
 assert.ok(api.observedThemes.length>0);
 for(const theme of api.observedThemes){assert.equal(theme.textLabelXs,'400 12px/1.5 system-ui');assert.equal(theme.barChartPalette[0],api.themeTokens.light.chart1);assert.doesNotMatch(theme.textLabelXs,/Inter/);}
 handle.dispose();handle.element.remove();assert.equal(document.querySelector('style[data-openui-theme]'),null);
});

test('actual condensed bar chart measures the same caption font as its 100 and 150 y-ticks',async()=>{
 measured.length=0;
 const props={title:'Compare the current shortlist',labels:['Riverside weekend','Coastal escape'],series:[{name:'Sample cost',values:[95,145]}]};
 const handle=api.createChartAdapters({BarChart:api.BarChart}).BarChart.create(props,{document});host.append(handle.element);await flush();
 assert.equal(handle.element.querySelector('[role=alert]'),null);
 const ticks=[...handle.element.querySelectorAll('.openui-bar-chart-y-tick')];
 assert.ok(ticks.some(t=>t.textContent==='100'));assert.ok(ticks.some(t=>t.textContent==='150'));
 for(const tick of ticks){const font=getComputedStyle(tick).getPropertyValue('--openui-text-label-xs').trim();assert.equal(font,'400 12px/1.5 system-ui');const textWidth=tick.textContent.length*api.typography.caption*.6;assert.ok(Number(tick.getAttribute('x'))-textWidth>=0,`${tick.textContent} clips left of the SVG`);}
 assert.ok(measured.length>0);assert.ok(measured.every(font=>font==='400 12px/1.5 system-ui'));
 host.dataset.theme='dark';await flush();assert.equal(getComputedStyle(ticks[0]).getPropertyValue('--openui-text-label-xs').trim(),'400 12px/1.5 system-ui');
 handle.dispose();handle.element.remove();host.dataset.theme='light';assert.equal(document.querySelector('style[data-openui-theme]'),null);
});

test('long component names can shrink and wrap in the showcase header without clipping the page',async()=>{
 const css=await readFile('showcase-next/style.css','utf8');
 assert.match(css,/\.workspace-head>div\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
 assert.match(css,/@media\(max-width:700px\)[\s\S]*\.workspace-head\{[^}]*flex-wrap:wrap/);
 assert.match(css,/\.workspace-head>div\{flex-basis:100%\}/);
 assert.doesNotMatch(css,/(?:body|html)\{[^}]*overflow-x:hidden/);
});

test.after(()=>dom.window.close());
