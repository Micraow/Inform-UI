import {test,expect} from '@playwright/test';
// Prepared only. Real-browser execution and screenshot review remain acceptance gates.
const card={type:'onboarding-selection',label:'Choose topics',mode:'multiple',minimum:1,maximum:2,options:[{id:'a',label:'Alpha',description:'First topic'},{id:'b',label:'Beta'},{id:'c',label:'Gamma'}]};
async function setup(page,node=card,theme='light'){
 await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.evaluate(({node,theme})=>{window.choices=[];const host=document.getElementById('host');host.addEventListener('iui:onboarding-choice',e=>{window.choices.push(e.detail);if(window.cancelChoice)e.preventDefault();});window.controller=window.iui.mount(host,{version:'iui/1',theme,state:{other:0},body:[node]});},{node,theme});return requests;
}
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`onboarding ${theme} ${width} local keyboard/pointer/cancel/repeat`,async({page,context})=>{
 await page.setViewportSize({width,height:1000});const requests=await setup(page,card,theme);await context.setOffline(true);
 const root=page.locator('.iui-onboarding'),boxes=root.getByRole('checkbox'),proceed=root.locator('.iui-onboarding-continue');
 await proceed.click();await expect(boxes.first()).toBeFocused();await expect(root).toHaveAttribute('data-status','invalid');
 await page.keyboard.press('Space');await root.getByText('Beta',{exact:true}).click();await boxes.nth(2).focus();await page.keyboard.press('Space');await expect(boxes.nth(2)).not.toBeChecked();await expect(boxes.nth(2)).toBeFocused();
 await page.evaluate(()=>window.cancelChoice=true);await proceed.click();await expect(root).toHaveAttribute('data-status','not-accepted');await expect(boxes.first()).toBeChecked();
 await page.evaluate(()=>{window.cancelChoice=false;window.controller.setState({other:1});});await proceed.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(root).toHaveAttribute('data-status','ready');expect(await page.evaluate(()=>window.choices)).toHaveLength(3);
 await page.screenshot({path:`test-results/onboarding-selected-${theme}-${width}.png`,fullPage:true});
 await root.locator('.iui-onboarding-reset').click();await expect(boxes.first()).not.toBeChecked();await expect(root).toHaveAttribute('data-status','idle');expect(requests).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/onboarding-${theme}-${width}.png`,fullPage:true});
});
test('onboarding single radio keyboard, RTL and forced colors',async({page})=>{
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await setup(page,{...card,mode:'single',maximum:1,label:'اختيار المواضيع',initial:['a']});const radios=page.getByRole('radio');await radios.first().focus();await page.keyboard.press('ArrowDown');await expect(radios.nth(1)).toBeChecked();await expect(radios.nth(1)).toBeFocused();await expect(page.locator('.iui-onboarding')).toHaveCSS('direction','rtl');
 await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);form.reset();});await expect(radios.nth(1)).toBeChecked();expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);
});
test('onboarding actual touch selection and stale controls after disposal',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:900}}),page=await context.newPage();const requests=await setup(page);await page.getByText('Alpha',{exact:true}).tap();await expect(page.getByRole('checkbox').first()).toBeChecked();await page.locator('.iui-onboarding-continue').tap();await expect(page.locator('.iui-onboarding')).toHaveAttribute('data-status','ready');
 await page.evaluate(()=>{const root=document.querySelector('.iui-onboarding'),before=root.outerHTML;window.controller.dispose();root.querySelector('button').click();if(root.outerHTML!==before)throw Error('Retired component changed');});await expect(page.locator('#host')).toBeEmpty();expect(requests).toEqual([]);await context.close();
});
