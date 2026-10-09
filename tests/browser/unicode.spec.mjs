import {test,expect} from '@playwright/test';

test('maximum Unicode code is exact, keyboard-scrollable and bounded in actual Chromium',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));const value='😀'.repeat(12000);
 await page.evaluate(value=>{window.unicodeController=window.iui.mount(document.getElementById('host'),{version:'iui/1',body:[{type:'code',value,highlight:true,language:'js'}]});},value);
 const pre=page.locator('.iui-code-block pre');expect(await pre.locator('code').textContent()).toBe(value);await pre.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>pre.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await expect(pre).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('browser Unicode host updates reject 12001 code points atomically while native field maxlength stays UTF-16',async({page})=>{
 await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
 const result=await page.evaluate(()=>{const host=document.getElementById('host'),input={version:'iui/1',state:{s:'start'},body:[{type:'form',label:'Field',children:[{type:'input',kind:'text',label:'Text',bind:'s',maxLength:4}]},{type:'text',value:{$:'s'}}]},c=window.iui.mount(host,input),field=host.querySelector('input'),root=host.firstElementChild;field.focus();c.setState({s:'😀'.repeat(12000)});field.setSelectionRange(2,6);const html=host.innerHTML;let rejected=false;try{c.setState({s:'😀'.repeat(12001)});}catch{rejected=true;}const atomic=rejected&&c.getState().s==='😀'.repeat(12000)&&host.firstElementChild===root&&html===host.innerHTML&&document.activeElement===field&&field.selectionStart===2&&field.selectionEnd===6;c.setState({s:'😀😀😀'});window.unicodeController=c;return atomic;});expect(result).toBe(true);
 await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.getByRole('textbox',{name:'Text'})).toHaveAttribute('aria-invalid','true');await expect(page.getByRole('form',{name:'Field'})).toHaveAttribute('data-status','invalid');
});
