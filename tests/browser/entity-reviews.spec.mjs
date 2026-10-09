// Prepared browser acceptance coverage. Execution status is reported separately.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const fixture=JSON.parse(await readFile(new URL('../../examples/entity-reviews.json',import.meta.url),'utf8'));
async function setup(page,input=fixture){
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.evaluate(input=>{const host=document.getElementById('host');host.lang='en';window.reviewsController=window.iui.mount(host,{...input,state:{other:0,...input.state}});},input);return requests;
}
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`entity reviews ${colorScheme} ${width}: finite filters, native keyboard, retained DOM`,async({page})=>{
  await page.setViewportSize({width,height:950});await page.emulateMedia({colorScheme});const errors=[];page.on('pageerror',error=>errors.push(error.message));const requests=await setup(page);
  const widget=page.locator('.iui-reviews').first(),filter=widget.getByRole('combobox',{name:'Filter by supplied rating'}),sort=widget.getByRole('combobox',{name:'Sort supplied reviews'}),details=widget.locator('[data-review-id=five] details');
  await details.locator('summary').focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');
  await page.evaluate(()=>window.savedReview=document.querySelector('[data-review-id=five]'));
  await filter.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(filter).toHaveValue('rated');await expect(filter).toBeFocused();await page.keyboard.press('Escape');await expect(filter).toHaveValue('rated');await expect(filter).toBeFocused();
  await expect(widget.locator('.iui-reviews-item:not([hidden])')).toHaveCount(3);await expect(widget.locator('.iui-reviews-count')).toHaveText('3 of 4 supplied reviews shown');
  await sort.selectOption('lowest');await expect(widget.locator('.iui-reviews-item').first()).toHaveAttribute('data-review-id','one');await filter.selectOption('1');await filter.selectOption('all');
  await sort.focus();await page.evaluate(()=>window.reviewsController.setState({other:1}));await expect(sort).toBeFocused();await expect(details).toHaveAttribute('open','');expect(await page.evaluate(()=>window.savedReview===document.querySelector('[data-review-id=five]'))).toBe(true);
  await filter.selectOption('4');await expect(widget.locator('.iui-reviews-empty')).toHaveText('No supplied reviews match this filter.');await expect(widget.locator('.iui-reviews-count')).toHaveText('0 of 4 supplied reviews shown');await filter.selectOption('unrated');await expect(widget.locator('.iui-reviews-item:not([hidden])')).toContainText('Rating not supplied');await filter.selectOption('all');
  for(const control of [filter,sort,details.locator('summary'),widget.locator('.iui-reviews-link')])expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:`test-results/entity-reviews-${colorScheme}-${width}.png`,fullPage:true});
});

test('entity reviews genuine first-visible Arabic RTL, full long text and literal Gregorian labels',async({page})=>{
  await page.setViewportSize({width:390,height:900});const input={version:'iui/1',description:'هذه مراجعات خيالية أصلية للاختبار فقط.',body:[{type:'entity-reviews',label:'مراجعات غرفة القراءة الخيالية',description:'اختر درجة التقييم لترتيب السجلات المقدمة.',items:[{id:'arabic',author:'قارئ خيالي '.repeat(12),title:'مراجعة خيالية '.repeat(12),rating:5,date:'0001-01-01',body:'هذا نص تجريبي خيالي كامل لا يتصل بأي خدمة خارجية. '.repeat(60)},{id:'unrated',author:'قارئ خيالي آخر',rating:null,body:'لم يقدم تقييم لهذا السجل الخيالي.'}]}]};await setup(page,input);
  const widget=page.locator('.iui-reviews');await expect(widget).toHaveCSS('direction','rtl');await widget.locator('summary').first().click();await expect(widget.locator('time')).toHaveText('0001-01-01');await expect(widget.locator('time')).toHaveCSS('direction','ltr');await expect(widget.locator('.iui-reviews-body').first()).toHaveText(input.body[0].items[0].body);
  await widget.locator('.iui-reviews-filter').selectOption('unrated');await widget.locator('.iui-reviews-filter').selectOption('all');await expect(widget.locator('details').first()).toHaveAttribute('open','');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/entity-reviews-arabic-390.png',fullPage:true});
});

test('entity reviews forced colors, inherited disabled, enclosing form reset and native disclosure keyboard',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await setup(page,{version:'iui/1',state:{locked:true},body:[{type:'field',label:'Lock',disabled:{$:'locked'},children:[fixture.body[0]]}]});
  await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form');host.replaceWith(form);form.append(host);window.reviewSubmits=0;form.addEventListener('submit',e=>{e.preventDefault();window.reviewSubmits++;});});
  const filter=page.locator('.iui-reviews-filter'),sort=page.locator('.iui-reviews-sort');await expect(filter).toBeDisabled();await expect(sort).toBeDisabled();
  await filter.evaluate(el=>{el.value='1';el.dispatchEvent(new Event('change',{bubbles:true}));});await sort.evaluate(el=>{el.value='lowest';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(filter).toHaveValue('all');await expect(sort).toHaveValue('supplied');
  await page.evaluate(()=>window.reviewsController.setState({locked:false}));await filter.selectOption('rated');await sort.selectOption('lowest');const summary=page.locator('[data-review-id=five] summary');await summary.focus();await page.keyboard.press('Space');await expect(summary.locator('..')).toHaveAttribute('open','');expect(await summary.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.evaluate(()=>document.querySelector('form').reset());await expect(filter).toHaveValue('rated');await expect(sort).toHaveValue('lowest');await expect(summary.locator('..')).toHaveAttribute('open','');expect(await page.evaluate(()=>window.reviewSubmits)).toBe(0);expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')).entries()])).toEqual([]);await page.screenshot({path:'test-results/entity-reviews-forced-colors.png',fullPage:true});
});

test('entity reviews touch disclosure and local selector keep the same review',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173',hasTouch:true,viewport:{width:390,height:900}}),page=await context.newPage();await setup(page);
  const widget=page.locator('.iui-reviews').first(),summary=widget.locator('[data-review-id=five] summary'),filter=widget.locator('.iui-reviews-filter');await summary.tap();await expect(summary.locator('..')).toHaveAttribute('open','');await filter.tap();await page.keyboard.press('Escape');await filter.selectOption('unrated');await filter.selectOption('all');await expect(summary.locator('..')).toHaveAttribute('open','');await summary.tap();await expect(summary.locator('..')).not.toHaveAttribute('open','');await context.close();
});

test('entity reviews focus survives sort; hiding a focused review returns to filter without stealing unrelated focus',async({page})=>{
  await setup(page);const widget=page.locator('.iui-reviews').first(),summary=widget.locator('[data-review-id=five] summary'),filter=widget.locator('.iui-reviews-filter');await summary.focus();
  await widget.locator('.iui-reviews-sort').evaluate(el=>{el.value='lowest';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(summary).toBeFocused();
  await filter.evaluate(el=>{el.value='1';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(filter).toBeFocused();
  await page.evaluate(()=>{const button=document.createElement('button');button.id='outside';button.textContent='Outside';document.body.append(button);button.focus();});await filter.evaluate(el=>{el.value='all';el.dispatchEvent(new Event('change',{bubbles:true}));});await expect(page.locator('#outside')).toBeFocused();
});

test('entity reviews link keyboard activation is intercepted locally and never requests a provider',async({page})=>{
  const requests=await setup(page);await page.evaluate(()=>{window.reviewLinks=[];document.querySelector('.iui-reviews').addEventListener('click',event=>{const a=event.target.closest('a');if(a){event.preventDefault();window.reviewLinks.push({href:a.href,target:a.target,rel:a.rel,referrerPolicy:a.referrerPolicy});}});});
  for(const link of [page.locator('.iui-reviews-source-link'),page.locator('.iui-reviews-link')]){await expect(link).toContainText('Opens in a new tab');await link.focus();await page.keyboard.press('Enter');}
  const links=await page.evaluate(()=>window.reviewLinks);expect(links).toHaveLength(2);for(const link of links){expect(link.href).toMatch(/^https:\/\/example.com\/reviews/);expect(link.target).toBe('_blank');expect(link.rel).toBe('noopener noreferrer');expect(link.referrerPolicy).toBe('no-referrer');}expect(requests).toEqual([]);
});

test('entity reviews offline atomic update, ownerDocument independence and detached control cleanup',async({page,context})=>{
  const requests=await setup(page);await context.setOffline(true);const filter=page.locator('.iui-reviews-filter').first();await filter.selectOption('rated');await filter.focus();
  expect(await page.evaluate(()=>{const host=document.getElementById('host'),before=host.innerHTML,active=document.activeElement;try{window.reviewsController.update({version:'iui/1',body:[{type:'entity-reviews',label:'Bad',items:[{id:'a',author:'Fictional',body:'Synthetic',rating:0}]}]});return false;}catch{return host.innerHTML===before&&document.activeElement===active;}})).toBe(true);
  expect(await page.evaluate(input=>{const frame=document.createElement('iframe');document.body.append(frame);const host=frame.contentDocument.createElement('div');frame.contentDocument.body.append(host);const child=window.iui.mount(host,input),foreign=host.querySelector('select'),local=document.querySelector('select');const independent=foreign.ownerDocument===frame.contentDocument&&foreign.id!==local.id;child.dispose();frame.remove();return independent;},fixture)).toBe(true);
  expect(await page.evaluate(()=>{const filter=document.querySelector('.iui-reviews-filter'),list=document.querySelector('.iui-reviews-list'),before=[...list.children].map(el=>el.hidden);window.reviewsController.dispose();filter.value='unrated';filter.dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify(before)===JSON.stringify([...list.children].map(el=>el.hidden))&&document.getElementById('host').childElementCount===0;})).toBe(true);expect(requests.filter(url=>url!=='about:blank')).toEqual([]);
});
