import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/sports.json',import.meta.url)));
const states=JSON.parse(await readFile(new URL('../../examples/sports/states.json',import.meta.url)));
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`sports ${theme} ${width}: keyboard filters, scores, standings and viewport`,async({page})=>{
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});await page.goto('/sports.html');await page.locator('.iui-root').evaluate((e,t)=>e.dataset.theme=t,theme);
  const schedule=page.locator('.iui-sports-schedule'),board=page.locator('.iui-sports-scoreboard'),standings=page.locator('.iui-sports-standings');
  await expect(schedule.locator('[data-game-id]')).toHaveCount(5);await expect(schedule.locator('[data-game-id="live"] time').first()).toContainText('GMT-7');await expect(schedule.locator('[data-game-id="final"] time').first()).toContainText('GMT-8');
  await expect(schedule.locator('[data-game-id="live"] .iui-sports-score')).toHaveText(['0','0']);await expect(schedule.locator('[data-game-id="tomorrow"] [data-missing]')).toHaveCount(2);
  const disclosure=schedule.locator('[data-game-id="final"] summary');await disclosure.focus();await page.keyboard.press('Enter');await expect(schedule.locator('[data-game-id="final"]')).toHaveAttribute('open','');await expect(schedule.locator('[data-game-id="final"] table').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/sports-${theme}-${width}.png`,fullPage:true});
  const team=schedule.locator('[data-sports-filter="team"]');await team.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(team).toBeFocused();await expect(schedule.locator('[data-game-id]')).toHaveCount(2);const selectedTeam=await team.inputValue();expect(selectedTeam).not.toBe('');await page.keyboard.press('Escape');await expect(team).toHaveValue(selectedTeam);await expect(team).toBeFocused();await expect(schedule.locator('[data-game-id]')).toHaveCount(2);
  await schedule.locator('[data-sports-filter="stage"]').selectOption({label:'淘汰赛'});await expect(schedule.locator('.iui-sports-empty')).toBeVisible();await team.selectOption({label:'全部'});await expect(schedule.locator('[data-game-id]')).toHaveCount(1);
  await board.locator('select').selectOption('1');await expect(board.locator('.iui-sports-board')).toHaveAttribute('data-game-id','final');await expect(board.locator('.iui-sports-winner')).toHaveCount(1);await expect(board).toContainText('点球');
  const sort=standings.locator('[data-sort-key="points"]');await sort.focus();await page.keyboard.press('Enter');await expect(sort).toBeFocused();await page.setViewportSize({width:width+1,height:980});await expect(sort).toBeFocused();await page.setViewportSize({width,height:1000});expect(await standings.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.teamId))).toEqual(['a','b','c','d']);await page.keyboard.press('Enter');expect(await standings.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.teamId))).toEqual(['c','a','b','d']);
  await standings.locator('[data-sports-filter="group"]').selectOption({label:'另一组'});await expect(standings.locator('tbody tr')).toHaveCount(1);await expect(standings).toContainText('缺测');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(requests.filter(u=>!u.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
});
test('sports states and update/dispose never leave old interactive views',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
  await page.evaluate(spec=>{document.documentElement.lang='zh-CN';window.sports=window.iui.mount(document.getElementById('host'),spec);window.oldSports=document.querySelector('.iui-sports-schedule');},fixture);
  for(const name of ['loading','error','empty','noMatches','ready']){
    await page.evaluate(spec=>window.sports.update(spec),states[name]);const root=page.locator('.iui-sports');await expect(root).toHaveCount(1);
    if(['loading','error'].includes(name)){await expect(root).toHaveAttribute('data-status',name);await expect(root.locator('.iui-sports-body')).toBeHidden();await expect(root.locator('.iui-sports-status')).toBeVisible();}else if(name!=='ready')await expect(root.locator('.iui-sports-empty')).toBeVisible();
    await expect(root.locator('.iui-sports-source')).toContainText('合成演示');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.evaluate(()=>{const select=window.oldSports.querySelector('[data-sports-filter="team"]');select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));});expect(await page.evaluate(()=>window.oldSports.querySelectorAll('[data-game-id]').length)).toBe(5);
  await page.evaluate(()=>window.sports.dispose());await expect(page.locator('#host')).toBeEmpty();
});
