import {test,expect} from '@playwright/test';
import {exerciseCurrentDemo} from './helpers/current-demo.mjs';
for(const theme of ['light','dark'])for(const width of [390,1100]){
  test(`current combined demo ${theme} ${width}: valid budgets, native panels and time controls`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    await page.goto('/current-components.html');
    await exerciseCurrentDemo(page);expect(errors).toEqual([]);
    await page.screenshot({path:`test-results/current-components-${theme}-${width}.png`,fullPage:true});
  });
}
