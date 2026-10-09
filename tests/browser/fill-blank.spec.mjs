import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
// Prepared for the later combined batch only. No local browser execution.
const fixture=JSON.parse(await readFile(new URL('../../examples/fill-blank-practice.json',import.meta.url)));
const fields=root=>root.getByRole('textbox');
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`fill-blank inline practice ${colorScheme} ${width}`,async({page})=>{
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4173/'))external.push(r.url());});
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme,reducedMotion:'reduce'});await page.goto('/fill-blank-practice.html');
 const root=page.locator('.iui-fill-blank'),input=fields(root),status=root.getByRole('status');
 await expect(input).toHaveCount(3);await expect(input.nth(0)).toHaveAccessibleName('1. 练习的数据性质');await expect(input.nth(0)).toHaveAccessibleDescription(/这些例子不是真实用户记录/);await expect(status).toBeEmpty();
 await root.getByRole('button',{name:'检查答案',exact:true}).click();await expect(input.nth(0)).toBeFocused();await expect(root).toHaveAttribute('data-state','incomplete');await expect(status).toContainText('尚未计算');
 await page.keyboard.insertText('  合成  ');await page.keyboard.press('Tab');await expect(input.nth(1)).toBeFocused();await page.keyboard.insertText('wrong');await page.keyboard.press('Tab');await expect(input.nth(2)).toBeFocused();await page.keyboard.insertText('不同');await page.keyboard.press('Enter');
 await expect(root).toHaveAttribute('data-state','checked');await expect(status).toContainText('2 / 3');await expect(input.nth(0)).toHaveValue('  合成  ');
 await input.nth(1).fill('参考');await expect(root).toHaveAttribute('data-state','editing');await expect(status).toContainText('重新检查');await root.getByRole('button',{name:'检查答案',exact:true}).focus();await page.keyboard.press('Space');await expect(status).toContainText('3 / 3');
 await page.getByRole('button',{name:'只更新其他状态'}).click();await expect(input.nth(1)).toHaveValue('参考');await expect(root).toHaveAttribute('data-state','checked');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const rects=await input.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.left,right:r.right,width:r.width,height:r.height};}));for(const r of rects){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(width);expect(r.width).toBeGreaterThan(50);expect(r.height).toBeGreaterThan(30);}
 await page.screenshot({path:`test-results/fill-blank-${colorScheme}-${width}.png`,fullPage:true});
 await root.getByRole('button',{name:'查看参考答案'}).click();await expect(root).toHaveAttribute('data-state','reference');await expect(status).toContainText('不计作答');await expect(root.getByRole('button',{name:'重新开始'})).toBeFocused();await expect(input.nth(0)).toHaveValue('  合成  ');await page.keyboard.press('Enter');await expect(input.nth(0)).toBeFocused();for(let i=0;i<3;i++)await expect(input.nth(i)).toHaveValue('');expect(errors).toEqual([]);expect(external).toEqual([]);
});
test.describe('fill-blank real touch',()=>{
 test.use({hasTouch:true});
 test('tap checks, reveals, retries and keeps controls usable',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.goto('/fill-blank-practice.html');const root=page.locator('.iui-fill-blank');await root.getByRole('button',{name:'检查答案',exact:true}).tap();await expect(fields(root).nth(0)).toBeFocused();await fields(root).nth(0).fill('合成');await root.getByRole('button',{name:'查看参考答案'}).tap();await expect(root).toHaveAttribute('data-state','reference');await expect(fields(root).nth(0)).toHaveValue('合成');await root.getByRole('button',{name:'重新开始'}).tap();await expect(fields(root).nth(0)).toBeFocused();await expect(fields(root).nth(0)).toHaveValue('');
 });
});
test('fill-blank actual Arabic direction, forced colors and long literal wrapping',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({forcedColors:'active'});await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 await page.evaluate(spec=>{spec.title='تمرين محلي';spec.description='هذا مثال أصلي لا يرسل إجاباتك.';spec.body=spec.body.slice(0,1);spec.body[0].title='املأ الفراغات';spec.body[0].description='مثال باللغة العربية.';spec.body[0].parts=['هذه بيانات ',{blank:'synthetic'},' وهذه إجابة ',{blank:'reference'},'، والمقارنة ',{blank:'case'},' '+ 'كلمةطويلة'.repeat(30)];document.documentElement.lang='ar';document.documentElement.dir='rtl';window.fill=window.iui.mount(document.getElementById('host'),spec);},fixture);
 const root=page.locator('.iui-fill-blank');await expect(root).toHaveCSS('direction','rtl');await expect(root.locator('.iui-fill-blank-passage')).toHaveCSS('direction','rtl');await fields(root).nth(0).focus();await page.keyboard.press('Tab');await expect(fields(root).nth(1)).toBeFocused();await expect(fields(root).nth(1)).toHaveCSS('outline-style','solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/fill-blank-rtl-forced-390.png',fullPage:true});
});
test('fill-blank native Unicode limits and host/update lifecycle preserve exact drafts',async({page})=>{
 await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
 await page.evaluate(()=>{document.documentElement.lang='en';window.fillSpec={version:'iui/1',state:{n:1},body:[{type:'fill-blank',title:'Unicode',parts:['Use ',{blank:'u'},'.'],blanks:[{id:'u',label:'Unicode response',answers:['😀'.repeat(200)]}]}]};window.fill=window.iui.mount(document.getElementById('host'),window.fillSpec);});
 const root=page.locator('.iui-fill-blank'),input=fields(root);await input.fill('😀'.repeat(200));await input.press('Enter');await expect(root.getByRole('status')).toContainText('1 / 1');await input.fill('a'.repeat(201));await input.press('Enter');await expect(root).toHaveAttribute('data-state','incomplete');await expect(input).toHaveValue('a'.repeat(201));await input.fill('kept draft');
 await input.evaluate(e=>{e.setSelectionRange(1,4);window.keptInput=e;});await page.evaluate(()=>window.fill.setState({n:2}));expect(await input.evaluate(e=>e===window.keptInput&&e.selectionStart===1&&e.selectionEnd===4)).toBe(true);
 await page.evaluate(()=>{const invalid=structuredClone(window.fillSpec);invalid.body[0].parts=[{blank:'missing'}];try{window.fill.update(invalid);}catch{window.invalidRejected=true;}});expect(await page.evaluate(()=>window.invalidRejected)).toBe(true);await expect(input).toHaveValue('kept draft');await page.evaluate(()=>window.fill.update(window.fillSpec));await expect(input).toHaveValue('');await page.evaluate(()=>window.fill.dispose());await expect(page.locator('#host')).toBeEmpty();
});
