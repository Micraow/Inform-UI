import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const names=['finance-status','prompt-checklist','ledger-records','player-summaries'];
const fixtures=await Promise.all(names.map(name=>readFile(`examples/${name}.json`,'utf8').then(JSON.parse)));
for(const theme of ['light','dark'])for(const width of [390,1100])test(`current124 supplied domain integration ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme});await page.goto('/mount.html');
 await page.evaluate(input=>{window.currentIntents=[];document.querySelector('#host').addEventListener('iui:prompt-checklist',event=>{event.preventDefault();window.currentIntents.push(event.detail);});window.currentController=window.iui.mount(document.querySelector('#host'),input);},{version:'iui/1',theme,body:fixtures.flatMap(f=>f.body)});
 await expect(page.locator('.iui-finance-status-title')).toBeVisible();
 const task=page.locator('.iui-prompt-checklist-task-button').first();await task.click();const choice=page.locator('.iui-prompt-checklist-choice').first();await choice.click();expect(await page.evaluate(()=>window.currentIntents.length)).toBe(1);
 const secondary=page.locator('.iui-prompt-checklist-secondary').first();await secondary.hover();await expect(secondary).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(secondary).toHaveCSS('height','36px');
 const accounts=page.locator('.iui-ledger-accounts');await accounts.locator('.iui-ledger-reveal').click();await expect(accounts.locator('.iui-ledger-balance').first()).toContainText('1234.5000 USD');
 const nba=page.locator('.iui-nba-player');await nba.locator('select').nth(2).selectOption('pointsPerGame');await expect(nba.locator('tbody tr').first()).toHaveAttribute('data-record-id','playoffs');
 const tennis=page.locator('.iui-tennis-player');await tennis.locator('select').nth(2).selectOption('rank');await expect(tennis.locator('tbody tr').first()).toHaveAttribute('data-record-id','grass');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/current124-${theme}-${width}.png`,fullPage:true});
 await page.evaluate(()=>window.currentController.dispose());await expect(page.locator('#host')).toBeEmpty();
});
