import {test, expect} from '@playwright/test';
const doc={version:'iui/1',state:{volume:4,mode:'focus',enabled:true,score:3},body:[
 {type:'slider',label:'Reading time',bind:'volume',min:0,max:10,step:1},
 {type:'segmented',label:'Reading mode',bind:'mode',options:[{label:'Focus',value:'focus'},{label:'Explore',value:'explore'}]},
 {type:'toggle',label:'Save locally',bind:'enabled'},
 {type:'rating',label:'Your rating input',bind:'score'},
 {type:'rating-summary',ratingLabel:'4.8',reviewCountLabel:'(120 reviews)'}
]};
async function setup(page,theme='light'){
 await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 await page.evaluate(({doc,theme})=>{document.getElementById('host').lang='en';window.controls=window.iui.mount(document.getElementById('host'),{...doc,theme});},{doc,theme});
}
for(const width of [320,390,768])for(const theme of ['light','dark'])test(`source-informed controls preserve native semantics ${theme} ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:1000});await setup(page,theme);
 const slider=page.getByRole('slider',{name:'Reading time'});await expect(slider).toHaveAttribute('type','range');await expect(slider).toHaveValue('4');await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveValue('5');await slider.press('End');await expect(slider).toHaveValue('10');await slider.press('Home');await expect(slider).toHaveValue('0');await expect(slider).toBeFocused();
 const group=page.getByRole('group',{name:'Reading mode'}),focus=group.getByRole('radio',{name:'Focus'}),explore=group.getByRole('radio',{name:'Explore'});await expect(focus).toBeChecked();await focus.focus();await focus.press('ArrowRight');await expect(explore).toBeChecked();await expect(explore).toBeFocused();await expect(explore).toHaveCSS('opacity','0');expect((await explore.locator('..').boundingBox()).height).toBeGreaterThanOrEqual(44);
 const toggle=page.getByRole('checkbox',{name:'Save locally'});await expect(toggle).toBeChecked();await toggle.focus();await toggle.press('Space');await expect(toggle).not.toBeChecked();await expect(toggle).toBeFocused();
 await expect(page.getByRole('group',{name:'Your rating input'}).getByRole('radio')).toHaveCount(5);await expect(page.locator('.iui-rating-summary input')).toHaveCount(0);await expect(page.locator('.iui-rating-summary-star')).toHaveCount(1);await expect(page.locator('.iui-rating-summary')).toHaveText('4.8 (120 reviews)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`test-results/controls-${theme}-${width}.png`,fullPage:true});
});
test('ghost pill and neutral continuous slider keep source-informed geometry with a larger native hit area',async({page})=>{
 await setup(page);const metrics=await page.evaluate(()=>{const label=document.querySelector('.iui-segmented .iui-choice'),range=document.querySelector('.iui-slider input'),pill=getComputedStyle(label,'::before');return{pillTop:pill.top,pillBottom:pill.bottom,pillBackground:pill.backgroundColor,labelHeight:label.getBoundingClientRect().height,rangeHitHeight:range.getBoundingClientRect().height,rangeBackground:getComputedStyle(range).backgroundColor,wrapperBackground:getComputedStyle(range.parentElement).backgroundColor};});
 expect(metrics).toEqual({pillTop:'6px',pillBottom:'6px',pillBackground:'rgb(243, 243, 243)',labelHeight:44,rangeHitHeight:44,rangeBackground:'rgba(0, 0, 0, 0)',wrapperBackground:'rgba(0, 0, 0, 0)'});
});
test('forced colors retain selected radio and focused native slider and toggle',async({page})=>{
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await page.setViewportSize({width:320,height:900});await setup(page);
 const radio=page.getByRole('radio',{name:'Focus',exact:true});await radio.focus();await radio.press('ArrowRight');await expect(page.getByRole('radio',{name:'Explore',exact:true})).toBeChecked();
 const slider=page.getByRole('slider',{name:'Reading time'});await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveValue('5');await expect(slider).toBeFocused();
 await expect(page.getByRole('checkbox',{name:'Save locally'})).toBeChecked();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
