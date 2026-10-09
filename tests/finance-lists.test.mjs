import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
import {validateDocument as browserValidate} from '../dist/browser.js';
const fixture = JSON.parse(await readFile(new URL('../examples/finance-lists.json',import.meta.url)));
const input = () => structuredClone(fixture);
const single = (index=0,mutate=()=>{}) => { const value=input(); value.body=[value.body[index]]; mutate(value.body[0]); return value; };
const setup = (spec=input(),lang='en',options={}) => {
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',{url:'https://example.org/'});
  const host=dom.window.document.getElementById('host');host.lang=lang;
  const controller=mount(host,spec,options);return {dom,host,controller,root:host.querySelector('.iui-ledger')};
};
const change = (dom,select,value) => {select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
const visible = root => [...root.querySelectorAll('tbody tr')].filter(row=>!row.closest('[hidden]'));
const group = (root,currency) => root.querySelector(`[data-currency="${currency}"]`);
const flush = async () => {await Promise.resolve();await Promise.resolve();};

test('ledger public Node/browser validate parity, actual mount, exact supplied content and empty states',()=>{
  assert.equal(validateDocument(fixture).ok,true);assert.equal(browserValidate(fixture).ok,true);
  const {host,controller}=setup();assert.equal(host.querySelectorAll('.iui-ledger').length,4);
  assert.match(host.querySelector('.iui-asset-distribution').textContent,/not a complete balance or net worth/);
  assert.match(host.querySelector('.iui-transaction-list').textContent,/no balance, settlement or payment is inferred/);
  assert.equal(host.querySelectorAll('.iui-ledger-empty:not([hidden])').length,2);
  assert.equal(host.querySelectorAll('img,iframe,video,audio,canvas,svg').length,0);
  assert.equal(host.querySelectorAll('input,[name]').length,0);controller.dispose();
});

test('asset groups keep encounter order, exact raw values, own-currency subtotals and unknown counts',()=>{
  const {root,controller}=setup(single());
  assert.deepEqual([...root.querySelectorAll('.iui-ledger-currency-group')].map(x=>x.dataset.currency),['USD','EUR','JPY']);
  assert.equal(group(root,'USD').querySelector('.iui-ledger-subtotal').dataset.rawValue,'5001');
  assert.equal(group(root,'EUR').querySelector('.iui-ledger-subtotal').dataset.rawValue,'0');
  assert.equal(group(root,'JPY').querySelector('.iui-ledger-subtotal').dataset.rawValue,'24000');
  assert.match(group(root,'USD').querySelector('.iui-ledger-group-counts').textContent,/3 supplied accounts; 1 amounts unknown/);
  assert.equal(root.querySelector('[data-account-id="cash"] .iui-ledger-amount').textContent,'1250.25');
  assert.equal(root.querySelector('tr[data-account-id="unknown"] .iui-ledger-amount').dataset.missing,'true');
  assert.equal(root.querySelector('tr[data-account-id="zero"] .iui-ledger-amount').textContent,'0');
  assert.equal(root.querySelector('.iui-ledger-observed').querySelector('time'),null);controller.dispose();
});

test('unknown-only is unavailable, zero-only has undefined shares, and mixed missing never creates a zero share',()=>{
  for(const amounts of [[null,null],[0,-0],[0,null],[1,null]]){
    const {root,controller}=setup(single(0,n=>{n.accounts=amounts.map((amount,i)=>({id:'a'+i,name:'A'+i,amount,currency:'XXX'}));}));
    const subtotal=root.querySelector('.iui-ledger-subtotal');
    if(amounts.every(x=>x===null)){assert.equal(subtotal.dataset.rawValue,undefined);assert.match(subtotal.textContent,/Unavailable: no known amounts/);}
    else assert.equal(subtotal.dataset.rawValue,amounts.includes(1)?'1':'0');
    assert.equal(root.querySelectorAll('.iui-ledger-segment').length,amounts.includes(1)?1:0);
    assert.equal(root.querySelectorAll('[data-missing]').length,amounts.filter(x=>x===null).length);
    if(amounts.some(x=>x===0)&&!amounts.includes(1))assert.match(root.textContent,/shares are undefined/);
    assert.doesNotMatch(root.textContent,/NaN|Infinity|undefined%/);controller.dispose();
  }
});

test('exact decimal display subtotal, exponent/tiny values and all forty maximum values stay finite',()=>{
  for(const [amounts,expected] of [
    [[.1,.2],'0.3'],[[.000001,.000002],'0.000003'],[[1e-12,2e-12],'3e-12'],[[Number.MIN_VALUE,Number.MIN_VALUE],'1e-323'],
    [[1e12,Number.MIN_VALUE],`1000000000000.${'0'.repeat(323)}5`],
    [Array(40).fill(1e12),'40000000000000'],[[.12345678901234568,.2],'0.32345678901234568']
  ]){
    const {root,controller}=setup(single(0,n=>{n.accounts=amounts.map((amount,i)=>({id:'a'+i,name:'Account '+i,amount,currency:'USD'}));}));
    assert.equal(root.querySelector('.iui-ledger-subtotal').dataset.rawValue,expected);
    assert.deepEqual([...root.querySelectorAll('.iui-ledger-amount')].map(x=>x.textContent),amounts.map(String));
    const segments=[...root.querySelectorAll('.iui-ledger-segment')];assert.ok(segments.every(x=>Number.isFinite(Number(x.dataset.share))&&Number(x.dataset.share)>=0&&Number(x.dataset.share)<=100));
    assert.ok(Math.abs(segments.reduce((sum,x)=>sum+Number(x.dataset.share),0)-100)<1e-9);assert.equal(root.querySelector('.iui-ledger-distribution').getAttribute('aria-hidden'),'true');controller.dispose();
  }
});

test('currency filter only appears for multiple currencies, preserves group DOM/details and never recalculates totals',()=>{
  const {root,dom,controller}=setup({...single(),state:{other:0}}),select=root.querySelector('select'),usd=group(root,'USD'),details=usd.querySelector('details');
  details.open=true;const subtotal=usd.querySelector('.iui-ledger-subtotal').textContent;select.focus();change(dom,select,'EUR');
  assert.equal(usd.hidden,true);assert.equal(visible(root).length,2);assert.equal(dom.window.document.activeElement,select);
  controller.setState({other:1});assert.equal(select.value,'EUR');assert.equal(group(root,'USD'),usd);assert.equal(details.open,true);
  change(dom,select,'');assert.equal(usd.hidden,false);assert.equal(usd.querySelector('.iui-ledger-subtotal').textContent,subtotal);assert.deepEqual(controller.getState(),{other:1});
  controller.update(single(0,n=>{n.accounts=n.accounts.filter(a=>a.currency==='USD');}));assert.equal(root.querySelector('select'),select);assert.equal(dom.window.document.querySelector('.iui-ledger select'),null);controller.dispose();
});

test('transactions preserve exact source order, date strings, magnitudes, directions and optional status',()=>{
  const {root,controller}=setup(single(1));
  assert.deepEqual([...root.querySelectorAll('tbody tr')].map(row=>row.dataset.transactionId),['oct-debit','sep-credit','oct-credit','sep-debit']);
  assert.deepEqual([...root.querySelectorAll('time')].map(time=>[time.textContent,time.dateTime]),['2026-10-09','2026-09-30','2026-10-01','2026-09-30'].map(date=>[date,date]));
  assert.deepEqual([...root.querySelectorAll('.iui-ledger-amount')].map(x=>x.textContent),['32.5','100','0','1400']);
  assert.deepEqual([...root.querySelectorAll('.iui-ledger-direction')].map(x=>x.textContent),['Debit','Credit','Credit','Debit']);
  assert.match(root.querySelector('[data-transaction-id="oct-credit"]').textContent,/Status not supplied/);
  assert.equal(root.querySelectorAll('details').length,2);assert.equal(root.querySelector('.iui-ledger-subtotal'),null);controller.dispose();
});

test('direction/month jointly filter, no-match stays explicit and reset boundary retains focus and identities',()=>{
  const {dom,root,controller}=setup({...single(1),state:{other:0}}),direction=root.querySelector('.iui-ledger-direction-filter'),month=root.querySelector('.iui-ledger-month-filter'),reset=root.querySelector('button'),rows=[...root.querySelectorAll('tbody tr')];
  rows[0].querySelector('details').open=true;change(dom,direction,'credit');change(dom,month,'2026-09');assert.deepEqual(visible(root).map(x=>x.dataset.transactionId),['sep-credit']);
  assert.match(root.querySelector('.iui-ledger-counts').textContent,/Showing 1 of 4/);month.focus();controller.setState({other:1});assert.equal(dom.window.document.activeElement,month);
  assert.equal(direction.value,'credit');assert.equal(month.value,'2026-09');assert.equal(rows[0].querySelector('details').open,true);
  reset.focus();for(let i=0;i<4;i++)reset.click();assert.equal(dom.window.document.activeElement,reset);assert.equal(reset.getAttribute('aria-disabled'),'true');assert.equal(visible(root).length,4);
  assert.deepEqual([...root.querySelectorAll('tbody tr')],rows);assert.deepEqual(controller.getState(),{other:1});
  controller.update(single(1,n=>{n.transactions=n.transactions.slice(0,1);}));const fresh=dom.window.document.querySelector('.iui-ledger');change(dom,fresh.querySelector('.iui-ledger-direction-filter'),'credit');assert.equal(visible(fresh).length,0);assert.match(fresh.querySelector('.iui-ledger-empty').textContent,/No supplied transactions match/);assert.equal(fresh.querySelector('.iui-ledger-table-wrap').hidden,true);controller.dispose();
});

test('all transaction limit records render with repeated dates/descriptions/amounts allowed',()=>{
  const spec=single(1,n=>{n.transactions=Array.from({length:100},(_,i)=>({...n.transactions[0],id:'t'+i}));});
  assert.equal(validateDocument(spec).ok,true);const {root,controller}=setup(spec);assert.equal(root.querySelectorAll('tbody tr').length,100);controller.dispose();
});

test('untrusted strings stay literal, safe source navigation is ordinary and labels/ids resolve across sibling mounts',()=>{
  const attack='<img src=x onerror=alert(1)>',spec=input();spec.body[0].label=attack;spec.body[0].accounts[0].name=attack;spec.body[1].transactions[0].note=attack;
  const {dom,host,controller}=setup(spec),other=dom.window.document.createElement('div');dom.window.document.body.append(other);const second=mount(other,spec);
  assert.equal(host.querySelector('img'),null);assert.ok(host.textContent.includes(attack));
  for(const element of dom.window.document.querySelectorAll('[aria-labelledby],[aria-describedby],label[for]')){
    for(const attr of ['aria-labelledby','aria-describedby','for'])for(const id of (element.getAttribute(attr)??'').split(/\s+/).filter(Boolean))assert.ok(dom.window.document.getElementById(id),id);
  }
  const ids=[...dom.window.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
  const link=host.querySelector('a');assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');assert.match(link.textContent,/Opens in a new tab/);
  let blocked;link.addEventListener('click',event=>{blocked=event.defaultPrevented;event.preventDefault();});link.click();assert.equal(blocked,false);controller.dispose();second.dispose();
});

test('Chinese localization covers disclosures, missing/zero, filters, directions and supplied status',()=>{
  const {host,controller}=setup(input(),'zh-CN');for(const text of ['已知金额小计','未提供金额','不进行汇率换算','财务对账','无法定义分布占比','按方向筛选','收入','支出','未提供状态','重置筛选','在新标签页中打开'])assert.ok(host.textContent.includes(text),text);controller.dispose();
});

test('forged disabled, hidden, invalid and detached select changes are inert with native values restored',()=>{
  const spec={version:'iui/1',state:{locked:true},body:[{type:'field',label:'Locked',disabled:{$:'locked'},children:input().body.slice(0,2)}]};
  const {host,dom,controller}=setup(spec),selects=[...host.querySelectorAll('select')];
  for(const select of selects){change(dom,select,select.options[1].value);assert.equal(select.value,'');assert.equal(select.matches(':disabled'),true);}
  controller.setState({locked:false});const transaction=host.querySelector('.iui-transaction-list'),direction=transaction.querySelector('select');change(dom,direction,'credit');
  controller.setState({locked:true});transaction.querySelector('button').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(direction.value,'credit');
  controller.setState({locked:false});transaction.hidden=true;change(dom,direction,'debit');assert.equal(direction.value,'credit');transaction.hidden=false;
  change(dom,direction,'not-supplied');assert.equal(direction.value,'credit');transaction.remove();change(dom,direction,'debit');assert.equal(direction.value,'credit');controller.dispose();
});

test('native outer-form reset returns All and matching visibility without form payload or submission',async()=>{
  const {host,root,dom,controller}=setup(),form=dom.window.document.createElement('form');host.replaceWith(form);form.append(host);let submits=0;form.addEventListener('submit',event=>{submits++;event.preventDefault();});
  const select=root.querySelector('select'),transaction=host.querySelector('.iui-transaction-list'),direction=transaction.querySelector('select'),month=transaction.querySelector('.iui-ledger-month-filter');
  change(dom,select,'EUR');change(dom,direction,'credit');change(dom,month,'2026-09');transaction.querySelector('details').open=true;
  form.reset();await flush();assert.equal(select.value,'');assert.equal(direction.value,'');assert.equal(month.value,'');assert.equal(visible(root).length,6);assert.equal(visible(transaction).length,4);assert.equal(transaction.querySelector('details').open,true);
  assert.deepEqual([...new dom.window.FormData(form).entries()],[]);transaction.querySelector('button').click();assert.equal(submits,0);controller.dispose();
});

test('cancelled or disabled external reset preserves filters, unrelated forms do nothing and disposed queued reset cannot repaint',async()=>{
  const {host,root,dom,controller}=setup({...single(1),state:{other:0}}),form=dom.window.document.createElement('form'),fieldset=dom.window.document.createElement('fieldset');host.replaceWith(form);form.append(fieldset);fieldset.append(host);
  const direction=root.querySelector('select');change(dom,direction,'credit');form.addEventListener('reset',event=>event.preventDefault(),{once:true});form.reset();await flush();assert.equal(direction.value,'credit');assert.equal(visible(root).length,2);
  fieldset.disabled=true;form.reset();await flush();assert.equal(direction.value,'credit');assert.equal(visible(root).length,2);fieldset.disabled=false;
  const unrelated=dom.window.document.createElement('form');dom.window.document.body.append(unrelated);unrelated.reset();await flush();assert.equal(direction.value,'credit');
  form.reset();controller.dispose();const retired=root.outerHTML;await flush();assert.equal(root.outerHTML,retired);assert.equal(host.childElementCount,0);
});

test('pending authored Forms disable local filters/reset, exclude all ledger fields from snapshot and preserve reading',async()=>{
  let resolve,received;
  const spec={version:'iui/1',state:{other:'Only bound field'},body:[{type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Other',bind:'other'},...input().body.slice(0,2)]}]};
  const {dom,host,controller}=setup(spec,'en',{actions:{save:({values})=>{received=values;return new Promise(done=>{resolve=done;});}}}),form=host.querySelector('form'),root=host.querySelector('.iui-transaction-list'),direction=root.querySelector('select');
  change(dom,direction,'credit');form.querySelector('button[type=submit]').click();assert.equal(form.getAttribute('aria-busy'),'true');assert.deepEqual(received,{other:'Only bound field'});
  change(dom,direction,'debit');root.querySelector('button').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(direction.value,'credit');assert.equal(direction.matches(':disabled'),true);
  // jsdom 26 treats anchor.click() inside a disabled fieldset as disabled; real pointer coverage is prepared separately.
  const link=host.querySelector('a');let blocked;link.addEventListener('click',event=>{blocked=event.defaultPrevented;event.preventDefault();});link.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));assert.equal(blocked,false);
  root.querySelector('details').open=true;assert.equal(root.querySelector('details').open,true);resolve();await flush();assert.equal(form.getAttribute('aria-busy'),'false');assert.equal(direction.value,'credit');controller.dispose();
});

test('invalid updates are atomic, valid updates reset filters, old listeners retire and sibling state is independent',()=>{
  const {dom,host,root,controller}=setup(single(1)),direction=root.querySelector('select'),other=dom.window.document.createElement('div');dom.window.document.body.append(other);const sibling=mount(other,single(1));
  change(dom,direction,'credit');assert.equal(other.querySelector('select').value,'');const invalid=single(1,n=>{n.transactions[0].amount=-1;});assert.throws(()=>controller.update(invalid));assert.equal(host.querySelector('.iui-ledger'),root);assert.equal(direction.value,'credit');
  controller.update(single(1));assert.equal(host.querySelector('select').value,'');const before=root.outerHTML;root.querySelector('button').click();direction.dispatchEvent(new dom.window.Event('change'));assert.equal(root.outerHTML,before);
  const current=host.querySelector('.iui-ledger'),button=current.querySelector('button');controller.dispose();const retired=current.outerHTML;button.click();assert.equal(current.outerHTML,retired);assert.equal(host.childElementCount,0);assert.ok(other.querySelector('.iui-ledger'));sibling.dispose();
});

test('reset listeners are balanced across repeated update/dispose, local filter loops do not add listeners',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="host"></div>'),doc=dom.window.document,host=doc.getElementById('host');
  let added=0,removed=0;const add=doc.addEventListener.bind(doc),remove=doc.removeEventListener.bind(doc);doc.addEventListener=(name,...args)=>{if(name==='reset')added++;return add(name,...args);};doc.removeEventListener=(name,...args)=>{if(name==='reset')removed++;return remove(name,...args);};
  const controller=mount(host,input());assert.equal(added,4);
  for(let i=0;i<30;i++){for(const select of host.querySelectorAll('select'))change(dom,select,select.options.at?.(-1)?.value??select.options[select.options.length-1].value);controller.setState({});}
  assert.equal(added,4);for(let i=0;i<5;i++)controller.update(input());assert.equal(added-removed,4);controller.dispose();assert.equal(added,removed);
});

test('alternate ownerDocument works without ambient window, and reset handles the owner realm',async()=>{
  const dom=new JSDOM('<!doctype html><body><iframe></iframe>'),frame=dom.window.document.querySelector('iframe'),doc=frame.contentDocument,form=doc.createElement('form'),host=doc.createElement('div');doc.body.append(form);form.append(host);
  const controller=mount(host,single(1)),select=host.querySelector('select');select.value='credit';select.dispatchEvent(new frame.contentWindow.Event('change'));assert.equal(visible(host).length,2);form.reset();await flush();assert.equal(select.value,'');assert.equal(visible(host).length,4);controller.dispose();
});

test('compiler is deterministic and preserves synthetic provenance without data mutation',async()=>{
  const spec=input(),before=structuredClone(spec);const a=await compileHtml(spec),b=await compileHtml(spec);assert.equal(a,b);assert.match(a,/Inform UI original synthetic ledger fixture/);assert.match(a,/sha256-/);assert.deepEqual(spec,before);
});

test('finance domain subsets close over both ledger nodes, base alone excludes them',async()=>{
  const compile=schema=>new Ajv2020({strict:true}).compile(schema);
  for(const path of ['finance.schema.json','nodes/finance.schema.json']){
    const schema=JSON.parse(await readFile(new URL('../src/schema/fragments/'+path,import.meta.url))),validate=compile(schema);
    for(const node of fixture.body)assert.equal(validate(path.startsWith('nodes/')?node:{version:'iui/1',body:[node]}),true,JSON.stringify(validate.errors));
  }
  const base=compile(JSON.parse(await readFile(new URL('../src/schema/fragments/base.schema.json',import.meta.url))));assert.equal(base(single()).valueOf(),false);
});

const invalidStructural = [
  ['accounts missing amount',0,n=>delete n.accounts[0].amount],['negative amount',0,n=>n.accounts[0].amount=-.01],['amount above bound',0,n=>n.accounts[0].amount=1e12+1],
  ['numeric string',0,n=>n.accounts[0].amount='123'],['currency lowercase',0,n=>n.accounts[0].currency='usd'],['currency too long',0,n=>n.accounts[0].currency='USDT'],
  ['currency non-ascii',0,n=>n.accounts[0].currency='ＵＳＤ'],['amount reference',0,n=>n.accounts[0].amount={$:'amount'}],['unknown account field',0,n=>n.accounts[0].apiKey='no'],
  ['too many accounts',0,n=>n.accounts=Array.from({length:41},(_,i)=>({...n.accounts[0],id:'a'+i}))],['too long note',0,n=>n.accounts[0].note='x'.repeat(2001)],
  ['transaction null amount',1,n=>n.transactions[0].amount=null],['transaction negative amount',1,n=>n.transactions[0].amount=-1],['missing direction',1,n=>delete n.transactions[0].direction],
  ['direction unknown',1,n=>n.transactions[0].direction='refund'],['status unknown',1,n=>n.transactions[0].status='settled'],['date year below bound',1,n=>n.transactions[0].date='0999-01-01'],
  ['date timestamp',1,n=>n.transactions[0].date='2026-10-09T00:00:00Z'],['formatted amount',1,n=>n.transactions[0].amount='1,000 USD'],
  ['too many transactions',1,n=>n.transactions=Array.from({length:101},(_,i)=>({...n.transactions[0],id:'t'+i}))],['state bind',1,n=>n.bind='transactions'],
  ['host action',1,n=>n.action='pay'],['remote endpoint',1,n=>n.endpoint='https://example.org/ledger'],['source unknown field',0,n=>n.source.synthetic=true],
];
for(const [name,index,mutate] of invalidStructural)test(`structural negative: ${name}`,()=>{
  const spec=single(index,mutate);assert.equal(validateDocument(spec).ok,false);assert.equal(browserValidate(spec).ok,false);assert.throws(()=>setup(spec));
});
for(const [name,index,mutate,code,path] of [
  ['duplicate account id',0,n=>n.accounts[1].id=n.accounts[0].id,'LEDGER_ID','/body/0/accounts/1/id'],
  ['duplicate transaction id',1,n=>n.transactions[1].id=n.transactions[0].id,'LEDGER_ID','/body/0/transactions/1/id'],
  ['invalid leap day',1,n=>n.transactions[0].date='2025-02-29','LEDGER_DATE','/body/0/transactions/0/date'],
  ['overflowed date',1,n=>n.transactions[0].date='2026-04-31','LEDGER_DATE','/body/0/transactions/0/date'],
  ['impossible month',1,n=>n.transactions[0].date='2026-13-01','LEDGER_DATE','/body/0/transactions/0/date'],
  ...['javascript:alert(1)','data:text/plain,foo','file:///tmp/a','mailto:a@example.org','/local','#fragment','https://u:p@example.org/'].map(url=>['unsafe source '+url,0,n=>n.source.url=url,'UNSAFE_URL','/body/0/source/url']),
])test(`semantic negative: ${name}`,async()=>{
  const spec=single(index,mutate),result=validateDocument(spec);assert.equal(result.ok,false);assert.ok(result.issues.some(issue=>issue.code===code&&issue.path===path),JSON.stringify(result));assert.equal(browserValidate(spec).ok,false);assert.throws(()=>setup(spec));await assert.rejects(compileHtml(spec));
});
test('all nonfinite number inputs are rejected, valid leap/year boundaries and unverified uppercase display code are accepted',()=>{
  for(const amount of [NaN,Infinity,-Infinity])for(const index of [0,1])assert.equal(validateDocument(single(index,n=>{(index?n.transactions:n.accounts)[0].amount=amount;})).ok,false);
  for(const date of ['1000-01-01','2000-02-29','2024-02-29','9999-12-31'])assert.equal(validateDocument(single(1,n=>{n.transactions[0].date=date;n.transactions[0].currency='XXX';})).ok,true);
});

test('ledger source contract and currency reject missing URLs and newline codes',()=>{for(const index of [0,1]){assert.equal(validateDocument(single(index,n=>{n.source={label:'Source'};})).ok,false);assert.equal(validateDocument(single(index,n=>{(n.accounts??n.transactions)[0].currency='USD\n';})).ok,false);}});
test('inert ledger ancestors block forged filters and resets',()=>{const {root,dom,controller}=setup(single(1));const direction=root.querySelector('select');change(dom,direction,'credit');root.setAttribute('inert','');change(dom,direction,'debit');assert.equal(direction.value,'credit');root.querySelector('button').dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(direction.value,'credit');root.removeAttribute('inert');root.querySelector('button').click();assert.equal(direction.value,'');controller.dispose();});

test('inert outer reset and a newer selection cannot be overwritten by queued reset',async()=>{const {host,root,dom,controller}=setup(single(1)),form=dom.window.document.createElement('form');host.replaceWith(form);form.append(host);const direction=root.querySelector('select');change(dom,direction,'credit');root.setAttribute('inert','');form.reset();await flush();assert.equal(direction.value,'credit');root.removeAttribute('inert');form.reset();change(dom,direction,'debit');await flush();assert.equal(direction.value,'debit');assert.equal(visible(root).length,2);controller.dispose();});
test('ledger native reset inside shadow trees restores filters and row visibility',async()=>{const dom=new JSDOM('<div id="shell"></div>'),shadow=dom.window.document.getElementById('shell').attachShadow({mode:'open'});shadow.innerHTML='<form><main></main></form>';const host=shadow.querySelector('main'),controller=mount(host,single(1)),root=host.querySelector('.iui-ledger'),direction=root.querySelector('select');change(dom,direction,'credit');assert.equal(visible(root).length,2);shadow.querySelector('form').reset();await flush();assert.equal(direction.value,'');assert.equal(visible(root).length,4);controller.dispose();dom.window.close();});
