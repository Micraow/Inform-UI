import { test, expect } from '@playwright/test';

// Drop into Inform-UI/tests/browser AFTER core/schema integration. Uses the normal
// /mount.html fixture and actual built bundle; no mock platform geometry in this suite.
const specimen = {
  version: 'iui/1', theme: 'light', state: { note: 'Draft', count: 0, unrelated: 0 }, body: [
    { type: 'tooltip', id: 'help', label: 'About this example', value: '<img src="https://example.invalid/private" onerror="bad()"> is inert example text.' },
    { type: 'popover', id: 'details', label: 'Open details', title: 'Details', children: [
      { type: 'text', value: 'Original, local demonstration.' },
      { type: 'input', kind: 'text', label: 'Draft title', bind: 'note' },
      { type: 'text', id: 'count', value: { $: 'count' } },
      { type: 'button', label: 'Set count', action: { kind: 'set', bind: 'count', value: 1 } },
      { type: 'popover', label: 'Inner details', title: 'Inner dialog', children: [
        { type: 'text', value: 'The nested branch closes first.' },
        { type: 'tooltip', label: 'Inner help', value: 'An inert nested description.' }
      ] }
    ] },
    { type: 'popover', id: 'sibling', label: 'Other details', children: [{type:'text',value:'A separate branch.'}] }
  ]
};
async function mount(page, { theme = 'light', lang = 'en', fallback = false, body = specimen.body } = {}) {
  await page.goto('/mount.html'); await page.waitForFunction(() => window.iui);
  await page.evaluate(({ specimen, theme, lang, fallback, body }) => {
    if (fallback) for (const key of ['showPopover','hidePopover']) Object.defineProperty(HTMLElement.prototype,key,{value:undefined,configurable:true});
    document.documentElement.lang = 'en'; document.body.style.margin = '0';
    const host = document.getElementById('host'); host.lang = lang;
    window.overlaySpec = { ...specimen, theme, body };
    window.overlayController = window.iui.mount(host, window.overlaySpec);
    const outside = document.createElement('button'); outside.id = 'outside'; outside.textContent = 'Outside control'; document.body.append(outside);
  }, { specimen, theme, lang, fallback, body });
}
const trigger = page => page.getByRole('button',{name:'Open details',exact:true});
const panel = page => page.getByRole('dialog',{name:'Details',exact:true});
const visibleSurfaces = page => page.locator('.iui-overlay-surface:not([hidden])');
async function bounded(locator, width, height) {
  const r = await locator.boundingBox(); expect(r).not.toBeNull();
  expect(r.x).toBeGreaterThanOrEqual(7); expect(r.y).toBeGreaterThanOrEqual(7);
  expect(r.x+r.width).toBeLessThanOrEqual(width-7); expect(r.y+r.height).toBeLessThanOrEqual(height-7);
}
test.beforeEach(async({page})=>{page.__overlayErrors=[];page.on('pageerror',e=>page.__overlayErrors.push(e.message));});
test.afterEach(async({page})=>{expect(page.__overlayErrors).toEqual([]);});

for (const theme of ['light','dark']) for (const width of [390,768,1100]) for (const lang of ['en','zh-CN']) {
  test(`overlays: ${theme} ${width}px ${lang} native keyboard, state, theme, inert text`, async({page},testInfo)=>{
    await page.setViewportSize({width,height:850});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    const requests=[];page.on('request',r=>{if(!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//.test(r.url()))requests.push(r.url());});
    await mount(page,{theme,lang});
    const help=page.getByRole('button',{name:'About this example'});await help.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();await expect(help).toHaveAccessibleDescription(/is inert example text/);
    await expect(page.locator('img')).toHaveCount(0);await bounded(page.getByRole('tooltip'),width,850);
    await page.keyboard.press('Escape');await expect(help).toBeFocused();await expect(page.getByRole('tooltip')).toBeHidden();
    await trigger(page).focus();await page.keyboard.press('Enter');await expect(panel(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute('aria-expanded','true');await expect(panel(page)).not.toHaveAttribute('aria-modal','true');
    const close=panel(page).getByRole('button',{name:lang==='en'?'Close':'关闭',exact:true}).first();await expect(close).toBeFocused();
    expect(await panel(page).evaluate(el=>el.matches(':popover-open'))).toBe(true);
    expect(await panel(page).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(theme==='dark'?'rgb(33, 33, 33)':'rgb(255, 255, 255)');
    const input=panel(page).getByRole('textbox',{name:'Draft title'});await input.fill('Edited draft');await input.evaluate(el=>el.setSelectionRange(1,5));
    await page.evaluate(()=>window.overlayController.setState({count:7,unrelated:42}));await expect(input).toBeFocused();await expect(input).toHaveValue('Edited draft');
    expect(await input.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([1,5]);await expect(panel(page).locator('[id$="count"]')).toHaveText('7');
    await bounded(panel(page),width,850);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await panel(page).evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
    await page.screenshot({path:testInfo.outputPath(`overlays-${theme}-${width}-${lang}.png`),fullPage:true});
    await page.keyboard.press('Escape');await expect(panel(page)).toBeHidden();await expect(trigger(page)).toBeFocused();
    await page.keyboard.press('Space');await expect(panel(page)).toBeVisible();await close.click();await expect(trigger(page)).toBeFocused();
    const focusedBefore=await page.evaluate(()=>document.activeElement.id);
    await page.locator('.iui-popover-body input').first().evaluate(el=>el.focus());
    expect(await page.evaluate(()=>document.activeElement.id)).toBe(focusedBefore);expect(requests).toEqual([]);
  });
}

test('overlays: hover gap, leave, blur, and hover-only Escape preserve unrelated focus',async({page})=>{
  await mount(page);const help=page.getByRole('button',{name:'About this example'});
  await page.locator('#outside').focus();await help.hover();await expect(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('tooltip').hover();await page.waitForTimeout(180);await expect(page.getByRole('tooltip')).toBeVisible();
  await page.mouse.move(1,1);await expect(page.getByRole('tooltip')).toBeHidden();
  await help.hover();await page.keyboard.press('Escape');await expect(page.locator('#outside')).toBeFocused();await expect(page.getByRole('tooltip')).toBeHidden();
  await page.mouse.move(1,1);await help.focus();await expect(page.getByRole('tooltip')).toBeVisible();await page.keyboard.press('Tab');await expect(page.getByRole('tooltip')).toBeHidden();
});

test('overlays: nested Escape, ancestor closure, siblings, outside focus and repeated clicks',async({page})=>{
  await mount(page);
  // Give this sibling a genuinely exposed hit target; a native top-layer panel
  // is expected to cover ordinary content placed immediately beneath its anchor.
  await page.getByRole('button',{name:'Other details',exact:true}).evaluate(el=>{el.closest('.iui-overlay').style.cssText='position:fixed;right:16px;top:16px';});
  await trigger(page).click();const innerTrigger=panel(page).getByRole('button',{name:'Inner details',exact:true});
  await innerTrigger.click();const inner=page.getByRole('dialog',{name:'Inner dialog',exact:true});await expect(inner).toBeVisible();
  await page.keyboard.press('Escape');await expect(inner).toBeHidden();await expect(innerTrigger).toBeFocused();await expect(panel(page)).toBeVisible();
  await innerTrigger.click();await panel(page).getByRole('button',{name:'Close',exact:true}).first().click();await expect(visibleSurfaces(page)).toHaveCount(0);await expect(trigger(page)).toBeFocused();
  await trigger(page).click();await expect(inner).toBeHidden();await page.getByRole('button',{name:'Other details',exact:true}).click();await expect(panel(page)).toBeHidden();await expect(visibleSurfaces(page)).toHaveCount(1);
  await page.locator('#outside').click();await expect(visibleSurfaces(page)).toHaveCount(0);await expect(page.locator('#outside')).toBeFocused();
  await trigger(page).evaluate(el=>{for(let i=0;i<50;i++)el.click();});await expect(visibleSurfaces(page)).toHaveCount(0);
  await trigger(page).click();await page.locator('#outside').focus();await expect(visibleSurfaces(page)).toHaveCount(0);
});

test('overlays: a touch tap does not double-toggle when focus occurs before click',async({browser},testInfo)=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:850},baseURL:testInfo.project.use.baseURL});const page=await context.newPage();
  await mount(page);const help=page.getByRole('button',{name:'About this example'});
  await help.tap();await expect(page.getByRole('tooltip')).toBeVisible();await help.tap();await expect(page.getByRole('tooltip')).toBeHidden();await context.close();
});

for(const width of [390,768,1100]) test(`overlays: ${width}px corners, clipping ancestors, long content and scrolled anchor`,async({page})=>{
  await page.setViewportSize({width,height:700});await mount(page,{body:[{type:'popover',label:'Corner',title:'Corner panel',children:[{type:'text',value:'Original long content. '.repeat(150)}]}]});
  await page.evaluate(()=>{const host=document.getElementById('host');host.style.cssText='overflow:hidden;transform:translateZ(0);contain:paint;';});
  const button=page.getByRole('button',{name:'Corner',exact:true}),dialog=page.getByRole('dialog',{name:'Corner panel'});
  for(const corner of ['top-left','top-right','bottom-left','bottom-right']) {
    await button.evaluate((el,corner)=>{el.style.position='fixed';el.style.top=corner.startsWith('top')?'8px':'auto';el.style.bottom=corner.startsWith('bottom')?'8px':'auto';el.style.left=corner.endsWith('left')?'8px':'auto';el.style.right=corner.endsWith('right')?'8px':'auto';},corner);
    // Transform-bearing clipping ancestor establishes a fixed containing block. Size
    // it to the viewport so the native top layer, not accidental page geometry, is tested.
    await page.locator('#host').evaluate(el=>{el.style.width='100vw';el.style.height='100vh';});
    await button.click();await expect(dialog).toBeVisible();await bounded(dialog,width,700);
    expect(await dialog.evaluate(el=>el.matches(':popover-open'))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
  }
  await page.locator('#host').evaluate(el=>el.removeAttribute('style'));await button.evaluate(el=>el.removeAttribute('style'));
  await page.evaluate(()=>{document.body.style.minHeight='2000px';document.getElementById('host').style.marginTop='700px';});
  await button.scrollIntoViewIfNeeded();await button.click();await expect(dialog).toBeVisible();await bounded(dialog,width,700);
  await page.evaluate(()=>scrollTo(0,1600));await expect(dialog).toBeHidden();await expect(page.locator(':popover-open')).toHaveCount(0);
});

test('overlays: updates, disposal, canceled showing and hidden ancestor leave no top-layer residue',async({page})=>{
  await mount(page);await trigger(page).click();await page.evaluate(()=>{window.oldOverlayTrigger=document.querySelector('.iui-overlay-popover > button');window.overlayController.update(window.overlaySpec);window.oldOverlayTrigger.click();});
  await expect(visibleSurfaces(page)).toHaveCount(0);await expect(page.locator(':popover-open')).toHaveCount(0);
  await trigger(page).click();await page.locator('#host').evaluate(el=>el.hidden=true);await expect(page.locator(':popover-open')).toHaveCount(0);
  await page.locator('#host').evaluate(el=>el.hidden=false);await trigger(page).click();await page.evaluate(()=>window.overlayController.dispose());await expect(page.locator(':popover-open')).toHaveCount(0);
  await expect(page.locator('#host')).toBeEmpty();
});

test('overlays: unsupported native top layer is bounded inline disclosure, keeping focus and dismissal',async({page})=>{
  await mount(page,{fallback:true});await trigger(page).click();await expect(panel(page)).toHaveAttribute('data-positioning','inline');
  expect(await panel(page).evaluate(el=>getComputedStyle(el).position)).toBe('static');await expect(panel(page).getByRole('button',{name:'Close',exact:true}).first()).toBeFocused();
  await page.keyboard.press('Escape');await expect(panel(page)).toBeHidden();await expect(trigger(page)).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('overlays: nested English/light and Chinese/dark hosts retain local labels, tokens and unique IDs',async({page})=>{
  await mount(page);await page.evaluate(({specimen})=>{const inner=document.createElement('div');inner.lang='zh-CN';inner.id='nested-host';document.querySelector('.iui-root').append(inner);window.innerOverlayController=window.iui.mount(inner,{...specimen,theme:'dark',body:[{type:'popover',label:'内层按钮',title:'内层说明',children:[{type:'text',value:'宿主颜色与语言'}]}]});},{specimen});
  await page.getByRole('button',{name:'内层按钮'}).click();const inner=page.getByRole('dialog',{name:'内层说明'});await expect(inner.getByRole('button',{name:'关闭'})).toBeFocused();
  expect(await inner.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(33, 33, 33)');
  await trigger(page).click();await expect(inner).toBeHidden();await expect(panel(page).getByRole('button',{name:'Close',exact:true}).first()).toBeFocused();
  expect(await panel(page).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.length===new Set(ids).size;})).toBe(true);
  await page.evaluate(()=>{window.innerOverlayController.dispose();window.overlayController.dispose();});await expect(page.locator(':popover-open')).toHaveCount(0);
});
