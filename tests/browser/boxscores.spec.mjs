import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/boxscores.json',import.meta.url)));
async function setup(page,spec=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({spec,lang})=>{const host=document.getElementById('host');host.lang=lang;window.boxscoreController=window.iui.mount(host,spec);},{spec,lang});return requests;
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`supplied boxscores ${theme} ${width}: keyboard, teams, innings and stable ties`,async({page,context})=>{
  await page.setViewportSize({width,height:1100});const spec=structuredClone(fixture);spec.theme=theme;
  const requests=await setup(page,spec);await context.setOffline(true);
  const nba=page.locator('.iui-nba-boxscore'),cricket=page.locator('.iui-cricket-boxscore');
  await nba.locator('.iui-boxscore-periods summary').focus();await page.keyboard.press('Enter');await expect(nba.locator('.iui-boxscore-periods')).toHaveAttribute('open','');
  await nba.locator('select').nth(2).selectOption('points');
  expect(await nba.locator('.iui-basketball-players tbody tr:visible').evaluateAll(rows=>rows.map(row=>row.dataset.playerId))).toEqual(['casey','alex','blake','zero','unknown']);
  await nba.locator('select').nth(0).selectOption('t0');await nba.locator('select').nth(1).selectOption('bench');await expect(nba.locator('.iui-basketball-players tbody tr:visible')).toHaveCount(1);
  await nba.locator('.iui-boxscore-reset').click();await expect(nba.locator('.iui-boxscore-periods')).toHaveAttribute('open','');
  await cricket.locator('select').nth(2).selectOption('runs');
  expect(await cricket.locator('[data-innings-id=first] .iui-cricket-bowling tbody tr:visible').evaluateAll(rows=>rows.map(row=>row.dataset.playerId))).toEqual(['devon','casey','unknown']);
  await cricket.locator('select').first().selectOption('i1');await expect(cricket.locator('[data-innings-id=second]')).toBeVisible();await expect(cricket.locator('[data-innings-id=first]')).toBeHidden();
  await cricket.locator('.iui-boxscore-reset').click();await expect(cricket.locator('[data-innings-id=first]')).toBeVisible();
  expect(requests).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/boxscores-${theme}-${width}.png`,fullPage:true});
});
test('boxscore native parent-form reset honors cancellation and restores local source order',async({page})=>{
  await setup(page);await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.before(form);form.append(host);});
  const query=page.locator('.iui-nba-boxscore input');await query.fill('blake');
  await page.evaluate(()=>{const form=document.querySelector('form');form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();});await expect(query).toHaveValue('blake');
  await page.evaluate(()=>document.querySelector('form').reset());await expect(query).toHaveValue('');
});
test('boxscores Chinese, RTL, touch and forced colors retain supplied values',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1100}}),page=await context.newPage();await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const spec=structuredClone(fixture);spec.body[0].label='إحصائيات مقدمة';const requests=await setup(page,spec,'zh-CN');await expect(page.locator('.iui-nba-boxscore')).toHaveCSS('direction','rtl');
  const innings=page.locator('.iui-cricket-boxscore select').first();await innings.tap();await page.keyboard.press('Escape');await innings.selectOption('i1');await expect(page.locator('[data-innings-id=second]')).toBeVisible();
  await page.locator('.iui-cricket-boxscore .iui-boxscore-reset').tap();await expect(page.locator('[data-innings-id=first]')).toContainText('16.4');expect(requests).toEqual([]);await context.close();
});
