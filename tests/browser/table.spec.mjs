// Drop-in Inform-UI browser suite; uses its existing /mount.html test host.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/structured-tables.json',import.meta.url)));
const noOverflow=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const first=page=>page.locator('.iui-table-container').first();
const scroll=page=>first(page).locator('.iui-table-scroll');
async function mount(page,spec=fixture){await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);await page.evaluate(data=>{document.documentElement.lang='en';window.tableController=window.iui.mount(document.getElementById('host'),data);},spec);}
test.beforeEach(async({page})=>{page.on('pageerror',error=>{throw error;});});

for(const theme of ['light','dark'])for(const width of [390,768,1100]){
  test(`structured tables ${theme} ${width}px: native merges, accessible headers, local scroll, focus and snapshot`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:1050});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    const requests=[];page.on('request',request=>requests.push(request.url()));await mount(page,{...fixture,theme});
    const table=first(page).locator('table');await expect(table.locator('tbody')).toHaveCount(2);await expect(table.locator('tfoot')).toHaveCount(1);
    await expect(table.locator('thead tr')).toHaveCount(2);await expect(table.locator('[role="grid"]')).toHaveCount(0);
    await expect(table.locator('thead th').first()).toHaveAttribute('rowspan','2');await expect(table.locator('thead th').first()).toHaveAttribute('colspan','2');
    expect(await noOverflow(page)).toBe(true);
    const associations=await table.locator('tbody').first().locator('tr').first().locator('td').first().evaluate(cell=>cell.getAttribute('headers').split(' ').map(id=>document.getElementById(id).textContent));
    expect(associations).toEqual(['Measurements','Baseline','North','Alpha']);
    const dimensions=await table.evaluate(table=>{
      const rect=cell=>{const box=cell.getBoundingClientRect();return {x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height};};
      const top=table.tHead.rows[0].cells[1],bottom=[...table.tHead.rows[1].cells];
      const body=table.tBodies[0],span=body.rows[0].cells[0];
      const collisions=[];
      for(const section of [table.tHead,...table.tBodies,table.tFoot]){
        const cells=[...section.querySelectorAll('th,td')].map(rect);
        for(let a=0;a<cells.length;a++)for(let b=a+1;b<cells.length;b++){
          const horizontal=Math.min(cells[a].right,cells[b].right)-Math.max(cells[a].x,cells[b].x);
          const vertical=Math.min(cells[a].bottom,cells[b].bottom)-Math.max(cells[a].y,cells[b].y);
          if(horizontal>1&&vertical>1)collisions.push({a,b});
        }
      }
      return {top:rect(top).width,bottom:bottom.reduce((sum,cell)=>sum+rect(cell).width,0),span:rect(span).height,rows:rect(body.rows[0].cells[1]).height+rect(body.rows[1].cells[0]).height,collisions};
    });
    expect(Math.abs(dimensions.top-dimensions.bottom)).toBeLessThan(2);expect(Math.abs(dimensions.span-dimensions.rows)).toBeLessThan(2);expect(dimensions.collisions).toEqual([]);
    expect(await table.locator('.iui-table-number').evaluateAll(cells=>cells.every(cell=>getComputedStyle(cell).whiteSpace==='nowrap'))).toBe(true);
    expect(await table.locator('thead th').first().evaluate(cell=>getComputedStyle(cell).backgroundColor)).toBe(theme==='dark'?'rgb(24, 24, 24)':'rgb(249, 249, 249)');
    await scroll(page).focus();await expect(scroll(page)).toBeFocused();
    const overflow=await scroll(page).evaluate(node=>node.scrollWidth>node.clientWidth+1);
    if(overflow){await expect(first(page).locator('.iui-table-scroll-hint')).toBeVisible();await expect(scroll(page)).toHaveAttribute('aria-describedby',/hint/);await page.keyboard.press('ArrowRight');await expect.poll(()=>scroll(page).evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);}
    else await expect(first(page).locator('.iui-table-scroll-hint')).toBeHidden();
    if(width===390)expect(overflow).toBe(true);
    const before=await scroll(page).evaluate(node=>node.scrollLeft);
    await page.evaluate(()=>{window.tableScroll=document.querySelector('.iui-table-scroll');for(let count=0;count<16;count++)window.tableController.setState({count});});
    await expect(scroll(page)).toBeFocused();expect(await page.evaluate(()=>window.tableScroll===document.querySelector('.iui-table-scroll'))).toBe(true);
    expect(await scroll(page).evaluate(node=>node.scrollLeft)).toBe(before);
    await expect(table.locator('tbody').first().locator('tr').first().locator('td').first()).toHaveText('15');
    await scroll(page).evaluate(node=>node.scrollLeft=0);await page.screenshot({path:testInfo.outputPath(`tables-${theme}-${width}.png`),fullPage:true});
    expect(requests.filter(url=>!url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
  });
}

test('table content is inert; ready/empty/loading/error updates and repeated disposal do not retain table listeners',async({page})=>{
  await page.setViewportSize({width:390,height:900});await mount(page);
  await page.evaluate(()=>{window.detachedTable=document.querySelector('.iui-table-container');window.detachedScroll=document.querySelector('.iui-table-scroll');});
  const attack='<img src="https://evil.invalid/pixel" onerror="window.compromised=1"><script>bad()</script>';
  const statusSpec={version:'iui/1',body:[{type:'table',caption:'Visible caption',columns:['Label','Value'],rows:[['A',0]]}]};
  for(const status of ['loading','error','ready','error','ready']){
    await page.evaluate(({spec,status,attack})=>{const next=structuredClone(spec);next.body[0].status=status;next.body[0].message=attack;window.tableController.update(next);},{spec:statusSpec,status,attack});
    await expect(first(page)).toHaveAttribute('data-status',status);await expect(first(page).locator('img,script')).toHaveCount(0);
    await expect(first(page).locator('caption')).toHaveText('Visible caption');
    if(status!=='ready'){await expect(first(page).locator('td')).toHaveCount(0);await expect(first(page).locator('.iui-table-status')).toHaveText(attack);}
    else await expect(first(page).locator('td').last()).toHaveText('0');
  }
  await page.evaluate(spec=>{const next=structuredClone(spec);next.body[0].rows=[];document.documentElement.lang='zh-CN';window.tableController.update(next);},statusSpec);
  await expect(first(page).locator('.iui-table-status')).toHaveText('暂无数据');await expect(first(page).locator('tbody tr')).toHaveCount(0);
  await page.evaluate(()=>{window.tableController.dispose();window.tableController.dispose();window.dispatchEvent(new Event('resize'));});
  await expect(page.locator('#host')).toBeEmpty();expect(await page.evaluate(()=>window.compromised)).toBeUndefined();expect(await noOverflow(page)).toBe(true);
});

test('table keyboard focus and scroll hint respond to a real narrow-to-wide resize without replacing the table',async({page})=>{
  await page.setViewportSize({width:390,height:900});await mount(page,{version:'iui/1',body:[{type:'table',columns:['ID','First value','Second value'],rows:[['Alpha',123456789012345,123456789012345]]}]});
  await scroll(page).focus();await expect(first(page).locator('.iui-table-scroll-hint')).toBeVisible();
  await page.setViewportSize({width:1100,height:900});await expect(scroll(page)).toBeFocused();await expect(first(page).locator('.iui-table-scroll-hint')).toBeHidden();
  await expect(scroll(page)).not.toHaveAttribute('aria-describedby',/hint/);expect(await noOverflow(page)).toBe(true);
});
