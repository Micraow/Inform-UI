// Portable batch spec. Copy to repository tests/browser after integration.
// Uses only public mount/compile APIs; real Chromium execution belongs to integrator.
import { test, expect } from '@playwright/test';
import { compileHtml } from '../../dist/index.js';
import { readFile } from 'node:fs/promises';
const icons=['info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'];
const statuses=['idle','busy','success','warning','error'];
const doc=body=>({version:'iui/1',title:'Original local primitive fixture',theme:'auto',state:{draft:'Original',tick:0},body});
const specimen=()=>doc([
  {type:'title',value:'Original finite primitive fixture'},
  {type:'flow',id:'icons',align:'start',children:icons.map((name,i)=>({type:'icon',name,label:`Symbol ${name}`,size:['sm','md','lg'][i%3],tone:['default','muted','info','success','warning','danger'][i%6]}))},
  {type:'flow',id:'statuses',gap:'lg',align:'start',children:statuses.map(status=>({type:'pulse-indicator',label:`Supplied ${status}`,status}))},
  {type:'flow',id:'mixed',align:'start',children:[
    {type:'icon',name:'info'},
    {type:'form',label:'Local form',children:[{type:'input',kind:'text',label:'Draft',bind:'draft'}]},
    {type:'clock',title:'Supplied snapshot',timezone:'UTC',mode:'snapshot',at:'2026-10-09T12:00:00Z'},
    {type:'popover',label:'Show explanation',children:[{type:'text',value:'Original explanation'}]},
    {type:'button',label:'Next',action:{kind:'set',bind:'tick',value:1}},
    {type:'text',value:'Unbroken-'+ 'abcdefghijklmnop'.repeat(45)},
    {type:'code',value:'const '+ 'LONG_IDENTIFIER_'.repeat(25)+' = 1;'},
    {type:'pulse-indicator',label:'Long supplied label '+ '字'.repeat(170),status:'warning'}
  ]}
]);
async function setup(page,input=specimen(),language='en') {
  await page.goto('/mount.html');await page.waitForFunction(()=>Boolean(window.iui));
  await page.evaluate(({input,language})=>{const host=document.getElementById('host');host.lang=language;window.primitiveSpec=input;window.primitiveController=window.iui.mount(host,input);},{input,language});
}
const byId=(page,id)=>page.locator(`[data-iui][id$="-${id}"]`);
test.beforeEach(async({page})=>{page.__primitiveErrors=[];page.on('pageerror',error=>page.__primitiveErrors.push(error.message));});
test.afterEach(async({page})=>{expect(page.__primitiveErrors).toEqual([]);});
for(const colorScheme of ['light','dark'])for(const width of [390,768,1100]) {
  test(`primitives ${colorScheme} ${width}px preserve readable layout and finite icon semantics`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme});
    const outside=[];page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1:4173/'))outside.push(r.url());});
    await setup(page);
    const iconRow=byId(page,'icons');
    for(const [i,name]of icons.entries()) {
      const icon=iconRow.getByRole('img',{name:`Symbol ${name}`,exact:true});await expect(icon).toBeVisible();await expect(icon).toHaveAttribute('focusable','false');
      const box=await icon.boundingBox();expect(box.width).toBe([16,20,24][i%3]);expect(box.height).toBe([16,20,24][i%3]);
    }
    const decorative=byId(page,'mixed').locator(':scope > .iui-icon');await expect(decorative).toHaveAttribute('aria-hidden','true');expect(await decorative.getAttribute('role')).toBeNull();
    for(const status of statuses)await expect(byId(page,'statuses').locator(`[data-status="${status}"] .iui-pulse-status`)).toHaveText(status[0].toUpperCase()+status.slice(1));
    const digits=byId(page,'mixed').locator('.iui-time-digits');await expect(digits).toBeVisible();
    expect(await digits.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const layout=await byId(page,'mixed').evaluate(el=>({types:[...el.children].map(n=>n.dataset.iui),direction:getComputedStyle(el).flexDirection,wrap:getComputedStyle(el).flexWrap,items:[...el.children].map(n=>{const r=n.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right};}),overflow:document.documentElement.scrollWidth>innerWidth,rootTheme:getComputedStyle(el.closest('.iui-root')).getPropertyValue('--iui-ink')}));
    expect(layout.types).toEqual(['icon','form','clock','popover','button','text','code','pulse-indicator']);expect(layout.wrap).toBe('wrap');expect(layout.direction).toBe('row');expect(layout.overflow).toBe(false);
    for(let i=1;i<layout.items.length;i++){const prev=layout.items[i-1],item=layout.items[i];expect(item.top).toBeGreaterThanOrEqual(prev.top-1);if(Math.abs(item.top-prev.top)<1)expect(item.left).toBeGreaterThanOrEqual(prev.left);expect(item.right).toBeLessThanOrEqual(width+1);}
    expect(layout.rootTheme.trim()).not.toBe('');expect(outside).toEqual([]);
    await page.screenshot({path:`test-results/primitives-${colorScheme}-${width}.png`,fullPage:true});
  });
}
test('primitives keyboard order, child focus and draft selection survive unrelated updates',async({page})=>{
  await setup(page);
  const input=page.getByRole('textbox',{name:'Draft',exact:true});await input.focus();await input.fill('Edited locally');
  await input.evaluate(el=>{window.savedPrimitiveInput=el;el.setSelectionRange(2,6);});
  await page.evaluate(()=>window.primitiveController.setState({tick:7}));await expect(input).toBeFocused();await expect(input).toHaveValue('Edited locally');
  expect(await input.evaluate(el=>({same:el===window.savedPrimitiveInput,start:el.selectionStart,end:el.selectionEnd}))).toEqual({same:true,start:2,end:6});
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Submit',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');const trigger=page.getByRole('button',{name:'Show explanation',exact:true});await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Next',exact:true})).toBeFocused();
  await page.evaluate(()=>window.primitiveController.dispose());await expect(page.locator('#host')).toBeEmpty();
});
test('busy-only animation honors animate:false and reduced motion while preserving explicit text',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await setup(page,doc([...statuses.map(status=>({type:'pulse-indicator',label:`Given ${status}`,status})),{type:'pulse-indicator',label:'Static busy',status:'busy',animate:false}]));
  const dots=page.locator('.iui-pulse-dot');const names=await dots.evaluateAll(elements=>elements.map(el=>getComputedStyle(el).animationName));
  expect(names).toEqual(['none','iui-primitive-busy-pulse','none','none','none','none']);
  await page.emulateMedia({reducedMotion:'reduce'});expect(await dots.evaluateAll(elements=>elements.map(el=>getComputedStyle(el).animationName))).toEqual(Array(6).fill('none'));
  await expect(page.locator('.iui-pulse-status')).toHaveText(['Idle','Busy','Success','Warning','Error','Busy']);
  expect(await page.locator('.iui-pulse-indicator [aria-live],.iui-pulse-indicator[role],.iui-pulse-indicator[aria-busy]').count()).toBe(0);
});
test('independent nearest language/theme, RTL order and foreign ownerDocument work without ID references',async({page})=>{
  await setup(page,doc([{type:'pulse-indicator',label:'Local',status:'warning'}]));
  const result=await page.evaluate(()=>{
    const a=document.getElementById('host');const b=document.createElement('div');b.id='primitive-zh';b.lang='zh-Hant';document.body.append(b);
    const rtl=document.createElement('div');rtl.id='primitive-rtl';rtl.lang='ar';document.body.append(rtl);
    const frame=document.createElement('iframe');frame.id='primitive-foreign';frame.title='Foreign document test';document.body.append(frame);const foreign=frame.contentDocument.createElement('div');frame.contentDocument.body.append(foreign);
    const nodes=[{type:'flow',id:'same',children:[{type:'icon',name:'arrow-left',label:'Physical left'},{type:'pulse-indicator',label:'مرحبا',status:'warning'},{type:'icon',name:'arrow-right',label:'Physical right'}]}];
    window.otherPrimitives=[window.iui.mount(b,{version:'iui/1',theme:'dark',body:nodes}),window.iui.mount(rtl,{version:'iui/1',theme:'light',body:nodes}),window.iui.mount(foreign,{version:'iui/1',body:nodes})];
    return {english:a.querySelector('.iui-pulse-status').textContent,chinese:b.querySelector('.iui-pulse-status').textContent,foreignOwner:foreign.querySelector('svg').ownerDocument===frame.contentDocument,unique:new Set([...document.querySelectorAll('[data-iui][id]')].map(el=>el.id)).size===document.querySelectorAll('[data-iui][id]').length,rtlDirection:getComputedStyle(rtl.querySelector('.iui-flow')).direction,rtlChildren:[...rtl.querySelector('.iui-flow').children].map(el=>el.dataset.iui)};
  });
  expect(result).toEqual({english:'Warning',chinese:'警告',foreignOwner:true,unique:true,rtlDirection:'rtl',rtlChildren:['icon','pulse-indicator','icon']});
  await expect(page.locator('#primitive-zh .iui-root')).toHaveAttribute('data-theme','dark');await expect(page.locator('#primitive-rtl .iui-root')).toHaveAttribute('data-theme','light');
  await page.evaluate(()=>{window.primitiveController.dispose();window.otherPrimitives.forEach(c=>c.dispose());});
});
test('public updates reject unknown data atomically and remove old primitive nodes on disposal',async({page})=>{
  await setup(page);const input=page.getByRole('textbox',{name:'Draft',exact:true});await input.focus();
  const result=await page.evaluate(()=>{
    const old=document.querySelector('.iui-flow'),focus=document.activeElement;
    const invalid=[{type:'icon',name:'unknown'},{type:'pulse-indicator',label:'Given',status:'busy',url:'https://example.invalid/'},{type:'flow',children:[{type:'grid-item',children:[{type:'text',value:'bad parent'}]}]},{type:'flow',children:[{type:'html',value:'<b>bad</b>'}]}];
    const rejected=invalid.map(node=>{try{window.primitiveController.update({version:'iui/1',body:[node]});return false;}catch{return document.querySelector('.iui-flow')===old&&document.activeElement===focus;}});
    window.primitiveController.update({version:'iui/1',body:[{type:'pulse-indicator',label:'Explicit next state',status:'success'}]});
    const updated=document.querySelector('.iui-pulse-indicator').textContent;window.primitiveController.dispose();window.primitiveController.dispose();return{rejected,updated,detached:!old.isConnected,empty:document.getElementById('host').childElementCount===0};
  });
  expect(result).toEqual({rejected:[true,true,true,true],updated:'Explicit next state Success',detached:true,empty:true});
});
test('portable compiled primitive document remains offline and literal malicious labels remain data',async({page})=>{
  const label='</script><img src=x onerror=alert(1)>',html=await compileHtml(doc([{type:'flow',children:[{type:'icon',name:'warning',label},{type:'pulse-indicator',label,status:'error'}]}]),{lang:'zh-CN'});
  const requests=[];page.on('request',r=>requests.push(r.url()));await page.route('**/primitive-portable.html',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('/primitive-portable.html');
  await expect(page.getByRole('img',{name:label,exact:true})).toBeVisible();await expect(page.locator('.iui-pulse-label')).toHaveText(label);await expect(page.locator('.iui-pulse-status')).toHaveText('错误');
  expect(await page.locator('img,svg use,svg image,foreignObject').count()).toBe(0);expect(requests.filter(url=>!url.endsWith('/primitive-portable.html')&&!url.endsWith('/favicon.ico'))).toEqual([]);
});

// Reuse valid project-owned domain data rather than inventing abbreviated models.
// Wrapping retains every original state/computed field; no domain permission is added.
for(const width of [390,768,1100])test(`flow keeps size-contained domain children readable at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const requestOrigins=[];page.on('request',request=>{if(request.url().startsWith('http')&&!request.url().startsWith('http://127.0.0.1:4173/'))requestOrigins.push(request.url());});
  for(const name of ['time','weather','finance','converters']) {
    const original=JSON.parse(await readFile(new URL(`../../examples/${name}.json`,import.meta.url),'utf8'));
    const wrapped={...original,body:[{type:'flow',id:'domain-flow',align:'start',children:original.body}]};
    await setup(page,wrapped,'zh-CN');const flow=byId(page,'domain-flow');await expect(flow).toBeVisible();
    const metrics=await flow.evaluate(el=>{
      const size=el.getBoundingClientRect().width;
      const contained=[...el.querySelectorAll(':scope > :is(.iui-time,.iui-weather,.iui-finance,.iui-converter)')].map(node=>({kind:node.dataset.iui,width:node.getBoundingClientRect().width}));
      const digits=[...el.querySelectorAll('.iui-time-digits,.iui-weather-current-temperature,.iui-finance-price,.iui-converter-result')].filter(node=>node.getClientRects().length).map(node=>{
        const box=node.getBoundingClientRect(),owner=node.closest('.iui-time,.iui-weather,.iui-finance,.iui-converter').getBoundingClientRect();
        const range=node.ownerDocument.createRange();range.selectNodeContents(node);
        const fragments=[...range.getClientRects()].filter(rect=>rect.width&&rect.height).map(rect=>({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}));
        return {className:node.className,width:box.width,client:node.clientWidth,scroll:node.scrollWidth,block:getComputedStyle(node).display!=='inline',owner:{left:owner.left,right:owner.right,top:owner.top,bottom:owner.bottom},fragments};
      });
      return {size,contained,digits,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(metrics.contained.length,`${name}: contained roots`).toBeGreaterThan(0);
    for(const item of metrics.contained){expect(item.width,`${name}/${item.kind}: intrinsic size`).toBeGreaterThanOrEqual(Math.min(320,metrics.size)-1);expect(item.width).toBeLessThanOrEqual(metrics.size+1);}
    expect(metrics.digits.length,`${name}: visible numeric readouts`).toBeGreaterThan(0);
    for(const digit of metrics.digits){
      expect(digit.width,`${name}/${digit.className}: nonzero readout`).toBeGreaterThan(0);expect(digit.fragments.length).toBeGreaterThan(0);
      for(const rect of digit.fragments){expect(rect.left).toBeGreaterThanOrEqual(digit.owner.left-1);expect(rect.right).toBeLessThanOrEqual(digit.owner.right+1);expect(rect.top).toBeGreaterThanOrEqual(digit.owner.top-1);expect(rect.bottom).toBeLessThanOrEqual(digit.owner.bottom+1);}
      if(digit.block&&digit.client>0)expect(digit.scroll,`${name}/${digit.className}: uncut block text`).toBeLessThanOrEqual(digit.client+1);
    }
    expect(metrics.overflow,`${name}: page overflow`).toBe(false);
    await page.evaluate(()=>window.primitiveController.dispose());await expect(page.locator('#host')).toBeEmpty();
  }
  expect(requestOrigins).toEqual([]);
});
