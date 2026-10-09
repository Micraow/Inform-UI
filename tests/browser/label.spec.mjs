import {test,expect} from '@playwright/test';
// Prepared for the accumulated browser batch. Discovery is not browser execution.
const kinds=['text','number','email','checkbox','date','textarea','slider','toggle','select'];
function documentSpec(arabic=false) {
  const state={},body=[];
  for(const [index,kind] of kinds.entries()) {
    const id=`field-${kind}`,bind=kind,own=arabic?`الحقل الأصلي ${index+1}`:`Original ${kind}`,extra=arabic?`تسمية إضافية ${index+1}`:`Additional ${kind}`;
    state[bind]=['checkbox','toggle'].includes(kind)?false:['number','slider'].includes(kind)?3:kind==='date'?'2026-10-09':kind==='email'?'a@example.test':kind==='select'?'one':'Initial';
    const field=['textarea','toggle','slider','select'].includes(kind)?{type:kind,id,label:own,bind}:{type:'input',kind,id,label:own,bind};
    if(kind==='slider')Object.assign(field,{min:0,max:10,step:1});
    if(kind==='select')field.options=[{label:arabic?'واحد':'One',value:'one'},{label:arabic?'اثنان':'Two',value:'two'}];
    const label={type:'label',id:`extra-${kind}`,text:extra,target:id};
    body.push(...(index%2?[field,label]:[label,field]));
  }
  body.push({type:'label',target:'field-text',text:arabic?'تسمية ثانية طويلة للنص '.repeat(8):'A second long literal label '.repeat(6)});
  return {version:'iui/1',description:arabic?'مثال عربي أصلي لاختبار التسميات واتجاه الكتابة.':'Native field labels',state,body};
}
async function mount(page,s=documentSpec()) {
  await page.goto('/mount.html');await page.waitForFunction(()=>!!window.iui);
  await page.evaluate(spec=>{window.labelsController=window.iui.mount(document.querySelector('#host'),spec);},s);
}
const control=(page,kind)=>page.locator(`[data-bind="${kind}"]`);
const extra=(page,kind)=>page.locator(`[data-iui=label][id$="extra-${kind}"]`);

for(const colorScheme of ['light','dark'])for(const width of [390,768,1100])test(`native label pointer/focus/render ${colorScheme} ${width}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme});await mount(page);
  for(const kind of kinds) {
    const field=control(page,kind),label=extra(page,kind);
    await label.click();await expect(field).toBeFocused();
    expect(await label.evaluate(n=>n.control?.id===n.htmlFor)).toBe(true);
    if(['checkbox','toggle'].includes(kind))await expect(field).toBeChecked();
    await expect(field).toHaveAccessibleName(new RegExp(`Additional ${kind}`));
    expect((await label.boundingBox()).height).toBeGreaterThanOrEqual(44);
    if(kind==='select')await page.keyboard.press('Escape');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/label-${colorScheme}-${width}.png`,fullPage:true});
});

test('native labels are not extra buttons or keyboard tab stops; controls keep native keys',async({page})=>{
  await mount(page);await page.keyboard.press('Tab');await expect(control(page,'text')).toBeFocused();
  expect(await page.locator('[data-iui=label]').evaluateAll(labels=>labels.every(n=>n.tabIndex===-1&&!n.hasAttribute('role')))).toBe(true);
  await page.keyboard.press('Tab');await expect(control(page,'number')).toBeFocused();await page.keyboard.press('Tab');await expect(control(page,'email')).toBeFocused();await page.keyboard.press('Tab');await expect(control(page,'checkbox')).toBeFocused();await page.keyboard.press('Space');await expect(control(page,'checkbox')).toBeChecked();
  await control(page,'slider').focus();await page.keyboard.press('ArrowRight');await expect(control(page,'slider')).toHaveValue('4');
  await control(page,'select').focus();await page.keyboard.press('ArrowDown');await expect(control(page,'select')).toHaveValue('1');
});

test('true touch labels focus native text/date controls and toggle once',async({browser})=>{
  const context=await browser.newContext({baseURL:test.info().project.use.baseURL,hasTouch:true,viewport:{width:390,height:844}}),page=await context.newPage();await mount(page);
  for(const kind of ['text','date','textarea','checkbox','toggle']) {
    await extra(page,kind).tap();await expect(control(page,kind)).toBeFocused();if(['checkbox','toggle'].includes(kind))await expect(control(page,kind)).toBeChecked();
  }
  await extra(page,'checkbox').tap();await expect(control(page,'checkbox')).not.toBeChecked();await context.close();
});

test('Arabic-first RTL and forced colors preserve label wrap, names and focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({forcedColors:'active'});await mount(page,documentSpec(true));
  await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl';});
  await expect(extra(page,'text')).toHaveCSS('direction','rtl');await expect(extra(page,'text')).toHaveText('تسمية إضافية 1');await extra(page,'text').click();await expect(control(page,'text')).toBeFocused();
  await control(page,'checkbox').focus();await page.keyboard.press('Space');await expect(control(page,'checkbox')).toBeChecked();await expect(control(page,'checkbox')).toHaveAccessibleName(/تسمية إضافية 4/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/label-arabic-rtl-forced-colors.png',fullPage:true});
});

test('native click keeps disabled and hidden boundaries; replacement isolates roots and old labels',async({page})=>{
  const spec={version:'iui/1',state:{check:false,locked:true},body:[{type:'label',target:'check',text:'Extra checkbox'},{type:'field',label:'Locked group',disabled:{$:'locked'},children:[{type:'input',id:'check',kind:'checkbox',bind:'check',label:'Original checkbox'}]},{type:'label',target:'hidden',text:'Hidden target'},{type:'details',summary:'Closed details',children:[{type:'input',kind:'text',id:'hidden',label:'Hidden input',bind:'text'}]}]};spec.state.text='Draft';
  await mount(page,spec);const label=page.getByText('Extra checkbox',{exact:true}),check=page.locator('input[type=checkbox]');await label.click();await expect(check).not.toBeChecked();await expect(check).toBeDisabled();
  await page.getByText('Hidden target',{exact:true}).click();await expect(page.locator('details')).not.toHaveAttribute('open','');
  await page.evaluate(()=>window.labelsController.setState({locked:false}));await label.click();await expect(check).toBeChecked();
  await page.evaluate(spec=>{window.oldLabel=document.querySelector('[data-iui=label]');window.labelsController.update(spec);document.querySelector('#host').append(window.oldLabel);},spec);expect(await page.evaluate(()=>window.oldLabel.control)).toBeNull();
  await page.evaluate(spec=>{const host=document.createElement('div');host.id='second';document.body.append(host);window.otherLabelsController=window.iui.mount(host,spec);window.labelsController.setState({locked:false});window.otherLabelsController.setState({locked:false});},spec);
  await page.locator('#host [data-iui=label]').first().click();await expect(page.locator('#host input[type=checkbox]')).toBeChecked();await expect(page.locator('#second input[type=checkbox]')).not.toBeChecked();
  await page.evaluate(()=>window.labelsController.dispose());await page.locator('#second [data-iui=label]').first().click();await expect(page.locator('#second input[type=checkbox]')).toBeChecked();
  await page.evaluate(()=>window.otherLabelsController.dispose());await expect(page.locator('.iui-root')).toHaveCount(0);
});
