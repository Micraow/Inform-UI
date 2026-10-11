import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const parts=await Promise.all(['basketball-tournament','election-results'].map(async name=>JSON.parse(await readFile(new URL('../../examples/'+name+'.json',import.meta.url)))));
const fixture={version:'iui/1',state:{other:0},body:parts.flatMap(part=>part.body)};
async function setup(page,spec=fixture,lang='en'){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(({spec,lang})=>{const host=document.getElementById('host');host.lang=lang;window.resultsController=window.iui.mount(host,spec);},{spec,lang});return requests;
}
for(const theme of['light','dark'])for(const width of[390,768,1100])test(`supplied results ${theme} ${width}: keyboard, bracket filters and stable election ties`,async({page,context})=>{
  await page.setViewportSize({width,height:1100});const spec=structuredClone(fixture);spec.theme=theme;
  const requests=await setup(page,spec);await context.setOffline(true);
  const tournament=page.locator('.iui-basketball-tournament'),election=page.locator('.iui-election-results');
  const disclosure=tournament.locator('[data-match-id=match-a] details');await disclosure.locator('summary').focus();await page.keyboard.press('Enter');await expect(disclosure).toHaveAttribute('open','');
  await tournament.locator('select').nth(1).selectOption('t0');await expect(tournament.locator('.iui-tournament-match:visible')).toHaveCount(1);
  await tournament.locator('.iui-results-reset').click();await expect(disclosure).toHaveAttribute('open','');
  await expect(tournament.locator('[data-match-id=match-b] .iui-tournament-winner')).toHaveText('Supplied winner: Not supplied');
  await expect(tournament.locator('[data-match-id=final]')).not.toContainText('Team North');
  await election.locator('select').nth(2).selectOption('votes');
  expect(await election.locator('[data-contest-id=coast] tbody tr:visible').evaluateAll(rows=>rows.map(row=>row.dataset.candidateId))).toEqual(['blake','alex','zero','unknown']);
  await expect(election.locator('[data-contest-id=coast] th[aria-sort]')).toHaveText('Supplied votes');
  await expect(election.locator('[data-candidate-id=zero] td').nth(1)).toHaveText('0');
  await expect(election.locator('[data-candidate-id=unknown] td').nth(1)).toHaveText('Not supplied');
  await election.locator('select').first().selectOption('c1');await expect(election.locator('[data-contest-id=ridge]')).toBeVisible();
  await election.locator('.iui-results-reset').click();await expect(election.locator('[data-contest-id=coast]')).toBeVisible();
  await election.locator('input').fill('blake');await expect(election.locator('[data-contest-id=coast] tbody tr:visible')).toHaveCount(1);
  await page.evaluate(()=>window.resultsController.setState({other:2}));await expect(election.locator('input')).toBeFocused();
  expect(requests).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/supplied-results-${theme}-${width}.png`,fullPage:true});
});
test('supplied results native reset respects cancellation, newer edits, moved controls and disposal',async({page})=>{
  await setup(page);await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.before(form);form.append(host);});
  const query=page.locator('.iui-basketball-tournament input');await query.fill('first');
  await page.evaluate(()=>{const form=document.querySelector('form');form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();});await expect(query).toHaveValue('first');
  await page.evaluate(()=>{document.querySelector('form').reset();const query=document.querySelector('.iui-basketball-tournament input');query.value='second';query.dispatchEvent(new Event('input'));});await expect(query).toHaveValue('second');
  await page.evaluate(()=>document.querySelector('form').reset());await expect(query).toHaveValue('');
  await query.fill('draft');await page.evaluate(()=>{const root=document.querySelector('.iui-basketball-tournament');root.append(root.querySelector('select'));document.querySelector('form').reset();});await expect(query).toHaveValue('draft');
  expect(await page.evaluate(()=>[...new FormData(document.querySelector('form'))])).toEqual([]);
  await page.evaluate(()=>{document.querySelector('form').reset();window.retiredResultsRoot=document.querySelector('.iui-basketball-tournament');window.resultsController.dispose();window.retiredResults=window.retiredResultsRoot.outerHTML;});
  expect(await page.evaluate(()=>window.retiredResultsRoot.outerHTML)).toEqual(await page.evaluate(()=>window.retiredResults));await expect(page.locator('#host')).toBeEmpty();
});
test('supplied results Chinese, RTL, touch and forced colors retain source facts',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:1100}}),page=await context.newPage();await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  const spec=structuredClone(fixture);spec.body[0].label='بطولة مقدمة';const requests=await setup(page,spec,'zh-CN');await expect(page.locator('.iui-basketball-tournament')).toHaveCSS('direction','rtl');
  const contest=page.locator('.iui-election-results select').first();await contest.tap();await page.keyboard.press('Escape');await contest.selectOption('c1');await expect(page.locator('[data-contest-id=ridge]')).toBeVisible();
  await page.locator('.iui-election-results .iui-results-reset').tap();await expect(page.locator('[data-contest-id=coast]')).toBeVisible();await expect(page.locator('.iui-election-results')).toContainText('不推断赢家');
  expect(requests).toEqual([]);await context.close();
});
