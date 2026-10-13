import {test,expect} from '@playwright/test';
const choose=async(page,type)=>{await page.evaluate(value=>{location.hash=value;},type);await expect(page.locator('#preview')).toHaveAttribute('data-component',type);};
for(const width of [390,1440])test(`code, code citations and JSON use loaded upright mono fonts at ${width}px`,async({page,context})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/standalone.html#code');await expect(page.locator('html')).toHaveAttribute('data-ready','true');await context.setOffline(true);
 for(const type of ['code','code-cite','native']){
  await choose(page,type);
  const loaded=await page.evaluate(async()=>{const faces=await document.fonts.load('400 12px "Source Code Pro"','JSON{}');return faces.map(face=>({family:face.family,status:face.status,style:face.style}));});
  expect(loaded.some(face=>face.family==='Source Code Pro'&&face.status==='loaded'&&face.style==='normal')).toBe(true);
  const details=await page.locator('#json-code, #json-code span, #preview code, #preview code span').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node);const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;return{family:s.fontFamily,style:s.fontStyle,mono:Math.abs(ctx.measureText('iiii').width-ctx.measureText('WWWW').width)};}));
  expect(details.length).toBeGreaterThan(0);for(const detail of details){expect(detail.family).toContain('Source Code Pro');expect(detail.style).toBe('normal');expect(detail.mono).toBeLessThan(.1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
