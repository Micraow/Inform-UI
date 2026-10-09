// PREPARED, UNEXECUTED: real browser acceptance belongs to the owner's grouped batch.
// Clipboard tests use only local writeText stubs. They never read/write the OS
// clipboard, grant/query permissions, or use a synthetic event as a trusted click.
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {compileHtml} from '../../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../../examples/writing-block.json',import.meta.url),'utf8'));
const original=fixture.body[0].value.replace(/\r\n?/g,'\n');
const root=page=>page.locator('[data-iui=writing-block][id$="-main-draft"]');
const action=(page,name)=>root(page).locator(`[data-writing-action=${name}]`);
async function mount(page,input=fixture,lang='en'){
 await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
 await page.evaluate(({input,lang})=>{const host=document.getElementById('host');host.lang=lang;window.writingInput=input;window.writingController=window.iui.mount(host,input);},{input,lang});
}
async function stub(page){await page.evaluate(()=>{window.writingWrites=[];window.writingPending=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(value){window.writingWrites.push(value);return new Promise((resolve,reject)=>window.writingPending.push({resolve,reject}));}}});});}
async function settle(page,result='resolve',index=0){await page.evaluate(({result,index})=>window.writingPending[index][result](result==='reject'?Error('NotAllowedError'):undefined),{result,index});}
async function pointer(page,button){await button.scrollIntoViewIfNeeded();const r=await button.boundingBox();expect(r).not.toBeNull();const p={x:r.x+r.width/2,y:r.y+r.height/2};expect(await button.evaluate((el,p)=>el.contains(el.ownerDocument.elementFromPoint(p.x,p.y)),p)).toBe(true);await page.mouse.click(p.x,p.y);}
async function repeatPointer(page,button){const r=await button.boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);}
test.beforeEach(async({page})=>{page.__writingErrors=[];page.on('pageerror',e=>page.__writingErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__writingErrors).toEqual([]));
for(const theme of ['light','dark'])for(const width of [390,768,1100])test(`writing ${theme} ${width}: native editing/selection, wrapping and local draft isolation`,async({page},info)=>{
 await page.setViewportSize({width,height:1050});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await mount(page,{...fixture,theme});const textarea=root(page).getByRole('textbox');
 await expect(textarea).toHaveValue(original);await textarea.focus();await page.keyboard.press('End');await page.keyboard.type(' Local edit.');const edited=await textarea.inputValue();expect(edited).not.toBe(original);await expect(root(page)).toHaveAttribute('data-dirty','true');
 await textarea.evaluate(el=>el.setSelectionRange(1,8,'backward'));await page.evaluate(()=>window.writingController.setState({count:2}));await expect(textarea).toBeFocused();expect(await textarea.evaluate(el=>[el.selectionStart,el.selectionEnd,el.selectionDirection])).toEqual([1,8,'backward']);
 await pointer(page,action(page,'select'));await expect(textarea).toBeFocused();expect(await textarea.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([0,edited.length]);await expect(root(page).getByRole('status')).toContainText('Copy it manually');
 await pointer(page,action(page,'revert'));await expect(textarea).toHaveValue(original);await expect(textarea).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await textarea.evaluate(el=>getComputedStyle(el).fontFamily.includes('monospace'))).toBe(false);
 await page.screenshot({path:info.outputPath(`writing-${theme}-${width}.png`),fullPage:true});
});
test('STUB: trusted mouse/Enter/Space, pending duplicate guard and focus retained',async({page})=>{
 await mount(page);await stub(page);const copy=action(page,'copy'),status=root(page).getByRole('status');await pointer(page,copy);await expect(copy).toBeFocused();await expect(copy).toHaveAttribute('aria-disabled','true');await repeatPointer(page,copy);await page.keyboard.press('Enter');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.writingWrites)).toEqual([original]);
 await settle(page);await expect(status).toHaveText('Current draft copied.');await expect(copy).toBeFocused();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.writingWrites.length)).toBe(2);await settle(page,'reject',1);await expect(status).toContainText('Could not copy');await expect(copy).toBeFocused();await page.keyboard.press('Space');expect(await page.evaluate(()=>window.writingWrites.length)).toBe(3);await settle(page,'resolve',2);
});
for(const edit of ['edit','revert'])test(`STUB: ${edit} during write reports earlier version and permits no parallel write`,async({page})=>{
 await mount(page);await stub(page);const textarea=root(page).getByRole('textbox');await textarea.fill('Snapshot 😀');await pointer(page,action(page,'copy'));if(edit==='edit')await textarea.fill('new draft');else await pointer(page,action(page,'revert'));await repeatPointer(page,action(page,'copy'));expect(await page.evaluate(()=>window.writingWrites)).toEqual(['Snapshot 😀']);
 await textarea.focus();await settle(page);await expect(root(page).getByRole('status')).toHaveText('An earlier version was copied. Your current draft has changed.');await expect(textarea).toBeFocused();await expect(textarea).toHaveValue(edit==='edit'?'new draft':original);
});
test('STUB: synthetic Copy is rejected; readonly value is selectable and can be explicitly copied',async({page})=>{
 await mount(page);await stub(page);await action(page,'copy').evaluate(el=>{el.click();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));});expect(await page.evaluate(()=>window.writingWrites)).toEqual([]);
 const readonly=page.locator('[id$="-readonly-draft"]'),textarea=readonly.getByRole('textbox');await expect(textarea).toHaveAttribute('readonly','');await textarea.focus();await page.keyboard.type('blocked');await expect(textarea).toHaveValue(fixture.body[1].value);await pointer(page,readonly.getByRole('button',{name:'Select text'}));expect(await textarea.evaluate(el=>el.selectionEnd-el.selectionStart)).toBe(fixture.body[1].value.length);
 await pointer(page,readonly.getByRole('button',{name:'Copy',exact:true}));expect(await page.evaluate(()=>window.writingWrites)).toEqual([fixture.body[1].value]);await settle(page);
});
for(const mode of ['update','dispose'])for(const finish of ['resolve','reject'])test(`STUB: ${mode} during pending ${finish} ignores obsolete completion`,async({page})=>{
 await mount(page);await stub(page);await pointer(page,action(page,'copy'));await page.evaluate(mode=>{window.oldWriting=document.querySelector('.iui-writing-block');if(mode==='update')window.writingController.update(window.writingInput);else window.writingController.dispose();window.oldWritingHTML=window.oldWriting.outerHTML;},mode);await settle(page,finish);expect(await page.evaluate(()=>!window.oldWriting.isConnected&&window.oldWriting.outerHTML===window.oldWritingHTML)).toBe(true);if(mode==='update')await expect(root(page).getByRole('status')).toHaveText('');
});
test('native UTF-16 maxlength admits 12000 emoji, blocks excess typing; codepoint validation preserves excessive ASCII draft',async({page})=>{
 await mount(page);await stub(page);const textarea=root(page).getByRole('textbox');await textarea.fill('');await textarea.focus();await page.keyboard.insertText('😀'.repeat(12000));await expect(textarea).toHaveValue('😀'.repeat(12000));await page.keyboard.type('a');expect((await textarea.inputValue()).length).toBe(24000);
 // Explicit programmatic overlength injection tests validation, not native user input.
 await textarea.evaluate(el=>{el.value='a'.repeat(12001);el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(textarea).toHaveAttribute('aria-invalid','true');await expect(action(page,'copy')).toHaveAttribute('aria-disabled','true');await repeatPointer(page,action(page,'copy'));expect(await page.evaluate(()=>window.writingWrites)).toEqual([]);expect((await textarea.inputValue()).length).toBe(12001);await pointer(page,action(page,'revert'));await expect(textarea).toHaveAttribute('aria-invalid','false');
});
test('external form reset does not discard local draft; native buttons never submit or reset an unrelated input',async({page})=>{
 await mount(page);await page.evaluate(()=>{const host=document.getElementById('host'),form=document.createElement('form'),other=document.createElement('input');form.id='external-form';other.id='external-input';other.defaultValue='original';host.before(form);form.append(other,host);window.writingSubmits=0;form.addEventListener('submit',e=>{e.preventDefault();window.writingSubmits++;});});const textarea=root(page).getByRole('textbox');await textarea.fill('retained');await page.evaluate(()=>document.getElementById('external-form').reset());await expect(textarea).toHaveValue('retained');await page.locator('#external-input').fill('independent');await pointer(page,action(page,'select'));await pointer(page,action(page,'revert'));await expect(page.locator('#external-input')).toHaveValue('independent');expect(await page.evaluate(()=>window.writingSubmits)).toBe(0);
});
test('Chinese labels, Arabic draft direction, forced colors and visible keyboard focus',async({page})=>{
 await page.setViewportSize({width:390,height:1000});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});const input=structuredClone(fixture);input.body[0].label='مسودة عربية';input.body[0].value='نص عربي\nسطر ثان';await mount(page,input,'zh-CN');await expect(action(page,'select')).toHaveText('选择文本');const textarea=root(page).getByRole('textbox');await textarea.focus();expect(await textarea.evaluate(el=>getComputedStyle(el).direction)).toBe('rtl');await page.keyboard.press('Tab');await expect(action(page,'copy')).toBeFocused();expect(await action(page,'copy').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('STUB: iframe owns clipboard and native controls, parent clipboard remains untouched',async({page})=>{
 await mount(page);await page.evaluate(()=>{window.parentWritingWrites=0;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(){window.parentWritingWrites++;throw Error('wrong owner');}}});const frame=document.createElement('iframe');frame.id='writing-frame';document.body.append(frame);const doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);frame.contentWindow.localWrites=[];Object.defineProperty(frame.contentWindow.navigator,'clipboard',{configurable:true,value:{writeText(value){frame.contentWindow.localWrites.push(value);return Promise.resolve();}}});window.frameWriting=window.iui.mount(host,window.writingInput);});const frame=page.frameLocator('#writing-frame'),copy=frame.locator('[id$="-main-draft"] [data-writing-action=copy]');await copy.click();await expect(frame.locator('[id$="-main-draft"] [role=status]')).toHaveText('Current draft copied.');expect(await page.evaluate(()=>window.parentWritingWrites)).toBe(0);expect(await page.evaluate(()=>document.getElementById('writing-frame').contentWindow.localWrites)).toEqual([original]);
});
test('offline compiler hydration produces same normalized visible text with no network requests',async({page})=>{
 const requests=[],html=await compileHtml(fixture);page.on('request',r=>requests.push(r.url()));await page.context().setOffline(true);await page.setContent(html);await expect(root(page).getByRole('textbox')).toHaveValue(original);await expect(root(page).getByRole('status')).toHaveText('');expect(requests).toEqual([]);
});
test.describe('touch prepared acceptance',()=>{test.use({hasTouch:true,viewport:{width:390,height:1000}});test('STUB: real tap copies once, manual text selection and Revert stay local',async({page})=>{await mount(page);await stub(page);await action(page,'copy').tap();expect(await page.evaluate(()=>window.writingWrites)).toEqual([original]);await settle(page);await action(page,'select').tap();await expect(root(page).getByRole('textbox')).toBeFocused();await expect(root(page).getByRole('status')).toContainText('Copy it manually');await action(page,'revert').tap();await expect(root(page).getByRole('textbox')).toHaveValue(original);});});

test('writing inherits an external disabled fieldset for native pointers and forged controls',async({page})=>{
 await page.goto('/mount.html');await page.waitForFunction(()=>window.iui);
 await page.evaluate(()=>{const host=document.getElementById('host'),fieldset=document.createElement('fieldset');host.before(fieldset);fieldset.append(host);window.writingFieldset=fieldset;window.writingDisabled=window.iui.mount(host,{version:'iui/1',body:[{type:'writing-block',label:'Local test draft',value:'Original'}]});});
 const draft=page.getByRole('textbox',{name:'Local test draft'}),revert=page.locator('[data-writing-action=revert]');await draft.fill('Keep draft');await page.evaluate(()=>window.writingFieldset.disabled=true);await expect(draft).toBeDisabled();await expect(revert).toBeDisabled();
 await revert.scrollIntoViewIfNeeded();const box=await revert.boundingBox();expect(box).not.toBeNull();const x=box.x+box.width/2,y=box.y+box.height/2;expect(await revert.evaluate((n,p)=>n.contains(document.elementFromPoint(p.x,p.y)),{x,y})).toBe(true);await page.mouse.click(x,y);await expect(draft).toHaveValue('Keep draft');
 await page.evaluate(()=>{for(const b of document.querySelectorAll('.iui-writing-block button'))b.dispatchEvent(new MouseEvent('click',{bubbles:true}));const draft=document.querySelector('.iui-writing-draft');draft.value='Forged';draft.dispatchEvent(new Event('input',{bubbles:true}));});await expect(draft).toHaveValue('Keep draft');
 await page.evaluate(()=>window.writingFieldset.disabled=false);await revert.click();await expect(draft).toHaveValue('Original');await expect(draft).toBeFocused();
});
