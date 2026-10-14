import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=await readFile(new URL('../../examples/v2/layered-work.openui',import.meta.url),'utf8');
async function mount(page,source,theme='light',entry='inform-core'){
 await page.goto('/mount.html');await page.addScriptTag({path:fileURLToPath(new URL(`../../dist/v2/${entry}.global.js`,import.meta.url))});
 await page.evaluate(({source,theme})=>{document.documentElement.lang='zh-CN';document.body.style.cssText='margin:0;padding:16px';const host=document.getElementById('host');host.replaceChildren();window.layoutApp=InformUI.mount(host,{source,theme});document.body.style.background=getComputedStyle(window.layoutApp.element).backgroundColor;},{source,theme});
 await expect(page.locator('.if-root')).toHaveAttribute('data-phase','ready');
}
for(const entry of ['inform-core','inform-ui'])for(const theme of ['light','dark'])for(const width of [320,390,760])test(`composed partitions: ${entry} ${theme} ${width}px`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:500});await mount(page,source,theme,entry);
 const grids=page.locator('.if-grid');await expect(grids).toHaveCount(4);
 let edge=null;
 for(const [i,count]of [1,2,4,8].entries()){
  const geometry=await grids.nth(i).evaluate(grid=>({grid:grid.getBoundingClientRect().toJSON(),children:[...grid.children].map(e=>e.getBoundingClientRect().toJSON())}));
  expect(geometry.children.length).toBe(count);const first=geometry.children[0];
  for(const box of geometry.children){expect(Math.abs(box.width-first.width)).toBeLessThan(1);expect(Math.abs(box.top-first.top)).toBeLessThan(1);expect(box.height).toBeGreaterThanOrEqual(24);expect(box.left).toBeGreaterThanOrEqual(geometry.grid.left-1);expect(box.right).toBeLessThanOrEqual(geometry.grid.right+1);}
  if(edge){expect(Math.abs(geometry.grid.left-edge.left)).toBeLessThan(1);expect(Math.abs(geometry.grid.right-edge.right)).toBeLessThan(1);}else edge=geometry.grid;
 }
 await expect(page.locator('.if-card')).toContainText('4 层 × 每层 8 次工作量');await expect(page.locator('.if-card')).toContainText('32');
 const textChecks=await page.locator('.if-text').evaluateAll(nodes=>nodes.map(e=>{const rect=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),style=getComputedStyle(e);return{label:e.textContent,rect:rect.toJSON(),text:text.toJSON(),lineRects:[...range.getClientRects()].map(r=>r.toJSON()),whiteSpace:style.whiteSpace,fontSize:parseFloat(style.fontSize),inside:text.left>=rect.left-1&&text.right<=rect.right+1&&text.top>=rect.top-1&&text.bottom<=rect.bottom+1,clipped:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1};}));
 for(const item of textChecks){expect(item.fontSize,item.label).toBeGreaterThanOrEqual(12);expect(item.inside,JSON.stringify(item)).toBe(true);expect(item.clipped,item.label).toBe(false);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
 if(entry==='inform-core')await page.screenshot({path:`test-results/foundation-layout-${theme}-${width}.png`,fullPage:true});
});
test('default Grid still collapses while preserve and equal Row retain their tracks',async({page})=>{
 await page.setViewportSize({width:320,height:700});await mount(page,'root=Stack([Grid([Text("A"),Text("B")],2),Grid([Text("C"),Text("D")],2,"xs","preserve"),Row([Box([Text("Equal")],{width:"xs"}),Box([Text("Same")],{width:"md"})],"xs","stretch",{wrap:"nowrap",distribution:"equal"}),Row([Text("Default")])])');
 const grids=page.locator('.if-grid');expect(await grids.nth(0).evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(1);expect(await grids.nth(1).evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(2);
 const sizes=await page.locator('.if-row').first().locator(':scope > *').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().width));expect(Math.abs(sizes[0]-sizes[1])).toBeLessThan(1);
 expect(await page.locator('.if-row').last().evaluate(e=>getComputedStyle(e).flexWrap)).toBe('wrap');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const theme of ['light','dark'])test(`Box ${theme} surfaces pair readable foregrounds and grow for content`,async({page})=>{
 const surfaces=['surface','info','success','warning','error'];const source='root=Stack(['+surfaces.map(background=>'Box([Text("Readable supplied label"),Text("A long label can wrap and expand the container instead of clipping text.")],{background:'+JSON.stringify(background)+',padding:"sm",radius:"sm",minHeight:"sm"})').join(',')+'])';
 await page.setViewportSize({width:320,height:900});await mount(page,source,theme);
 const checks=await page.locator('.if-box').evaluateAll(nodes=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),composite=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*(fg[3]??1)+bg[i]*(1-(fg[3]??1))),lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  return nodes.map(e=>{let background=[255,255,255];const ancestors=[];for(let n=e;n;n=n.parentElement)ancestors.unshift(n);for(const n of ancestors)background=composite(rgb(getComputedStyle(n).backgroundColor),background);const foreground=rgb(getComputedStyle(e.querySelector('.if-text')).color),a=lum(foreground),b=lum(background),style=getComputedStyle(e);return{role:e.dataset.background,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),height:e.getBoundingClientRect().height,padding:style.paddingTop,radius:style.borderRadius};});
 });
 for(const c of checks){expect(c.contrast,c.role).toBeGreaterThanOrEqual(4.5);expect(c.height).toBeGreaterThan(24);expect(c.padding).toBe('8px');expect(c.radius).toBe('6px');}
});
test('theme changes and repeated layout edits retain focused controls without stale presentation',async({page})=>{
 await page.setViewportSize({width:390,height:600});await mount(page,'$active=true\n$draft=""\nroot=Stack([Box([Input("Draft",$draft),Text($draft)],$active?{background:"info",padding:"sm",width:"full",radius:"lg",minHeight:"lg"}:{}),Button("Toggle",@Set($active,!$active))])');
 const input=page.getByRole('textbox',{name:'Draft'});await input.fill('Still here');await input.evaluate(e=>window.oldInput=e);await expect(input).toBeFocused();await page.evaluate(()=>window.layoutApp.setTheme('dark'));await expect(input).toBeFocused();
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'Toggle'}).click();await expect(page.locator('.if-box')).toHaveAttribute('data-background',i%2?'info':'transparent');await expect(input).toHaveValue('Still here');expect(await input.evaluate(e=>e===window.oldInput)).toBe(true);}
 await page.evaluate(()=>window.layoutApp.preview('root=Stack([Box([Text('));await expect(page.locator('input,button')).toHaveCount(0);await page.evaluate(source=>window.layoutApp.commit(source),source);await expect(page.locator('.if-grid')).toHaveCount(4);
});

for(const theme of ['light','dark'])test(`original foundation compositions and real local stepping in ${theme}`,async({page})=>{
 await page.setViewportSize({width:390,height:850});
 for(const file of ['array-overview','array-steps','vertical-steps','document-comparison']){
  const source=await readFile(new URL(`../../examples/v2/${file}.openui`,import.meta.url),'utf8');await mount(page,source,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#host img,#host svg,#host canvas,#host iframe')).toHaveCount(0);
  if(file==='array-steps'){
   const previous=page.getByRole('button',{name:'Previous',exact:true}),next=page.getByRole('button',{name:'Next',exact:true});await expect(previous).toBeDisabled();
   for(let step=1;step<=4;step++){await next.click();await expect(page.locator('#host')).toContainText(`Step ${step+1} / 5`);}
   await expect(next).toBeDisabled();await expect(page.locator('#host')).toContainText('The final minimum is 2.');await expect(page.locator('.if-grid > .if-box').nth(3)).toHaveAttribute('data-background','success');
   for(let step=3;step>=0;step--){await previous.click();await expect(page.locator('#host')).toContainText(`Step ${step+1} / 5`);}
   await expect(previous).toBeDisabled();await expect(next).toBeEnabled();await next.focus();await page.keyboard.press('Enter');await expect(page.locator('#host')).toContainText('Step 2 / 5');await next.focus();await page.keyboard.press('Space');await expect(page.locator('#host')).toContainText('Step 3 / 5');
  }
  await page.screenshot({path:`test-results/foundation-${file}-${theme}-390.png`,fullPage:true});
 }
});

test('pinned CJK text preserves whitespace without hanging beyond narrow boxes',async({page})=>{
 const font=await readFile(new URL('../assets/fonts/noto-cjk-sc/NotoSansCJKsc-Regular.otf',import.meta.url));
 await page.route('**/inform-foundation-font.otf',route=>route.fulfill({contentType:'font/otf',body:font}));
 await page.setViewportSize({width:320,height:500});await mount(page,source);
 await page.addStyleTag({content:'@font-face{font-family:"Inform Layout Regression CJK";src:url("/inform-foundation-font.otf") format("opentype");font-display:block}.if-root[data-theme]{--if-font:"Inform Layout Regression CJK",sans-serif}'});
 await page.evaluate(()=>document.fonts.load('14px "Inform Layout Regression CJK"'));
 expect(await page.evaluate(()=>document.fonts.check('14px "Inform Layout Regression CJK"'))).toBe(true);
 const measure=()=>page.locator('.if-text').last().evaluate(e=>{const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect(),style=getComputedStyle(e);return{label:e.textContent,rect:r.toJSON(),text:t.toJSON(),lines:[...range.getClientRects()].map(x=>x.toJSON()),whiteSpace:style.whiteSpace,fontFamily:style.fontFamily,inside:t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1,clipped:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1};});
 const paragraph=await measure();expect(paragraph.fontFamily).toContain('Inform Layout Regression CJK');expect(paragraph.inside,JSON.stringify(paragraph)).toBe(true);expect(paragraph.clipped).toBe(false);
 const literal='MMMM   MMMM\n  缩进保持';
 await page.evaluate(literal=>{const result=window.layoutApp.commit('root=Stack([Text('+JSON.stringify(literal)+',"default","start","sm")])');if(!result.ok)throw Error(JSON.stringify(result));},literal);
 // Derive a width from the real loaded glyphs, just too narrow for the first
 // word plus a space. This reproduces hanging whitespace without OS font luck.
 await page.locator('.if-text').evaluate(e=>{const range=document.createRange(),text=e.firstChild;range.setStart(text,0);range.setEnd(text,4);const word=range.getBoundingClientRect().width;range.setStart(text,4);range.setEnd(text,5);const space=range.getBoundingClientRect().width;e.style.width=(word+space/2)+'px';});
 const wrapped=await measure();expect(wrapped.label).toBe(literal);expect(wrapped.whiteSpace).toBe('break-spaces');expect(wrapped.lines.length).toBeGreaterThan(2);expect(wrapped.inside,JSON.stringify(wrapped)).toBe(true);expect(wrapped.clipped).toBe(false);
 // Negative control: the old rule really exceeds the same box. Never weaken
 // the normal containment assertion to ignore preserved whitespace fragments.
 const legacyStyle=await page.addStyleTag({content:'.if-root .if-text{white-space:pre-wrap}'});
 const legacy=await measure();expect(legacy.whiteSpace).toBe('pre-wrap');expect(legacy.text.right).toBeGreaterThan(legacy.rect.right+1);expect(legacy.inside).toBe(false);
 await legacyStyle.evaluate(e=>e.remove());expect((await measure()).inside).toBe(true);
});
