import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/player-summaries.json',import.meta.url)));
async function setup(page,spec=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({spec,lang})=>{const host=document.getElementById('host');host.lang=lang;window.playerController=window.iui.mount(host,spec);},{spec,lang});
  return requests;
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`player summaries ${theme} ${width}: stable statistics and local filters`,async({page,context})=>{
  await page.setViewportSize({width,height:1100});const spec=structuredClone(fixture);spec.theme=theme;
  const requests=await setup(page,spec);await context.setOffline(true);
  const basketball=page.locator('.iui-nba-player'),tennis=page.locator('.iui-tennis-player');
  await basketball.locator('select').nth(2).selectOption('pointsPerGame');
  expect(await basketball.locator('tbody tr:visible').evaluateAll(rows=>rows.map(row=>row.dataset.recordId))).toEqual(['playoffs','north','south','zero','unknown']);
  await basketball.locator('[data-record-id=north] summary').focus();await page.keyboard.press('Enter');
  await expect(basketball.locator('[data-record-id=north] details')).toHaveAttribute('open','');
  await basketball.locator('select').nth(1).selectOption('regular-season');await expect(basketball.locator('tbody tr:visible')).toHaveCount(2);
  await basketball.locator('.iui-player-reset').click();await expect(basketball.locator('[data-record-id=north] details')).toHaveAttribute('open','');
  await tennis.locator('select').nth(2).selectOption('rank');
  expect(await tennis.locator('tbody tr:visible').evaluateAll(rows=>rows.map(row=>row.dataset.recordId))).toEqual(['grass','clay','hard','unknown','zero']);
  await tennis.locator('select').nth(1).selectOption('clay');await expect(tennis.locator('tbody tr:visible')).toHaveCount(1);
  expect(requests).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/player-summaries-${theme}-${width}.png`,fullPage:true});
});
test('player summaries native reset and canceled reset preserve local filters',async({page})=>{
  await setup(page);await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.before(form);form.append(host);});
  const search=page.locator('.iui-nba-player input');await search.fill('north');
  await page.evaluate(()=>{const form=document.querySelector('form');form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();});
  await expect(search).toHaveValue('north');await page.evaluate(()=>document.querySelector('form').reset());await expect(search).toHaveValue('');
});
test('player summaries Chinese, touch and forced colors retain literal RTL player content',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1100}}),page=await context.newPage();
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});const spec=structuredClone(fixture);spec.body[0].label='ملخص لاعب';
  const requests=await setup(page,spec,'zh-CN');await expect(page.locator('.iui-nba-player')).toHaveCSS('direction','rtl');
  const surface=page.locator('.iui-tennis-player select').nth(1);await surface.tap();await page.keyboard.press('Escape');await surface.selectOption('hard');
  await expect(page.locator('.iui-tennis-player tbody tr:visible')).toHaveCount(1);await page.locator('.iui-tennis-player .iui-player-reset').tap();
  await expect(page.locator('.iui-tennis-player tbody tr:visible')).toHaveCount(5);expect(requests).toEqual([]);await context.close();
});
