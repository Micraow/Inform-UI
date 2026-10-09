// Prepared real-browser cases; run only in the integrator's authorized aggregate batch.
import {test,expect} from '@playwright/test';
import {compileHtml} from '../../dist/index.js';
const pie=(extra={})=>({type:'chart',kind:'pie',title:'Known synthetic values',xKey:'category',series:[{key:'amount',label:'Amount'}],data:[{category:'NE',amount:{$:'amount'}},{category:'SE',amount:1},{category:'SW',amount:1},{category:'NW',amount:1},{category:'Zero',amount:0},{category:'Missing',amount:null}],...extra});
const spec=(node=pie())=>({version:'iui/1',title:'Original public pie test',theme:'auto',state:{amount:1,other:0},body:[node]});
async function setup(page,input=spec(),language='en'){
 await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
 await page.evaluate(({input,language})=>{const host=document.getElementById('host');host.lang=language;window.pieController=window.iui.mount(host,input);},{input,language});
}
async function screenPoint(graphic,x,y){return graphic.evaluate((svg,{x,y})=>{const point=svg.createSVGPoint();point.x=x;point.y=y;const p=point.matrixTransform(svg.getScreenCTM());return{x:p.x,y:p.y};},{x,y});}
async function wedgePoint(graphic,dx,dy){const width=await graphic.evaluate(svg=>svg.viewBox.baseVal.width);return screenPoint(graphic,width/2+dx,112+dy);}
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`pie ${colorScheme} ${width}: pointer keyboard data and stable state`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme});const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 const figure=page.locator('.iui-pie'),graphic=figure.locator('svg'),output=figure.locator('output');await expect(graphic.locator('path')).toHaveCount(4);
 for(const [dx,dy,name] of [[30,-30,'NE'],[30,30,'SE'],[-30,30,'SW'],[-30,-30,'NW']]){const p=await wedgePoint(graphic,dx,dy);await page.mouse.move(p.x,p.y);await expect(output).toContainText(name);await expect(graphic).not.toBeFocused();}
 await graphic.focus();await page.keyboard.press('Home');await expect(output).toContainText('NE');await page.keyboard.press('End');await expect(output).toContainText('Missing');await page.keyboard.press('ArrowRight');await expect(output).toContainText('Missing');await page.keyboard.press('ArrowLeft');await expect(output).toContainText('Zero');await expect(figure.locator('.iui-pie-key-active')).toContainText('Zero');await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await expect(output).toContainText('SE');
 await figure.locator('summary').click();await expect(figure.locator('tbody tr')).toHaveCount(6);await graphic.focus();await page.evaluate(()=>window.pieController.setState({amount:3,other:1}));await expect(graphic).toBeFocused();await expect(figure.locator('details')).toHaveAttribute('open','');await expect(output).toContainText('SE');
 const unchanged=await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML;try{window.pieController.setState({amount:-1});return false;}catch{return before===host.innerHTML;}});expect(unchanged).toBe(true);await expect(graphic).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await page.screenshot({path:`test-results/pie-${colorScheme}-${width}.png`,fullPage:true});
});
test('transformed and letterboxed SVG hit testing uses its actual inverse screen matrix, including RTL',async({page})=>{
 await setup(page);const graphic=page.locator('.iui-pie svg'),output=page.locator('.iui-pie output');await graphic.evaluate(svg=>{svg.style.height='360px';svg.style.transform='rotate(11deg) scale(.8)';svg.closest('figure').dir='rtl';});
 for(const [dx,dy,name] of [[30,-30,'NE'],[30,30,'SE'],[-30,30,'SW'],[-30,-30,'NW']]){const p=await wedgePoint(graphic,dx,dy);await page.mouse.click(p.x,p.y);await expect(output).toContainText(name);}
 await graphic.focus();await page.keyboard.press('Home');await expect(output).toContainText('NE');await page.keyboard.press('ArrowRight');await expect(output).toContainText('SE');
});
test('native touch tap selects an angular item without a custom gesture',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:850}});const page=await context.newPage();await setup(page);const graphic=page.locator('.iui-pie svg'),p=await wedgePoint(graphic,30,30);await page.touchscreen.tap(p.x,p.y);await expect(page.locator('.iui-pie output')).toContainText('SE');await context.close();
});
test('forced colors reduced motion long labels and tiny positive shares retain text and focus',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await setup(page,spec(pie({data:[{category:'Long-'+ '字'.repeat(150),amount:5e-324},{category:'Large',amount:1e308},{category:'Missing',amount:null}]})),'zh-CN');const graphic=page.locator('.iui-pie svg');await graphic.focus();await page.keyboard.press('Home');await expect(page.locator('.iui-pie output')).toContainText('<0.1%');await expect(page.locator('.iui-pie output')).toContainText('已知数值');expect(await graphic.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('public compiler executes standalone pie with full circle and no-positive states',async({page})=>{
 const input=spec(pie({data:[{category:'Only',amount:7}]}));input.body.push(pie({title:'No positive values',data:[{category:'Zero',amount:0},{category:'Missing',amount:null}]}));await page.setContent(await compileHtml(input),{waitUntil:'load'});await expect(page.locator('.iui-pie').first().locator('path')).toHaveCount(1);await expect(page.locator('.iui-pie').nth(1).locator('svg')).toBeHidden();await expect(page.locator('.iui-pie').nth(1).locator('.iui-data-status')).toContainText('No positive');await page.locator('.iui-pie').nth(1).locator('summary').click();await expect(page.locator('.iui-pie').nth(1).locator('tbody tr')).toHaveCount(2);
});
