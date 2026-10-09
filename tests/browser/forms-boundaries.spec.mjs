// Prepared for the core repository's existing Playwright CI; NOT RUN locally.
// Copy into tests/browser/ after integrating the repairs.
import {test,expect} from '@playwright/test';
async function setup(page, extra={}, initial=6) {
  await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
  await page.evaluate(({extra,initial})=>{
    document.documentElement.lang='en';window.auditCalls=[];
    window.auditController=window.iui.mount(document.getElementById('host'),{
      version:'iui/1',state:{hours:initial,other:0},computed:{cost:{op:'mul',args:[{$:'hours'},80]}},body:[
        {type:'form',label:'Audit budget',action:'save',children:[
          {type:'input',kind:'number',bind:'hours',label:'Hours',min:0,max:20,step:.5,required:true,...extra},
          {type:'metric',label:'Cost',value:{$:'cost'}},
          {type:'button',label:'Reset document',action:{kind:'reset'}}
        ]}
      ]},{actions:{save:({values})=>window.auditCalls.push(values)}});
  },{extra,initial});
  return page.getByRole('spinbutton',{name:'Hours'});
}

test('audit: same-value host write clears numeric draft while unrelated patch preserves it',async({page})=>{
  const field=await setup(page);await field.fill('-1');
  await page.evaluate(()=>window.auditController.setState({other:1}));await expect(field).toHaveValue('-1');
  await page.evaluate(()=>window.auditController.setState({hours:6}));await expect(field).toHaveValue('6');
});
test('audit: document reset clears numeric draft when the accepted value was already initial',async({page})=>{
  const field=await setup(page);await field.fill('-1');await page.getByRole('button',{name:'Reset document'}).click();await expect(field).toHaveValue('6');
});
test('audit: large finite off-step input remains a draft and blocks submission',async({page})=>{
  const field=await setup(page,{max:1e15,step:1},10);await field.fill('100000000000000.25');
  expect(await field.evaluate(el=>el.validity.stepMismatch)).toBe(true);
  expect(await page.evaluate(()=>window.auditController.getState().hours)).toBe(10);
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('form',{name:'Audit budget'})).toHaveAttribute('data-status','invalid');
  expect(await page.evaluate(()=>window.auditCalls)).toEqual([]);
});
test('audit: keyboard half-number is not converted into shared state or an empty optional success',async({page})=>{
  const field=await setup(page,{required:false});await field.fill('');await field.pressSequentially('-');
  expect(await field.evaluate(el=>el.validity.badInput)).toBe(true);
  await page.evaluate(()=>window.auditController.setState({other:1}));
  expect(await field.evaluate(el=>el.validity.badInput)).toBe(true);
  expect(await page.evaluate(()=>window.auditController.getState().hours)).toBe(6);
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('form',{name:'Audit budget'})).toHaveAttribute('data-status','invalid');
  expect(await page.evaluate(()=>window.auditCalls)).toEqual([]);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(field).toHaveValue('6');
});

test('form blur feedback is immediate for keyboard Tab and programmatic focus without an active pointer',async({page})=>{
  let field=await setup(page);
  await field.fill('-1'); await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Reset document'})).toBeFocused();
  await expect(page.locator('.iui-field-error')).toHaveText(/minimum/);
  await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Submit',exact:true})).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
  await expect(page.locator('.iui-field-error')).toHaveText(/minimum/);
  field=await setup(page); await field.fill('-1');
  await page.getByRole('button',{name:'Submit',exact:true}).focus();
  await expect(page.locator('.iui-field-error')).toHaveText(/minimum/);
});

test('Enter submission and the first pointer click on Cancel keep form actions usable',async({page})=>{
  let field=await setup(page); await field.fill('-1'); await field.press('Enter');
  await expect(page.getByRole('form',{name:'Audit budget'})).toHaveAttribute('data-status','invalid');
  await expect(field).toBeFocused(); expect(await page.evaluate(()=>window.auditCalls)).toEqual([]);
  field=await setup(page); await field.fill('-1');
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(field).toHaveValue('6');
  await expect(page.getByRole('form',{name:'Audit budget'})).toHaveAttribute('data-status','cancelled');
  await expect(page.locator('.iui-field-error')).toBeHidden();
});

test('dragging out or cancelling an action-button pointer gesture never leaves blur validation pending',async({page})=>{
  for(const cancel of [false,true]){
    const field=await setup(page); await field.fill('-1');
    const submit=page.getByRole('button',{name:'Submit',exact:true}), box=await submit.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();
    await expect(page.locator('.iui-field-error')).toBeHidden();
    if(cancel){await submit.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',button:0});await expect(page.locator('.iui-field-error')).toHaveText(/minimum/);}
    await page.mouse.move(2,2); await page.mouse.up();
    await expect(page.locator('.iui-field-error')).toHaveText(/minimum/);
    expect(await page.evaluate(()=>window.auditCalls)).toEqual([]);
  }
});
