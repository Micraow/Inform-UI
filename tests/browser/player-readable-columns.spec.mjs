import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(process.env.QA_PLAYER_FIXTURE??new URL('../../examples/player-summaries.json',import.meta.url),'utf8'));
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`player readable columns ${theme} ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1100});await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 const spec=structuredClone(fixture);spec.theme=theme;await page.evaluate(spec=>window.iui.mount(document.getElementById('host'),spec),spec);
 const measurements=await page.locator('.iui-player-summary').evaluateAll(roots=>roots.map(root=>{
  const wrap=root.querySelector('.iui-player-table-scroll'),table=wrap.querySelector('table');
  const words=element=>{
   const output=[],walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node;
   while((node=walk.nextNode()))for(const match of node.data.matchAll(/[\p{L}\p{N}][\p{L}\p{N}/-]{3,}/gu)){
    const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
    const boxes=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}));
    output.push({text:match[0],lineTops:[...new Set(boxes.map(r=>Math.round(r.y*2)/2))],boxes});
   }
   return output;
  };
  const headings=[...table.querySelectorAll('thead th')].map(th=>({text:th.textContent,width:th.getBoundingClientRect().width,words:words(th)}));
  const literalCells=[...table.querySelectorAll('tbody th,tbody td')].filter(td=>/^\d{4}\/\d{2}$/.test(td.textContent.trim())).map(td=>({text:td.textContent,width:td.getBoundingClientRect().width,words:words(td)}));
  const before=wrap.scrollLeft;wrap.scrollLeft=100;const moved=wrap.scrollLeft;wrap.scrollLeft=before;
  return {kind:root.className,clientWidth:wrap.clientWidth,scrollWidth:wrap.scrollWidth,tableWidth:table.getBoundingClientRect().width,scrollMoves:moved!==before,headings,literalCells};
 }));
 await writeFile(testInfo.outputPath('column-geometry.json'),JSON.stringify({theme,width,measurements},null,2));
 await page.screenshot({path:testInfo.outputPath('readable-columns.png'),fullPage:true});
 expect(measurements).toHaveLength(2);
 for(const table of measurements){
  const words=table.headings.flatMap(h=>h.words);expect(words.length).toBeGreaterThan(0);
  for(const word of words)expect(word.lineTops.length,`${table.kind}: header word ${word.text} must remain legible`).toBe(1);
  for(const word of table.literalCells.flatMap(cell=>cell.words))expect(word.lineTops.length,`supplied literal ${word.text} must stay intact`).toBe(1);
  if(width===390){expect(table.scrollWidth).toBeGreaterThan(table.clientWidth);expect(table.scrollMoves).toBe(true);}
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
